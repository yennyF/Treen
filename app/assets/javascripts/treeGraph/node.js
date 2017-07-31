/*
 * Tree graph with HTML5 and JavaScript.
 * Date: 2015.
 * Dependencies: none
 *
 * Copyright (c) 2015 Yenny Fung Guan
 */
/* 
    nodo y arista:
  
      lineWidth  <-----* |-----| 
      (edge)
                         | | | |
    lineWidth            | | | |  
    (node)     |-----|   | | | |        
        ^-----*|    _________________
               |   / _______________ *---------> borde exterior: límite de la figura + el borde exterior (borde/2)      
               |  / / _____________*-----------> borde (o radio): limite real de la figura (sin borde)
               | / / / ___________*------------> borde interior: límite de la figura - el borde exterior (borde/2)
                / / / /           \ \ \ \        
               | | | |    (x,y)   | | | |
               | | | |      . *----------------> centro (x,y): el centro del nodo
               | | | |            | | | |
                \ \ \ \___________/ / / /
                 \ \ \_____________/ / / 
                  \ \_______________/ /
                   \_________________/

                     |------------| *-----------> withIn / heightIn
                  |------------------| *--------> with / height
               |------------------------| *-----> withOut / heightOut 
        

    bounding box tree:
    
      0  1  2
      *--*--*
      |  o  |     nº 0, 1, 2, 3, 4, 5, 6, 7
    7 * /|\ * 3   * = control points
      |o o o|
      *--*--*  
      6  5  4
*/

var Node = function(data){
    var tree;                   // variable que mantiene una referencia hacia atrás (en caso que sea instancia desde un objeto RenderTree)
    this.depth = 0;
    this.parent = null;
    this.siblingLeft = null;
    this.siblingRight = null;
    this.limitLeft = null;      // tando hermano como primo izquierdo
    this.limitRight = null;     // tando hermano como primo  derecho
    this.children = [];         // subárbol de tamaño cero
    this.expand = true;         // si expande sus hijos
    this.render = true;         // si se dibuja - cuando un nodo no está expandido, sus hijos tinen render=fasle

    this.text = {
        nameNode: undefined,
        nameEdge: undefined,
        opcional: undefined,
    };

    this.bB = {
        bNode: {
            x: undefined, y: undefined,
            width: undefined, height: undefined, widthHalf: undefined, heightHalf: undefined,
            widthOut: undefined, heightOut: undefined, widthOutHalf: undefined, heightOutHalf: undefined,
            bText: {width: undefined, height: undefined},
        },

        bExpand: {
            width: undefined, height: undefined, widthHalf: undefined, marginTop: undefined,
        },
    };
    
    this.style = {
        sNode: {shape: Node.source.sNode.shape, lineWidth: Node.source.sNode.lineWidth, fillStyle: 'rgb(255, 255, 255)', strokeStyle: 'rgb(0, 0, 0)', lineDash: [],
            sText: {fillStyle: '#000', fontSize: undefined, fontSizeMax: undefined, fontFace: 'serif'},
        },

        sExpand: {fillStyle: '#000'},
        
        sEdge: {strokeStyle: 'rgb(0, 0, 0)', lineWidth: Node.source.sEdge.lineWidth, lineDash: [],
            sText: {fillStyle: '#000', fontFace: 'serif'}
        },
    };

    this.getTree = function(){
        return tree;
    };

    this.setTree = function(treeLocal){
        tree = treeLocal;
    };

    this.resizeWidth = function(width){
        this.bB.bNode.width = width;
        this.bB.bNode.widthHalf =  width / 2;
        this.bB.bNode.widthOut = width + this.style.sNode.lineWidth;
        this.bB.bNode.widthOutHalf = this.bB.bNode.widthOut / 2;
        this.bB.bNode.bText.width = (Node.source.sNode.sText.width * (width - this.style.sNode.lineWidth)) / (Node.source.sNode.width - Node.source.sNode.lineWidth);
    };

    this.resizeHeight = function(height){
        this.bB.bNode.height = height;
        this.bB.bNode.heightHalf =  height / 2;
        this.bB.bNode.heightOut = height + this.style.sNode.lineWidth;
        this.bB.bNode.heightOutHalf = this.bB.bNode.heightOut / 2;
        this.bB.bNode.bText.height = (Node.source.sNode.sText.height * (height - this.style.sNode.lineWidth)) / (Node.source.sNode.height - Node.source.sNode.lineWidth);
    };

    this.resizeFontSizeMax = function(){
        var fontSizeMaxW = (Node.source.sNode.sText.fontSize * this.bB.bNode.bText.width) / Node.source.sNode.sText.width;
        var fontSizeMaxH = (Node.source.sNode.sText.fontSize * this.bB.bNode.bText.height) / Node.source.sNode.sText.width;
        if(fontSizeMaxW > fontSizeMaxH)
            this.style.sNode.sText.fontSizeMax = Math.round(fontSizeMaxH);
        else
            this.style.sNode.sText.fontSizeMax = Math.round(fontSizeMaxW);
    };

    this.resizeExpand = function(){ 
        this.bB.bExpand.widthHalf = Math.round((this.bB.bNode.width + this.bB.bNode.height) / 8);
        this.bB.bExpand.width = 2 * this.bB.bExpand.widthHalf;
        this.bB.bExpand.height = this.bB.bExpand.widthHalf;
        this.bB.bExpand.marginTop = Math.round(this.bB.bExpand.width / 3);
    };

    this.resizeLineWidthNode = function(lineWidth){ 
        this.style.sNode.lineWidth = lineWidth;
        this.resizeWidth(this.bB.bNode.width);
        this.resizeHeight(this.bB.bNode.height);
        this.resizeExpand();
    };

    this.resizeLineWidthEdge = function(lineWidth){
        this.style.sEdge.lineWidth = lineWidth;
    };

    var __construct = function(that) {
        function sizeLoad(width, height){
            that.resizeWidth(width);
            if(that.style.sNode.shape === "rect")
                that.resizeHeight(height);
            else
                that.resizeHeight(width);
            that.resizeFontSizeMax();
            that.resizeExpand();
        };

        if(data && data.tree)
            tree = data.tree;

        if(data && data.expand !== undefined)
            that.expand = data.expand;
        
        if(data && data.text)
            that.text = data.text;
        
        if(data && data.style)
            that.style = JSON.parse(JSON.stringify(data.style));
        
        if(data && data.bB)
            sizeLoad(data.bB.bNode.width, data.bB.bNode.height); 
        else
            sizeLoad(Node.source.sNode.width, Node.source.sNode.height);
    }(this);

    // agrega un nodo (subárbol) hijo: el hijo es agregado a la derecha, como el último hijo
    this.addChild = function(data){
        var node = new Node(data);
        node.depth = this.depth + 1;
        node.setTree(this.getTree());
       
        if(!this.render || !this.expand)      // si su padre no está visible o no expande sus hijos, su hijo no debe renderizarse
            node.render = false;

        node.parent = this;
        this.children.push(node);
       
        var sibling = this.children[this.children.length-2];    
        if(sibling){                                           // si tiene hermano al menos un hermano izquierdo
            node.siblingLeft = node.limitLeft = sibling;           // *|hermano| - *|nuevo (hermano/límite izquierdo)|
            sibling.siblingRight = sibling.limitRight = node;      // *|hermano (hermano/límite derecho)| - *|nuevo|
        }else{                                                 
            var cousin = node.getCousinLeft();
            if(cousin){                                        // si no tiene, buscamos al primo    
                node.limitLeft = cousin;                          // *|primo| - *|nuevo (limite izquierdo)|
                cousin.limitRight = node;                         // *|primo (límite derecho)| - *|nuevo|
            }
        }

        var cousin = node.getCousinRight();    // recuerda: el último hijo no tiene hermanos derecho, así que se busca de una al primo derecho
        if(cousin){                            // si tiene primo derecho
            node.limitRight = cousin;              // *|nuevo (límite derecho)| - *|primo|
            cousin.limitLeft = node;               // *|primo (límite izquierdo)| - *|nuevo|
        }
        
        return node;
    };

    // agrega un nodo (subárbol) hermano izquierdo
    this.addLeft = function(data){
        if(this.parent){                                    
            var node = new Node(data);

            for(var i = 0; i < this.parent.children.length; ++i)
                if(this.parent.children[i] === this){       
                    this.parent.children.splice(i, 0, node);
                    break;
                }

            node.depth = this.depth;
            node.parent = this.parent;
            node.setTree(this.getTree());
            
            var sibling = this.siblingLeft;
            if(sibling){
                sibling.siblingRight = sibling.limitRight = node;
                node.siblingLeft = node.limitLeft = sibling;
            }else{ 
                var cousin = this.limitLeft;
                if(cousin){
                    cousin.limitRight = node;
                    node.limitLeft = cousin;    
                }
            }
            node.siblingRight = node.limitRight = this;     // recuerda: si se agrega un hermano izquierdo es porque existe un hermano derecho para éste
            this.siblingLeft = this.limitLeft = node;

            return node;
        }
        return null;
    };

    // agrega un nodo (subárbol) hermano derecho
    this.addRight = function(data){
        if(this.parent){                                           
            var node = new Node(data);
            
            if(this.siblingRight){
                for(var i = 0; i < this.parent.children.length; ++i)
                    if(this.parent.children[i] === this){           
                        this.parent.children.splice(i + 1, 0, node);
                        break;                                      
                    }
            }else{
                this.parent.children.push(node);
            }

            node.depth = this.depth;
            node.parent = this.parent;
            node.setTree(this.getTree());
                   
            var sibling = this.siblingRight;
            if(sibling){
                node.siblingRight = node.limitRight = sibling;
                sibling.siblingLeft = sibling.limitLeft = node;
            }else{ 
                var cousin = this.limitRight;
                if(cousin){
                    node.limitRight = cousin;    
                    cousin.limitLeft = node;
                }
            }
            this.siblingRight = this.limitRight = node;     // recuerda: si se agrega un hermano derecho es porque existe un hermano izquierdo para éste
            node.siblingLeft = node.limitLeft = this;

            return node;
        }
        return null;
    };

    // remueve un nodo hijo: al elimiar el nodo también se elimina sus descendientes 
    this.remove = function(){      
        if(this.parent){
            //reestablece la conexion entre el hermano izquierdo  y derecho del nodo a eliminar
            var siblingLeft = this.siblingLeft,
                siblingRight = this.siblingRight;
            if(siblingLeft)
                siblingLeft.siblingRight = siblingRight;
            if(siblingRight)
                siblingRight.siblingLeft = siblingLeft;

            //reestablece la conexion entre los nodos que rodean los extremos de cada nivel del subarbol que se elimina
            var limitLeft = this.limitLeft,
                limitRight = this.limitRight;
            while(limitLeft && limitRight && limitLeft.limitRight !== limitRight){
                limitLeft.limitRight = limitRight;
                limitRight.limitLeft = limitLeft;
                limitLeft = limitLeft.getNextBorderRight();
                limitRight = limitRight.getNextBorderLeft();
            }

            if(limitLeft && limitLeft.limitRight !== limitRight){
                while(limitLeft && limitLeft.limitRight){
                    limitLeft.limitRight = null;
                    limitLeft = limitLeft.getNextBorderRight();
                }
            }else if(limitRight && limitRight.limitLeft !== limitLeft){
                while(limitRight && limitRight.limitLeft){
                    limitRight.limitLeft = null;
                    limitRight = limitRight.getNextBorderLeft();
                }
            }

            // remueve el apuntador hijo del padre del nodo a eliminar (solo el apuntador hijo que apunta al nodo a eliminar)
            for(var i = 0; i < this.parent.children.length; ++i){   
                if(this === this.parent.children[i]){
                    delete this.parent.children[i];
                    this.parent.children.splice(i, 1);      // *|padre (hijo)| - *|nodo a eliminar| -> *|padre (nodo hijo)| - null
                    break;
                }
            }
        }else{
            tree = undefined;  
            data = undefined;
            delete this.depth;
            delete this.parent;
            delete this.siblingLeft;
            delete this.siblingRight;
            delete this.limitLeft;
            delete this.limitRight;
            delete this.children;
            delete this.expand;
            delete this.render;
            delete this.text;
            delete this.bB;
            delete this.style;
        }
    };

    this.fitText = function(context){
        function calcMeasureText(text) {
            var span = document.createElement('span'),
                body = document.getElementsByTagName('body')[0];
            span.style.font = context.font;
            span.textContent = text; // http://www.html5rocks.com/en/tutorials/canvas/texteffects/
            body.appendChild(span);
            textHeight = span.offsetHeight;
            body.removeChild(span);
            return {
                /*width: context.measureText(text).width,*/
                height: textHeight
            };
        }

        if(this.text.nameNode !== undefined && this.text.nameNode.length > 1){
            // http://stackoverflow.com/questions/20551534/size-to-fit-font-on-a-canvas
            var newfontSize = this.style.sNode.sText.fontSizeMax;
            context.font = newfontSize + "px " + this.style.sNode.sText.fontFace;
        
            while(context.measureText(this.text.nameNode).width > this.bB.bNode.bText.width){ 
                newfontSize--;
                context.font = newfontSize + "px " + this.style.sNode.sText.fontFace;
            }

            while(calcMeasureText(this.text.nameNode).height > this.bB.bNode.bText.height){ 
                newfontSize--;
                context.font = newfontSize + "px " + this.style.sNode.sText.fontFace;
            }

            this.style.sNode.sText.fontSize = newfontSize;
        }else{
            this.style.sNode.sText.fontSize = this.style.sNode.sText.fontSizeMax;
        }
    },

    this.export = function(){
        function exportDescendent(node){
            var nodeRaws = [];
            for(var i = 0; i < node.children.length; ++i){
                var child = node.children[i];
                nodeRaws.push({
                    expand: child.expand, 
                    text: JSON.parse(JSON.stringify(child.text)), 
                    style: JSON.parse(JSON.stringify(child.style)),
                    bB: JSON.parse(JSON.stringify(child.bB)),
                    children: exportDescendent(child)
                });
            }
            return nodeRaws;
        }

        var nodeRaw = {
            instance: 'Tree',
            expand: this.expand, 
            text: JSON.parse(JSON.stringify(this.text)), 
            style: JSON.parse(JSON.stringify(this.style)), 
            bB: JSON.parse(JSON.stringify(this.bB)), 
            children: exportDescendent(this)
        };
        return nodeRaw;
    };

    this.import = function(nodeRaw){
        function importDescendent(node, nodeRaw){
            for(var i = 0; i < nodeRaw.children.length; ++i){
                var childPlane = nodeRaw.children[i];
                var child = node.addChild({ 
                    expand: childPlane.expand,
                    text: JSON.parse(JSON.stringify(childPlane.text)), 
                    style: JSON.parse(JSON.stringify(childPlane.style)),
                    bB: JSON.parse(JSON.stringify(childPlane.bB))
                });
                importDescendent(child, childPlane);
            }
        }
        
        if(nodeRaw.instance === 'Tree'){
            this.expand = nodeRaw.expand;
            this.text = JSON.parse(JSON.stringify(nodeRaw.text));
            this.style = JSON.parse(JSON.stringify(nodeRaw.style));
            this.bB = JSON.parse(JSON.stringify(nodeRaw.bB));

            while(this.children.length > 0)
                this.children[0].remove();

            importDescendent(this, nodeRaw);
            return this;
        }
        return null;
    };

    this.importAddChild = function(index, nodeRaw){
        if(nodeRaw.instance === 'Tree'){
            var child = this.children[index];
            if(child)
                return child.addLeft().import(nodeRaw);
            else
                return this.addChild().import(nodeRaw);
        }
        return null;
    };

    this.toogleExpand = function(){
        function toogleRenderNodesDescendent(node){
            for(var i = 0; i < node.children.length; ++i){
                var child = node.children[i];
                child.render = !child.render;
                if(child.expand && child.children.length > 0)
                    toogleRenderNodesDescendent(child);
            }
        }
        this.expand = !this.expand;
        toogleRenderNodesDescendent(this);
    };

    // obtiene el primo izquierdo más cernano
    this.getCousinLeft = function(){
        var node = this.parent;
        if(node){
            node = node.limitLeft;
            while(node){
                if(node.children.length > 0)
                    return node.children[node.children.length - 1];
                node = node.limitLeft;
            }
        }
        return null; 
    };

    // obtiene el primo derecho más cernano
    this.getCousinRight = function(){
        var node = this.parent;
        if(node){
            node = node.limitRight;
            while(node){
                if(node.children.length > 0)
                    return node.children[0];
                node = node.limitRight;
            }
        }
        return null;        
    };

    this.getNextBorderLeft = function(){
    	var node = this;
    	while(node){
    		if(node.children[0] !== undefined)
    			return node.children[0];
    		node = node.limitRight;
    	}
    	return null;
    };

    this.getNextBorderRight = function(){
        var node = this;
    	while(node){
    		if(node.children[node.children.length-1] !== undefined)
    			return node.children[node.children.length-1];
    		node = node.limitLeft;
    	}
    	return null;
    };

    this.getLimitLeftRendered = function(){
        var node = this.limitLeft;
        while(node){
            if(node.render)
                return node;
            node = node.limitLeft;
        }
        return null;
    };

    this.getIndexChild = function(){
        if(this.parent){
            var node = this.siblingLeft, n = 0;
            while(node){
                n++;
                node = node.siblingLeft;
            }
            return n;
        }
        return null;
    };
};
Node.source = { 
    sNode: {shape: 'arc', lineWidth: 1, width: 20, height: 20,  widthMin: 10, heightMin: 10,
        sText: {width: 14, height: 14, fontSize: 12}},
    sEdge: {lineWidth: 1, lineWidthMin: 1},
};



/*
 * Tree graph with HTML5 and JavaScript.
 * Date: 2015.
 * Dependencies: node.js
 *
 * Copyright (c) 2015 Yenny Fung Guan
 */

var Binary = function(data){
    this.base = Node;
    this.base(data);
    this.side;

    this.addChild = function(data){
        var node = this.addLeft(data);
        if(node)
            return node;
        return this.addRight(data);
    };

    this.addLeft = function(data){
        if(this.children.length === 0){
            var node = new Binary(data);
            node.side = "left";
            node.depth = this.depth + 1;
            node.parent = this;
            node.setTree(this.getTree());
            if(!this.render || !this.expand)      // si su padre no está visible o no expande sus hijos, su hijo no debe renderizarse
                node.render = false;
            this.children.push(node);

            var cousin = node.getCousinLeft();
            if(cousin){                            // si no tiene, buscamos al primo    
                node.limitLeft = cousin;               // *|primo| - *|nuevo (limite derecho)|
                cousin.limitRight = node;              // *|primo (límite izquierdo)| - *|nuevo|
            }
            var cousin = node.getCousinRight();    
            if(cousin){                            // si tiene primo derecho
                node.limitRight = cousin;              // *|nuevo (límite derecho)| - *|primo|
                cousin.limitLeft = node;               // *|primo (límite izquierdo)| - *|nuevo|
            }
            return node;
        
        }else if(this.children.length === 1 && this.children[0].side === "right"){
            var node = new Binary(data);
            node.side = "left";
            node.depth = this.depth + 1;
            node.parent = this;
            node.setTree(this.getTree());
            if(!this.render || !this.expand)      // si su padre no está visible o no expande sus hijos, su hijo no debe renderizarse
                node.render = false;
            this.children.splice(0, 0, node);

            var cousin = node.getCousinLeft();
            if(cousin){                            // si no tiene, buscamos al primo    
                node.limitLeft = cousin;               // *|primo| - *|nuevo (limite derecho)|
                cousin.limitRight = node;              // *|primo (límite izquierdo)| - *|nuevo|
            }
            var sibling = this.children[1];
            node.siblingRight = node.limitRight = sibling;          // *|hermano| - *|nuevo (hermano/límite derecho)|
            sibling.siblingLeft = sibling.limitLeft = node;         // *|hermano (hermano/límite izquierdo)| - *|nuevo|
            return node;
        }
        return null;
    };

    this.addRight = function(data){
        if(this.children.length === 0){
            var node = new Binary(data);
            node.side = "right";
            node.depth = this.depth + 1;
            node.parent = this;
            node.setTree(this.getTree());
            if(!this.render || !this.expand)      // si su padre no está visible o no expande sus hijos, su hijo no debe renderizarse
                node.render = false;
            this.children.push(node);

            var cousin = node.getCousinLeft();
            if(cousin){                            // si no tiene, buscamos al primo    
                node.limitLeft = cousin;               // *|primo| - *|nuevo (limite derecho)|
                cousin.limitRight = node;              // *|primo (límite izquierdo)| - *|nuevo|
            }
            var cousin = node.getCousinRight();    
            if(cousin){                            // si tiene primo derecho
                node.limitRight = cousin;              // *|nuevo (límite derecho)| - *|primo|
                cousin.limitLeft = node;               // *|primo (límite izquierdo)| - *|nuevo|
            }
            return node;

        }else if(this.children.length === 1 && this.children[0].side === "left"){
            var node = new Binary(data);
            node.side = "right";
            node.depth = this.depth + 1;
            node.parent = this;
            node.setTree(this.getTree());
            if(!this.render || !this.expand)      // si su padre no está visible o no expande sus hijos, su hijo no debe renderizarse
                node.render = false;
            this.children.push(node);

            var sibling = this.children[0];
            node.siblingLeft = node.limitLeft = sibling;           // *|hermano| - *|nuevo (hermano/límite derecho)|
            sibling.siblingRight = sibling.limitRight = node;      // *|hermano (hermano/límite izquierdo)| - *|nuevo|
            var cousin = node.getCousinRight();    
            if(cousin){                            // si tiene primo derecho
                node.limitRight = cousin;              // *|nuevo (límite derecho)| - *|primo|
                cousin.limitLeft = node;               // *|primo (límite izquierdo)| - *|nuevo|
            }
            return node;
        }
        return null;
    };

    this.export = function(){
        function exportDescendent(node){
            var nodeRaws = [];
            for(var i = 0; i < node.children.length; ++i){
                var child = node.children[i];
                nodeRaws.push({
                    expand: child.expand, 
                    side: child.side,
                    text: JSON.parse(JSON.stringify(child.text)), 
                    style: JSON.parse(JSON.stringify(child.style)),
                    bB: JSON.parse(JSON.stringify(child.bB)),
                    children: exportDescendent(child)
                });
            }
            return nodeRaws;
        }

        var nodeRaw = {
            instance: 'Binary',
            expand: this.expand, 
            side: this.side,
            text: JSON.parse(JSON.stringify(this.text)), 
            style: JSON.parse(JSON.stringify(this.style)), 
            bB: JSON.parse(JSON.stringify(this.bB)), 
            children: exportDescendent(this)
        };
        return nodeRaw;
    };

    this.import = function(nodeRaw){
        function importDescendent(node, nodeRaw){
            for(var i = 0; i < nodeRaw.children.length; ++i){
                var childRaw = nodeRaw.children[i];
                if(childRaw.side === "left")
                    var child = node.addLeft({ 
                        expand: childRaw.expand,
                        text: JSON.parse(JSON.stringify(childRaw.text)), 
                        style: JSON.parse(JSON.stringify(childRaw.style)),
                        bB: JSON.parse(JSON.stringify(childRaw.bB))
                    });
                else
                    var child = node.addRight({ 
                        expand: childRaw.expand,
                        text: JSON.parse(JSON.stringify(childRaw.text)), 
                        style: JSON.parse(JSON.stringify(childRaw.style)),
                        bB: JSON.parse(JSON.stringify(childRaw.bB))
                    });
                importDescendent(child, childRaw);
            }
        }

        if(nodeRaw.instance === 'Binary'){
            this.expand = nodeRaw.expand;
            this.text = JSON.parse(JSON.stringify(nodeRaw.text));
            this.style = JSON.parse(JSON.stringify(nodeRaw.style));
            this.bB =  JSON.parse(JSON.stringify(nodeRaw.bB));
            
            while(this.children.length > 0)
                this.children[0].remove();

            importDescendent(this, nodeRaw);
            return this;
        }
        return null;
    };

    this.importAddChild = function(index, nodeRaw){
        if(nodeRaw.instance === 'Binary'){
            if(index === 'left')
                return this.addLeft().import(nodeRaw);
            else
                return this.addRight().import(nodeRaw);
        }
        return null;
    };

    this.getLeftChild = function(){
        if(this.children.length > 0 && this.children[0].side === 'left')
            return this.children[0];
        return null;
    };

    this.getRightChild = function(){
        if(this.children.length > 0)
            if(this.children[0].side === 'right')
                return this.children[0];
            else
                return this.children[1];
        return null;
    };

    this.getIndexChild = function(){
        if(this.parent){
            if(this.side === 'left')
                return 'left';
            return 'right';
        }
        return null;
    };
};
// http://www.arkaitzgarro.com/javascript/capitulo-9.html
Binary.prototype = new Node();