'use strict';
const fs = require('fs');
const pug = require('pug');
const util = require('./util.js');
const CronJob = require('cron').CronJob;
const Bottleneck = require('bottleneck');
const favoriteCrawler = require('./favoriteCrawler.js');
const PRODUCTION = process.env.NODE_ENV === 'production';

if ( PRODUCTION === true ) {
    new CronJob({
        cronTime: '0 0 17 * * *',
        onTick: compileIndex,
        start: true,
        timeZone: 'America/Los_Angeles'
    });

    new CronJob({
        cronTime: '0 0 15 * * *',
        onTick: getFavoritesFromTopPosts,
        start: true,
        timeZone: 'America/Los_Angeles'
    });
} else {
    //getFavoritesFromTopPosts();
    compileIndex();
}

const MAX_CONCURRENT = 1;
const MIN_TIME = 30e3;
const limiter = new Bottleneck( MAX_CONCURRENT, MIN_TIME );
function getFavoritesFromTopPosts() {
    let favoritePromiseArray = [];
    favoriteCrawler.getTopPosts( 30 ).then( ( posts ) => {
        let postPromiseArray = posts.map( post => favoriteCrawler.getUsers( post ) );
        Promise.all( postPromiseArray ).then( ( users ) => {
            let dedupedUsers = {};
            for ( let user in users ) {
                Object.assign( dedupedUsers, users[user] );
            };
            dedupedUsers = Object.keys( dedupedUsers );
            dedupedUsers.map( ( user ) => {
                limiter.schedule( favoriteCrawler.getFavorites, user ).then( ( favorites ) => {
                    if ( favorites.length > 0 ) {
                        console.log( user, favorites );
                        favoriteCrawler.storeUser( user, favorites );
                    }
                }).catch( error => console.log( error ) );
           });
        });
    });
}

function compileIndex() {
    const compiledFunction = pug.compileFile( __dirname + '/../assets/html/index.pug' );
    util.getItems( 0, 10, function( error, storyArray ) {
        if ( error !== null ) {
            return util.reportException( error );
        }
        const outputHTML = compiledFunction( { items: storyArray } );
        fs.writeFile( __dirname + '/../assets/html/index.html', outputHTML, function( err ) {
            if( err ) {
                util.reportException( err );
            }
        });
    });
}
