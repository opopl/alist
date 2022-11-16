// Import deps
import React from 'react'

// Create interfaces
interface AuthListRowUI {
  position: number;
  author: {
    id: number;
    url: string;
    name: string;
    plain: string;
    description: string;
  }
  handleAuthorRemove: (id: number) => void;
}

// Create AuthListRow component
export const AuthListRow = (props: AuthListRowUI) => (
  <tr className="table-row">
    <td className="table-item">
      {props.position}
    </td>

    <td className="table-item">
      {props.author.id}
    </td>

    <td className="table-item">
      {props.author.url}
    </td>

    <td className="table-item">
      {props.author.name}
    </td>

    <td className="table-item">
      {props.author.plain}
    </td>

    <td className="table-item">
      {props.author.description}
    </td>

    <td className="table-item">
      <button
        className="btn btn-remove"
        onClick={() => props.handleAuthorRemove(props.author.id)}>
        Remove author
      </button>
    </td>
  </tr>
)
