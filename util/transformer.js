'use strict';
const Redis = require( 'redis' ).createClient().on( 'error', reportException );
const request = require('./request.js');

const API_URL = 'https://hacker-news.firebaseio.com/v0/';
const ITEM_URL = 'https://news.ycombinator.com/item?id=';

function getItemCounts() {
    Redis.keys( 'users:*', function( error, userKeyList ) {
        if ( error !== null ) {
            reportException( error );
        }
        for ( let i = 0, j = userKeyList.length; i < j; i++ ) {
            userKeyList[i] = [ 'HMGET', userKeyList[i], 'favorites' ];
        }
        Redis.multi( userKeyList ).exec( function( error, userFavorites ) {
            if ( error !== null ) {
                return reportException( error );
            }
            // TODO: refactor this
            const favoriteCounts = userFavorites.map( function( favoriteArrStr ) {
                return JSON.parse( favoriteArrStr[0].replace( /u|'/g,'' ) ); // Relics of Python unicode
            }).reduce( function( acc, favoriteArr ) {
                favoriteArr.forEach( function( favorite ) {
                    acc[favorite] = acc[favorite] ? acc[favorite] + 1 : 1;
                });
                return acc;
            }, {} );
            let promiseArr = Object.keys( favoriteCounts ).map( favorite => lookupItem( favorite ) );
            Promise.all( promiseArr ).then( items => {
                items.map( item => {
                    item.numFavoriters = favoriteCounts[ item.id ];
                    Redis.HMSET( `story:${item.id}`, item );
                    Redis.SADD( 'sindex', `story:${item.id}` );
                });
            }).catch( ( error ) => reportException( error ) );
        });
    });
}

function lookupItem( itemId ) {
    return new Promise( ( resolve, reject ) => {
        request(`${API_URL}/item/${itemId}.json` ).then( ( response ) => {
            const body = JSON.parse( response );
            resolve({
                id: itemId,
                url: body.url || ITEM_URL + itemId, // Self posts don't have url
                title: body.title,
                numComments: body.descendants
            });
        }).catch( ( error ) => reject( error ) );
    });
}

function reportException( error ) {
    console.error( error );
}

getItemCounts();
