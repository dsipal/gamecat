module.exports.ensureAuthenticated = function(){
    //TODO add check to see if user has verified email && add correct error response
    return function(req, res, next){
        if(!req.isAuthenticated || !req.isAuthenticated()){
            res.status(401).send('not-authenticated');
        } else if(req.user.rank === 'new'){
            res.status(401).send('not-verified');
        } else {
            next();
        }
    }
};
