
//const{ Builder, By, Key, until, xpath } = require("selenium-webdriver");
//const{ Given, When, Then } = require('cucumber');
//const { get } = require("selenium-webdriver/http");
//const driver = new Builder().forBrowser("firefox").build();
//
const express = require('express');
const app = express();

const path = require('path')
const fs = require('fs')
const util = require('util')

const cons = require('consolidate');
const nunjucks = require('nunjucks');

const readFile = util.promisify(fs.readFile)

const { Builder, Browser, By, Key, until } = require('selenium-webdriver');

const user = process.env.FB_LOGIN
const pass = process.env.FB_PASS

const firefox = require("selenium-webdriver/firefox");

let driver, cookies = {}

const options = new firefox.Options()
  .setPreference('geo.enabled', false)
  .setPreference('geo.provider.network.url', 'data:application/json,{ "location" : { "latitude" : 43.7001100, "longitude" : -79.4163000, "accuracy" : 10 }}')
  .setPreference('geo.provider.use_geoclue', false)

const viewsDir = path.resolve(__dirname, 'views')
cons.requires.nunjucks = nunjucks.configure(viewsDir, {
  autoescape: true,
  express   : app
});

// view engine setup
app.engine('html', cons.nunjucks);
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'html');

app.get('/', function (req, res) {
  res.send("Welcome to GeeksforGeeks!");
});

app.get('/search', async (req, res) => {
    await driver.get('http://www.duckduckgo.com');
});

app.get('/fb', async (req, res) => {
    await driver.get('http://m.facebook.com');

    for (let [name, value] of Object.entries(cookies)) {
      await driver.manage().addCookie({ name, value })
    }
});

app.get('/src', async (req, res) => {
  const pageSource = await driver.wait(until.elementLocated(By.css('body')), 1000).getAttribute('innerHTML');
  return res.send(pageSource)
})

async function initCookies() {
    const file = 'cookies.json'
    const jsonData = await readFile(file,'utf8')
    const data = JSON.parse(jsonData)
    const cookieJoin = data.cookie
    const cookieList = cookieJoin.split(';')
    
    cookieList.forEach((x) => {
      const [ name, value ] = x.split('=')
      cookies[name] = value
    })
}

async function run() {
  await initCookies()

  driver = await new Builder()
      .forBrowser(Browser.FIREFOX)
      .setFirefoxOptions(options)
      .build()

  try {
    app.listen(5000)

    await driver.get('http://localhost:5000');
    await driver.switchTo().newWindow('tab');
  } finally {
    //await driver.quit();
  }
}

run()

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
