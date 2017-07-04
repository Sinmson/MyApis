var request = require('request');
var rp = require('request-promise');
var fs = require('fs');
var express = require('express');
var cors = require('cors');
var cheerio = require('cheerio');




validUrls = {
  validUrls: [],
  add: function(validUrl)
  {
    this.validUrls.push(validUrl);
  }
}

function validateUrl(url)
{
  return new Promise((resolve, reject) => {
     rp({uri: url, resolveWithFullResponse: true})
      .then(function (response) {
          var $ = cheerio.load(response.body);
          var result = {
            url: response.request.host + response.request.path,
            isValid: false,
            statusCode: response.statusCode
          }
          if($(".err").length <= 0 && $("#errorbox").length <= 0 && response.statusCode != 429)
          {
            validUrls.add(response.request.host + response.request.path);
            result.isValid = true;
          }
          else if($(".err").length > 0)
          {
            result.statusCode = 404;
          }
          resolve(result);
      })
      .catch(function (err) {
        if(err.statusCode === 429)
        {
            var result = {
              url: err.response.request.host + err.response.request.path,
              isValid: false,
              statusCode: 429
            }
            resolve(result);
        }
        else
        {
          // console.log("error: ", err);
          reject(err);
        }
      });
    });
}

    //
    // var url = 'https://www.dropbox.com/sh/ulb9rakdmtwiiqd/AACbpEcNrGpaypICS61YcBnEa?dl=0';
    // var url2 = 'https://www.dropbox.com/sh/hkqyt21qq5i4pwx/AABEZQy6SZsxxTawZsSaeqila?dl=0';
    // var url3 = 'https://www.dropbox.com/sh/w73izn0umv5vw44/AACM6TR7onCt5Fe740uEZ7n9a?dl=0';


console.log("---------------------------------------------------------------");
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cors());
app.use(express.static('www', { extensions: ['html'] }));

app.get('/api/validate', (req, res) => {
  console.log("validate",  req.query);
  validateUrl(req.query.url)
    .then(validateedUrl => {
      console.log("validUrl");
      res.set("Content-Type", "application/json");
      res.json(validateedUrl)
    })
    .catch(err => {
      // console.log("error", err);
      // console.log("error.statusCode", err.statusCode);
      console.log("error");
      res.set("Content-Type", "application/json");
      res.json({error: err})
    })
});

app.post("/api/immowelt/search", (req, res) => {
  var url = req.body.url;
  console.log("immowelt/search", url);
  rp({uri: url, resolveWithFullResponse: true})
   .then(function (response) {
     var body = response.body;
     var $ = cheerio.load(body);
     res.set("Content-Type", "application/json");
     var exposesHtml = [];
     let el = {};
     var exposePomises = [];
     for (var i = 0; i < $(".iw_list_content > .js-object.listitem_wrap").length; i++)
     {
       el = $(".iw_list_content > .js-object.listitem_wrap")[i];
       var exposeEl = $(el).find("a[href^='/expose']");
       var exposeUrl = "http://" + response.request.host + $(exposeEl).first().attr("href");
       var titleStr = $(el).find("h2.ellipsis").first().text();

       exposePomises.push( getImmoweltExposeProm(exposeUrl) );
     }

     Promise.all(exposePomises)
     .then(results => {
       res.json(results);
     })
     .catch(err => {
       console.log("error", err);
     })
   })
   .catch(err => {
     console.log("error", err);
     res.set("Content-Type", "application/json");
     res.json({error: err})
   })
});

function getImmoweltExposeProm(url)
{
  return new Promise((resolve, reject) => {
    rp({uri: url, resolveWithFullResponse: true})
     .then(function (response) {
       var body = response.body;
       var $ = cheerio.load(body);
      //  var dateEl = $("p > strong:contains('frei ab')").first();
       var dateEl = $("p:not(.footer-copyright):contains('2017')").first();
       var titleStr = $("title").text();
       var date = new Date().getTime();
      //  if(Date.parse(dateStr))
      //  {
      //     date = Date.parse(dateStr);
      //  }
        var dateStr = $(dateEl).text();
       var dateStrArr = dateStr.match(/(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[012])\.(19|20)\d\d/);

       if(dateStrArr && dateStrArr.length > 0)
       {
         dateStr = dateStrArr[0];
       }
       date = getDate($(dateEl).text());
      //  console.log("dateStr", dateStr, "date", date);
       var result = {
         title: titleStr,
         date,
         dateStr,
         url: "http://" + response.request.host + response.request.path
       }
      //  console.log("result", result);
       resolve(result);
     })
     .catch(err => {
       reject(err);
     })
 });
}

function getDate(dateStr)
{
  dateStrArr = dateStr.match(/(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[012])\.(19|20)\d\d/);
  var date = new Date().getTime();
  if(dateStrArr && dateStrArr.length > 1)
  {
    dateStrRealArr = dateStrArr[0].split('.');
    console.log(dateStrRealArr);
    dateStr = dateStrRealArr[1] + "." + dateStrRealArr[0] + "." + dateStrRealArr[2];
    date = Date.parse(dateStr);
  }
  return date;
}

function getDateStr(date)
{

}


app.get("/api/immowelt/expose", (req, res) => {
  var url = req.query.url;
  console.log("immowelt/expose", url);
  getImmoweltExposeProm(url).
  then(result => {
    res.set("Content-Type", "application/json");
    res.json(result);
  })
  .catch(err => {
      res.set("Content-Type", "application/json");
      res.json({error: err})
  })
});

app.get('/', (req, res) => {
  res.send("index.html");
});

app.get('/immowelt', (req, res) => {
  res.redirect("/pages/immowelt");
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
