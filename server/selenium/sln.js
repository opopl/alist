#!/usr/bin/env node

//const{ Builder, By, Key, until, xpath } = require("selenium-webdriver");
//const{ Given, When, Then } = require('cucumber');
//const { get } = require("selenium-webdriver/http");
//const driver = new Builder().forBrowser("firefox").build();
//
const express = require('express');

const bodyParser = require('body-parser')
const compression = require('compression')
const cors = require('cors')
const helmet = require('helmet')
const logger = require('morgan')

const fileUpload = require('express-fileupload')

const _ = require('lodash')
const path = require('path')
const fs = require('fs')
const util = require('util')
const yaml = require('js-yaml')

const cons = require('consolidate');
const nunjucks = require('nunjucks');

const readFile = util.promisify(fs.readFile)

const { Builder, Browser, By, Key, until } = require('selenium-webdriver');
const firefox = require("selenium-webdriver/firefox");

const user = process.env.FB_LOGIN
const pass = process.env.FB_PASS

const { routerFactory } = require('./sln_router.js')


let cookies = {}
let originalWindow

class Scraper {
  constructor(ref={}){
    Object.assign(this, ref)
  }

//@@ initSrv
  initSrv(){
    const self = this

    const srv = express();

    srv.use(cors())
    srv.use(helmet())
    srv.use(compression())
    srv.use(bodyParser.urlencoded({ extended: false }))
    srv.use(bodyParser.json())
    srv.use(fileUpload())
    srv.use(logger('dev'))
    
    const viewsDir = path.resolve(__dirname, '..', 'views')
    cons.requires.nunjucks = nunjucks.configure(viewsDir, {
      autoescape: true,
      express   : srv
    })
    
    // view engine setup
    srv.engine('html', cons.nunjucks)
    srv.set('views', viewsDir)
    srv.set('view engine', 'html')

    srv.use('/', new routerFactory({ app: self }).router())

    self.srv = srv

    const PORT = 5000
    srv.listen(PORT, function() {
      console.log(`Server is running on: ${PORT}`)
    })

    return self
  }

//@@ initDrv
  async initDrv() {
    const self = this

    const preferences = _.get(self,'cnf.driver.firefox.preferences',{})
    const extensions  = _.get(self,'cnf.driver.firefox.extensions',[])
    const extDir = path.join(process.env.HOME, 'data', 'firefox', 'extensions')

    const options = new firefox.Options()

    for (let [key, value] of Object.entries(preferences)) {
      options.setPreference(key, value)
    }

    for(let extension of extensions){
      const extPath = path.join(extDir, extension)
      if(!fs.existsSync(extPath)){ continue  }

      try { 
        options.addExtensions(extPath)
        console.log(`[initDrv.OK] Loaded extension: ${extension}`)
      } catch(e) {
        console.log(`[initDrv.FAIL] Error loading extension: ${extension}`)
        console.error(e)
      }
    }

    self.driver = await new Builder()
        .forBrowser(Browser.FIREFOX)
        .setFirefoxOptions(options)
        .build()

    return self
  }

//@@ initYaml
  initYaml(){
    const self = this

    const yFile = path.join(__dirname, 'fb.yaml')

    const yFileEx = fs.existsSync(yFile)
    const cnf = yFileEx ? yaml.load(fs.readFileSync(yFile)) : {}
    self.cnf = cnf

    return self
  }

//@@ initCookies
  async initCookies() {
    const self = this

    const file = 'cookies.json'
    const jsonData = await readFile(file,'utf8')
    const data = JSON.parse(jsonData)
    const cookieJoin = data.cookie
    const cookieList = cookieJoin.split(';')
    
    self.cookies = {}
    cookieList.forEach((x) => {
      const [ name, value ] = x.split('=')
      self.cookies[name] = value
    })

    return self
  }

//@@ run
  async run() {
    const self = this

    self.initYaml()

    await self.initCookies()
    await self.initDrv()

    self.initSrv()

    const driver = self.driver
  
    try {
      await driver.get('http://localhost:5000');
      originalWindow = await driver.getWindowHandle()
      await driver.switchTo().newWindow('tab');
    } finally {
      //await driver.quit();
    }
  }

}

new Scraper().run()

//Given ('I visit Facebook', async function() {
//}); 

/*When ('I see log in form', async function(){*/
    //const condition = until.elementLocated(By.name('username'));
    ////await driver.wait(condition,5000);
//});

//Then ('I log in with {string} username and {string} password', async function(user, pass){
    //const username = await driver.findElement(By.xpath("//input[@name='email']"));
    //username.sendKeys(user);
    //const password = await driver.findElement(By.xpath("//input[@name='pass']"));
    //password.sendKeys(pass, Key.ENTER);
/*});*/

