// Import deps
import React, { useEffect, useState } from 'react'

import axios from 'axios'

// Import components
import { AuthList } from './auth-list'
import { AuthEdit } from './auth-edit'

import { baseUrl } from './const'

//import { TabGroup } from './tabs'

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import { DictUI, AuthorUI } from './interfaces'

// Import styles
import './../styles/auth.css'
import './../styles/tabs.css'
import './../styles/flex.css'

// Create Auth component
export const Auth = () => {
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [pageSave, setPageSave] = useState(1)
  // number of records per page
  const [ numRec, setNumRec ] = useState(10)
  const [ numRecSave, setNumRecSave ] = useState(numRec)

  const [ cnt, setCnt] = useState(numRec)
  const [ numPages, setNumPages ] = useState(1)

  const [rowSel, setRowSel] = useState(0)

  const authorNew = {
    id: '',
    url: 'asdasd',
    name: 'ddd',
    plain: 'ddd',
    description: 'the description',
  }

  const [author, setAuthor] = useState(authorNew)

  // Fetch all authors on initial render
  useEffect(() => {
    const size = numRec || numRecSave
    fetchAuthors({ page : page, size : size })

  }, [ page, numRec, numRecSave ])

  useEffect(() => {
    setNumPages(Math.trunc(cnt/numRec + 1))
  }, [ cnt, numRec ])

  //useEffect(() => {
    //console.log(`author => ${JSON.stringify(author)}`)
  //}, [ author ])

//@@ changeRowSel
  const changeRowSel = (position: number) => {
     setRowSel(position)
  }

//@@ updateNumRec
  const updateNumRec = (size: number) => {
     setNumRecSave(numRec)
     setNumRec(size)
     setPage(1)
  }

  const updatePage = (pg: number) => {
     setPageSave(page)
     setPage(pg)
  }

//@@ updateAuthor
  const updateAuthor = (obj: { [ key: string] : string }) => {
    let dict = { ...author, ...obj }
    //Object(author).keys().map((k : string) => { 
      //if (author[k] === null) {
        //author[k] = ''
      //}
    //})
    console.log(`updateAuthor => ${JSON.stringify(dict)}`)
    setAuthor(dict)
  }

  const fetchCnt = async () => {
    const res = await axios.get(`${baseUrl}/count`)
    setCnt(res.data.cnt)
  }

  // Fetch all authors
//@@ fetchAuthors
  const fetchAuthors = async (params: DictUI) => {
    fetchCnt()

    axios
      .get(`${baseUrl}/all`, { params : params })
      .then(response => {
        // Update the authors state
        setAuthors(response.data)

        // Update loading state
        setLoading(false)
      })
      .catch(error => console.error(`There was an error retrieving the author list: ${error}`))
  }


  // Remove author
//@@ handleAuthorRemove
  const handleAuthorRemove = (id: string) => {
    // Send PUT request to 'auth/delete' endpoint
    axios
      .put(`${baseUrl}/delete`, { id: id })
      .then(() => {
        console.log(`Author ${id} removed.`)

        // Fetch all authors to refresh the list
        fetchAuthors({ page : 1, size : 10 })
      })
      .catch(error => console.error(`There was an error removing the ${id} author: ${error}`))
  }

  return (
      <Tabs>
        <TabList>
          <Tab>Authors</Tab>
          <Tab>Images</Tab>
        </TabList>
    
        <TabPanel>
            <div className="flex-container">
              <div className="flex-item-left">
                <AuthEdit  
                     author={author}
                     authors={authors}
                     changeRowSel={changeRowSel}
                     fetchAuthors={fetchAuthors}
                     updateAuthor={updateAuthor}
                 /> 
              </div>
              <div className="flex-item-right">
                <AuthList
                     changeRowSel={changeRowSel}
                     rowSel={rowSel}
                     authors={authors} 
                     loading={loading} 
                     updateAuthor={updateAuthor} 
                     handleAuthorRemove={handleAuthorRemove} 

                     page={page}
                     pageSave={pageSave}
                     numPages={numPages}
                     cnt={cnt}
                     numRec={numRec}
                     numRecSave={numRecSave}
                     updateNumRec={updateNumRec}
                     updatePage={updatePage}
                />
              </div>
            </div>
        </TabPanel>
        <TabPanel>
          <h2>Any content 2</h2>
        </TabPanel>
      </Tabs>
  )
}
