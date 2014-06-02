function Neod3Renderer() {

    var styleContents =
        "node {\
          diameter: 40px;\
          color: #DFE1E3;\
          border-color: #D4D6D7;\
          border-width: 2px;\
          text-color-internal: #000000;\
          caption: '{name}';\
          font-size: 10px;\
        }\
        relationship {\
          color: #4356C0;\
          shaft-width: 3px;\
          font-size: 9px;\
          padding: 3px;\
          text-color-external: #000000;\
          text-color-internal: #FFFFFF;\
        }\n";

    var skip = ["id", "start", "end", "source", "target", "labels", "type", "selected"];
    var prio_props = ["name", "title", "tag"];

    var serializer = null;

    var $downloadSvgLink = $('<a href="#" class="btn btn-success visualization-download" target="_blank"><i class="icon-download-alt"></i> Download SVG</a>').hide().click(function () {
        $downloadSvgLink.hide();
    });
    var downloadSvgLink = $downloadSvgLink[0];

    function render(id, $container, visualization) {
        function extract_props(pc) {
            var p = {};
            for (var key in pc) {
                if (!pc.hasOwnProperty(key) || skip.indexOf(key) != -1) continue;
                p[key] = pc[key];
            }
            return p;
        }

        function node_styles(nodes) {
            function label(n) {
                var labels = n["labels"];
                if (labels && labels.length) {
                    return labels[labels.length - 1];
                }
                return "";
            }

            var style = {};
            for (var i = 0; i < nodes.length; i++) {
                nodes[i].properties = extract_props(nodes[i]);
                var keys = Object.keys(nodes[i].properties);
                if (label(nodes[i]) != "" && keys.length > 0) {
                    keys = prio_props.filter(function (k) {
                        return keys.indexOf(k) != -1
                    }).concat(keys);
                    var selector = "node." + label(nodes[i]);
                    style[selector] = style[selector] || keys[0];
                }
            }
            return style;
        }

        function style_sheet(style, styleContents) {
            var styleSheet = "";
            var c = 1;
            var colors = neo.style.defaults.colors;
            for (var k in style) {
                var color = colors[c];
                c = (c + 1) % colors.length
                styleSheet += k + " {caption: '{" + style[k] + "}'; color: " + color.color +
                    "; border-color: " + color['border-color'] +
                    "; text-color-internal: " + color['text-color-internal'] +
                    "; text-color-external: " + color['text-color-internal'] +
                    "; }\n";
            }
            return styleContents + styleSheet;
        }

        function applyZoom() {
            renderer.select(".nodes").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            renderer.select(".relationships").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }

        function enableZoomHandlers() {
            renderer.on("wheel.zoom",zoomHandlers.wheel);
            renderer.on("mousedown.zoom",zoomHandlers.mousedown);
        }

        function disableZoomHandlers() {
            renderer.on("wheel.zoom",null);
            renderer.on("mousedown.zoom", null);
        }

        function altHandler() {
            if (d3.event.altKey) {
                enableZoomHandlers();
            }
            else {
               disableZoomHandlers();
            }
        }

        var links = visualization.links;
        var nodes = visualization.nodes;
        for (var i = 0; i < links.length; i++) {
            links[i].source = links[i].start;
            links[i].target = links[i].end;
            links[i].properties = props(links[i]);
        }
        var nodeStyle = node_styles(nodes);
        var styleSheet = style_sheet(nodeStyle, styleContents)

        var graphModel = neo.graphModel()
            .nodes(nodes)
            .relationships(links);
        var dummyFunc = function () {
        };
        var graphView = neo.graphView()
            .style(styleSheet)
            .width($container.width()).height($container.height()).on('nodeClicked', dummyFunc).on('relationshipClicked', dummyFunc).on('nodeDblClicked', dummyFunc);
        var renderer = d3.select("#" + id).append("svg").data([graphModel]);
        var zoomHandlers = {};
        var zoomBehavior = d3.behavior.zoom().on("zoom", applyZoom).scaleExtent([0.2, 8])

        renderer.call(graphView);
        renderer.call(zoomBehavior);

        zoomHandlers.wheel = renderer.on("wheel.zoom");
        zoomHandlers.mousedown = renderer.on("mousedown.zoom");
        disableZoomHandlers();

        d3.select('body').on("keydown", altHandler).on("keyup", altHandler);

        function refresh() {
            graphView.height($container.height());
            graphView.width($container.width());
            renderer.call(graphView);
        }

        function saveToSvg() {
            var svgElement = $('#' + id).children('svg').first()[0];
            var xml = serializeSvg(svgElement, $container);
            if (downloadSvgLink.href !== '#') {
                window.URL.revokeObjectURL(downloadSvgLink.href);
            }
            var blob = new window.Blob([xml], {
                'type': 'image/svg+xml'
            });
            downloadSvgLink.href = window.URL.createObjectURL(blob);
            $downloadSvgLink.appendTo($container).show();
            $downloadSvgLink.attr('download', id + '.svg');
        }

        function getFunctions() {
            var funcs = {};
            if (window.Blob) {
                funcs['icon-download-alt'] = saveToSvg
            }
            return funcs;
        }

        return  {
            'subscriptions': {
                'expand': refresh,
                'contract': refresh,
                'sizeChange': refresh
            },
            'actions': getFunctions()
        };
    }

    function serializeSvg(element, $container) {
        if (serializer === null) {
            if (typeof window.XMLSerializer !== 'undefined') {
                var xmlSerializer = new XMLSerializer();
                serializer = function (emnt) {
                    return xmlSerializer.serializeToString(emnt);
                };
            } else {
                serializer = function (emnt) {
                    return '<svg xmlns="http://www.w3.org/2000/svg">' + $(emnt).html() + '</svg>';
                }
            }
        }
        var svg = serializer(element);
        svg = svg.replace('<svg ', '<svg height="' + $container.height() + '" width="' + $container.width() + '" style="font-family: sans-serif;" ');
        return svg;
    }

    return {'render': render};
}
