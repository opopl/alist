
const express = require('express')

const _ = require('lodash')

const { c_AuthClass } = require('./controllers/c_AuthClass.js')
const { c_ImgClass }  = require('./controllers/c_ImgClass.js')
const { c_PrjClass }  = require('./controllers/c_PrjClass.js')
const { c_LogClass }  = require('./controllers/c_LogClass.js')

//@@ _class.routerFactory
class routerFactory {

//@@ new()
  constructor(ref={}){

    Object.assign(this, ref)

    const app = _.get(ref,'app')
    this.app = app
    const tmplEnv = app.tmplEnv

    this.c_Auth = app ? app.c_Auth : new c_AuthClass({ tmplEnv })
    this.c_Img = app ? app.c_Img : new c_ImgClass({ tmplEnv })
    this.c_Prj = app ? app.c_Prj : new c_PrjClass({ tmplEnv })

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

    router.post('/img/data'         , self.c_Img.jsonImgData())
    router.post('/img/data/all'     , self.c_Img.jsonImgDataAll())

    router.get('/img/tag/list'     , self.c_Img.jsonImgTagList())

    router.get('/img/data/:inum'    , self.c_Img.jsonImgData())
    router.get('/img/data/url/:url' , self.c_Img.jsonImgDataUrl())

    router.post('/img/new'           , self.c_Img.jsonImgNew())
    router.post('/img/delete'        , self.c_Img.jsonImgDelete())
    router.post('/img/data/update'   , self.c_Img.jsonImgDataUpdate())

    router.post('/img/fetch/html'    , self.c_Img.htmlImgFetch())

    router.post('/prj/act', self.c_Prj.jsonAct())
    router.get('/prj/img/search/html', self.c_Prj.htmlImgSearch())

//@@ Config
    router.get('/prj/config/get', self.c_Prj.jsonConfig())
    router.get(/\/prj\/config\/get\/(.*)/, self.c_Prj.jsonConfig())

//@@ Target
    router.get('/prj/target/data', self.c_Prj.jsonTargetData())
    router.get('/prj/target/html', self.c_Prj.htmlTargetView())
    router.get('/prj/target/pdf' , self.c_Prj.pdfTargetView())

//@@ Topics
    router.get('/prj/topics/html' , self.c_Prj.htmlTopics())

//@@ Control
    router.get('/prj/control/html' , self.c_Prj.htmlControl())

//@@ Code
    router.get('/prj/code/tab/:tabId/html' , self.c_Prj.htmlCodeTab())

    router.get('/prj/code/form/:formId/html' , self.c_Prj.htmlCodeForm())
    router.get('/prj/code/menu/:menuId/html' , self.c_Prj.htmlCodeMenu())
    router.get('/prj/code/piece/:piece/html' , self.c_Prj.htmlCodePiece())

//@@ Sec/New

    router.get('/prj/sec/new/html' , self.c_Prj.htmlSecNew())
    router.post('/prj/sec/new'     , self.c_Prj.jsonSecNew())

//@@ Sec/Fs
    router.get('/prj/sec/fs/new' , self.c_Prj.jsonSecFsNew())
    router.get('/prj/sec/fs/done' , self.c_Prj.jsonSecFsDone())

    // list sections in 'new' folder
    router.get('/prj/sec/fs/new/list' , self.c_Prj.jsonSecFsNewList())

    router.post('/prj/sec/fs/load/scrn' , self.c_Prj.jsonSecFsLoadScrn())

//@@ Log
    //router.get('/log' , self.c_Log.jsonLog())

//@@ Sec

    router.get('/prj/sec/count' , self.c_Prj.jsonSecCount())
    router.get('/prj/sec/src'   , self.c_Prj.jsonSecSrc())
    router.get('/prj/sec/fs/data' , self.c_Prj.jsonSecFsData())

    router.get('/prj/sec/data'  , self.c_Prj.jsonSecData())
    router.post('/prj/sec/data' , self.c_Prj.jsonSecData())

    router.get('/prj/sec/html' , self.c_Prj.htmlSecView())
    router.get('/prj/sec/pdf'  , self.c_Prj.pdfSecView())

    router.post('/prj/sec/list', self.c_Prj.jsonSecList())

    router.get('/prj/sec/checklist/html' , self.c_Prj.htmlSecCheckList())

//@@ Sec/Saved
    router.get('/prj/sec/saved/html', self.c_Prj.htmlSecSaved())
    router.get('/prj/sec/saved/info', self.c_Prj.jsonSecSavedInfo())

    router.post('/prj/sec/saved/upload'   , self.c_Prj.uploadSecSaved())
    router.post('/prj/sec/saved/remove'   , self.c_Prj.removeSecSaved())

//@@ Sec/Pic
    router.post('/prj/sec/pic/upload/url' , self.c_Prj.uploadSecPicUrl())
    router.post('/prj/sec/pic/data'       , self.c_Prj.jsonSecPicData())

    router.get('/prj/sec/pic/html' , self.c_Prj.htmlSecPicData())
    router.get('/prj/sec/pic/data' , self.c_Prj.jsonSecPicData())

    router.get(/^\/prj\/sec\/asset\/(.*)$/, self.c_Prj.secAsset())

//@@ Authors
    // html - list of sections for each author
    router.get('/prj/auth/html', self.c_Prj.htmlAuthSecs())

    // json - all authors
    router.get('/prj/auth/all', self.c_Prj.jsonAuthAll())

    // json - all authors, detail
    router.post('/prj/auth/all/detail', self.c_Prj.jsonAuthAllDetail())

    router.get('/prj/auth/all/html', self.c_Prj.htmlAuthAll())

    // json - create new author
    router.post('/prj/auth/new', self.c_Prj.jsonAuthNew())

    router.get('/prj/auth/info/tmpl', self.c_Prj.tmplAuthInfo())

//@@ Tags
    router.get('/prj/tag/html', self.c_Prj.htmlTagSecs())
    router.get('/prj/tag/list', self.c_Prj.jsonTagList())

    // linked to btn_tags button
    router.get('/prj/tags/html', self.c_Prj.htmlTags())

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
