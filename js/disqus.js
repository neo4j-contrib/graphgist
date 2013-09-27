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
    console.log(disqus_identifier, disqus_title);
    /* * * DON'T EDIT BELOW THIS LINE * * */
    (function () {
        var dsq = document.createElement('script');
        dsq.type = 'text/javascript';
        dsq.async = true;
        dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
    })();
}
