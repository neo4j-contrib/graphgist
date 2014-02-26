function initDisqus($content) {
    $content.append('<div id="disqus_thread"></div>');
    var disqus_shortname = 'graphgist';

    var disqus_identifier = '/';
    var search = window.location.search;
    if (search && search.length > 1) {
        disqus_identifier = search.substr(1);
    }
    var disqus_title = document.title || 'Neo4j GraphGist';

    var disqus_url = window.location.href;
    /* * * DON'T EDIT BELOW THIS LINE * * */
    (function () {
        var dsq = document.createElement('script');
        dsq.type = 'text/javascript';
        dsq.async = true;
        dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
    })();
}

function share() {
    var title = document.title;
    var href = encodeURIComponent(window.location.href);
    var text = encodeURIComponent('Check this out: ' + title + " #neo4j #graphgist")
    var twitter_url = 'https://twitter.com/intent/tweet?text=' + text + '&url=' + href;
    $('#twitter-share-button').html('<a href="' + twitter_url + '" class="twitter-share-button" data-lang="en">Tweet</a>');
    twttr.widgets.load();
}

function initSocial(heading) {
(function () {
    var po = document.createElement('script');
    po.type = 'text/javascript';
    po.async = true;
    po.src = 'https://apis.google.com/js/platform.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(po, s);
})();

!function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (!d.getElementById(id)) {
        js = d.createElement(s);
        js.id = id;
        js.src = "https://platform.twitter.com/widgets.js";
        fjs.parentNode.insertBefore(js, fjs);
    }
}(document, "script", "twitter-wjs");

(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s);
    js.id = id;
    js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=442180952526716";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

var location = window.location.href;
var index = location.indexOf('#');
if ( index !== -1) {
    location = location.substr(0, index);
}
var uniqueId = window.location.search;
if (typeof uniqueId === 'undefined' || (!uniqueId) || uniqueId === '?') {
    uniqueId = 'graphgist-home';
}
PDRTJS_settings_7478426 = {
    "id" : "7478426",
    "unique_id" : uniqueId,
    "title" : heading,
    "permalink" : location
};

(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s);
    js.id = id;
    js.src = "http://i0.poll.fm/js/rating/rating.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'polldaddy-rating'));

}

