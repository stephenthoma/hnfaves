'use strict';
const Redis = require( 'redis' ).createClient( 6379, process.env.REDIS_IP || '127.0.0.1' ).on( 'error', reportException );

module.exports = {
    reportException,
    reportLog,
    MHGETALL
};

function reportException( error ) {
    console.error( error );
}

function reportLog( message ) {
    console.log( message );
}

function MHGETALL( keys, callback ) {
    const multi = Redis.multi();
    keys.forEach( function( key ) {
        multi.hgetall( key );
    });
    multi.exec( function( error, result ) {
        callback( error, result );
    });
}
