/*
 * Tree graph with HTML5 and JavaScript.
 * Date: 2015.
 * Dependencies: none
 *
 * Copyright (c) 2015 Yenny Fung Guan
 */

var ExportToLatex = function(){
    function getTabs(node){
        var tabs = "";
        for(var i = 0; i < node.depth; ++i)
            tabs += "\t";
        return tabs;
    }

    function getColor(rgb){
        /*rgb = rgb.substring(4, rgb.length-1)
                 .replace(/ /g, '')
                 .split(',');
        console.log(rgb);*/

        if(rgb === 'rgb(125, 222, 235)')
            return "cyan";
        else if(rgb === 'rgb(232, 70, 70)')
            return "red";
        else if(rgb === 'rgb(255, 228, 79)')
            return "yellow";
        else if(rgb === 'rgb(49, 194, 104)')
            return "green";
        else if(rgb === 'rgb(0, 0, 0)')
            return "black";  
        return "white";  
    }

    this.exportPstTree = function(){
        function getStyleNode(node){
            function fillColor (node){
                return  "fillcolor=" + getColor(node.style.sNode.fillStyle) + ", ";
            }

            function lineDash(node){
                if(node.style.sNode.lineWidth > 0){
                    if(node.style.sNode.lineDash.length > 0)
                        return "linestyle=dashed, ";    
                    else
                        return "linestyle=solid, ";
                }
                return "linestyle=none, ";
            }

            function lineColor (node){
                if(node.style.sNode.lineWidth > 0)
                    return  "linecolor=" + getColor(node.style.sNode.strokeStyle);
                return  "";
            }
            
            return "[" + fillColor(node) + lineDash(node) + lineColor(node) + "]";
        }

        function getStyleEdge(node){
            function lineDash(node){
                if(node.style.sEdge.lineWidth > 0){
                    if(node.style.sEdge.lineDash.length > 0)
                        return "linestyle=dashed, "; 
                    else
                        return "linestyle=solid, "; 
                }  
                return "linestyle=none, ";
            }

            function lineColor (node){
                if(node.style.sEdge.lineWidth > 0)
                    return  "linecolor=" + getColor(node.style.sEdge.strokeStyle);
                return  "";
            }

            return "{" + lineDash(node) + lineColor(node) + "}";
        }  

        function getNameNode(node){
            if(node.text.nameNode) 
                return "{"+ node.text.nameNode +"}"; 
            return "{}";
        }

        function getNameEdge(node){
            if(node.text.nameEdge && node.parent){ 
                var x = (node.bB.bNode.x - node.parent.bB.bNode.x) / 2 ;
                if(x <= 0)  // left side
                    return "\u005Ctlput{"+ node.text.nameEdge +"}"; 
                else
                    return "\u005Ctrput{"+ node.text.nameEdge +"}"; 
            }
            return "";
        }

        function getTree(node){
            var styleNode = getStyleNode(node);
            var styleEdge = getStyleEdge(node);
            var nameNode = getNameNode(node);
            var nameEdge = getNameEdge(node);

            //if(node.style.sNode.lineWidth === 0)
            //    return "\u005CTR" + style + nameNode;
            if(node.style.sNode.shape === 'arc')
                return "\u005Cpsset" + styleEdge + "\u005CTcircle" + styleNode + nameNode + nameEdge;
            else if(node.style.sNode.shape === 'rect')
                return "\u005Cpsset" + styleEdge + "\u005CTr{\u005Cpsframebox" + styleNode + nameNode + nameEdge + "}";
        };

        var buildTree = function(node){
            var doc = "";
            for(var i = 0; i < node.children.length; ++i)
                doc += buildTree(node.children[i]);
            
            var tabs = getTabs(node);
            var tree = getTree(node);
            return "\n"+ tabs +"\u005Cpstree{"+ tree +"}{"+ doc + "\n"+ tabs +"}";
        };

        var buildTreeBinary = function(node){
            var doc = "";
            for(var i = 0; i < node.children.length; ++i)
                doc += buildTreeBinary(node.children[i]);

            if(node.children.length === 1){
                var tabs = getTabs(node.children[0]);
                if(node.children[0].side === 'left')
                    doc = doc + "\n"+ tabs +"\u005CTn";
                else if(node.children[0].side === 'right')
                    doc = "\n"+ tabs +"\u005CTn" + doc;
            }

            var tabs = getTabs(node);
            var tree = getTree(node);
            return "\n"+ tabs +"\u005Cpstree{"+ tree +"}{"+ doc + "\n"+ tabs +"}";
        };

        /* PStricks info - http://www.essex.ac.uk/linguistics/external/clmt/latex4ling/trees/pstrees/
                            http://matematicas.uis.edu.co/~mruedapu/latex/10.%20Utilerias%20de%20latex/Libros/Universo.pdf
                  a
                 / \
               1/   \2
               /     \
              b       c
            \documentclass{standalone}
            \usepackage{pst-tree}
            \begin{document}
            \psset{fillstyle=solid}
            \pstree{\Tcircle{a}}{
                \Tcircle{b}\tlput{1}
                \Tcircle{c}\trput{2}
            }
            \end{document}
        */

        var rootNode = this.getRootNode();
        if(rootNode instanceof Binary)
            var tree = buildTreeBinary(rootNode);
        else
            var tree = buildTree(rootNode);
            
        return "\u005Cdocumentclass{standalone}" + 
        "\n" + "\u005Cusepackage{pst-tree}" + 
        "\n\n" + "\u005Cbegin{document}" + 
        "\n" + "\u005Cpsset{fillstyle=solid}" + 
        "\n" + tree +
        "\n\n" + "\u005Cend{document}"; 
    };
};



/*
 * Tree graph with HTML5 and JavaScript.
 * Date: 2015.
 * Dependencies: sourceStyle.js, tree.js, exportToLatex.js
 *
 * Copyright (c) 2015 Yenny Fung Guan
 */

var Tree = function(canvasId, eWorkspace){
    var self = this;
    var canvas;
    var context;
    var rootNode;
    var rootNodePos;
    var visibleMatrix = [];

    this.bBTree = {
        xMin: undefined, yMin: undefined, xMax: undefined, yMax: undefined, 
        width: undefined, height: undefined
    };

    this.style = {
        marginLeft: 10, marginTop: Tree.source.marginTop, 
        fontSize: Tree.source.fontSize,
    };

    var __construct = function(that) {
        canvas = document.createElement('canvas');
        canvas.setAttribute("id", canvasId);
        canvas.width = eWorkspace.clientWidth;   
        canvas.height = eWorkspace.clientHeight;
        canvas.setAttribute("style", "z-index: -1");
        context = canvas.getContext("2d");
        context.mozImageSmoothingEnabled = false;
        context.msImageSmoothingEnabled = false;
        context.imageSmoothingEnabled = false;
    }(this);

    this.resize = function(){
        canvas.width = eWorkspace.clientWidth;   
        canvas.height = eWorkspace.clientHeight;
        Render.draw();
    };

    this.getCanvas = function(){
        return canvas;
    };

    this.getCanvasId = function(){
        return canvasId;
    };

    this.getContext = function(){
        return context;
    };

    this.getVisibleMatrix = function(){
        return visibleMatrix;
    };

    this.getRootNode = function(){
        return rootNode;
    };

    this.getRootNodePos = function(){
        return rootNodePos;
    };

    this.Add = {
        root: function(pos){
            rootNodePos = {x: pos.x, y: pos.y};
            rootNode = new Node({tree: self});
            VisibleMatrix.addNode(rootNode);
            CalcPosition.vertical();
            self.Translate.toRootNodePos();
            Render.draw();
            return rootNode;
        },

        rootBinary: function(pos){ 
            rootNodePos = {x: pos.x, y: pos.y};
            rootNode = new Binary({tree: self});
            VisibleMatrix.addNode(rootNode);
            CalcPosition.vertical();
            self.Translate.toRootNodePos();
            Render.draw();
            return rootNode;
        },

        children: function(nodes){
            var nodesAux = [];
            for(var i = 0; i < nodes.length; ++i){
                var node = nodes[i];
                if(!node.expand)
                    node.toogleExpand();
                node = node.addChild({bB: JSON.parse(JSON.stringify(node.bB)), style: JSON.parse(JSON.stringify(node.style))});
                if(node)
                    VisibleMatrix.addNode(node);
                nodesAux.push(node);
            }
            Render.clear();
            CalcPosition.vertical();
            self.Translate.toRootNodePos();
            Render.draw();
            return nodesAux;
        },

        lefts: function(nodes){
            var nodesAux = [];
            for(var i = 0; i < nodes.length; ++i){
                var node = nodes[i];
                if(node instanceof Binary){
                    if(!node.expand)
                        node.toogleExpand();
                    node = node.addLeft({bB: JSON.parse(JSON.stringify(node.bB)), style: JSON.parse(JSON.stringify(node.style))});
                }else{
                    if(node.parent)
                        node = node.addLeft({bB: JSON.parse(JSON.stringify(node.parent.bB)), style: JSON.parse(JSON.stringify(node.parent.style))});    
                    else
                        node = null;
                }
                if(node)   
                    VisibleMatrix.addNode(node);
                nodesAux.push(node);
            }
            Render.clear();
            CalcPosition.vertical();
            self.Translate.toRootNodePos();
            Render.draw();
            return nodesAux;
        },

        rights: function(nodes){
            var nodesAux = [];
            for(var i = 0; i < nodes.length; ++i){
                var node = nodes[i];
                if(node instanceof Binary){
                    if(!node.expand)
                        node.toogleExpand();
                    node = node.addRight({bB: JSON.parse(JSON.stringify(node.bB)), style: JSON.parse(JSON.stringify(node.style))});
                }else{
                    if(node.parent)
                        node = node.addRight({bB: JSON.parse(JSON.stringify(node.parent.bB)), style: JSON.parse(JSON.stringify(node.parent.style))});    
                    else
                        node = null;
                }
                if(node)
                    VisibleMatrix.addNode(node);
                nodesAux.push(node);    
            }
            Render.clear();
            CalcPosition.vertical();
            self.Translate.toRootNodePos();
            Render.draw();
            return nodesAux;
        },
    };

    this.removes = function(nodes){
        Render.clear();
        for(var i = 0; i < nodes.length; ++i){
            var node = nodes[i];
            if(node.parent){        
                node.remove();    
                VisibleMatrix.removeNode(node);
            }else{
                node.remove();
                context = undefined;
                self = undefined;
                rootNode;
                rootNodePos = undefined;
                visibleMatrix = undefined;            
                delete this.bBTree;
                delete this.style;
                return;
            }
        }
        CalcPosition.vertical();  
        this.Translate.toRootNodePos();    
        Render.draw();
    };

    this.remove = function(node){
        Render.clear();
        if(node.parent){        
            node.remove();    
            VisibleMatrix.removeNode(node);
            CalcPosition.vertical();  
            this.Translate.toRootNodePos();    
            Render.draw();
        }else{
            node.remove();
            context = undefined;
            self = undefined;
            rootNode = undefined;
            rootNodePos = undefined;
            visibleMatrix = undefined;            
            delete this.bBTree;
            delete this.style;
        }
    };

    this.expand = function(node){
        if(node.children.length > 0 && node.render){
            node.toogleExpand();
            Render.clear();  
            CalcPosition.vertical(); 
            self.Translate.toRootNodePos();   
            Render.draw();
            return node;
        }
        return null;
    };

    this.cut = function(node){
        var treeRaw = this.Export.original(node);
        this.remove(node);
        return treeRaw;
    };

    this.Export = {
        original: function(node){
            var treeRaw = { 
                rootNodePos: {x: node.bB.bNode.x, y: node.bB.bNode.y}, 
                style: JSON.parse(JSON.stringify(self.style)),
                rootNode: node.export()
            };
            return treeRaw;
        },

        png: function(){
            // copia el estado original
            var widthBackup = context.canvas.width;
            var heightBackup = context.canvas.height;
            var rootNodePosBackup = {x: rootNodePos.x, y: rootNodePos.y};
            var tempExpanded = [];
            var tempRender = [];

            for(var i = 0; i<Object.keys(visibleMatrix).length; ++i)
                for(var j = 0; j<visibleMatrix[i].length; ++j){
                    var node = visibleMatrix[i][j];
                    if(!node.expand){
                        node.expand = true;
                        tempExpanded.push(node);
                    }
                    if(!node.render){
                        node.render = true;
                        tempRender.push(node);
                    }
                }

            // cálculo de la posicón del árbol sin contracciones
            CalcPosition.vertical();
            // posicionar el árbol en la esquina superior izquierda
            rootNodePos = {x: rootNode.bB.bNode.x + 5, y: rootNode.bB.bNode.y + 5};
            if(self.bBTree.xMin < 0)
                rootNodePos.x -= self.bBTree.xMin;
            if(self.bBTree.yMin < 0)
                rootNodePos.y -= self.bBTree.yMin;
            self.Translate.toRootNodePos();

            context.canvas.width = self.bBTree.width + 10;
            context.canvas.height = self.bBTree.height + 10;
            // agrega fondo blanco
            context.fillStyle = 'rgb(255, 255, 255)';
            context.fillRect(0, 0, canvas.width, canvas.height);

            Render.draw();
            
            var img = context.canvas.toDataURL("image/png");
             // elimina fondo blanco
            context.clearRect(0, 0, canvas.width, canvas.height);

            // devuelve al estado original
            for(var i = 0; i<tempExpanded.length; ++i)
                tempExpanded[i].expand = false;
            for(var i = 0; i<tempRender.length; ++i)
                tempRender[i].render = false;
        
            rootNodePos = {x: rootNodePosBackup.x, y: rootNodePosBackup.y};
            context.canvas.width = widthBackup;
            context.canvas.height = heightBackup;
            CalcPosition.vertical();
            self.Translate.toRootNodePos();
            Render.draw();

            return img;
        },

        pstTree: function(){
            return self.exportPstTree();
        },
    };
        
    this.Import = {
        root: function(treeRaw){
            rootNodePos = {x: treeRaw.rootNodePos.x, y: treeRaw.rootNodePos.y};
            self.style = JSON.parse(JSON.stringify(treeRaw.style));

            rootNode = (treeRaw.rootNode.instance === 'Binary')? 
                new Binary({tree: self}): 
                new Node({tree: self});
            
            if(rootNode.import(treeRaw.rootNode)){
                VisibleMatrix.load();
                Render.clear();
                CalcPosition.vertical();
                self.Translate.toRootNodePos();
                Render.draw();
                return rootNode;
            }
            return null;
        },

        addSelfs: function(nodes, treeRaws){
            var nodesAux = [];
            for(var i = 0; i < nodes.length; ++i)
                nodesAux.push(nodes[i].import(treeRaws[i].rootNode));
            VisibleMatrix.load();
            Render.clear();
            CalcPosition.vertical();
            self.Translate.toRootNodePos();
            Render.draw();
            return nodesAux;
        },

        addChild: function(index, node, treeRaw){
            node = node.importAddChild(index, treeRaw.rootNode)
            if(node){
                VisibleMatrix.load();
                Render.clear();
                CalcPosition.vertical();
                self.Translate.toRootNodePos();
                Render.draw();
                return node;
            }
            return null;
        }
    };

    this.ResizeNode = {
	    widths: function(nodes, widths){ 
            for(var i = 0; i < nodes.length; ++i){
                var node = nodes[i], width = widths[i];
    	    	if(width < Node.source.sNode.widthMin)
    	            width = Node.source.sNode.widthMin;
                node.resizeWidth(width);
                if(node.style.sNode.shape === 'arc')
                   node.resizeHeight(width);
                node.resizeExpand(); 
                node.resizeFontSizeMax();
                node.fitText(context);
            }
            Render.clear();
            CalcPosition.vertical();
            self.Translate.toRootNodePos();
            Render.draw();
	    },

        heights: function(nodes, heights){
            for(var i = 0; i < nodes.length; ++i){
                var node = nodes[i], height = heights[i];
                if(height < Node.source.sNode.heightMin)
                    heights = Node.source.sNode.heightMin;
                node.resizeHeight(height);
                if(node.style.sNode.shape === 'arc')
                    node.resizeWidth(height);
                node.resizeExpand();  
                node.resizeFontSizeMax();
                node.fitText(context);
            }
            Render.clear();
            CalcPosition.vertical();
            self.Translate.toRootNodePos();
            Render.draw();
        },

        lineWidthNodes: function(nodes, lineWidths){
            for(var i = 0; i < nodes.length; ++i){
                var node = nodes[i];
                node.resizeLineWidthNode(lineWidths[i]);
                node.resizeFontSizeMax();
                node.fitText(context);
                
                if(lineWidths[i] == 0)
                    node.style.sNode.lineDash = undefined;
                else if(node.style.sNode.lineDash === undefined)
                    node.style.sNode.lineDash = [];
            }
            Render.clear();
            CalcPosition.vertical();
            self.Translate.toRootNodePos();
            Render.draw();
        },

        lineWidthEdges: function(nodes, lineWidths){
            for(var i = 0; i < nodes.length; ++i){
                var node = nodes[i], lineWidth = lineWidths[i];
                if(lineWidth < Node.source.sEdge.lineWidthMin)
                    lineWidth = Node.source.sEdge.lineWidthMin;
                node.resizeLineWidthEdge(lineWidth);
                node.resizeFontSizeMax();
                node.fitText(context);
            }
            Render.clear();
            CalcPosition.vertical();
            self.Translate.toRootNodePos();
            Render.draw();
        }
    };

	this.ResizeTree = {
    	centerRight: function(newBbTree){
            var nodeMin = self.getNodeSizeMin();
            
            if( (nodeMin.w.bB.bNode.width * newBbTree.w) / self.bBTree.width <= Node.source.sNode.widthMin ||
                (nodeMin.h.bB.bNode.height * newBbTree.w) / self.bBTree.width <= Node.source.sNode.heightMin )
                newBbTree.w = (Node.source.sNode.widthMin * self.bBTree.width) / nodeMin.w.bB.bNode.width;
            
            this.center(self.bBTree.width, newBbTree.w);
        },

        centerLeft: function(newBbTree){
            var nodeMin = self.getNodeSizeMin();

            if( (nodeMin.w.bB.bNode.width * newBbTree.w) / self.bBTree.width <= Node.source.sNode.widthMin ||
                (nodeMin.h.bB.bNode.height * newBbTree.w) / self.bBTree.width <= Node.source.sNode.heightMin )
               newBbTree.w = (Node.source.sNode.widthMin * self.bBTree.width) / nodeMin.w.bB.bNode.width;  
            
            this.center(self.bBTree.width, newBbTree.w);
        },

        centerTop: function(newBbTree){
            var nodeMin = self.getNodeSizeMin();
            
            if( (nodeMin.w.bB.bNode.width * newBbTree.h) / self.bBTree.height <= Node.source.sNode.widthMin ||
                (nodeMin.h.bB.bNode.height * newBbTree.h) / self.bBTree.height <= Node.source.sNode.heightMin )
        		newBbTree.h = (Node.source.sNode.heightMin * self.bBTree.height) / nodeMin.h.bB.bNode.height;
            
            this.center(self.bBTree.height, newBbTree.h);
        },

        centerBottom: function(newBbTree){
            var nodeMin = self.getNodeSizeMin();
           
            if( (nodeMin.w.bB.bNode.width * newBbTree.h) / self.bBTree.height <= Node.source.sNode.widthMin ||
                (nodeMin.h.bB.bNode.height * newBbTree.h) / self.bBTree.height <= Node.source.sNode.heightMin )
                newBbTree.h = (Node.source.sNode.heightMin * self.bBTree.height) / nodeMin.h.bB.bNode.height;
            
            this.center(self.bBTree.height, newBbTree.h);
        },

        centerTopLeft: function(newBbTree){
            var nodeMin = self.getNodeSizeMin();
            
            if( (nodeMin.w.bB.bNode.width * ((newBbTree.w + newBbTree.h)/2)) / ((self.bBTree.width + self.bBTree.height)/2) <= Node.source.sNode.widthMin ||
                (nodeMin.h.bB.bNode.height * ((newBbTree.w + newBbTree.h)/2)) / ((self.bBTree.width + self.bBTree.height)/2) <= Node.source.sNode.heightMin )
                newBbTree = {w: (Node.source.sNode.widthMin * self.bBTree.width) / nodeMin.w.bB.bNode.width,
                             h: (Node.source.sNode.heightMin * self.bBTree.height) / nodeMin.h.bB.bNode.height};

            this.center((self.bBTree.width + self.bBTree.height) / 2, (newBbTree.w + newBbTree.h) / 2);
        },

        centerTopRight: function(newBbTree){
            var nodeMin = self.getNodeSizeMin();
            
            if( (nodeMin.w.bB.bNode.width * ((newBbTree.w + newBbTree.h)/2)) / ((self.bBTree.width + self.bBTree.height)/2) <= Node.source.sNode.widthMin ||
                (nodeMin.h.bB.bNode.height * ((newBbTree.w + newBbTree.h)/2)) / ((self.bBTree.width + self.bBTree.height)/2) <= Node.source.sNode.heightMin )
                newBbTree = {w: (Node.source.sNode.widthMin * self.bBTree.width) / nodeMin.w.bB.bNode.width,
                             h: (Node.source.sNode.heightMin * self.bBTree.height) / nodeMin.h.bB.bNode.height};
            
            this.center((self.bBTree.width + self.bBTree.height) / 2, (newBbTree.w + newBbTree.h) / 2);
        },

        centerBottomRight: function(newBbTree){
            var nodeMin = self.getNodeSizeMin();
            
            if( (nodeMin.w.bB.bNode.width * ((newBbTree.w + newBbTree.h)/2)) / ((self.bBTree.width + self.bBTree.height)/2) <= Node.source.sNode.widthMin ||
                (nodeMin.h.bB.bNode.height * ((newBbTree.w + newBbTree.h)/2)) / ((self.bBTree.width + self.bBTree.height)/2) <= Node.source.sNode.heightMin )
                newBbTree = {w: (Node.source.sNode.widthMin * self.bBTree.width) / nodeMin.w.bB.bNode.width,
                             h: (Node.source.sNode.heightMin * self.bBTree.height) / nodeMin.h.bB.bNode.height};
            
            this.center((self.bBTree.width + self.bBTree.height) / 2, (newBbTree.w + newBbTree.h) / 2);
        },

        centerBottomLeft: function(newBbTree){
            var nodeMin = self.getNodeSizeMin();
            
            if( (nodeMin.w.bB.bNode.width * ((newBbTree.w + newBbTree.h)/2)) / ((self.bBTree.width + self.bBTree.height)/2) <= Node.source.sNode.widthMin ||
                (nodeMin.h.bB.bNode.height * ((newBbTree.w + newBbTree.h)/2)) / ((self.bBTree.width + self.bBTree.height)/2) <= Node.source.sNode.heightMin )
                newBbTree = {w: (Node.source.sNode.widthMin * self.bBTree.width) / nodeMin.w.bB.bNode.width,
                             h: (Node.source.sNode.heightMin * self.bBTree.height) / nodeMin.h.bB.bNode.height};
            
            this.center((self.bBTree.width + self.bBTree.height) / 2, (newBbTree.w + newBbTree.h) / 2);
        },

        center: function(ref, newRef){
            var backupBBTree = JSON.parse(JSON.stringify(self.bBTree));
            
            this.resize(ref, newRef);
            rootNodePos.y = (backupBBTree.yMin + backupBBTree.height / 2) - self.bBTree.height / 2 + rootNode.bB.bNode.heightOutHalf;
            self.Translate.toRootNodePos();
            Render.draw();
        },

        resize: function(ref, newRef){
            Render.clear();

            self.style.marginLeft = (self.style.marginLeft * newRef) / ref; 
            self.style.marginTop = (self.style.marginTop * newRef) / ref; 
            self.style.fontSize = Math.round((Tree.source.fontSize  * self.style.marginTop) / Tree.source.marginTop);

            for(var i = 0; i < Object.keys(visibleMatrix).length; ++i)
                for(var j = 0; j < visibleMatrix[i].length; ++j){
                    var node = visibleMatrix[i][j];
                    node.resizeWidth((node.bB.bNode.width * newRef) / ref);
                    node.resizeHeight((node.bB.bNode.height * newRef) / ref);
                    node.resizeFontSizeMax();
                    node.fitText(context);
                    node.resizeExpand();
                }
            CalcPosition.vertical();
        },

        top: function(newBbTree){
            var nodeMin = self.getNodeSizeMin();
            
            if( (nodeMin.w.bB.bNode.width * newBbTree.h) / self.bBTree.height <= Node.source.sNode.widthMin ||
                (nodeMin.h.bB.bNode.height * newBbTree.h) / self.bBTree.height <= Node.source.sNode.heightMin )
                newBbTree.h = (Node.source.sNode.heightMin * self.bBTree.height) / nodeMin.h.bB.bNode.height;

            var backupBBTree = JSON.parse(JSON.stringify(self.bBTree));        
            this.resize(self.bBTree.height, newBbTree.h);
            rootNodePos.y = backupBBTree.yMin - (self.bBTree.height - backupBBTree.height) + rootNode.bB.bNode.heightOutHalf;
            self.Translate.toRootNodePos();
            Render.draw();
        },

        bottom: function(newBbTree){
            var nodeMin = self.getNodeSizeMin();

            if( (nodeMin.w.bB.bNode.width * newBbTree.h) / self.bBTree.height <= Node.source.sNode.widthMin ||
                (nodeMin.h.bB.bNode.height * newBbTree.h) / self.bBTree.height <= Node.source.sNode.heightMin )
                newBbTree.h = (Node.source.sNode.heightMin * self.bBTree.height) / nodeMin.h.bB.bNode.height;
                
            var backupBBTree = JSON.parse(JSON.stringify(self.bBTree));
            this.resize(self.bBTree.height, newBbTree.h);
            rootNodePos.y = backupBBTree.yMin + rootNode.bB.bNode.heightOutHalf;
            self.Translate.toRootNodePos();
            Render.draw();
        },

        left: function(newBbTree){
            var nodeMin = self.getNodeSizeMin();

            if( (nodeMin.w.bB.bNode.width * newBbTree.w) / self.bBTree.width <= Node.source.sNode.widthMin ||
                (nodeMin.h.bB.bNode.height * newBbTree.w) / self.bBTree.width <= Node.source.sNode.heightMin )
                newBbTree.w = (Node.source.sNode.widthMin * self.bBTree.width) / nodeMin.w.bB.bNode.width;   

            var backupBBTree = JSON.parse(JSON.stringify(self.bBTree));
            this.resize(self.bBTree.width, newBbTree.w);
            rootNodePos.x -= (self.bBTree.width - backupBBTree.width) / 2;
            rootNodePos.y = (backupBBTree.yMin + backupBBTree.height / 2) - self.bBTree.height / 2 + rootNode.bB.bNode.heightOutHalf;
            self.Translate.toRootNodePos();
            Render.draw();
        },  

        right: function(newBbTree){
            var nodeMin = self.getNodeSizeMin();

            if( (nodeMin.w.bB.bNode.width * newBbTree.w) / self.bBTree.width <= Node.source.sNode.widthMin ||
                (nodeMin.h.bB.bNode.height * newBbTree.w) / self.bBTree.width <= Node.source.sNode.heightMin )
                newBbTree.w = (Node.source.sNode.widthMin * self.bBTree.width) / nodeMin.w.bB.bNode.width;

            var backupBBTree = JSON.parse(JSON.stringify(self.bBTree));            
            this.resize(self.bBTree.width, newBbTree.w);
            rootNodePos.x += (self.bBTree.width - backupBBTree.width) / 2;
            rootNodePos.y = (backupBBTree.yMin + backupBBTree.height / 2) - self.bBTree.height / 2 + rootNode.bB.bNode.heightOutHalf;
            self.Translate.toRootNodePos();
            Render.draw();
        },     
        
        topLeft: function(newBbTree){
            var nodeMin = self.getNodeSizeMin();
            
            if( (nodeMin.w.bB.bNode.width * ((newBbTree.w + newBbTree.h)/2)) / ((self.bBTree.width + self.bBTree.height)/2) <= Node.source.sNode.widthMin ||
                (nodeMin.h.bB.bNode.height * ((newBbTree.w + newBbTree.h)/2)) / ((self.bBTree.width + self.bBTree.height)/2) <= Node.source.sNode.heightMin )
                newBbTree = {w: (Node.source.sNode.widthMin * self.bBTree.width) / nodeMin.w.bB.bNode.width,
                             h: (Node.source.sNode.heightMin * self.bBTree.height) / nodeMin.h.bB.bNode.height};

            var backupBBTree = JSON.parse(JSON.stringify(self.bBTree));
            this.resize((self.bBTree.width + self.bBTree.height) / 2, (newBbTree.w + newBbTree.h) / 2);
            rootNodePos.x -= (self.bBTree.width - backupBBTree.width) / 2;
            rootNodePos.y = backupBBTree.yMin - (self.bBTree.height - backupBBTree.height) + rootNode.bB.bNode.heightOutHalf;
            self.Translate.toRootNodePos();
            Render.draw();
        },

        topRight: function(newBbTree){
            var nodeMin = self.getNodeSizeMin();
            
            if( (nodeMin.w.bB.bNode.width * ((newBbTree.w + newBbTree.h)/2)) / ((self.bBTree.width + self.bBTree.height)/2) <= Node.source.sNode.widthMin ||
                (nodeMin.h.bB.bNode.height * ((newBbTree.w + newBbTree.h)/2)) / ((self.bBTree.width + self.bBTree.height)/2) <= Node.source.sNode.heightMin )
                newBbTree = {w: (Node.source.sNode.widthMin * self.bBTree.width) / nodeMin.w.bB.bNode.width,
                             h: (Node.source.sNode.heightMin * self.bBTree.height) / nodeMin.h.bB.bNode.height};

            var backupBBTree = JSON.parse(JSON.stringify(self.bBTree));
            this.resize((self.bBTree.width + self.bBTree.height) / 2, (newBbTree.w + newBbTree.h) / 2);
            rootNodePos.x += (self.bBTree.width - backupBBTree.width) / 2;
            rootNodePos.y = backupBBTree.yMin - (self.bBTree.height - backupBBTree.height) + rootNode.bB.bNode.heightOutHalf;
            self.Translate.toRootNodePos();
            Render.draw();
        },

        bottomRight: function(newBbTree){
            var nodeMin = self.getNodeSizeMin();
            
            if( (nodeMin.w.bB.bNode.width * ((newBbTree.w + newBbTree.h)/2)) / ((self.bBTree.width + self.bBTree.height)/2) <= Node.source.sNode.widthMin ||
                (nodeMin.h.bB.bNode.height * ((newBbTree.w + newBbTree.h)/2)) / ((self.bBTree.width + self.bBTree.height)/2) <= Node.source.sNode.heightMin )
                newBbTree = {w: (Node.source.sNode.widthMin * self.bBTree.width) / nodeMin.w.bB.bNode.width,
                             h: (Node.source.sNode.heightMin * self.bBTree.height) / nodeMin.h.bB.bNode.height};
           
            var backupBBTree = JSON.parse(JSON.stringify(self.bBTree));
            this.resize((self.bBTree.width + self.bBTree.height) / 2, (newBbTree.w + newBbTree.h) / 2);
            rootNodePos.x += (self.bBTree.width - backupBBTree.width) / 2;
            rootNodePos.y = backupBBTree.yMin + rootNode.bB.bNode.heightOutHalf;
            self.Translate.toRootNodePos();
            Render.draw();
        },

        bottomLeft: function(newBbTree){
            var nodeMin = self.getNodeSizeMin();
            
            if( (nodeMin.w.bB.bNode.width * ((newBbTree.w + newBbTree.h)/2)) / ((self.bBTree.width + self.bBTree.height)/2) <= Node.source.sNode.widthMin ||
                (nodeMin.h.bB.bNode.height * ((newBbTree.w + newBbTree.h)/2)) / ((self.bBTree.width + self.bBTree.height)/2) <= Node.source.sNode.heightMin )
                newBbTree = {w: (Node.source.sNode.widthMin * self.bBTree.width) / nodeMin.w.bB.bNode.width,
                             h: (Node.source.sNode.heightMin * self.bBTree.height) / nodeMin.h.bB.bNode.height};
            
            var backupBBTree = JSON.parse(JSON.stringify(self.bBTree));
            this.resize((self.bBTree.width + self.bBTree.height) / 2, (newBbTree.w + newBbTree.h) / 2); 
            rootNodePos.x -= (self.bBTree.width - backupBBTree.width) / 2;
            rootNodePos.y = backupBBTree.yMin + rootNode.bB.bNode.heightOutHalf;
            self.Translate.toRootNodePos();
            Render.draw();
        }
    };

    this.ResizeMargin = {
        top: function(margin){
            Render.clear();
            self.style.marginTop = margin;
            self.style.fontSize = Math.round((Tree.source.fontSize  * margin) / Tree.source.marginTop);
            CalcPosition.vertical();
            self.Translate.toRootNodePos();
            Render.draw();
        },

        left: function(margin){
            Render.clear();
            self.style.marginLeft = margin;
            CalcPosition.vertical();
            self.Translate.toRootNodePos();
            Render.draw();
        }
    };

    this.Style = {
        shapes: function(nodes, shapes, widths, heights){
            for(var i = 0; i < nodes.length; i++){
                var node = nodes[i];
                if(shapes[i] === 'rect')
                    node.style.sNode.shape = 'rect';
                else
                    node.style.sNode.shape = 'arc';
                node.resizeWidth(widths[i]);
                node.resizeHeight(heights[i]); 
                node.resizeExpand();
                node.resizeFontSizeMax();
                node.fitText(context);
            }
            Render.clear();
            CalcPosition.vertical();
            self.Translate.toRootNodePos();
            Render.draw();
        },

        Color: {
            fillStyleNodes: function(nodes, fillStyles){ 
                for(var i = 0; i < nodes.length; i++)
                    nodes[i].style.sNode.fillStyle = fillStyles[i];
                Render.clear();
                Render.draw();
            },

            strokeStyleNodes: function(nodes, strokeStyles){
                for(var i = 0; i < nodes.length; i++)
                    nodes[i].style.sNode.strokeStyle = strokeStyles[i];
                Render.clear();
                Render.draw();
            },

            strokeStyleEdges: function(nodes, strokeStyles){
                for(var i = 0; i < nodes.length; i++)
                    nodes[i].style.sEdge.strokeStyle = strokeStyles[i];
                Render.clear();
                Render.draw();
            }
        },

        LineDash: {
            lineDashNodes: function(nodes, lineDashes){ 
                for(var i = 0; i < nodes.length; i++){
                    if(lineDashes[i] == undefined){
                        nodes[i].resizeLineWidthNode(0);
                        nodes[i].resizeFontSizeMax();
                        nodes[i].fitText(context);

                    }else if(nodes[i].style.sNode.lineDash === undefined){
                        nodes[i].resizeLineWidthNode(Node.source.sNode.lineWidth);
                        nodes[i].resizeFontSizeMax();
                        nodes[i].fitText(context);
                    }
                    nodes[i].style.sNode.lineDash = lineDashes[i];
                }
                Render.clear();
                CalcPosition.vertical();
                self.Translate.toRootNodePos();
                Render.draw();
            },

            lineDashEdges: function(nodes, lineDashes){
                for(var i = 0; i < nodes.length; i++)
                    nodes[i].style.sEdge.lineDash = lineDashes[i];
                Render.clear();
                Render.draw();
            },
        },
    };

    this.Text = {
        nameNodes: function(nodes, nameNodes){
            for(var i = 0; i < nodes.length; i++){
                nodes[i].text.nameNode = nameNodes[i];
                nodes[i].fitText(context);
            }
            Render.clear();
            Render.draw();
        },

        nameEdges: function(nodes, nameEdges){
            for(var i = 0; i < nodes.length; i++)
                nodes[i].text.nameEdge = nameEdges[i];
            Render.clear();
            Render.draw();
        },

        opcionals: function(nodes, opcionals){
            for(var i = 0; i < nodes.length; i++)
                nodes[i].text.opcional = opcionals[i];
        }
    };

    this.Translate = {
        toRootNodePos: function(){
            // refresh rootNode
            var xDiff = rootNodePos.x - rootNode.bB.bNode.x,
                yDiff = rootNodePos.y - rootNode.bB.bNode.y;
            for(var i = 0; i < Object.keys(visibleMatrix).length; ++i)
                for(var j = 0; j < visibleMatrix[i].length; ++j){
                    var node = visibleMatrix[i][j];
                    if(node.render){
                        node.bB.bNode.x += xDiff; 
                        node.bB.bNode.y += yDiff;
                    }
                }

            // refresh bBTree
            self.bBTree.xMin += xDiff;
            self.bBTree.yMin += yDiff;
            self.bBTree.xMax += xDiff;
            self.bBTree.yMax += yDiff;
        },

        byPos: function(pos){
            rootNodePos = {x: pos.x, y: pos.y};
            Render.clear();
            this.toRootNodePos();
            Render.draw();
        }
    };

    var boundingBoxLoad = function(){
        function addExpand(node){   //suma la figura (el triángulo) que indica que un nodo tiene sus hijos colapsados, es útil que el BB contenga la "figura" para cuando se va a limpiar el árbol
            if(!node.expand)
                return node.bB.bExpand.marginTop + node.bB.bExpand.height;
            return 0;
        }

        self.bBTree.xMin = rootNode.bB.bNode.x - rootNode.bB.bNode.widthOutHalf;
        self.bBTree.yMin = rootNode.bB.bNode.y - rootNode.bB.bNode.heightOutHalf;
        self.bBTree.xMax = rootNode.bB.bNode.x + rootNode.bB.bNode.widthOutHalf;
        self.bBTree.yMax = rootNode.bB.bNode.y + rootNode.bB.bNode.heightOutHalf + addExpand(rootNode);

        for(var i = 0; i < Object.keys(visibleMatrix).length; ++i)
            for(var j = 0; j < visibleMatrix[i].length; ++j){
                var node = visibleMatrix[i][j];
                if(node.render){
                    if(self.bBTree.xMin > node.bB.bNode.x - node.bB.bNode.widthOutHalf) 
                        self.bBTree.xMin = node.bB.bNode.x - node.bB.bNode.widthOutHalf;
                    
                    if(self.bBTree.xMax < node.bB.bNode.x + node.bB.bNode.widthOutHalf) 
                        self.bBTree.xMax = node.bB.bNode.x + node.bB.bNode.widthOutHalf;
                    
                    if(self.bBTree.yMin > node.bB.bNode.y - node.bB.bNode.heightOutHalf)
                        self.bBTree.yMin = node.bB.bNode.y - node.bB.bNode.heightOutHalf;
                    
                    if(self.bBTree.yMax < node.bB.bNode.y + node.bB.bNode.heightOutHalf + addExpand(node))
                        self.bBTree.yMax = node.bB.bNode.y + node.bB.bNode.heightOutHalf + addExpand(node);
                }
            }

        self.bBTree.width = self.bBTree.xMax - self.bBTree.xMin;
        self.bBTree.height = self.bBTree.yMax - self.bBTree.yMin;
    };

    var VisibleMatrix = {
        load: function() {    // a linear view of the nodes that should be rendered
            visibleMatrix = []; 
            function CreateMatrix(node) {
                if(visibleMatrix[node.depth] === undefined)
                    visibleMatrix[node.depth] = [];
                visibleMatrix[node.depth].push(node); 

                for(var i = 0; i < node.children.length; ++i)
                    CreateMatrix(node.children[i]);
            }
            CreateMatrix(rootNode);
        },

        addNode: function(node){
            function add(node){
                if(visibleMatrix[node.depth] === undefined)
                    visibleMatrix[node.depth] = [];
                visibleMatrix[node.depth].push(node);
                
                for(var i = 0; i < node.children.length; ++i)
                    add(node.children[i]);
            }
            add(node);
        },

        removeNode: function(node){
            function remove(node){
                for(var i = 0; i < node.children.length; ++i)
                    remove(node.children[i]);

                for(var i = 0; i < visibleMatrix[node.depth].length; ++i)
                    if(visibleMatrix[node.depth][i] === node){
                        visibleMatrix[node.depth].splice(i, 1);
                        if(visibleMatrix[node.depth].length < 1)
                            delete visibleMatrix[node.depth];       //http://stackoverflow.com/questions/346021/how-do-i-remove-objects-from-a-javascript-associative-array
                        return;
                    }
            }
            remove(node);
        }
    };

    var CalcPosition = {
        vertical: function(){
            var first = true;
            
            function moveNodesDescendents(node, diff){
                node.bB.bNode.x += diff;
                for(var i = 0; i < node.children.length; ++i)
                    moveNodesDescendents(node.children[i], diff);
            }
            
            function performLayoutX(node){
                var limitLeftRendered = node.getLimitLeftRendered();

                if(node.expand && node.children.length > 0){
                    for (var i = 0; i < node.children.length; ++i)
                        performLayoutX(node.children[i]);
                
                    if(node instanceof Binary && node.children.length === 1){
                        var center = (node.children[0].bB.bNode.widthOut + self.style.marginLeft) / 2;
                        if(node.children[0].side === "left")
                            node.bB.bNode.x = node.children[0].bB.bNode.x + center;
                        else
                            node.bB.bNode.x = node.children[0].bB.bNode.x - center;
                    }else{
                        node.bB.bNode.x = node.children[0].bB.bNode.x + (node.children[node.children.length-1].bB.bNode.x - node.children[0].bB.bNode.x) / 2;
                        // alternativa para centrar con boundingbox de hijos
                        //var a = node.children[0].bB.bNode, b = node.children[node.children.length-1].bB.bNode;
                        //node.bB.bNode.x = a.x -a.widthOutHalf + (b.x + b.widthOutHalf - a.x + a.widthOutHalf) / 2;
 
                    }

                    if(limitLeftRendered){
                        var inter = node.bB.bNode.x - node.bB.bNode.widthOutHalf - limitLeftRendered.bB.bNode.x - limitLeftRendered.bB.bNode.widthOutHalf;
                        if(inter < self.style.marginLeft)
                            moveNodesDescendents(node, self.style.marginLeft - inter);
                    }

                }else if(limitLeftRendered){
                    node.bB.bNode.x = limitLeftRendered.bB.bNode.x + limitLeftRendered.bB.bNode.widthOutHalf + self.style.marginLeft + node.bB.bNode.widthOutHalf;
                }else{
                    if(first){
                        node.bB.bNode.x = 0;
                        first = false;
                    }else{
                        node.bB.bNode.x = -999999;
                    }
                }
                // alternativa para altura de centro a centro
                //node.bB.bNode.y = node.depth * self.style.marginTop;
            }
           
            function performLayoutY(){
                visibleMatrix[0][0].bB.bNode.y = 0;
                for(var i = 1; i < Object.keys(visibleMatrix).length; ++i){
                    var maxLast = 0;
                    for(var j = 0; j<visibleMatrix[i-1].length; ++j)
                        if(maxLast < visibleMatrix[i-1][j].bB.bNode.heightOutHalf)
                            maxLast = visibleMatrix[i-1][j].bB.bNode.heightOutHalf;
                    
                    var max = 0;
                    for(var j = 0; j<visibleMatrix[i].length; ++j)
                        if(max < visibleMatrix[i][j].bB.bNode.heightOutHalf)
                            max = visibleMatrix[i][j].bB.bNode.heightOutHalf;
                    
                    var y = visibleMatrix[i-1][0].bB.bNode.y + maxLast + self.style.marginTop + max;
                    for(var j = 0; j<visibleMatrix[i].length; ++j)
                        visibleMatrix[i][j].bB.bNode.y = y;
                }
            }

            performLayoutX(rootNode);
            performLayoutY();
            boundingBoxLoad();
        }
    };

    var Render = {
        draw: function(){
            function drawNode(node){
                context.beginPath();
                if(node.style.sNode.shape === 'arc')
                    context.arc(node.bB.bNode.x, node.bB.bNode.y, node.bB.bNode.widthHalf, 0, Tree.source.angleFull);
                else
                    context.rect(node.bB.bNode.x - node.bB.bNode.widthHalf, node.bB.bNode.y - node.bB.bNode.heightHalf, node.bB.bNode.width, node.bB.bNode.height);
                context.fill();

                if(node.style.sNode.lineWidth > 0)
                    context.stroke();
            }

            function drawEdge(node){
                context.beginPath();
                context.moveTo(node.parent.bB.bNode.x, node.parent.bB.bNode.y + node.parent.bB.bNode.heightHalf);
                context.lineTo(node.bB.bNode.x, node.bB.bNode.y - node.bB.bNode.heightHalf);
                context.stroke();
            }

            function drawExpand(node){
                context.beginPath();
                context.moveTo(node.bB.bNode.x - node.bB.bExpand.widthHalf, node.bB.bNode.y + node.bB.bNode.heightOutHalf + node.bB.bExpand.marginTop);
                context.lineTo(node.bB.bNode.x + node.bB.bExpand.widthHalf, node.bB.bNode.y + node.bB.bNode.heightOutHalf + node.bB.bExpand.marginTop);
                context.lineTo(node.bB.bNode.x, node.bB.bNode.y + node.bB.bNode.heightOutHalf + node.bB.bExpand.height + node.bB.bExpand.marginTop);
                context.fill();
            }

            function drawNodeText(node){ 
                context.fillText(node.text.nameNode, node.bB.bNode.x, node.bB.bNode.y);
            }

            function drawEdgeText(node){ 
                if(node.parent){
                    var x = (node.bB.bNode.x - node.parent.bB.bNode.x) / 2 ;
                    if(x <= 0)  // left side
                        x = node.bB.bNode.x - x - context.measureText(node.text.nameEdge).width / 2 - node.style.sNode.lineWidth;
                    else    // right side
                        x = node.bB.bNode.x - x + context.measureText(node.text.nameEdge).width / 2 + node.style.sNode.lineWidth;
                    var halfEdge = (node.bB.bNode.y - node.bB.bNode.heightOutHalf) - (node.bB.bNode.y - node.bB.bNode.heightOutHalf - node.parent.bB.bNode.y - node.parent.bB.bNode.heightOutHalf) / 2;
                    context.fillText(node.text.nameEdge, x, halfEdge);
                }
            }

            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.lineCap = 'round';

            for(var i = 0; i < Object.keys(visibleMatrix).length; ++i)
                for(var j = 0; j<visibleMatrix[i].length; ++j){
                    var node = visibleMatrix[i][j];
                    if(node.render){
                        // edge
                        if(node.parent){
                            context.strokeStyle = node.style.sEdge.strokeStyle;
                            context.lineWidth = node.style.sEdge.lineWidth;
                            context.setLineDash(node.style.sEdge.lineDash);
                            drawEdge(node);
                        
                            if(node.text.nameEdge){
                                context.font = self.style.fontSize + "px " + node.style.sEdge.sText.fontFace;
                                context.fillStyle = node.style.sEdge.sText.fillStyle;
                                drawEdgeText(node);
                            }
                        }

                        // expand
                        context.lineCap = 'butt';
                        if(!node.expand){
                            context.fillStyle = node.style.sExpand.fillStyle;
                            drawExpand(node);
                        }

                        // node
                        context.lineWidth = node.style.sNode.lineWidth; 
                        context.strokeStyle = node.style.sNode.strokeStyle;
                        context.fillStyle = node.style.sNode.fillStyle;
                        context.setLineDash((node.style.sNode.lineDash === undefined)?[]:node.style.sNode.lineDash);
                        drawNode(node);

                        if(node.text.nameNode){
                            context.font = node.style.sNode.sText.fontSize + "px " + node.style.sNode.sText.fontFace;
                            context.fillStyle = node.style.sNode.sText.fillStyle;
                            drawNodeText(node);
                        }
                    }
                }
        },

        clear: function(){
            // borra a lo largo del canvas para asegurar borrar el nameEdge completo
            context.clearRect(0, self.bBTree.yMin - 10, context.canvas.width, self.bBTree.height + 20); 
        },
    };

    this.getGrade = function(){
        var grade = 0;        
        for(var i = 0; i < Object.keys(visibleMatrix).length; ++i)
            for(var j = 0; j < visibleMatrix[i].length; ++j){
                var gradeNode = visibleMatrix[i][j].children.length;
                if(grade < gradeNode)
                    grade = gradeNode;
            }
        return grade;
    };

    this.getLevel = function(){
        return Object.keys(visibleMatrix).length - 1;
    };

    this.getNodeSizeMin = function(){
        var nodeWidthMin = nodeHeightMin = visibleMatrix[0][0];

        for(var i = 0; i < Object.keys(visibleMatrix).length; ++i)
            for(var j = 0; j < visibleMatrix[i].length; ++j){
                if(visibleMatrix[i][j].bB.bNode.width < nodeWidthMin.bB.bNode.width)
                    nodeWidthMin = visibleMatrix[i][j];

                if(visibleMatrix[i][j].bB.bNode.height < nodeHeightMin.bB.bNode.height)
                    nodeHeightMin = visibleMatrix[i][j];
            }
        return {w: nodeWidthMin, h: nodeHeightMin};
    };
 
    this.getNodeByPos = function(pos){
        if(self.bBTree != undefined &&
           (pos.x >= self.bBTree.xMin && pos.x <= self.bBTree.xMax &&
            pos.y >= self.bBTree.yMin && pos.y <= self.bBTree.yMax)){

            for(var i = Object.keys(visibleMatrix).length - 1; i >= 0; --i)       // it is expected select the final level nodes
                for(var j = 0; j < visibleMatrix[i].length; ++j){
                    var node = visibleMatrix[i][j];
                    if( node.render &&
                        pos.x >= node.bB.bNode.x - node.bB.bNode.widthOutHalf && pos.x <= node.bB.bNode.x + node.bB.bNode.widthOutHalf &&
                        pos.y >= node.bB.bNode.y - node.bB.bNode.heightOutHalf && pos.y <= node.bB.bNode.y + node.bB.bNode.heightOutHalf){
                        //console.log("click node " + node.x);
                        return node;
                    }
                }
        }
        //console.log("click nothing");
        return null;
    };
};
Tree.source = {
    marginTop: 40, fontSize: 14, angleFull: 2 * Math.PI
};
Tree.prototype = new ExportToLatex();