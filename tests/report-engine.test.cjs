// Run: node tests/report-engine.test.cjs
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync("assets/report-engine.js","utf8"),sandbox,{filename:"report-engine.js"});
const engine=sandbox.window.GroeikompasReport;
const valid={
 business:"Voorbeeldbedrijf",problem:"Rapportages kosten veel tijd",goal:"20% minder tijd bij gelijkblijvende kwaliteit",
 tasks:["Rapportage","Content"],ratings:{},ratingNotes:{},checks:{},
 tools:["Tool A","Tool B"],toolScores:{},toolScoreNotes:{},selectedTool:"Tool A na test",
 pilotTask:"Rapportage",pilotSuccess:"Geen kritieke fouten",pilotDuration:"3 weken",pilotOwner:"Marketingteam",
 kpiName:"Minuten",kpiTarget:"Max. 60 minuten",kpiBefore:"90",kpiAfter:"50",decision:"Bijsturen",notes:"Extra controle nodig"
};
for(const t of valid.tasks){
 for(const f of engine.fitKeys)valid.ratings[t+"|fit:"+f]=t==="Rapportage"?4:3;
 for(const [p] of engine.weights)valid.ratings[t+"|priority:"+p]=t==="Rapportage"?5:2;
}
valid.ratingNotes["Rapportage|fit:Duidelijkheid"]="Herkenbare routinetaak";
for(let i=0;i<7;i++)valid.checks["risk"+i]=true;
valid.checks.vendorPrivacy=true;valid.checks.vendorSecurity=true;
for(const f of ["Taakfit","Data","Integratie","Kosten","Outputkwaliteit","Gebruiksgemak","Meerwaarde","Leveranciersafhankelijkheid"])valid.toolScores["0|"+f]=4;
valid.toolScoreNotes["0|Taakfit"]="Passend bij bestaande rapportages";
const a=engine.analyse(valid);
assert.equal(a.candidate.name,"Rapportage");
assert.equal(a.candidate.priorityScore,100);
assert.equal(a.kpi.relative,-44.4);
assert.equal(a.finalReady,true);
const html=engine.createReport(valid).html;
assert.match(html,/Herkenbare routinetaak/);
assert.match(html,/Passend bij bestaande rapportages/);
assert.match(html,/Onderzoeksbeperkingen/);
assert.equal(engine.analyse({...valid,checks:{}}).finalReady,false);
assert.equal(engine.analyse({...valid,tasks:[],ratings:{}}).candidate,null);
assert.equal(engine.analyse({...valid,kpiAfter:""}).kpi.measured,false);
assert.equal(engine.analyse({...valid,decision:""}).finalReady,false);
assert.match(engine.createReport({...valid,business:"A <script>evil()</script>"}).html,/&lt;script&gt;/);
assert.doesNotMatch(engine.createReport({...valid,business:"A <script>evil()</script>"}).html,/<script>evil/);
const tied={...valid,ratings:{...valid.ratings}};
for(const [p] of engine.weights)tied.ratings["Content|priority:"+p]=5;
assert.equal(engine.analyse(tied).tie,true);
console.log("PASS: advice engine controls, safety limits, calculations, score evidence, and escaping");
