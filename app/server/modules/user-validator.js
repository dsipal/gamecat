class UserValidator{
    constructor(user, onFail, onComplete){
        this.user = user;
        this.onFail = onFail;
        this.onComplete = onComplete;
        this.errs = [];

        this.validateUsername = function(){
            if (!RegExp(`^(?!.*__.*)(?!.*\\.\\..*)[a-z0-9_.]+$`).test(this.user.username)) {
                this.errs.push('invalid-username');
                return this;
            } else {
                return this;
            }
        };

        this.validateEmail = function(){
            let emailRegex  = RegExp(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

            if(!emailRegex.test(this.user.email)){
                this.errs.push('invalid-email');
                return this;
            } else {
                return this;
            }
        };

        this.validatePass = function(){
            let passRegex = new RegExp(`\\S*(\\S*([a-zA-Z]\\S*[0-9])|([0-9]\\S*[a-zA-Z]))\\S*`);
            if(!(passRegex.test(this.user.password)) && this.user.password.length < 6){
                this.errs.push('invalid-password');
            } else {
                if(this.user.password !== this.user.passwordV){
                    this.errs.push('password-not-verified')
                } else {
                    return this;
                }
            }
        };

        this.validateRef = function(){
            console.log(this.user.ref_by);
            console.log(typeof (this.user.ref_by));
            if(this.user.ref_by === ""){
                console.log('no ref!');
                this.user.ref_by = null;
                return this;
            } else {
                if(!RegExp(`^(?!.*__.*)(?!.*\\.\\..*)[a-z0-9_.]+$`).test(this.user.ref_by)){
                    this.errs.push('invalid-referral');
                } else {
                    return this;
                }
            }
        };

        this.validateTerms = function(){
            if(!this.user.terms_conditions){
                this.errs.push('terms-not-accepted');
            }
        };

        this.validate = function(){
            this.validateUsername()
                .validatePass()
                .validateEmail()
                .validateRef()
                .validateTerms();

            if(this.errs.length > 0){
                this.onFail(this.errs)
            } else {
                this.onComplete(this.user);
            }
        };
    }
}

module.exports = UserValidator;
