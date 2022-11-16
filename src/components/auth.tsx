// Import deps
import React, { useEffect, useState } from 'react'
import axios from 'axios'

// Import components
import { AuthList } from './auth-list'

// Import styles
import './../styles/auth.css'

// Create Auth component
export const Auth = () => {
  // Prepare states
  const [id, setId] = useState('')

  const [name, setName] = useState('')
  const [plain, setPlain] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')

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

  // Reset all input fields
  const handleInputsReset = () => {
    setId('')
    setUrl('')
    setName('')
    setPlain('')
    setDescription('')
  }

  // Create new author
  const handleAuthorCreate = () => {
    // Send POST request to 'auth/create' endpoint
    axios
      .post('http://localhost:4001/auth/create', {
        id: id,
        url: url,
        name: name,
        plain: plain,
        description: description
      })
      .then(res => {
        console.log(res.data)

        // Fetch all authors to refresh
        // the authors on the author list
        fetchAuthors()
      })
      .catch(error => console.error(`There was an error creating the ${id} author: ${error}`))
  }

  // Submit new book
  const handleAuthorSubmit = () => {
    // Check if all fields are filled
    if (id.length > 0 && ( plain.length > 0 || name.length > 0 )) {
      // Create new book
      handleAuthorCreate()

      console.info(`Author ${id} added.`)

      // Reset all input fields
      handleInputsReset()
    }
  }

  // Remove book
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
      {/* Form for creating new book */}
      <div className="book-list-form">
        <div className="form-wrapper" onSubmit={handleAuthorSubmit}>
          <div className="form-row">
            <fieldset>
              <label className="form-label" htmlFor="id">ID:</label>
              <input className="form-input" type="text" id="id" name="id" value={id} onChange={(e) => setId(e.currentTarget.value)} />
            </fieldset>

            <fieldset>
              <label className="form-label" htmlFor="url">url:</label>
              <input className="form-input" type="text" id="url" name="url" value={url} onChange={(e) => setUrl(e.currentTarget.value)} />
            </fieldset>
          </div>

          <div className="form-row">
            <fieldset>
              <label className="form-label" htmlFor="name">name (lastName, firstName):</label>
              <input className="form-input" type="text" id="name" name="name" value={name} onChange={(e) => setName(e.currentTarget.value)} />
            </fieldset>

            <fieldset>
              <label className="form-label" htmlFor="plain">plain:</label>
              <input className="form-input" type="text" id="plain" name="plain" value={plain} onChange={(e) => setPlain(e.currentTarget.value)} />
            </fieldset>
          </div>

          <div className="form-row">
            <fieldset>
              <label className="form-label" htmlFor="description">description:</label>
              <input className="form-input" type="text" id="description" name="description" value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
            </fieldset>

          </div>
        </div>

        <button onClick={handleAuthorSubmit} className="btn btn-add">Add the author</button>
      </div>

      {/* Render authlist component */}
      <AuthList authors={authors} loading={loading} handleAuthorRemove={handleAuthorRemove} />

    </div>
  )
}
