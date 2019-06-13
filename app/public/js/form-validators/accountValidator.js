//TODO work in new account form into validation, ensure it keeps up to standards
//TODO add check to ensure user has selected a country
function AccountValidator()
{
// build array maps of the form inputs & control groups //

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
// bind the form-error modal window to this controller to display any errors //

    this.alert = $('.modal-form-errors');
    this.alert.modal({ show : false, keyboard : true, backdrop : true});

    this.validateName = function(s)
    {
        return s.length >= 3;
    };
    this.validatePassword = function(password, passwordV, callback)
    {
        var regex = new RegExp(`\\S*(\\S*([a-zA-Z]\\S*[0-9])|([0-9]\\S*[a-zA-Z]))\\S*`);

        if(password.length >= 6){
            if(password === passwordV){
                if(regex.test(password)){
                    callback(null);
                } else {
                    callback('Please ensure your password contains letters and numbers.')
                }
            } else {
                callback('Your passwords are not the same!')
            }
            callback(null);
        } else {
            callback('Please ensure your password is at least 6 characters long.')
        }

    };

    this.validateEmail = function(e)
    {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(e);
    };

    this.showErrors = function(a)
    {
        $('.modal-form-errors .modal-body p').text('Please correct the following problems :');
        var ul = $('.modal-form-errors .modal-body ul');
        ul.empty();
        for (var i=0; i < a.length; i++) ul.append('<li>'+a[i]+'</li>');
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

AccountValidator.prototype.showSamePass = function()
{
    this.fields.password.addClass('error');
    this.fields.passwordV.addClass('error');
    this.showErrors(['Please use a password that does not match your username.']);
};


AccountValidator.prototype.validateForm = function()
{
    var e = [];
    for (var elem in this.fields) elem.removeClass('error');
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

    this.validatePassword(this.fields.password.val(), this.fields.passwordV.val(), function(err){
        if(err){
            e.push(err);
        }
    });
    if (e.length) this.showErrors(e);
    return e.length === 0;
};
