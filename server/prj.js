

const { PrjClass }  = require('./controllers/PrjClass.js')

const rootid = 'p_sr'
const proj = 'letopis'

const prj = new PrjClass({ proj, rootid })

const sec = '02_12_2022.fb.ohmatdet.bolnica.1.35_operacij_divchynka'

//prj.dbSecData({ sec }).then((data) => {
   //console.log({ data });
//})
        //
//console.log(prj.prjRoot);
//console.log(prj.rootid);
//console.log(prj.proj);
//console.log(Object.keys({ sec }).length);

//console.log([].join(','));

//prj.secNew({ 
   //sec : 'aaa' 
//})
//
/*class A {*/
  //constructor(cnf={}){
    //const self = this

    //Object.assign(this, cnf)

    //Object.keys(cnf).forEach(function(x){
    //})

  //}

  //run(){
  //}
/*}*/

//new A('2').run()
//new A().run()
//new A('2','3').run()
//new A({ '2' : 'v1', 'a' : 'v2' }).run()

console.log(typeof({}));
console.log(typeof([]));
console.log(Object.keys([1,2]));
console.log(({}) ? true : false );
console.log(typeof(''));
