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
    var count = document.getElementById('favorites-list').getElementsByTagName('li').length;
    httpRequest.onreadystatechange = renderItems;
    httpRequest.open( 'GET', `/more?count=${count}` );
    httpRequest.send();
  }

  function renderItems() {
    if ( httpRequest.readyState === XMLHttpRequest.DONE && httpRequest.status === 200 ) {
      var listItem = ({ url, title, numFavoriters, id, numComments }) => `
        <li class="favorites-list-item">
          <a class="item-title" href=${url}> ${title}</a>
          <div class="item-meta">
            <span class="item-meta-favoriters"> Favorited by ${numFavoriters}</span>
            <span class="item-meta-bullet"> &bull;</span>
            <a class="item-meta-comments" href="https://news.ycombinator.com/item?id=${id}"> ${numComments} comments</a>
          </div>
        </li>
      `;
      var items = JSON.parse( httpRequest.responseText );
      document.getElementById( 'favorites-list' ).insertAdjacentHTML( 'beforeend' , items.map( listItem ).join( '' ));
    }
  }
})();

var muddle = (function() {
    var self = {};

    window.addEventListener('load', function() {
        ['muddle-overlay'].map(function(elementClass) {
            document.getElementsByClassName(elementClass)[0].onclick = function() {
                self.close();
            };
        });
    });

    self.open = function(modal_id) {
        muddle.close();

        var modal = document.getElementById(modal_id);
        modal.classList.add('md-active');
        document.body.classList.add('md-active');
    };

    self.close = function() {
        var modal = document.getElementsByClassName('md-active')[1];
        if (modal !== undefined) {
            modal.classList.remove('md-active');
            document.body.classList.remove('md-active');
        }
    };

    return self;
}());

document.getElementById('about').addEventListener('click', function() {
    muddle.open('about-modal');
});
