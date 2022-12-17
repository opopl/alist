// Import express
const express = require('express')

// Import auth-controller
const prjRoutes = require('./../controllers/prj-controller.js')
const docRoutes = require('./../controllers/doc-controller.js')

const { cAuthorClass } = require('./../controllers/cAuthorClass.js')
const { cImgClass } = require('./../controllers/cImgClass.js')

const cAuthor = new cAuthorClass()
const cImg = new cImgClass()

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

router.get('/auth/count',  cAuthor.jsonCount())
router.get('/auth/all',    cAuthor.jsonAll())
router.get('/auth/update', cAuthor.jsonUpdate())

//@@ Images
router.get('/img/count'     , cImg.jsonCount())
router.get('/img/raw/:inum' , cImg.rawImg())

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
