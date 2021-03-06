var browser = browser || chrome;

// cache
let cache = {};
let cacheExpireAfter = 900;

function rewriteCookies(req) {
    //console.log("Newrequest from tab " + req.tabId + " " + req.method + " " + req.url);

    // get domain from request
    let domain = getDomain(req.url);
    // DO NOT HANDLE REQUEST FROM OURSELF
    if (domain === "s.khao.io") {
        return
    }

    // get targeted cookies
    let targetedCookies = cookies2switch.get('*');
    let domcookies = cookies2switch.get(domain);
    if (domcookies !== undefined) {
        targetedCookies = targetedCookies.concat(domcookies);
    }

    //console.log("targetedCookies", targetedCookies, "domain", domain);

    for (let header of req.requestHeaders) {
        if (header.name.toLowerCase() === 'cookie') {
            //console.log("OLD headers: ", req.requestHeaders);
            let cookies = parseHeader(header.value);
            cookies.forEach(function (cookie) {
                if (targetedCookies.indexOf(cookie.name.toLowerCase()) !== -1){
                    // get form local cache
                    let newValue = cacheGet(domain + '_' + cookie.name);
                    //console.log("Value form cache: " + newValue);
                    if (newValue !== null) {
                        rebuildRequestHeaders(req.requestHeaders, cookie.name, newValue);
                        if (newValue !== cookie.value) {
                            console.log("NEW cookie for " + domain + "." + cookie.name + " fetched from cache: ", newValue);
                        }
                        return {requestHeaders: req.requestHeaders}
                    }
                    // send cookie & receive a new one
                    axios.post("https://s.khao.io/cookie/switch", {
                        Name: "_ga",
                        Value: cookie.value,
                        Domain: domain
                    }).then(function (response) {
                        if (response.data.Value !== cookie.value) {
                            console.log("NEW cookie for " + domain + "." + cookie.name + " fetched from  switcher: ", response.data.Value);
                        }
                        cacheSet(domain + '_' + cookie.name, response.data.Value);
                        cookie.value = response.data.value;
                        // rebuild header with new value
                        rebuildRequestHeaders(req.requestHeaders, cookie.name, response.data.Value);
                        //console.log("NEW headers: ", req.requestHeaders);
                        return {requestHeaders: req.requestHeaders}
                    }).catch(function (err) {
                        console.log("ERR: " + err);
                        return {requestHeaders: req.requestHeaders}
                    })
                }
            })
        }
    }
}


// parse URL and return hostname
function getDomain(url) {
    let u = new URL(url);
    return u.hostname;
}

// cookie parser
var parseHeader = function (header) {
    let cookies = [];
    let p = header.split(';');
    p.forEach(function (v) {
        let nameValue = v.split('=');
        cookies.push({
            name: nameValue[0].trim(),
            value: nameValue.splice(1).join('=').trim()
        });
    });
    return cookies;
};


// update headers request with new cookie value
function rebuildRequestHeaders(headers, cookieName, cookieValue) {
    let headerCookieValue = "";
    for (let header of headers) {
        if (header.name.toLowerCase() === 'cookie') {
            let cookies = parseHeader(header.value);
            cookies.forEach(function (cookie) {
                if (cookie.name === cookieName) {
                    cookie.value = cookieValue;
                }
                headerCookieValue = headerCookieValue + cookie.name + "=" + cookie.value + ";"
            });
            header.value = headerCookieValue.slice(0, -1);
            return headers;
        }
    }
}

// Gestion du cache de cookies
// Le but est de reduire la latence (et de soulager le serveur ...)
// Ces fonctions peuvent parraitre inutiles avec le cache utilisé
// mais ça nous permet de faire une d'interface qui va faciliter les
// chose si on veut tester d'autres methodes.
//
// le cookie va être représenté sous la forme suivante
// cookie = {
//     value: "blablablabla",
//     expireAt: 1520153586 // timestamp
// }


// get value from cache
function cacheGet(key) {
    let cookie = cache[key];
    if (cookie !== undefined) {
        // remove cookie if expired
        if (cookie.expireAt > Date.now()) {
            delete cache[key];
            return null
        }
        return cookie.value
    }
    return null
}

// set cookie in cache
function cacheSet(key, value) {
    cache[key] = {
        value: value,
        expireAt: Date.now() + cacheExpireAfter
    }
}


// handle request
browser.webRequest.onBeforeSendHeaders.addListener(
    rewriteCookies,
    {urls: ["<all_urls>"]},
    ["blocking", "requestHeaders"]
);

function enableKhao() {
    browser.webRequest.onBeforeSendHeaders.addListener(
        rewriteCookies,
        {urls: ["<all_urls>"]},
        ["blocking", "requestHeaders"]
    );
    browser.browserAction.setIcon({path: "pic/19-on.png"});
}

function disableKaho() {
    browser.webRequest.onBeforeSendHeaders.removeListener(rewriteCookies);
    browser.browserAction.setIcon({path: "pic/19-off.png"});
}

// handle click
browser.browserAction.onClicked.addListener(function () {
    console.log("click click");
    if (browser.webRequest.onBeforeSendHeaders.hasListener(rewriteCookies)) {
        console.log("remove listener");
        disableKaho();
    } else {
        console.log("add listener");
        enableKhao();
    }
});


