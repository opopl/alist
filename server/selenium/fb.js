
const{ Builder, By, Key, until, xpath } = require("selenium-webdriver");
const{ Given, When, Then } = require('cucumber');
const { get } = require("selenium-webdriver/http");

const driver = new Builder().forBrowser("firefox").build();

Given ('I visit Facebook', async function() {
    await driver.get("https://www.facebook.com/");
}); 

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
