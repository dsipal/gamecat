$(document).ready(function(){
    var e=document.createElement('div');
    e.id='iTafIeFKkQSY';
    e.style.display='none';
    document.body.appendChild(e);

    const offer_list = $('.offer-list');
    const obsOpts = {
        root: null,
        rootMargin: '0px',
        threshold: 1.0
    };
    let page = 0;
    let limit = 8;

    if(!document.getElementById('iTafIeFKkQSY')) {
        offer_list.append("<h1> You must disable ad-block to view offers. </h1>")
    }

    const loadMore = function(page, limit, offset, offer_list){
        const page_max = 15;
        const url = "https://adscendmedia.com/adwall/api/publisher/9359/profile/16028/offers.json";

        const query_strings = $.param({
            subid1: offer_list.attr('data-subid1'),
            limit: limit,
            offset: offset,
            sort_by: 'payout',
            payout_min: .60
        });

        $.getJSON(url+'?'+query_strings).done(function(data){
            //on success
            if(data === undefined){
                observer.disconnect();
            } else {
                $.each(data.offers, function(key, offer){
                    var element = `
                    <li class="col-md-3 justify-content-center">
                        <div class="offer-item">
                             <a href="`+offer.click_url+`" class="row offer-link">
                                <img src="`+offer.creative_url+`"  alt="`+offer.name+`" class="row offer-image">
                             </a>
                             <p class="offer-reward">`
                                        +offer.currency_count+` 
                                        <img class="crystal-ico" src="/img/crystal.svg" alt="crystals"/>
                             </p>
                             
                             <div class="offer-info">
                                <a href="`+offer.click_url+`" class="row offer-link">
                                    <span>`+offer.name+`</span>
                                </a>
                                <p class="offer-description">`+offer.description+`</p>
                             </div>
                             
                            
                        </div>
                    </li>
                    `;
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
                let offset = limit * page;
                loadMore(page, limit, offset, offer_list);
                page += 1;
            }
        })
    }, obsOpts);
    observer.observe(document.querySelector('#infinite-trigger'));
});
