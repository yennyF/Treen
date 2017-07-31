/*
 * Tree graph with HTML5 and JavaScript.
 * Date: 2015.
 * Dependencies: none
 *
 * Copyright (c) 2015 Yenny Fung Guan
 */

var Record = function(forest){
    var records = [];
    var iCurrent = -1;
    var iCheckpoint = -1;

    this.getRecords = function(){
        return records;
    };

    this.getIcurrent = function(){
        return iCurrent;
    };

    this.getIcheckpoint = function(){
        return iCheckpoint;
    };

    this.save = function(){
        iCheckpoint = iCurrent;
    }

    this.reset = function(){
        for(var i = 0; i < records.length; ++i)
            delete records[i];
        records = []; 
        iCurrent = -1;
        iCheckpoint = -1;
    };

    this.rec = function(command, dataNodes){
        if(Object.keys(dataNodes).length > 0){
            records[++iCurrent] = {command: command, dataNodes: dataNodes};
            records.splice(iCurrent + 1);
            if(records.length > 20){
                records.splice(0, 1);
                iCurrent--;
            }
        }
    }

    this.rec2 = function(command, dataNodes){
        function isSame(){
            var lastDataNodes = records[iCurrent].dataNodes;
            if(JSON.stringify(Object.keys(dataNodes)) === JSON.stringify((Object.keys(lastDataNodes))))
                for(key in dataNodes){
                    if(dataNodes[key].length === lastDataNodes[key].length){
                        for(var i = 0; i < dataNodes[key].length; ++i)
                            if(JSON.stringify(dataNodes[key][i].before) !== JSON.stringify(lastDataNodes[key][i].current))
                                return false;
                        return true;
                    }else{
                        return false;
                    }
                }
            return false;
        }

        if(records.length > 0 && command === records[iCurrent].command && isSame()){
            for(key in dataNodes)
                for(var i = 0; i < dataNodes[key].length; ++i)
                    records[iCurrent].dataNodes[key][i].current = dataNodes[key][i].current;
        }else{
            this.rec(command, dataNodes);
        }
    }

    this.rec3 = function(command, dataNodes){
        function isSame(){
            if(JSON.stringify(Object.keys(dataNodes)) === JSON.stringify((Object.keys(records[iCurrent].dataNodes)))){
                for(key in dataNodes)
                    if(JSON.stringify(dataNodes[key].before) !== JSON.stringify(records[iCurrent].dataNodes[key].current))
                        return false;
                return true;    
            }
            return false;
        }

        if(records.length > 0 && command === records[iCurrent].command && isSame()){
            for(key in dataNodes)
                records[iCurrent].dataNodes[key].current = dataNodes[key].current;
        }else{
            this.rec(command, dataNodes);
        }
    }

    var UndoRecord = {
        Add: { 
            root: function(dataNodes){
                var node = forest.getNodeByPos(dataNodes[0].pos);
                forest.removeTree(node.getTree());
                node.getTree().remove(node);
                return [];
            },

            child: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [], expands = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                        subNodes.push(node);
                        if(node instanceof Binary){
                            if(dataNodes[key][i].current.side === 'left')
                                nodes.push(node.getLeftChild());
                            else
                                nodes.push(node.getRightChild());
                        }else{
                            nodes.push(node.children[node.children.length - 1]);
                        }

                        if(dataNodes[key][i].before.expand == false)
                            expands.push(node);
                    }
                    nodes[0].getTree().removes(nodes);
                    for(var i = 0; i < expands.length; ++i)
                        expands[i].getTree().expand(expands[i]);
                }
                return subNodes;
            },

            left: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                        subNodes.push(node);
                        if(node instanceof Binary)
                            nodes.push(node.getLeftChild());
                        else
                            nodes.push(node.siblingLeft);
                    }
                    nodes[0].getTree().removes(nodes);
                }
                return subNodes;
            },

            right: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                        subNodes.push(node);
                        if(node instanceof Binary)
                            nodes.push(node.getRightChild());
                        else
                            nodes.push(node.siblingRight);
                    }
                    nodes[0].getTree().removes(nodes);
                }
                return subNodes;
            }
        },

        remove: function(dataNodes){
            var currents = [], subNodes = [];
            for(var key in dataNodes){
                for(var i = 0; i < dataNodes[key].length; ++i){
                    if(dataNodes[key][i].before.nChild !== null){
                        currents.push({ node: forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos),
                                        nChild: dataNodes[key][i].before.nChild,
                                        treeRaw: dataNodes[key][i].before.treeRaw});
                    }else{
                        var tree = forest.pushTree(key);   
                        tree.Import.root(dataNodes[key][i].before.treeRaw);
                        subNodes.push(tree.getRootNode());
                    }
                }
            }

            for(var i = 0; i < currents.length; ++i){
                var parent = currents[i].node;
                subNodes.push(parent.getTree().Import.addChild(currents[i].nChild, parent, currents[i].treeRaw));
            }
            return subNodes;
        },

        expand: function(dataNodes){
            var subNodes = [];
            for(var key in dataNodes){
                for(var i = dataNodes[key].length - 1; i >= 0; --i){
                    var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                    node.getTree().expand(node);
                    subNodes.push(node);
                }
            }
            return subNodes;
        },

        cut: function(dataNodes){
            var subNodes = [];
            if(dataNodes[0].before.nChild !== null){
                var parent = forest.getNodeByCanvasIdPos(dataNodes[0].canvasId, dataNodes[0].current.pos);
                subNodes.push(parent.getTree().Import.addChild(dataNodes[0].before.nChild, parent, dataNodes[0].before.treeRaw));   
            }else{
                var tree = forest.pushTree(dataNodes[0].canvasId);   
                tree.Import.root(dataNodes[0].before.treeRaw);
                subNodes.push(tree.getRootNode());
            }
            return subNodes;
        },

        paste: function(dataNodes){
            var subNodes = [];
            for(var key in dataNodes){
                var nodes = [], treeRaws = [];
                for(var i = 0; i < dataNodes[key].length; ++i){
                    var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                    nodes.push(node);
                    if(dataNodes[key][i].before.treeRaw !== undefined){
                        treeRaws.push(dataNodes[key][i].before.treeRaw);
                        subNodes.push(node);
                    }
                }
                if(treeRaws.length === 0){
                    forest.removeTree(nodes[0].getTree());
                    nodes[0].getTree().remove(nodes[0]);
                }else{
                    nodes[0].getTree().Import.addSelfs(nodes, treeRaws);
                }
            }
            return subNodes;
        },

        translate: function(dataNodes){
            var subNodes = [];
            for(var key in dataNodes){
                var tree = forest.getTreeByCanvasId(key);
                tree.Translate.byPos(dataNodes[key].before.pos);
                subNodes.push(tree.getRootNode());
            }
            return subNodes;
        },

        ResizeNode: {
            width: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [], widths = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                        nodes.push(node);
                        widths.push(dataNodes[key][i].before.width);
                        subNodes.push(node);
                    }
                    nodes[0].getTree().ResizeNode.widths(nodes, widths);
                }
                return subNodes;
            },

            height: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [], heights = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                        nodes.push(node);
                        heights.push(dataNodes[key][i].before.height);
                        subNodes.push(node);
                    }
                    nodes[0].getTree().ResizeNode.heights(nodes, heights);
                }
                return subNodes;
            },

            lineWidthNode: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [], lineWidths = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                        nodes.push(node);
                        lineWidths.push(dataNodes[key][i].before.lineWidth);
                        subNodes.push(node);
                    }
                    nodes[0].getTree().ResizeNode.lineWidthNodes(nodes, lineWidths);
                }
                return subNodes;
            },

            lineWidthEdge: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [], lineWidths = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                        nodes.push(node);
                        lineWidths.push(dataNodes[key][i].before.lineWidth);
                        subNodes.push(node);
                    }
                    nodes[0].getTree().ResizeNode.lineWidthEdges(nodes, lineWidths);
                }
                return subNodes;
            }
        },

        resizeTree: function(dataNodes){
            var subNodes = [];
            for(var key in dataNodes){
                var tree = forest.getTreeByCanvasId(key);
                tree.ResizeTree.resize(tree.bBTree.width, dataNodes[key].before.bBTree.width);
                tree.Translate.byPos(dataNodes[key].before.rootNodePos);
                subNodes.push(tree.getRootNode());
            }
            return subNodes;    
        },

        ResizeMargin: {
            top: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var tree = forest.getTreeByCanvasId(key);
                    tree.ResizeMargin.top(dataNodes[key].before.marginTop);
                    subNodes.push(tree.getRootNode());
                }
                return subNodes;
            },

            left: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var tree = forest.getTreeByCanvasId(key);
                    tree.ResizeMargin.left(dataNodes[key].before.marginLeft);
                    subNodes.push(tree.getRootNode());
                }
                return subNodes;
            }
        },

        Style: {
            shape: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [], shapes = [], widths = [], heights = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                        nodes.push(node);
                        shapes.push(dataNodes[key][i].before.shape);
                        widths.push(dataNodes[key][i].before.width);
                        heights.push(dataNodes[key][i].before.height);
                        subNodes.push(node);   
                    }
                    nodes[0].getTree().Style.shapes(nodes, shapes, widths, heights);
                }
                return subNodes;
            },

            Color: {
                fillStyleNode: function(dataNodes){
                    var subNodes = [];
                    for(var key in dataNodes){
                        var nodes = [], fillStyles = [];
                        for(var i = 0; i < dataNodes[key].length; ++i){
                            var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                            nodes.push(node);
                            fillStyles.push(dataNodes[key][i].before.fillStyle);
                            subNodes.push(node);   
                        }
                        nodes[0].getTree().Style.Color.fillStyleNodes(nodes, fillStyles);
                    }
                    return subNodes;
                },

                strokeStyleNode: function(dataNodes){
                    var subNodes = [];
                    for(var key in dataNodes){
                        var nodes = [], strokeStyles = [];
                        for(var i = 0; i < dataNodes[key].length; ++i){
                            var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                            nodes.push(node);
                            strokeStyles.push(dataNodes[key][i].before.strokeStyle);
                            subNodes.push(node);   
                        }
                        nodes[0].getTree().Style.Color.strokeStyleNodes(nodes, strokeStyles);
                    }
                    return subNodes;
                },

                strokeStyleEdge: function(dataNodes){
                    var subNodes = [];
                    for(var key in dataNodes){
                        var nodes = [], strokeStyles = [];
                        for(var i = 0; i < dataNodes[key].length; ++i){
                            var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                            nodes.push(node);
                            strokeStyles.push(dataNodes[key][i].before.strokeStyle);
                            subNodes.push(node);   
                        }
                        nodes[0].getTree().Style.Color.strokeStyleEdges(nodes, strokeStyles);
                    }
                    return subNodes;
                },
            },

            LineDash: {
                node: function(dataNodes){
                    var subNodes = [];
                    for(var key in dataNodes){
                        var nodes = [], lineDashes = [], lineWidths = [];
                        for(var i = 0; i < dataNodes[key].length; ++i){
                            var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].lineDash.current.pos);
                            nodes.push(node);
                            lineDashes.push(dataNodes[key][i].lineDash.before.lineDash);
                            lineWidths.push(dataNodes[key][i].lineWidth.before.lineWidth);
                            subNodes.push(node);   
                        }
                        nodes[0].getTree().ResizeNode.lineWidthNodes(nodes, lineWidths);
                        nodes[0].getTree().Style.LineDash.lineDashNodes(nodes, lineDashes);
                    }
                    return subNodes;
                },

                edge: function(dataNodes){
                    var subNodes = [];
                    for(var key in dataNodes){
                        var nodes = [], lineDashes = [];
                        for(var i = 0; i < dataNodes[key].length; ++i){
                            var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                            nodes.push(node);
                            lineDashes.push(dataNodes[key][i].before.lineDash);
                            subNodes.push(node);   
                        }
                        nodes[0].getTree().Style.LineDash.lineDashEdges(nodes, lineDashes);
                    }
                    return subNodes;
                },
            },
        },

        Text: {
            nameNode: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [], nameNodes = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                        nodes.push(node); 
                        nameNodes.push(dataNodes[key][i].before.nameNode);
                        subNodes.push(node);
                    }
                    nodes[0].getTree().Text.nameNodes(nodes, nameNodes);
                }
                return subNodes;
            },

            nameEdge: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [], nameEdges = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                        nodes.push(node);
                        nameEdges.push(dataNodes[key][i].before.nameEdge);
                        subNodes.push(node);
                    }
                    nodes[0].getTree().Text.nameEdges(nodes, nameEdges);
                }
                return subNodes;
            },

            opcional: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [], opcionals = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].current.pos);
                        nodes.push(node);
                        opcionals.push(dataNodes[key][i].before.opcional);
                        subNodes.push(node);
                    }
                    nodes[0].getTree().Text.opcionals(nodes, opcionals);
                }
                return subNodes;
            }
        }
    };

    var RedoRecord = {
        Add: { 
            root: function(dataNodes){
                var tree = forest.pushTree(dataNodes[0].canvasId);   
                if(dataNodes[0].instance === 'Binary')
                    return [tree.Add.rootBinary(dataNodes[0].pos)];
                else
                    return [tree.Add.root(dataNodes[0].pos)];
            },

            child: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                        nodes.push(node);
                        subNodes.push(node);
                    }
                    nodes[0].getTree().Add.children(nodes);
                }
                return subNodes;
            },

            left: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                        nodes.push(node);
                        subNodes.push(node);
                    }
                    node.getTree().Add.lefts(nodes);
                }
                return subNodes;
            },

            right: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                        nodes.push(node);
                        subNodes.push(node);
                    }
                    node.getTree().Add.rights(nodes);
                }
                return subNodes;
            },
        },

        remove: function(dataNodes){
            var subNodes = [];
            for(var key in dataNodes){
                var nodes = [];
                for(var i = 0; i < dataNodes[key].length; ++i){
                    var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                    if(!node.parent)
                        forest.removeTree(node.getTree());
                    nodes.push(node);
                }
                nodes[0].getTree().removes(nodes);
            }
            return subNodes;
        },

        expand: function(dataNodes){
            var subNodes = [];
            for(var key in dataNodes){
                for(var i = 0; i < dataNodes[key].length; ++i){
                    var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                    node.getTree().expand(node);
                    subNodes.push(node);
                }
            }
            return subNodes;
        },

        cut: function(dataNodes){
            var node = forest.getNodeByCanvasIdPos(dataNodes[0].canvasId, dataNodes[0].before.pos);
            if(!node.parent)
                forest.removeTree(node.getTree());
            node.getTree().remove(node);
            return [];
        },

        paste: function(dataNodes){
            var subNodes = [];
            for(var key in dataNodes){
                var nodes = [], treeRaws = [];
                for(var i = 0; i < dataNodes[key].length; ++i){
                    var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                    if(node){
                        nodes.push(node);
                        treeRaws.push(dataNodes[key][i].current.treeRaw);
                        subNodes.push(node);
                    }
                }
                if(nodes.length === 0){
                    var tree = forest.pushTree(key);   
                    subNodes.push(tree.Import.root(dataNodes[key][0].current.treeRaw));
                }else{
                    nodes[0].getTree().Import.addSelfs(nodes, treeRaws);
                }
            }
            return subNodes;
        },

        translate: function(dataNodes){
            var subNodes = [];
            for(var key in dataNodes){
                var tree = forest.getTreeByCanvasId(key);
                tree.Translate.byPos(dataNodes[key].current.pos);
                subNodes.push(tree.getRootNode());
            }
            return subNodes;
        },

        ResizeNode: {
            width: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [], widths = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                        nodes.push(node);
                        widths.push(dataNodes[key][i].current.width);
                        subNodes.push(node);
                    }
                    nodes[0].getTree().ResizeNode.widths(nodes, widths);
                }
                return subNodes;
            },

            height: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [], heights = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                        nodes.push(node);
                        heights.push(dataNodes[key][i].current.height);
                        subNodes.push(node);
                    }
                    nodes[0].getTree().ResizeNode.heights(nodes, heights);
                }
                return subNodes;
            },

            lineWidthNode: function(dataNodes){ 
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [], lineWidths = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                        nodes.push(node);
                        lineWidths.push(dataNodes[key][i].current.lineWidth);
                        subNodes.push(node);
                    }
                    nodes[0].getTree().ResizeNode.lineWidthNodes(nodes, lineWidths);
                }
                return subNodes;
            },

            lineWidthEdge: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [], lineWidths = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                        nodes.push(node);
                        lineWidths.push(dataNodes[key][i].current.lineWidth);
                        subNodes.push(node);
                    }
                    nodes[0].getTree().ResizeNode.lineWidthEdges(nodes, lineWidths);
                }
                return subNodes;
            }
        },

        resizeTree: function(dataNodes){
            var subNodes = [];
            for(var key in dataNodes){
                var tree = forest.getTreeByCanvasId(key);
                tree.ResizeTree.resize(tree.bBTree.width, dataNodes[key].current.bBTree.width);
                tree.Translate.byPos(dataNodes[key].current.rootNodePos);
                subNodes.push(tree.getRootNode());
            }  
            return subNodes;  
        },

        ResizeMargin: {
            top: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var tree = forest.getTreeByCanvasId(key);
                    tree.ResizeMargin.top(dataNodes[key].current.marginTop);
                    subNodes.push(tree.getRootNode());
                }
                return subNodes;
            },

            left: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var tree = forest.getTreeByCanvasId(key);
                    tree.ResizeMargin.left(dataNodes[key].current.marginLeft);
                    subNodes.push(tree.getRootNode());
                }
                return subNodes;
            }
        },

        Style: {
            shape: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [], shapes = [], widths = [], heights = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                        nodes.push(node);
                        shapes.push(dataNodes[key][i].current.shape);
                        widths.push(dataNodes[key][i].current.width);
                        heights.push(dataNodes[key][i].current.height);
                        subNodes.push(node);   
                    }
                    nodes[0].getTree().Style.shapes(nodes, shapes, widths, heights);
                }
                return subNodes;
            },

            Color: {
                fillStyleNode: function(dataNodes){
                    var subNodes = [];
                    for(var key in dataNodes){
                        var nodes = [], fillStyles = [];
                        for(var i = 0; i < dataNodes[key].length; ++i){
                            var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                            nodes.push(node);
                            fillStyles.push(dataNodes[key][i].current.fillStyle);
                            subNodes.push(node);   
                        }
                        nodes[0].getTree().Style.Color.fillStyleNodes(nodes, fillStyles);
                    }  
                    return subNodes;
                },

                strokeStyleNode: function(dataNodes){
                    var subNodes = [];
                    for(var key in dataNodes){
                        var nodes = [], strokeStyles = [];
                        for(var i = 0; i < dataNodes[key].length; ++i){
                            var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                            nodes.push(node);
                            strokeStyles.push(dataNodes[key][i].current.strokeStyle);
                            subNodes.push(node);   
                        }
                        nodes[0].getTree().Style.Color.strokeStyleNodes(nodes, strokeStyles);
                    }
                    return subNodes;
                },

                strokeStyleEdge: function(dataNodes){
                    var subNodes = [];
                    for(var key in dataNodes){
                        var nodes = [], strokeStyles = [];
                        for(var i = 0; i < dataNodes[key].length; ++i){
                            var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                            nodes.push(node);
                            strokeStyles.push(dataNodes[key][i].current.strokeStyle);
                            subNodes.push(node);   
                        }
                        nodes[0].getTree().Style.Color.strokeStyleEdges(nodes, strokeStyles);
                    }
                    return subNodes;
                },
            },

            LineDash: {
                node: function(dataNodes){
                    var subNodes = [];
                    for(var key in dataNodes){
                        var nodes = [], lineDashes = [], lineWidths = [];
                        for(var i = 0; i < dataNodes[key].length; ++i){
                            var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].lineDash.before.pos);
                            nodes.push(node);
                            lineDashes.push(dataNodes[key][i].lineDash.current.lineDash);
                            lineWidths.push(dataNodes[key][i].lineWidth.current.lineWidth);
                            subNodes.push(node);   
                        }
                        nodes[0].getTree().Style.LineDash.lineDashNodes(nodes, lineDashes);
                        nodes[0].getTree().ResizeNode.lineWidthNodes(nodes, lineWidths);
                    }
                    return subNodes;
                },

                edge: function(dataNodes){
                    var subNodes = [];
                    for(var key in dataNodes){
                        var nodes = [], lineDashes = [];
                        for(var i = 0; i < dataNodes[key].length; ++i){
                            var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                            nodes.push(node);
                            lineDashes.push(dataNodes[key][i].current.lineDash);
                            subNodes.push(node);   
                        }
                        nodes[0].getTree().Style.LineDash.lineDashEdges(nodes, lineDashes);
                    }
                    return subNodes;
                },
            }
        },

        Text: {
            nameNode: function(dataNodes){
                var subNodes = []; 
                for(var key in dataNodes){
                    var nodes = [], nameNodes = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                        nodes.push(node);
                        nameNodes.push(dataNodes[key][i].current.nameNode);
                        subNodes.push(node);
                    }
                    nodes[0].getTree().Text.nameNodes(nodes, nameNodes);
                }
                return subNodes;
            },

            nameEdge: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [], nameEdges = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                        nodes.push(node);
                        nameEdges.push(dataNodes[key][i].current.nameEdge);
                        (node);
                    }
                    nodes[0].getTree().Text.nameEdges(nodes, nameEdges);
                }
                return subNodes;
            },

            opcional: function(dataNodes){
                var subNodes = [];
                for(var key in dataNodes){
                    var nodes = [], opcionals = [];
                    for(var i = 0; i < dataNodes[key].length; ++i){
                        var node = forest.getNodeByCanvasIdPos(key, dataNodes[key][i].before.pos);
                        nodes.push(node);
                        opcionals.push(dataNodes[key][i].current.opcional);
                        subNodes.push(node);
                    }
                    nodes[0].getTree().Text.opcionals(nodes, opcionals);
                }
                return subNodes;
            }
        }
    };

    this.undo = function(){ 
        if(iCurrent > -1){
            var command = records[iCurrent].command, subNodes;
            if(command === 'addRoot')
                subNodes = UndoRecord.Add.root(records[iCurrent].dataNodes);
            else if(command === 'addChild')
                subNodes = UndoRecord.Add.child(records[iCurrent].dataNodes);
            else if(command === 'addLeft')
                subNodes = UndoRecord.Add.left(records[iCurrent].dataNodes);
            else if(command === 'addRight')
                subNodes = UndoRecord.Add.right(records[iCurrent].dataNodes);
            else if(command === 'remove')
                subNodes = UndoRecord.remove(records[iCurrent].dataNodes);
            else if(command === 'expand')
                subNodes = UndoRecord.expand(records[iCurrent].dataNodes);
            else if(command === 'cut')
                subNodes = UndoRecord.cut(records[iCurrent].dataNodes);
            else if(command === 'paste')
                subNodes = UndoRecord.paste(records[iCurrent].dataNodes);
            else if(command === 'translate')
                subNodes = UndoRecord.translate(records[iCurrent].dataNodes);
            else if(command === 'resizeNodeLineWidthNode')
                subNodes = UndoRecord.ResizeNode.lineWidthNode(records[iCurrent].dataNodes);
            else if(command === 'resizeNodeLineWidthEdge')
                subNodes = UndoRecord.ResizeNode.lineWidthEdge(records[iCurrent].dataNodes);
            else if(command === 'resizeNodeWidth')
                subNodes = UndoRecord.ResizeNode.width(records[iCurrent].dataNodes);
            else if(command === 'resizeNodeHeight')
                subNodes = UndoRecord.ResizeNode.height(records[iCurrent].dataNodes);
            else if(command === 'resizeTree')
                subNodes = UndoRecord.resizeTree(records[iCurrent].dataNodes);
            else if(command === 'resizeMarginTop')
                subNodes = UndoRecord.ResizeMargin.top(records[iCurrent].dataNodes);
            else if(command === 'resizeMarginLeft')
                subNodes = UndoRecord.ResizeMargin.left(records[iCurrent].dataNodes);
            else if(command === 'styleShape')
                subNodes = UndoRecord.Style.shape(records[iCurrent].dataNodes);
            else if(command === 'styleFillNode')
                subNodes = UndoRecord.Style.Color.fillStyleNode(records[iCurrent].dataNodes);
            else if(command === 'styleStrokeNode')
                subNodes = UndoRecord.Style.Color.strokeStyleNode(records[iCurrent].dataNodes);
            else if(command === 'styleStrokeEdge')
                subNodes = UndoRecord.Style.Color.strokeStyleEdge(records[iCurrent].dataNodes);
            else if(command === 'styleLineDashEdge')
                subNodes = UndoRecord.Style.LineDash.edge(records[iCurrent].dataNodes);
            else if(command === 'styleLineDashNode')
                subNodes = UndoRecord.Style.LineDash.node(records[iCurrent].dataNodes);
            else if(command === 'textNameNode')
                subNodes = UndoRecord.Text.nameNode(records[iCurrent].dataNodes);
            else if(command === 'textNameEdge')
                subNodes = UndoRecord.Text.nameEdge(records[iCurrent].dataNodes);
            else if(command === 'textOpcional')
                subNodes = UndoRecord.Text.opcional(records[iCurrent].dataNodes);

            --iCurrent;
            return subNodes;
        }
        return null;
    };

    this.redo = function(){ 
        if(iCurrent < records.length - 1){
            ++iCurrent;

            var command = records[iCurrent].command, subNodes;
            if(command === 'addRoot')
                subNodes = RedoRecord.Add.root(records[iCurrent].dataNodes);
            else if(command === 'addChild')
                subNodes = RedoRecord.Add.child(records[iCurrent].dataNodes);
            else if(command === 'addLeft')
                subNodes = RedoRecord.Add.left(records[iCurrent].dataNodes);
            else if(command === 'addRight')
                subNodes = RedoRecord.Add.right(records[iCurrent].dataNodes);
            else if(command === 'remove')
                subNodes = RedoRecord.remove(records[iCurrent].dataNodes);
            else if(command === 'expand')
                subNodes = RedoRecord.expand(records[iCurrent].dataNodes);
            else if(command === 'cut')
                subNodes = RedoRecord.cut(records[iCurrent].dataNodes);
            else if(command === 'paste')
                subNodes = RedoRecord.paste(records[iCurrent].dataNodes);
            else if(command === 'translate')
                subNodes = RedoRecord.translate(records[iCurrent].dataNodes);
            else if(command === 'resizeNodeLineWidthNode')
                subNodes = RedoRecord.ResizeNode.lineWidthNode(records[iCurrent].dataNodes);
            else if(command === 'resizeNodeLineWidthEdge')
                subNodes = RedoRecord.ResizeNode.lineWidthEdge(records[iCurrent].dataNodes);
            else if(command === 'resizeNodeWidth')
                subNodes = RedoRecord.ResizeNode.width(records[iCurrent].dataNodes);
            else if(command === 'resizeNodeHeight')
                subNodes = RedoRecord.ResizeNode.height(records[iCurrent].dataNodes);
            else if(command === 'resizeTree')
                subNodes = RedoRecord.resizeTree(records[iCurrent].dataNodes);
            else if(command === 'resizeMarginTop')
                subNodes = RedoRecord.ResizeMargin.top(records[iCurrent].dataNodes);
            else if(command === 'resizeMarginLeft')
                subNodes = RedoRecord.ResizeMargin.left(records[iCurrent].dataNodes);
            else if(command === 'styleShape')
                subNodes = RedoRecord.Style.shape(records[iCurrent].dataNodes);
            else if(command === 'styleFillNode')
                subNodes = RedoRecord.Style.Color.fillStyleNode(records[iCurrent].dataNodes);
            else if(command === 'styleStrokeNode')
                subNodes = RedoRecord.Style.Color.strokeStyleNode(records[iCurrent].dataNodes);
            else if(command === 'styleStrokeEdge')
                subNodes = RedoRecord.Style.Color.strokeStyleEdge(records[iCurrent].dataNodes);
            else if(command === 'styleLineDashEdge')
                subNodes = RedoRecord.Style.LineDash.edge(records[iCurrent].dataNodes);
            else if(command === 'styleLineDashNode')
                subNodes = RedoRecord.Style.LineDash.node(records[iCurrent].dataNodes);
            else if(command === 'textNameNode')
                subNodes = RedoRecord.Text.nameNode(records[iCurrent].dataNodes);
            else if(command === 'textNameEdge')
                subNodes = RedoRecord.Text.nameEdge(records[iCurrent].dataNodes);
            else if(command === 'textOpcional')
                subNodes = RedoRecord.Text.opcional(records[iCurrent].dataNodes);

            return subNodes;
        }
        return null;
    };
};