/*
 * Tab.
 * Date: 2016.
 * Dependencies: classie.js
 *
 * Copyright (c) 2016 Yenny Fung Guan
 */

( function( window ) {	

	var change = function (tabClass, that){
		var tab = document.querySelector(tabClass + ' > nav li.tab-current');
		if(tab){
			classie.removeClass(tab, 'tab-current');
			classie.removeClass(document.querySelector(tabClass + ' > .content-wrap > section.content-current'), 'content-current');
		}
		classie.addClass(that, 'tab-current');
		classie.addClass(document.querySelector(that.getElementsByTagName('a')[0].getAttribute("href")), 'content-current');
	};

	var load = function(tabClass, iTabCurrent){
		var eTabs = document.querySelectorAll(tabClass + ' > nav li');
		for(var i = 0; i < eTabs.length; ++i)
	    	eTabs[i].addEventListener('click', function() { change(tabClass, this); });
	    change(tabClass, eTabs[iTabCurrent]);
	};

	var setCurrent = function(tabClass, iTabCurrent){
		change(tabClass, document.querySelector(tabClass + ' > nav li:nth-child('+ (iTabCurrent+1) +')'));
	};

	window.tab = {
	    load: load,
	    setCurrent: setCurrent,
	};

})( window );