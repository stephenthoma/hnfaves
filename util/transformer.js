'use strict';
const Redis = require( 'redis' ).createClient().on( 'error', reportException );
const request = require('request');

const API_URL = 'https://hacker-news.firebaseio.com/v0/';

function reportException( error ) {
  console.error( error );
}

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
          return JSON.parse(favoriteArrStr[0])
        }).reduce( function( acc, favoriteArr ) {
          favoriteArr.forEach( function( favorite ) {
            acc[favorite] = acc[favorite] ? acc[favorite] + 1 : 1;
          })
          return acc;
        }, {} );
      for ( let favorite in favoriteCounts ) {
        lookupItem( favorite, function( error, item ) {
          if ( error !== null ) {
            reportException( error );
          } else {
            item.numFavoriters = favoriteCounts[favorite];
            Redis.HMSET( `story:${item.id}`, item );
            Redis.SADD( 'sindex', `story:${item.id}` );
          }
        });
      }
    });
  });
}

function lookupItem( itemId, callback ) {
  // TODO: refactor this
  request(`${API_URL}/item/${itemId}.json`, function( error, response, body ) {
    if ( error !== null ) {
      callback( error, null );
    } else {
      const item = {}
      body = JSON.parse( body );
      item.url = body.url || `https://news.ycombinator.com/item?id=${itemId}`;
      item.title = body.title;
      item.id = itemId;
      item.numComments = body.descendants;
      callback( null, item );
    }
  });
}
getItemCounts();
