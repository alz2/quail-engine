var req= require('request');
const jsdom = require("jsdom");
let async = require('async');

const { JSDOM } = jsdom;
var translate = require('@google-cloud/translate');
var translateClient = translate({
    projectId: 'hackillinois-196207',
    keyFilename: 'keyfile.json'
});

const primary_engine_langs = {
    google: "en",
    baidu: "zh-CN",
    yahoo: "ja",
    naver: "ko"
};

module.exports = function(app) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', (req, res) => {
        res.render('index.ejs'); // load the index.ejs file
    });

    app.post('/query', (req, res) => {
        all_results = []
        let query = req.body.query;
        let lang = translateClient.detect(query, (err, res_lang) => {
            if (!err){
                search_engine(query, "google", res_lang, (results) => {
                    console.log("finished google");
                    all_results.push({
                        engine: "google",
                        results: results
                    });
                    search_engine(query, "baidu", res_lang, (results) => {
                        all_results.push({
                            engine: "baidu",
                            results: results
                        });
                        search_engine(query, "yahoo", res_lang, (results) => {
                            all_results.push({
                                engine: "yahoo",
                                results: results
                            });
                            res.send(all_results);
                        })
                    });
                });
            }
        });
    });
    //res.send(results);
}


function search_engine(query, engine, res_lang, cb){
    let lang = res_lang.language;
    let conf = res_lang.confidence;

    console.log("search " + engine + " with language " + lang);
    // confident that not primary language
    if (conf > .50 && lang != primary_engine_langs[engine]){
        console.log("translating to " + primary_engine_langs[engine]);
        translate_to_primary(query, engine, (res) => {
            console.log(res);
            query_engine(res, engine, cb);
        });
    } else {
        console.log(query);
        query_engine(query, engine, cb);
    }
}

function query_engine(query, engine, cb){
    if (engine == "google"){
        google_query(query, cb);
    } else if (engine == "baidu"){
        baidu_query(query, cb);
    } else if (engine == "yahoo") {
        yahoo_query(query, cb);
    }
}

function google_query(query, cb){
    let req_url = 'https://www.google.com/search?q='+query;
    // execute request
    JSDOM.fromURL(req_url).then( dom => {
        elements = Array.from( dom.window.document.querySelectorAll('h3') );
        results = []
        elements.forEach((item) => {
            let html_str = item.innerHTML;
            let href = html_str.substring(html_str.indexOf('q=') + 2, html_str.indexOf('&'));
            results.push({
                title: item.textContent, 
                url: href
            });
        });
        cb(results)
    });
}

function baidu_query(query, cb){
    let req_url = 'http://www.baidu.com/s?wd='+query;
    JSDOM.fromURL(req_url).then( dom => {
        elements = Array.from( dom.window.document.querySelectorAll('h3') );
        results = []
        before_urls = [] 
        titles = []
        elements.forEach((item) => {
            let html_str = item.innerHTML;
            let href = html_str.substring(html_str.indexOf('href=') + 6, html_str.indexOf('" target='));
            titles.push(item.textContent.trim()); 
            before_urls.push(href);
        });
        redirects(before_urls, (err, urls) => {
            for (let i = 0; i < urls.length; i++) {
                console.log(urls[i]);
                results.push({
                    title: titles[i],
                    url: urls[i]
                });
            }
            cb(results);
        });
    });
}

function yahoo_query(query, cb) {
    let req_url = 'https://search.yahoo.co.jp/search;?p='+query;
    JSDOM.fromURL(req_url).then( dom => {
        elements = Array.from( dom.window.document.querySelectorAll('h3') );
        results = []
        elements.forEach((item) => {
            let html_str = item.innerHTML;
            console.log(html_str.trim());
            let href = html_str.substring(html_str.indexOf('href=') + 6, html_str.indexOf('"onmousedown'));
            results.push({
                title: item.textContent.trim(), 
                url: href
            });
        });
        cb(results)
    });
}

function translate_to_primary(query, engine, cb){
    translateClient.translate(query, primary_engine_langs[engine], function(err, translation) {
        if (!err) {
            cb(translation);
        } else {
            console.log("TRANSLATION ERROR");
        }
    }); 
}


function getRedirect(url, cb) {
    req({
        url: url,
        followRedirect: false,
        method: 'HEAD',
        headers: {
            'User-Agent':  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Safari/604.1.38'
        }
    }, (err, res, body) => {
        if(err)
            return cb(err);

        cb(null, res.headers.location);
    });
}

function redirects(urls, cb) {
    async.map(urls, getRedirect, cb);
}
