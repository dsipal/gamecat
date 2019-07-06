//TODO instead of loading new page, have offers/pagination load all into one page
$(document).ready(function(){
    const offer_list = $('.offer-list');
    const obsOpts = {
        root: null,
        rootMargin: '0px',
        threshold: 1.0
    };

    let tab = $('.active')[0];
    let page = 0;
    let limit = 8;

    const loadMore = function(page, limit, offset, offer_list){
        const page_max = 15;
        const url = "https://adscendmedia.com/adwall/api/publisher/9359/profile/16028/offers.json";

        const query_strings = $.param({
            subid1: offer_list.attr('data-subid1'),
            limit: limit,
            offset: offset,
            sort_by: 'payout'
        });

        $.getJSON(url+'?'+query_strings).done(function(data){
            //on success
            if(data === undefined){
                observer.disconnect();
            } else {
                $.each(data.offers, function(key, offer){
                    var element = `<li class="col-md-6 justify-content-center"><div class="offer-item">
                    <img src="`+offer.creative_url+`"  alt="`+offer.name+`" class="row offer-image">
                    <a href="`+offer.click_url+`" class="row offer-link">`+offer.name+`</a>
                    <p class="offer-reward">`+offer.currency_count+` Points</p>
                    <p class="offer-description">`+offer.description+`</p>
                </li></div>`;
                    offer_list.append(element);
                });
            }

        }).fail(function(data){
            console.log(data);
        });
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry =>{
            console.log(entry.intersectionRatio);
            if(entry.intersectionRatio > 0){
                let offset = limit * (page-1);
                console.log('viewable!');
                loadMore(page, limit, offset, offer_list);
                page += 1;
            }
        })
    }, obsOpts);
    observer.observe(document.querySelector('#infinite-trigger'));


});
