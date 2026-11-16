const fs=require("fs"),vm=require("vm"),assert=require("node:assert/strict");
const scope={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+"/../assets/v3-engine.js","utf8"),scope);
const M=scope.window.GroeikompasV3;
const w={commercial:25,efficiency:20,customer:15,effort:15,measurable:15,dependencies:10};
function makeTask(score=3){const t={id:"t",name:"Rapportage",aiNeeded:"ja",category:"uitvoerend",fit:{},priority:{},firstCheck:[true,true,true,true,true]};for(const [id] of M.FIT)t.fit[id]=score;for(const [id] of M.PRIOR)t.priority[id]=score;return t;}
assert.equal(M.taskScore(makeTask(1),w).priorityScore,0);
assert.equal(M.taskScore(makeTask(2),w).priorityScore,25);
assert.equal(M.taskScore(makeTask(3),w).priorityScore,50);
assert.equal(M.taskScore(makeTask(4),w).priorityScore,75);
assert.equal(M.taskScore(makeTask(5),w).priorityScore,100);
assert.equal(M.taskScore(makeTask(2),w).fitOK,false);
assert.equal(M.taskScore(makeTask(3),w).fitOK,true);
assert.equal(M.taskScore(makeTask(5),w).eligible,true);
const p={};const ps=M.PRIOR.map(x=>x[0]);for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)p[ps[i]+"|"+ps[j]]=1;
const ahp=M.ahpWeights(p);assert.equal(ahp.complete,true);assert.equal(ahp.consistent,true);assert.ok(Math.abs(Object.values(ahp.weights).reduce((a,b)=>a+b,0)-100)<.01);
assert.equal(M.riskLevel({personalize:"ja",personalData:"nee",unreviewedCustomer:"nee"}),"hoog");
assert.equal(M.riskLevel({personalize:"nee",personalData:"ja",unreviewedCustomer:"nee"}),"middel");
assert.equal(M.riskLevel({personalize:"nee",personalData:"nee",unreviewedCustomer:"nee"}),"laag");
assert.equal(M.riskLevel({personalize:"onbekend",personalData:"nee",unreviewedCustomer:"nee"}),"onbekend");
const c={id:"case",title:"Test",profile:{route:"licht",owner:"Marketingmanager",goal:"Betere rapportage",commercialUse:"Leadopvolging",problems:[{description:"A"},{description:"B"},{description:"C"}]},tasks:[makeTask(5)],risk:{personalize:"nee",personalData:"nee",unreviewedCustomer:"nee",owner:"Manager",decision:"go",decisionEvidence:"Getekend akkoord",measures:{}},selection:{selectedTask:"t",options:[],baseline:[],cycles:[],pairwise:{}},evaluation:{}};
for(const x of M.RISK.filter(x=>x.min==="laag"))c.risk.measures[x.id]={status:"geregeld",evidence:"Gedateerd getekend dossier"};
assert.equal(M.riskGate(c).go,true);
assert.equal(M.evaluate(c).gates[1],true);
c.risk.personalize="ja";assert.equal(M.evaluate(c).gates[1],false);
c.risk.personalize="nee";
c.risk.measures.use.evidence="";assert.equal(M.riskGate(c).go,false);
c.risk.measures.use.evidence="Gedateerd getekend dossier";
function opt(name,blind,time){
 const o={id:name,name,scores:{},hard:{dataLocation:"ja",training:"ja",dpa:"ja",access:"ja"},hardEvidence:"Getekende leverancierscontrole",tests:[],totalCost:100};
 for(const [id] of M.TOOL)o.scores[id]=4;
 for(let i=1;i<=4;i++){const r={caseId:"Opdracht-"+i,prepare:5,prompt:time,review:5,correct:5,ratings:{}};for(const [id] of M.QUALITY)r.ratings[id]=blind;o.tests.push(r)}
 return o;
}
const A=opt("a",5,20),B=opt("b",4,7);
let tools=M.toolTest([A,B],"a","middel");assert.equal(tools.sameCases,true);assert.equal(tools.best.id,"a");assert.equal(tools.validChoice,true);
A.hard.dpa="";tools=M.toolTest([A,B],"a","middel");assert.equal(tools.validChoice,false);A.hard.dpa="ja";
let d={...c,selection:{...c.selection,options:[A,B],selectedTool:"a",baseline:[],cycles:[]},evaluation:{executions:"20",setupHours:"2",learningHours:"1",subscriptionMonthly:"30",maintenanceMonthly:"10",oneOffCosts:"80",horizonMonths:"3",verifiedFinancialBenefit:"500",benefitEvidence:"onbekend",evidenceLevel:"2",incidentsOpen:"0",decision:"doorgaan"}};
const run=(mins,q,id)=>{const r={caseId:id,prepare:10,prompt:mins-25,review:10,correct:5,ratings:{}};for(const [k] of M.QUALITY)r.ratings[k]=q;return r};
d.selection.baseline=Array.from({length:5},(_,i)=>run(90,4,"old-"+i));
d.selection.cycles=[
 {change:"Eerste proef",learning:"Extra controle nodig",runs:Array.from({length:3},(_,i)=>run(75,4,"c1-"+i))},
 {change:"Verbeterde prompt",learning:"Hogere kwaliteit",runs:Array.from({length:3},(_,i)=>run(45,4,"c2-"+i))}
];
const m=M.measures(d);assert.equal(m.baselineCount,5);assert.equal(m.pdsacycles,2);assert.equal(m.after,45);assert.equal(m.gain,45);assert.equal(m.net,12);assert.equal(m.roi,null);
d.evaluation.benefitEvidence="geverifieerd";d.evaluation.financialEvidence="Facturen en boekhoudcontrole";assert.equal(M.measures(d).roi,150);
d.evaluation.incidentsOpen="1";assert.equal(M.evaluate(d).conflict,true);
d.evaluation.incidentsOpen="0";d.selection.cycles[1].runs.forEach(x=>{for(const k of Object.keys(x.ratings))x.ratings[k]=2});assert.equal(M.evaluate(d).metrics.qualityOK,false);
assert.match(M.esc('<script>'),/&lt;script&gt;/);
console.log("PASS V3 MODEL: correct 0–100, AHP, task cutoff, tiered risks, blind tool test, 2 PDSA, last cycle, net time, ROI and safety");
