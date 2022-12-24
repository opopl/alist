
const express = require('express')
const _ = require('lodash')
const { Builder, Browser, By, Key, until } = require('selenium-webdriver');

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
      res.redirect('/goto/search');
    });

    router.get('/page', function (req, res) {
      res.render('index');
    });
    
    router.get('/goto/search', async (req, res) => {
      await driver.get('http://www.duckduckgo.com');
      res.render('search');
    });
    
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
