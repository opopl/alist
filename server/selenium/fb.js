
//const{ Builder, By, Key, until, xpath } = require("selenium-webdriver");
//const{ Given, When, Then } = require('cucumber');
//const { get } = require("selenium-webdriver/http");
//const driver = new Builder().forBrowser("firefox").build();
//
const express = require('express');
const app = express();

app.get('/', function (req, res) {
	res.send("Welocme to GeeksforGeeks!");
});

const path = require('path')
const fs = require('fs')
const util = require('util')

const readFile = util.promisify(fs.readFile)

const { Builder, Browser, By, Key, until } = require('selenium-webdriver');

const user = process.env.FB_LOGIN
const pass = process.env.FB_PASS

async function run() {
	let driver = await new Builder()
			.forBrowser(Browser.FIREFOX)
			.setFirefoxOptions({ 'geo.enabled' : false })
			.build()

  try {
		const file = 'cookies.json'
		const jsonData = await readFile(file,'utf8')
		const data = JSON.parse(jsonData)
		const cookieJoin = data.cookie
		const cookieList = cookieJoin.split(';')

		const cookies = {}
		cookieList.forEach((x) => {
			const [ name, value ] = x.split('=')
			cookies[name] = value
		})
		console.log(cookies);

		//await driver.get('https://m.facebook.com');
		//for (let [name, value] of Object.entries(cookies)) {
			//driver.manage().addCookie({ name, value })
		//}

		app.listen(5000)

    //await driver.findElement(By.name('q')).sendKeys('webdriver', Key.RETURN);
    //await driver.wait(until.titleIs('webdriver - Google Search'), 1000);
		//
    //const username = await driver.findElement(By.xpath("//input[@name='email']"));
    //username.sendKeys(user);

		//const cookies = await driver.manage().getCookies()
		//while(1){}
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
