(function() {
  var httpRequest;
  document.getElementById( 'more-items-button' ).addEventListener( 'click' , function( event ) {
    event.preventDefault();
    getAndRenderItems();
  });

  function getAndRenderItems() {
    httpRequest = new XMLHttpRequest();

    if ( httpRequest === undefined ) {
      return;
    }
    httpRequest.onreadystatechange = renderItems;
    httpRequest.open( 'GET', 'http://localhost:8001/more' );
    httpRequest.send();
  }

  function renderItems() {
    if ( httpRequest.readyState === XMLHttpRequest.DONE && httpRequest.status === 200 ) {
      const listItem = ({ url, title, numFavoriters, commentUrl, numComments }) => `
        <li class="favorites-list-item">
          <a class="item-title" href=${url}> ${title}</a>
          <div class="item-meta">
            <span class="item-meta-favoriters"> Favorited by ${numFavoriters}</span>
            <span class="item-meta-bullet"> &bull;</span>
            <a class="item-meta-comments" href=${commentUrl}> ${numComments} comments</a>
          </div>
        </li>
      `;
      const items = JSON.parse( httpRequest.responseText );
      document.getElementById( 'favorites-list' ).insertAdjacentHTML( 'beforeend' , items.map( listItem ).join( '' ));
    }
  }
})();
