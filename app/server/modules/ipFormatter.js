function getIP(req){
    console.log(JSON.stringify(req.headers));
    let ip = req.header['cf-connecting-ip'];
    let country_code = req.header['cf-ipcountry'];
    console.log(ip);
    console.log(country_code);
    return [ip, country_code];
}
module.exports = getIP;
