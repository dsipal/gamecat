$(document).ready(function(){
    let xpBar = $('.xp-bar');
    let bonusElem = $('.bonus-amount');
    let levelElem = $('#level');
    let userLevel = levelElem.data('level');
    let userXP = levelElem.data('cur-exp');

    console.log(bonusElem);
    bonusElem.text('+' + ((userLevel - 1) * 0.025) * 100 + '%');
    let requiredXP = 600 + ((userLevel-1) * 400);
    let barPercentage = Math.floor((userXP/requiredXP)*100)+'%';
    xpBar.width(barPercentage);
    xpBar.text(userXP + '/' + requiredXP + ' (' + barPercentage + ')');
});
