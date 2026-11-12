const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const read = name => fs.readFileSync(name,"utf8");
const page = read("index.html");
const js = page.match(/<script>\s*\(function\(\)\{([\s\S]*?)<\/script>/);
assert.ok(js,"Main application script not found");
const view = {},events = {},store = {};
const doc={
 body:{classList:{toggle(){return true},remove(){}}},
 getElementById(id){return view[id]??(view[id]={innerHTML:"",textContent:"",value:"",setAttribute(){},click(){}})},
 querySelectorAll(){return []},addEventListener(k,cb){events[k]=cb},createElement(){return {click(){}}}
};
const window={scrollY:0,scrollTo(){}};
const localStorage={getItem(k){return store[k]??null},setItem(k,v){store[k]=v}};
const context=vm.createContext({document:doc,window,localStorage,alert(){},confirm(){return true},prompt(){return null},navigator:{},Blob:function(){},URL:{createObjectURL(){return ""}},console});
vm.runInContext(read("assets/report-engine.js"),context);
vm.runInContext(read("assets/guidance-engine.js"),context);
vm.runInContext(js[0].replace(/^<script>/,"").replace(/<\/script>$/,""),context);
function click(selector,data){
 const target={id:"",dataset:data,closest(q){return q===selector?this:null}};
 events.click({target});
}
function go(route){click("[data-nav]",{nav:route});return view.view.innerHTML}
function enter(field,value){events.input({target:{dataset:{key:field},value}})}
enter("business","Fictieve Bouw BV");
enter("problem","Campagnerapportages samenstellen uit HubSpot, GA4 en Google Ads kost 6 uur per week.");
enter("goal","Halveer tijd zonder verlies van cijferkwaliteit.");
enter("resources","HubSpot en GA4");
let phase2=go("p1");
assert.match(phase2,/GEGENEREERD UIT EERDERE ANTWOORDEN/);
assert.match(phase2,/Campagnerapportages verzamelen/);
assert.match(phase2,/Campagnerapportages samenstellen/);
const suggestion=window.GroeikompasGuidance.stage({problem:"Campagnerapportages samenstellen uit HubSpot en GA4"},0,window.GroeikompasReport.analyse({})).recommendations[0].action.value;
click("[data-guidance-action]",{guidanceAction:"add-task",guidanceValue:suggestion});
let vault=JSON.parse(store["han-ai-groeikompas-dossiers-v1"]);
assert.equal(vault.cases[0].data.candidateTask,suggestion);
assert.ok(vault.cases[0].data.tasks.includes(suggestion));
const phase3=go("p2");
assert.match(phase3,/risicoanalyse/);
assert.match(phase3,/Geselecteerde taak/);
const phase4=go("p3");
assert.match(phase4,/HubSpot Breeze Assistant/);
assert.match(phase4,/GEGENEREERD UIT EERDERE ANTWOORDEN/);
assert.match(phase4,/Voeg toe als te onderzoeken optie/);
click("[data-guidance-action]",{guidanceAction:"candidate-tool",guidanceValue:"HubSpot Breeze Assistant of bestaande CRM-workflows onderzoeken"});
vault=JSON.parse(store["han-ai-groeikompas-dossiers-v1"]);
assert.ok(vault.cases[0].data.tools.includes("HubSpot Breeze Assistant of bestaande CRM-workflows onderzoeken"));
assert.equal(vault.cases[0].data.selectedTool,"","Suggesting a tool must not approve it");
const phase5=go("p4");
assert.match(phase5,/Voorstel voor te meten KPI/);
assert.match(phase5,/Halveer tijd zonder verlies/);
click("[data-guidance-action]",{guidanceAction:"suggest-kpi",guidanceValue:"Netto tijd per gecontroleerde taakuitvoering (minuten)"});
vault=JSON.parse(store["han-ai-groeikompas-dossiers-v1"]);
assert.match(vault.cases[0].data.kpiName,/Netto tijd/);
assert.equal(vault.cases[0].data.kpiBefore,"","Suggestions must never invent measured results");
const noai=window.GroeikompasGuidance.stage({...vault.cases[0].data,aiNecessity:"zonder_ai",nonAiAlternative:"Bestaande dashboardkoppeling"},3,window.GroeikompasReport.analyse({...vault.cases[0].data,aiNecessity:"zonder_ai"}));
assert.match(noai.headline,/zonder AI/);
assert.ok(noai.recommendations.every(x=>!x.action));
console.log("PASS: adaptive 5-stage flow with suggested tasks, evidence-aware AI candidates and non-fabricated measurements");
