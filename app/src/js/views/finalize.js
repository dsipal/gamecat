$(document).ready(function(){
    var av = new AccountValidator();

    $('#alert-ok').click(function(){
        setTimeout(function(){
            window.location.href = '/account'; //redirect with client side js
        }, 300)
    });

    $('#finalize_social').ajaxForm({
        beforeSubmit : function(formData, jqForm, options){
            return av.validateSocialForm();
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

    $('.modal-alert .modal-body p').html('You have been successfully registered! </br> Click ok to continue');

});
