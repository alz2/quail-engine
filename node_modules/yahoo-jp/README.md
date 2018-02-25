# node-yahoo-jp [![NPM version][npm-image]][npm] [![Build Status][travis-image]][travis] [![Coverage Status][coveralls-image]][coveralls]

> Scrape the http://search.yahoo.co.jp/search

## Installation

```bash
$ npm install yahoo-jp --save
```

# API

## yahooJp.fetchAll(queries,options) -> Promise(items)

`http://search.yahoo.co.jp/search`に`queries`を送信し、返された html にある検索結果中のURL,題名、本文を取得し、配列で返します。

```js
var yahooJp= require('yahoo-jp');

var queries= {
  p: 'UE4.8.3',
};
var options= {};

yahooJp.fetchAll(queries,options)
.then(function(items){
  console.log(items);
});
// [
//   {
//     "url": "https://answers.unrealengine.com/questions/218432/476-test-project-stuck-on-splash-screen-on-ios-83.html",
//     "title": "4.7.6 - test project stuck on splash screen on iOS 8.3 - UE4 ...",
//     "body": "2015年4月27日 ... Hello - while using 4.7.6, when I build a test project (or the Blackjack or Tappy \nChicken sample projects) for iOS and deploy the IPA to my iPhone 6 (running iOS \n8.3) the app hangs on the splash screen. When using 4.5.1, ..."
//   },
//   {... more 9 items}
// ]
```

`queries`はそのまま検索のGETパラメータとして使用するので、検索ツールの引数を使用することで、時間で絞込を行うことも可能です。

```js
var yahooJp= require('yahoo-jp');

var queries= {
  p: 'UE4.8.3',
  vd: 'd',// 24時間以内
};
var options= {};

yahooJp.fetchAll(queries,options)
.then(function(items){
  console.log(items);
});
// [
//   {
//     "url": "https://ja.wikipedia.org/wiki/3DCG%E3%82%BD%E3%83%95%E3%83%88%E3%82%A6%E3%82%A7%E3%82%A2",
//     "title": "3DCGソフトウェア - Wikipedia",
//     "body": "8.2 乗り物アニメーション; 8.3 群集シミュレーション・人工知能(AI)シミュレーション; 8.4 \nクロスシミュレーション; 8.5 破壊シミュレーション; 8.6 シミュレーション及びエフェクト. 8.6\n.1 ボリュームエフェクト; 8.6.2 メッシュ化; 8.6.3 海洋シミュレーション; 8.6.4 その他 ..."
//   },
//   {... more 9 items}
// ]
```

### options

* `limit` 取得するページ数…デフォルト `1`

  limitに応じてページリクエストの`pstart`と`b`は自動で生成します。

* `concurrency` 同時リクエスト数…デフォルト `1`
  
  並列でページ取得を試みます。

License
---
[MIT][License]

[License]: http://59naga.mit-license.org/

[sauce-image]: http://soysauce.berabou.me/u/59798/yahoo-jp.svg
[sauce]: https://saucelabs.com/u/59798
[npm-image]:https://img.shields.io/npm/v/yahoo-jp.svg?style=flat-square
[npm]: https://npmjs.org/package/yahoo-jp
[travis-image]: http://img.shields.io/travis/59naga/yahoo-jp.svg?style=flat-square
[travis]: https://travis-ci.org/59naga/node-yahoo-jp
[coveralls-image]: http://img.shields.io/coveralls/59naga/node-yahoo-jp.svg?style=flat-square
[coveralls]: https://coveralls.io/r/59naga/node-yahoo-jp?branch=master
