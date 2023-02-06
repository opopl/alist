

const _ = require('lodash')
const db = require('./../db')
const dbProc = require('./../dbproc')

const path = require('path')
const fs = require('fs')
const srvUtil = require('./../srv-util')

const util = require('util')

const fsFileRemove = util.promisify(fs.unlink)

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

    this.initDb()
  }

//@@ initDb
  async initDb(){
    const self = this

    const info = {}

    const q = `
        SELECT
            m.name as tbl,
            p.name as col
        FROM
            sqlite_master m
        LEFT OUTER JOIN
            pragma_table_info((m.name)) p
        ON m.name <> p.name
        ORDER BY tbl, col
    `

    const rows = await dbProc.all(self.dbc, q, [])
    for(let rw of rows){
      const tbl = rw.tbl
      const col = rw.col
      if (/^sqlite_/.test(tbl)) { continue }
      if (info[tbl] === undefined) { info[tbl] = { cols : [] } }
      info[tbl].cols.push(col)
    }

    self.tableInfo = info

    return self
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

    const cols = _.get(self, 'tableInfo.imgs.cols', [])
    const colsEq = ['url','md5','sec','proj']
    const fi = cols.map((x) => {
      const str = colsEq.includes(x) ? `um.${x} AS ${x}` : `i.${x} AS ${x}`
      return str
    }).join(',')

    for (let [col, value] of Object.entries(whr)) {
      if (colsEq.includes(col)) {
        whr[`um.${col}`] = whr[col]
        delete whr[col]
      }
    }

    const q_data = select(fi)
                .from('url2md5 AS um')
                .innerJoin('imgs AS i')
                .on({ 'um.md5' : 'i.md5' })
                .where(whr)
                .toParams({placeholder: '?%d'})
    const q = q_data.text

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
      const tInfo = `_info_imgs_tags`
      for(let tag of tagList){
        let tbl = `${tInfo}_${i}`
        qArr.push(`
            INNER JOIN ${tInfo} AS ${tbl} ON
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

//@@ imgDeleteCopyUrl
  async imgDeleteCopyUrl ({ url, md5, imgFile, imgFileEx }){
    const self = this
    let ok = true
    ok = ok && url && md5
    ok = ok && imgFile && imgFileEx
    if (!ok) { return self }
    const tInfo = '_info_imgs_tags'
    const rwMain = await dbProc.get(self.dbc, `SELECT * FROM imgs WHERE url = ?`, [ url ])
    if (rwMain) {
      // delete all tag entries for all urls
      await dbProc.run(self.dbc, `
            DELETE FROM ${tInfo}
            WHERE url IN (SELECT url FROM url2md5 WHERE md5 = ? )`, [ md5 ])
      await dbProc.run(self.dbc, `DELETE FROM imgs WHERE url = ?`, [ url ])
      await dbProc.run(self.dbc, `DELETE FROM url2md5 WHERE md5 = ?`, [ md5 ])
      // delete local file
      await fsFileRemove(imgFile)
    }else{
      // delete tag entries for this url
      await dbProc.run(self.dbc, `
            DELETE FROM ${tInfo}
            WHERE url = ? `, [ url ])
      await dbProc.run(self.dbc, `DELETE FROM url2md5 WHERE url = ?`, [ url ])
    }

    return self
  }

//@@ imgDeleteSingle
  async imgDeleteSingle ({ url, md5, imgFile, imgFileEx }){
    const self = this
    let ok = true
    ok = ok && url && md5
    ok = ok && imgFile && imgFileEx
    if (!ok) { return self }

    const tInfo = '_info_imgs_tags'

    await dbProc.run(self.dbc, `DELETE FROM ${tInfo} WHERE url = ?`, [ url ])
    await dbProc.run(self.dbc, `DELETE FROM url2md5 WHERE md5 = ?`, [ md5 ])
    await dbProc.run(self.dbc, `DELETE FROM imgs WHERE md5 = ?`, [ md5 ])

    await fsFileRemove(imgFile)

    return self
  }

//@@ imgDelete
  async imgDelete ({ url } = {}){
    const self = this

    let imgData, md5, imgFile, imgFileEx
    if (url) {
      imgData = await self.dbImgData({ url })
      if (imgData) {
        md5 = imgData.md5
        const img = imgData.img
        imgFile =  path.join(self.imgRoot, img)
        imgFileEx = fs.existsSync(imgFile)
      }
    }
    // single url
    const { cnt } = await dbProc.get(self.dbc, `select count(*) cnt from url2md5 where md5 = ?`, [ md5 ])
    if (cnt == 1) {
      await self.imgDeleteSingle({ url, md5, imgFile, imgFileEx })
    }else if (cnt > 1){
      await self.imgDeleteCopyUrl({ url, md5, imgFile, imgFileEx })
    }

    return self
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
  async dbImgStoreBuf ({ iBuf, force, inum, url, mtime, ...idb }){
    const self = this

    if(Array.isArray(iBuf)){
      for(let b of iBuf){
         self.dbImgStoreBuf({ iBuf: b, force, ...idb })
      }
      return self
    }

    const info = imageinfo(iBuf)
    if (!info) { return self }

    inum = inum ? inum : await self.dbImgInumFree()

    const md5 = srvUtil.md5hex(iBuf)

    let saved
    const saved_md5 = await self.dbImgData({ md5 })

    if (!url) {
      saved = saved_md5
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

    if(!fs.existsSync(local) || !saved_md5){
      const writer = fs.createWriteStream(local)
      writer.write(iBuf)
    }

    //const e = exifReader.load(buf,{expanded: true, includeUnknown: true})

    const size = iBuf.length

    const tInfo = '_info_imgs_tags'

    if (!saved) {

      if (!saved_md5) {
        const ins = {
          ...idb,
          url,
          inum, img, ext, width, height,
          md5, size, mtime
        }

        const q = insert('imgs',ins)
                    .toParams({placeholder: '?%d'})

        await dbProc.run(self.dbc, q.text, q.values)
      }

      const { sec, proj } = { ...idb }
      const qum = insert('url2md5',{ url, md5, sec, proj })
                    .toParams({placeholder: '?%d'})
      await dbProc.run(self.dbc, qum.text, qum.values)

    }else{
      const upd = { mtime, ...idb }
      const q = update('imgs',upd)
                  .where({ md5 })
                  .toParams({placeholder: '?%d'})

      await dbProc.run(self.dbc, q.text, q.values)
      await dbProc.run(self.dbc, `delete from ${tInfo} where url = ?`, [url])
    }

    const { tags } = srvUtil.dictGet(idb,'tags')
    if (tags) {
      const tagList = tags.split(',')
                  .filter(x => x.length)
                  .map(tag => { return { tag, url } })

      const qt = insert(tInfo, tagList)
                .toParams({placeholder: '?%d'})
      await dbProc.run(self.dbc, qt.text, qt.values)
    }

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

    const stats = fs.statSync(iFile)
    const mtime = Math.trunc(stats.mtimeMs/1000)

    await self.dbImgStoreBuf({ iBuf, force, mtime, ...idb })

    return self
  }

//@@ dbImgStoreUrl
  async dbImgStoreUrl ({ iUrl, force, ...idb }) {
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
        force,
        ...idb
    })

    return self
  }

}

module.exports = { ImgClass }
