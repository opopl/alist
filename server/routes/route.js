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
router.get('/prj/sec/count', prjRoutes.secCount)
router.get('/prj/sec/data', prjRoutes.secData)

// Export router
module.exports = router
