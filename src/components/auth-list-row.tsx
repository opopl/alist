// Import deps
import React from 'react'

import { AuthListRowUI } from './interfaces'
import { cols } from './const'

// Create AuthListRow component
export const AuthListRow = (props: AuthListRowUI) => {

  return (
      <tr className="table-row">
        <td className="table-item" style={{ width: '5px' }}>
          {props.position}
        </td>

        <td className="table-item" style={{ width: '5px' }}>
          <button
            className="btn btn-remove"
            onClick={() => props.handleAuthorRemove(props.author.id)}>
            Remove author
          </button>
        </td>
    
        {
          cols.map((col) => {
             return ( <td className="table-item"> {props.author[col]} </td>)
          })
        }

      </tr>
  )
}
