function GraphVisualizer($el, colorManager, width, height) {

    var _this = this;
    console.log("_this",_this,"this",this);
    this.$el = $el;
    //console.log("el",this.$el);
    this.colorManager = colorManager;
    this.width = width;
    this.height = height;
    console.log("el", $el[0]);

    this.svg = d3.select(this.$el[0]).append("svg").attr("width", this.width).attr("height", this.height);
    this.viz = this.svg.append("g");
    this.viz.append("defs").selectAll("marker").data(["arrowhead", "faded-arrowhead"]).enter().append("marker").attr("id", String).attr("viewBox", "0 0 10 10").attr("refX", 25).attr("refY", 5).attr("markerUnits", "strokeWidth").attr("markerWidth", 4).attr("markerHeight", 3.5).attr("orient", "auto").attr("preserveAspectRatio", "xMinYMin").append("path").attr("d", "M 0 0 L 10 5 L 0 10 z");
    this.emptyMsg = this.svg.append("text").text("Graph database is empty.").attr("class", "emptyMsg").attr("x", 350).attr("y", 200).attr("opacity", 0);
    this.force = d3.layout.force().charge(-1380).linkDistance(100).friction(0.3).gravity(0.5).size([this.width, this.height]);
    this.force.on("tick", function () {
        return _this.tick();
    });

    this.create = function (graph) {
        var d;
//        console.log("_this",_this,"this",this);
        if (graph.nodes.length === 0 && graph.links.length === 0) {
            this.emptyMsg.attr("opacity", 1);
            return;
        } else {
            this.emptyMsg.attr("opacity", 0);
        }
        d = 2 * (this.width || 725) / graph.nodes.length;
        this.force.linkDistance(Math.min(200, d));
        if (graph.nodes.length < 25) {
//                        this.height = 400;
        } else if (graph.nodes.length > 100) {
//                        this.height = 600;
        } else {
            this.height = (graph.nodes.length - 25) * 200 / 75 + 400;
        }
        this.svg.attr("height", this.height);
        this.force.size([this.width, this.height]);
        this.selectedNodes = [];
        this.selectedLinks = [];
        this.viz.selectAll("g").remove();
        this.selective = false;
        this.force.nodes(graph.nodes).links(graph.links).start();
        this.links = this.viz.append("g").selectAll("g");
        this.pathTexts = this.viz.append("g").selectAll("g");
        this.nodes = this.viz.append("g").selectAll("g");
        this.nodeTexts = this.viz.append("g").selectAll("g");
        this.graphCreated = true;
//        console.log("Viz create",this);
        return this.draw(graph);
    };
    this.tick = function () {
        var _this = this;

        this.nodes
            .select("circle")
            .attr("cx",function (d) {
                //console.log(_this.width, d);
                return Math.min(_this.width, Math.max(0, d.x));
            }).attr("cy", function (d) {
                return Math.min(_this.height, Math.max(0, d.y));
            });

        this.nodeTexts
            .select(".node-texts g")
            .selectAll("text")
            .attr("y", function(d, i)
                {
                    return (Math.min(_this.height, Math.max(0, d.y)) + 3) + (i * 12);
                })
            .attr("x",function (d) {
                return Math.min(_this.width, Math.max(0, d.x)) + 12;
            });
        this.links.attr("x1",function (d) {
            return Math.min(_this.width, Math.max(0, d.source.x));
        }).attr("y1",function (d) {
                return Math.min(_this.height, Math.max(0, d.source.y));
            }).attr("x2",function (d) {
                return Math.min(_this.width, Math.max(0, d.target.x));
            }).attr("y2", function (d) {
                return Math.min(_this.height, Math.max(0, d.target.y));
            });
        /* in case different links between two nodes are ever needed
         # arcs
         @links.attr "d", (d) ->
         dx = d.target.x - d.source.x
         dy = d.target.y - d.source.y
         dr = Math.sqrt(dx * dx + dy * dy)
         return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y
         */

        return this.pathTexts.attr("transform", function (d) {
            var cosinus, dr, dx, dy, l, offset, sinus, x, y;
            dx = d.target.x - d.source.x;
            dy = d.target.y - d.source.y;
            dr = Math.sqrt(dx * dx + dy * dy);
            sinus = dy / dr;
            cosinus = dx / dr;
            l = d.type.length * 4;
            offset = (1 - ((l + 10) / dr)) / 2;
            x = d.source.x + dx * offset;
            y = d.source.y + dy * offset;
            return "translate(" + x + "," + y + ") matrix(" + cosinus + ", " + sinus + ", " + -sinus + ", " + cosinus + ", 0 , 0)";
        });
    };
    this.syncGraphData = function (newData, oldData) {
        var toAdd, toRemove,
            _this = this;
        toAdd = _.difference(_.map(newData, function (n) {
            return n.id;
        }), _.map(oldData, function (n) {
            return n.id;
        }));
        _.each(toAdd, function (nta) {
            return oldData.push(_.findWhere(newData, {
                id: nta
            }));
        });
        toRemove = _.difference(_.map(oldData, function (n) {
            return n.id;
        }), _.map(newData, function (n) {
            return n.id;
        }));
        _.each(oldData, function (n, i) {
            if (_.indexOf(toRemove, n.id) > -1) {
                return oldData.splice(i, 1);
            }
        });
        return toAdd.length || toRemove.length;
    };


    function isSelected(d) {
        return (_this.selective && _this.selectedNodes[d.id]);
    }

    function getNodeText(gs, viz) {
            var propCountGroup = 0;
            gs.each(function(gsd) {

                var lg = d3.select(viz
                            .selectAll(".node-texts")[0][propCountGroup])
                            .append("g");

                var propCount = 0;
                _.each(gsd, function (value, key) {
                    if (["px", "py", "x", "y", "index", "weight", "labels","id"].indexOf(key) === -1)
                    {
                        var text = (key + ": " + value);

                        lg.append("text").text(function (d, i) {
                            return isSelected(d) || propCount == 0? text : null;
                        });
                        propCount += 1;
                    }
                });

                propCountGroup += 1;
            });
    }

    this.draw = function (graph, forceUnselective) {
        var didChange, didChange1, didChange2, gs, nt;
        var _this = this;
//        console.log("_this",_this,"this",this);
        if (graph.nodes.length === 0 && graph.links.length === 0) {
            _this.emptyMsg.attr("opacity", 1);
        } else {
            _this.emptyMsg.attr("opacity", 0);
        }



        if (!_this.graphCreated) {
//            console.log("created", _this.graphCreated);
            _this.create(graph);
        }

        didChange1 = this.syncGraphData(graph.nodes, _this.force.nodes());
        didChange2 = this.syncGraphData(graph.links, _this.force.links());
        didChange = didChange1 || didChange2;
        _.each(graph.nodes, function (n) {
            return _this.selectedNodes[n.id] = n.selected ? true : false;
        });
        _.each(graph.links, function (n) {
            return _this.selectedLinks[n.id] = n.selected ? true : false;
        });
        if (forceUnselective) {
            _this.selective = false;
        } else {
            _this.selective = _.some(graph, function (g) {
                return _.some(g, function (d) {
                    return d.selected;
                });
            });
        }
        this.indexLinkRef = _.map(graph.links, function (link) {
            return link.start + ',' + link.end;
        });
        _this.links = _this.links.data(this.force.links());
        _this.links.enter().append("line");
        _this.links.exit().remove();
        _this.links.attr("marker-end",function (d) {
            if (_this.selective && _this.selectedLinks[d.id]) {
                return "url(#arrowhead)";
            } else {
                return "url(#faded-arrowhead)";
            }
        }).attr("class",function (d) {
                if (_this.selective && _this.selectedLinks[d.id]) {
                    return "relationship";
                } else {
                    return "faded-relationship";
                }
            }).filter(function (l) {
                return _this.selective && _this.selectedLinks[l.id];
            }).each(function (l) {
                return this.parentNode.appendChild(this);
            });
        _this.pathTexts = _this.pathTexts.data([]);
        _this.pathTexts.exit().remove();
        _this.nodes = _this.nodes.data(_this.force.nodes());

        //console.log("graphcreated",this.nodes)
       //.append("circle").exit();

        this.nodes.enter().append("g").attr("class", "node-circle").append("circle").attr("r", 10).call(this.force.drag).each(function (d) {
            d.x = (Math.random() + 0.5) * _this.width / 2;
            d.y = (Math.random() + 0.5) * _this.height / 2;
            //console.log("circle",_this,d);
            return d;
        }).on("mouseover",function (d) {
                return _this.onNodeHover(d);
            }).on("mouseout", function () {
                return _this.onNodeUnhover();
            });
        this.nodes.select("circle").attr("class",function (d) {
            if (_this.selective && _this.selectedNodes[d.id]) {
                return "node";
            } else {
                return "faded-node";
            }
        }).style("fill", function (d) {
                var color = colorManager.getColorForLabels(d.labels);
                if (!_this.selective || _this.selectedNodes[d.id]) {
                    return color.bright;
                } else {
                    return color.dim;
                }
            });
        this.nodeTexts = this.nodeTexts.data(this.force.nodes());
        gs = this.nodeTexts.enter().append("g").attr("class", "node-texts");
        nt = this.nodeTexts.exit();
        this.nodes.exit().remove();
        nt.remove();

//        this.nodeTexts.attr("opacity", function (d) { return isSelected(d) ? 1 : 0 });

        getNodeText(gs, this.viz);

        if (didChange) {
            this.force.start();
        }
        return setTimeout((function () {
            return _this.frameOverTime(1000);
        }), 300);
    };

    this.showDefault = function () {
        this.draw({
            nodes: this.force.nodes(),
            links: this.force.links()
        }, true);
        this.rightPadding = 0;
        return this.frame();
    };

    this.empty = function () {
        this.viz.selectAll("g").remove();
        this.links = this.viz.append("g").selectAll("g");
        this.nodes = this.viz.append("g").selectAll("g");
        this.nodeTexts = this.viz.append("g").selectAll("g");
        this.force.nodes([]).links([]);
        return this.emptyMsg.attr("opacity", 1);
    };

    this.onNodeHover = function (d) {
        var filtered,
            _this = this;
        this.nodes.select("circle").style("fill",function (n) {
            if (_.indexOf(_this.indexLinkRef, d.id + "," + n.id) > -1 || _.indexOf(_this.indexLinkRef, n.id + "," + d.id) > -1 || n.id === d.id || (_this.selective && _this.selectedNodes[n.id])) {
                return colorManager.getColorForLabels(n.labels).bright;
            } else {
                return colorManager.getColorForLabels(n.labels).dim;
            }
        }).each(function (n) {
                if (n.id === d.id) {
                    return this.parentNode.appendChild(this);
                }
            });
        filtered = this.links.filter(function (l) {
            return l.start === d.id || l.end === d.id;
        }).attr("class", "relationship").attr("marker-end", "url(#arrowhead)").each(function (l) {
                return this.parentNode.appendChild(this);
            });
        this.nodeTexts.attr("opacity",function (n) {
            if (_.indexOf(_this.indexLinkRef, d.id + "," + n.id) > -1 || _.indexOf(_this.indexLinkRef, n.id + "," + d.id) > -1 || n.id === d.id || (_this.selective && _this.selectedNodes[n.id])) {
                return 0.5;
            } else {
                return 0;
            }
        }).each(function (l) {
                if (l.id === d.id) {
                    d3.select(this).attr("opacity", 1);
                    return this.parentNode.appendChild(this);
                }
            });
        this.pathTexts = this.pathTexts.data(this.force.links().filter(function (l) {
            return l.start === d.id || l.end === d.id;
        }));
        this.pathTexts.enter().append("g").attr("class", "path-texts");
        this.pathTexts.append("text").attr("class", "shadow").text(function (n) {
            return n.type;
        });
        this.pathTexts.append("text").text(function (n) {
            return n.type;
        });
        return this.tick();
    };

    this.onNodeUnhover = function () {
        var _this = this;
        this.nodes.select("circle").style("fill", function (d) {
            var col;
            col = colorManager.getColorForLabels(d.labels);
            if (!_this.selective || _this.selectedNodes[d.id]) {
                return col.bright;
            } else {
                return col.dim;
            }
        });
        this.links.attr("class",function (d) {
            if (_this.selective && _this.selectedLinks[d.id]) {
                return "relationship";
            } else {
                return "faded-relationship";
            }
        }).attr("marker-end", function (d) {
                if (_this.selective && _this.selectedLinks[d.id]) {
                    return "url(#arrowhead)";
                } else {
                    return "url(#faded-arrowhead)";
                }
            });
//        this.nodeTexts.attr("opacity", function (d) {
//            if (_this.selective && _this.selectedNodes[d.id]) {
//                return 1;
//            } else {
//                return 0;
//            }
//        });
        this.pathTexts = this.pathTexts.data([]);
        this.pathTexts.exit().remove();
        return this.tick();
    };

    this.setTableDims = function (tableWidth, tableHeight) {
        this.tableWidth = tableWidth;
        this.tableHeight = tableHeight;
        return this.rightPadding = 20 + this.tableWidth;
    };

    this.frameOverTime = function (ms) {
        var i, step,
            _this = this;
        i = 0;
        step = function () {
            _this.frame();
            if (i++ * 100 < ms) {
                return setTimeout(step, 100);
            }
        };
        return step();
    };

    this.frame = function () {
        var nodes, xMax, xMin, yMax, yMin,
            _this = this;
        nodes = this.selectove ? this.nodes.select("circle").filter(function (n) {
            return _this.selectedNodes[n.id];
        }) : this.nodes.select("circle");
        xMax = 0;
        xMin = Infinity;
        yMax = 0;
        yMin = Infinity;
        nodes.each(function (n) {
            if (n.x > xMax) {
                xMax = n.x;
            }
            if (n.x < xMin) {
                xMin = n.x;
            }
            if (n.y > yMax) {
                yMax = n.y;
            }
            if (n.y < yMin) {
                return yMin = n.y;
            }
        });
        return this.frameViz(xMin, xMax, yMin, yMax, 50, this.rightPadding);
    };

    this.frameViz = function (x1, x2, y1, y2, padding, rightPadding) {
        var scale, translate;
        if (padding) {
            x1 = x1 - padding;
            x2 = rightPadding ? x2 + rightPadding : x2 + padding;
            y1 = y1 - padding;
            y2 = y2 + padding;
        }
        if (this.height / (y2 - y1) < this.width / (x2 - x1)) {
            scale = this.height / (y2 - y1);
            translate = (-x1 + (((y2 - y1) * this.width / this.height - (x2 - x1)) / 2)) + ", " + (-y1);
        } else {
            scale = this.width / (x2 - x1);
            translate = (-x1) + ", " + (-y1 + (((x2 - x1) * this.height / this.width - (y2 - y1)) / 2));
        }
        scale = Math.min(scale, 2);
        this.viz.transition().attr("transform", "scale(" + scale + ")translate(" + translate + ")");
        this.viz.selectAll("text").style("font", 12 / scale + "px sans-serif").style("stroke-width", 0.5 / scale + "px");
        return this.viz.selectAll(".shadow").style("stroke-width", 3 / scale + "px");
    }
}
