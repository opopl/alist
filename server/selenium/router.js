
const express = require('express')
const _ = require('lodash')
const { Builder, Browser, By, Key, until } = require('selenium-webdriver');

const pretty = require('pretty')

const path = require('path')
const fs = require('fs')
const axios = require('axios')

axios.defaults.headers = {
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Expires': '0',
};

//@@ _class.routerFactory
class routerFactory {
//@@ new()
  constructor(ref={}){

    Object.assign(this, ref)

    const app = _.get(ref,'app')
    this.app = app
  }

//@@ router()
  router(){
    const self = this

    const router = express.Router()

    const driver = self.app.driver
    const cookies = self.app.cookies

    router.get('/', function (req, res) {
      res.redirect('/search');
    });

    router.get('/page', function (req, res) {
      res.render('index');
    })

    router.get('/search', async (req, res) => {
      res.render('search');
    })


    router.get(/\/css\/(.*)/, async (req, res) => {
      const file = req.params[0]
      const cssFile = path.join(__dirname, 'ui', 'css', file)
      if(fs.existsSync(cssFile)){
        res.sendFile(cssFile)
      }
    })

    router.get(/\/js\/(.*)/, async (req, res) => {
      const file = req.params[0]
      const jsFile = path.join(__dirname, 'ui', 'js', file)
      if(fs.existsSync(jsFile)){
        res.sendFile(jsFile)
      }
    })

    router.get('/goto/search', async (req, res) => {
      await driver.get('http://www.duckduckgo.com');
    })

    router.post('/goto', async (req, res) => {
      const thisHost = req.get('host')
      const thisProto = req.protocol

      const url = req.body.url
      await driver.get(url);

 /*     const opts =  {*/
        //headers: {
          //'Cache-Control': 'no-cache',
          //'Pragma': 'no-cache',
          //'Expires': '0',
        //},
      /*}*/

      axios.get(`${thisProto}://${thisHost}/page/src`).then((data) => {
        const src = data.src
        res.status(200).send({ url, src })
      }).catch((err) => {
        console.log(err.response.status);
      })

    })

    router.get('/goto/fb', async (req, res) => {
      await driver.get('http://m.facebook.com');

      for (let [name, value] of Object.entries(cookies)) {
        await driver.manage().addCookie({ name, value })
      }
    });

    router.post('/page/src', async (req, res) => {
      const xpath = req.body.xpath

      var elems, html = '', ok = true
      try {
        //elem = await driver.wait(until.elementLocated(By.xpath(xpath)), 1000)
        elems = await driver.findElements(By.xpath(xpath))
        ok = ok && elems

        if (elems) {
          for(var elem of elems){
            const eh =  await elem.getAttribute('outerHTML')
            html = html + '\n' + eh
          }
          //console.log(html);
          html = pretty(html)
        }
      }catch(e){
        ok = false
        console.log(e);
      }

      ok = ok && html
      if (ok) {
        return res.send({ src : html })
      }else{
        return res.status(404).send({ msg : 'not found by xpath' })
      }
    })

    router.get('/page/src', async (req, res) => {
      const pageSource = await driver.wait(until.elementLocated(By.css('body')), 1000).getAttribute('innerHTML');
      return res.status(200).send({ src : pageSource })
    })

    return router
  }
}

// Export router
module.exports = { routerFactory }
