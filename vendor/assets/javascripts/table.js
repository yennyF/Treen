function updateCheckbox(){
	var elsLength = $(".table .body li input[name='check-one']:enabled").length;
	var elsCheckedLenght = $(".table .body li input[name='check-one']:checked").length;
	
	$(".table .header input[name='check-all']")[0].checked = (elsLength > 0 && elsLength === elsCheckedLenght)? true : false;
	
	$(".table #bar-file .update")[0].disabled = (elsCheckedLenght === 1)? false : true;
	$('.table #bar-file .update').removeClass('active');

	$(".table #bar-file .delete")[0].disabled = (elsCheckedLenght > 0)? false : true;

	$(".table #bar-file .create")[0].disabled = false;
}

/* select all checkbox */
$(document).on('click', ".table .header input[name='check-all']", function(){
	if(this.checked){	
		var els = $(".table .body li:not(.selected):not(.active)");
		els.addClass('selected');
		els.find("input[name='check-one']").prop("checked", true);
	}else{
		var els = $(".table .body li.selected");
		els.removeClass('selected');
		els.find("input[name='check-one']").prop("checked", false);
	}
	updateCheckbox();
});

/* select one checkbox */
$(document).on('click', ".table .body li input[name='check-one']", function(){
	$(this).parents('li').toggleClass('selected');
	updateCheckbox();
});

function activeRow(data){
    var el = $(".table .body li.active");
    if(el){
    	el.removeClass('active');
    	el.find("input[name='check-one']").prop("disabled", false);
    }

    if(data){
	    el = $(".table .body li[data-id=" + data.id + "]");
	    el.removeClass('selected');
	    el.find("input[name='check-one']").prop("checked", false);
	    el.addClass('active');
	    el.find("input[name='check-one']").prop("disabled", true);

	    document.querySelector('#bar-title .title').innerHTML = data.name;
        // http://spoiledmilk.com/blog/html5-changing-the-browser-url-without-refreshing-page/
        window.history.replaceState(null, null, window.location.pathname + "?id=" + data.id);
	}else{
		document.querySelector('#bar-title .title').innerHTML = '';
        window.history.replaceState(null, null, window.location.pathname);
	}
	updateCheckbox();
}	

function addRow(dataCols, dataRow){
	var rowContent = document.createElement('label');
	for(var i = 0; i < dataCols.length; ++i){
		var column = document.createElement('span');
		column.setAttribute('data-col', dataCols[i].name);
		for(key in dataCols[i].attributes)
			column.setAttribute(key, dataCols[i].attributes[key]);
		
		var field = document.createElement('a');
		if(dataCols[i].value !== undefined)
			field.innerText = (dataCols[i].value !== 'null')? dataCols[i].value : '';
		
		column.appendChild(field);
		rowContent.appendChild(column);
	}

	var row = document.createElement('li');
	if(dataRow && dataRow['data-id'] !== undefined)
		row.setAttribute('data-id', dataRow['data-id']);
	row.innerHTML =
		"<div class='container-checkbox'>" + 
			"<input name='check-one' type='checkbox'>" + 
		"</div>";

	row.appendChild(rowContent);
	$('.table ul.body').prepend(row);
	
	var els = $('.table li.selected');
	els.removeClass('selected');
	els.find('input[type=checkbox]').prop("checked", false);

	row.setAttribute('class', 'selected');
	row.querySelector("input[name='check-one']").checked = true;
	
	updateCheckbox();
	return row;
}

function editableRow(row, dataCols){ 
	//var row = document.querySelector(".table ul.body li[data-id='"+ data.id +"']");

	function innerField(column, tag){
		var field = document.createElement(tag);

		for(key in dataCol.attributes)
			field.setAttribute(key, dataCol.attributes[key]);
		field.setAttribute('name', dataCol.name);
		field.value = column.innerText;
		field.onclick = function(e){ return false; } // stop twice event
		//field.onkeydown = function(e){ if(e.keyCode == 13) removeEditor(); };

		var validMsg = document.createElement('div');
		validMsg.setAttribute('class', 'validateMsg');

		column.innerHTML = '';
		column.appendChild(field);
		column.appendChild(validMsg);
		return field;
	}

    if(!$(row).hasClass('update')){
		$(row).addClass('update');
		$(row).find("input[name='check-one']").prop("disabled", true);
		$(".table #bar-file .create")[0].disabled = true;
		$(".table #bar-file .delete")[0].disabled = true;
		$(".table #bar-file .update").addClass('active');
		
		var rowContent = row.querySelector('label');
		var rowContentBackup = rowContent.innerHTML;

		// wrap fields into form
		var form = document.createElement('form');
		form.innerHTML = rowContent.innerHTML;
		rowContent.innerHTML = '';
		rowContent.appendChild(form);

		// change to fields
		for(var i = 0; i < dataCols.length; ++i){
			var dataCol = dataCols[i];

			if(	dataCol.attributes.type === "text" || dataCol.attributes.type === "email"){
				dataCol.field = innerField(row.querySelector("[data-col='" + dataCol.name + "']"), 'input');
				dataCol.field.setAttribute('autocomplete', 'off');
				dataCol.field.oninput = function(){ validity.field(dataCol.field, dataCol.validateMsg); };

			}else if(dataCol.attributes.type === "select"){
				dataCol.field = innerField(row.querySelector("[data-col='" + dataCol.name + "']"), 'select');
				for (var i = 0; i < dataCol.options.length; i++) {
				    var option = document.createElement("option");
				    option.value = dataCol.options[i].value;
				    option.text = dataCol.options[i].text;
				    dataCol.field.appendChild(option);
				}
			}
		}

		// add field hidden id
		if(row.getAttribute("data-id"))
			$(form).append("<input type=hidden name=id value=" + row.getAttribute("data-id") + ">");

		// focus first field
		$(form).find(":input:enabled:visible:first").focus().select();
    } 
}

function nonEditableRow(row, data){ 
	//var row = document.querySelector(".table ul.body li[data-id='"+ data.id +"']");

	for(key in data)
		$(row).find("[data-col='" + key + "']").html(
			"<a>" + ((data[key] !== 'null')? data[key] : '') + "</a>"
		);
	$(row).find("form input[type=hidden]").remove();
	row.querySelector("label").innerHTML = row.querySelector("form").innerHTML;
	$(row).find("input[name='check-one']").prop("disabled", false);

	$(row).removeClass('update');
	$('.table #bar-file .update').removeClass('active');
	$(".table #bar-file .create")[0].disabled = false;
	$(".table #bar-file .delete")[0].disabled = false;
}

function removeEditableRow(row){
	$(row).remove();
	$('.table #bar-file .update').removeClass('active');
	$(".table #bar-file .update")[0].disabled = true;
	$(".table #bar-file .create")[0].disabled = false;
	$(".table #bar-file .delete")[0].disabled = false;
}