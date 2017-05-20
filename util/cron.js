'use strict';
const fs = require('fs');
const pug = require('pug');
const CronJob = require('cron').CronJob;
const Redis = require( 'redis' ).createClient( 6379, process.env.REDIS_IP || 127.0.0.1 ).on( 'error', reportException );
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
}

function reportException( error ) {
  console.error( error );
}

function reportLog( message ) {
  console.log( message );
}

function compileIndex() {
  const compiledFunction = pug.compileFile( __dirname + '/../assets/html/index.pug' );
  getTopItems( 10, function( error, storyArray ) {
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
  Redis.SORT('sindex', 'by', 'story:*->numFavoriters', 'limit', '0', number.toString(), 'desc', 'get', '#', function( error, storyList ) {
    if ( error !== null ) {
      callback( error, null );
    }
    MHGETALL( storyList, function( error, storyArray ) {
      if ( error !== null ) {
        callback( error, null );
      }
      callback( null, storyArray );
    });
  });
}

function MHGETALL( keys, callback ) {
    const multi = Redis.multi();
    keys.forEach( function( key, index ) {
        multi.hgetall( key );
    });
    multi.exec( function( error, result ) {
        callback( error, result );
    });
}
