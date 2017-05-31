'use strict';
const fs = require('fs');
const pug = require('pug');
const util = require('./util.js');
const CronJob = require('cron').CronJob;
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
