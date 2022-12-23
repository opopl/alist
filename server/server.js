// Import dependencies
const express = require('express')
const bodyParser = require('body-parser')
const compression = require('compression')
const cors = require('cors')
const helmet = require('helmet')
const logger = require('morgan')

const fileUpload = require('express-fileupload')

const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const _ = require('lodash')

const cons = require('consolidate');
const nunjucks = require('nunjucks');

const { c_AuthClass } = require('./controllers/c_AuthClass.js')
const { c_ImgClass }  = require('./controllers/c_ImgClass.js')
const { c_PrjClass }  = require('./controllers/c_PrjClass.js')

const argv = require('yargs').argv;

/*const{ Builder, By, Key, until, xpath } = require("selenium-webdriver");*/
//const{ Given, When, Then } = require('cucumber');
//const { get } = require("selenium-webdriver/http");
/*const firefoxDriver = new Builder().forBrowser("firefox").build();*/

// Import routes
const { routerFactory } = require('./route')

// Set default port for express app
const PORT = process.env.PORT || 4001

class Alist {
//@@ new
  constructor(){}

//@@ loadYaml
  loadYaml(){
    const self = this

    const yFile = path.join(__dirname, 'cnf.yaml')

    const yFileEx = fs.existsSync(yFile)
    self.cnf = yFileEx ? yaml.load(fs.readFileSync(yFile)) : {}

    return self
  }

//@@ initClasses
  initClasses(){
    const self = this

    const optsAuth = _.get(self,'cnf.auth',{})
    const optsImg  = _.get(self,'cnf.img',{})
    const optsPrj  = _.get(self,'cnf.prj.controller',{})

    self.c_Auth = new c_AuthClass(optsAuth)
    self.c_Img  = new c_ImgClass(optsImg)
    self.c_Prj  = new c_PrjClass(optsPrj)
    //self.firefoxDriver  = firefoxDriver 

    return self
  }

//@@ run
  run(){
    const self = this

    self
        .loadYaml()
        .initClasses()

    // Create express server
    const srv = express()
    self.srv = srv

    // add nunjucks to requires so filters can be
    // added and the same instance will be used inside the render method

    const viewsDir = path.resolve(__dirname, 'views')
    cons.requires.nunjucks = nunjucks.configure(viewsDir, {
      autoescape: true,
      express   : srv
    });

    // view engine setup
    srv.engine('html', cons.nunjucks);
    srv.set('views', path.resolve(__dirname, 'views'));
    srv.set('view engine', 'html');

    console.log(path.resolve(__dirname, 'views'));

    // srvly middleware
    // Note: Keep this at the top, above routes
    srv.use(cors())
    srv.use(helmet())
    srv.use(compression())
    srv.use(bodyParser.urlencoded({ extended: false }))
    srv.use(bodyParser.json())
    srv.use(fileUpload())
    srv.use(logger('dev'))

    const cnf = self.cnf || {}

    srv.use('/', new routerFactory({ app: self }).router())

    // Implement 500 error route
    srv.use(function (err, req, res, next) {
      console.error(err.stack)
      res.status(500).send('Something is broken.')
    })

    // Implement 404 error route
    srv.use(function (req, res, next) {
      res.status(404).send('Sorry we could not find that.')
    })

    // Start express server
    srv.listen(PORT, function() {
      console.log(`Server is running on: ${PORT}`)
    })

  }

}

new Alist().run()
