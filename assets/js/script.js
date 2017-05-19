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
    var count = document.getElementById('favorites-list').getElementsByTagName('li').length - 1;
    httpRequest.onreadystatechange = renderItems;
    httpRequest.open( 'GET', `http://localhost:8001/more?count=${count}` );
    httpRequest.send();
  }

  function renderItems() {
    if ( httpRequest.readyState === XMLHttpRequest.DONE && httpRequest.status === 200 ) {
      var listItem = ({ url, title, numFavoriters, commentId, numComments }) => `
        <li class="favorites-list-item">
          <a class="item-title" href=${url}> ${title}</a>
          <div class="item-meta">
            <span class="item-meta-favoriters"> Favorited by ${numFavoriters}</span>
            <span class="item-meta-bullet"> &bull;</span>
            <a class="item-meta-comments" href="https://news.ycombinator.com/item?id=${commentId}"> ${numComments} comments</a>
          </div>
        </li>
      `;
      var items = JSON.parse( httpRequest.responseText );
      document.getElementById( 'favorites-list' ).insertAdjacentHTML( 'beforeend' , items.map( listItem ).join( '' ));
    }
  }
})();
