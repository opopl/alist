// Import database

const db = require('./../db')
const dbProc = require('./../dbproc')
const _ = require('lodash')

const srvUtil = require('./../srv-util')

const cheerio = require("cheerio");

const { ImgClass } = require('./ImgClass')

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')

const imageDataURI = require('image-data-uri')
const imageinfo = require('imageinfo')

const select = db.sql.select
const insert = db.sql.insert
const update = db.sql.update

const c_ImgClass = class {
  constructor(ref={}){
    this.dbc = db.img
    this.imgRoot = path.join(process.env.IMG_ROOT)

    Object.assign(this, ref)
    this.imgman = new ImgClass(ref)
  }

//@@ jsonCount
//@r GET /img/count
  jsonCount(){
    const self = this

    return async (req, res) => {

      const q_count = select('count(*) as cnt').from('imgs').toString()

      var data = await dbProc.get(self.dbc, q_count, [])
      res.json(data)
    }
  }

//@@ rawImg
//@r GET /img/raw/:inum
  rawImg(){
    const self = this

    return async (req, res) => {
      const params = req.params

      const inum = _.get(params,'inum')

      const q_file = select('img')
                  .from('imgs')
                  .where({ inum })
                  .toParams({placeholder: '?%d'})

      if (inum) {
         var rw = await dbProc.get(self.dbc, q_file.text, q_file.values)
         var img = _.get(rw,'img')
         var imgFile = path.join(self.imgRoot, img)
         if (fs.existsSync(imgFile)) {
            res.status(200).sendFile(imgFile)
         }else{
            res.status(500)
         }
      }
    }
  }

//@@ rawImgUrl
//@r GET /img/raw/url/:url
  rawImgUrl(){
    const self = this

    return async (req, res) => {
      const params = req.params

      const urlEnc = _.get(params,'url')
      if (!urlEnc) {
         res.status(500).send({ 'msg' : 'no url!' })
      }

      const url = decodeURIComponent(urlEnc)

      const rw = await self.imgman.dbImgData({ url })

      const img = _.get(rw,'img')
      const imgFile = path.join(self.imgRoot, img || '')

      if (img && fs.existsSync(imgFile)) {
         res.status(200).sendFile(imgFile)
      }else{
         res.status(404)
      }
    }
  }

//@@ jsonImgDelete
//@r POST /img/delete
  jsonImgDelete(){
    const self = this

    return async (req, res) => {
      const jsonData = req.body.data
      const data = JSON.parse(jsonData)

      self.imgman.imgDelete(data)
      return res.send({})
    }
  }

//@@ jsonImgDataUpdate
//@r POST /img/data/update
  jsonImgDataUpdate(){
    const self = this

    return async (req, res) => {
      const jsonData = req.body.data
      const data = JSON.parse(jsonData)

      const whr = _.get(data,'where',{})
      const upd = _.get(data,'update',{})
      const act = _.get(data,'act','')
      const actOpts = _.get(data,'actOpts',{})

      const canUpdate = [ 'caption', 'name', 'name_orig', 'tags' ]

      if (act == 'update_mtime') {
        const imgData = await self.imgman.dbImgData(whr)
        const imgFile = path.join(self.imgRoot, imgData.img)

        const mode = _.get(actOpts, 'mode', '')
        if (!mode) { return res.status(500).send({ 'msg' : 'no update_mtime mode!' }) }

        let ok = true, upda = {}

        const mtime_db = imgData.mtime
        if (mode == 'fs') {
          const stats = fs.statSync(imgFile)
          const mtime_fs = Math.trunc(stats.mtimeMs/1000)
          ok = ok && (mtime_fs !== mtime_db)
          upda = { mtime : mtime_fs }
        }else if (mode == 'now') {
          const mtimeNowJs = Date.now()
          const mtimeNow = Math.trunc(mtimeNowJs/1000)
          upda = { mtime : mtimeNow }
        }else{
          ok = false
          return res.status(500).send({ 'msg' : `update_mtime mode: ${mode} not implemented!` })
        }

        if (ok) {
          await self.imgman.dbImgUpdate({ whr, upd : upda,
            on_success : async () => {
              const idata = await self.imgman.dbImgData(whr)
              console.log({ msg : 'success update_mtime' })
              res.status(200).send({ 'msg' : 'update ok', imgData : idata })
            }
          })
        }
        return
      }

      const on_success = () => {
        return res.status(200).send({ 'msg' : 'img update ok'})
      }
      const on_fail = (e) => {
        return res.status(500).send({ 'msg' : `img update fail: ${e}` })
      }

      await self.imgman.dbImgUpdate({ whr, upd, canUpdate, on_success, on_fail })
    }
  }

//@@ jsonImgDataUrl
//@r GET /img/data/url/:url
  jsonImgDataUrl(){
    const self = this

    return async (req, res) => {
      const params = req.params

      const urlEnc = _.get(params,'url')
      if (!urlEnc) {
         res.status(404).send({ 'msg' : 'no url!' })
      }

      const url = decodeURIComponent(urlEnc)
 /*     console.log({ url })*/
      //saved:
      //inum 75239
      //https://scontent-ams2-1.xx.fbcdn.net/v/t39.30808-6/322740431_662461328946722_3777360133708458065_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=730e14&_nc_ohc=cUxtp4kJbh0AX_cyc_G&_nc_ht=scontent-ams2-1.xx&oh=00_AfDM1jze5EDaJ4OQrX-b_SRwskafKcpjWaIT4x0qSnxPTg&oe=63B89C59
      //orig:
      /*https://scontent-ams4-1.xx.fbcdn.net/v/t39.30808-6/322740431_662461328946722_3777360133708458065_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=730e14&_nc_ohc=lMdO15igeS0AX8XosY9&_nc_ht=scontent-ams4-1.xx&oh=00_AfCEWMt46d4g3IpxwYUhvQZkRC8XK3RuGQSCvcJMSQA6JA&oe=63BA9699*/

      const rw = await self.imgman.dbImgData({ url })

      if (rw) {
        res.send(rw)
      }else{
        res.status(404).send({ 'msg' : 'no img!' })
      }
    }
  }

//@@ htmlImgFetch
//@r POST /img/fetch/html
  htmlImgFetch () {
    const self = this

    return async (req, res) => {
       const body = req.body

       const dataJson = body.data
       const data = JSON.parse(dataJson)
       const pics = data.pics
       const picUrlList = pics.map((x) => x.url)
       const picDone = {}

       const p_pics = pics.map(async(pic) => {
          const url = pic.url
          const { buf, src, info, headers } = await srvUtil.fetchImg({ url })

          const md5 = srvUtil.md5hex(buf)

          picDone[url] = { ...pic, src, md5 }
       })
       await Promise.all(p_pics)

       const tmplEnv = self.tmplEnv
       const html = tmplEnv.render('include/piece/img_fetched.html',{ picUrlList, picDone })
       return res.send(html)
    }
  }

//@@ jsonImgNew
//@r POST /img/new
  jsonImgNew () {
    const self = this

    return async (req, res) => {
       const body = req.body

       const data = JSON.parse(body.data)
       const fields = 'url file caption tags'
       const { url, file, caption, tags } = srvUtil.dictGet(data,fields)

       let iBuf
       if (file) {
          iBuf = self.imgman._uriData2buf({ uri : file })
       }

       self.imgman.dbImgStore({
          iUrl: url, iBuf,
          caption, tags
       })
       res.send({ url })
    }
  }

//@@ jsonImgInfo
//@r POST /img/info
  jsonImgInfo(){
    const self = this

    return async (req, res) => {
      whr = req.body
    }
  }

//@@ jsonImgData
//@r POST /img/data
//@r GET /img/data/:inum
  jsonImgData(){
    const self = this

    return async (req, res) => {
      const params = req.params

      let whr = {}
      if (req.method == 'GET') {
        const inum = _.get(params,'inum')
        whr = { inum }
      }else{
        whr = req.body
      }

      const rw = await self.imgman.dbImgData(whr)
      if (rw) {
        res.send(rw)
      }else{
        res.status(404).send({ 'msg' : 'no img!' })
      }
    }
  }

//@@ jsonImgTagList
//@r GET /img/tag/list
  jsonImgTagList(){
    const self = this

    return async (req, res) => {
      const query = req.query
      const { regex, exclude } = srvUtil.dictGet(query,'regex exclude')

      const tagList = await self.imgman.dbImgTagList({ regex, exclude })
      res.send(tagList)
    }
  }

//@@ jsonImgDataAll
//@r POST /img/data/all
  jsonImgDataAll(){
    const self = this

    return async (req, res) => {
      const params = req.params

      const whr = req.body
      for(let key of Object.keys(whr)){
        let value = _.get(whr, key)
        if (value === undefined || value === '') {
          delete whr[key]
        }
      }

      const sql = _.get(whr,'sql')

      // disable all imgs query if no where params were
      //  specified
      if (!Object.keys(whr).length && !sql) {
        return res.status(404).send({ 'msg' : 'no img data!' })
      }

      const rows = await self.imgman.dbImgDataAll({ whr, sql })
      if (rows) {
        res.send(rows)
      }else{
        res.status(404).send({ 'msg' : 'no img data!' })
      }
    }
  }

}


module.exports = { c_ImgClass }

