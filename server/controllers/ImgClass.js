

const db = require('./../db')
const dbProc = require('./../dbproc')

const path = require('path')
const fs = require('fs')
const srvUtil = require('./../srv-util')

const md5file = require('md5-file')

const exifReader = require('exifreader')
const imageinfo = require('imageinfo')

const imageDataURI = require('image-data-uri')

const strftime = require('strftime')

const select = db.sql.select
const insert = db.sql.insert
const update = db.sql.update

const ImgClass = class {

//@@ new
  constructor(ref={}){

    this.dbc = db.img
    this.imgRoot  = path.join(process.env.IMG_ROOT)

    Object.assign(this,ref)
  }

//@@ _uriData2buf
  _uriData2buf({ uri }){
    const self = this

    if (!uri) { return }

    let buf
    if (Array.isArray(uri)) {
      for(let u of uri){
        const b = self._uriData2buf({ uri : u })
        if (b) {
          buf = buf ? buf : []
          buf.push(b)
        }
      }
    }else{
      try {
        const decode = imageDataURI.decode(uri)
        buf = decode.dataBuffer

      } catch(e) {
        console.error(e)
      }
    }

    return buf
  }

//@@ dbImgData
  async dbImgData (whr={}) {
    const self = this

    const q_data = select('*')
                .from('imgs')
                .where(whr)
                .toParams({placeholder: '?%d'})

    const rw = await dbProc.get(self.dbc, q_data.text, q_data.values)
    if (rw) {
      if (rw.url) { rw.md5_url = srvUtil.md5hex(rw.url) }
    }

    return rw
  }

//@@ dbImgTagList
  async dbImgTagList ({ regex, exclude }) {
    const self = this

    const condList = []
    if (regex) { condList.push( `SEARCH("${regex}",tag)` ) }
    if (exclude) {
      const excludeList =  exclude.split(',').map(x => `"${x}"`)
      condList.push( `tag NOT IN (${excludeList.join(',')})` )
    }

    const cond = (condList.length) ? `WHERE ${condList.join(' AND ')}` : ''

    const info = '_info_imgs_tags'
    const q = `SELECT DISTINCT tag FROM ${info} ${cond} ORDER BY tag ASC`

    const rows = await dbProc.all(self.dbc, q, [])
    const tagList = rows.map( (x) => x.tag )
    return tagList
  }

//@@ dbImgDataAll
  async dbImgDataAll ({ whr, sql }) {
    const self = this

    let q, p = []

    let tagList = []
//@a dbImgDataAll.tags
    if ('tags' in whr) {
      const tags = whr.tags
      const qArr = [], whereArr = []
      tagList = tags.split(',')
      delete whr.tags
      let i = 1, condArr = []
      qArr.push(`SELECT * FROM imgs`)
      const info = `_info_imgs_tags`
      for(let tag of tagList){
        let tbl = `${info}_${i}`
        qArr.push(`
            INNER JOIN ${info} AS ${tbl} ON
            imgs.url = ${tbl}.url
        `)
        whereArr.push(`${tbl}.tag = ?`)
        p.push(tag)

        i+=1
      }
      const condWhere = whereArr.join(' AND ')
      qArr.push(`WHERE ${condWhere}`)
      q = qArr.join(' ')
      q = `${q} limit 10`
      console.log({ q, p });
    }

//@a dbImgDataAll.inum
    if ('inum' in whr) {
      const inumArr = whr.inum.split(',')
      whr.inum = inumArr
      whr = db.sql.in('inum', inumArr)
    }

    if (!q) {
      if (!sql) {
        const q_data = select('*')
                    .from('imgs')
                    .where(whr)
                    .toParams({placeholder: '?%d'})
        q = q_data.text
        p = q_data.values
      }else{
        q = sql
      }
    }
    console.log({ q, p });

    const rows = await dbProc.all(self.dbc, q, p)
    if (rows) {
      //if (rw.url) { rw.md5_url = srvUtil.md5hex(rw.url) }
    }

    return rows
  }

//@@ dbImgInum
  async dbImgInum ({ url }) {
    const self = this

    const rw = await self.dbImgData({ url })
    var inum
    if (rw) {
      inum = rw.inum
    }else{
      inum = await self.dbImgInumFree()
    }
    return inum
  }

//@@ dbImgInumFree
  async dbImgInumFree () {
    const self = this

    const q_inum = select('max(inum) as max').from('imgs').toString()
    const { max } = await dbProc.get(self.dbc, q_inum)
    const inum = max ? max+1 : 1

    return inum
  }

//@@ imgDelete
  async imgDelete ({ ...args } = {}){
    const self = this
  }

//@@ dbImgStore
  async dbImgStore ({ iUrl, iFile, iBuf,  ...ref } = {}){
    const self = this

    while (1) {
      if (iUrl) {
        await self.dbImgStoreUrl({ iUrl, ...ref })
        break
      }

      if (iFile) {
        await self.dbImgStoreFile({ iFile, ...ref })
        break
      }

      if (iBuf) {
        await self.dbImgStoreBuf({ iBuf, ...ref })
        break
      }

      break
    }

    return self
  }

//@@ dbImgStoreBuf
// url given - storing buffer from remote URL
// url undefined - buffer from file
  async dbImgStoreBuf ({ iBuf, force, inum, url, ...idb }){
    const self = this

    if(Array.isArray(iBuf)){
      for(let b of iBuf){
         self.dbImgStoreBuf({ iBuf: b, ...idb })
      }
      return self
    }

    const info = imageinfo(iBuf)
    if (!info) { return self }

    inum = inum ? inum : await self.dbImgInumFree()

    const md5 = srvUtil.md5hex(iBuf)

    let saved, mtime
    if ('mtime' in idb) { mtime = idb.mtime }

    if (!url) {
      saved = await self.dbImgData({ md5 })
      if (saved) {
        if (!force) { return self }

        url = saved.url
      }
    }

    if (!url) {
      const mtimeNowJs = Date.now()
      const mtimeNow = Math.trunc(mtimeNowJs/1000)
      const mtimeStr = strftime('%d_%m_%y.%H.%M.%S', new Date(mtimeNowJs))

      url = `tm://${mtimeStr}@${md5}`

      mtime = mtime ? mtime : mtimeNow
    }

    const mimeType = info.mimeType
    const format   = info.format

    const ext = format.toLowerCase()

    const { width, height } = srvUtil.dictGet(info,'width height')

    const img =`${inum}.${ext}`
    const local = path.join(self.imgRoot, img)

    const writer = fs.createWriteStream(local)
    writer.write(iBuf)

    //const e = exifReader.load(buf,{expanded: true, includeUnknown: true})

    const size = iBuf.length

    if (!saved) {
      const ins = {
        ...idb,
        url,
        inum, img, ext, width, height,
        md5, size, mtime
      }

      const q = insert('imgs',ins)
                  .toParams({placeholder: '?%d'})

      await dbProc.run(self.dbc, q.text, q.values)

    }else{
      const upd = { ...idb }
      const q = update('imgs',upd)
                  .where({ md5 })
                  .toParams({placeholder: '?%d'})

      await dbProc.run(self.dbc, q.text, q.values)
    }

/*    const { tags } = srvUtil.dictGet(idb,'tags')*/
    //if (tags) {
      //const tagList = tags.split(',')
                  //.filter(x => x.length)
                  //.map(tag => { return { tag, url } })

      //const qt = insert('_info_imgs_tags', tagList)
                //.toParams({placeholder: '?%d'})
      //await dbProc.run(self.dbc, qt.text, qt.values)
    /*}*/

    return self
  }

//@@ dbImgStoreFile
  async dbImgStoreFile ({ iFile, force, ...idb }){
    const self = this

    if(Array.isArray(iFile)){
      for(let f of iFile){
         self.dbImgStoreFile({ iFile: f, ...idb })
      }
      return self
    }

    if(!fs.existsSync(iFile)){ return self }

    const iBuf = fs.readFileSync(iFile)

    await self.dbImgStoreBuf({ iBuf, force, ...idb })

    return self
  }

//@@ dbImgStoreUrl
  async dbImgStoreUrl ({ iUrl, ...idb }) {
    const self = this

    const rw = await self.dbImgData({ url : iUrl })
    if (rw) { console.log(`[Img] Image already stored: ${iUrl}`); return self }

    const { buf, info, headers } = await srvUtil.fetchImg({ url : iUrl })
    if (!info) { return self }

    const mtimeNowJs = Date.now()
    const mtimeNow = Math.trunc(mtimeNowJs/1000)

    await self.dbImgStoreBuf({
        iBuf  : buf,
        url   : iUrl,
        mtime : mtimeNow,
        ...idb
    })

    return self
  }

}

module.exports = { ImgClass }
