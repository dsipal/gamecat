$(document).ready(function() {
    let select = $('#option');
    let costSelector = $('#point-cost');

    select.change(function(){
        let option = select.val();
        costSelector.html(String(option)+' ');
    });
});
