

const db = require('./../db')
const dbProc = require('./../dbproc')

const select = db.sql.select

const DocClass = class {

//@@ new
  constructor(){
    this.dbc = db.doc
  }

//@@ dbDocDnumFree
  async dbDocDnumFree () {
    const self = this

    const q_dnum = select('max(dnum) as max').from('docs').toString()
    const { max } = await dbProc.get(self.dbc, q_dnum)
    const dnum = max ? max+1 : 1
    return dnum
  }

//@@ dbDocData
  async dbDocData ({ url }) {
    const self = this

    const q_data = select('*')
                .from('docs')
                .where({ url })
                .toParams({placeholder: '?%d'})

    const rw = await dbProc.get(self.dbc, q_data.text, q_data.values)
    return rw
  }

}

module.exports = { DocClass }
