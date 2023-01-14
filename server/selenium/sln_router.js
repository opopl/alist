
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

//@r GET /
    router.get('/', function (req, res) {
      res.redirect('/search');
    })

//@r GET /search
    router.get('/search', async (req, res) => {
      res.render('selenium/search');
    })

    router.get('/page', function (req, res) {
      res.render('selenium/index');
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

//@r POST /goto
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

      const urlSrc = `${thisProto}://${thisHost}/page/src/html`
      axios.get(`${urlSrc}`).then((response) => {
        const data = response.data

        const src = data

        res.status(200).send({ url, src })
      }).catch((err) => {
        console.log(err.response.status);
      })

    })

//@r GET /goto/fb
    router.get('/goto/fb', async (req, res) => {
      await driver.get('http://m.facebook.com');

      for (let [name, value] of Object.entries(cookies)) {
        await driver.manage().addCookie({ name, value })
      }

      return res.status(200)
    });

//@r POST /page/src/html
    router.post('/page/src/html', async (req, res) => {
      const xpath = req.body.xpath
      const selector = req.body.selector

      var elems, html = '', ok = true
      try {
        //elem = await driver.wait(until.elementLocated(By.xpath(xpath)), 1000)
        if (xpath) {
          elems = await driver.findElements(By.xpath(xpath))
        }else if(selector){
          elems = await driver.findElements(By.css(selector))
        }
        ok = ok && elems

        if (elems) {
          for(var elem of elems){
            const eh =  await elem.getAttribute('outerHTML')
            html = html + '\n' + eh
          }
          html = pretty(html)
        }
      }catch(e){
        ok = false
        console.log(e);
      }

      ok = ok && html
      if (ok) {
        return res.send(html)
      }else{
        return res.status(404).send({ msg : 'not found by xpath' })
      }
    })

//@r GET /page/src/html
    router.get('/page/src/html', async (req, res) => {
      const pageSource = await driver.wait(until.elementLocated(By.css('html')), 1000).getAttribute('outerHTML')
      return res.status(200).send(pageSource)
    })

    return router
  }
}

// Export router
module.exports = { routerFactory }
