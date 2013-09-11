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

function Gist($, $content) {

    var DROPBOX_BASE_URL = 'https://dl.dropboxusercontent.com/u/';
    var VALID_GIST = /^[0-9a-f]{5,32}\/?$/;

    return {'getGistAndRenderPage': getGistAndRenderPage, 'readSourceId': readSourceId};

    function getGistAndRenderPage(renderer, defaultSource) {
        var id = window.location.search;
        if (id.length < 2) {
            id = defaultSource;
        }
        else {
            id = id.substr(1);
        }
        var fetcher = fetchGithubGist;
        if (id.length > 8 && id.substr(0, 8) === 'dropbox-') {
            fetcher = fetchDropboxFile;
            id = id.substr(8);
        }
        else if (id.length > 7 && id.substr(0, 7) === 'github-') {
            fetcher = fetchGithubFile;
            id = id.substr(7);
        }
        else if (!VALID_GIST.test(id)) {
            if (id.indexOf('%3A%2F%2F') !== -1) {
                fetcher = fetchAnyUrl;
            }
            else {
                fetcher = fetchLocalSnippet;
            }
        }
        fetcher(id, renderer, function (message) {
            errorMessage(message, id);
        });
    }

    function readSourceId(event) {
        var $target = $(event.target);
        if (event.which === 13 || event.which === 9) {
            event.preventDefault();
            $target.blur();
            var gist = $.trim($target.val());
            if (gist.indexOf('/') !== -1) {
                var baseLen = DROPBOX_BASE_URL.length;
                if (gist.length > baseLen && gist.substr(0, baseLen) === DROPBOX_BASE_URL) {
                    gist = 'dropbox-' + encodeURIComponent(gist.substr(baseLen));
                }
                else if (gist.length > 30 && (gist.substr(0, 19) === 'https://github.com/' || gist.substr(0, 23) === 'https://raw.github.com/')
                    ) {
                    var parts = gist.split('/');
                    var pathIndex = parts[2] === 'raw.github.com' ? 6 : 7;
                    if (parts.length >= pathIndex) {
                        gist = 'github-' + parts[3] + '/' + parts[4] + '/contents/' + parts.slice(pathIndex).join('/');
                    } // else pretend it's a raw URL - encoding needed in both cases
                    gist = encodeURIComponent(gist);
                }
                else {
                    var pos = gist.lastIndexOf('/');
                    var endOfUrl = gist.substr(pos + 1);
                    if (gist.indexOf('://') !== -1 && !VALID_GIST.test(endOfUrl)) {
                        gist = encodeURIComponent(gist);
                    }
                    else {
                        gist = endOfUrl;
                    }
                }
            }
            if (gist.charAt(0) === '?') {
                // in case a GraphGist URL was pasted by mistake!
                gist = gist.substr(1);
            }
            window.location.assign('?' + gist);
        }
    }

    function fetchGithubGist(gist, success, error) {
        if (!VALID_GIST.test(gist)) {
            error('The gist id is malformed: ' + gist);
            return;
        }

        var url = 'https://api.github.com/gists/' + gist.replace("/", "");
        $.ajax({
            'url': url,
            'success': function (data) {
                var file = data.files[Object.keys(data.files)[0]];
                var content = file.content;
                var link = data.html_url;
                success(content, link);
            },
            'dataType': 'json',
            'error': function (xhr, status, errorMessage) {
                error(errorMessage);
            }
        });
    }

    function fetchGithubFile(gist, success, error) {
        var url = 'https://api.github.com/repos/' + decodeURIComponent(gist);
        $.ajax({
            'url': url,
            'success': function (data) {
                var content = Base64.decode(data.content);
                var link = data.html_url;
                success(content, link);
            },
            'dataType': 'json',
            'error': function (xhr, status, errorMessage) {
                error(errorMessage);
            }
        });
    }

    function fetchDropboxFile(id, success, error) {
        var url = DROPBOX_BASE_URL + decodeURIComponent(id);
        $.ajax({
            'url': url,
            'success': function (data) {
                success(data, url);
            },
            'dataType': 'text',
            'error': function (xhr, status, errorMessage) {
                error(errorMessage);
            }
        });
    }

    function fetchAnyUrl(id, success, error) {
        var url = decodeURIComponent(id);
        $.ajax({
            'url': url,
            'success': function (data) {
                success(data, url);
            },
            'dataType': 'text',
            'error': function (xhr, status, errorMessage) {
                error(errorMessage);
            }
        });
    }

    function fetchLocalSnippet(id, success, error) {
        var url = './gists/' + id + '.adoc';
        $.ajax({
            'url': url,
            'success': function (data) {
                var link = 'https://github.com/neo4j-contrib/graphgist/tree/master/gists/' + id + '.adoc';
                success(data, link);
            },
            'dataType': 'text',
            'error': function (xhr, status, errorMessage) {
                error(errorMessage);
            }
        });
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
