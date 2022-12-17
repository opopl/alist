// Import express
const express = require('express')

// Import auth-controller
const prjRoutes = require('./../controllers/prj-controller.js')
const docRoutes = require('./../controllers/doc-controller.js')

const { c_AuthorClass } = require('./../controllers/c_AuthorClass.js')
const { c_ImgClass } = require('./../controllers/c_ImgClass.js')

const c_Author = new c_AuthorClass()
const c_Img = new c_ImgClass()

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

router.post('/prj/act', prjRoutes.reqJsonAct)

//@@ Config
router.get('/prj/config/get', prjRoutes.reqJsonConfig)

//@@ Target
router.get('/prj/target/data', prjRoutes.reqJsonTargetData)
router.get('/prj/target/html', prjRoutes.reqHtmlTargetView)

//@@ Sec
router.get('/prj/sec/count', prjRoutes.reqJsonSecCount)
router.get('/prj/sec/data', prjRoutes.reqJsonSecData)
router.get('/prj/sec/src', prjRoutes.reqJsonSecSrc)

router.get('/prj/sec/html', prjRoutes.reqHtmlSecView)
router.get('/prj/sec/saved', prjRoutes.reqHtmlSecSaved)
router.get('/prj/sec/pdf', prjRoutes.reqPdfSecView)
router.post('/prj/sec/list', prjRoutes.reqJsonSecList)

router.get(/^\/prj\/sec\/asset\/(.*)$/, prjRoutes.reqSecAsset)

//@@ Authors
router.get('/prj/auth/html', prjRoutes.reqHtmlAuthView)

//@@ Builds
router.get('/prj/bld/data', prjRoutes.reqJsonBldData)

//@@ Assets
router.get(/^\/prj\/assets\/js\/(.*)$/, prjRoutes.reqJsFile)

router.get(/^\/prj\/assets\/css\/ctl\/(.*)$/, prjRoutes.reqCssFileCtl)
router.get(/^\/prj\/assets\/css\/main\/(.*)$/, prjRoutes.reqCssFile)


//@@ Doc


// Export router
module.exports = router
