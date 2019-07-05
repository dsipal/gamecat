$(document).ready(function() {
    $('.signup-form').ajaxForm({
        success	: function(responseText, status, xhr, $form){
            $('.signup-form').replaceWith("<h3>Thanks for signing up!</h3>");
            console.log('success')
        },
        error : function(e){
            $('#signup-form').replaceWith("<h3>Something went wrong!</h3>");
        }
    });
});

