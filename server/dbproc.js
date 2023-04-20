
const _ = require('lodash')
const sql = require('sql-bricks-sqlite')

const select = sql.select
const insert = sql.insert
const update = sql.update

//https://www.scriptol.com/sql/sqlite-async-await.php
//
/*const sqlite3 = require('sqlite3').verbose()*/
//var db
//

//@@ getOne
//exports.getOne = async function(db, query, params) {
  //const rw = await get(db, query, params)
//}

//@@ infoInsert
const infoInsert = async function({ db, base2info, tBase, joinCol, joinValue, info }) {

   for (let [baseCol, baseValue] of Object.entries(info)) {
     if (baseValue === null || baseValue === undefined) { continue }

     const infoList = baseValue.split(',').map(x => x.trim()).filter(x => x.length)
     if (!infoList.length) { continue }

     const infoCol = _.get(base2info, baseCol, baseCol)
     const tInfo = `_info_${tBase}_${baseCol}`

     const insInfo = infoList.map(infoValue => {
                                 let dict = {}; dict[joinCol] = joinValue;
                                 dict[infoCol] = infoValue
                                 return dict })

     const qi = insert(tInfo, insInfo)
                   .toParams({placeholder: '?%d'})

     console.log({ qi })

     await run(db, qi.text, qi.values)
   }

}

//@@ insertUpdateDict
const insertUpdateDict = async function({ table, db, upd }) {
}


//@@ get
const get = function(db, query, params) {
    return new Promise(function(resolve, reject) {
        if(params == undefined) params=[]

        db.get(query, params, function(err, row)  {
            if(err) reject("Read error: " + err.message)
            else { resolve(row) }
        })
    })
}

//@@ run
const run = function(db, query, params) {
    return new Promise(function(resolve, reject) {
        if(params == undefined) params=[]

        db.run(query, params, function(err)  {
                if(err) reject(err.message)
                else    resolve(true)
        })
    })
}


//@@ all
const all = function(db, query, params) {
    return new Promise(function(resolve, reject) {
        if(params == undefined) params=[]

        db.all(query, params, function(err, rows)  {
            if(err) reject("Read error: " + err.message)
            else { resolve(rows) }
        })
    })
}

module.exports = {
  all, get, run,
  infoInsert
}


//exports.db = db

//exports.open=function(path) {
    //return new Promise(function(resolve) {
    //this.db = new sqlite3.Database(path,
        //function(err) {
            //if(err) reject("Open error: "+ err.message)
            //else    resolve(path + " opened")
        //}
    //)
    //})
//}


//// each row returned one by one
//exports.each=function(query, params, action) {
    //return new Promise(function(resolve, reject) {
        //var db = this.db
        //db.serialize(function() {
            //db.each(query, params, function(err, row)  {
                //if(err) reject("Read error: " + err.message)
                //else {
                    //if(row) {
                        //action(row)
                    //}
                //}
            //})
            //db.get("", function(err, row)  {
                //resolve(true)
            //})
        //})
    //})
//}

//exports.close=function() {
    //return new Promise(function(resolve, reject) {
        //this.db.close()
        //resolve(true)
    //})
/*}*/
