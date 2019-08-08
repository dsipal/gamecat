$(document).ready(function() {
    let select = $('#option');
    let costSelector = $('#point-cost');

    select.change(function(){
        let option = select.val();
        costSelector.html(String(option)+' ');
    });

    $('.prize-form').ajaxForm({
        success: function(responseText, status, xhr, $form){
            if (status === 'success') $('.modal-alert').modal('show');
        },
        error: function(e){
            $('.modal-form-errors').modal('show');
        }
    });
    $('.modal-alert').modal({ show:false, keyboard : false, backdrop : 'static' });
    $('.modal-form-errors').modal({ show:false, keyboard : false, backdrop : 'static' });
    $('.modal-alert .modal-header h4').text('Order Recieved');
    $('.modal-alert .modal-body p').html('<img src="/img/treasure.svg" style="display:block;"/>Your order has been placed! Please allow up to 24 hours to receive your prize.');
    $('.modal-form-errors .modal-body').text('You do not have enough points to purchase this prize! Please earn more and try again.');
});
