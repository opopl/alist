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

router.post('/update', authRoutes.authUpdate)

// Add route for PUT request to delete specific author
// In server.js, auth route is specified as '/auth'
// this means that '/delete' translates to '/auth/delete'
router.put('/delete', authRoutes.authDelete)

// Export router
module.exports = router
