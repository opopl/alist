// Import deps
import React from 'react'
import { render } from 'react-dom'

// Import components
import { Auth } from './components/auth'

// Import styles
import './styles/styles.css'

// Find div container
const rootElement = document.getElementById('root')

// Render Auth component in the DOM
render(<Auth />, rootElement)
