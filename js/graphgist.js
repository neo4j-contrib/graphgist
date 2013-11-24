/**
 * Licensed to Neo Technology under one or more contributor license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership. Neo Technology licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You
 * may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

'use strict';

GraphGist(jQuery);

function GraphGist($) {
    var HAS_ERRORS = false;
    var $WRAPPER = $('<div class="query-wrapper" />');
    var COLLAPSE_ICON = 'icon-minus-sign-alt';
    var EXPAND_ICON = 'icon-plus-sign-alt';
    var $QUERY_OK_LABEL = $('<span class="label label-success query-info">Test run OK</span>');
    var $QUERY_ERROR_LABEL = $('<span class="label label-important query-info">Test run Error</span>');
    var $TOGGLE_BUTTON = $('<span data-toggle="tooltip"><i class="' + COLLAPSE_ICON + '"></i></span>');
    var $QUERY_TOGGLE_BUTTON = $TOGGLE_BUTTON.clone().addClass('query-toggle').attr('title', 'Show/hide query.');
    var $RESULT_TOGGLE_BUTTON = $TOGGLE_BUTTON.clone().addClass('result-toggle').attr('title', 'Show/hide result.');
    var $QUERY_MESSAGE = $('<pre/>').addClass('query-message');
    var $VISUALIZATION = $('<div/>').addClass('visualization');
    var $TABLE_CONTAINER = $('<div/>').addClass('result-table');
    var ASCIIDOCTOR_OPTIONS = Opal.hash('attributes', [ 'notitle!' ], 'attribute-missing','drop');
    var DEFAULT_SOURCE = 'github-neo4j-contrib%2Fgists%2F%2Fmeta%2FHome.adoc';

    var $content = undefined;
    var $gistId = undefined;
    var consolr = undefined;
    var statements = [];

    $(document).ready(function () {
//        console.log("graphgist doc ready")
        window.addEventListener("message", handleMessage);
        $content = $('#content');
        $gistId = $('#gist-id');
        var gist = new Gist($, $content);
        gist.getGistAndRenderPage(renderContent, DEFAULT_SOURCE);
        postProcess();
        $gistId.keydown(gist.readSourceId);
    });

    function postProcess() {
        $("#tell-me-more").attr('href', 'mailto:info@neotechnology.com?Subject=[Graphgist] More%20info%20about%20' + window.location);
    }
    function handleMessage(e) {
        var source = e.source;
        console.log("Livegraph received Message", e, source);
        var msg = e.data;
        if (msg == "queries") {
            console.log('posting', statements);
            source.postMessage("message", ['match (n) return n']);
        }
    }

    function renderContent(originalContent, link, imagesdir) {
        $('#gist_link').attr('href', link).removeClass('disabled');
        var doc = preProcessContents(originalContent);
        $content.empty();
        if (imagesdir) {
            //ASCIIDOCTOR_OPTIONS = Opal.hash('attributes', [ 'notitle!', 'imagesdir=' + imagesdir ]);
        }
        var generatedHtml = undefined;
        try {
            generatedHtml = Opal.Asciidoctor.$render(doc, ASCIIDOCTOR_OPTIONS);
        }
        catch (e) {
            errorMessage(e.name + ':' + '<p>' + e.message + '</p>');
            return;
        }
        $content.html(generatedHtml);
        postProcessPage();
        CypherConsole({}, function (conslr) {
            consolr = conslr;
            executeQueries(function () {
                initConsole(function () {
                    renderGraphs();
                    renderTables();
                    hideConsole()
                    postProcessRendering();
                    if ('initDisqus' in window) {
                        initDisqus($content);
                    }
                });
            });
        });
    }

    function hideConsole() {
        var $TOGGLE_CONSOLE_HIDE_BUTTON = $('<a class="btn btn-small show-console-toggle" data-toggle="tooltip"  title="Show or hide a Neo4j Console in order to try the examples in the GraphGist live."><i class="icon-chevron-down"></i> Show/Hide Live Console</a>');
        var consolewrapper = $(".console");
        console.log("1", consolewrapper.is(':visible'), consolewrapper);
        var $toggleConsoleShowButton = $TOGGLE_CONSOLE_HIDE_BUTTON.clone();
        $toggleConsoleShowButton.click(function () {
            console.log("click", consolewrapper.is(':visible'), consolewrapper);
            if (consolewrapper.is(':visible')) {
                consolewrapper.hide();
            } else {
                consolewrapper.show();
            }
        });
        $toggleConsoleShowButton.insertBefore(consolewrapper);
        if (consolewrapper.hasClass("hidden")) {
            consolewrapper.removeClass("hidden");
            consolewrapper.hide();
        }
    }

    function postProcessRendering() {
        $('span[data-toggle="tooltip"]').tooltip({'placement': 'left'});
        $('a.run-query,a.edit-query,a.show-console-toggle').tooltip({'placement': 'right'});
        $('.tooltip-below').tooltip({'placement': 'bottom'});
        var status = $("#status");
        if (HAS_ERRORS) {
            status.text("Errors.");
            status.addClass("label-important");
        } else {
            status.text("No Errors.");
            status.addClass("label-success");
        }
    }

    function share() {
        var title = document.title;
        var href = encodeURIComponent(window.location.href);
        $('#twitter-share').attr(
            'href',
            'https://twitter.com/intent/tweet?text=' + encodeURIComponent('Check this out: ' + title) + '&url=' + href);
        $('#facebook-share').attr(
            'href',
            'http://www.facebook.com/share.php?u=' + href);
        $('#google-plus-share').attr(
            'href',
            'https://plus.google.com/share?url=' + href);
    }

    function preProcessContents(content) {
        var sanitized = content
            .replace(
                /^\/\/\s*?console/m,
                '++++\n<p class="console"><span class="loading"><i class="icon-cogs"></i> Running queries, preparing the console!</span></p>\n++++\n');
        sanitized = sanitized.replace(/^\/\/\s*?hide/gm, '++++\n<span class="hide-query"></span>\n++++\n');
        sanitized = sanitized.replace(/^\/\/\s*?setup/m, '++++\n<span id="setup-query"></span>\n++++\n');
        sanitized = sanitized.replace(/^\/\/\s*?graph.*/gm, '++++\n<h5 class="graph-visualization"></h5>\n++++\n');
        sanitized = sanitized.replace(/^\/\/\s*?output.*/gm, '++++\n<span class="query-output"></span>\n++++\n');
        sanitized = sanitized.replace(/^\/\/\s*?table.*/gm, '++++\n<h5 class="result-table"></h5>\n++++\n');
        sanitized += '\n++++\n<span class="meta" author="{author}" version="{neo4j-version}" twitter="{twitter}"></span>\n';
        sanitized += '<span class="meta" tags="{tags}"></span>\n++++\n';
        return sanitized;
    }

    var processMathJAX = function () {
        MathJax.Hub.Typeset();
    };


    function postProcessPage() {
        var $meta = $("span.meta",$content);
        var version = $meta.attr("version") || DEFAULT_VERSION;
        CONSOLE_URL_BASE=CONSOLE_VERSIONS[version];
        if ($meta.attr("tags")) {
            $("footer").prepend('Tags <em>'+$meta.attr("tags")+'</a> ');
        }
        if ($meta.attr("author")) {
            var twitter=$meta.attr("twitter").replace("@","");
            $("footer").prepend('<i class="icon-twitter-sign"></i> Author <a target="_blank" href="http://twitter.com/'+twitter+'">'+$meta.attr("author")+'</a> ');
        }
        $("footer").prepend('Uses Neo4j Version <a target="_blank" href="http://docs.neo4j.org/chunked/'+version+'/cypher-query-lang.html">'+version+'</a> ');
        $("h2[id]").css({cursor:"pointer"}).click(function(){ window.location.href = window.location.href.replace(/($|#.+?$)/,"#"+$(this).attr("id")) });
    
        processMathJAX();
        findQuery('span.hide-query', $content, function (codeElement) {
            $(codeElement.parentNode).addClass('hide-query');
        });
        findQuery('#setup-query', $content, function (codeElement) {
            $(codeElement.parentNode).addClass('setup-query');
        });
        findQuery('span.query-output', $content, function (codeElement) {
            $(codeElement.parentNode).data('show-output', true);
        });
        $('code.cypher', $content).each(function (index, el) {
            var number = ( index + 1 );
            var $el = $(el);
            var $parent = $el.parent();
            $el.attr('class', 'brush: cypher');
            $parent.prepend('<h5>Query ' + number + '</h5>');
            $el.wrap($WRAPPER).each(function () {
                $el.parent().data('query', $el.text());
            });
            var $toggleQuery = $QUERY_TOGGLE_BUTTON.clone();
            $parent.append($toggleQuery);
            $toggleQuery.click(function () {
                var $icon = $('i', this);
                var $queryWrapper = $icon.parent().prevAll('div.query-wrapper').first();
                var action = toggler($queryWrapper, this);
                if (action === 'hide') {
                    var $queryMessage = $queryWrapper.nextAll('pre.query-message').first();
                    $icon = $queryWrapper.nextAll('span.result-toggle').first();
                    toggler($queryMessage, $icon, 'hide');
                }
            });
            if ($parent.hasClass('hide-query')) {
                var $wrapper = $toggleQuery.prevAll('div.query-wrapper').first();
                toggler($wrapper, $toggleQuery, 'hide');
            }
        });

        SyntaxHighlighter.config['tagName'] = 'code';
        SyntaxHighlighter.defaults['tab-size'] = 4;
        SyntaxHighlighter.defaults['gutter'] = false;
        SyntaxHighlighter.defaults['toolbar'] = false;
        SyntaxHighlighter.highlight();

        $('table').addClass('table'); // bootstrap formatting

        var heading = $('h1').first();
        if (!heading.length) {
            heading = $('h2').first();
        }
        if (heading.length) {
            document.title = heading.text() + "  -  Neo4j GraphGist";
        }

        share();

    }

    function initConsole(callback) {
        var query = getSetupQuery();
        consolr.init({
            'init': 'none',
            'query': query || 'none',
            'message': 'none',
            'no_root': true
        }, success);

        function success(data) {
            consolr.input('');
            if (callback) {
                callback();
            }
        }

        function error(data) {
            HAS_ERRORS = true;
            console.log('Error during INIT: ', data);
        }
    }

    function executeQueries(callbackAfter) {
        var $wrappers = [];
        var receivedResults = 0;
        $('div.query-wrapper').each(function (index, element) {
            var $wrapper = $(element);
            var number = index + 1;
            $wrapper.data('number', number);
            var statement = $wrapper.data('query');
            statements.push(statement);
            $wrappers.push($wrapper);
        });
        consolr.query(statements, success, error);

        function success(data, resultNo) {
            receivedResults++;
            var $wrapper = $wrappers[resultNo];
            var showOutput = $wrapper.parent().data('show-output');
            createQueryResultButton($QUERY_OK_LABEL, $wrapper, data.result, !showOutput);
            $wrapper.data('visualization', data['visualization']);
            $wrapper.data('data', data);
            if (callbackAfter && receivedResults === statements.length) {
                callbackAfter();
            }
        }

        function error(data, resultNo) {
            HAS_ERRORS = true;
            receivedResults++;
            var $wrapper = $wrappers[resultNo];
            createQueryResultButton($QUERY_ERROR_LABEL, $wrapper, data.error, false);
            if (callbackAfter && receivedResults === statements.length) {
                callbackAfter();
            }
        }
    }

    function getSetupQuery() {
        var query = undefined;
        $('#content pre.highlight.setup-query').first().children('div.query-wrapper').first().each(function () {
            var $wrapper = $(this);
            query = $wrapper.data('query');
            if (query) {
                $wrapper.prevAll('h5').first().each(function () {
                    var $heading = $(this);
                    $heading.text($heading.text() + ' — this query has been used to initialize the console');
                });
            }
        });
        return query;
    }

    function renderGraphs() {
        findPreviousQueryWrapper('h5.graph-visualization', $content, function ($heading, $wrapper) {
            var visualization = $wrapper.data('visualization');
            var $visContainer = $VISUALIZATION.clone().insertAfter($heading);
            $heading.remove(); // text('The graph after query ' + $wrapper.data('number'));
            if (visualization) {
                d3graph($visContainer[0], visualization);
            }
            else {
                $visContainer.text('There is no graph to render.').addClass('alert-error');
            }
        });
    }

    function renderTables() {
        findPreviousQueryWrapper('h5.result-table', $content, function ($heading, $wrapper) {
            var $tableContainer = $TABLE_CONTAINER.clone().insertAfter($heading);
            $heading.remove(); // text('The results of query ' + $wrapper.data('number'));
            if (!renderTable($tableContainer, $wrapper.data('data'))) {
                $tableContainer.text("Couldn't render the result table.").addClass('alert-error');
            }
        });
    }

    function replaceNewlines(str) {
        return str.replace(/\\n/g, '&#013;');
    }

    function createQueryResultButton($labelType, $wrapper, message, hide) {
        var $label = $labelType.clone();
        var $button = $RESULT_TOGGLE_BUTTON.clone();
        $wrapper.after($label).after($button);
        var $message = $QUERY_MESSAGE.clone().text(replaceNewlines(message));
        if (hide) {
            toggler($message, $button, 'hide');
        }
        else {
            toggler($message, $button, 'show');
        }
        $button.click(function () {
            toggler($message, $button);
        });
        $wrapper.after($message);
    }

    function toggler($target, button, action) {
        var $icon = $('i', button);
        var stateIsExpanded = $icon.hasClass(COLLAPSE_ICON);
        if (( action && action === 'hide' ) || ( action === undefined && stateIsExpanded )) {
            $target.hide();
            $icon.removeClass(COLLAPSE_ICON).addClass(EXPAND_ICON);
            return 'hide';
        }
        else {
            $target.show();
            $icon.removeClass(EXPAND_ICON).addClass(COLLAPSE_ICON);
            return 'show';
        }
    }

    function findQuery(selector, context, operation) {
        $(selector, context).each(
            function () {
                $(this).nextAll('div.listingblock').children('div').children('pre.highlight')
                    .children('code.cypher').first().each(function () {
                        operation(this);
                    });
            });
    }

    function findPreviousQueryWrapper(selector, context, operation) {
        $(selector, context).each(function () {
            var $selected = $(this);
            findPreviousQueryWrapperSearch($selected, $selected, operation);
        });
    }

    function findPreviousQueryWrapperSearch($container, $selected, operation) {
        var done = false;
        done = findQueryWrapper($container, $selected, operation);
        if (done) {
            return true;
        }
        var $newContainer = $container.prev();
        if ($newContainer.length > 0) {
            return findPreviousQueryWrapperSearch($newContainer, $selected, operation);
        }
        else {
            var $up = $container.parent();
            done = $up.length === 0 || $up.prop('tagName').toUpperCase() === 'BODY';
            if (!done) {
                return findPreviousQueryWrapperSearch($up, $selected, operation);
            }
        }
        return done;
    }

    function findQueryWrapper($container, $selected, operation) {
        var done = false;
        $container.find('div.query-wrapper').last().each(function () {
            operation($selected, $(this));
            done = true;
        });
        return done;
    }

    function errorMessage(message, gist) {
        var messageText;
        if (gist) {
            messageText = 'Something went wrong fetching the GraphGist "' + gist + '":<p>' + message + '</p>';
        }
        else {
            messageText = '<p>' + message + '</p>';
        }

        $content.html('<div class="alert alert-block alert-error"><h4>Error</h4>' + messageText + '</div>');
    }

    var visualizer = new GraphVisualization();

    function d3graph(element, graph) {
        var width = 800, height = 300;
        visualizer.visualize(element, width, height, graph);
    }
}
