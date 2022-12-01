
const fs = require('fs')
const fse = require('fs-extra')

const fsRead = function(path, encoding) {
    return new Promise(function(resolve, reject) {
        if(encoding == undefined) encoding='utf8'

        fs.readFile(path, encoding, function(err, data)  {
            if(err) reject("Read error: " + err.message)
            else { resolve(data) }
        })
    })

}

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
  fsWrite
}
