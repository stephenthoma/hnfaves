'use strict';
const Redis = require( 'redis' ).createClient( 6379, process.env.REDIS_IP || 127.0.0.1 ).on( 'error', reportException );
const fs = require( 'fs' );

function reportException( error ) {
  console.error( error );
}

function reportLog( message ) {
  console.log( message );
}

function onRequest( req, res ) {
    req.res = res;
    if ( req.url === '/' ) {
      indexRequest( req );
    } else if ( req.url.includes( '/more' ) === true ) {
      moreRequest( req );
    } else {
        if ( req.url !== '/healthcheck' ) {
            res.statusCode = 204;
        }
        res.end();
    }
    reportLog({
        message:
            res.statusCode + ' ' +
            req.method + ' ' +
            req.url
    });
}

function indexRequest( reqRes ) {
   //TODO: Better to store html in memory?
  fs.readFile( __dirname + '/html/index.html', function( err, html ) {
    if ( err ) {
      reqRes.res.statuscode = 500;
      reqRes.res.end();
      reportException( err );
    } else {
      reqRes.res.writeHeader( 200, {"Content-Type": "text/html"} );
      reqRes.res.write( html );
      reqRes.res.end();
    }
  });
}

function moreRequest( reqRes ) {
    let startIdx = +reqRes.url.split('/more?count=')[1];
    startIdx = isNaN( startIdx ) ? 20 : startIdx;
    const endIdx = startIdx + 5;

    getItems( startIdx, endIdx, function( error, resItems ) {
      reqRes.res.writeHeader(200, {"Content-Type": "application/json"});
      reqRes.res.end( JSON.stringify( resItems ) );
    });
}

function getItems( start, end, callback ) {
  Redis.SORT('sindex', 'by', 'story:*->numFavoriters', 'limit', start.toString(), end.toString(), 'desc', 'get', '#', function( error, storyList ) {
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

require( 'http' )
  .createServer( onRequest )
  .listen( 8001 )
  .on( 'clientError', reportException );
