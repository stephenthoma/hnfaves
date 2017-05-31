'use strict';
const fs = require('fs');
const pug = require('pug');
const util = require('./util.js');
const CronJob = require('cron').CronJob;
const favoriteCrawler = require('./favoriteCrawler.js');
const PRODUCTION = process.env.NODE_ENV === 'production';

if ( PRODUCTION === true ) {
    new CronJob({
        cronTime: '0 */5 * * * *',
        onTick: compileIndex,
        start: true,
        timeZone: 'Atlantic/Reykjavik'
    });
} else {
    getFavoritesFromTopPosts();
    //compileIndex();
}

function getFavoritesFromTopPosts() {
    favoriteCrawler.getTopPosts( 40 ).then( ( posts ) => {
        posts.map( ( post ) => {
           favoriteCrawler.getUsers( post, [], [] ).then( ( users ) => {
               console.log(users);
               users.map( ( user ) => {
                   favoriteCrawler.getFavorites( user ).then( ( favorites ) => {
                       console.log(favorites);
                   });
               });

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
