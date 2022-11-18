
import React, { useEffect, useState } from 'react'
import axios from 'axios'

import { AuthEditUI } from './interfaces'
import { cols, header } from './const'

export const AuthEdit = (props: AuthEditUI) => {

  const [author, setAuthor] = useState({ ...props.author })

  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [plain, setPlain] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    setAuthor(props.author)
  }, [ props.author ] )

  const xOnChange = (col: string) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.currentTarget.value
      let dict = { ...props.author }
      dict[col] = value
      props.updateAuthor(dict)
    }
  }

// Reset all input fields
  const handleInputsReset = () => {
    cols.map((col) => { props.updateAuthor({ col : '' }) })
  
    //setId('')
    //setUrl('')
    //setName('')
    //setPlain('')
    //setDescription('')
  }

// Submit new author
  const handleAuthorSubmit = () => {
    // Check if all fields are filled
    if (author.id.length > 0 && ( author.plain.length > 0 || author.name.length > 0 )) {
      // Create new author
      handleAuthorCreate()

      console.info(`Author ${id} added.`)

      // Reset all input fields
      handleInputsReset()
    }
  }

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
        props.fetchAuthors()
      })
      .catch(error => console.error(`There was an error creating the ${id} author: ${error}`))
  }

  // Form for creating new author 

  return (
      <div className="book-list-form">
        <div className="form-wrapper" onSubmit={handleAuthorSubmit}>
          <div className="form-row">
            <fieldset>
              <label className="form-label" htmlFor="id">ID:</label>
              <input className="form-input" type="text" id="id" name="id" value={author.id} onChange={xOnChange('id')} />
            </fieldset>

            <fieldset>
              <label className="form-label" htmlFor="url">url:</label>
              <input className="form-input" type="text" id="url" name="url" value={author.url} onChange={xOnChange('url')} />
            </fieldset>
          </div>

          <div className="form-row">
            <fieldset>
              <label className="form-label" htmlFor="name">name (lastName, firstName):</label>
              <input className="form-input" type="text" id="name" name="name" value={author.name} onChange={xOnChange('name')} />
            </fieldset>

            <fieldset>
              <label className="form-label" htmlFor="plain">plain:</label>
              <input className="form-input" type="text" id="plain" name="plain" value={author.plain} onChange={xOnChange('plain')} />
            </fieldset>
          </div>

          <div className="form-row">
            <fieldset>
              <label className="form-label" htmlFor="description">description:</label>
              <input className="form-input" type="text" id="description" name="description" value={author.description} onChange={xOnChange('description')} />
            </fieldset>

          </div>
        </div>

        <button onClick={handleAuthorSubmit} className="btn btn-add">Add the author</button>
      </div>
    )
}
