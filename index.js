'use strict';
const fs = require( 'fs' );
const util = require('./util/util.js');
const Redis = require( 'redis' ).createClient( 6379, process.env.REDIS_IP || '127.0.0.1' ).on( 'error', util.reportException );

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
    util.reportLog({
        message:
        res.statusCode + ' ' +
        req.method + ' ' +
        req.url
    });
}

function indexRequest( reqRes ) { // Used in development
    fs.readFile( __dirname + '/html/index.html', function( error, html ) {
        if ( error !== undefined ) {
            reqRes.res.statuscode = 500;
            reqRes.res.end();
            util.reportException( error );
        } else {
            reqRes.res.writeHeader( 200, {'Content-Type': 'text/html'} );
            reqRes.res.write( html );
            reqRes.res.end();
        }
    });
}

function moreRequest( reqRes ) {
    let startIdx = +reqRes.url.split('/more?count=')[1];
    startIdx = isNaN( startIdx ) ? 10 : startIdx;

    getItems( startIdx, 5, function( error, resItems ) {
        if ( error !== undefined ) {
            util.reportException( error );
        } else {
            reqRes.res.writeHeader(200, {'Content-Type': 'application/json'});
            reqRes.res.end( JSON.stringify( resItems ) );
        }
    });
}

function getItems( start, numItems, callback ) {
    Redis.SORT('sindex', 'by', '*->numFavoriters', 'limit', start.toString(), numItems.toString(), 'desc', 'get', '#', function( error, storyList ) {
        if ( error !== null ) {
            callback( error, null );
        }
        util.MHGETALL( storyList, function( error, storyArray ) {
            if ( error !== null ) {
                callback( error, null );
            }
            callback( null, storyArray );
        });
    });
}

require( 'http' )
    .createServer( onRequest )
    .listen( 8001 )
    .on( 'clientError', util.reportException );
