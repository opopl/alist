// Import database
const db = require('./../db')

exports.secCount = async (req, res) => {

  const q = db.sql.select('COUNT(*) AS cnt').from('projs').toString()
  db.prj.get(q,(err,row) => {
     res.json(row)
  })
}

exports.secData = async (req, res) => {
  const query = req.query

  const sec = query.sec || ''

  const q_sec = db.sql.select('*')
              .from('projs')
              .where({ 'sec' : sec })
              .toParams({placeholder: '?%d'})

  db.prj.get(q_sec.text, q_sec.values, (err,row) => {
      if (err) {
        console.log(err)
        res.json({ message: `There was an error retrieving section data: ${err}` })
        return
      }

      const sec_file = row.file

      const q_ch = db.sql.select('sec')
              .from('projs')
              .innerJoin('tree_children')
              .on({ 'projs.file' : 'tree_children.file_child' })
              .where({ 'tree_children.file_parent' : sec_file })
              .toParams({placeholder: '?%d'})

      db.prj.all(q_ch.text, q_ch.values, (err,rows) => {
        if (err) {
          console.log(err)
          return
        }
        var children = []
        rows.map((rw) => { children.push(rw.sec) })

        row['children'] = children
        res.json(row)
      })
  })

}

exports.secTex = async (req, res) => {
}

exports.secHtml = async (req, res) => {
}
