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
    if ('support' in $) {
        $.support.cors = true;
    }
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
    var VISUALIZATION_HEIGHT = 400;
    var $TABLE_CONTAINER = $('<div/>').addClass('result-table');
    var ASCIIDOCTOR_OPTIONS = Opal.hash('attributes', [ 'notitle!' ], 'attribute-missing', 'drop');
    var DEFAULT_SOURCE = 'github-neo4j-contrib%2Fgists%2F%2Fmeta%2FHome.adoc'
    var $VISUALIZATION_ICONS = $('<div class="visualization-icons"><i class="icon-fullscreen fullscreen-icon" title="Toggle fullscreen mode"></i></div>');
    var $I = $('<i/>');

    var DEFAULT_VERSION = '2.0.0';
    var CONSOLE_VERSIONS = { '2.0.0-M06': 'http://neo4j-console-20m06.herokuapp.com/',
        '2.0.0-RC1': 'http://neo4j-console-20rc1.herokuapp.com/',
        '2.0.0': 'http://neo4j-console-20.herokuapp.com/',
        '2.0.1': 'http://neo4j-console-20.herokuapp.com/',
        '2.0.2': 'http://neo4j-console-20.herokuapp.com/',
        '2.0.3': 'http://neo4j-console-20.herokuapp.com/',
        '2.1.0': 'http://neo4j-console-21.herokuapp.com/',
        'local': 'http://localhost:8080/',
        '1.9': 'http://neo4j-console-19.herokuapp.com/'
    }

    var neod3Renderer = new Neod3Renderer();

    var $content = undefined;
    var $gistId = undefined;
    var consolr = undefined;

    $(document).ready(function () {
        $content = $('#content');
        $gistId = $('#gist-id');
        var gist = new Gist($, $content);
        gist.getGistAndRenderPage(renderContent, DEFAULT_SOURCE);
        $gistId.keydown(gist.readSourceId);
    });

    function renderContent(originalContent, link, imagesdir) {
        $('#gist_link').attr('href', link).removeClass('disabled');
        var doc = preProcessContents(originalContent);
        $content.empty();
        if (imagesdir) {
            // probably not supported yet due to a bug
            //ASCIIDOCTOR_OPTIONS = Opal.hash('attributes', [ 'notitle!', 'imagesdir=' + imagesdir ]);
        }
        var generatedHtml = undefined;
        try {
            generatedHtml = Opal.Asciidoctor.$render(doc, ASCIIDOCTOR_OPTIONS);
        }
        catch (e) {
            errorMessage('Error while parsing the AsciiDoc source - ' + e.name + ':' + '<p>' + e.message + '</p>');
            return;
        }
        $content.html(generatedHtml);
        if ('initSocial' in window) {
            initSocial(initAndGetHeading());
            share();
        }
        var version = postProcessPage();
        var consoleUrl = CONSOLE_VERSIONS[version in CONSOLE_VERSIONS ? version : DEFAULT_VERSION];
        CypherConsole({'url': consoleUrl}, function (conslr) {
            consolr = conslr;
            executeQueries(function () {
                initConsole(function () {
                    renderGraphs();
                    renderTables();
                }, function () {
                    postProcessRendering();
                    initDisqus($content);
                });
            });
        });
    }

    function postProcessRendering() {
        $('span[data-toggle="tooltip"]').tooltip({'placement': 'left'});
        $('a.run-query,a.edit-query,a.show-console-toggle').tooltip({'placement': 'right'});
        $('.tooltip-below').tooltip({'placement': 'bottom'});
        var $status = $('#status');
        if (HAS_ERRORS) {
            $status.text('Errors.');
            $status.addClass('label-important');
        } else {
            $status.text('No Errors.');
            $status.addClass('label-success');
        }
        DotWrapper($).scan();
    }

    function preProcessContents(content) {
        var sanitized = content
            .replace(
            /^\/\/\s*?console/m,
            '++++\n<p class="console"><span class="loading"><i class="icon-cogs"></i> Running queries, preparing the console!</span></p>\n++++\n');
        sanitized = sanitized.replace(/^\/\/\s*?hide/gm, '++++\n<span class="hide-query"></span>\n++++\n');
        sanitized = sanitized.replace(/^\/\/\s*?setup/m, '++++\n<span id="setup-query"></span>\n++++\n');
        sanitized = sanitized.replace(/^\/\/\s*?graph_result.*/gm, '++++\n<h5 class="graph-visualization" graph-mode="result"><img alt="loading" class="loading" src="images/loading.gif"></h5>\n++++\n');
        sanitized = sanitized.replace(/^\/\/\s*?graph.*/gm, '++++\n<h5 class="graph-visualization"><img alt="loading" src="images/loading.gif" class="loading"></h5>\n++++\n');
        sanitized = sanitized.replace(/^\/\/\s*?output.*/gm, '++++\n<span class="query-output"></span>\n++++\n');
        sanitized = sanitized.replace(/^\/\/\s*?table.*/gm, '++++\n<h5 class="result-table"></h5>\n++++\n');
        sanitized += '\n[subs="attributes"]\n++++\n<span id="metadata"\n author="{author}"\n version="{neo4j-version}"\n twitter="{twitter}"\n tags="{tags}"\n/>\n++++\n';
        return sanitized;
    }

    function processMathJAX() {
        MathJax.Hub.Typeset();
    }

    function formUrl(url, title, author, twitter) {
        return 'https://docs.google.com/a/neopersistence.com/forms/d/1BhtdunQd9QqLmIl01sK49curYY1dj2OPxXFgvf8HPAE/viewform?entry.718349727='
            + encodeURIComponent(url)
            + '&entry.1981612324='
            + encodeURIComponent(title.length > 18 ? title.substr(0, title.length - 18) : title)
            + '&entry.1328778537='
            + encodeURIComponent(author)
            + '&entry.507462214='
            + encodeURIComponent(twitter);
    }

    function initAndGetHeading() {
        var headingText = 'Neo4j GraphGist';
        var heading = $('h1').first();
        if (!heading.length) {
            heading = $('h2').first();
        }
        if (heading.length) {
            headingText = heading.text();
            document.title = headingText + ' - Neo4j GraphGist';
        }

        return headingText;
    }

    function postProcessPage() {
        var $meta = $('#metadata', $content);
        var version = $meta.attr('version'), tags = $meta.attr('tags'), author = $meta.attr('author'), twitter = $meta.attr('twitter');
        if (tags === '{tags}') {
            tags = false;
        }
        if (author === '{author}') {
            author = false;
        }
        if (twitter === '{twitter}') {
            twitter = false;
        }
        if (typeof version === 'undefined' || !(version in CONSOLE_VERSIONS)) {
            version = DEFAULT_VERSION;
        }
        var $footer = $('footer');
        if (tags) {
            $footer.prepend('<i class="icon-tags"></i> Tags <em>' + tags + '</a> ');
        }
        if (twitter) {
            twitter = twitter.replace('@', '');
        }
        if (twitter && !author) {
            author = twitter;
        }
        if (author) {
            var authorHtml = '<i class=' + (twitter ? '"icon-twitter-sign"' : '"icon-user"') + '></i> Author ';
            if (twitter) {
                authorHtml += '<a target="_blank" href="http://twitter.com/' + twitter + '">';
            }
            authorHtml += author;
            if (twitter) {
                authorHtml += '</a>';
            }

            authorHtml += ' ';
            $footer.prepend(authorHtml);
        }

        $footer.prepend('<i class="icon-check"></i><a target="_blank" title="Submit an original GraphGist and get a Neo4j t-shirt" href="' + formUrl(window.location.href, document.title, author, twitter) + '"> Submit</a> ');
        $footer.prepend('<i class="icon-cogs"></i> Uses Neo4j Version <a target="_blank" href="http://docs.neo4j.org/chunked/' + version + '/cypher-query-lang.html">' + version + '</a> ');
        $('h2[id]').css({cursor: 'pointer'}).click(function () {
            window.location.href = window.location.href.replace(/($|#.+?$)/, '#' + $(this).attr('id'))
        });

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
        var number = 0;
        $('code', $content).each(function (index, el) {
            var $el = $(el);
            if ($el.hasClass('cypher')) {
                number++;
                var $parent = $el.parent();
                $parent.addClass('with-buttons');
                $el.attr('data-lang', 'cypher');
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
            } else if ($el.hasClass('sql')) {
                $el.attr('data-lang', 'sql');
            }
        });

        CodeMirror.colorize();

        $('table').addClass('table'); // bootstrap formatting

        return version;
    }

    function initConsole(callback, always) {
        var query = getSetupQuery();
        consolr.init({
            'init': 'none',
            'query': query || 'none',
            'message': 'none',
            'no_root': true
        }, success, error);

        function success(data) {
            consolr.input('');
            if (callback) {
                callback();
            }
            if (always) {
                always();
            }
        }

        function error(data) {
            HAS_ERRORS = true;
            console.log('Error during INIT: ', data);
            if (always) {
                always();
            }
        }
    }

    function executeQueries(callbackAfter) {
        var statements = [];
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
        var counter = 0;
        findPreviousQueryWrapper('h5.graph-visualization', $content, function ($heading, $wrapper) {
            var visualization = $wrapper.data('visualization');
            var id = 'graph-visualization-' + (counter++);
            var $visContainer = $VISUALIZATION.clone().attr('id', id).insertAfter($heading);
            var show_result_only = $heading.attr('graph-mode') && $heading.attr('graph-mode').indexOf('result') !== -1;
            var selectedVisualization = handleSelection(visualization, show_result_only);
            $heading.remove();
            $visContainer.height(VISUALIZATION_HEIGHT);
            performVisualizationRendering();

            function performVisualizationRendering() {
                if (visualization) {
                    var rendererHooks = neod3Renderer.render(id, $visContainer, selectedVisualization);
                    var subscriptions = 'subscriptions' in rendererHooks ? rendererHooks['subscriptions'] : {};
                    var actions = 'actions' in rendererHooks ? rendererHooks['actions'] : {};
                    var $visualizationIcons = $VISUALIZATION_ICONS.clone().appendTo($visContainer);
                    $visualizationIcons.children('i.fullscreen-icon').click(fullscreenClick);
                    for (var iconName in actions) {
                        var actionData = actions[iconName];
                        $I.clone().addClass(iconName).attr('title', actionData.title).appendTo($visualizationIcons).click(actionData.func);
                    }
                    $visContainer.mutate('width', sizeChange);
                }
                else {
                    $visContainer.text('There is no graph to render.').addClass('alert-error');
                }

                function fullscreenClick() {
                    if ($visContainer.hasClass('fullscreen')) {
                        $('body').unbind('keydown', keyHandler);
                        contract();
                    } else {
                        expand();
                        $('body').keydown(keyHandler);
                    }
                }

                function expand() {
                    $visContainer.addClass('fullscreen');
                    $visContainer.height('100%');
                    if ('expand' in subscriptions) {
                        subscriptions.expand();
                    }
                }

                function contract() {
                    $visContainer.removeClass('fullscreen');
                    $visContainer.height(400);
                    if ('contract' in subscriptions) {
                        subscriptions.contract();
                    }
                }

                function sizeChange() {
                    if ('sizeChange' in subscriptions) {
                        subscriptions.sizeChange();
                    }
                }

                function keyHandler(event) {
                    if ('which' in event && event.which === 27) {
                        contract();
                    }
                }
            }
        });
    }

    function handleSelection(data, show_result_only) {
        if (!show_result_only) return data;
        var nodes = [];
        var links = [];
        var i;
        for (i = 0; i < data.nodes.length; i++) {
            var node = data.nodes[i];
            if (node.selected) {
                node['$index'] = nodes.length;
                nodes.push(node);
            }
        }
        for (i = 0; i < data.links.length; i++) {
            var link = data.links[i];
            if (link.selected || data.nodes[link.source].selected && data.nodes[link.target].selected) {
                link.source = data.nodes[link.source]['$index'];
                link.target = data.nodes[link.target]['$index'];
                links.push(link);
            }
        }
        return {nodes: nodes, links: links};
    }

    /*
     function renderVersal(id,visualization) {
     var myChart = new GraphVisualizer($("#"+id), window.ColorManager(), 840, 300);
     myChart.draw(visualization, true);
     }
     */

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
}
