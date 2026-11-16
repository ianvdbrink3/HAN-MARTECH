const fs=require("node:fs"),assert=require("node:assert/strict");
const {JSDOM}=require("jsdom");
const html=fs.readFileSync("index.html","utf8");
function makeApp(oldData){
 const dom=new JSDOM(html,{url:"https://groeikompas.example.test",runScripts:"outside-only",pretendToBeVisual:true});
 const w=dom.window;w.scrollTo=()=>{};w.alert=message=>{throw Error("Unexpected alert: "+message)};w.confirm=()=>true;w.prompt=(message)=>message.includes("nieuwe bedrijf")?"Bedrijf Twee":null;
 if(oldData)w.localStorage.setItem("han-ai-groeikompas-dossiers-v1",JSON.stringify(oldData));
 const errors=[];w.addEventListener("error",e=>errors.push(e.error?.message||e.message));
 for(const file of ["v3/model.js","v3/advisor.js","v3/report.js","v3/app.js"])w.eval(fs.readFileSync(file,"utf8"));
 return {dom,w,d:w.document,errors};
}
function goto(d,route){const b=d.querySelector('[data-nav="'+route+'"]');assert.ok(b,"Missing route "+route);b.click();return d.querySelector("#view").innerHTML}
function input(w,d,path,value){const node=d.querySelector('[data-field="'+path+'"]');assert.ok(node,"Missing field "+path);node.value=value;node.dispatchEvent(new w.Event("input",{bubbles:true}));node.dispatchEvent(new w.Event("change",{bubbles:true}))}
function click(d,selector){const button=d.querySelector(selector);assert.ok(button,"Missing "+selector);button.click()}
const {dom,w,d,errors}=makeApp();
assert.equal(d.querySelectorAll("#navigation button").length,9);
const expected=["Bedrijfsanalyse","Procesanalyse","Randvoorwaarden","AI-selectie","Meten, evalueren"];
for(let i=0;i<5;i++){goto(d,"p"+i);assert.match(d.querySelector("#title").textContent,new RegExp(expected[i]));}
goto(d,"p0");input(w,d,"company.problem","Rapportages kosten acht uur per week");input(w,d,"company.goal","Halveer tijd zonder fouten");
assert.match(w.localStorage.getItem("ghub-groeikompas-v3"),/Rapportages kosten acht uur/);
goto(d,"p1");click(d,'[data-action="suggest-task"]');
assert.equal(JSON.parse(w.localStorage.getItem("ghub-groeikompas-v3")).cases[0].process.tasks.length,1);
click(d,'[data-action="select-task"]');
assert.ok(JSON.parse(w.localStorage.getItem("ghub-groeikompas-v3")).cases[0].process.selectedTaskId);
goto(d,"p2");click(d,'[data-choice="risk.profile"][data-value="no"]');
click(d,'[data-choice="risk.personal"][data-value="no"]');
click(d,'[data-choice="risk.direct"][data-value="no"]');
assert.match(d.querySelector("#view").textContent,/Afgeleid niveau: Laag risico/);
goto(d,"p3");assert.match(d.querySelector("#view").textContent,/Taak uit fase 2/);
goto(d,"p4");assert.match(d.querySelector("#view").textContent,/Netto tijdwinst/);
goto(d,"report");assert.match(d.querySelector("#view").textContent,/Bedrijfsspecifiek implementatieadvies/);
goto(d,"about");assert.match(d.querySelector("#view").textContent,/SIPOC/);
goto(d,"compare");assert.match(d.querySelector("#view").textContent,/Bedrijf 1/);
click(d,'[data-action="new-company"]');
assert.equal(d.querySelector("#caseList").options.length,2);
goto(d,"p0");input(w,d,"company.problem","Nieuwe casus tweede bedrijf");
assert.doesNotMatch(JSON.parse(w.localStorage.getItem("ghub-groeikompas-v3")).cases[0].company.problem,/Nieuwe casus/);
d.querySelector("#caseList").value=JSON.parse(w.localStorage.getItem("ghub-groeikompas-v3")).cases[0].id;
d.querySelector("#caseList").dispatchEvent(new w.Event("change",{bubbles:true}));
goto(d,"p0");assert.equal(d.querySelector('[data-field="company.problem"]').value,"Rapportages kosten acht uur per week");
click(d,"#screenMenu");assert.equal(d.querySelector("#sidebar").classList.contains("open"),true);
click(d,"#scrim");assert.equal(d.querySelector("#sidebar").classList.contains("open"),false);
assert.deepEqual(errors,[]);
dom.window.close();
const legacy={cases:[{id:"old",name:"Legacy BV",data:{problem:"Oude probleemtekst",goal:"Oud doel",tasks:["Contentcreatie"],ratings:{"Contentcreatie|fit:Duidelijkheid":5}}}]};
const migrated=makeApp(legacy);const stored=JSON.parse(migrated.w.localStorage.getItem("ghub-groeikompas-v3"));
assert.equal(stored.cases[0].name,"Legacy BV");
assert.equal(stored.cases[0].company.problem,"Oude probleemtekst");
assert.equal(stored.cases[0].process.tasks[0].name,"Contentcreatie");
assert.deepEqual(stored.cases[0].process.tasks[0].fit,{},"Old scores must not silently map to new criteria");
migrated.dom.window.close();
console.log("PASS: all five screens, data entry, case isolation, risk paths, report, mobile nav and safe legacy migration");