var webpage = require('webpage'),
    page = webpage.create(),
    system = require('system'),
    url = system.args[1] || 'http://gist.neo4j.org',
    fs = require('fs');

page.onLoadFinished = function (status) {
//    var slideCount;

    if (status !== 'success') {
        console.log('Target file not found.');
        phantom.exit();
    }
    console.log('Target found.');

    page.viewportSize = {
        width: 1024,
        height: 768
    };
    var evaluating = "Executing queries ...";
    checkStatus = function () {
        var status = page.evaluate(function () {
            var $ = window.jQuery;
            return $('#status')[0].textContent;
        });
        return status;
    }

    var render = function () {
        console.log("rendering, status: " + checkStatus());
        var src = url.substr(url.lastIndexOf("/") + 1).replace(/\./g, "_").replace(/\?/g, "") + '.png';
        page.render(src);
        console.log('Rendered page to ' + src);
    }

    console.log("status: " + checkStatus());
    if (checkStatus() == evaluating) {
        console.log("waiting for 1 sec.");
        window.setTimeout(render, 1000);
    } else {
        render();
    }
    phantom.exit();
}
;

page.open(url);