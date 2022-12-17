
const express = require('express')

const _ = require('lodash')

const { c_AuthClass } = require('./controllers/c_AuthClass.js')
const { c_ImgClass }  = require('./controllers/c_ImgClass.js')
const { c_PrjClass }  = require('./controllers/c_PrjClass.js')

const c_Auth = new c_AuthClass()
const c_Img = new c_ImgClass()
const c_Prj = new c_PrjClass()

class A {
  constructor(ref={}){
    console.log({ ref });

    Object.assign(this, ref)
    Object.keys(ref).forEach(function(x){
      console.log(x);
      console.log(_.get(this,x));
    })
  }

  run(){
  }
}

//new A('2').run()
//new A().run()
//new A('2','3').run()
new A({ '2' : '3', 'a' : 'b' }).run()

class routerFactory {
  constructor(){
  }

  router(){
    const router = express.Router()

    router.get('/', async (req, res) => {
       res.redirect('/prj/sec/html?sec=24_11_2022')
    })

    router.get('/auth/count',  c_Auth.jsonCount())
    router.get('/auth/all',    c_Auth.jsonAll())
    router.get('/auth/update', c_Auth.jsonUpdate())
    //router.put('/auth/delete', c_Auth.jsonDelete())

    //@@ Images
    router.get('/img/count'     , c_Img.jsonCount())
    router.get('/img/raw/:inum' , c_Img.rawImg())

    router.post('/prj/act', c_Prj.jsonAct())

    //@@ Config
    router.get('/prj/config/get', c_Prj.jsonConfig())

    //@@ Target
    router.get('/prj/target/data', c_Prj.jsonTargetData())
    router.get('/prj/target/html', c_Prj.htmlTargetView())

    //@@ Sec
    router.get('/prj/sec/count' , c_Prj.jsonSecCount())
    router.get('/prj/sec/src'   , c_Prj.jsonSecSrc())
    router.get('/prj/sec/data'  , c_Prj.jsonSecData())

    router.get('/prj/sec/html' , c_Prj.htmlSecView())
    router.get('/prj/sec/pdf'  , c_Prj.pdfSecView())

    router.get('/prj/sec/saved', c_Prj.htmlSecSaved())
    router.post('/prj/sec/list', c_Prj.jsonSecList())

    router.get(/^\/prj\/sec\/asset\/(.*)$/, c_Prj.secAsset())

    //@@ Authors
    router.get('/prj/auth/html', c_Prj.htmlAuthView())

    //@@ Builds
    router.get('/prj/bld/data', c_Prj.jsonBldData())

    //@@ Assets
    router.get(/^\/prj\/assets\/js\/(.*)$/, c_Prj.jsFile())

    router.get(/^\/prj\/assets\/css\/ctl\/(.*)$/, c_Prj.cssFileCtl())
    router.get(/^\/prj\/assets\/css\/main\/(.*)$/, c_Prj.cssFile())

    return router
  }
}

// Export router
module.exports = { routerFactory }
