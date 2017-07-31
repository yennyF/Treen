( function( window ) {	

	function setProgress(form, status, keepStatus){
		var el = form.querySelector(".progress");
		classie.addClass(el, status);

		if(keepStatus === undefined || !keepStatus){
			setTimeout( function() { 
				classie.removeClass(el, status); 
				el.disabled = false;
			}, 1500 );
		}else{
			var els = form.querySelectorAll('input, select');
			for(var i = 0; i < els.length; ++i)
				els[i].disabled = true;
			el.disabled = true;
		}
	}

	function form(form){
	    if(form.checkValidity())
			return true;
		setProgress(form, 'error');
		return false;
	}

	function field(field, msg){
		field.setCustomValidity('');
		if(field.value.length > 0 && !field.checkValidity()){
			field.setCustomValidity(msg);
			$(field).next('.validateMsg')[0].innerText = field.validationMessage;
		}else{
			$(field).next('.validateMsg')[0].innerText = '';
		}
	}

	function fieldConfirm(field, fieldConfirm){
		fieldConfirm.setCustomValidity('');
		if(fieldConfirm.value.length > 0 && field.value != fieldConfirm.value){
			fieldConfirm.setCustomValidity('Los campos no coinciden');
			$(fieldConfirm).next('.validateMsg')[0].innerText = fieldConfirm.validationMessage;
		}else{
			$(fieldConfirm).next('.validateMsg')[0].innerText = '';
		}
	}

	function setFields(form, msgs){
		for(key in msgs){
			form.querySelector("[name*='" + key + "']").setCustomValidity(msgs[key]);
			form.querySelector("[name*='" + key + "'] + .validateMsg").innerText = msgs[key];
		}
	}

	window.validity = {
	    form: form,
	    field: field,
	    fieldConfirm: fieldConfirm,
	    setFields: setFields,
	    setProgress: setProgress,
	};

})( window );