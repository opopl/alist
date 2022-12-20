

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

console.log(typeof({}));
console.log(typeof([]));
console.log(Object.keys([1,2]));
console.log(({}) ? true : false );
console.log(typeof(''));
