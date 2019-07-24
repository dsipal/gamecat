$(document).ready(async function(){

    let passwordEdit = $('#edit-password');
    let passwordSave = $('#save-password');
    passwordEdit.click(function(){
        $('input:password').prop('disabled', false);
        passwordEdit.hide();
        passwordSave.show();
    });
    let subscribeCheckBox = $('#subscribe');
    subscribeCheckBox.mouseup(function(){
        let val = subscribeCheckBox.val();
        if (val !== null){

            if(val === 'on'){
                val = false;
            } else {
                val = true;
                subscribeCheckBox.selected(true);
            }
            $.ajax({
                type: 'POST',
                url: '/account/subscribe',
                success: function(){
                    window.location.href = ('/account');
                }
            });
        }
    });
});
