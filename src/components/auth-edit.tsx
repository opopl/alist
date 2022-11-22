
import React, { useEffect, useState } from 'react'
import axios from 'axios'

import { AuthEditUI, DictUI } from './interfaces'
import { baseUrl, cols, header } from './const'

//import Autocomplete from './autocomplete'
//import TextField from '@mui/material/TextField';
//
import TextInput from 'react-autocomplete-input';
import 'react-autocomplete-input/dist/bundle.css';

export const AuthEdit = (props: AuthEditUI) => {

  const [author, setAuthor] = useState({ ...props.author })

  const [suggestions, setSuggestions ] = useState([''])

  useEffect(() => {
    setAuthor(props.author)
  }, [ props.author ] )

//@@ xOnChange
  const xOnChange = (col: string) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.currentTarget.value
      let dict = { ...props.author }
      dict[col] = value
      props.updateAuthor(dict)
    }
  }

// Reset all input fields
//@@ handleInputsReset
  const handleInputsReset = () => {
    props.changeRowSel(0)
    let dict: DictUI = {}
    cols.map((col) => { dict[col] = '' })
    props.updateAuthor(dict)
  }

// Submit new author
//@@ handleAuthorUpdate
  const handleAuthorUpdate = () => {
    // Check if all fields are filled
    if (author.id.length > 0 && ( author.plain || author.name )) {
      // update author
      axios
        .post(`${baseUrl}/update`, author )
        .then(res => {
          console.log(res.data)

          // Fetch all authors to refresh
          // the authors on the author list
          props.fetchAuthors({})
        })
        .catch(error => console.error(`There was an error updating the ${author.id} author: ${error}`))
    }
  }

//@@ completeAuthorId
  const completeAuthorId = (part: string) => {
      const str = `${part} aaa`
      setSuggestions([ str ])
  }

  // Form for author create or update 

  return (
      <div className="book-list-form">
        <div className="form-wrapper" onSubmit={handleAuthorUpdate}>

          <TextInput 
              //options={props.authors} 
              onRequestOptions={completeAuthorId} options={suggestions}
              trigger={['']}
              Component="input"
          />
            { cols.map((col) => 
                (
                <fieldset key={col}>
                  <div className="form-row">
                    <label className="form-label" htmlFor="{col}">{col}:</label>
                    <input className="form-input" 
                            type="text" 
                            id="{col}" name="{col}" 
                            value={author[col] || ''} onChange={xOnChange(col)} 
                    />
                  </div>
                </fieldset>
                )
              )
            }

            <div className="flex-container">
              <button onClick={handleInputsReset} className="btn btn-add">Reset</button>
              <button onClick={handleAuthorUpdate} className="btn btn-add">Update</button>
            </div>

        </div>
      </div>
    )
}
