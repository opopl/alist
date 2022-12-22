
const express = require('express')

const _ = require('lodash')

const { c_AuthClass } = require('./controllers/c_AuthClass.js')
const { c_ImgClass }  = require('./controllers/c_ImgClass.js')
const { c_PrjClass }  = require('./controllers/c_PrjClass.js')


class A {
  constructor(cnf={}){
    const self = this

    Object.assign(this, cnf)

    Object.keys(cnf).forEach(function(x){
      console.log(_.get(self,x));
    })

    console.log(Object.keys(this));
  }

  run(){
  }
}

//new A('2').run()
//new A().run()
//new A('2','3').run()
//new A({ '2' : 'v1', 'a' : 'v2' }).run()

//@@ _class.routerFactory
class routerFactory {

//@@ new()
  constructor(ref={}){

    Object.assign(this, ref)

    const app = _.get(ref,'app')
    this.app = app

    this.c_Auth = app ? app.c_Auth : new c_AuthClass()
    this.c_Img = app ? app.c_Img : new c_ImgClass()
    this.c_Prj = app ? app.c_Prj : new c_PrjClass()

  }

//@@ router()
  router(){
    const self = this

    const router = express.Router()

    router.get('/', async (req, res) => {
       res.redirect('/prj/sec/html?sec=24_11_2022')
    })

    router.get('/auth/count',  self.c_Auth.jsonCount())
    router.get('/auth/all',    self.c_Auth.jsonAll())
    router.get('/auth/update', self.c_Auth.jsonUpdate())
    //router.put('/auth/delete', c_Auth.jsonDelete())

//@@ Images
    router.get('/img/count'         , self.c_Img.jsonCount())
    router.get('/img/raw/:inum'     , self.c_Img.rawImg())
    router.get('/img/raw/url/:url'  , self.c_Img.rawImgUrl())
    router.get('/img/data/:inum'    , self.c_Img.jsonImgData())
    router.get('/img/data/url/:url' , self.c_Img.jsonImgDataUrl())

    router.post('/prj/act', self.c_Prj.jsonAct())

//@@ Config
    router.get('/prj/config/get', self.c_Prj.jsonConfig())

//@@ Target
    router.get('/prj/target/data', self.c_Prj.jsonTargetData())
    router.get('/prj/target/html', self.c_Prj.htmlTargetView())

//@@ Sec
    router.get('/prj/sec/count' , self.c_Prj.jsonSecCount())
    router.get('/prj/sec/src'   , self.c_Prj.jsonSecSrc())
    router.get('/prj/sec/data'  , self.c_Prj.jsonSecData())
    router.get('/prj/sec/fs/data' , self.c_Prj.jsonSecFsData())

    router.get('/prj/sec/fs/new' , self.c_Prj.jsonSecFsNew())
    router.get('/prj/sec/fs/done' , self.c_Prj.jsonSecFsDone())

    router.get('/prj/sec/html' , self.c_Prj.htmlSecView())
    router.get('/prj/sec/pdf'  , self.c_Prj.pdfSecView())

    router.post('/prj/sec/list', self.c_Prj.jsonSecList())

    router.get('/prj/sec/saved', self.c_Prj.htmlSecSaved())

    router.post('/prj/sec/saved/upload'   , self.c_Prj.uploadSecSaved())

//@@ Sec/Pic
    router.post('/prj/sec/pic/upload/url' , self.c_Prj.uploadSecPicUrl())
    router.post('/prj/sec/pic/data'       , self.c_Prj.jsonSecPicData())

    router.get('/prj/sec/pic/html' , self.c_Prj.htmlSecPicData())
    router.get('/prj/sec/pic/data' , self.c_Prj.jsonSecPicData())

    router.get(/^\/prj\/sec\/asset\/(.*)$/, self.c_Prj.secAsset())

//@@ Authors
    router.get('/prj/auth/html', self.c_Prj.htmlAuthView())

//@@ Builds
    router.get('/prj/bld/data', self.c_Prj.jsonBldData())

//@@ Assets
    router.get(/^\/prj\/assets\/js\/(.*)$/, self.c_Prj.jsFile())

    router.get(/^\/prj\/assets\/css\/ctl\/(.*)$/, self.c_Prj.cssFileCtl())
    router.get(/^\/prj\/assets\/css\/main\/(.*)$/, self.c_Prj.cssFile())

    return router
  }
}

// Export router
module.exports = { routerFactory }
