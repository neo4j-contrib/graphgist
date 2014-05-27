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

function renderNeod3(id, $container, visualization) {
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
    renderer.call(graphView);
    return function () {
        graphView.height($container.height());
        graphView.width($container.width());
        renderer.call(graphView);
    };
}
