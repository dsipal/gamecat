function getIP(req){
    let ip = req.header['cf-connecting-ip']
    let country_code = req.header['cf-ipcountry'];
    return [ip, country_code];
}
module.exports = getIP;
