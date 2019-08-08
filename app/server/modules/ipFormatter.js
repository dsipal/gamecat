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
    console.log(req.header['CF-Connecting-IP']);
    console.log(JSON.stringify(req.headers));
    let country_code = req.header['CF-IPCountry'];
    console.log(country_code);
    return [ip, country_code];
}
module.exports = getIP;
