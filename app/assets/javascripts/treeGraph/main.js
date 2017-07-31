 /*
 * Tree graph with HTML5 and JavaScript.
 * Date: 2015.
 * Dependencies: forest.js
 *
 * Copyright (c) 2015 Yenny Fung Guan
 */

(function() {
    var eDrawspace = document.getElementById('drawspace');
    resize();
    var forest = new Forest(eDrawspace);
    var eFrontCanvas = forest.getCanvas();
    var mouseDownPos, mouseMovePos, keyCode, buttonDown;
    var cursorStyle = ['nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize'];

    window.onresize = function(){
        resize();
        forest.resize();
    };

    function resize(){
        if(document.querySelector('body > header') != null){
            var barTitleHeight = document.querySelector('body > header').offsetHeight;
            var barToolHeight = document.getElementById('bar-tool').offsetHeight;
            var barStyleWidth = document.getElementById('bar-style').offsetWidth;
            var body = document.querySelector('body > section');
            
            body.style.height = window.innerHeight - barTitleHeight + 'px';
            eDrawspace.style.width = window.innerWidth - barStyleWidth + 'px';
            eDrawspace.style.height = window.innerHeight - barTitleHeight - barToolHeight + 'px';    
        }
    }

    function isBrowserDownloadable(){
        // http://jsfiddle.net/uselesscode/qm5ag/
        var userAgent = navigator.userAgent;       
        if( userAgent.indexOf('Chrome') > -1 || 
            userAgent.indexOf('Firefox') > -1 ||
            userAgent.indexOf('Opera') > -1){ 
            return true;
        }
        return false;
    }

    // http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    function getMousePos(obj){
        // http://www.codingforums.com/showthread.php?t=126325
        // http://www.kirupa.com/html5/getting_mouse_click_position.htm
        var mousePos = {x: 0, y: 0};
        while(obj) {  
            mousePos.x += obj.offsetLeft - obj.scrollLeft + obj.clientLeft;
            mousePos.y += obj.offsetTop - obj.scrollTop + obj.clientTop;
            obj = obj.offsetParent;
        }
        //http://stackoverflow.com/questions/7000190/detect-all-firefox-versions-in-js
        if(navigator.userAgent.indexOf('Firefox') > -1){
            mousePos.x -= window.pageXOffset;
            mousePos.y -= window.pageYOffset;
        }
        return mousePos;
    }

    function getMousePosCenter(obj){
        return {x: obj.offsetWidth / 2, y: obj.offsetHeight / 2};
    }
    
    /***** drawspace/canvas *****/
    // EventListener vs onclick --> https://translate.googleusercontent.com/translate_c?depth=1&hl=es&prev=search&rurl=translate.google.co.ve&sl=en&u=http://stackoverflow.com/questions/6348494/addeventlistener-vs-onclick&usg=ALkJrhgY_HUf499kBRKk3OXns_V4fnR75w
    var EventsWorkspace = {
        mouseDown: function(event) {
            mouseDownPos = getMousePos(eFrontCanvas);  
            mouseDownPos = {x: event.clientX - mouseDownPos.x, y: event.clientY - mouseDownPos.y};
            var pointCtrlTree;

            if(keyCode == 49){          // 1
                forest.Add.root(mouseDownPos);
                document.getElementsByTagName("body")[0].style.cursor = 'pointer';
            }else if(keyCode == 50){    //2
                forest.Add.rootBinary(mouseDownPos);
                document.getElementsByTagName("body")[0].style.cursor = 'pointer';
            }else if(pointCtrlTree = forest.Selection.getBBTreePointCtrl(mouseDownPos)){
                resizeTree(pointCtrlTree);
            }else if(navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey) {
                forest.Selection.nodeToogle(mouseDownPos);
            }else if(forest.Selection.nodeSimple(mouseDownPos)){
                translate(mouseDownPos);
            }
        },

        mouseMove: function(event){
            mouseMovePos = getMousePos(eFrontCanvas);  
            mouseMovePos = {x: event.clientX - mouseMovePos.x, y: event.clientY - mouseMovePos.y};
            var pointCtrlTree;

            if(pointCtrlTree = forest.Selection.getBBTreePointCtrl(mouseMovePos))
                document.getElementsByTagName("body")[0].style.cursor = cursorStyle[pointCtrlTree.id];
            else if(forest.getNodeByPos(mouseMovePos))
                document.getElementsByTagName("body")[0].style.cursor = 'pointer';
            else if(document.getElementsByTagName("body")[0].style.cursor !== 'default')
                document.getElementsByTagName("body")[0].style.cursor = 'default';   
        },

        dblClick: function(event){
            if(keyCode === undefined && forest.getNodeByPos(mouseDownPos)){
                tab.setCurrent('.tabs#mode', 1);
                tab.setCurrent('.tabs#mode-edit', 2);
                document.getElementById("nameNode").focus();
                document.getElementById("nameNode").select();
            }
        }
    };
    var eventsWorkspace = ['mousedown', 'mousemove', 'dblclick'],
        handlersWorkspace = [EventsWorkspace.mouseDown, EventsWorkspace.mouseMove, EventsWorkspace.dblClick];
    for(var i = 0; i < eventsWorkspace.length; ++i)
        eFrontCanvas.addEventListener(eventsWorkspace[i], handlersWorkspace[i]);

    /***** windows *****/
    var EventsWindow = {
        keyDown: function(event){
            //event.stopPropagation();
            keyCode = event.keyCode;
            //console.log('keyCode is ' + keyCode);

            if(navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey){
                event.preventDefault();     // make cursor dissapear
                if((event.shiftKey && keyCode == 90) || keyCode == 89){     // cmd + shift + z / control + y
                    forest.Record.redo();
                    buttonDown = eRedo;
                }else if(keyCode == 90){        // cmd/cntrl + z
                    forest.Record.undo();
                    buttonDown = eUndo;
                }else if(keyCode == 86){        // cmd/cntrl + v
                    forest.paste(mouseMovePos);
                    buttonDown = ePaste;
                }else if(keyCode == 67){        // cmd/cntrl + c
                    if(forest.copy())
                        ePaste.disabled = false;
                    buttonDown = eCopy;
                }else if(keyCode == 88){        // cmd/cntrl + x
                    if(forest.cut())
                        ePaste.disabled = false;
                    buttonDown = eCut;
                }else if(event.shiftKey && keyCode == 65){        // cmd/cntrl + shift + a
                    forest.Selection.path();
                    buttonDown = eSelection;
                }else if(keyCode == 65){        //cmd/cntrl + a
                    forest.Selection.all();
                    buttonDown = eSelection;
                }else if(keyCode == 83){        // cmd/cntrl + s
                    saveDocument();
                    buttonDown = eSave;
                }else if(keyCode == 70){        // cmd/cntrl + f
                    classie.toggle(document.getElementById('open'), 'active');
                    classie.toggle(document.querySelector('#documents.animate_menu'), 'open');
                }else if(keyCode == 68){        // cmd/cntrl + d
                    newDocument();
                    buttonDown = eNewFile;
                }
            }else{
                if(keyCode == 88){                  // x
                    forest.Add.child();
                    buttonDown = eAdd;
                }else if(keyCode == 83 || keyCode == 8){  // s o delete
                    forest.remove();
                    buttonDown = eRemove;
                }else if(keyCode == 90){            // z
                    forest.Add.left();
                    buttonDown = eAdd;
                }else if(keyCode == 67){            // c
                    forest.Add.right();
                    buttonDown = eAdd;
                }else if(keyCode == 78){            // n
                    forest.expand();
                    buttonDown = eContract;
                }else if(keyCode == 77){            // m
                    forest.ResizeTree.toogle();
                    classie.toggle(document.getElementById('scale'), 'active');
                /*}else if(keyCode == 81){          // q
                    capture();*/
                }else if(keyCode == 27){            // esc
                    forest.Selection.none();       
                }
            }

            if(buttonDown !== undefined && !buttonDown.disabled)
                classie.addClass(buttonDown, 'active');

            return false;
        },

        keyUp: function(event){
            if(buttonDown !== undefined){
                classie.removeClass(buttonDown, 'active');
                buttonDown = undefined;
            }
            keyCode = undefined;
        },
        
        keyDownBase: function(event){
            keyCode = event.keyCode;
        },
        
        keyUpBase: function(event){
            keyCode = undefined;
        },
    };
    var eventsWindow = ['keydown', 'keyup'],
        handlersWindow = [EventsWindow.keyDown, EventsWindow.keyUp];
    for(var i = 0; i < eventsWindow.length; ++i)
        window.addEventListener(eventsWindow[i], handlersWindow[i]);

    /***** bar tool *****/
    /* selection */
    document.getElementById("path").onclick = function(){
        forest.Selection.path();
    };
    document.getElementById("all").onclick = function(){
        forest.Selection.all();
    };

    /* new */
    document.getElementById("nario").onclick = function(){
        forest.Add.root(getMousePosCenter(eDrawspace)); 
    };
    document.getElementById("binary").onclick = function(){
        forest.Add.rootBinary(getMousePosCenter(eDrawspace)); 
    };

    /* add child - delete */
    document.getElementById("child").onclick = function(){
        forest.Add.child();
    };
    document.getElementById("left").onclick = function(){
        forest.Add.left();
    };
    document.getElementById("right").onclick = function(){
        forest.Add.right();
    };
    eRemove.onclick = function(){
        forest.remove();
    };

    /* cut - copy- paste */
    eCut.onclick = function(){
        if(forest.cut())
            ePaste.disabled = false;
    };
    eCopy.onclick = function(){
        if(forest.copy())
            ePaste.disabled = false;
    };
    ePaste.onclick = function(){
        forest.paste(getMousePosCenter(eDrawspace));
    };

    /* resize */
    eScale.onclick = function(){
        forest.ResizeTree.toogle();
        classie.toggle(document.getElementById('scale'), 'active');
    };
    var resizeTree = function(pointCtrlTree){
        eFrontCanvas.removeEventListener('mousemove', EventsWorkspace.mouseMove);
        window.removeEventListener('keydown', EventsWindow.keyDown);
        window.removeEventListener('keyup', EventsWindow.keyUp);
        window.addEventListener('keydown', EventsWindow.keyDownBase);
        window.addEventListener('keyup', EventsWindow.keyUpBase);

        var mousemove = function(event){
            var mouseMovePos = getMousePos(eFrontCanvas);  
            mouseMovePos = {x: event.clientX - mouseMovePos.x, y: event.clientY - mouseMovePos.y};

            forest.ResizeTree.tree(pointCtrlTree, mouseMovePos, (keyCode === 18)? true: false);

            // move text to show size
            var i = 0, subTrees = forest.getSubTrees();
            for(var key in subTrees){
                var tree = subTrees[key].getTree();
                els[i].innerHTML = "ancho: " + Math.round(tree.bBTree.width) + "px<br>" +
                                   "alto: &nbsp;" + Math.round(tree.bBTree.height) + "px";
                els[i++].setAttribute('style', 'top:' + Math.round(tree.bBTree.yMax) + 'px; '+
                                               'left:' + Math.round(tree.bBTree.xMax) + 'px;');
            }
        };
        eFrontCanvas.addEventListener('mousemove', mousemove);

        eFrontCanvas.addEventListener('mouseup', function _mouseup(event){
            eFrontCanvas.removeEventListener('mouseup', _mouseup);
            eFrontCanvas.removeEventListener('mousemove', mousemove);
            window.removeEventListener('keyup', EventsWindow.keyUpBase);
            window.removeEventListener('keydown', EventsWindow.keyDownBase);
            window.addEventListener('keyup', EventsWindow.keyUp);
            window.addEventListener('keydown', EventsWindow.keyDown);
            eFrontCanvas.addEventListener('mousemove', EventsWorkspace.mouseMove);
            document.getElementsByTagName("body")[0].style.cursor = 'default';

            // remove text to show size
            for(var i = 0; i < els.length; ++i)
                eDrawspace.removeChild(els[i]);
        });

        // create text to show size
        var subTrees = forest.getSubTrees(), els = [];
        for(var key in subTrees){
            var tree = subTrees[key].getTree();
            var el = document.createElement("p");
            eDrawspace.appendChild(el);
            el.innerHTML = "ancho: " + Math.round(tree.bBTree.width) + "px<br>" +
                           "alto: &nbsp;" + Math.round(tree.bBTree.height) + "px";
            el.setAttribute('class', 'note');
            el.setAttribute('style', 'top:' + Math.round(tree.bBTree.yMax) + 'px; '+
                                     'left:' + Math.round(tree.bBTree.xMax) + 'px;');
            els.push(el);
        }
    };

    /* expand */
    eContract.onclick = function(){ forest.expand(); };

    /* translate */
    var translate = function(mouseDownPos){
        var mouseMovePosLast = mouseDownPos;
        
        eFrontCanvas.removeEventListener('mousemove', EventsWorkspace.mouseMove);
        window.removeEventListener('keydown', EventsWindow.keyDown);
        window.removeEventListener('keyup', EventsWindow.keyUp);

        var mousemove = function(event){
            var mouseMovePos = getMousePos(eFrontCanvas);  
            mouseMovePos = {x: event.clientX - mouseMovePos.x, y: event.clientY - mouseMovePos.y};

            forest.translate({x: mouseMovePos.x - mouseMovePosLast.x, y: mouseMovePos.y - mouseMovePosLast.y});
            mouseMovePosLast = mouseMovePos;
        }
        eFrontCanvas.addEventListener('mousemove', mousemove);

        eFrontCanvas.addEventListener('mouseup', function _mouseup(event){
            var mouseUpPos = getMousePos(eFrontCanvas);  
            mouseUpPos = {x: event.clientX - mouseUpPos.x, y: event.clientY - mouseUpPos.y};

            document.getElementsByTagName("body")[0].style.cursor = 'pointer';    
            eFrontCanvas.removeEventListener('mouseup', _mouseup);
            eFrontCanvas.removeEventListener('mousemove', mousemove);
            window.addEventListener('keydown', EventsWindow.keyDown);
            window.addEventListener('keyup', EventsWindow.keyUp);
            eFrontCanvas.addEventListener('mousemove', EventsWorkspace.mouseMove);
        }); 

        document.getElementsByTagName("body")[0].style.cursor = 'move';  
    };

    /* capture */
    var capture = function(){
        function cancel(){
            classie.removeClass(eCapture, 'active');
            classie.removeClass(ePopup, 'open');
            forest.Photo.cancel();
            for(var i = 0; i < eventsWorkspace2.length; ++i)
                eFrontCanvas.removeEventListener(eventsWorkspace2[i], handlersWorkspace2[i]);
            window.removeEventListener('keydown', EventsWindow.keyDownBase);
            window.removeEventListener('keyup', EventsWindow.keyUpBase);
            for(var i = 0; i < eventsWorkspace.length; ++i)
                eFrontCanvas.addEventListener(eventsWorkspace[i], handlersWorkspace[i]);
            for(var i = 0; i < eventsWindow.length; ++i)
                window.addEventListener(eventsWindow[i], handlersWindow[i]);
        };
        
        var EventsWorkspace2 = {
            mouseDown: function(event){
                var mouseDownPos = getMousePos(eFrontCanvas);  
                mouseDownPos = {x: event.clientX - mouseDownPos.x, y: event.clientY - mouseDownPos.y};
                var pointCtrlPhoto;

                eFrontCanvas.removeEventListener('mousemove', EventsWorkspace2.mouseMove);

                if(pointCtrlPhoto = forest.Photo.getBBPhotoPointCntrl(mouseDownPos)){
                    var mousemove = function(event){
                        var mouseMovePos = getMousePos(eFrontCanvas);  
                        mouseMovePos = {x: event.clientX - mouseMovePos.x, y: event.clientY - mouseMovePos.y};

                        forest.Photo.crop(pointCtrlPhoto, mouseMovePos, (keyCode === 18)? true: false);
                    };
                    eFrontCanvas.addEventListener('mousemove', mousemove);

                    eFrontCanvas.addEventListener('mouseup', function _mouseup(){
                        eFrontCanvas.removeEventListener('mouseup', _mouseup);
                        eFrontCanvas.removeEventListener('mousemove', mousemove);
                        eFrontCanvas.addEventListener('mousemove', EventsWorkspace2.mouseMove);
                    })

                }else if(forest.Photo.isPosInsideBBPhoto(mouseDownPos)){
                    var mouseMovePosLast = mouseDownPos;

                    var mousemove  = function(event){
                        var mouseMovePos = getMousePos(eFrontCanvas);  
                        mouseMovePos = {x: event.clientX - mouseMovePos.x, y: event.clientY - mouseMovePos.y};

                        forest.Photo.translate({x: mouseMovePos.x - mouseMovePosLast.x, y: mouseMovePos.y - mouseMovePosLast.y});
                        mouseMovePosLast = mouseMovePos;
                    };
                    eFrontCanvas.addEventListener('mousemove', mousemove);

                    eFrontCanvas.addEventListener('mouseup', function _mouseup(){
                        eFrontCanvas.removeEventListener('mouseup', _mouseup);
                        eFrontCanvas.removeEventListener('mousemove', mousemove);
                        eFrontCanvas.addEventListener('mousemove', EventsWorkspace2.mouseMove);
                    })
                }else{
                    cancel();
                }
            },
            
            mouseMove: function(event){
                var mouseMovePos = getMousePos(eFrontCanvas);  
                mouseMovePos = {x: event.clientX - mouseMovePos.x, y: event.clientY - mouseMovePos.y};
                var pointCtrlPhoto;

                if(pointCtrlPhoto = forest.Photo.getBBPhotoPointCntrl(mouseMovePos))
                    document.getElementsByTagName("body")[0].style.cursor = cursorStyle[pointCtrlPhoto];
                else if(forest.Photo.isPosInsideBBPhoto(mouseMovePos))
                    document.getElementsByTagName("body")[0].style.cursor = 'move';
                else if(document.getElementsByTagName("body")[0].style.cursor !== 'default')
                    document.getElementsByTagName("body")[0].style.cursor = 'default';
            },
            
            mouseUp: function(){
                forest.Photo.drawInit();
            }
        };

        for(var i = 0; i < eventsWorkspace.length; ++i)
            eFrontCanvas.removeEventListener(eventsWorkspace[i], handlersWorkspace[i]);
        for(var i = 0; i < eventsWindow.length; ++i)
            window.removeEventListener(eventsWindow[i], handlersWindow[i]);

        var eventsWorkspace2 = ['mousedown', 'mousemove', 'mouseup'],
            handlersWorkspace2 = [EventsWorkspace2.mouseDown, EventsWorkspace2.mouseMove, EventsWorkspace2.mouseUp];
        for(var i = 0; i < eventsWorkspace2.length; ++i)
            eFrontCanvas.addEventListener(eventsWorkspace2[i], handlersWorkspace2[i]);
        window.addEventListener('keydown', EventsWindow.keyDownBase);
        window.addEventListener('keyup', EventsWindow.keyUpBase);

        classie.addClass(eCapture, 'active');
        forest.Photo.load();

        var ePopup = document.querySelector('#captureDrawspace');
        classie.addClass(ePopup, 'open');
        document.getElementById('captureDrawspaceDownload').onclick = function(){
            if(isBrowserDownloadable()){ 
                this.href = forest.Photo.capture();
            }else{
                var w = window.open('about:blank', 'image from canvas');
                w.document.write("<img src='" + forest.Photo.capture() + "' alt='from canvas'/>");
            }
            cancel();
        };
    }
    eCapture.onclick = function(){
        capture();
    };

    /* export */
    document.getElementById("pngDownload").onclick = function(){
        if(isBrowserDownloadable()){ 
            this.href = forest.Export.png();
        }else{
            var w = window.open('about:blank', 'image from canvas');
            w.document.write("<img src='" + forest.Export.png() + "' alt='from canvas'/>");
        }
    };
    // http://stackoverflow.com/questions/19327749/javascript-blob-filename-without-link
    document.getElementById("latexDownload").onclick = function(){
        if(isBrowserDownloadable()){ 
            //var data = new Blob([forest.Export.pstTree()], {type: 'text/plain;charset=utf-8;'});
            var data = forest.Export.pstTree();
            var blob = new Blob([data], {type: "octet/stream"});
            var url = window.URL.createObjectURL(blob);
            this.href = url;
            window.URL.revokeObjectURL(url);
        }else{
            var w = window.open('about:blank', 'image from canvas');
            w.document.write('<textarea rows="25" cols="50" readonly>' + forest.Export.pstTree() + '</textarea>');
        }
    };

    /* record */
    eUndo.onclick = function(){
        forest.Record.undo();
    };
    eRedo.onclick = function(){
        forest.Record.redo();
    };


    /***** bar style *****/
    /* nameNode */
    //http://schier.co/blog/2014/12/08/wait-for-user-to-stop-typing-using-javascript.html
    eNameNode.onfocus = function(){
        window.removeEventListener('keydown', EventsWindow.keyDown, false);
        window.removeEventListener('keyup', EventsWindow.keyUp, false);
    };
    eNameNode.oninput = function(){ 
        forest.Text.nameNode(this.value); 
    };
    eNameNode.onblur = function(){
        window.addEventListener('keydown', EventsWindow.keyDown, false);
        window.addEventListener('keyup', EventsWindow.keyUp, false);
    };

    /* nameEdge */
    eNameEdge.onfocus = function(){
        window.removeEventListener('keydown', EventsWindow.keyDown, false);
        window.removeEventListener('keyup', EventsWindow.keyUp, false);
    };
    eNameEdge.oninput = function(){ 
        forest.Text.nameEdge(this.value); 
    };
    eNameEdge.onblur = function(){
        window.addEventListener('keydown', EventsWindow.keyDown, false);
        window.addEventListener('keyup', EventsWindow.keyUp, false);
    };

    /* opcional */
    eOpcional.onfocus = function(){
        window.removeEventListener('keydown', EventsWindow.keyDown, false);
        window.removeEventListener('keyup', EventsWindow.keyUp, false);
    };
    eOpcional.oninput = function(){ 
        forest.Text.opcional(this.value); 
    };
    eOpcional.onblur = function(){
        window.addEventListener('keydown', EventsWindow.keyDown, false);
        window.addEventListener('keyup', EventsWindow.keyUp, false);
    };

    /* shape */
    for(var i = 0; i < eShapes.length; ++i)
        eShapes[i].onclick = function(){
            forest.Style.shape(this.getAttribute('data-shape'));
        };

    /* strokeStyleEdge */
    for(var i = 0; i < eStrokeStyleEdges.length; ++i)
        eStrokeStyleEdges[i].onclick = function(){
            var style = window.getComputedStyle(this.getElementsByClassName('color')[0]);
            var backgroundColor = style.getPropertyValue('background-color'); 
            forest.Style.Color.strokeStyleEdge(backgroundColor);
        };

    /* strokeStyleNode */
    for(var i = 0; i < eStrokeStyleNodes.length; ++i)
        eStrokeStyleNodes[i].onclick = function(){
            var style = window.getComputedStyle(this.getElementsByClassName('color')[0]);
            var backgroundColor = style.getPropertyValue('background-color'); 
            forest.Style.Color.strokeStyleNode(backgroundColor);
        };

    /* fillStyleNode */
    for(var i = 0; i < eFillStyleNodes.length; ++i)
        eFillStyleNodes[i].onclick = function(){
            var style = window.getComputedStyle(this.getElementsByClassName('color')[0]); 
            var backgroundColor = style.getPropertyValue('background-color'); 
            forest.Style.Color.fillStyleNode(backgroundColor);
        };

    /* lineDashEdge */
    eLineDashEdge.onchange = function(){
        forest.Style.LineDash.lineDashEdge(this.value);
    };

    /* lineDashNode */
    eLineDashNode.onchange = function(){
        forest.Style.LineDash.lineDashNode(this.value);
    };

    /* lineWidthNode */
    eRangeLineWidthNode.onmousedown = function(){
        window.removeEventListener('keydown', EventsWindow.keyDown, false);
        window.removeEventListener('keyup', EventsWindow.keyUp, false);
    };
    eRangeLineWidthNode.oninput = function(){
        forest.ResizeNode.lineWidthNode(parseInt(this.value));
        eLineWidthNode.value = this.value;
    };
    eRangeLineWidthNode.onchange = function(){
        window.addEventListener('keydown', EventsWindow.keyDown, false);
        window.addEventListener('keyup', EventsWindow.keyUp, false);
    };
    
    /* lineWidthEdge */
    eRangeLineWidthEdge.onmousedown = function(){
        window.removeEventListener('keydown', EventsWindow.keyDown, false);
        window.removeEventListener('keyup', EventsWindow.keyUp, false);
    };
    eRangeLineWidthEdge.oninput = function(){
        forest.ResizeNode.lineWidthEdge(parseInt(this.value));
        eLineWidthEdge.value = this.value; 
    };           
    eRangeLineWidthEdge.onchange = function(){
        window.addEventListener('keydown', EventsWindow.keyDown, false);
        window.addEventListener('keyup', EventsWindow.keyUp, false);
    };

    /* width */
    eRangeWidth.onmousedown = function(){
        window.removeEventListener('keydown', EventsWindow.keyDown, false);
        window.removeEventListener('keyup', EventsWindow.keyUp, false);
    };
    eRangeWidth.oninput = function(){
        forest.ResizeNode.width(parseInt(this.value));
        eWidth.value = this.value; 
    };     
    eRangeWidth.onchange = function(){
        window.addEventListener('keydown', EventsWindow.keyDown, false);
        window.addEventListener('keyup', EventsWindow.keyUp, false);
    };

    eWidth.onfocus = function(){
        window.removeEventListener('keydown', EventsWindow.keyDown, false);
        window.removeEventListener('keyup', EventsWindow.keyUp, false);
    };
    eWidth.oninput = function (){
        if(this.value < 10) 
            this.value = 10;
        forest.ResizeNode.width(parseInt(this.value));
        eRangeWidth.value = this.value;
    };
    eWidth.onblur = function(){
        window.addEventListener('keydown', EventsWindow.keyDown, false);
        window.addEventListener('keyup', EventsWindow.keyUp, false);
    };

    /* height */
    eRangeHeight.onmousedown = function(){
        window.removeEventListener('keydown', EventsWindow.keyDown, false);
        window.removeEventListener('keyup', EventsWindow.keyUp, false);
    };
    eRangeHeight.oninput = function(){
        forest.ResizeNode.height(parseInt(this.value));
        eHeight.value = this.value; 
    };    

    eRangeHeight.onchange = function(){
        window.addEventListener('keydown', EventsWindow.keyDown, false);
        window.addEventListener('keyup', EventsWindow.keyUp, false);
    };
    
    eHeight.onfocus = function(){
        window.removeEventListener('keydown', EventsWindow.keyDown, false);
        window.removeEventListener('keyup', EventsWindow.keyUp, false);
    };
    eHeight.oinput = function (){
        if(this.value < 10) 
            this.value = 10;
        forest.ResizeNode.height(parseInt(this.value));
        eRangeHeight.value = this.value;
    };
    eHeight.onblur = function(){
        window.addEventListener('keydown', EventsWindow.keyDown, false);
        window.addEventListener('keyup', EventsWindow.keyUp, false);
    };  

    /* marginTop */
    eRangeMarginTop.onmousedown = function(){
        window.removeEventListener('keydown', EventsWindow.keyDown, false);
        window.removeEventListener('keyup', EventsWindow.keyUp, false);
    };
    eRangeMarginTop.oninput = function(){
        forest.ResizeMargin.top(parseInt(this.value));
        eMarginTop.value = this.value;
    };   
    eRangeMarginTop.onchange = function(){
        window.addEventListener('keydown', EventsWindow.keyDown, false);
        window.addEventListener('keyup', EventsWindow.keyUp, false);
    };

    eMarginTop.onfocus = function(){
        window.removeEventListener('keydown', EventsWindow.keyDown, false);
        window.removeEventListener('keyup', EventsWindow.keyUp, false);
    };
    eMarginTop.oninput = function(){
        if(this.value < 1) 
            this.value = 0;
        forest.ResizeMargin.top(parseInt(this.value));
        eRangeMarginTop.value = this.value;
    };
    eMarginTop.onblur = function(){
        window.addEventListener('keydown', EventsWindow.keyDown, false);
        window.addEventListener('keyup', EventsWindow.keyUp, false);
    };

    /* marginLeft */
    eRangeMarginLeft.onmousedown = function(){
        window.removeEventListener('keydown', EventsWindow.keyDown, false);
        window.removeEventListener('keyup', EventsWindow.keyUp, false);
    };
    eRangeMarginLeft.oninput = function(){
        forest.ResizeMargin.left(parseInt(this.value));
        eMarginLeft.value = this.value; 
    };
    eRangeMarginLeft.onchange = function(){
        window.addEventListener('keydown', EventsWindow.keyDown, false);
        window.addEventListener('keyup', EventsWindow.keyUp, false);
    };

    eMarginLeft.onfocus = function(){
        window.removeEventListener('keydown', EventsWindow.keyDown, false);
        window.removeEventListener('keyup', EventsWindow.keyUp, false);
    };
    eMarginLeft.oninput = function(){
        if(this.value < 1) 
            this.value = 0;
        forest.ResizeMargin.left(parseInt(this.value));
        eRangeMarginTop.value = this.value;
    };
    eMarginLeft.onblur = function(){
        window.addEventListener('keydown', EventsWindow.keyDown, false);
        window.addEventListener('keyup', EventsWindow.keyUp, false);
    };


    /***** directory *****/
    if(eSectionFile){
        var dialogFxs = {};
        dialogFxs['saveChange'] = new DialogFx(document.getElementById('saveChange'));
        dialogFxs['saveAs'] = new DialogFx(document.getElementById('saveAs'));
        current_document = getParameterByName('id');

        function ajaxSave(callback){
            // http://stackoverflow.com/questions/17559563/sending-ajax-post-jquery-in-rails-application
            // https://www.youtube.com/watch?v=K-sns5tNdTY
            $.ajax({
                url: "/documents/updateContent",
                type: "POST",
                data : {
                    id: current_document, 
                    content: JSON.stringify(forest.saveDocument())
                },
                success: function(data){
                    var el = $('#bar-title .progress');
                    el.addClass('success');
                    setTimeout( function() { el.removeClass('success'); }, 1500 );
                    refreshTable();
                    callback();
                },
                error: function(){
                    //report
                },
            });
        }

        function ajaxSaveAs(callback){
            $.ajax({
                url: "/documents/create",
                type: "POST",
                data : {
                    name: (dialogFxs['saveAs'].el).querySelector("#document_name").value, 
                    content: JSON.stringify(forest.saveDocument())
                },
                success: function(data){
                    dialogFxs['saveAs'].toggle();

                    var el = $('#bar-title .progress');
                    el.addClass('success');
                    setTimeout( function() { el.removeClass('success'); }, 1500 );
                    refreshTable();
                    callback(data);
                },
                error: function(){
                    //report
                },
            });
        }

        function newDocument(){
            function ajaxNew(){
                forest.newDocument();
                activeRow(null);
                current_document = null;
            }

            if(forest.isClosable()){
                dialogFxs['saveChange'].toggle();
                
                document.querySelector('#saveChange .accept').onclick = function(){
                    dialogFxs['saveChange'].toggle();
                    if(current_document){
                        ajaxSave(function(){ ajaxNew(); });
                    }else{
                        dialogFxs['saveAs'].toggle();
                        document.querySelector('#saveAs form').onsubmit = function(){
                            if(validity.form(this))
                                ajaxSaveAs(function(){ ajaxNew(); });
                        };
                    }
                };

                document.querySelector('#saveChange .cancel').onclick = function(){
                    dialogFxs['saveChange'].toggle();
                    ajaxNew();
                };
            }else{
                ajaxNew();
            }
        }

        function openDocument(document_id){
            function ajaxOpen(id){
                $.ajax({
                    url: "/documents/open",
                    type: "POST",
                    data : {id: id},
                    dataType: "JSON",
                    success: function(data){
                        forest.import(JSON.parse(data.content));
                        activeRow(data);
                        current_document = data.id;
                    },
                    error: function(){
                        //report
                    },
                });
            }

            if(forest.isClosable()){
                dialogFxs['saveChange'].toggle();
                
                document.querySelector('#saveChange .accept').onclick = function(){
                    dialogFxs['saveChange'].toggle();
                    if(current_document){
                        ajaxSave(function(){ ajaxOpen(document_id); });
                    }else{
                        dialogFxs['saveAs'].toggle();
                        document.querySelector('#saveAs form').onsubmit = function(){
                            if(validity.form(this))
                                ajaxSaveAs(function(){ ajaxOpen(document_id); });
                        };
                    }
                };

                document.querySelector('#saveChange .cancel').onclick = function(){
                    dialogFxs['saveChange'].toggle();
                    ajaxOpen(document_id);
                };
            }else{
                ajaxOpen(document_id);
            }
        }

        function saveDocument(){
            if(current_document){
                ajaxSave(function(){});
            }else{
                dialogFxs['saveAs'].toggle();
                forest.Selection.none();
                document.querySelector('#saveAs form').onsubmit = function(){
                    if(validity.form(this))
                        ajaxSaveAs(
                            function(data){
                                //activeRow(data);
                                current_document = data.id;
                            }
                        );
                };
            }
        }
  
        if(current_document !== null)
            openDocument(current_document);

        /* open */
        $(document).on('click', ".table#documents .body li label", function() { 
            var el = $(this).parents('li');
            if(!el.hasClass('update'))
                openDocument(el.attr('data-id'));
        });

        /* new */
        eNewFile.onclick = function(){ newDocument(); };

        /* savet */
        eSave.onclick = function(){ saveDocument(); };        

        /*** logout ***/
        document.getElementById('logout').onclick = function(){
            if(forest.isClosable()){
                dialogFxs['saveChange'].toggle();

                document.querySelector('#saveChange .accept').onclick = function(){
                    dialogFxs['saveChange'].toggle();
                    if(current_document){
                        ajaxSave(function(){
                            document.location.href = "/logout";
                        });
                    }else{
                        dialogFxs['saveAs'].toggle();
                        document.querySelector('#saveAs form').onsubmit = function(){
                            if(validity.form(this))
                                ajaxSaveAs(function(){
                                    document.location.href = "/logout";
                                });
                        };
                    }
                };

                document.querySelector('#saveChange .cancel').onclick = function(){
                    document.location.href = "/logout";
                };
            }else{
                document.location.href = "/logout";
            }
        };
    

        /*** back ***/
        document.getElementById('back').onclick = function(){
            if(forest.isClosable()){
                dialogFxs['saveChange'].toggle();
                
                document.querySelector('#saveChange .accept').onclick = function(){
                    dialogFxs['saveChange'].toggle();
                    if(current_document){
                        ajaxSave(function(){
                            document.location.href = "../documents";
                        });
                    }else{
                        dialogFxs['saveAs'].toggle();
                        document.querySelector('#saveAs form').onsubmit = function(){
                            if(validity.form(this))
                                ajaxSaveAs(function(){
                                    document.location.href = "../documents";
                                });
                        };
                    }
                };

                document.querySelector('#saveChange .cancel').onclick = function(){
                    document.location.href = "../documents";
                };
            }else{
                document.location.href = "../documents";
            }
        };
    }    
   
})(); 

/* 
* order by
*/
function refreshTable(){
    var orderBy = (document.querySelector(".table ul.header span.orderBy")).getAttribute('data-col');
    if(orderBy === 'name')
        var url = "/documents/getDocumentsOrderByName";
    else
        var url = "/documents/document";

    var selectedBackups = $(".table ul.body li.selected").map(
        function(){
            return $(this).attr("data-id");
        }).get();
    
    $.ajax({url: url, type: "POST", dataType: "script",
        success: function(){
            for(var i = 0; i < selectedBackups.length; ++i){
                var li = document.querySelector(".table ul.body li[data-id='" + selectedBackups[i] + "']");
                if(li){
                    li.className = "selected";
                    li.querySelector("input[name='check-one']").checked = true;
                }
            }

            if(current_document !== null){
                var li = document.querySelector(".table ul.body li[data-id='" + current_document + "']");
                li.className = "active";
                li.querySelector("input[name='check-one']").disabled = true;

                document.querySelector('#bar-title .title').innerHTML = li.querySelector("a").innerText;
                window.history.replaceState(null, null, window.location.pathname + "?id=" + current_document);
            }

            updateCheckbox();
        },
        error: function(){
            //report
        }
    });
}