module.exports.ensureAuthenticated = function(){
    //TODO add check to see if user has verified email && add correct error response
    return function(req, res, next){
        if(!req.isAuthenticated || !req.isAuthenticated()){
            console.log('Failed login attempt');
            //res.status(401).send('not-authenticated');
            res.redirect('/login');
        } else if(req.user.rank === 'new'){
            console.log('Non-verified email login attempt');
            //res.status(401).send('not-verified');
            res.redirect('/login/unverified');
        } else if(req.user.rank === 'social-new') {
            console.log('Unfinished social registration login attempt');
            res.redirect('/login/finalize');
        }
        else {
            next();
        }
    }
};
