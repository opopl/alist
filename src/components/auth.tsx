// Import deps
import React, { useEffect, useState } from 'react'
import axios from 'axios'

// Import components
import { AuthList } from './auth-list'
import { AuthEdit } from './auth-edit'

// Import styles
import './../styles/auth.css'

// Create Auth component
export const Auth = () => {
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch all authors on initial render
  useEffect(() => {
    fetchAuthors()
  }, [])

  // Fetch all authors
  const fetchAuthors = async () => {
    // Send GET request to 'auth/all' endpoint
    axios
      .get('http://localhost:4001/auth/all')
      .then(response => {
        // Update the authors state
        setAuthors(response.data)

        // Update loading state
        setLoading(false)
      })
      .catch(error => console.error(`There was an error retrieving the author list: ${error}`))
  }

  // Remove author
  const handleAuthorRemove = (id: number) => {
    // Send PUT request to 'auth/delete' endpoint
    axios
      .put('http://localhost:4001/auth/delete', { id: id })
      .then(() => {
        console.log(`Author ${id} removed.`)

        // Fetch all authors to refresh the list
        fetchAuthors()
      })
      .catch(error => console.error(`There was an error removing the ${id} author: ${error}`))
  }

  return (
    <div className="book-list-wrapper">
      <AuthEdit fetchAuthors={fetchAuthors} /> 
      {/* Render authlist component */}
      <AuthList authors={authors} loading={loading} handleAuthorRemove={handleAuthorRemove} />

    </div>
  )
}
