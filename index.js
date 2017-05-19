const Redis = require( 'redis' ).createClient().on( 'error', reportException );
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
    } else if ( req.url === '/more' ) {
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
    const resItems = [
      {
        numComments: 10,
        numFavoriters: 5,
        title: 'Redis is bestest',
        url: 'www.google.com',
        commentUrl: 'www.news.ycombinator.com'
      },
      {
        numComments: 0,
        numFavoriters: 7,
        title: 'Redis is worst',
        url: 'www.google.com',
        commentUrl: 'www.news.ycombinator.com'
      }
    ];
    reqRes.res.writeHeader(200, {"Content-Type": "application/json"});
    reqRes.res.end( JSON.stringify( resItems ) );
}

require( 'http' )
  .createServer( onRequest )
  .listen( process.env.NODE_ENV === 'development'? 8001 : 80 )
  .on( 'clientError', reportException );
