// Import express
const express = require('express')

// Import auth-controller
const authRoutes = require('./../controllers/auth-controller.js')
const imgRoutes = require('./../controllers/img-controller.js')
const prjRoutes = require('./../controllers/prj-controller.js')

// Create router
const router = express.Router()

// Add route for GET request to retrieve all authors
// In server.js, auth route is specified as '/auth'
// this means that '/all' translates to '/auth/all'
//
router.get('/auth/count', authRoutes.authCount)
router.get('/auth/all', authRoutes.authAll)
router.post('/auth/update', authRoutes.authUpdate)
//router.put('/auth/delete', authRoutes.authDelete)
//
router.get('/prj/sec/count', prjRoutes.reqJsonSecCount)
router.get('/prj/sec/data', prjRoutes.reqJsonSecData)
router.get('/prj/sec/src', prjRoutes.reqJsonSecSrc)

router.get('/prj/target/data', prjRoutes.reqJsonTargetData)

router.get('/prj/sec/html', prjRoutes.reqHtmlSecView)
router.get('/prj/target/html', prjRoutes.reqHtmlTargetView)
router.get('/prj/auth/html', prjRoutes.reqHtmlAuthView)

router.post('/prj/act', prjRoutes.reqJsonAct)

router.get(/^\/prj\/assets\/js\/(.*)$/, prjRoutes.reqJsFile)

router.get('/img/count', imgRoutes.jsonImgCount)
router.get('/img/raw/:inum', imgRoutes.rawImg)

// Export router
module.exports = router
