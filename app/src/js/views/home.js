
$(document).ready(function(){

    var hc = new HomeController();
    var av = new AccountValidator();

	$('#account-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if (!av.validateForm()){
				return false;
			} else {
			// push the disabled username field onto the form data array //
				//TODO remove this after working out a separate page for updating account info from user home/account info.
				formData.push({name:'account.js', value:$('#user-tf').val()});
				return true;
			}
		},
		success	: function(responseText, status, xhr, $form){
			if (status === 'success') hc.onUpdateSuccess();
		},
		error : function(e){
			if (e.responseText === 'email-taken'){
				av.showInvalidEmail();
			}	else if (e.responseText === 'username-taken'){
				av.showInvalidUserName();
			} 	else if (e.responseText === 'invalid-referral'){
				av.showInvalidRefName();
			} 	else if (e.responseText === 'disposable-email') {
				av.showDispoEmail();
			}
		}
	});
	$('#name-tf').focus();

// customize the account settings form //

    $('#account-form h2').text('Account Settings');
    $('#account-form #sub').text('Here are the current settings for your account.');
    $('#user-tf').attr('disabled', 'disabled');
    $('#points').attr('disabled', 'disabled');
    $('#ref_by').attr('disabled', 'disabled');
    $('#account-form-btn1').html('Delete');
    $('#account-form-btn1').removeClass('btn-outline-dark');
    $('#account-form-btn1').addClass('btn-danger');
    $('#account-form-btn2').html('Update');

// setup the confirm window that displays when the user chooses to delete their account //

    $('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
    $('.modal-confirm .modal-header h4').text('Delete Account');
    $('.modal-confirm .modal-body p').html('Are you sure you want to delete your account?');
    $('.modal-confirm .cancel').html('Cancel');
    $('.modal-confirm .submit').html('Delete');
    $('.modal-confirm .submit').addClass('btn-danger');

});
