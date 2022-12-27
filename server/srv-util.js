
const fs = require('fs')
const fse = require('fs-extra')
const _ = require('lodash')

const path = require('path')
const axios = require('axios')
const imageinfo = require('imageinfo')

//import { createHash } from 'node:crypto'
const crypto = require('crypto')

const findit = require('findit')

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

//@@ fetchFile
const fetchFile = async ({ url, local }) => {
  //const url = 'https://unsplash.com/photos/AaEQmoufHLk/download?force=true'
  //const path = Path.resolve(__dirname, 'images', 'code.jpg')
  const writer = fs.createWriteStream(local)

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

//@@ fetchImg
const fetchImg = async ({ url }) => {

 /* const response = await axios({*/
    //url,
    //method: 'GET',
    //responseType: 'stream'
  /*})*/

  //const writer = fs.createWriteStream(buffer)
  //response.data.pipe(writer)

  //return new Promise((resolve, reject) => {
    //writer.on('finish', resolve)
    //writer.on('error', reject)
  //})

	const response = await axios.get(url, { responseType: 'arraybuffer' })
  const buf = Buffer.from(response.data, 'binary')
	const headers = response.headers

	const info = imageinfo(buf)

	return new Promise((resolve, reject) => {
		//resolve({ buf64, info, headers })
		resolve({ buf, info, headers })
	})

}

const md5 = (content) => {
  return crypto.createHash('md5').update(content).digest('hex')
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

//@@ fsFind
const fsFind = async ({ dir, cb_file, cb_dir }) => {

  return new Promise(async (resolve, reject) => {
    if (!fs.existsSync(dir)) {
       resolve({ msg : `no dir: ${dir}` })
       return
    }

    const finder = findit(dir);

    if (cb_dir) {
      finder.on('directory', function (found, stat, stop) {
        cb_dir({ found, stat, stop })
      })
    }

    if (cb_file) {
      finder.on('file', function (found, stat) {
        cb_file({ found, stat })
      })
    }

    finder.on('end', () => { resolve({}) })
  });
 
}

module.exports = {
  fsFind,
  fsRead,
  fsWrite,
  dictGet,
  fetchFile,
  fetchImg
}
