$(document).ready(function(){
    const obsOpts = {
        root: null,
        rootMargin: '0px',
        threshold: 1.0
    };
    //let page = 0;
    let limit = 8;
    let category;

    const updateCategory = function(){
        category = $('#offers-tabs .nav-item a.active').data('category');
    };

    const loadMore = function(page, limit, offset, offer_list){

        const page_max = 15;
        const url = "https://adscendmedia.com/adwall/api/publisher/9359/profile/16028/offers.json";

        const query_strings = $.param({
            subid1: 'gamecat',
            subid2: $('div.tab-content').data('userid'),
            limit: limit,
            offset: offset,
            category_id: category,
            sort_by: 'popularity',
        });
        let eventModifier = $('#offersContent').data('event-modifier');

        $.getJSON(url+'?'+query_strings).done(function(data){
            //on success
            if(data === undefined){
                observers[$('#offers-tabs .nav-item a.active').attr('aria-controls')].disconnect();

            } else {
                if($('#adblock-off')){
                    $('#adblock-off').remove();
                }
                $.each(data.offers, function(key, offer){
                    offer.currency_count = Math.floor(offer.currency_count + (offer.currency_count * ($('div.tab-content').attr('data-userlevel') * 0.025)));
                    if(eventModifier){
                        console.log(eventModifier);
                        offer.currency_count += (offer.currency_count * parseInt(eventModifier));
                    }
                    var element = `
                    <li class="col-md-3 justify-content-center">
                        <div class="offer-item">
                             <a href="`+offer.click_url+`" rel="nofollow" class="row offer-link">
                                <img src="`+offer.creative_url+`"  alt="`+offer.name+`" class="row offer-image">
                             </a>
                             <p class="offer-reward">`
                                        +offer.currency_count+` 
                                        <img class="crystal-ico" src="/img/crystal.svg" alt="crystals"/>
                             </p>
                             
                             <div class="offer-info">
                                <a href="`+offer.click_url+`" rel="nofollow" class="row offer-link">
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

    const observerCheck = function(entries){
        entries.forEach(entry =>{
            if(entry.intersectionRatio > 0){
                let content = $('#offersContent div.active');
                let page = content.data('page');
                let offset = limit * page;
                loadMore(page, limit, offset, content.find('.offer-list'));
                content.data('page', page+1);
            }
        })
    };

    let observers = {
        surveys: new IntersectionObserver((entries) => {observerCheck(entries)}, obsOpts),
        videos: new IntersectionObserver((entries) => {observerCheck(entries)}, obsOpts),
        trials: new IntersectionObserver((entries) => {observerCheck(entries)}, obsOpts),
        shopping: new IntersectionObserver((entries) => {observerCheck(entries)}, obsOpts)
    };

    updateCategory();

    {
        let content = $('#offersContent div.active');
        let page = content.data('page');
        let offset = limit * page;
        loadMore(page, limit, offset, content.find('.offer-list'));
    }

    observers.surveys.observe(document.querySelector('#infinite-trigger'));
    observers.videos.observe(document.querySelector('#infinite-trigger'));
    observers.trials.observe(document.querySelector('#infinite-trigger'));
    observers.shopping.observe(document.querySelector('#infinite-trigger'));

    $('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
        updateCategory();
    });
});
