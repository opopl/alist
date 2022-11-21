
// Import deps
import React, { useEffect, useState } from 'react'

// Import components
import { AuthListRow } from './auth-list-row'

// Import styles
import './../styles/auth-list.css'

import { AuthorUI, AuthListUI } from './interfaces'

import { header } from './const'

// Create AuthList component
export const AuthList = (props: AuthListUI) => {

  const [ rowSel, setRowSel ] = useState(props.rowSel)

  useEffect(() => { 
    setRowSel(props.rowSel)
  },[props.rowSel])

  useEffect(() => { 
    if(rowSel){
        console.log(`row selected => ${rowSel}`)
        const rowAuthor = props.authors[rowSel-1]
        props.updateAuthor(rowAuthor)
    }
  },[rowSel])

  // Show loading message
  if (props.loading) return <p>Leaderboard table is loading...</p>

  return (
    <div>
        <span>{rowSel}</span>
        <label htmlFor="numRec">Number of Records:</label>
        <input 
             type="number" 
             id="numRec" name="numRec" value={props.numRec}
             onChange={(e) => {props.updateNumRec(e.currentTarget.value)}}
        />
    
    <table className="table">
        <thead>
          <tr>
            <th className="table-head-item" />
            <th className="table-head-item" />
            {
              header.map((col) => ( <th className="table-head-item" key={col}>{col}</th> ))
            }
          </tr>
        </thead>

        <tbody className="table-body">
          {props.authors.length > 0 ? (
            props.authors.map((author: AuthorUI, idx) => (
              <AuthListRow
                select={ (rowSel === (idx+1)) ? true : false }
                changeRowSel={props.changeRowSel}
                key={author.id}
                author={author}
                position={idx + 1}
                handleAuthorRemove={props.handleAuthorRemove}
                updateAuthor={props.updateAuthor}
              />
              )
            )
          ) : (
            <tr className="table-row">
              <td className="table-item" style={{ textAlign: 'center' }} colSpan={6}>There are no authors to show. Create one!</td>
            </tr>
          )
        }
        </tbody>
    </table>
    </div>
  )
}
