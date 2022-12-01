// Import database
const db = require('./../db')
const dbProc = require('./../dbproc')

//@@ jsonSecCount
const jsonSecCount = async (req, res) => {

  const q_count = db.sql.select('COUNT(*) AS cnt').from('projs').toString()
  //var row = await db.prj.get(q,(err,row) => {} )
     //res.json(row)
  //})
        //
  var data = await dbProc.get(db.prj, q_count, [])
  res.json(data)
}

//@@ dbSecData
const dbSecData = async (ref={}) => {
  const sec = ref.sec || ''

  const q_sec = db.sql.select('*')
              .from('projs')
              .where({ 'sec' : sec })
              .toParams({placeholder: '?%d'})

  var secData = await dbProc.get(db.prj, q_sec.text, q_sec.values)
  var sec_file = secData.file

  const q_ch = db.sql.select('sec')
      .from('projs')
      .innerJoin('tree_children')
      .on({ 'projs.file' : 'tree_children.file_child' })
      .where({ 'tree_children.file_parent' : sec_file })
      .toParams({placeholder: '?%d'})

  var rows_ch =  await dbProc.all(db.prj, q_ch.text, q_ch.values)
  var children = []
  rows_ch.map((rw) => { children.push(rw.sec) })

  secData['children'] = children

  return secData

}

//@@ jsonSecData
const jsonSecData = async (req, res) => {
  const query = req.query

  console.log(query);
  var data = await dbSecData(query)
  res.json(data)

}

//const jsonSecSrc = async (req, res) => {
  //const query = req.query

  //const sec = query.sec || ''

  ////const q_file = db.sql.select('file').from('projs')

  ////db.prj.get(q_file.text, q_file.values, (err,row) => {
  ////})
  ////var data = {}
  ////console.log(Object.keys(res));
  ////console.log(typeof res);
  //var data = { ...res }
  //await secData(req, data)
  //console.log(data);
  //res = data
  ////res = data

/*}*/

//exports.secHtml = async (req, res) => {
/*}*/

module.exports = { 
    jsonSecData, 
    jsonSecCount 
}

