/**
 * Licensed to Neo Technology under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Neo Technology licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* Cypher Console
 * Adds live cypher console feature to a page.
 */

function resetConsole() {
    console.log("cleaning db");
    $('iframe.cypherdoc-console')[0].contentWindow.postMessage('START n=node(*) MATCH n-[r?]-m WITH n, r DELETE n, r;', '*');
}

function createCypherConsoles($) {
    var currentButton;
    var URL_BASE = "http://console-test.neo4j.org/";
    var REQUEST_BASE = URL_BASE + "?";

    $('pre>code').wrap('<div class="query-wrapper" />').each(function () {
        var pre = $(this);
        pre.parent().data('query', pre.text());
    });

    $('p.cypherdoc-console').first().each(function () {
        var context = $(this);
        var url = getUrl("none", "none", "\n\nClick the play buttons to run the queries!");
        var iframe = $("<iframe/>").attr("id", "cypherdoc-console").addClass("cypherdoc-console").attr("src", url);
        context.append(iframe);
        context.height(iframe.height());
        var button = $('<button class="run-query" title="Execute query"><i class="icon-play"></i> </button>');
        var clean = $('<button class="clean-query" title="Clean db"><i class="icon-remove"></i> </button>');
        $('div.query-wrapper').append(button.clone().click(function () {
            var query = $(this).parent().data('query');
            $('iframe.cypherdoc-console')[0].contentWindow.postMessage(query, '*');
        }));
        $('div.query-wrapper').append(clean.clone().click(function () {
            resetConsole();
        }));
        $window = $(window);
        $window.scroll(function () {
            if ($window.scrollTop() > 150) {
                iframe.css('position', 'fixed');
            }
            else {
                iframe.css('position', 'static');
            }
        });
    });


    function getUrl(database, command, message) {
        var url = REQUEST_BASE;
        if (database !== undefined) {
            url += "init=" + encodeURIComponent(database);
        }
        if (command !== undefined) {
            url += "&query=" + encodeURIComponent(command);
        }
        if (message !== undefined) {
            url += "&message=" + encodeURIComponent(message);
        }
        if (window.neo4jVersion != undefined) {
            url += "&version=" + encodeURIComponent(neo4jVersion);
        }
        return url + "&no_root=true";
    }
}