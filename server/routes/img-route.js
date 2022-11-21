// Import express
const express = require('express')

// Import img-controller
const imgRoutes = require('./../controllers/img-controller.js')

// Create router
const router = express.Router()

// Add route for GET request to retrieve all imgors
// In server.js, img route is specified as '/img'
// this means that '/all' translates to '/img/all'
//
router.get('/all', imgRoutes.imgAll)
router.get('/count', imgRoutes.imgCount)

// Export router
module.exports = router
