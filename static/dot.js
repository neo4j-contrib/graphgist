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

function DotWrapper($) {

    var vizLoaded = false;
    var loading = false;
    var queue = [];

    function scanForScriptBlocks() {
        if (!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect) {
            return;
        }
        $('script[type="text/vnd.graphviz"]').each(function () {
            var $script = $(this);
            var dot = $script.html();
            insertSvg(dot, $script);
        });
    }

    function insertSvg(dot, $element) {
        if (!vizLoaded) {
            if (loading) {
                queue.push({'dot': dot, 'element': $element});
            } else {
                loading = true;
                queue.push({'dot': dot, 'element': $element});
                $.ajax({
                    'url': 'js/viz.js',
                    'dataType': 'script',
                    'cache': true,
                    'success': function () {
                        vizLoaded = true;
                        $.each(queue, function () {
                            executeAndInsert(this.dot, this.element);
                        });
                    }
                });
            }
        }
        else {
            executeAndInsert(dot, $element);
        }

        function executeAndInsert(dotSource, $elementTarget) {
            try {
                var svg = Viz(dotSource, 'svg');
                $elementTarget.after(svg);
            } catch (ex) {
                console.log('Graphviz rendering failed:\n', ex);
            }
        }
    }

    return {'scan': scanForScriptBlocks};
}
