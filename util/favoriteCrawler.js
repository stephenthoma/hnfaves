'use strict';
const request = require('./request.js');
const reportException = require('./util.js').reportException;
const API_BASE_URL ='https://hacker-news.firebaseio.com/v0/';
const Redis = require( 'redis' ).createClient( 6379, process.env.REDIS_IP || '127.0.0.1' ).on( 'error', reportException );

module.exports = {
    getUsers,
    storeUser,
    getFavorites,
    getTopPosts
};

function getUsers( postId ) {
    return new Promise( ( resolve, reject ) => {
        getUsersHelper( postId, [], {}, function( error, users ) {
            if ( error !== null ) {
                reject( error );
            } else {
                resolve( users );
            }
        });
    });
}

function getUsersHelper( postId, queue, users, callback ) {
    getPostInfo( postId ).then( ( post ) => {
        users[ post.by ] = true;
        queue.push.apply( queue, post.kids );
    }).catch( ( error )  => {
        callback( error, null );
    }).then( () => {
        if( queue.length === 0 ) {
            callback( null, users );
        } else {
            let nextPostId = queue.shift();
            getUsersHelper( nextPostId, queue, users, callback );
        }
    });
}

function storeUser( user, favorites ) {
    // TODO: User a set instead of stringifying
    getUserRedis( user ).then( ( redisUser ) => {
        if ( redisUser !== null ) {
            favorites.push.apply( favorites, JSON.parse( redisUser.favorites ) );
            favorites = favorites.filter( (elem, pos) => {
                    return favorites.indexOf( elem ) == pos;
            });
        }
        Redis.hset( [ `user:${user}`, 'favorites',  JSON.stringify(favorites) ] );
    });
}

function getUserRedis( user ) {
     // Checks Redis for user. Returns user if exists, otherwise undefined
    return new Promise( ( resolve, reject ) => {
        Redis.hgetall( [ `user:${user}` ], function( error, response ) {
            if ( error !== null ) {
                reject( error );
            } else {
                resolve( response );
            }
        });
    });
}

function getPostInfo( postID ) {
    return new Promise( ( resolve, reject ) => {
        try {
            getItem( 'item', postID ).then( ( resItem ) => {
                let item = {};
                if ( resItem && resItem.by && resItem.by !== undefined ) {
                    item.id = postID;
                    item.by = resItem.by;
                    if ( resItem.kids && resItem.kids !== undefined ) {
                        item.kids = resItem.kids;
                    }
                    resolve( item );
                } else {
                    if ( resItem.deleted === true ) { // Better way of handling this case?
                        item.id = -1;
                        item.kids = [];
                        item.by = 'deleted';
                        resolve( item );
                    } else {
                        reject( 'Failed to retrieve item' );
                    }
                }
            });
        } catch( error ) {
            reject( error );
        }
    });
}

function getFavorites( userID ) {
    return new Promise( ( resolve, reject ) => {
        let promiseArray = [];
        const STORY_REGEX = /<tr class='athing' id='([0-9]+)'/g;
        for ( let page in [...Array(2).keys()] ) { // Only get two pages of favorites (60 favorites)
            promiseArray.push( request( `https://news.ycombinator.com/favorites?id=${userID}&p=${+page + 1}` ) );
        }
        Promise.all( promiseArray ).then( pages => {
            let favorites = pages.map( ( page ) => {
                let matchArr;
                let pageFavorites = [];
                while ( ( matchArr = STORY_REGEX.exec( page ) ) !== null ) {
                    pageFavorites.push( matchArr[1] );
                }
                return pageFavorites;
            });
            resolve( [].concat.apply( [], favorites ) ); // Flatten favorites arrays
        }).catch( ( error ) => reject( error ) );
    });
}

function getItem( type, itemID ) {
    // Accepts types of: item (story), and user
    return new Promise( ( resolve, reject ) => {
        request( `${API_BASE_URL}${type}/${itemID}.json` ).then( ( response ) => {
            resolve( JSON.parse( response ) );
        }).catch( ( error ) => reject( error ) );
    });
}

function getTopPosts( numPosts ) {
    return new Promise( ( resolve, reject ) => {
        request( `${API_BASE_URL}topstories.json` ).then( ( response ) => {
            resolve( JSON.parse( response ).slice( 0, numPosts ) );
        }).catch( ( error ) => reject( error ) );
    });
}
//getTopPosts( 400 ).then( ( posts ) => console.log( 'POSTS: ', posts ) );
//getItem( 'item', '1' ).then( ( item ) => console.log( 'ITEM: ', item ) );
//getFavorites( 'patio11' ).then( ( favorites ) => console.log( 'FAVORITES: ', favorites ) );
//getUsersHelper( '1', [], [], function( error, res ) { console.log( 'USER HELPER: ', res ) });
//getUsers( '14479074' ).then( ( users ) => console.log( 'USERS: ', users) );
