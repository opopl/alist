// Import express
const express = require('express')

// Import auth-controller
const authRoutes = require('./../controllers/auth-controller.js')

// Create router
const router = express.Router()

// Add route for GET request to retrieve all authors
// In server.js, auth route is specified as '/auth'
// this means that '/all' translates to '/auth/all'
router.get('/all', authRoutes.authAll)

// Add route for POST request to create new author
// In server.js, auth route is specified as '/auth'
// this means that '/create' translates to '/auth/create'
router.post('/create', authRoutes.authCreate)

// Add route for PUT request to delete specific author
// In server.js, auth route is specified as '/auth'
// this means that '/delete' translates to '/auth/delete'
router.put('/delete', authRoutes.authDelete)

// Add route for PUT request to reset authhelf list
// In server.js, auth route is specified as '/auth'
// this means that '/reset' translates to '/auth/reset'
router.put('/reset', authRoutes.authReset)

// Export router
module.exports = router
