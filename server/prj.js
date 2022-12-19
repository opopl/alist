

const { PrjClass }  = require('./controllers/PrjClass.js')

const rootid = 'p_sr'
const proj = 'letopis'

const prj = new PrjClass({ proj, rootid })

const sec = '02_12_2022.fb.ohmatdet.bolnica.1.35_operacij_divchynka'

//prj.dbSecData({ sec }).then((data) => {
   //console.log({ data });
//})
        //
console.log(prj.prjRoot);
console.log(prj.rootid);
console.log(prj.proj);

console.log(Object.keys({ sec }).length);

//prj.secNew({ 
   //sec : 'aaa' 
//})

