
const fs = require('fs')
const fse = require('fs-extra')
const _ = require('lodash')

const path = require('path')
const axios = require('axios')

//@@ fsRead
const fsRead = function(path, encoding) {
    return new Promise(function(resolve, reject) {
        if(encoding == undefined) encoding='utf8'

        fs.readFile(path, encoding, function(err, data)  {
            if(err) reject("Read error: " + err.message)
            else { resolve(data) }
        })
    })

}

//https://futurestud.io/tutorials/download-files-images-with-axios-in-node-js
//'use strict'

//@@ fetchImg
const fetchImg = async ({ remote, local }) => {
  //const url = 'https://unsplash.com/photos/AaEQmoufHLk/download?force=true'
  //const path = Path.resolve(__dirname, 'images', 'code.jpg')
  const writer = fs.createWriteStream(local)

  const response = await axios({
		url : remote,
    method: 'GET',
    responseType: 'stream'
  })

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

//@@ dictGet
const dictGet = function(obj, keys=[]) {
   var keyList = [], dict = {}
   if (typeof(keys) == 'string') {
      keys.split(/\s+/).map((x) => {
        keyList.push(x)
      })
   }
   else if (Array.isArray(keys)) {
      keyList.push(...keys)
   }

   keyList.forEach((x) => {
      dict[x] = _.get(obj, x)
   })

   return dict
}

//@@ fsWrite
const fsWrite = function(path, data) {
    return new Promise(function(resolve, reject) {
        //if(encoding == undefined) encoding='utf8'

        fs.writeFile(path, data, function(err)  {
            if(err) reject("Write error: " + err.message)
            else { resolve(data) }
        })
    })

}

module.exports = {
  fsRead,
  fsWrite,
  dictGet,
  fetchImg
}
