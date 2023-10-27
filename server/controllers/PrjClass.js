
const _ = require('lodash')
const { spawn, execSync } = require('child_process')

const path = require('path')
const util = require('util')
const fs = require('fs')
const fse = require('fs-extra')
const fsp = fs.promises

const cheerio = require("cheerio")
const yaml = require('js-yaml')

const pdftk = require('node-pdftk')

const db = require('./../db')
const dbProc = require('./../dbproc')
const srvUtil = require('./../srv-util')

const findit = require('findit')

const select = db.sql.select
const insert = db.sql.insert
const update = db.sql.update

const fsMove = srvUtil.fsMove
const fsMakePath = srvUtil.fsMakePath

const { AuthClass } = require('./AuthClass')
const { ImgClass } = require('./ImgClass')

const PrjClass = class {
//@@ new
  constructor(ref={}){
     this.dbc = db.prj
     this.dbc_bld = db.bld

     this.initDirs()

     this.imgman = new ImgClass()

     this.target = ''
     Object.assign(this, ref)

     this.auth = new AuthClass()

     this.htmlBare = `<!DOCTYPE html>
    <html>
      <head> <title></title>
         <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      </head>
      <body></body>
    </html>`
  }

//@@ initDirs
  initDirs () {
     this.prjRoot  = path.join(process.env.P_SR)

     this.htmlOut  = path.join(process.env.HTMLOUT)
     this.pdfOut   = path.join(process.env.PDFOUT)

     this.imgRoot  = path.join(process.env.IMG_ROOT)
     this.docRoot  = path.join(process.env.DOC_ROOT)

     this.jsRoot  = path.join(this.htmlOut,'ctl','js')
     this.cssRoot = path.join(this.htmlOut,'ctl','css')

     this.picDataDir = path.join(process.env.PIC_DATA)
     this.plgDir     = path.join(process.env.PLG)

     return this
  }

//@@ getSiteHostData
// projs#url#site#hosts_data
  getSiteHostData () {
    const self = this

    const yFileHosts = path.join(self.prjRoot, 'scrape', 'bs', 'in', 'hosts.yaml')

    const yEx = fs.existsSync(yFileHosts)
    const shData = yEx ? yaml.load(fs.readFileSync(yFileHosts)) : {}

    return shData
  }

//@@ getSiteFromUrl
  getSiteFromUrl ({ url }) {
    const self = this

    const u = new URL(url)
    const host = u.hostname

    if (!host) { return {} }

    const shData = self.getSiteHostData()

    let site, prefii
    for (let [hostPatternStr, hostDict] of Object.entries(shData)) {

      const hostPatterns = hostPatternStr.split(',').map(x => x.trim())
      for(let hostPattern of hostPatterns ){
        const re = new RegExp(hostPattern)
        if (re.test(host)) {
          site = hostDict.site
          if (!site) { continue }

          const sitePref = hostDict.prefii
          prefii = sitePref ? sitePref : `stz.${site}`
          break
        }
      }

      if (site) { break }
    }

    return { site, prefii }
  }

//@@ iiDataFromUrl
  async iiDataFromUrl ({ url }) {
    const self = this

    const iiData = {}

    const { site, prefii } = self.getSiteFromUrl({ url })

    let fbAuthId, fbGroupId, fbPostId
    if (site == 'com.us.facebook'){
      //let fb_data   = projs#url#fb#data({
      ( { fbAuthId, fbGroupId, fbPostId } = self.getUrlFacebookData({ url }) )
    }

    let rw, authId, authName, authPlain
    if (fbAuthId) {
       const q = `select a.id, a.name, a.plain from authors a
                  inner join auth_details as ad
                  on a.id = ad.id
                  where fb_id = ?`
       const p = [ fbAuthId ]

       rw = await dbProc.get(db.prj, q, p)

    } else if (fbGroupId) {
       const q = `select a.id, a.name, a.plain from authors a
                  inner join auth_details ad
                  on a.id = ad.id
                  where fb_group_id = ?`
       const p = [ fbGroupId ]

       rw = await dbProc.get(db.prj, q, p)
    }

    if (rw) { authId = rw.id; authName = rw.name; authPlain = rw.plain }

    return { authId, authName, authPlain, prefii }
  }

//@@ getUrlFacebookData
  getUrlFacebookData({ url }){
    const self = this

    const u = new URL(url)

    const host = u.hostname
    const path = u.pathname

    const query = {}
    u.searchParams.forEach(function(value, key){
      query[key] = value
    })
    const pathArr = path.split('/').filter(x => x.length)
    const pathFront = pathArr.shift()

    let fbAuthId, fbGroupId, fbPostId
    if (pathFront == 'permalink.php'){
      fbPostId = query.story_fbid
      if (fbPostId) { fbAuthId = query.id }
    }
    else if (pathFront == 'groups'){
      fbGroupId = pathArr.shift()

    }else{
      fbAuthId = pathFront
    }

    return { fbAuthId, fbGroupId, fbPostId }
  }

//@@ dbBldData
  async dbBldData (w={}) {
    const self = this

    const q = select(`*`)
           .from('builds')
           .where(w)
           .toParams({placeholder: '?%d'})

    const builds = await dbProc.all(self.dbc_bld, q.text, q.values)
    return builds
  }

//@@ secTxt
  async secTxt (ref={}) {
    const self = this

    //const sec = _.get(ref, 'sec', '')

    const sd = await self.dbSecData(ref)
    if (!sd) { return }

    const file = sd.file

    const file_path = path.join(self.prjRoot, file)

    var secTxt = await srvUtil.fsRead(file_path)
    return secTxt
  }

//@@ secDate
  secDate (ref = {})  {
    const self = this

    const sec =  _.get(ref, 'sec', '')
    const proj = _.get(ref, 'proj', self.proj)

    const m = /^(?<day>\d+)_(?<month>\d+)_(?<year>\d+)\.(\S+)$/.exec(sec)
    if (!m) { return {} }

    let { day, month, year } = srvUtil.dictGet(m.groups,'day month year')
    //day = Number(day)
    day = day.replace(/^0/,'')
    month = month.replace(/^0/,'')

    return { day, month, year }
  }

//@@ dbSecList
  async dbSecList (ref={}) {
    const self = this

    const proj = _.get(ref, 'proj', self.proj)

    var list = []

    return list
  }

//@@ _secNewLines
  _secNewLines({
       seccmd, append, prepend,

       sec, parent, url, author_id, date,
       tags, title,
       keymap, ext
  }){
    const self = this

    append = append ? append : []
    prepend = prepend ? prepend : []

    const labelStr = `\\label{sec:${sec}}`
    const lines = []

    const head = self._secHead({
       sec, parent, url, author_id, date,
       tags, title,
       keymap, ext
    })
    lines.push(...head, ...prepend)

    if (seccmd && title) {
       lines.push('', `\\${seccmd}{${title}}`, labelStr, '')
       if (url) { lines.push(`\\Purl{${url}}`) }
       if (author_id) { lines.push(
                    '\\ifcmt',
                    ' author_begin',
                    `   author_id ${author_id}`,
                    ' author_end',
                    '\\fi',
                )}
    }

    lines.push(...append)

    return lines
  }

//@@ _secHead
  _secHead({
     sec, parent, url, author_id, date,
     tags, title,
     keymap, ext
  }){
    const self = this

    ext = ext ? ext : 'tex'

    const head = []
    if (ext == 'tex') {
       if (keymap) {
          head.push(`% vim: keymap=${keymap}`)
       }
       head.push('%%beginhead ')
       head.push(' ')
       head.push(`%%file ${sec || ''}`)
       head.push(`%%parent ${parent || ''}`)
       head.push(' ')
       head.push(`%%url ${url || ''}`)
       head.push(' ')
       head.push(`%%author_id ${author_id || ''}`)
       head.push(`%%date ${date || ''}`)
       head.push(' ')
       head.push(`%%tags ${tags || ''}`)
       head.push(`%%title ${title || ''}`)
       head.push(' ')
       head.push('%%endhead ')
    }

    return head

  }

//@@ _secFilePath
  _secFilePath ({ file }){
     const self = this

     return path.join(self.prjRoot, file)
  }

//@@ _secFile
  _secFile ({ sec, proj, rootid }){
     const self = this

     proj = proj ? proj : self.proj
     rootid = rootid ? rootid : self.rootid
     if (!sec || !proj) { return self }

     const fileA = self._secFileA({ sec, proj, rootid })
     const file = path.join(...fileA)

     return file
  }

//@@ _secFileA
  _secFileA({ sec, proj, rootid }){
     const self = this

     proj = proj ? proj : self.proj
     rootid = rootid ? rootid : self.rootid

     if (!sec || !proj) { return [] }

     const fileA = []

    //my $run_ext = $^O eq 'MSWin32' ? 'bat' : 'sh';
          //
     const extss = 'vim pl zlan sql yml'
     const exts = extss.split(/\s+/)

     var do_break, m
     while(1){

       if (sec == '_main_') {
          fileA.push(`${proj}.tex`)
          break
       }

       if (sec == '_main_htlatex_') {
          fileA.push(`${proj}.main_htlatex.tex`)
          break
       }

       if (sec == '_bib_') {
          fileA.push(`${proj}.refs.bib`)
          break
       }

       exts.forEach((ext) => {
           const extSec = `_${ext}_`
           if (sec == extSec) {
              fileA.push(`${proj}.${ext}`)
              do_break = true
           }
       })
       if (do_break) { break }

       m = /^_bld\.(?<target>.*)$/.exec(sec)
       if (m) {
          fileA.push(`${proj}.bld.${m.groups.target}.yml`)
          break
       }

       m = /^_perl\.(?<sec_pl>.*)$/.exec(sec)
       if (m) {
          fileA.push(`${proj}.${m.groups.sec_pl}.pl`)
          break
       }

       m = /^_pm\.(?<sec_pm>.*)$/.exec(sec)
       if (m) {
          fileA.push('perl', 'lib', 'projs')
          fileA.push(rootid, proj)
          fileA.push(`${m.groups.sec_pm}.pm`)
          break
       }

       fileA.push(`${proj}.${sec}.tex`)
       break
     }

     return fileA
  }

/*sub sec_insert_child {*/
    //my ($self, $ref) = @_;
    //$ref ||= {};

    //my $file = $sd->{file};

    //$self->sec_insert({
        //sec  => $sec,
        //proj => $proj,
        //lines => \@ii_lines,
    //});

    //my $file_child = $sdc->{file};
    //return $self unless $sdc && $sdc->{'@file_ex'};

    //# insert children
    //my $ins_child = {
       //file_parent => $file,
       //file_child  => $file_child,
    //};

    //dbh_insert_update_hash({
       //dbh  => $self->{dbh},
       //t    => 'tree_children',
       //h    => $ins_child,
       //uniq => 1,
    //});

    //return $self
/*}*/

//@@ secInsertChild
  async secInsertChild ({ sec, proj, child }){
    const self = this

    proj = proj ? proj : self.proj

    const sd  = await self.dbSecData({ sec, proj })
    const sdc = await self.dbSecData({ sec: child, proj })

    if (!sd || !sdc) { return self }

    const children = sd.children
    if (children.includes(child)) { return self }

    const file = sd.file
    const fileChild = sdc.file

    const iiLines = []
    iiLines.push(`\\ii{${child}}`)

    await self.secInsert({ sec, proj, lines: iiLines })

    const insChild = {
      file_parent : file,
      file_child : fileChild
    }

    const q = insert('tree_children',insChild)
               .toParams({placeholder: '?%d'})

    await dbProc.run(self.dbc, q.text, q.values )

    return self
  }

//@@ secInsert
  async secInsert ({ sec, proj, lines }){
    const self = this

    if (!lines || !lines.length) { return self }
    proj = proj ? proj : self.proj

    const sd = await self.dbSecData({ sec, proj })
    if (!sd) { return self }

    const file = sd.file
    const filePath = path.join(self.prjRoot, file)

    const opts = { encoding : 'utf8', flag : 'a' }
    await srvUtil.fsWriteFile(filePath, lines.join('\n') + '\n', opts)

    return self
  }

//@@ secNew
  async secNew ({
          url, sec, parent, rw, append, prepend,
          seccmd, title,
          author_id, tags,
          date
    }){

    const self = this
    var ok = true
    var msg = ''

    const { proj, rootid } = srvUtil.dictGet(self,'proj rootid')

    const sd = await self.dbSecData({ proj, sec })

    var file, filePath, fileEx
    if (sd) {
      file = _.get(sd,'file')
      filePath = path.join(self.prjRoot, file)
      fileEx = fs.existsSync(filePath)
      if (!rw && fileEx) {
        ok = false; msg = 'section file exists'
        return { ok, msg }
      }
    }

    file = self._secFile({ sec })
    filePath = self._secFilePath({ file })

    const secLines = self._secNewLines({
        url, sec, parent, append, prepend,
        seccmd, title, tags, author_id, date
    })
    const secTxt = secLines.join('\n') + '\n'

    try {
      srvUtil.fsWrite(filePath, secTxt)
    } catch(e) {
      msg = `file write error: ${e}`
      ok = false
      return { ok, msg }
    }

    //todo git add
    const fileBn = path.basename(filePath)
    process.chdir(self.prjRoot)
    execSync(`git add ${fileBn}`)

    if (!sd) {
        const ins = {
          url, sec, file, proj, rootid,
          parent, title, tags, author_id,
          date
        }

        const q_ins = insert('projs',ins)
               .toParams({placeholder: '?%d'})

        await dbProc.run(self.dbc, q_ins.text, q_ins.values)

        const base2info = { tags : 'tag' }
        const tBase = 'projs'
        const joinCol = 'file'
        const joinValue = file
        const info = { tags, author_id }

        await dbProc.infoInsert({ db: self.dbc, base2info, tBase, joinCol, joinValue, info })

        if (date) {
          //check if 'dated' sec exists
          const sec_dated = date
          const title_dated = date.replace(/_/g,'-')
          const sd_dated = await self.dbSecData({ sec: sec_dated, proj })
          if(sec != sec_dated){
            if (!sd_dated) {
              await self.secNew({
                sec: sec_dated,
                seccmd : 'section',
                title : title_dated,
                date,
              })
            }

            await self.secInsertChild({ sec: sec_dated, proj, child: sec })
          }
        }
    }

    return { ok, msg }
  }

//@@ dbSecSelect
  async dbSecSelect (ref={})  {
    const self = this
    const sec = ref.sec || ''
  }

//@@ dbSecPicData
  async dbSecPicData ({ proj, sec, where, limit, offset })  {
    const self = this

    if (!proj) { proj = self.proj }

    offset = parseInt(offset || 1)
    limit = parseInt(limit || 0)

    var picData = []

    const sd = await self.dbSecData({ sec, proj })
    if (!sd) { return }

    const w_tags = where ? _.get(where,'tags',[]) : []

    let child, children
    let iiList = [ sec ]

    let picIndex = 0
    while(iiList.length){
       child = iiList.shift()
       const sdc = await self.dbSecData({ proj, sec: child })
       if (!sdc) { continue }

       //const q = select('sec, url, caption, name').from('imgs')
                //.where({ proj, sec: child })
                //.orderBy('mtime')
                //.toParams({placeholder: '?%d'})

       const fi = ['sec','url','caption','name','mtime'].map(x => {
         const str = x == 'url' ? `um.url url` : `i.${x} ${x}`
         return str
       })
       const w = {
          'um.proj' : proj,
          'um.sec': child,
          //'um.md5' : '49674ec7441bc69afa6c1e4a09952af9'
       }
       const q = select(fi).from('url2md5 um')
                .innerJoin('imgs i')
                .on({ 'um.md5' : 'i.md5' })
                .where(w)
                .orderBy('um.mtime')
                .toParams({placeholder: '?%d'})

       const rows = await dbProc.all(self.imgman.dbc, q.text, q.values)
       for(let rw of rows){
          const url = rw.url
          const q_tags = select('tag').from('_info_imgs_tags')
                  .where({ url })
                  .toParams({placeholder: '?%d'})
          const tags_r = await dbProc.all(self.imgman.dbc, q_tags.text, q_tags.values)
          const tags = tags_r.map((x) => { return x.tag })

          var okt = true
          w_tags.map((x) => { okt = okt && tags.includes(x) })
          if (!okt) { continue }

          var ok = true
          ok = ok && (picIndex >= (offset-1))
          if (limit) { ok = ok && ((picIndex-offset+1) < limit) }

          rw = { ...rw, tags, picIndex }
          picIndex += 1
          if (!ok) { continue }

          picData.push(rw)
       }

       children = sdc.children
       iiList.push(...children)
    }

    return picData
  }

//@@ getSecPdfInfo
  async getSecPdfInfo ({ sec, proj }) {
    const self = this

    proj   = proj ? proj : self.proj
    if (!sec) { return }

    const target = `_buf.${sec}`
    const pdfFile = self.pdfFileTarget({ proj, target })
    const pdfFileEx = fs.existsSync(pdfFile)
    if (!pdfFileEx) { return }

    const pInfo = new Promise(async(resolve,reject) => {
      pdftk
        .input(pdfFile)
        .dumpData()
        .output()
        .then(async(buffer) => {
          const infoStr = buffer.toString()
          const info = infoStr.split('\n')
          let nPages
          for(let x of info){
            x = x.trim()
            const m = /^NumberOfPages:\s+(?<num>\d+)$/g.exec(x)
            if (!m) { continue }
            nPages = parseInt(m.groups.num)
            if (nPages) { break }
          }
          resolve({ nPages, infoStr })
        })
    })
    const { nPages, infoStr } = await pInfo

    return { nPages, infoStr }
  }

//@@ getSecFsNewList
  async getSecFsNewList ({ proj, rootid } = {}) {
    const self = this

    proj   = proj ? proj : self.proj
    rootid = rootid ? rootid : self.rootid

    const dirNew = path.join(self.picDataDir, rootid, proj, 'new')

    const finder = findit(dirNew)
    const ff = new Promise((resolve, reject) => {
       const found = {}
       finder.on('directory', function (dir, stat, stop) {
         const sec = path.basename(dir)
         const rel = path.relative(dirNew, dir)
         if (! /^[^\/]+$/.test(rel)) { return }

         found[sec] = 1
       })

       finder.on('end', () => { resolve(found) })
    })

    const found = await ff
    for(let sec in found){
      const sd = await self.dbSecData({ sec, proj  })
      if (!sd) { delete found[sec] }
    }

    return Object.keys(found)
  }

//@@ secFsNew
  async secFsNew ({ sec, proj })  {
    const self = this
    proj = proj ? proj : self.proj

    const {
      exNew, exDone,
      secDirNew, secDirDone
    } = self._secFsData({ sec, proj })

    if (exNew) { return self }

    // create new
    if (!exDone) {
      for(let x of ['cmt','orig','html'] ){
         const xDir = path.join(secDirNew, x)
         await fsMakePath(xDir,{ recursive : true })
      }

    // move done => new
    }else if(!exNew){
      await fsMakePath( path.dirname(secDirNew),{ recursive : true }).then(async() => {
         await fsMove( secDirDone, secDirNew )
      })
    }

    return self
  }

//@@ secFsDone
  async secFsDone ({ sec, proj })  {
    const self = this
    proj = proj ? proj : self.proj

    const {
      exNew, exDone,
      secDirNew, secDirDone
    } = self._secFsData({ sec, proj })

    if (exDone) { return self }

    if (!exNew) {
      await self.secFsNew({ sec, proj })
    }

    await fsMove( secDirNew, secDirDone )

    return self
  }

//@@ _secFsData
  _secFsData ({ sec, proj })  {
    const self = this
    proj = proj ? proj : self.proj

    const { secDirNew, secDirDone } = self.secDirsSaved({ sec, proj })

    const exNew = fs.existsSync(secDirNew)
    const exDone = fs.existsSync(secDirDone)

    return {
      exNew, exDone,
      secDirNew, secDirDone
    }
  }

//@@ dbAuthors
  async dbAuthors ({ proj } = {})  {
    const self = this

    if (!proj) { proj = self.proj }

    const tInfo = '_info_projs_author_id'
    const q = `SELECT DISTINCT ad.id id,
                        ad.fb_id fb_id,
                        ad.fb_url fb_url,
                        a.plain plain,
                        a.name name
               FROM ${tInfo} info

               INNER JOIN auth_details ad
               ON info.author_id = ad.id

               INNER JOIN authors a
               ON info.author_id = a.id

               ORDER BY id
                `

    const authors = await dbProc.all(self.dbc, q, [])
    return { authors }
  }

//@@ dbSecTree
  async dbSecTree ({ sec, proj, sd })  {
    const self = this

    proj = proj ? proj : self.proj
    if (!sd) { sd = await self.dbSecData({ sec, proj })}

    let children = sd.children
    let tree = { sec, chd : [] }

    if (children.length) {
      for(let child of children){
        const tr = await self.dbSecTree({ sec: child, proj })
        if (tr && tr.tree) { tree.chd.push(tr.tree) }
      }
    }

    return { tree }
  }

//@@ dbTargets
  async dbTargets ({ proj } = {})  {
    const self = this

    if (!proj) { proj = self.proj }

    const q_trg = select('*')
                .from('targets')
                .where({ proj })
                .orderBy('target')
                .toParams({placeholder: '?%d'})

    const rows_trg =  await dbProc.all(self.dbc, q_trg.text, q_trg.values)
    const targets = []
    rows_trg.map((rw) => { targets.push(rw.target) })
    return targets
  }

//@@ dbSecData
  async dbSecData (whr={})  {
    const self = this

    let { proj, sec } = srvUtil.dictGet(whr,'sec proj')
    if (!proj) { proj = self.proj }

    const q_sec = select('*')
                .from('projs')
                .where(whr)
                .toParams({placeholder: '?%d'})

    var secData = await dbProc.get(self.dbc, q_sec.text, q_sec.values)
    if (!secData) { return }

    if (!sec) { sec = secData.sec }

    var sec_file = secData.file

    const q_ch = select('sec')
        .from('projs')
        .innerJoin('tree_children')
        .on({ 'projs.file' : 'tree_children.file_child' })
        .where({ 'tree_children.file_parent' : sec_file })
        .toParams({placeholder: '?%d'})

    var rows_ch =  await dbProc.all(self.dbc, q_ch.text, q_ch.values)
    var children = []
    rows_ch.map((rw) => { children.push(rw.sec) })

    secData['children'] = children

    const b2info = { tags : 'tag' }
    const bcols = [ 'author_id', 'tags' ]

    const p_info = bcols.map(async (bcol) => {
       const icol = _.get(b2info, bcol, bcol)
       const t_info = `_info_projs_${bcol}`

       const q_info = select(`${t_info}.${icol}`)
                .from('projs')
                .innerJoin(`${t_info}`)
                .on({ 'projs.file' : `${t_info}.file` })
                .where({ 'projs.sec' : sec })
                .toParams({placeholder: '?%d'})

       const rows_info =  await dbProc.all(self.dbc, q_info.text, q_info.values)
       secData[bcol] = rows_info.map((x) => { return x[bcol] })
    })
    await Promise.all(p_info)

    const target = `_buf.${sec}`

    const htmlFile = self.htmlFileTarget({ proj, target })
    const html  = fs.existsSync(htmlFile) ? 1 : 0

    const pdfFile = self.pdfFileTarget({ proj, target })
    const pdf  = fs.existsSync(pdfFile) ? 1 : 0

    var output = { pdf, html }
    secData = { ...secData, output }

    return secData
  }

//@@ callPrjGetImg
  async callPrjGetImg ({
        proj, sec, url,
        tags, caption, cbi }) {
    const self = this

    const exe = `prj-get-img`
    const args = []
    args.push('-c', 'fetch_uri' )
    args.push('-p', `${proj}` )
    args.push('-s', `${sec}` )
    args.push('--uri', `${url}` )

    if (tags) { args.push('--uri_tags', `${tags}` ) }
    if (caption) { args.push('--uri_caption', `${caption}` ) }

    const cmd = [ exe, ...args ].join(' ')
    //execSync(cmd, { stdio: 'inherit' })

    const ff = () =>  {
       return new Promise(async (resolve, reject) => {
         const spawned = spawn(exe, args, {})
         var stdout = []

         spawned.on('exit', (code) => {
           resolve({ code, stdout })
         })

         for await (const data of spawned.stdout) {
           console.log(`${data}`);
           const a = `${data}`.split('\n')
           a.map((x) => { stdout.push(x) })
         }
       })
    }

    const { code, stdout } = await ff()

    if (cbi) { cbi({ code, stdout }) }

    return self
  }

//@@ secPicImport
  async secPicImport ({ pic, sec, proj, rootid, cbi }) {
    const self = this

    proj = proj ? proj : self.proj
    rootid = rootid ? rootid : self.rootid

    const caption = _.get(pic,'caption','')
    const url_parent = _.get(pic,'url_parent')

    const url = _.get(pic,'url')
    if (!url) { return self }

    const tagsA = _.get(pic,'tags',[]) || []
    const tags = tagsA.join(',')
    const url_childof = _.get(pic, 'childof', '')
    console.log({ url_childof })

    const idb = { rootid, proj, sec, tags, caption, url_parent, url_childof }
    //await self.callPrjGetImg({ url, ...idb, cbi })

    await self.imgman.dbImgStoreUrl({ iUrl: url, ...idb })

    return self
  }

//@@ secRowUpdate
  async secRowUpdate ({ row, proj, do_tree }) {
     const self = this

     const sec  = row.sec
     const file = row.file

     proj = proj ? proj : self.proj

     const target = `_buf.${sec}`
     const htmlFile = self.htmlFileTarget({ proj, target })
     const htmlEx  = fs.existsSync(htmlFile) ? 1 : 0
     const pdfFile = self.pdfFileTarget({ proj, target })
     const pdfEx  = fs.existsSync(pdfFile) ? 1 : 0

     row._pdf = {
         href : `/prj/sec/html?sec=${sec}&tab=pdf`,
         target_ext : 'pdf',
         output_ex : pdfEx,
     }
     row._html = {
         href : `/prj/sec/html?sec=${sec}`,
         target_ext : 'html',
         output_ex : htmlEx,
     }

     const options = row.options
     if (options) { row.options = JSON.parse(options) }

     const qt = ` SELECT td.tag, td.name FROM _info_projs_tags AS it
                  INNER JOIN tag_details AS td
                  ON it.tag = td.tag
                  WHERE it.file = ?`

     const qa = ` SELECT author_id FROM _info_projs_author_id AS ia
                  WHERE ia.file = ?`

     const pf = [ row.file ]

     const tags = (await dbProc.all(self.dbc, qt, pf))
     row.tags = tags || []

     const author_ids = (await dbProc.all(self.dbc, qa, pf)).map((x) => { return x.author_id })
     const { authors } = await self.auth.dbAuth({ author_ids })
     row.authors = authors || []

     if (do_tree) {
     }

     return self
  }


//@@ act
  async act ({ act, cnf, target, proj, bldOpts }) {
     const self = this

     proj = proj ? proj : self.proj

     const cnfa = cnf.split(',')
     const do_htlatex = cnfa.includes('htx')

     const sCnf = cnf ? `-c ${cnf}` : ''
     const sTarget = target ? `-t ${target}` : ''

     const bldCmd = `prj-bld ${proj}`

     const target_ext = do_htlatex ? 'html' : 'pdf'
     const m = /^_(buf|auth)\.(.*)$/.exec(target)
     const trg = m ? [ m[1], m[2] ].join('.') : target
     const pln = [ act, target_ext, trg ].join('.')

     const bldData = await self.dbBldData({ plan : pln, status : 'running' })
     if (bldData.length) {
        var msg = `build is already running: ${pln}`
        console.log({ msg });
        return {}
     }
     const tmpDir = path.join(self.tmpDirBase, 'bld', self.rootid, proj, target )
     fsp.mkdir(tmpDir, { recursive : true })
     if (bldOpts) {
        const yBldOpts = yaml.dump(bldOpts)
     }

     const sYaml = ''

     const cmd = `${bldCmd} ${act} ${sCnf} ${sTarget} ${sYaml}`
     console.log(`[PrjClass.act] cmd = ${cmd}`)

     const cmda = cmd.split(/\s+/)
     const exe =  cmda.shift()
     const args = cmda

     process.chdir(self.prjRoot)

     //try {
       ////childProcess.execSync(cmd, { stdio: 'inherit' })
     const opts = {
          //detached : true
     }

     const ff = () =>  {
        return new Promise(async (resolve, reject) => {
          const spawned = spawn(exe, args, opts)
          var stdout = []

          spawned.on('exit', (code) => {
            resolve({ code, stdout })
          })

          for await (const data of spawned.stdout) {
            console.log(`${data}`);
            const a = `${data}`.split('\n')
            a.map((x) => { stdout.push(x) })
          }
        })

       }

     const { code, stdout } = await ff()

     //} catch(e) {
       //console.error(e)
       //code = e.status
       //msg  = e.message
     //}

     const stat = { cmd, code, stdout }

     console.log({ cmd, code });

     return stat
  }

//@@ htmlFileTarget
  htmlFileTarget  (ref = {}) {
    const self = this

    const target = _.get(ref, 'target', self.target)
    const proj   = _.get(ref, 'proj', self.proj)

    const htmlDir  = path.join(self.htmlOut, self.rootid, proj, target)
    const htmlFile = path.join(htmlDir, 'jnd_ht.html')

    return htmlFile
  }

//@@ pdfFileTarget
  pdfFileTarget (ref = {}) {
    const self = this

    const target = _.get(ref, 'target', '')
    const proj   = _.get(ref, 'proj', self.proj)

    const pdfDir  = path.join(self.pdfOut, self.rootid, proj )
    const pdfFile = path.join(pdfDir, `${proj}.${target}.pdf`)

    return pdfFile
  }

//@@ htmlTargetOutput
  async htmlTargetOutput ({ target, proj, force }) {
    const self = this

    proj = proj ? proj : self.proj

    const htmlDir  = path.join(self.htmlOut, self.rootid, proj, target)

    const htmlFile = self.htmlFileTarget({ target, proj })
    const htmlFileDir = path.dirname(htmlFile)

    var html

    if (force && !fs.existsSync(htmlFile)) {
      const act = 'compile'
      const cnf = 'htx'

      const { code, msg, stdout } = await self.act({ act, proj, cnf, target })
      if (code) { return '' }
    }

    if (fs.existsSync(htmlFile)) {
      html = await srvUtil.fsRead(htmlFile)
    }

    if (!html || !html.length) { return }

    const $ = cheerio.load(html)

    self.$ = $

    self.domImg()
        .domCss({ htmlFileDir, target, proj })
        .domScript({ htmlFileDir })
        .domLinks()

    html = $.html()
    return html

  }

//@@ dReMapTarget
  dReMapTarget ({ key }) {
    const map = {
       auth : /^_auth\.(?<author_id>\S+)$/g,
       date : /^_buf\.(?<day>\d+)_(?<month>\d+)_(?<year>\d+)$/g,
       datePost : /^_buf\.(?<day>\d+)_(?<month>\d+)_(?<year>\d+)\.(\S+)$/g,
       sec : /^_buf\.(?<sec>\S+)$/g
    }
    return _.get(map,key)
  }

//@@ domCss
  domCss ({ $, htmlFileDir, target, proj }) {
    const self = this

    $ = $ ? $ : self.$
    proj = proj ? proj : self.proj

    const $css = $('link[type="text/css"]')
    $css.each((i, elem) => {
      var urlCssFs = $(elem).attr('href')

      var fpath = path.resolve(htmlFileDir, urlCssFs)
      if (fs.existsSync(fpath)) {
        var query = `target=${target}&proj=${proj}`
        var urlCss = `/prj/assets/css/main/${urlCssFs}?${query}`
        $(elem).attr({ href : urlCss })
      }
    })

    return self
  }

//@@ domScript
  domScript ({ $, htmlFileDir }) {
    const self = this

    $ = $ ? $ : self.$

    const $script = $('script')
    $script.each((i, elem) => {
      var src = $(elem).attr('src')
      if (!src) { return }

      var fpath = path.resolve(htmlFileDir,src)
      var rel = path.relative(self.jsRoot, fpath)
      var jsUrl = `/prj/assets/js/${rel}`
      $(elem).attr({ src : jsUrl })
    })

    return self
  }


//@@ domImg
  domImg ({ $ } = {}) {
    const self = this

    $ = $ ? $ : self.$

    const $imgs = $('img')
    $imgs.each((i, elem) => {
      const src = $(elem).attr('src')
      const url = $(elem).attr('url')
      if (src) {
         const bn = path.basename(src)
         const inum = bn.replace( /^(?<inum>\d+)\.\w+$/g,'$<inum>')
         if (url) {
            const urlEnc = encodeURIComponent(url)
            $(elem).attr({ 'src' : `/img/raw/url/${urlEnc}` })
         }else{
            $(elem).attr({ 'src' : `/img/raw/${inum}` })
         }
      }
    })

    return self
  }

//@@ domLinks
  domLinks ({ $ } = {}) {
    const self = this

    $ = $ ? $ : self.$

    const $a = $('a')
    $a.each((i, elem) => {
      var href = $(elem).attr('href')
      if (!href) { return }

      const re = /(?<target>[^/\s\t]+)\/jnd_ht\.html$/g
      const m = re.exec(href)
      const target = m ? m.groups.target : ''

      if (!target) { return }

      const re_buf = /^\_buf\.(?<sec>\S+)$/g
      const re_auth = /^\_auth\.(?<auth>\S+)$/g

      const m_buf  = re_buf.exec(target)
      const m_auth = re_auth.exec(target)

      const sec = m_buf ? m_buf.groups.sec : ''
      const author_id = m_auth ? m_auth.groups.auth : ''

      if (sec) {
         $(elem).attr({ 'href' : `/prj/sec/html?sec=${sec}` })

      } else if (author_id){
         $(elem).attr({ 'href' : `/prj/auth/html?id=${author_id}` })
      }

    })

    return self
  }

//@@ domSecTable
  async domSecTable ({ tableData, $, $tbody, colss }) {
    tableData.map((row,i) => {
       const {
           href, hrefPdf,
           date, title, authors,
           htmlEx, pdfEx
       } = srvUtil.dictGet(row, colss)

       const $row = $('<tr/>')

       $row.append($(`<td>${i}</td>`))

       if ((href != undefined) && ( htmlEx != undefined)) {
          var $btn = $(`<button/>`)
              .addClass('prj-link')
              .attr({ output_ex : htmlEx, href })
              .text('HTML')
          $row.append($(`<td/>`).append($btn))
       }

       if (( pdfEx != undefined) && ( hrefPdf != undefined )) {
          var $btn = $(`<button/>`)
              .addClass('prj-link')
              .attr({ output_ex : pdfEx, href : hrefPdf })
              .text('PDF')
          $row.append($(`<td/>`).append($btn))
       }

       if (date != undefined) {
         var $a = $(`<a/>`)
                .addClass('prj-link')
                .attr({ href : `/prj/sec/html?sec=${date}` })
                .text(date)
         $row.append($(`<td/>`).append($a))
       }

       if (authors != undefined) {
         const $cellAuth = $('<td/>')
         if(! authors.length){
         }else if (authors.length == 1) {
            const author = authors.shift()
            const hrefAuthor = `/prj/auth/html?id=${author.id}`
            $cellAuth.append($(`<a href="${hrefAuthor}">${author.plain}</a>`))
         }else{
            const $select = $('<select/>').addClass('prj-link-select')
            while(authors.length){
              const author = authors.shift()
              const hrefAuthor = `/prj/auth/html?id=${author.id}`
              //$select.append($(`<option value="${author.id}">${author.plain}</option>`))
              $select.append($(`
                    <option class="prj-link" full="${author.plain}" value="${author.id}" href=${hrefAuthor}>
                        ${author.plain}
                    </option>`))
            }

            $cellAuth.append($select)
         }

         $row.append($cellAuth)
       }

       $row.append($(`<td><a href="${href}">${title}</a></td>`))

       //const $cell = $('<td/>')
       //$row.append($cell)

       $tbody.append($row)
     })

  }

//@@ htmlFileSecSavedList
  async htmlFileSecSavedList (ref = {})  {
    const self = this

    const sec  = _.get(ref, 'sec', '')
    const proj = _.get(ref, 'proj', self.proj)

    const { secDirNew, secDirDone } = self.secDirsSaved({ sec, proj, sub : 'html' })

    const files = []
    const cb_file = ({ found }) => {
         const bn = path.basename(found)
         if (! /\.html$/g.test(bn)) { return }

         files.push(bn)
    }

    for(let dir of [ secDirDone, secDirNew ]){
       await srvUtil.fsFind({ dir, cb_file });
    }

    return { files }
  }

//@@ htmlFileSecSaved
  async htmlFileSecSaved (ref = {})  {
    const self = this

    const sec  = _.get(ref, 'sec', '')
    const bn   = _.get(ref, 'bn', 'we.html')
    const proj = _.get(ref, 'proj', self.proj)

    console.log('[htmlFileSecSaved] start');

    const { secDirNew, secDirDone } = self.secDirsSaved({ sec, proj, sub : 'html' })

    var htmlFile = ''
    for(let dir of [ secDirDone, secDirNew ]){
      var ff = []
      const cb_file = ({ found }) => {
         const bnFound = path.basename(found)
         if ( bnFound != bn ) { return }
         htmlFile = found
      }
      await srvUtil.fsFind({ dir, cb_file });
    }

    const htmlFileEx = fs.existsSync(htmlFile)

    console.log('[htmlFileSecSaved] end');

    return { htmlFile, htmlFileEx }
  }

//@@ secDirsSaved
  secDirsSaved (ref={}) {
    const self = this

    const sec = _.get(ref, 'sec', '')
    const proj = _.get(ref, 'proj', self.proj)
    const sub = _.get(ref, 'sub', '')

    const dirNew = path.join(self.picDataDir, self.rootid, proj, 'new')
    const dirDone = path.join(self.picDataDir, self.rootid, proj, 'done')

    var secDirNew  = path.join(dirNew, sec)
    if (sub) { secDirNew = path.join(secDirNew, sub) }

    const { day, month, year } = self.secDate({ proj, sec })

    //let yfile = base#qw#catpath('plg','projs data yaml months.yaml')
    //let map_months = base#yaml#parse_fs({ 'file' : yfile })
    const yFile = path.join(self.plgDir, 'projs', 'data', 'yaml', 'months.yaml')
    const yFileEx = fs.existsSync(yFile)
    const mapMonths = yFileEx ? yaml.load(fs.readFileSync(yFile)) : {}
    const monthName = _.get(mapMonths,`en.short.${month}`,month)

    var secDirDone = path.join(dirDone, 'secs', sec)
    if (day && monthName && year){
      secDirDone = path.join(dirDone, year, monthName, day, sec )
    }

    if (sub) { secDirDone = path.join(secDirDone, sub) }

    return { secDirNew, secDirDone }
  }

}

module.exports = { PrjClass }
