
$(document).ready(function(){
	var av = new AccountValidator();

	$('#account-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			return av.validateForm();
		},
		success	: function(responseText, status, xhr, $form){
			if (status === 'success') $('.modal-alert').modal('show');
		},
		error : function(e){
			let errs = JSON.parse(e.responseText);
			if(errs.errors){
				for(let error in errs.errors){
					if(error === "username"){
						av.showInvalidUserName();
					}
					else if(error === 'email'){
						av.showInvalidEmail();
					}
				}
			}
			for(let key in errs){
				if (errs[key] === 'invalid-referral'){
					av.showInvalidRefName();
				}  	else if (errs[key] === 'disposable-email') {
					av.showDispoEmail();
				} else if (errs[key] === 'terms-not-accepted') {
					av.showAcceptTC();
				}
			}
			av.showErrors();
		}
	});
	// $('#name-tf').focus();

// setup the alert that displays when an account is successfully created //

	$('.modal-alert').modal({ show:false, keyboard : false, backdrop : 'static' });
	$('.modal-alert .modal-header h4').text('Account Created!');
	$('.modal-alert .modal-body p').html('Your account has been created.</br>Click OK to return to the login page.');

});
