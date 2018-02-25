# Dependencies
Promise= require 'bluebird'
throat= require 'throat'

requestAsync= Promise.promisify(require 'request')
cheerio= require 'cheerio'
querystring= require 'querystring'

# Environment
api= 'http://search.yahoo.co.jp/search'

# Public
class YahooJp
  fetchAll: (queries={},options={})->
    items= []

    options.limit?= 1
    options.concurrency?= 1

    Promise.all [0...options.limit].map throat options.concurrency,(i)=>
      @fetch queries,i

    .then (pages)->
      items.push item for item in page for page in pages
      items

  fetch: (queries={},offset=0,step=10)->
    queries.pstart?= 1
    queries.b= step * offset + 1

    uri= api+'?'+querystring.stringify queries

    requestAsync uri
    .spread (response)->
      $= cheerio.load response.body

      return [] if $('#noRes').length
      for node,index in $ '#web ol li'
        li= $ node

        url= (li.find 'a').eq(0).attr 'href'
        title= (li.find 'a').eq(0).text()
        body= (li.find 'div').eq(0).text()
        
        {url,title,body}

module.exports= new YahooJp
