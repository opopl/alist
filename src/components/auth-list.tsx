
// Import deps
import React, { useState } from 'react'

// Import components
import { AuthListRow } from './auth-list-row'

// Import styles
import './../styles/auth-list.css'

import { AuthorUI, AuthListUI } from './interfaces'

import { header } from './const'

// Create AuthList component
export const AuthList = (props: AuthListUI) => {

  const [ rowSel, setRowSel ] = useState(2)

  // Show loading message
  if (props.loading) return <p>Leaderboard table is loading...</p>

  const changeRowSel = (position: number) => {
     setRowSel(position)
     if(rowSel){
       console.log(`row selected => ${rowSel}`)
     }
  }

  return (
    <div>
        <span>{rowSel}</span>
    
    <table className="table">
        <thead>
          <tr>
            <th className="table-head-item" />
            <th className="table-head-item" />
            {
              header.map((col) => ( <th className="table-head-item">{col}</th> ))
            }
          </tr>
        </thead>

        <tbody className="table-body">
          {props.authors.length > 0 ? (
            props.authors.map((author: AuthorUI, idx) => (
              <AuthListRow
                select={ (rowSel === (idx+1)) ? true : false }
                changeRowSel={changeRowSel}
                key={author.id}
                author={author}
                position={idx + 1}
                handleAuthorRemove={props.handleAuthorRemove}
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
