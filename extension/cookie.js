
/*
var cookie = {
    name: "",
    value: "",
    domain: "",
    domainOrigin: ""
};
*/

var parseHeader = function(header) {
    let cookies = [];
    let p = header.split(';')
    p.forEach(function(v){
        let nameValue = v.split('=');
        cookies.push({
            name: nameValue[0].trim(),
            value: nameValue[1].trim()
        });
    })
    return cookies;
}



