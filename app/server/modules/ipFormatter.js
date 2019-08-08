const geoip = require('geoip-country');
function getIP(req){
    let ip = req.headers['x-forwarded-for']
        || req.connection.remoteAddress
        || req.socket.remoteAddress
        || req.connection.socket.remoteAddress;

    if(ip.substr(0,7) === "::ffff:"){
        ip = ip.substr(7);
    }
    if(ip.includes(',')){
        let ipArr = ip.split(', ');
        ip = ipArr[0];
    }
    const geo = geoip.lookup(ip);

    let country_code;
    if(geo !== null){
        country_code = geo.country;
    }
    return [ip, geo];
}
module.exports = getIP;
