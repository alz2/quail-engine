var req= require('request');
const jsdom = require("jsdom");
let async = require('async');
var yahooJp= require('yahoo-jp');

const { JSDOM } = jsdom;
var translate = require('@google-cloud/translate');
var translateClient = translate({
    projectId: 'hackillinois-196207',
    keyFilename: 'keyfile.json'
});
var Scraper = require ('images-scraper')
    , google = new Scraper.Google()
    , yahoo = new Scraper.Yahoo();

const primary_engine_langs = {
    google: "en",
    baidu: "zh-CN",
    yahoo: "ja",
    naver: "ko",
    yandax: "ru"
};

const quail_engines = ["google", "baidu", "yahoo"];

function push_results(acculm, engine, results){
    acculm.push({
        engine: results
    })
}

var query_lang; 

module.exports = function(app) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', (req, res) => {
        res.render('index.ejs'); // load the index.ejs file
    });

    app.post('/query', (req, res) => {
        var all_results = [];
        let query = req.body.query;
        let lang = translateClient.detect(query, (err, res_lang) => {
            if (!err){
                query_lang = res_lang.language;
                //search_engine(query, "google", res_lang, (results) => {
                //    all_results.push({
                //        "google": results
                //    });
                //    search_engine(query, "baidu", res_lang, (results) => {
                //        all_results.push({
                //            "baidu": results
                //        });
                //        search_engine(query, "yahoo", res_lang, (results) => {
                //            all_results.push({
                //                "yahoo": results
                //            });
                //            search_engine(query, "yandax", res_lang, (results) => {
                //                all_results.push({
                //                    "yandax": results
                //                });
                //                translate_to_query_lang(all_results, (results) => {
                //                    google.list({
                //                        keyword: query,
                //                        num: 5,
                //                    }).then(function (images_g) {
                //                        // push google images
                //                        google_images = [];
                //                        for (var i = 0; i < images_g.length; i++) {
                //                            google_images.push(images_g[i]["url"]);
                //                        }
                //                        results.push({
                //                            "google_images": google_images
                //                        });

                //                        yahoo.list({
                //                            keyword: query,
                //                            num: 5,
                //                        }).then(function (images_y) {
                //                            yahoo_images = [];
                //                            for (var i = 0; i < images_y.length; i++) {
                //                                yahoo_images.push(images_y[i]["url"]);
                //                            }
                //                            results.push({
                //                                "yahoo_images": yahoo_images
                //                            });
                //                            // DONE
                //                            res.send(results);
                //                        }).catch(function (err) {
                //                            console.log('err',err);
                //                        });
                //                    }).catch(function(err) {
                //                        console.log('err', err);
                //                    });
                //                });
                //            });
                //        })
                //    });
                //});
                async.map(quail_engines, function(engine, cb) {
                    search_engine(query, engine, res_lang, (results) => {
                        all_results.push({
                            [engine]: results
                        });
                        cb();
                    });
                }, function(err, results) {
                    // get immages
                    translate_to_query_lang(all_results, (results) => {
                        google.list({
                            keyword: query,
                            num: 5,
                        }).then(function (images_g) {
                            // push google images
                            google_images = [];
                            for (var i = 0; i < images_g.length; i++) {
                                google_images.push(images_g[i]["url"]);
                            }
                            results.push({
                                "google_images": google_images
                            });

                            yahoo.list({
                                keyword: query,
                                num: 5,
                            }).then(function (images_y) {
                                yahoo_images = [];
                                for (var i = 0; i < images_y.length; i++) {
                                    yahoo_images.push(images_y[i]["url"]);
                                }
                                results.push({
                                    "yahoo_images": yahoo_images
                                });
                                // DONE
                                res.send(results);
                            }).catch(function (err) {
                                console.log('err',err);
                            });
                        }).catch(function(err) {
                            console.log('err', err);
                        });
                    });
                });

            }
        });
    });

    app.get('/query', (req, res) => {
        res.redirect('/');
    });
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
    } else if (engine == "yandax") {
        yandax_query(query, cb);
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
        translate_to_query_lang(results, (res) => {
            return cb(res);
        });
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
            translate_to_query_lang(results, (res) => {
                return cb(res);
            });
        });
    });
}

function yahoo_query(query, cb) {
    let req_url = 'https://search.yahoo.co.jp/search;?p='+query;
    //JSDOM.fromURL(req_url).then( dom => {
    //    elements = Array.from( dom.window.document.querySelectorAll('h3') );
    //    results = []
    //    elements.forEach((item) => {
    //        let html_str = item.innerHTML;
    //        console.log(html_str.trim());
    //        let href = html_str.substring(html_str.indexOf('href=') + 6, html_str.indexOf('"onmousedown'));
    //        results.push({
    //            title: item.textContent.trim(), 
    //            url: href
    //        });
    //    });
    //    return cb(results);
    //});
    yahooJp.fetchAll({ p: query }, {}).then(function(items){
        var results = [];
        for (let i = 0; i < items.length; i++) {
            results.push({
                title: items[i]["title"],
                url: items[i]["url"]
            });
        }
        translate_to_query_lang(results, (res) => {
            return cb(res);
        });
    });
}

function yandax_query(query, cb) {
    let req_url = 'https://www.yandex.com/search/?text='+query;
    //const dom = new JSDOM(``, {
    //    url: req_url,
    //    contentType: "text/html",
    //    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36",
    //});

    JSDOM.fromURL(req_url, { userAgent:"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36" }).then( dom => {
        elements = Array.from( dom.window.document.querySelectorAll('h2') );
        var results = [];
        elements.forEach((item) => {
            let html_str = item.innerHTML;
            let href = html_str.substring(html_str.indexOf('href=') + 6, html_str.indexOf('" data-'));
            results.push({
                title: item.textContent.trim(), 
                url: href
            });
        });
        return cb(results);
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

function translate_to_query_lang(results, cb){
    let titles = "";
    for (let i = 0; i < results.length; i++) {
        titles += results[i].title + '^';
    }

    translateClient.translate(titles, query_lang, function(err, translation) {
        if (!err) {
            let new_titles = translation.split('^');
            for (let i = 0; i < results.length; i++) {
                results[i].title = new_titles[i];
            }
            return cb(results);
        } 
    }); 
}
