// Import deps
import React, { useEffect, useState } from 'react'

import { AuthListRowUI } from './interfaces'
import { cols } from './const'

// Create AuthListRow component
export const AuthListRow = (props: AuthListRowUI) => {
  const [select, setSelect] = useState(props.select)

  const color = () => {
     return select ? 'gray' : 'white'
  }

  const trOnClick = () => {
     setSelect(!select)
     if(select){
        props.changeRowSel(props.position)
     }else{
        props.changeRowSel(0)
     }
  }

  useEffect(() => {
     setSelect(props.select)
  },[])

  return (
     <tr className="table-row" style={{ background: color() }} onClick={trOnClick}> 
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
