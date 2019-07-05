//TODO instead of loading new page, have offers/pagination load all into one page
$(document).ready(function(){
    const page_max = 15;
    var page = Math.abs(parseInt(getUrlParameter('page'))) || 1;
    console.log(page);

    var limit = 8;
    var offset = limit * (page-1);

    var offer_list = $('.offer-list');
    var pagination = $('.pagination');

    var url = "https://adscendmedia.com/adwall/api/publisher/9359/profile/16028/offers.json";
    var query_strings = $.param({
        subid1: offer_list.attr('data-subid1'),
        limit: limit,
        offset: offset,
        sort_by: 'payout'
    });


    $.getJSON(url+'?'+query_strings).done(function(data){
        //on success
        $.each(data.offers, function(key, offer){
            var element = `<li class="col-md-3 offer-item justify-content-center">
                    <img src="`+offer.creative_url+`"  alt="`+offer.name+`" class="row offer-image">
                    <a href="`+offer.click_url+`" class="row offer-link">`+offer.name+`</a>
                    <p class="offer-reward">`+offer.currency_count+` Points</p>
                    <p class="offer-description">`+offer.description+`</p>
                </li>`;
            offer_list.append(element);
        });

        makePagination(page, page_max);

    }).fail(function(data){
        //on failure
    });
});


var makePagination = function(page, page_max){
    //page = page;
    var pages_right, pages_left;
    if(page === 14 || page === 15) pages_left = 4; else pages_left = 2;
    if(page === 1 || page === 2) pages_right = 4; else pages_right = 2;
    var first_page = Math.max(1, page-pages_left);
    var last_page = Math.min(page_max, page+pages_right);
    console.log(first_page,page,last_page);

    for(i = first_page; i <= last_page; i++){
        var element = `<a id="page-`+i+`" href="?page=`+i+`">`+i+`</a>`;
        $('.pagination-numbers').append(element);
    }
    $('#page-'+page).addClass('active');
};

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};
