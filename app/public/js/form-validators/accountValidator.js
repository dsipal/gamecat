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

    this.alert = $('.modal-form-errors');
    this.alert.modal({ show : false, keyboard : true, backdrop : true});

    this.validateName = function(s)
    {
        return s.length >= 3;
    };
    this.validatePassword = function(password, passwordV, username, callback)
    {
        let regex = new RegExp(`\\S*(\\S*([a-zA-Z]\\S*[0-9])|([0-9]\\S*[a-zA-Z]))\\S*`);

        if(password.length >= 6){
            if(username !== password){
                if(password === passwordV){
                    if(regex.test(password)){
                        callback(null);
                    } else {
                        callback('Please ensure your password contains letters and numbers.');
                    }
                } else {
                    callback('Your passwords are not the same.');
                }
            } else {
                callback('Please do not use your username as your password.');
            }
        } else {
            callback('Please ensure your password is at least 6 characters long.');
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

    this.showErrors = function(a)
    {
        console.log(a);
        $('.modal-form-errors .modal-body p').text('Please correct the following problems: ');
        let ul = $('.modal-form-errors .modal-body ul');
        ul.empty();
        for (let key in a) ul.append('<li>'+a[key]+'</li>');
        this.alert.modal('show');
    }
}

AccountValidator.prototype.showInvalidEmail = function()
{
    this.fields.email.addClass('error');
    this.showErrors(['That email address is already in use.']);
};

AccountValidator.prototype.showInvalidUserName = function()
{
    this.fields.username.addClass('error');
    this.showErrors(['That username is already in use.']);
};

AccountValidator.prototype.showInvalidRefName = function()
{
    this.fields.referrer.addClass('error');
    this.showErrors(['This referral is not valid.']);
};

AccountValidator.prototype.showDispoEmail = function()
{
	this.fields.email.addClass('error');
	this.showErrors(['This email is from a disposable email provider.'])
};

AccountValidator.prototype.validateForm = function()
{
    let e = [];
    for (let key in this.fields){ this.fields[key].removeClass('error');}
    if (!this.validateName(this.fields.name.val())) {
        this.fields.name.addClass('error');
        e.push('Please enter your name.');
    }
    if (!this.validateEmail(this.fields.email.val())) {
        this.fields.email.addClass('error');
        e.push('Please enter a valid email.');
    }
    if (!this.validateName(this.fields.username.val())) {
        this.fields.name.addClass('error');
        e.push('Please choose a username.');
    }
    if(!this.validateCountry(this.fields.country.val())){
        this.fields.country.addClass('error');
        e.push('Please select a country.');
    }
    if(!this.validateTermsConditions(this.fields.terms_conditions.val())){
        this.fields.terms_conditions.addClass('error');
        e.push('You must accept our terms and conditions.')
    }

    this.validatePassword(
        this.fields.password.val(),
        this.fields.passwordV.val(),
        this.fields.username.val(), function(err){
        if(err){
            e.push(err);
        }
    });
    if (e.length) this.showErrors(e);
    return e.length === 0;
};
