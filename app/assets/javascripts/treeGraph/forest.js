/*
 * Tree graph with HTML5 and JavaScript.
 * Date: 2015.
 * Dependencies: none
 *
 * Copyright (c) 2015 Yenny Fung Guan
 */

var SubTree = function(tree){
    var nodes = [];

    this.getTree = function(){
        return tree;
    };

    this.getNodes = function(){
        return nodes;
    };

    this.getNodesSortByDepthDescendent = function(){
        nodes.sort(function (a, b) {
          if(a.depth < b.depth) return 1;
          if(a.depth > b.depth) return -1;
          return 0;
        });
        return nodes;
    };

    this.getNodesWithoutDescendant = function(){
        var nodesOrder = [];
        for(var i = 0; i < nodes.length; ++i)
            if(!this.isDescendant(nodes[i]))
                nodesOrder.push(nodes[i]);
        return nodesOrder;
    };

    this.isDescendant = function(node){
        node = node.parent;
        while(node){ 
            for(var i = 0; i < nodes.length; ++i)
                if(node === nodes[i]) 
                    return true;
            node = node.parent;
        }
        return false;
    };

    this.indexOf = function(node){
        for(var i = 0; i < nodes.length; ++i)
            if(node === nodes[i])
                return i;
        return null;
    };

    this.addNode = function(node){
        for(var i = 0; i < nodes.length; ++i)
            if(node === nodes[i])
                return false;
        nodes.push(node);
        return true;
    };

    this.removeNode = function(node){
        for(var i = 0; i < nodes.length; ++i)
            if(node === nodes[i]){
                nodes.splice(i, 1);
                return true;
            }
        return false;
    };
};



/*
 * Tree graph with HTML5 and JavaScript.
 * Date: 2015.
 * Dependencies: tree.js, record.js, subTree.js, updateDom.js
 *
 * Copyright (c) 2015 Yenny Fung Guan
 */

var Forest = function(eDrawspace){    
    var self = this;
    var canvas;
    var context;
    var trees = [];
    var subTrees = [];
    var nodesOrder = [];
    var bBPhoto;
    var treeRawCopy;
    var isScaling = true;
    var record = new Record(this);
    var updateDom = new UpdateDom(this);

    var __construct = function(that) {
        canvas = document.createElement('canvas');
        canvas.setAttribute("id", 'frontLayer');
        canvas.width = eDrawspace.clientWidth;
        canvas.height = eDrawspace.clientHeight;
        eDrawspace.appendChild(canvas);
        context = canvas.getContext("2d");
        context.mozImageSmoothingEnabled = false;
        context.msImageSmoothingEnabled = false;
        context.imageSmoothingEnabled = false;
    }(this);

    this.resize = function(){
        // el redimensionamiento del canvas provoca un reseteo, por lo tanto hay que volver a redibujar todas las capas 
        canvas.width = eDrawspace.clientWidth;
        canvas.height = eDrawspace.clientHeight;
        
        if(bBPhoto !== undefined)
            self.Photo.drawInit();
        else
            Render.draw();

        for(var i = 0; i < trees.length; ++i)
            trees[i].resize();
    };

    this.getCanvas = function(){
        return canvas;
    };

    this.getTrees = function(){
        return trees;
    };

    this.getSubTrees = function(){
        return subTrees;
    };

    this.getNodesOrder = function(){
        return nodesOrder;
    };

    this.getRecord = function(){
        return record;
    };

    var getBBPointCtrl = function(pos, bB, width){
        function isPosInsidePointControl(x, y){
            if(pos.x >= x - width && pos.x <= x + width && 
               pos.y >= y - width && pos.y <= y + width)
                return true;
            return false;
        }

        if(isPosInsidePointControl(bB.xMin, bB.yMin)){
            return '0';
        }else if(isPosInsidePointControl(bB.xMax, bB.yMin)){
            return '2';
        }else if(isPosInsidePointControl(bB.xMax, bB.yMax)){
            return '4';
        }else if(isPosInsidePointControl(bB.xMin, bB.yMax)){
            return '6';
        }else if(isPosInsidePointControl(bB.xMin + bB.width/2, bB.yMin)){
            return '1';
        }else if(isPosInsidePointControl(bB.xMax, bB.yMin + bB.height/2)){
            return '3';
        }else if(isPosInsidePointControl(bB.xMin + bB.width/2, bB.yMax)){
            return '5';
        }else if(isPosInsidePointControl(bB.xMin, bB.yMin + bB.height/2)){
            return '7';
        }
        return null;
    };



    /* 
    * funciones para gestionar los trees
    */
    this.pushTree = function(canvasId){
        var generateCanvasId = function(){
            var ids = [];
            if(trees.length > 0){ 
                for(var i = 0; i < trees.length; ++i)
                    ids[trees[i].getCanvasId()] = true;
                for(var i = 0; i < trees.length; ++i)
                    if(ids[i] === undefined)
                        return i;
            }
            return trees.length;
        }

        var tree = canvasId ? new Tree(canvasId, eDrawspace) : new Tree(generateCanvasId(), eDrawspace);
        if(trees.length === 0){
            eDrawspace.appendChild(tree.getCanvas());
        }else{
            eDrawspace.insertBefore(tree.getCanvas(), trees[trees.length - 1].getCanvas());
            for(var i = 0; i < trees.length; ++i)
                trees[i].getCanvas().setAttribute("style", "z-index: " + (i - trees.length - 1));
        }
        trees.push(tree); 
        return tree;
    };

    this.removeTree = function(tree){
        for(var i = 0; i < trees.length; ++i)
            if(trees[i] === tree){
                eDrawspace.removeChild(trees[i].getCanvas());
                trees.splice(i, 1);
                for(var j = i; j < trees.length; ++j)
                    trees[j].getCanvas().setAttribute("style", "z-index: " + (j - trees.length));
                return;
            }
    };

    var upTree = function(index, newIndex){
        if(index < newIndex){         //mayor o igual a la posición 2 para que pueda ascender a la posición 1
            eDrawspace.removeChild(trees[index].getCanvas());                              // reacomoda los elementos DOM
            eDrawspace.insertBefore(trees[index].getCanvas(), trees[newIndex].getCanvas());                              
            trees.splice(newIndex + 1, 0, trees[index]);
            trees.splice(index, 1);       // reacomoda el array
            for(var i = index; i < trees.length; ++i)
                trees[i].getCanvas().setAttribute("style", "z-index: " + (i - trees.length));
        }
    };

    this.getTreeByCanvasId = function(canvasId){
        for(var i = 0; i < trees.length; ++i)
            if(trees[i].getCanvasId() == canvasId)
                return trees[i];
        return null;
    };

    this.getNodeByCanvasIdPos = function(canvasId, pos){
        var tree = this.getTreeByCanvasId(canvasId);
        if(tree)
            return tree.getNodeByPos(pos);
        return null;
    };

    this.getNodeByPos = function(pos){
        for(var i = trees.length - 1; i >= 0; --i){
            var node = trees[i].getNodeByPos(pos);
            if(node){
                upTree(i, trees.length - 1);
                return node;
            }
        }
        return null;
    };



    /* 
    * funciones para gestionar el subconjunto de forest
    */
    this.SubForest = {
        getProperties: function(){
            var properties = {
                nodesLength: nodesOrder.length,
                treesLength: Object.keys(subTrees).length
            }

            if(Object.keys(subTrees).length > 0){
                var node = subTrees[Object.keys(subTrees)[0]].getNodes()[0];
                properties.style = {
                    sNode: {
                        shape: node.style.sNode.shape, 
                        lineWidth: 0, 
                        fillStyle: node.style.sNode.fillStyle, 
                        strokeStyle: node.style.sNode.strokeStyle, 
                        lineDash: node.style.sNode.lineDash,
                    },
                    sEdge: {lineWidth: 0, strokeStyle: null, lineDash: null},
                    marginTop: 0, marginLeft: 0,
                };
                properties.bB = {bNode: {width: 0, height: 0}};
                properties.atLeastParent = false;
                properties.atLeastChild = false;

                for(var key in subTrees){
                    var nodes = subTrees[key].getNodes();
                    for(var i = 0; i < nodes.length; ++i){
                        var node = nodes[i];
                        
                        if(node.parent){
                            properties.atLeastParent = true;

                            if(properties.style.sEdge.strokeStyle === null)
                                properties.style.sEdge.strokeStyle = node.style.sEdge.strokeStyle; 
                            else if(properties.style.sEdge.strokeStyle !== node.style.sNode.strokeStyle)
                                properties.style.sEdge.strokeStyle = null; 

                            if(properties.style.sEdge.lineDash === null)
                                properties.style.sEdge.lineDash = node.style.sEdge.lineDash; 
                            else if(properties.style.sEdge.lineDash.toString() !== node.style.sEdge.lineDash.toString())
                                properties.style.sEdge.lineDash = null; 

                            properties.style.sEdge.lineWidth += node.style.sEdge.lineWidth;
                        }

                        if(node.children.length > 0)
                            properties.atLeastChild = true;
                        
                        if(properties.style.sNode.shape !== node.style.sNode.shape)
                            properties.style.sNode.shape = null; 
                        
                        if(properties.style.sNode.fillStyle !== node.style.sNode.fillStyle)
                            properties.style.sNode.fillStyle = null; 
                        
                        if(properties.style.sNode.strokeStyle !== node.style.sNode.strokeStyle)
                            properties.style.sNode.strokeStyle = null; 

                        if(properties.style.sNode.lineDash && properties.style.sNode.lineDash !== undefined && node.style.sNode.lineDash !== undefined){
                            if(properties.style.sNode.lineDash.toString() !== node.style.sNode.lineDash.toString())
                                properties.style.sNode.lineDash = null; 
                        }else if((properties.style.sNode.lineDash !== undefined && node.style.sNode.lineDash == undefined) ||
                                (properties.style.sNode.lineDash === undefined && node.style.sNode.lineDash != undefined)){
                            properties.style.sNode.lineDash = null; 
                        }
                        
                        properties.bB.bNode.width += node.bB.bNode.width;
                        properties.bB.bNode.height += node.bB.bNode.height;
                        properties.style.sNode.lineWidth += node.style.sNode.lineWidth;
                        properties.style.marginTop += node.getTree().style.marginTop;
                        properties.style.marginLeft += node.getTree().style.marginLeft;
                    }
                }                
            }        
            return properties;
        },

        addNode: function(node){ 
            var canvasId = node.getTree().getCanvasId();
            if(subTrees[canvasId] === undefined)
                subTrees[canvasId] = new SubTree(node.getTree());
            if(subTrees[canvasId].addNode(node)){
                nodesOrder.push(node);
                return true;
            }
            return false;
        },

        setNode: function(node){  
            this.empty();
            var canvasId = node.getTree().getCanvasId();
            subTrees[canvasId] = new SubTree(node.getTree());
            subTrees[canvasId].addNode(node);
            nodesOrder = [node];
        },

        setNodes: function(nodes){
            this.empty();
            for(var i = 0; i < nodes.length; ++i)
                this.addNode(nodes[i]);
        },

        removeNode: function(node){
            var canvasId = node.getTree().getCanvasId();
            if(subTrees[canvasId] !== undefined)
                if(subTrees[canvasId].removeNode(node)){
                    if(subTrees[canvasId].getNodes().length === 0)
                        delete subTrees[canvasId];
                    for(var i = 0; i < nodesOrder.length; ++i)
                        if(node === nodesOrder[i])
                            nodesOrder.splice(i, 1);
                    return true;
                }
            return false;
        },

        empty: function(){
            for(var key in subTrees)
                delete subTrees[key];
            subTrees = [];
            nodesOrder = [];
        },
    };



    /* 
    * funciones para gestionar el canvas frontal
    */
    Render = {
        draw: function(){
            function drawNode(node){
                if(node.render){
                    // node
                    context.globalAlpha = 0.6;
                    context.fillStyle = 'rgb(197, 197, 197)';

                    context.beginPath();
                    if(node.style.sNode.shape === 'arc')
                        context.arc(node.bB.bNode.x, node.bB.bNode.y, node.bB.bNode.widthOutHalf + Forest.source.sSelection.looseness, 0, Forest.source.angleFull);
                    else if(node.style.sNode.shape === 'rect')
                        context.rect(   node.bB.bNode.x - node.bB.bNode.widthOutHalf - Forest.source.sSelection.looseness, 
                                        node.bB.bNode.y - node.bB.bNode.heightOutHalf - Forest.source.sSelection.looseness, 
                                        node.bB.bNode.widthOut + Forest.source.sSelection.looseness * 2, 
                                        node.bB.bNode.heightOut + Forest.source.sSelection.looseness * 2);
                    context.fill();
                    
                    // edge
                    if(node.parent){ 
                        context.strokeStyle = 'rgb(197, 197, 197)';
                        context.setLineDash([]);
                        context.lineWidth = node.style.sEdge.lineWidth + Forest.source.sSelection.looseness; 
                        context.lineCap = 'round'; 
                        
                        context.beginPath();
                        context.moveTo(node.parent.bB.bNode.x, node.parent.bB.bNode.y + node.parent.bB.bNode.heightHalf);
                        context.lineTo(node.bB.bNode.x, node.bB.bNode.y - node.bB.bNode.heightHalf);
                        context.stroke();
                    }
                    context.globalAlpha = 1;
                }
            }

            function drawBBTree(bBTree){
                context.lineCap = 'butt';
                context.setLineDash([5, 5]);
                context.lineWidth = Forest.source.sBBTree.lineWidth;
                context.strokeStyle = 'rgb(197, 197, 197)';
                context.beginPath();
                context.strokeRect(Math.round(bBTree.xMin), Math.round(bBTree.yMin), 
                                   Math.round(bBTree.width), Math.round(bBTree.height));

                context.setLineDash([]);
                context.fillStyle = 'rgb(255, 255, 255)';
                Render.drawHandles(bBTree, Forest.source.sBBTree.sControl.width);
            }

            for(var key in subTrees){
                var nodes = subTrees[key].getNodes();
                for(var i = 0; i < nodes.length; ++i)
                    drawNode(nodes[i]);
                if(isScaling)
                    drawBBTree(subTrees[key].getTree().bBTree);
            }
        },

        clear: function() {
            function clearNode(node){
                if(!node.parent){  
                    context.clearRect(node.bB.bNode.x - node.bB.bNode.widthOut,
                                      node.bB.bNode.y - node.bB.bNode.heightOut, 
                                      node.bB.bNode.widthOut * 2, 
                                      node.bB.bNode.heightOut * 2);
                }else{
                    var x = node.bB.bNode.x - node.parent.bB.bNode.x;
                    if(x <= 0){      // left side
                        var width = (node.parent.bB.bNode.x + node.parent.bB.bNode.widthOut)
                                     - (node.bB.bNode.x - node.bB.bNode.widthOut);
                        var height = (node.bB.bNode.y + node.bB.bNode.heightOut)
                                     - (node.parent.bB.bNode.y - node.parent.bB.bNode.heightOut);

                        context.clearRect(node.bB.bNode.x - node.bB.bNode.widthOut, 
                                          node.bB.bNode.y + node.bB.bNode.heightOut, 
                                          width, -height);

                    }else{            // right side
                        var width = (node.bB.bNode.x + node.bB.bNode.widthOut)
                                    - (node.parent.bB.bNode.x - node.parent.bB.bNode.widthOut);
                        var height = (node.bB.bNode.y + node.bB.bNode.heightOut)
                                     - (node.parent.bB.bNode.y - node.parent.bB.bNode.heightOut);

                        context.clearRect(node.bB.bNode.x + node.bB.bNode.widthOut, 
                                          node.bB.bNode.y + node.bB.bNode.heightOut,
                                          -width, -height);
                    }
                }
            }

           function clearBBTree(bBTree){
                var w = Forest.source.sBBTree.sControl.width;
                context.clearRect(bBTree.xMin - w, bBTree.yMin - w, 
                                  bBTree.width + 2 * w, bBTree.height + 2 * w);
            }

            if(isScaling){
                for(var key in subTrees)
                    clearBBTree(subTrees[key].getTree().bBTree);
            }else{
                for(var key in subTrees){
                    var nodes = subTrees[key].getNodes();
                    for(var i = 0; i < nodes.length; ++i)
                        clearNode(nodes[i]);
                }
            }
        },

        drawHandles: function(bBox, size) {
            function drawRect(x, y, size) {
                context.beginPath();
                context.rect(Math.round(x) - size/2, Math.round(y) - size/2, size, size);
                context.fill();
                context.stroke();
            }

            drawRect(bBox.xMin, bBox.yMin, size);
            drawRect(bBox.xMax, bBox.yMin, size);
            drawRect(bBox.xMax, bBox.yMax, size);
            drawRect(bBox.xMin, bBox.yMax, size);
            drawRect(bBox.xMin + bBox.width/2, bBox.yMin, size);
            drawRect(bBox.xMax, bBox.yMin + bBox.height/2, size);
            drawRect(bBox.xMin + bBox.width/2, bBox.yMax, size);
            drawRect(bBox.xMin, bBox.yMin + bBox.height/2, size);
        }
    };



    /* 
    * llamadas a funciones de la clase Tree
    */
    this.Selection = {
        nodeToogle: function(pos){
            var node = self.getNodeByPos(pos);
            Render.clear();
            if(node){
                if(!self.SubForest.removeNode(node))
                    self.SubForest.addNode(node)
                Render.draw();
            }else{
                self.SubForest.empty();
            }
            updateDom.completeWithoutFocusForm();
        },

        nodeSimple: function(pos){
            var node = self.getNodeByPos(pos);
            if(node){
                var canvasId = node.getTree().getCanvasId();
                if(!(subTrees[canvasId] !== undefined && subTrees[canvasId].indexOf(node)!==null)){
                    Render.clear();
                    self.SubForest.setNode(node);
                    Render.draw();
                    updateDom.completeWithoutFocusForm();
                }
                return true;
            }else{
                Render.clear();
                self.SubForest.empty();
                updateDom.completeWithoutFocusForm();
            }
            return false;
        },

        path: function(){
            if(nodesOrder.length > 0){
                for(var i = 0; i < nodesOrder.length; ++i){
                    var node = nodesOrder[i].parent;
                    while(node){
                        self.SubForest.addNode(node);
                        node = node.parent;
                    }
                }
                Render.clear();
                Render.draw();
                updateDom.complete();
            }
        },

        all: function(){
            if(nodesOrder.length > 0){
                for(var key in subTrees){
                    var visibleMatrix = subTrees[key].getTree().getVisibleMatrix();
                    for(var i = 0; i < Object.keys(visibleMatrix).length; ++i)
                        for(var j = 0; j<visibleMatrix[i].length; ++j){
                            if(visibleMatrix[i][j].render)
                                self.SubForest.addNode(visibleMatrix[i][j]);
                        }
                }  
            }else{
                self.SubForest.empty()
                for(var k = 0; k < trees.length; ++k){
                    var visibleMatrix = trees[k].getVisibleMatrix();
                    for(var key in visibleMatrix)
                        for(var j = 0; j < visibleMatrix[key].length; ++j)
                            self.SubForest.addNode(visibleMatrix[key][j]);
                }
            }
            Render.clear();
            Render.draw();
            updateDom.complete();
        },

        none: function(){
            Render.clear();
            self.SubForest.empty();
            updateDom.completeWithoutFocusForm();
        },

        getBBTreePointCtrl: function(pos){ 
            for(var key in subTrees){
                var pointId = getBBPointCtrl(pos, subTrees[key].getTree().bBTree, Forest.source.sBBTree.sControl.width);
                if(pointId)
                    return {id: pointId, tree: subTrees[key].getTree()};
            }
            return null;
        }
    };

    this.Add = {
        root: function(pos){
            if(pos){
                Render.clear();
                var tree = self.pushTree();   
                record.rec('addRoot', [{pos: {x: pos.x, y: pos.y}, canvasId: tree.getCanvasId(), instance: 'Tree'}]);
                self.SubForest.setNode(tree.Add.root(pos));
                Render.draw();
                updateDom.complete();
            }
        },

        rootBinary: function(pos){
            if(pos){
                Render.clear();
                var tree = self.pushTree();    
                record.rec('addRoot', [{pos: {x: pos.x, y: pos.y}, canvasId: tree.getCanvasId(), instance: 'Binary'}]);
                self.SubForest.setNode(tree.Add.rootBinary(pos));
                Render.draw();
                updateDom.complete();
            }
        },

        child: function(){
            if(nodesOrder.length > 0){
                Render.clear();
                var dataNodes = [];
                for(var key in subTrees){
                    var nodes = subTrees[key].getNodes(), befores = [];

                    for(var i = 0; i < nodes.length; ++i)
                        befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, expand: nodes[i].expand});
                    
                    var results = subTrees[key].getTree().Add.children(nodes);
                    
                    if(!results.every(function(v){ return v === null; })){
                        dataNodes[key] = [];
                        for(var i = 0; i < nodes.length && results[i]; ++i)
                            dataNodes[key].push({before: befores[i], current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, side: results[i].getIndexChild()}});
                    }
                }
                record.rec('addChild', dataNodes);
                Render.draw();
                updateDom.complete();
            }
        },

        left: function(){
            if(nodesOrder.length > 0){
                Render.clear();
                var dataNodes = [];
                for(var key in subTrees){
                    var nodes = subTrees[key].getNodes(), befores = [];

                    for(var i = 0; i < nodes.length; ++i)
                        befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}});

                    var results = subTrees[key].getTree().Add.lefts(nodes);

                    if(!results.every(function(v){ return v === null; })){
                        dataNodes[key] = [];
                        for(var i = 0; i < nodes.length && results[i]; ++i)
                            dataNodes[key].push({before: befores[i], current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}}});
                    }
                }
                record.rec('addLeft', dataNodes);
                Render.draw();
                updateDom.complete();
            }
        },

        right: function(){
            if(nodesOrder.length > 0){
                Render.clear();
                var dataNodes = [];
                for(var key in subTrees){
                    var nodes = subTrees[key].getNodes(), befores = [];

                    for(var i = 0; i < nodes.length; ++i)
                        befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}});

                    var results = subTrees[key].getTree().Add.rights(nodes);

                    if(!results.every(function(v){ return v === null; })){
                        dataNodes[key] = [];
                        for(var i = 0; i < nodes.length && results[i]; ++i)
                            dataNodes[key].push({before: befores[i], current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}}});
                    }
                }
                record.rec('addRight', dataNodes);
                Render.draw();
                updateDom.complete();
            }
        },
    };

    this.remove = function(){
        if(nodesOrder.length > 0){
            var dataNodes = [], subNodes = [];
            Render.clear();
            for(var key in subTrees){
                var nodes = subTrees[key].getNodesWithoutDescendant();
                dataNodes[key] = [];

                if(nodes.length === 1 && !nodes[0].parent){
                    dataNodes[key].push({before: {pos: {x: nodes[0].bB.bNode.x, y: nodes[0].bB.bNode.y}, treeRaw: nodes[0].getTree().Export.original(nodes[0]), nChild: nodes[0].getIndexChild()},
                                        current: {pos: {x: nodes[0].bB.bNode.x, y: nodes[0].bB.bNode.y}}});

                    subTrees[key].getTree().removes(nodes);
                    self.removeTree(subTrees[key].getTree());

                }else{
                    var parents = []
                    for(var i = 0; i < nodes.length; ++i){
                        dataNodes[key].push({before: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, treeRaw: nodes[i].getTree().Export.original(nodes[i]), nChild: nodes[i].getIndexChild()}});
                        parents.push(nodes[i].parent);
                        subNodes.push(nodes[i].parent);
                    }

                    subTrees[key].getTree().removes(nodes); 
                
                    for(var i = 0; i < nodes.length; ++i)
                        dataNodes[key][i].current = {pos: {x: parents[i].bB.bNode.x, y: parents[i].bB.bNode.y}};
                }
            }
            record.rec('remove', dataNodes);
            self.SubForest.setNodes(subNodes);
            Render.draw();
            updateDom.complete();
        }
    };

    this.expand = function(){
        if(nodesOrder.length > 0){
            Render.clear();
            var dataNodes = [], subNodes = [];
            for(var key in subTrees){
                var nodes = subTrees[key].getNodesSortByDepthDescendent(), befores = [];
                dataNodes[key] = [];
                
                for(var i = 0; i < nodes.length; ++i){
                    befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}});
                    
                    if(subTrees[key].getTree().expand(nodes[i])){
                        if(!subTrees[key].isDescendant(nodes[i]))
                            subNodes.push(nodes[i]);
                    
                        dataNodes[key].push({before: befores[i], current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}}});
                    }
                }
                if(dataNodes[key].length === 0)
                    delete dataNodes[key];
            }
            record.rec('expand', dataNodes);
            self.SubForest.setNodes(subNodes);
            Render.draw();
        }
    };

    this.cut = function(){
        if(nodesOrder.length === 1){
            Render.clear();
            var canvasId = Object.keys(subTrees)[0], node = subTrees[canvasId].getNodes()[0];

            var before = {pos: {x: node.bB.bNode.x, y: node.bB.bNode.y}, treeRaw: node.getTree().Export.original(node), nChild: node.getIndexChild()};
            if(node.parent){
                var parent = node.parent;
                self.SubForest.setNode(parent);
            }else{
                var parent = {bB: {bNode: {x: node.bB.bNode.x, y: node.bB.bNode.y}}};
                self.removeTree(node.getTree());
                self.SubForest.empty();
            }
            
            treeRawCopy = node.getTree().cut(node);
            
            record.rec('cut', [{before: before, current: {pos: {x: parent.bB.bNode.x, y: parent.bB.bNode.y}}, canvasId: canvasId}]);
            Render.draw();
            updateDom.complete();
            return true;
        }
        return false;
    };

    this.copy = function(){
        if(nodesOrder.length === 1){ 
            Render.clear();
            var node = subTrees[Object.keys(subTrees)[0]].getNodes()[0];
            treeRawCopy = node.getTree().Export.original(node);
            Render.draw();
            updateDom.complete();
            return true;
        }
        return false;
    };

    this.paste = function(pos){
        if(treeRawCopy){
            var dataNodes = [], subNodes = [];

            if(nodesOrder.length === 0){
                treeRawCopy.rootNodePos.x = pos.x;
                treeRawCopy.rootNodePos.y = pos.y;
                var tree = self.pushTree(), 
                    node = tree.Import.root(treeRawCopy);

                dataNodes[tree.getCanvasId()] = [{
                    before: {pos: {x: pos.x, y: pos.y}}, 
                    current: {pos: {x: pos.x, y: pos.y}, treeRaw: tree.Export.original(node)}
                }];
                subNodes.push(node);
            
            }else if(nodesOrder.length > 0){ 
                Render.clear();
                for(var key in subTrees){
                    var nodes = subTrees[key].getNodesWithoutDescendant(), befores = [];

                    for(var i = 0; i < nodes.length; ++i)
                        befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, treeRaw: nodes[i].getTree().Export.original(nodes[i])});
                       
                    var treeRaws = [];
                    for(var i = 0; i < nodes.length; ++i)
                        treeRaws.push(treeRawCopy);
                    var results = subTrees[key].getTree().Import.addSelfs(nodes, treeRaws);
 
                    if(!results.every(function(v){ return v === null; })){
                        dataNodes[key] = [];
                        for(var i = 0; i < nodes.length && results[i]; ++i){
                            dataNodes[key].push({before: befores[i], current: {pos: {x: results[i].bB.bNode.x, y: results[i].bB.bNode.y}, treeRaw: subTrees[key].getTree().Export.original(results[i])}});
                            subNodes.push(results[i]);
                        }
                    }
                }
            }
            record.rec('paste', dataNodes);
            self.SubForest.setNodes(subNodes);
            Render.draw();
            updateDom.complete();
        }
    };

    this.Export = {
        original: function(){
            if(trees.length > 0){
                var treeRaws = []; 
                for (var i = 0; i < trees.length; ++i){
                    var tree = trees[i];
                    treeRaws.push({ treeRaw: tree.Export.original(tree.getRootNode()), canvasId: tree.getCanvasId()});
                }
                //console.log(JSON.parse(JSON.stringify(treeRaws)));
                return treeRaws;
            }
            return null;
        },

        png: function(){
            if(nodesOrder.length === 1)
                return subTrees[Object.keys(subTrees)[0]].getTree().Export.png();
            return null;
        },

        pstTree: function(){
            if(nodesOrder.length === 1)
                return subTrees[Object.keys(subTrees)[0]].getTree().Export.pstTree();
            return null;
        }
    };

    this.import = function(doc){
        if(trees.length > 0){
            Render.clear();
            while(trees.length > 0){
                var tree = trees[0];
                tree.remove(tree.getRootNode());
                self.removeTree(tree);
            }
            self.SubForest.empty(); 
            record.reset();
        }
        if(doc)
            for(var i = doc.length - 1; i >= 0; --i){
                var tree = self.pushTree(doc[i].canvasId);  
                tree.Import.root(doc[i].treeRaw);
            }
        updateDom.complete();
    };

    this.translate = function(diff){
    	if(nodesOrder.length > 0){ 
            var dataNodes = [];
            Render.clear();
	    	for(var key in subTrees){
                var tree = subTrees[key].getTree();
                dataNodes[key] = {before: {pos: {x: tree.getRootNodePos().x, y: tree.getRootNodePos().y}}};
	            
                subTrees[key].getTree().Translate.byPos({x: tree.getRootNodePos().x + diff.x, y: tree.getRootNodePos().y + diff.y});
                
                dataNodes[key] = {before: dataNodes[key].before, current: {pos: {x: tree.getRootNodePos().x, y: tree.getRootNodePos().y}}};
            }
            record.rec3('translate', dataNodes);
	        Render.draw();
            updateDom.barTool();
	    }
    };

    this.ResizeNode = {
        width: function(width){
            if(nodesOrder.length > 0){ 
                var dataNodes = [];
                Render.clear();
                for(var key in subTrees){
                    var nodes = subTrees[key].getNodes(), befores = [];

                    for(var i = 0; i < nodes.length; ++i)
                        befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, width: nodes[i].bB.bNode.width}); 

                    subTrees[key].getTree().ResizeNode.widths(nodes, Array.apply(null, Array(nodes.length)).map(Number.prototype.valueOf, width));

                    dataNodes[key] = [];
                    for(var i = 0; i < nodes.length; ++i)
                        if(width !== befores[i].width)
                            dataNodes[key].push({before: befores[i], current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, width: width}});
                    if(dataNodes[key].length === 0)
                        delete dataNodes[key];
                }
                Render.draw();
                record.rec2 ('resizeNodeWidth', dataNodes);
                updateDom.height();
            }
        },

        height: function(height){
            if(nodesOrder.length > 0){ 
                var dataNodes = [];
                Render.clear();
                for(var key in subTrees){
                    var nodes = subTrees[key].getNodes(), befores = [];

                    for(var i = 0; i < nodes.length; ++i)
                        befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, height: nodes[i].bB.bNode.height}); 

                    nodes[0].getTree().ResizeNode.heights(nodes, Array.apply(null, Array(nodes.length)).map(Number.prototype.valueOf, height));

                    dataNodes[key] = [];
                    for(var i = 0; i < nodes.length; ++i)
                        if(height !== befores[i].height)
                            dataNodes[key].push({before: befores[i], current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, height: height}});
                    if(dataNodes[key].length === 0)
                        delete dataNodes[key];
                }
                Render.draw();
                record.rec2('resizeNodeHeight', dataNodes);
                updateDom.height();
            }
        },

        lineWidthNode: function(lineWidth){
            if(nodesOrder.length > 0){ 
                var dataNodes = [];
                Render.clear();
                for(var key in subTrees){
                    var nodes = subTrees[key].getNodes(), befores = [];

                    for(var i = 0; i < nodes.length; ++i)
                        befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, lineWidth: nodes[i].style.sNode.lineWidth}); 

                    nodes[0].getTree().ResizeNode.lineWidthNodes(nodes, Array.apply(null, Array(nodes.length)).map(Number.prototype.valueOf, lineWidth)); 

                    dataNodes[key] = [];
                    for(var i = 0; i < nodes.length; ++i)
                        if(lineWidth !== befores[i].lineWidth)
                            dataNodes[key].push({before: befores[i], current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, lineWidth: lineWidth}});
                    if(dataNodes[key].length === 0)
                        delete dataNodes[key];
                }
                Render.draw();
                record.rec2('resizeNodeLineWidthNode', dataNodes);
                updateDom.lineDashNode();
            }
        },
        
        lineWidthEdge: function(lineWidth){
            if(nodesOrder.length > 0){
                var dataNodes = [];
                Render.clear();
                for(var key in subTrees){
                    var nodes = subTrees[key].getNodes(), befores = [];

                    for(var i = 0; i < nodes.length; ++i)
                        befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, lineWidth: nodes[i].style.sNode.lineWidth}); 

                    nodes[0].getTree().ResizeNode.lineWidthEdges(nodes, Array.apply(null, Array(nodes.length)).map(Number.prototype.valueOf, lineWidth)); 

                    dataNodes[key] = [];
                    for(var i = 0; i < nodes.length; ++i)
                        if(lineWidth !== befores[i].lineWidth)
                            dataNodes[key].push({before: befores[i], current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, lineWidth: lineWidth}});
                    if(dataNodes[key].length === 0)
                        delete dataNodes[key];
                };
                Render.draw();
                record.rec2('resizeNodeLineWidthEdge', dataNodes);
            }
        }
    };

    this.ResizeTree = {
        tree: function(pCtrl, pos, isSimetric){
            Render.clear();
            var dataNodes = [], befores = [];

            for(var key in subTrees){ 
                var tree = subTrees[key].getTree();
                befores[key] = {
                    rootNodePos: JSON.parse(JSON.stringify(tree.getRootNodePos())), 
                    bBTree: {width: tree.bBTree.width, height: tree.bBTree.height}
                };
            }

            if(pCtrl.id == 0){
            	var diff = {x: pCtrl.tree.bBTree.xMin - pos.x, y: pCtrl.tree.bBTree.yMin - pos.y};
            	for(var key in subTrees){
            		var tree = subTrees[key].getTree();  
                    var newBbTree = {w: tree.bBTree.width + diff.x, h: tree.bBTree.height + diff.y};
                    if(isSimetric) tree.ResizeTree.centerTopLeft(newBbTree);
                    else tree.ResizeTree.topLeft(newBbTree);
                }
            
            }else if(pCtrl.id == 1){
            	var diff = {y: pCtrl.tree.bBTree.yMin - pos.y};
            	for(var key in subTrees){  
    					var tree = subTrees[key].getTree();
                    var newBbTree = {h: tree.bBTree.height + diff.y};
                    if(isSimetric) tree.ResizeTree.centerTop(newBbTree);
                    else tree.ResizeTree.top(newBbTree);
                }
            
            }else if(pCtrl.id == 2){
            	var diff = {x: pos.x - pCtrl.tree.bBTree.xMax, y: pCtrl.tree.bBTree.yMin - pos.y};
            	for(var key in subTrees){
            		var tree = subTrees[key].getTree();  
                    var newBbTree = {w: tree.bBTree.width + diff.x, h: tree.bBTree.height + diff.y};
                    if(isSimetric) tree.ResizeTree.centerTopRight(newBbTree);
                    else tree.ResizeTree.topRight(newBbTree);
                }
            
            }else if(pCtrl.id == 3){
            	var diff = {x: pos.x - pCtrl.tree.bBTree.xMax};
            	for(var key in subTrees){  
    					var tree = subTrees[key].getTree();
                    var newBbTree = {w: tree.bBTree.width + diff.x};
                    if(isSimetric) tree.ResizeTree.centerRight(newBbTree);
                    else tree.ResizeTree.right(newBbTree);
                }
            
            }else if(pCtrl.id == 4){
            	var diff = {x: pos.x - pCtrl.tree.bBTree.xMax, y: pos.y - pCtrl.tree.bBTree.yMax};
            	for(var key in subTrees){
            		var tree = subTrees[key].getTree();  
                    var newBbTree = {w: tree.bBTree.width + diff.x, h: tree.bBTree.height + diff.y};
                    if(isSimetric) tree.ResizeTree.centerBottomRight(newBbTree);
                    else tree.ResizeTree.bottomRight(newBbTree);
    	        }
            
            }else if(pCtrl.id == 5){
            	var diff = {y: pos.y - pCtrl.tree.bBTree.yMax};
            	for(var key in subTrees){
            		var tree = subTrees[key].getTree();
                    var newBbTree = {h: tree.bBTree.height + diff.y};
                    if(isSimetric) tree.ResizeTree.centerBottom(newBbTree);
                    else tree.ResizeTree.bottom(newBbTree);
                }
            
            }else if(pCtrl.id == 6){
            	var diff = {x: pCtrl.tree.bBTree.xMin - pos.x, y: pos.y - pCtrl.tree.bBTree.yMax};
            	for(var key in subTrees){
            		var tree = subTrees[key].getTree();  
                    var newBbTree = {w: tree.bBTree.width + diff.x, h: tree.bBTree.height + diff.y};
                    if(isSimetric) tree.ResizeTree.centerBottomLeft(newBbTree);
                    else tree.ResizeTree.bottomLeft(newBbTree);
                }
                
            }else if(pCtrl.id == 7){
                var diff = {x: pCtrl.tree.bBTree.xMin - pos.x};
            	for(var key in subTrees){  
    					var tree = subTrees[key].getTree();
                    var newBbTree = {w: tree.bBTree.width + diff.x};
                    if(isSimetric) tree.ResizeTree.centerLeft(newBbTree);
                    else tree.ResizeTree.left(newBbTree);
                }
            }

            for(var key in subTrees){
                var tree = subTrees[key].getTree();
                if(tree.bBTree.width !== befores[key].bBTree.width && 
                   tree.bBTree.height !== befores[key].bBTree.height){
                    var current = { rootNodePos: JSON.parse(JSON.stringify(tree.getRootNodePos())), 
                                    bBTree: {width: tree.bBTree.width, height: tree.bBTree.height}
                                  };
                    dataNodes[key] = {before: befores[key], current: current};
                }
            }
            record.rec3('resizeTree', dataNodes);

            Render.draw();
            updateDom.resizeTree();
        },

        toogle: function(){
            Render.clear();
            isScaling = !isScaling;
            Render.draw();
            return isScaling;
        }
    };

    this.ResizeMargin = {
        top: function(margin){
            Render.clear();
            var dataNodes = [];
            for(var key in subTrees){
                var marginBackup = subTrees[key].getTree().style.marginTop; 
                
                if(margin !== marginBackup){
                    subTrees[key].getTree().ResizeMargin.top(margin);  
                    dataNodes[key] = {before: {marginTop: marginBackup}, current: {marginTop: margin}};
                }
            }
            record.rec3('resizeMarginTop', dataNodes);   
            Render.draw();
        },

        left: function(margin){
            Render.clear();
            var dataNodes = [];
            for(var key in subTrees){
                var marginBackup = subTrees[key].getTree().style.marginLeft; 
                
                if(margin !== marginBackup){
                    subTrees[key].getTree().ResizeMargin.left(margin);  
                    dataNodes[key] = {before: {marginLeft: marginBackup}, current: {marginLeft: margin}};
                }
            }
            record.rec3('resizeMarginLeft', dataNodes);   
            Render.draw();
        }
    };

    this.Style = {
        shape: function(shape){
            Render.clear();
            var dataNodes = [];
            for(var key in subTrees){
                var nodes = subTrees[key].getNodes(), befores = [], widths = [], heights = [];

                for(var i = 0; i < nodes.length; ++i){
                    var width = nodes[i].bB.bNode.width, height = nodes[i].bB.bNode.height;
                    widths.push(width);
                    heights.push((shape === 'arc')? width : height);
                    befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, shape: nodes[i].style.sNode.shape, width: width, height: height});
                }

                nodes[0].getTree().Style.shapes(nodes, Array.apply(null, Array(nodes.length)).map(String.prototype.valueOf, shape), widths, heights);

                dataNodes[key] = [];
                for(var i = 0; i < nodes.length && shape !== befores[i].shape; ++i)
                    dataNodes[key].push({before: befores[i], current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, shape: shape, width: nodes[i].bB.bNode.width, height: nodes[i].bB.bNode.height}});
                if(dataNodes[key].length === 0)
                    delete dataNodes[key];
            }
            record.rec('styleShape', dataNodes);
            Render.draw();
            updateDom.shape();
        },

        Color: {
            fillStyleNode: function(fillStyle){
                var dataNodes = [];
                for(var key in subTrees){
                    var nodes = subTrees[key].getNodes(), befores = [];
                    
                    for(var i = 0; i < nodes.length; ++i)
                        befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, fillStyle: nodes[i].style.sNode.fillStyle});

                    nodes[0].getTree().Style.Color.fillStyleNodes(nodes, Array.apply(null, Array(nodes.length)).map(String.prototype.valueOf, fillStyle));
                        
                    dataNodes[key] = [];
                    for(var i = 0; i < nodes.length && fillStyle !== befores[i].fillStyle; ++i)
                        dataNodes[key].push({before: befores[i], current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, fillStyle: fillStyle}});
                    if(dataNodes[key].length === 0)
                        delete dataNodes[key];
                }
                record.rec('styleFillNode', dataNodes);
                updateDom.fillStyleNode();
            },

            strokeStyleNode: function(strokeStyle){
                var dataNodes = [];
                for(var key in subTrees){
                    var nodes = subTrees[key].getNodes(), befores = [];

                    for(var i = 0; i < nodes.length; ++i)
                        befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, strokeStyle: nodes[i].style.sNode.strokeStyle});

                    nodes[0].getTree().Style.Color.strokeStyleNodes(nodes, Array.apply(null, Array(nodes.length)).map(String.prototype.valueOf, strokeStyle));
                        
                    dataNodes[key] = [];
                    for(var i = 0; i < nodes.length && strokeStyle !== befores[i].strokeStyle; ++i)
                        dataNodes[key].push({before: befores[i], current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, strokeStyle: strokeStyle}});
                    if(dataNodes[key].length === 0)
                        delete dataNodes[key];
                }
                record.rec('styleStrokeNode', dataNodes);
                updateDom.strokeStyleNode();
            },

            strokeStyleEdge: function(strokeStyle){
                var dataNodes = [];
                for(var key in subTrees){
                    var nodes = subTrees[key].getNodes(), befores = [];

                    for(var i = 0; i < nodes.length; ++i)
                        befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, strokeStyle: nodes[i].style.sEdge.strokeStyle});

                    nodes[0].getTree().Style.Color.strokeStyleEdges(nodes, Array.apply(null, Array(nodes.length)).map(String.prototype.valueOf, strokeStyle));
                        
                    dataNodes[key] = [];
                    for(var i = 0; i < nodes.length && strokeStyle !== befores[i].strokeStyle; ++i)
                        dataNodes[key].push({before: befores[i], current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, strokeStyle: strokeStyle}});
                    if(dataNodes[key].length === 0)
                        delete dataNodes[key];
                }
                record.rec('styleStrokeEdge', dataNodes);
                updateDom.strokeStyleEdge();
            }
        },

        LineDash: {
            lineDashNode: function(lineDash){
                var dataNodes = [];
                for(var key in subTrees){
                    var nodes = subTrees[key].getNodes(), beforesLineDash = [], beforesLineWidth = [], lineDashes = [], lineWidths = [];
                    for(var i = 0; i < nodes.length; ++i){
                        beforesLineDash.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, lineDash: nodes[i].style.sNode.lineDash});
                        beforesLineWidth.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, lineWidth: nodes[i].style.sNode.lineWidth});
                        if(lineDash == 1)
                            lineDashes.push([]);
                        else if(lineDash == 2)
                            lineDashes.push([5, 5]);
                        else    
                            lineDashes.push(undefined);
                    }
    
                    subTrees[key].getTree().Style.LineDash.lineDashNodes(nodes, lineDashes);
                        
                    dataNodes[key] = [];
                    for(var i = 0; i < nodes.length && nodes[i].style.sNode.lineDash !== beforesLineDash[i].lineDash; ++i)
                        dataNodes[key].push({
                            lineDash: {
                                before: beforesLineDash[i], 
                                current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, lineDash: nodes[i].style.sNode.lineDash}
                            },
                            lineWidth: {
                                before: beforesLineWidth[i], 
                                current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, lineWidth: nodes[i].style.sNode.lineWidth}
                            }
                        });

                    if(dataNodes[key].length === 0)
                        delete dataNodes[key];
                }
                record.rec('styleLineDashNode', dataNodes);
                updateDom.lineWidthNode();
            },

            lineDashEdge: function(lineDash){
                var dataNodes = [];

                for(var key in subTrees){
                    var nodes = subTrees[key].getNodes(), befores = [], lineDashes = [];
                    for(var i = 0; i < nodes.length; ++i){
                        befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, lineDash: nodes[i].style.sEdge.lineDash});
                        if(lineDash == 2) 
                            lineDashes.push([5, 5])
                        else 
                            lineDashes.push([]);
                    }

                    nodes[0].getTree().Style.LineDash.lineDashEdges(nodes, lineDashes);

                    dataNodes[key] = [];
                    for(var i = 0; i < nodes.length && nodes[i].style.sEdge.lineDash  !== befores[i].lineDash; ++i)
                        dataNodes[key].push({before: befores[i], current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, lineDash: nodes[i].style.sEdge.lineDash}});
                    if(dataNodes[key].length === 0)
                        delete dataNodes[key];
                }
                record.rec('styleLineDashEdge', dataNodes);
            }
        },
    };

    this.Text = {
        nameNode: function(nameNode){
            var dataNodes = [];
            for(var key in subTrees){
                var nodes = subTrees[key].getNodes(), befores = [];

                for(var i = 0; i < nodes.length; ++i)
                    befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, nameNode: nodes[i].text.nameNode}); 

                // http://stackoverflow.com/questions/1295584/most-efficient-way-to-create-a-zero-filled-javascript-array
                subTrees[key].getTree().Text.nameNodes(nodes, Array.apply(null, Array(nodes.length)).map(String.prototype.valueOf, nameNode));

                dataNodes[key] = [];
                for(var i = 0; i < nodes.length; ++i)
                    if(nameNode !== befores[i].nameNode)
                        dataNodes[key].push({before: befores[i], current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, nameNode: nameNode}});
                if(dataNodes[key].length === 0)
                    delete dataNodes[key];
            }
            record.rec2('textNameNode', dataNodes);
        },

        nameEdge: function(nameEdge){
            var dataNodes = [];
            for(var key in subTrees){
                var nodes = subTrees[key].getNodes(), befores = [];

                for(var i = 0; i < nodes.length; ++i)
                    befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, nameEdge: nodes[i].text.nameEdge}); 

                nodes[0].getTree().Text.nameEdges(nodes, Array.apply(null, Array(nodes.length)).map(String.prototype.valueOf, nameEdge));

                dataNodes[key] = [];
                for(var i = 0; i < nodes.length; ++i)
                    if(nameEdge !== befores[i].nameEdge)
                        dataNodes[key].push({before: befores[i], current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, nameEdge: nameEdge}});
                if(dataNodes[key].length === 0)
                    delete dataNodes[key];    
            }
            record.rec2('textNameEdge', dataNodes);
        },

        opcional: function(opcional){
            var dataNodes = [];
            for(var key in subTrees){
                var nodes = subTrees[key].getNodes(), befores = [];

                for(var i = 0; i < nodes.length; ++i)
                    befores.push({pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, opcional: nodes[i].text.opcional}); 

                nodes[0].getTree().Text.opcionals(nodes, Array.apply(null, Array(nodes.length)).map(String.prototype.valueOf, opcional));

                dataNodes[key] = [];
                for(var i = 0; i < nodes.length; ++i)
                    if(opcional !== befores[i].opcional)
                        dataNodes[key].push({before: befores[i], current: {pos: {x: nodes[i].bB.bNode.x, y: nodes[i].bB.bNode.y}, opcional: opcional}});
                if(dataNodes[key].length === 0)
                    delete dataNodes[key];  
            }
            record.rec2('textOpcional', dataNodes);
            updateDom.info();
        }    
    };

    this.Photo = {
        load: function(){
            if(trees.length > 0){
                self.SubForest.empty();
                
                // busca un bounding box 'bBPhoto' que cubra todos los bounding box de cada capa
                var bBTree = trees[0].bBTree;
                bBPhoto = {xMin: bBTree.xMin, yMin: bBTree.yMin, xMax: bBTree.xMax, yMax: bBTree.yMax};

                for(var i = 1; i < trees.length; ++i){
                    bBTree = trees[i].bBTree;
                    if(bBPhoto.xMin > bBTree.xMin) bBPhoto.xMin = bBTree.xMin;
                    if(bBPhoto.xMax < bBTree.xMax) bBPhoto.xMax = bBTree.xMax;
                    if(bBPhoto.yMin > bBTree.yMin) bBPhoto.yMin = bBTree.yMin;
                    if(bBPhoto.yMax < bBTree.yMax) bBPhoto.yMax = bBTree.yMax;
                }

                // holga el el bounding box 'bBPhoto'
                bBPhoto.xMin -= 10;  
                bBPhoto.yMin -= 10;
                bBPhoto.xMax += 10;
                bBPhoto.yMax += 10;

                // no permite que el bounding box 'bBPhoto' sobrepase los límites del canvas - la función ctx.drawImage no retorna el dibujo si se le pasa límites que sobrepasa el canvas
                if(bBPhoto.xMin < 0) bBPhoto.xMin = 0;
                if(bBPhoto.xMax > canvas.clientWidth) bBPhoto.xMax = canvas.clientWidth;
                if(bBPhoto.yMin < 0) bBPhoto.yMin = 0;
                if(bBPhoto.yMax > canvas.clientHeight) bBPhoto.yMax = canvas.clientHeight;
                
                // calcula el ancho y alto del bounding box 'bBPhoto'
                bBPhoto.width = bBPhoto.xMax - bBPhoto.xMin;
                bBPhoto.height = bBPhoto.yMax - bBPhoto.yMin;       
                this.drawInit();

                updateDom.complete();
            }
        },

        translate: function(diff){
            bBPhoto.xMin += diff.x;
            bBPhoto.xMax += diff.x;
            bBPhoto.yMin += diff.y;
            bBPhoto.yMax += diff.y;
            context.clearRect(0, 0, canvas.width, canvas.height);
            this.draw();
        },

        crop: function(pointCtrl, pos, isSimetric){
            var crop = {
                centerRight: function(pos){
                    if(pos.x > bBPhoto.xMin + Forest.source.sBBPhoto.minSize){
                        var diff = pos.x - bBPhoto.xMax;
                        bBPhoto.xMax = pos.x;
                        bBPhoto.xMin -= diff;
                        bBPhoto.width = bBPhoto.xMax - bBPhoto.xMin;
                    }else{
                        var half = bBPhoto.width/2,
                            minHalf = Forest.source.sBBPhoto.minSize/2
                        bBPhoto.xMax = bBPhoto.xMax - half + minHalf;
                        bBPhoto.xMin = bBPhoto.xMin + half - minHalf;
                        bBPhoto.width = Forest.source.sBBPhoto.minSize;
                    }
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    self.Photo.draw();
                },

                centerLeft: function(pos){
                    if(pos.x < bBPhoto.xMax - Forest.source.sBBPhoto.minSize){
                        var diff = bBPhoto.xMin - pos.x;
                        bBPhoto.xMin = pos.x;
                        bBPhoto.xMax += diff;
                        bBPhoto.width = bBPhoto.xMax - bBPhoto.xMin;
                    }else{
                        var half = bBPhoto.width/2,
                            minHalf = Forest.source.sBBPhoto.minSize/2
                        bBPhoto.xMin = bBPhoto.xMin + half - minHalf;
                        bBPhoto.xMax = bBPhoto.xMax - half + minHalf;
                        bBPhoto.width = Forest.source.sBBPhoto.minSize;
                    }
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    self.Photo.draw();
                },

                centerTop: function(pos){
                    if(pos.y < bBPhoto.yMax - Forest.source.sBBPhoto.minSize){
                        var diff = bBPhoto.yMin - pos.y;
                        bBPhoto.yMin = pos.y;
                        bBPhoto.yMax += diff;
                        bBPhoto.height = bBPhoto.yMax - bBPhoto.yMin;
                    }else{
                        var half = bBPhoto.height/2,
                            minHalf = Forest.source.sBBPhoto.minSize/2
                        bBPhoto.yMin = bBPhoto.yMin + half - minHalf;
                        bBPhoto.yMax = bBPhoto.yMax - half + minHalf;
                        bBPhoto.height = Forest.source.sBBPhoto.minSize;
                    }
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    self.Photo.draw();
                },

                centerBottom: function(pos){
                    if(pos.y > bBPhoto.yMin + Forest.source.sBBPhoto.minSize){
                        var diff = pos.y - bBPhoto.yMax;
                        bBPhoto.yMax = pos.y;
                        bBPhoto.yMin -= diff;
                        bBPhoto.height = bBPhoto.yMax - bBPhoto.yMin;
                    }else{
                        var half = bBPhoto.height/2,
                            minHalf = Forest.source.sBBPhoto.minSize/2
                        bBPhoto.yMin = bBPhoto.yMin + half - minHalf;
                        bBPhoto.yMax = bBPhoto.yMax - half + minHalf;
                        bBPhoto.height = Forest.source.sBBPhoto.minSize;
                    }
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    self.Photo.draw();
                },

                centerTopLeft: function(pos){
                    crop.centerTop(pos);
                    crop.centerLeft(pos);
                },

                centerTopRight: function(pos){
                    crop.centerTop(pos);
                    crop.centerRight(pos);
                },

                centerBottomRight: function(pos){
                    crop.centerBottom(pos);
                    crop.centerRight(pos);
                },

                centerBottomLeft: function(pos){
                    crop.centerBottom(pos);
                    crop.centerLeft(pos);
                },

                top: function(pos){
                    if(pos.y < bBPhoto.yMax - Forest.source.sBBPhoto.minSize){
                        bBPhoto.yMin = pos.y;
                        bBPhoto.height = bBPhoto.yMax - pos.y;
                    }else{
                        bBPhoto.yMin = bBPhoto.yMax - Forest.source.sBBPhoto.minSize;
                        bBPhoto.height = Forest.source.sBBPhoto.minSize;
                    }
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    self.Photo.draw();
                },

                bottom: function(pos){
                    if(pos.y > bBPhoto.yMin + Forest.source.sBBPhoto.minSize){
                        bBPhoto.yMax = pos.y;
                        bBPhoto.height = pos.y - bBPhoto.yMin;
                    }else{
                        bBPhoto.yMax = bBPhoto.yMin + Forest.source.sBBPhoto.minSize;
                        bBPhoto.height = Forest.source.sBBPhoto.minSize;
                    }
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    self.Photo.draw();
                },

                right: function(pos){
                    if(pos.x > bBPhoto.xMin + Forest.source.sBBPhoto.minSize){
                        bBPhoto.xMax = pos.x;
                        bBPhoto.width = pos.x - bBPhoto.xMin;
                    }else{
                        bBPhoto.xMax = bBPhoto.xMin + Forest.source.sBBPhoto.minSize;
                        bBPhoto.width = Forest.source.sBBPhoto.minSize;
                    }
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    self.Photo.draw();
                },

                left: function(pos){
                    if(pos.x < bBPhoto.xMax - Forest.source.sBBPhoto.minSize){
                        bBPhoto.xMin = pos.x;
                        bBPhoto.width = bBPhoto.xMax - pos.x;
                    }else{
                        bBPhoto.xMin = bBPhoto.xMax - Forest.source.sBBPhoto.minSize;
                        bBPhoto.width = Forest.source.sBBPhoto.minSize;
                    }
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    self.Photo.draw();
                },

                topLeft: function(pos){
                    crop.top(pos);
                    crop.left(pos);
                },

                topRight: function(pos){
                    crop.top(pos);
                    crop.right(pos);
                },

                bottomRight: function(pos){
                    crop.bottom(pos);
                    crop.right(pos);
                },       
                
                bottomLeft: function(pos){
                    crop.bottom(pos);
                    crop.left(pos);
                },
            };

            if(pointCtrl == 0){
                if(isSimetric) crop.centerTopLeft(pos);
                else crop.topLeft(pos);
            
            }else if(pointCtrl == 1){
                if(isSimetric) crop.centerTop(pos);
                else crop.top(pos);
            
            }else if(pointCtrl == 2){
                if(isSimetric) crop.centerTopRight(pos);
                else crop.topRight(pos);
            
            }else if(pointCtrl == 3){
                if(isSimetric) crop.centerRight(pos);
                else crop.right(pos);
            
            }else if(pointCtrl == 4){
                if(isSimetric) crop.centerBottomRight(pos);
                else crop.bottomRight(pos);
            
            }else if(pointCtrl == 5){
                if(isSimetric) crop.centerBottom(pos);
                else crop.bottom(pos);
            
            }else if(pointCtrl == 6){
                if(isSimetric) crop.centerBottomLeft(pos);
                else crop.bottomLeft(pos);
            
            }else if(pointCtrl == 7){
                if(isSimetric) crop.centerLeft(pos);
                else crop.left(pos);
            }
        },

        draw: function(){
            bBPhoto = {xMin: Math.round(bBPhoto.xMin), yMin: Math.round(bBPhoto.yMin), 
                       xMax: Math.round(bBPhoto.xMax), yMax: Math.round(bBPhoto.yMax),
                       width: Math.round(bBPhoto.width), height: Math.round(bBPhoto.height)};

            // square
            context.fillStyle = 'rgba(55, 58, 71, 0.1)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.clearRect(bBPhoto.xMin-1, bBPhoto.yMin-1, bBPhoto.width+2, bBPhoto.height+2);

            // guides
            context.lineWidth = Forest.source.sBBPhoto.lineWidth;
            context.strokeStyle = 'rgb(55, 58, 71)';
            context.beginPath();
            var line = Math.round(bBPhoto.width / 3);
            context.moveTo(bBPhoto.xMin + line, bBPhoto.yMin);
            context.lineTo(bBPhoto.xMin + line, bBPhoto.yMax);
            context.moveTo(bBPhoto.xMin + line * 2, bBPhoto.yMin);
            context.lineTo(bBPhoto.xMin + line * 2, bBPhoto.yMax);
            line = Math.round(bBPhoto.height / 3);
            context.moveTo(bBPhoto.xMin, bBPhoto.yMin + line);
            context.lineTo(bBPhoto.xMax, bBPhoto.yMin + line);
            context.moveTo(bBPhoto.xMin, bBPhoto.yMin + line * 2);
            context.lineTo(bBPhoto.xMax, bBPhoto.yMin + line * 2);
            context.stroke();

            // bBPhoto
            context.strokeStyle = 'rgb(55, 58, 71)';
            context.beginPath();
            context.strokeRect(bBPhoto.xMin, bBPhoto.yMin, bBPhoto.width, bBPhoto.height);

            // point control
            context.fillStyle = 'rgb(55, 58, 71)';
            Render.drawHandles(bBPhoto, Forest.source.sBBPhoto.sControl.width);           
        },

        drawInit: function(){
            bBPhoto = {xMin: Math.round(bBPhoto.xMin), yMin: Math.round(bBPhoto.yMin), 
                       xMax: Math.round(bBPhoto.xMax), yMax: Math.round(bBPhoto.yMax),
                       width: Math.round(bBPhoto.width), height: Math.round(bBPhoto.height)};

            context.clearRect(0, 0, canvas.width, canvas.height);

            // square
            context.fillStyle = 'rgba(55, 58, 71, 0.1)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.clearRect(bBPhoto.xMin-1, bBPhoto.yMin-1, bBPhoto.width+2, bBPhoto.height+2);

            // bBPhoto
            context.setLineDash([5, 5])
            context.lineWidth = Forest.source.sBBPhoto.lineWidth;
            context.strokeStyle = 'rgb(55, 58, 71)';
            context.beginPath();
            context.strokeRect(bBPhoto.xMin, bBPhoto.yMin, bBPhoto.width, bBPhoto.height);
            context.setLineDash([])

            // point control
            context.fillStyle = 'rgb(55, 58, 71)';
            Render.drawHandles(bBPhoto, Forest.source.sBBPhoto.sControl.width);           
        },

        capture: function(){
            // crea un canvas temporal para que se le dibuje en ella todas las capas canvas
            var bufferCanvas = document.createElement('canvas');
            bufferCanvas.width = bBPhoto.width;
            bufferCanvas.height = bBPhoto.height;
            var bufferContext = bufferCanvas.getContext('2d');

            bufferContext.mozImageSmoothingEnabled = false;
            bufferContext.webkitImageSmoothingEnabled = false;
            bufferContext.msImageSmoothingEnabled = false;
            bufferContext.imageSmoothingEnabled = false;

            for(var i = trees.length - 1; i >= 0; --i)
                bufferContext.drawImage(trees[i].getCanvas(), 
                                        bBPhoto.xMin, bBPhoto.yMin, bBPhoto.width, bBPhoto.height,
                                        0, 0, bBPhoto.width, bBPhoto.height);

            return bufferCanvas.toDataURL("image/png");
        },

        cancel: function(){
            context.clearRect(0, 0, canvas.width, canvas.height);
            bBPhoto = undefined;
            updateDom.barTool();
        },

        getBBPhotoPointCntrl: function(pos){
            return getBBPointCtrl(pos, bBPhoto, 4);
        },

        isPosInsideBBPhoto: function(pos){
            return( pos.x >= bBPhoto.xMin && pos.x <= bBPhoto.xMax && pos.y >= bBPhoto.yMin && pos.y <= bBPhoto.yMax);
        },
    };

    this.newDocument = function(){
        if(trees.length > 0){
            Render.clear();
            self.SubForest.empty();
            while(trees.length > 0){
                var tree = trees[0];
                tree.remove(tree.getRootNode());
                self.removeTree(tree);
            }
            record.reset();
            updateDom.complete();
        }
    };

    this.saveDocument = function(){
        record.save();
        return this.Export.original();
    };
         
    this.Record = {
        undo: function(){
            Render.clear();
            var subNodes = record.undo();
            if(subNodes){
                if(subNodes.length > 0)
                    self.SubForest.setNodes(subNodes);
                else
                    self.SubForest.empty();
                updateDom.complete();
            }
            Render.draw();
        },

        redo: function(){
            Render.clear();
            var subNodes = record.redo();
            if(subNodes){
                if(subNodes.length > 0)
                    self.SubForest.setNodes(subNodes);
                else
                    self.SubForest.empty();
                updateDom.complete();
            }
            Render.draw();
        }
    };

    this.isClosable = function(){
        if(record.getIcheckpoint() !== record.getIcurrent())
            return true;
        return false
    };
    
    updateDom.complete();
};
Forest.source = {
    sBBTree: {lineWidth: 2,
        sControl:{width: 6}},
    sBBPhoto: {lineWidth: 2, minSize: 20,
        sControl: {width: 4}},
    sSelection: {looseness: 2}, 
    angleFull: 2 * Math.PI
};