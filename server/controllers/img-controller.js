// Import database

const db = require('./../db')

exports.secCount = async (req, res) => {

  const q = db.sql.select('COUNT(*) AS cnt').from('imgs').toString()
  db.img.get(q,(err,row) => {
     res.json(row)
  })
}

