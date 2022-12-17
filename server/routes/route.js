// Import express
const express = require('express')

// Import auth-controller
const prjRoutes = require('./../controllers/prj-controller.js')
const docRoutes = require('./../controllers/doc-controller.js')

const { c_AuthorClass } = require('./../controllers/c_AuthorClass.js')
const { c_ImgClass } = require('./../controllers/c_ImgClass.js')
const { c_PrjClass } = require('./../controllers/c_PrjClass.js')

const c_Author = new c_AuthorClass()
const c_Img = new c_ImgClass()
const c_Prj = new c_PrjClass()

// Create router
const router = express.Router()

// Add route for GET request to retrieve all authors
// In server.js, auth route is specified as '/auth'
// this means that '/all' translates to '/auth/all'
//
//
router.get('/', async (req, res) => {
   res.redirect('/prj/sec/html?sec=24_11_2022')
})

router.get('/auth/count',  c_Author.jsonCount())
router.get('/auth/all',    c_Author.jsonAll())
router.get('/auth/update', c_Author.jsonUpdate())

//@@ Images
router.get('/img/count'     , c_Img.jsonCount())
router.get('/img/raw/:inum' , c_Img.rawImg())

//router.put('/auth/delete', authRoutes.authDelete)

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
router.post('/prj/sec/list', prjRoutes.reqJsonSecList)

router.get(/^\/prj\/sec\/asset\/(.*)$/, c_Prj.secAsset())

//@@ Authors
router.get('/prj/auth/html', c_Prj.htmlAuthView())

//@@ Builds
router.get('/prj/bld/data', c_Prj.jsonBldData())

//@@ Assets
router.get(/^\/prj\/assets\/js\/(.*)$/, prjRoutes.reqJsFile)

router.get(/^\/prj\/assets\/css\/ctl\/(.*)$/, prjRoutes.reqCssFileCtl)
router.get(/^\/prj\/assets\/css\/main\/(.*)$/, c_Prj.cssFile())


//@@ Doc


// Export router
module.exports = router
