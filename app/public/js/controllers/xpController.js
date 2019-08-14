$(document).ready(function(){
    let xpBar = $('.xp-bar');
    let bonusElem = $('.bonus-amount');
    let levelElem = $('#level');
    let userLevel = parseInt(levelElem.data('level'));
    let userXP = parseInt(levelElem.data('cur-exp'));

    const bonusAmount = (((parseInt(userLevel) - 1) * 0.025) * 100).toFixed(2);
    let bonusString = String('+' + bonusAmount  + '%');
    bonusElem.text(bonusString);
    let requiredXP = Math.floor(600 + (userLevel * 400));
    let barPercentage = Math.floor((userXP/requiredXP)*100)+'%';
    xpBar.css('width', barPercentage);
    xpBar.text(userXP + '/' + requiredXP + ' (' + barPercentage + ')');
});

