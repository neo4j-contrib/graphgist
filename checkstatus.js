var webpage = require('webpage'),
    page = webpage.create(),
    system = require('system'),
    url = system.args[1] || 'http://gist.neo4j.org',
    fs = require('fs');

var EVALUATING = /Executing queries/;

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

    var assertOk = function() {
        if (checkStatus().match(EVALUATING)) {
            console.log("waiting for 1 sec.");
            window.setTimeout(assertOk, 1000);
        } else {
            console.log("status: " + checkStatus());
            phantom.exit();
        }
    }
    render();
    assertOk();
}
;

page.open(url);