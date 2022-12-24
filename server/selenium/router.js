
const express = require('express')
const _ = require('lodash')
const { Builder, Browser, By, Key, until } = require('selenium-webdriver');

const path = require('path')
const fs = require('fs')

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
      console.log(req.body);

      const url = req.body.url
      await driver.get(url);

      return res.status(200)
    })

    router.get('/goto/fb', async (req, res) => {
      await driver.get('http://m.facebook.com');

      for (let [name, value] of Object.entries(cookies)) {
        await driver.manage().addCookie({ name, value })
      }
    });

    router.get('/page/src', async (req, res) => {
      const pageSource = await driver.wait(until.elementLocated(By.css('body')), 1000).getAttribute('innerHTML');
      return res.send(pageSource)
    })

    return router
  }
}

// Export router
module.exports = { routerFactory }
