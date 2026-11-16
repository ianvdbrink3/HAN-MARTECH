const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const MCODE=fs.readFileSync("v3/model.js","utf8"),ACODE=fs.readFileSync("v3/app.js","utf8"),GCODE=fs.readFileSync("v3/advisor.js","utf8"),RCODE=fs.readFileSync("v3/report.js","utf8");
function build(initialStore={}){
 const storage={...initialStore},elems={},events={};
 const element=id=>elems[id]||(elems[id]={innerHTML:"",textContent:"",value:"",dataset:{},options:[],classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(k,fn){this["_event_"+k]=fn},click(){}});
 const doc={getElementById:element,querySelectorAll(){return []},addEventListener(k,fn){events[k]=fn},createElement(){return {setAttribute(){},click(){}}}};
 const win={scrollY:0,scrollTo(){},print(){}};
 const localStorage={getItem(k){return storage[k]??null},setItem(k,v){storage[k]=v}};
 const context=vm.createContext({document:doc,window:win,localStorage,FileReader:function(){},URL:{createObjectURL(){return"blob:x"},revokeObjectURL(){}},Blob:function(){},setTimeout:fn=>fn(),alert(){},confirm(){return true},prompt(){return "Nieuw testbedrijf"},console});
 vm.runInContext(MCODE,context);vm.runInContext(GCODE,context);vm.runInContext(RCODE,context);vm.runInContext(ACODE,context);
 function nav(route){const target={dataset:{nav:route},closest(q){return q==="[data-nav]"?this:null}};events.click({target});return elems.view.innerHTML}
 function choice(path,value){const target={dataset:{choice:path,value},closest(q){return q==="[data-choice]"?this:null}};events.click({target})}
 function action(command,value=""){const target={dataset:{action:command,value},closest(q){return q==="[data-action]"?this:null}};events.click({target})}
 function enter(path,value){events.input({target:{dataset:{field:path},value}})}
 function vault(){return JSON.parse(storage["ghub-groeikompas-v3"])}
 return {storage,elems,events,win,nav,choice,action,enter,vault};
}
const x=build();
assert.match(x.elems.view.innerHTML,/Een echt besluit begint bij het probleem/);
for(let i=0;i<5;i++){const html=x.nav("p"+i);assert.match(html,new RegExp("FASE "+(i+1)+" VAN 5"));assert.ok(html.length>1000)}
assert.match(x.nav("p0"),/TOE/);
assert.match(x.nav("p1"),/SIPOC/);
assert.match(x.nav("p2"),/risicoclassificatie/);
assert.match(x.nav("p3"),/PDSA/);
assert.match(x.nav("p4"),/Bewijskracht/);
x.nav("p0");
x.enter("company.problem","Rapportage kost 8 uur");
x.enter("company.goal","Halveer de tijd");
x.enter("company.indicator","Minuten per rapportage");
x.enter("company.commercialUse","Leadopvolging");
x.enter("company.owner","Marketingmanager");
x.enter("company.reviewer","Controlling");
assert.equal(x.vault().cases[0].company.problem,"Rapportage kost 8 uur");
x.nav("p1");x.action("suggest-task");
assert.equal(x.vault().cases[0].process.tasks.length,1);
let task=x.vault().cases[0].process.tasks[0];
x.action("select-task",task.id);
x.enter("process.tasks.0.notes","Bewijs in tijdregistratie");
assert.equal(x.vault().cases[0].process.tasks[0].notes,"Bewijs in tijdregistratie");
x.choice("risk.profile","no");x.choice("risk.personal","no");x.choice("risk.direct","no");
assert.equal(x.vault().cases[0].risk.profile,"no");
x.nav("p3");x.action("add-baseline");
assert.equal(x.vault().cases[0].implementation.pilot.baseline.length,1);
x.action("add-cycle-run","0");
assert.equal(x.vault().cases[0].implementation.pilot.cycles[0].runs.length,1);
x.nav("report");assert.match(x.elems.view.innerHTML,/AI-implementatieadvies/);
x.action("new-company");assert.equal(x.vault().cases.length,2);
x.nav("compare");assert.match(x.elems.view.innerHTML,/Bedrijf 1/);
const oldStore={"han-ai-groeikompas-dossiers-v1":JSON.stringify({cases:[{id:"abc",name:"Oud bedrijf",data:{problem:"Oude analyse",goal:"Oud doel",tasks:["Contentcreatie"],ratings:{"bad":"5"}}}]})};
const y=build(oldStore),v=y.vault();
assert.equal(v.cases.length,1);assert.equal(v.cases[0].company.problem,"Oude analyse");
assert.equal(v.cases[0].process.tasks[0].name,"Contentcreatie");
assert.deepEqual(Object.keys(v.cases[0].process.tasks[0].fit),[]);
assert.equal(v.cases[0].legacyRaw.ratings.bad,"5");
console.log("PASS UI: 5 stages, data persistence, task management, measurement entries, report, dossiers and legacy migration.");
