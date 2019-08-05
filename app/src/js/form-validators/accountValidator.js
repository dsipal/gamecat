//TODO ensure that every field is checked both on client and server.
//TODO check referrer the same as usernames, add regex to each username/name input to ensure its clean
function AccountValidator()
{
    this.fields = {
        username: $('#user-tf'),
        password: $('#pass-tf'),
        passwordV: $('#pass-verify-tf'),
        name: $('#name-tf'),
        email: $('#email-tf'),
        country: $('#country-list'),
        referrer: $('#ref_by'),
        email_optin: $('#email-optin'),
        terms_conditions: $('#terms-conditions')
    };

    this.socialFields = {
        username: $('#username'),
        email: $('#email'),
        referrer: $('#ref_by')
    };

    this.errs = [];

    this.alert = $('.modal-form-errors');
    this.alert.modal({ show : false, keyboard : true, backdrop : true});

    this.validateUsername = function(s){
        let regex = new RegExp(`^(?!.*__.*)(?!.*\\.\\..*)[a-zA-Z0-9_.]+$`);
        return regex.test(s);
    };

    this.validateName = function(s){
        return s.length >= 3;
    };
    this.validatePassword = function(password, passwordV, username, callback)
    {
        let regex = new RegExp(`\\S*(\\S*([a-zA-Z]\\S*[0-9])|([0-9]\\S*[a-zA-Z]))\\S*`);

        if (password.length < 6) {
            callback('Please ensure your password is at least 6 characters long.');
        } else {
            if (username === password) {
                callback('Please do not use your username as your password.');
            } else {
                if (password !== passwordV) {
                    callback('Your passwords are not the same.');
                } else {
                    if (!regex.test(password)) {
                        callback('Please ensure your password contains letters and numbers.');
                    } else {
                        callback(null);
                    }
                }
            }
        }
    };

    this.validateEmail = function()
    {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(this.fields.email.val());
    };

    this.validateCountry = function(){
        return this.fields.country !== " ";
    };
    this.validateTermsConditions = function(){
        return this.fields.terms_conditions !== null;
    };
}

AccountValidator.prototype.showInvalidEmail = function()
{
    this.fields.email.addClass('error');
    this.errs.push('That email address is already in use.');
};

AccountValidator.prototype.showInvalidUserName = function()
{
    this.fields.username.addClass('error');
    this.errs.push('That username is already in use.');
};

AccountValidator.prototype.showInvalidRefName = function()
{
    this.fields.referrer.addClass('error');
    this.errs.push('This referral is not valid.');
};

AccountValidator.prototype.showDispoEmail = function()
{
	this.fields.email.addClass('error');
	this.errs.push('This email is from a disposable email provider.');
};

AccountValidator.prototype.showAcceptTC = function(){
    this.fields.terms_conditions.addClass('error');
    this.errs.push('You must accept the terms and conditions.')
};

AccountValidator.prototype.validateForm = function()
{
    for (let key in this.fields){ this.fields[key].removeClass('error');}
    if(!this.validateUsername(this.fields.username.val())){
        this.fields.username.addClass('error');
        this.errs.push('Please enter a valid username.')
    }
    if (!this.validateEmail(this.fields.email.val())) {
        this.fields.email.addClass('error');
        this.errs.push('Please enter a valid email.');
    }
    if(!this.validateTermsConditions(this.fields.terms_conditions.val())){
        this.fields.terms_conditions.addClass('error');
        this.errs.push('You must accept our terms and conditions.')
    }
    this.validatePassword(
        this.fields.password.val(),
        this.fields.passwordV.val(),
        this.fields.username.val(), function(err){
        if(err){
            this.errs.push(err);
        }
    });
    if (this.errs.length) this.showErrors();
    return this.errs.length === 0;
};

AccountValidator.prototype.validateSocialForm = function(){
    for (let key in this.socialFields){ this.socialFields[key].removeClass('error');}
    if(!this.validateUsername(this.socialFields.username.val())){
        this.socialFields.username.addClass('error');
        this.errs.push('Please enter a valid username.')
    }
    if(this.socialFields.email){
        if (!this.validateEmail(this.fields.email.val())) {
            this.fields.email.addClass('error');
            this.errs.push('Please enter a valid email.');
        }
    }
};

AccountValidator.prototype.showErrors = function()
{
    console.log(this.errs);
    $('.modal-form-errors .modal-body p').text('Please correct the following problems: ');
    let ul = $('.modal-form-errors .modal-body ul');
    console.log(ul);
    ul.empty();
    for (let key in this.errs) ul.append('<li>'+this.errs[key]+'</li>');
    this.alert.modal('show');
    this.errs = [];
};
