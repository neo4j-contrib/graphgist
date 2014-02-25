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

function initSocial() {
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

(function(d, t, e, m){
    // Async Rating-Widget initialization.
    window.RW_Async_Init = function(){
        RW.init({
            huid: "159749",
            uid: "b237436c0f337413a9d814a338402305",
            source: "website",
            options: {
                "advanced": {
                    "layout": {
                        "align": {
                            "hor": "center",
                            "ver": "top"
                        }
                    }
                },
                "size": "tiny",
                "style": "quartz"
            }
        });
        RW.render();
    };

    // Append Rating-Widget JavaScript library.
    var rw, s = d.getElementsByTagName(e)[0], id = "rw-js",
        l = d.location, ck = "Y" + t.getFullYear() +
            "M" + t.getMonth() + "D" + t.getDate(), p = l.protocol,
        f = (-1 < l.search.indexOf("DBG=") ? "" : ".min"),
        a = ("https:" == p ? "secure." + m + "js/" : "js." + m);
    if (d.getElementById(id)) return;
    rw = d.createElement(e);
    rw.id = id; rw.async = true; rw.type = "text/javascript";
    rw.src = p + "//" + a + "external" + f + ".js?ck=" + ck;
    s.parentNode.insertBefore(rw, s);
}(document, new Date(), "script", "rating-widget.com/"));

}