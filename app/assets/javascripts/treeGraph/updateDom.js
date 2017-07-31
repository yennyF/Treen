/*
 * Tree graph with HTML5 and JavaScript.
 * Date: 2015.
 * Dependencies: none
 *
 * Copyright (c) 2015 Yenny Fung Guan
 */

var eSectionFile = document.getElementById('section-file');
if(eSectionFile){
    var eOpen = document.getElementById('open');
    var eNewFile = document.getElementById('newFile');
    var eSave = document.getElementById('save');
}
var eCapture = document.getElementById('capture');
var eExport= document.getElementById('export');
var eUndo = document.getElementById('undo'); 
var eRedo = document.getElementById('redo');
var eSelection= document.getElementById('selection'); 
var ePath= document.getElementById('path'); 
var eNew = document.getElementById('new');
var eAdd = document.getElementById('add');
var eRemove = document.getElementById('delete');
var eCut = document.getElementById('cut');
var eCopy = document.getElementById('copy');
var ePaste = document.getElementById('paste');
var eContract = document.getElementById('contract');
var eScale = document.getElementById('scale');

var eTypeTree = document.getElementById("typeTree");
var eGrade = document.getElementById("grade");
var eLevel = document.getElementById("level");
var eGradeNode = document.getElementById("gradeNode");
var eLevelNode = document.getElementById("levelNode");
var eOpcionalView = document.getElementById("opcional-view");

var eShapes = document.querySelectorAll('#shapeNode button');

var eLineDashNode = document.getElementById("lineDashNode");
var eLineDashEdge = document.getElementById("lineDashEdge");

var eFillStyleNodes = document.querySelectorAll('#fillStyleNode button');
var eStrokeStyleNodes = document.querySelectorAll('#strokeStyleNode button');
var eStrokeStyleEdges = document.querySelectorAll('#strokeStyleEdge button');

var eWidth = document.getElementById("widthNode");
var ePostfixWidth = document.getElementById('postfix-widthNode');
var eRangeWidth = document.getElementById("rangeWidthNode");
var eHeight = document.getElementById("heightNode");
var ePostfixHeight = document.getElementById('postfix-heightNode');
var eRangeHeight = document.getElementById("rangeHeightNode");

var eLineWidthNode = document.getElementById("lineWidthNode");
var ePostfixLineWidthNode = document.getElementById('postfix-lineWidthNode');
var eRangeLineWidthNode = document.getElementById("rangeLineWidthNode");
var eLineWidthEdge = document.getElementById("lineWidthEdge");
var ePostfixLineWidthEdge = document.getElementById('postfix-lineWidthEdge');
var eRangeLineWidthEdge = document.getElementById("rangeLineWidthEdge");

var eMarginTop = document.getElementById("marginTop");
var ePostfixMarginTop = document.getElementById('postfix-marginTop');
var eMarginLeft = document.getElementById("marginLeft");
var ePostfixMarginLeft = document.getElementById('postfix-marginLeft');
var eRangeMarginTop = document.getElementById("rangeMarginTop");
var eRangeMarginLeft = document.getElementById("rangeMarginLeft");
        
var eNameNode = document.getElementById("nameNode");
var eNameEdge = document.getElementById("nameEdge");
var eOpcional = document.getElementById("opcional");

var UpdateDom = function(forest){
    var properties;

    this.completeWithoutFocusForm = function(){
        form = document.querySelector("#bar-style");
        var els = form.querySelectorAll('input, textarea, select');
        for(var i = 0; i < els.length; ++i)
            if(els[i] === document.activeElement){
                els[i].blur();
                break;
            }
        this.complete();
    }

    this.complete = function(){
        properties = forest.SubForest.getProperties();

        Update.barTool();
        Update.info();
        Update.text();
        Update.shape();
        Update.fillStyleNode();
        Update.strokeStyleNode();
        Update.strokeStyleEdge();
        Update.width();
        Update.height();
        Update.lineWidthNode();
        Update.lineWidthEdge();
        Update.lineDashNode();
        Update.lineDashEdge();
        Update.margin();
    };

    this.resizeTree = function(){
        properties = forest.SubForest.getProperties();
        Update.width();
        Update.height();
        Update.margin();
    };

    this.shape = function(){
        properties = forest.SubForest.getProperties();
        Update.shape();
        Update.width();
        Update.height();
    };

    this.barTool = function(){
        properties = forest.SubForest.getProperties();
        Update.barTool();
    };

    this.info = function(){
        Update.info();
    };

    this.width = function(){
        properties = forest.SubForest.getProperties();
        Update.width();
    };

    this.height = function(){
        properties = forest.SubForest.getProperties();
        Update.height();
    };

    this.lineDashNode = function(){
        properties = forest.SubForest.getProperties();
        Update.lineDashNode();
    };

    this.fillStyleNode = function(){
        properties = forest.SubForest.getProperties();
        Update.fillStyleNode();
    };

    this.strokeStyleNode = function(){
        properties = forest.SubForest.getProperties();
        Update.strokeStyleNode();
    };

    this.strokeStyleEdge = function(){
        properties = forest.SubForest.getProperties();
        Update.strokeStyleEdge();
    };

    this.lineWidthNode = function(){
        properties = forest.SubForest.getProperties();
        Update.lineWidthNode();
    };

    var Update = {
        barTool: function(){
            var index = forest.getRecord().getIcurrent();
            var recordsLength = forest.getRecord().getRecords().length;
            var isCapture = classie.hasClass(eCapture, 'active');

            if(index === -1 || isCapture)
                eUndo.disabled = true;
            else if(recordsLength > 0)
                eUndo.disabled = false;
            
            if(index === recordsLength - 1 || isCapture)
                eRedo.disabled = true;
            else if(recordsLength > 0)
                eRedo.disabled = false;


            if(properties.treesLength === 1)
                eExport.disabled = false;
            else
                eExport.disabled = true;

            if(properties && properties.atLeastChild)
                eContract.disabled = false;
            else
                eContract.disabled = true;
        

            if(properties.nodesLength > 0){
                ePath.disabled = false;
                eAdd.disabled = false;
                eRemove.disabled = false;
            }else{
                ePath.disabled = true;
                eAdd.disabled = true;
                eRemove.disabled = true;
            }


            if(properties.nodesLength === 1){
                eCut.disabled = false;
                eCopy.disabled = false;
            }else{
                eCut.disabled = true;
                eCopy.disabled = true;
            }
            
            if(forest.getTrees().length > 0)
                eCapture.disabled = false;
            else
                eCapture.disabled = true;
                

            if(properties.treesLength > 0 && !isCapture)
                eSelection.disabled = false;
            else
                eSelection.disabled = true;

            if(isCapture){
                if(eSectionFile){
                    eOpen.disabled = true;
                    eNewFile.disabled = true;
                    eSave.disabled = true;
                }
                eNew.disabled = true;
                eScale.disabled = true;
            }else{
                if(eSectionFile){
                    eOpen.disabled = false;
                    eNewFile.disabled = false;
                    eSave.disabled = false;
                }
                eNew.disabled = false;
                eScale.disabled = false;
            }
        },

        info: function(){
            if(properties.treesLength === 0){
                eOpcionalView.value = eTypeTree.value = eGrade.value = eLevel.value = eGradeNode.value = eLevelNode.value = '';

            }else if(properties.treesLength === 1){
                var subTrees = forest.getSubTrees();
                var tree = subTrees[Object.keys(subTrees)[0]];

                eTypeTree.value = (tree.getNodes()[0] instanceof Binary)? "Binario": "N-ario";
                eGrade.value = tree.getTree().getGrade();
                eLevel.value = tree.getTree().getLevel();
                
                if(tree.getNodes().length === 1){
                    eGradeNode.value = tree.getNodes()[0].children.length;
                    eLevelNode.value = tree.getNodes()[0].depth;    
                    eOpcionalView.value = (tree.getNodes()[0].text.opcional === undefined)? '': tree.getNodes()[0].text.opcional;
                }else{
                    eOpcionalView.value = eGradeNode.value = eLevelNode.value = 'múltiple';
                }
            }else{
                eOpcionalView.value = eTypeTree.value = eGrade.value = eLevel.value = eGradeNode.value = eLevelNode.value = 'múltiple';
            }
        },

        text: function(){
            var subTrees = forest.getSubTrees();

            if(properties.nodesLength === 1){
                var text = subTrees[Object.keys(subTrees)[0]].getNodes()[0].text;
                eNameNode.value = (text.nameNode !== undefined) ? text.nameNode : '';                            
                eOpcional.value = (text.opcional !== undefined) ? text.opcional : '';
                eNameNode.placeholder = eOpcional.placeholder = ' ';
                eNameNode.disabled = eOpcional.disabled = false;
            
            }else if(properties.nodesLength > 1){
                eNameNode.value = eOpcional.value = '';
                eNameNode.placeholder = eOpcional.placeholder = 'múltiple';
                eNameNode.disabled = eOpcional.disabled = false;
            
            }else{
                eNameNode.disabled = eOpcional.disabled = true;
                eNameNode.placeholder = eOpcional.placeholder = ' ';
                eNameNode.value = eOpcional.value = '';
            }

            
            if(properties && properties.atLeastParent){
                if(properties.nodesLength === 1){
                    var text = subTrees[Object.keys(subTrees)[0]].getNodes()[0].text;
                    eNameEdge.value = (text.nameEdge !== undefined) ? text.nameEdge : '';
                    eNameEdge.placeholder = ' ';
                
                }else if(properties.nodesLength > 1){
                    eNameEdge.value = '';
                    eNameEdge.placeholder = 'múltiple';
                }
                eNameEdge.disabled = false;
            }else{
                eNameEdge.disabled = true;
                eNameEdge.placeholder = ' ';
                eNameEdge.value = '';
            }
        },

        shape: function(){
            if(properties.nodesLength > 0){   
                var shape = properties.style.sNode.shape; 
                for(var i = 0; i < eShapes.length; ++i){
                    eShapes[i].disabled = false;
                    (eShapes[i].getAttribute('data-shape') === shape)? 
                        classie.addClass(eShapes[i], 'active') : 
                        classie.removeClass(eShapes[i], 'active');
                }
            }else{
                for(var i = 0; i < eShapes.length; ++i){
                    eShapes[i].disabled = true;
                    classie.removeClass(eShapes[i], 'active');
                }
            }
        },

        fillStyleNode: function(){ 
            if(properties.nodesLength > 0){
                var fillStyle = properties.style.sNode.fillStyle; 
                for(var i = 0; i < eFillStyleNodes.length; ++i){
                    eFillStyleNodes[i].disabled = false;
                    var style = window.getComputedStyle(eFillStyleNodes[i].getElementsByClassName('color')[0]);
                    var backgroundColor = style.getPropertyValue('background-color'); 
                    (backgroundColor === fillStyle)? 
                        classie.addClass(eFillStyleNodes[i], 'active') : 
                        classie.removeClass(eFillStyleNodes[i], 'active');
                }
            }else{
                for(var i = 0; i < eFillStyleNodes.length; ++i){
                    eFillStyleNodes[i].disabled = true;
                    classie.removeClass(eFillStyleNodes[i], 'active');
                }
            }
        },

        strokeStyleNode: function(){ 
            if(properties.nodesLength > 0){ 
                var strokeStyle = properties.style.sNode.strokeStyle; 
                for(var i = 0; i < eStrokeStyleNodes.length; ++i){
                    eStrokeStyleNodes[i].disabled = false;
                    var style = window.getComputedStyle(eStrokeStyleNodes[i].getElementsByClassName('color')[0]);
                    var backgroundColor = style.getPropertyValue('background-color'); 
                    (backgroundColor === strokeStyle)? 
                        classie.addClass(eStrokeStyleNodes[i], 'active'):
                        classie.removeClass(eStrokeStyleNodes[i], 'active');
                }
            }else{
                for(var i = 0; i < eStrokeStyleNodes.length; ++i){
                    eStrokeStyleNodes[i].disabled = true;
                    classie.removeClass(eStrokeStyleNodes[i], 'active');
                }
            }
        },

        strokeStyleEdge: function(){ 
            if(properties.nodesLength > 0 && properties.atLeastParent){
                var fillStyle = properties.style.sEdge.strokeStyle;    
                for(var i = 0; i < eStrokeStyleEdges.length; ++i){
                    eStrokeStyleEdges[i].disabled = false;
                    var style = window.getComputedStyle(eStrokeStyleEdges[i].getElementsByClassName('color')[0]);
                    var backgroundColor = style.getPropertyValue('background-color');
                    (backgroundColor === fillStyle)? 
                        classie.addClass(eStrokeStyleEdges[i], 'active'): 
                        classie.removeClass(eStrokeStyleEdges[i], 'active');
                }
            }else{
                for(var i = 0; i < eStrokeStyleEdges.length; ++i){
                    eStrokeStyleEdges[i].disabled = true;
                    classie.removeClass(eStrokeStyleEdges[i], 'active');
                }
            }
        },

        width: function(){
            if(properties.nodesLength > 0){                    
                eRangeWidth.value = eWidth.value = Math.round(properties.bB.bNode.width/properties.nodesLength);
                eRangeWidth.disabled = eWidth.disabled = false;
                classie.removeClass(ePostfixWidth, 'disabled');
            }else{
                eRangeWidth.value = eWidth.value = '';
                eRangeWidth.disabled = eWidth.disabled = true;
                classie.addClass(ePostfixWidth, 'disabled');
            }
        },

        height: function(){
            if(properties.nodesLength > 0){    
                eRangeHeight.value = eHeight.value = Math.round(properties.bB.bNode.height/properties.nodesLength);
                eRangeHeight.disabled = eHeight.disabled = false;
                classie.removeClass(ePostfixHeight, 'disabled');
            }else{
                eRangeHeight.value = eHeight.value = '';
                eRangeHeight.disabled = eHeight.disabled = true;
                classie.addClass(ePostfixHeight, 'disabled');
            }
        },

        lineDashNode: function(){
            if(properties.nodesLength > 0){
                var lineDash = properties.style.sNode.lineDash;
                if(lineDash === null)
                    eLineDashNode.value = null;
                else if(lineDash === undefined)
                    eLineDashNode.value = 3;
                else if(lineDash.length === 2)
                    eLineDashNode.value = 2;
                else
                    eLineDashNode.value = 1;
                eLineDashNode.disabled = false;
            }else{
                eLineDashNode.value = 1;
                eLineDashNode.disabled = true;
            }
        },

        lineDashEdge: function() {
            if(properties.nodesLength > 0 && properties.atLeastParent){
                var lineDash = properties.style.sEdge.lineDash;
                if(lineDash === null)
                    eLineDashEdge.value = null;
                else if(lineDash.length === 2)
                    eLineDashEdge.value = 2;
                else
                    eLineDashEdge.value = 1;
                eLineDashEdge.disabled = false;
            }else{
                eLineDashEdge.value = 1;
                eLineDashEdge.disabled = true;
            }
        },

        lineWidthNode: function(){
            if(properties.nodesLength > 0){
                eRangeLineWidthNode.value = eLineWidthNode.value = Math.round(properties.style.sNode.lineWidth/properties.nodesLength);
                eRangeLineWidthNode.disabled = eLineWidthNode.disabled = false;
                classie.removeClass(ePostfixLineWidthNode, 'disabled');
            }else{
                eRangeLineWidthNode.value = eLineWidthNode.value = '';
                eRangeLineWidthNode.disabled = eLineWidthNode.disabled = true;
                classie.addClass(ePostfixLineWidthNode, 'disabled');
            }
        },

        lineWidthEdge: function() {
            if(properties.nodesLength > 0 && properties.atLeastParent){
                eRangeLineWidthEdge.value = eLineWidthEdge.value = Math.round(properties.style.sEdge.lineWidth/properties.nodesLength);
                eRangeLineWidthEdge.disabled = eLineWidthEdge.disabled = false;
                classie.removeClass(ePostfixLineWidthEdge, 'disabled');
            }else{
                eRangeLineWidthEdge.value = eLineWidthEdge.value = '';
                eRangeLineWidthEdge.disabled = eLineWidthEdge.disabled = true;
                classie.addClass(ePostfixLineWidthEdge, 'disabled');
            }
        },

        margin: function() {
            if(properties.nodesLength > 0){    
                eRangeMarginTop.value = eMarginTop.value = Math.round(properties.style.marginTop/properties.nodesLength);
                eRangeMarginTop.disabled = eMarginTop.disabled = false;
                classie.removeClass(ePostfixMarginTop, 'disabled');

                eRangeMarginLeft.value = eMarginLeft.value = Math.round(properties.style.marginLeft/properties.nodesLength);
                eRangeMarginLeft.disabled = eMarginLeft.disabled = false;
                classie.removeClass(ePostfixMarginLeft, 'disabled');
            }else{
                eRangeMarginTop.value = eMarginTop.value = '';
                eRangeMarginTop.disabled = eMarginTop.disabled = true;
                classie.addClass(ePostfixMarginTop, 'disabled');

                eRangeMarginLeft.value = eMarginLeft.value = '';
                eRangeMarginLeft.disabled = eMarginLeft.disabled = true;
                classie.addClass(ePostfixMarginLeft, 'disabled');
            }
        },
    };
};