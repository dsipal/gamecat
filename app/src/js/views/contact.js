$(document).ready(function(){
    let contact = $('#contact-form');
    let success = $('.modal-alert').show();
    let error = $('.modal-form-errors');
    success.modal({ show:false, keyboard : false, backdrop : 'static' });
    $('.modal-alert .modal-header h4').text('Message Sent!');
    $('.modal-alert .modal-body p').html('Your message has been sent.</br>Click OK to return to the login page.');


    contact.ajaxForm({
        beforeSubmit: function(){

        },
        success: function(){
            success.show();
        },
        error: function(){
            error.show();
        }
    });
});
