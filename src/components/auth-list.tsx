
// Import deps
import React from 'react'

// Import components
import { AuthListRow } from './auth-list-row'

// Import styles
import './../styles/auth-list.css'

// Create interfaces
interface AuthorUI {
  id: number;
  url: string;
  name: string;
  plain: string;
  description: string;
}

interface AuthListUI {
  authors: AuthorUI[];
  loading: boolean;
  handleAuthorRemove: (id: number) => void;
}

// Create AuthList component
export const AuthList = (props: AuthListUI) => {
  // Show loading message
  if (props.loading) return <p>Leaderboard table is loading...</p>

  return (
    <table className="table">
        <thead>
          <tr>
            <th className="table-head-item">Id</th>
            <th className="table-head-item">Url</th>
            <th className="table-head-item">Name</th>
            <th className="table-head-item">Plain</th>
            <th className="table-head-item">Description</th>
            <th className="table-head-item" />
          </tr>
        </thead>

        <tbody className="table-body">
          {props.authors.length > 0 ? (
            props.authors.map((author: AuthorUI, idx) => (
              <AuthListRow
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
  )
}
