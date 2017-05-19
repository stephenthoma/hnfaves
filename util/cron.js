'use strict';
const CronJob = require('cron').CronJob;
const pug = require('pug');
const Redis = require( 'redis' ).createClient().on( 'error', reportException );
const fs = require('fs');
const PRODUCTION = process.env.NODE_ENV === 'production';

if ( PRODUCTION === true ) {
  new CronJob({
    cronTime: '0 */5 * * * *',
    onTick: compileIndex,
    start: true,
    timeZone: 'Atlantic/Reykjavik'
  });
} else {
  compileIndex();
  //getTopItems( 10, function( error, res ) {
    //console.log(error, res);
  //});
  //MHGETALL(['story:1', 'story:2'], function( error, result ) {
    //console.log( error, result );
  //});
}

function reportException( error ) {
  console.error( error );
}

function reportLog( message ) {
  console.log( message );
}


function compileIndex() {
  const compiledFunction = pug.compileFile( __dirname + '/../assets/html/index.pug' );
  getTopItems( 20, function( error, storyArray ) {
    if ( error !== null ) {
      return reportException( error );
    }
    const outputHTML = compiledFunction( { items: storyArray } );
    fs.writeFile( __dirname + '/../assets/html/index.html', outputHTML, function( err ) {
      if( err ) {
        reportException( err );
      }
    });
  });
}

function getTopItems( number, callback ) {
  //Redis.sort('sindex BY *->numFavoriters desc', function( error, storyList ) {
    //callback( error, storyList );
    //if ( error !== null ) {
      //callback( error, null );
    //}
    //MHGETALL( storyList, function( error, storyArray ) {
      //if ( error !== null ) {
        //callback( error, null );
      //}
      //callback( null, storyArray );
    //});
  //});

    let a = {
      1: {
        favoriters: ['a', 'b', 'c'],
        numComments: 10,
        numFavoriters: 5,
        title: 'Redis is bestest',
        url: 'www.google.com',
        commentUrl: 'www.news.ycombinator.com'
      },
      2: {
        favoriters: ['a', 'b', 'c'],
        numComments: 0,
        numFavoriters: 7,
        title: 'Redis is worst',
        url: 'www.google.com',
        commentUrl: 'www.news.ycombinator.com'
      }
    };
    callback( null, a );
}

function MHGETALL( keys, callback ) {
    const pipeline = Redis.pipeline();

    keys.forEach( function( key, index ) {
        pipeline.hgetall( key );
    });

    pipeline.exec( function( err, result ) {
        callback( err, result );
    });
}
