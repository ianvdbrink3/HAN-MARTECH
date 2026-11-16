/* AI-Groeikompas v3 | Modelgetrouwe beslismotor
   Bron: AI - Groeikompas-2.docx, 30 november 2026 (concept).
   Drempels en scores zijn projectgroep-startwaarden, nog te valideren.
   Geen automatisch juridisch fiat, ROI zonder bewijs of fictieve metingen.
*/
(function(root){
"use strict";
const FIT=[
 ["task","Taak en doel","Is de taak en het verbeterdoel helder?"],
 ["info","Beschikbare informatie","Is de benodigde input beschikbaar en bruikbaar?"],
 ["verify","Controleerbaarheid","Kan iemand het resultaat inhoudelijk toetsen?"],
 ["value","Toegevoegde waarde","Verwachten we voordeel boven de huidige aanpak?"],
 ["errors","Gevolgen van fouten","Zijn fouten detecteerbaar en herstelbaar?"],
 ["repeat","Digitaal en herhalend","Is de taak digitaal en voldoende herhaalbaar?"],
 ["human","Persoonlijk contact","Is vertrouwelijk persoonlijk contact niet de kern?"]
];
const PRIOR=[
 ["commercial","Commerciële waarde",25],["efficiency","Efficiëntie",20],["customer","Klantwaarde",15],
 ["effort","Benodigde inspanning",15],["measurable","Meetbaarheid",15],["dependencies","Afhankelijkheden",10]
];
const TOOL=[
 ["fit","Aansluiting op de taak"],["data","Data"],["integration","Technische aansluiting"],
 ["cost","Kosten en middelen"],["quality","Outputkwaliteit"],["usability","Kennis en gebruiksgemak"],
 ["value","Verwachte meerwaarde"],["lockin","Leveranciersafhankelijkheid"]
];
const QUALITY=[
 ["accuracy","Juistheid"],["brand","Merkfit"],["clarity","Helderheid"],["relevance","Relevantie"],["authenticity","Authenticiteit"]
];
const RISK=[
 {id:"use",name:"Gebruiksafspraak, toegestane tool en eigenaar",min:"laag"},
 {id:"review",name:"Controle vóór publicatie met vakkennis en tijd",min:"laag"},
 {id:"literacy",name:"Basis AI-geletterdheid",min:"laag"},
 {id:"dpa",name:"Verwerkersovereenkomst indien vereist",min:"middel"},
 {id:"transparency",name:"Transparantie naar klanten en kanaalregels",min:"middel"},
 {id:"fixed",name:"Vaste controlepunten en incidentenlog",min:"middel"},
 {id:"legal",name:"Grondslag, doelbinding en bezwaarrechten beoordeeld",min:"hoog"},
 {id:"dpia",name:"DPIA-noodzaak beoordeeld en indien vereist uitgevoerd",min:"hoog"},
 {id:"owner",name:"Eigenaar beslist expliciet over hoog risico",min:"hoog"}
];
const weightDefaults=Object.fromEntries(PRIOR.map(x=>[x[0],x[2]]));
const num=v=>v===""||v==null||!Number.isFinite(Number(v))?null:Number(v);
const numScore=v=>{const x=num(v);return x!==null&&Number.isInteger(x)&&x>=1&&x<=5?x:null};
const text=v=>typeof v==="string"?v.trim():"";
const sum=a=>a.reduce((x,y)=>x+y,0);
const round=(v,n=1)=>Number(v.toFixed(n));
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function normalize(c){
 const d=c||{};
 return {profile:d.profile||{},tasks:Array.isArray(d.tasks)?d.tasks:[],risk:d.risk||{},selection:d.selection||{},evaluation:d.evaluation||{},id:d.id||"",title:d.title||"Nieuw bedrijf"};
}
function ahpWeights(pairs){
 const n=PRIOR.length, m=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
 let provided=0;
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
  const x=num(pairs?.[PRIOR[i][0]+"|"+PRIOR[j][0]]);
  const ratio=x!==null&&x>0?x:1;
  if(x!==null&&x>0)provided++;
  m[i][j]=ratio;m[j][i]=1/ratio;
 }
 const gm=m.map(row=>Math.exp(sum(row.map(Math.log))/n));
 const weights=gm.map(x=>100*x/sum(gm));
 const lm=m.map((row,i)=>sum(row.map((v,j)=>v*weights[j]))/weights[i]);
 const cr=Math.max(0,(sum(lm)/n-n)/(n-1)/1.24);
 return {weights:Object.fromEntries(PRIOR.map((p,i)=>[p[0],round(weights[i],4)])),
 consistencyRatio:round(cr,3),complete:provided===15,consistent:cr<=.1,provided};
}
function weightsFor(d){
 const route=d.profile.route||"licht";
 if(route!=="volledig")return {weights:weightDefaults,mode:"vaste startweging",consistent:true,cr:null};
 const a=ahpWeights(d.selection.pairwise);
 return {weights:a.weights,mode:a.complete&&a.consistent?"bedrijfsspecifiek AHP":"AHP nog niet compleet/consistent",consistent:a.complete&&a.consistent,cr:a.consistencyRatio,provided:a.provided};
}
function taskScore(task,weights){
 const fit=FIT.map(([id])=>numScore(task.fit?.[id]));
 const second=FIT.map(([id])=>numScore(task.fitSecond?.[id]));
 const both=fit.filter((x,i)=>x!==null&&second[i]!==null);
 const agreement=both.length===7?round(fit.filter((x,i)=>x!==null&&second[i]!==null&&Math.abs(x-second[i])<=1).length/7*100,1):null;
 const suitabilityComplete=fit.every(x=>x!==null);
 const fitFail=FIT.filter((x,i)=>fit[i]!==null&&fit[i]<3).map(x=>x[1]);
 const priority=PRIOR.map(([id])=>numScore(task.priority?.[id]));
 const priorityComplete=priority.every(x=>x!==null);
 const score=priorityComplete?round(sum(PRIOR.map((p,i)=>((priority[i]-1)/4)*(weights[p[0]]||0))),1):null;
 const first=Array.isArray(task.firstCheck)?task.firstCheck:[];
 const firstOK=first.length===5&&first.every(v=>v===true);
 return {id:task.id,name:task.name||"",fit,second,agreement,fitComplete:suitabilityComplete,fitFail,fitOK:suitabilityComplete&&!fitFail.length,
  priority,priorityComplete,priorityScore:score,firstOK,first,category:task.category||"onbekend",
  eligible:suitabilityComplete&&!fitFail.length&&priorityComplete&&firstOK&&task.aiNeeded==="ja"};
}
function riskLevel(r){
 if(r.personalize==="ja")return "hoog";
 if(r.personalize!=="nee")return "onbekend";
 if(r.personalData==="ja"||r.unreviewedCustomer==="ja")return "middel";
 if(r.personalData!=="nee"||r.unreviewedCustomer!=="nee")return "onbekend";
 return "laag";
}
function riskGate(d){
 const r=d.risk,level=riskLevel(r),levels=["laag","middel","hoog"],idx=levels.indexOf(level);
 const required=idx<0?[]:RISK.filter(x=>levels.indexOf(x.min)<=idx);
 const unverified=required.filter(x=>r.measures?.[x.id]?.status!=="geregeld"||text(r.measures?.[x.id]?.evidence).length<8);
 const blocked=required.filter(x=>r.measures?.[x.id]?.status==="blokkade");
 const go=level!=="onbekend"&&unverified.length===0&&blocked.length===0&&text(r.owner).length>0&&r.decision==="go"&&text(r.decisionEvidence).length>=8;
 return {level,required,unverified,blocked,go,valid:level!=="onbekend",owner:r.owner||"",decision:r.decision||"onbekend"};
}
function toolScore(opt,riskClass){
 const scores=TOOL.map(([k])=>numScore(opt.scores?.[k]));
 const complete=scores.every(x=>x!==null);
 const below=TOOL.filter((x,i)=>scores[i]!==null&&scores[i]<3).map(x=>x[1]);
 const hard=opt.hard||{};
 const failedHard=Object.entries(hard).filter(([k,v])=>v==="nee").map(([k])=>k);
 const hardRequired=riskClass!=="laag";
 const missingHard=hardRequired?["dataLocation","training","dpa","access"].filter(k=>hard[k]!=="ja"):[];
 const evidenceRequired=hardRequired&&text(opt.hardEvidence).length<8;
 return {id:opt.id,name:opt.name||"",scores,complete,below,failedHard,missingHard,
  shortlist:complete&&!below.length&&!failedHard.length&&!missingHard.length&&!evidenceRequired,mean:complete?round(sum(scores)/scores.length,2):null};
}
function quality(run){
 const items=QUALITY.map(([k])=>numScore(run?.ratings?.[k]));
 return items.every(x=>x!==null)?round(sum(items)/items.length,2):null;
}
function totalMinutes(run){
 const fields=["prepare","prompt","review","correct"];
 const parts=fields.map(k=>num(run?.[k]));
 return parts.every(x=>x!==null&&x>=0)?round(sum(parts),2):null;
}
function toolTest(opts,selectedId,riskClass){
 const scores=opts.map(opt=>{
  const s=toolScore(opt,riskClass);
  const tests=Array.isArray(opt.tests)?opt.tests:[];
  const valid=tests.map(t=>({id:t.caseId,blind:quality(t),minutes:totalMinutes(t)}));
  const completed=valid.filter(x=>x.blind!==null&&x.minutes!==null);
  const byCriterion=QUALITY.map(([key])=>{
   const x=tests.map(t=>numScore(t.ratings?.[key])).filter(v=>v!==null);
   return x.length>=3?round(sum(x)/x.length,2):null;
  });
  const meanQuality=completed.length>=3?round(sum(completed.map(x=>x.blind))/completed.length,2):null;
  const avgTime=completed.length>=3?round(sum(completed.map(x=>x.minutes))/completed.length,1):null;
  const eligible=s.shortlist&&completed.length>=3&&byCriterion.every(x=>x!==null&&x>=3)&&meanQuality>=3.5;
  return {...s,tests,valid,completed:completed.length,byCriterion,meanQuality,avgTime,eligible,decisionBasis:eligible?"Kwaliteit en tijd gemeten":"Nog onvoldoende of ondergrens niet gehaald"};
 });
 const shortlisted=scores.filter(x=>x.shortlist),eligible=scores.filter(x=>x.eligible).sort((a,b)=>{
  if(Math.abs(b.meanQuality-a.meanQuality)>=.5)return b.meanQuality-a.meanQuality;
  if(a.avgTime!==b.avgTime)return a.avgTime-b.avgTime;
  return (num(opts.find(x=>x.id===a.id)?.totalCost)||Infinity)-(num(opts.find(x=>x.id===b.id)?.totalCost)||Infinity);
 });
 const chosen=scores.find(x=>x.id===selectedId)||null;
 const minOptions=opts.length>=2&&shortlisted.length>=2;
 const sameCases=eligible.length>0&&scores.filter(x=>x.completed>=3).length>=2&&(()=>{
  const groups=scores.filter(x=>x.completed>=3).slice(0,2).map(x=>x.valid.map(v=>v.id).sort().join("|"));
  return groups[0]===groups[1]&&groups[0]!=="";
 })();
 return {scores,shortlisted,eligible,best:eligible[0]||null,chosen,minOptions,sameCases,
  validChoice:!!chosen&&chosen.eligible&&sameCases&&eligible[0]?.id===chosen.id,
  note:!minOptions?"Er zijn nog geen twee geschikte alternatieven.":!sameCases?"Test minstens twee opties op dezelfde drie tot vijf opdrachten.":"Selectie op kwaliteit, bij klein verschil op tijd en daarna eenvoud/kosten."};
}
function measures(d){
 const evals=d.evaluation,sel=d.selection,baseline=Array.isArray(sel.baseline)?sel.baseline:[],
 cycles=Array.isArray(sel.cycles)?sel.cycles:[],completeCycles=cycles.filter(x=>Array.isArray(x.runs)&&x.runs.length),
 after=completeCycles.length?completeCycles[completeCycles.length-1].runs:[];
 const b=baseline.map(r=>({minutes:totalMinutes(r),quality:quality(r)})).filter(x=>x.minutes!==null&&x.quality!==null);
 const a=after.map(r=>({minutes:totalMinutes(r),quality:quality(r)})).filter(x=>x.minutes!==null&&x.quality!==null);
 const avg= (runs,k)=>runs.length?round(sum(runs.map(x=>x[k]))/runs.length,2):null;
 const before=avg(b,"minutes"),post=avg(a,"minutes"),qualB=avg(b,"quality"),qualA=avg(a,"quality");
 const gain=before!==null&&post!==null?round(before-post,2):null;
 const tasksNum=num(evals.executions)||a.length,setup=num(evals.setupHours),learning=num(evals.learningHours);
 const net=gain!==null&&tasksNum!==null&&setup!==null&&learning!==null?
   round(gain*tasksNum/60-setup-learning,2):null;
 const months=num(evals.subscriptionMonthly),extra=num(evals.oneOffCosts),maint=num(evals.maintenanceMonthly),monthsCount=num(evals.horizonMonths);
 const costs=months!==null&&extra!==null&&maint!==null&&monthsCount!==null?
   round((months+maint)*monthsCount+extra,2):null;
 const benefits=num(evals.verifiedFinancialBenefit);
 const roi=benefits!==null&&costs!==null&&costs>0&&evals.benefitEvidence==="geverifieerd"&&text(evals.financialEvidence).length>=8?
   round((benefits-costs)/costs*100,1):null;
 const claimed=Math.min(4,Math.max(1,num(evals.evidenceLevel)||1));
 const supported=b.length===0||a.length===0?1:evals.evidenceMethod==="experiment"&&text(evals.evidenceReference).length>=8?4:evals.evidenceMethod==="control"&&text(evals.evidenceReference).length>=8?3:2;
 const bestEvidence=Math.min(claimed,supported);
 const pdsacycles=cycles.filter(c=>text(c.change).length>0&&text(c.learning).length>0&&Array.isArray(c.runs)&&c.runs.length>=2).length;
 const qualityOK=qualB!==null&&qualA!==null&&qualA>=qualB;
 return {before,after:post,qualityBefore:qualB,qualityAfter:qualA,gain,net,roi,costs,qualityOK,
  baselineCount:b.length,afterCount:a.length,pdsacycles,evidenceLevel:bestEvidence,selectedRoute:d.profile.route||"licht",
  freedTimeUse:num(evals.freedTimeUse)||null,incidentsOpen:num(evals.incidentsOpen)||0};
}
function evaluate(raw){
 const d=normalize(raw),w=weightsFor(d),tasks=d.tasks.map(t=>taskScore(t,w.weights));
 const sorted=tasks.filter(t=>t.eligible).sort((a,b)=>b.priorityScore-a.priorityScore);
 const chosen=tasks.find(t=>t.id===d.selection.selectedTask)||null;
 const risk=riskGate(d),t=toolTest(d.selection.options||[],d.selection.selectedTool,risk.level),m=measures(d);
 const problems=(d.profile.problems||[]).filter(p=>text(p?.description));
 const p=d.profile,sel=d.selection,ev=d.evaluation,issues=[],alerts=[];
 const phase1=["strategy","skills","budget","culture","existingAI","systems","environment"].filter(k=>text(p[k]).length>0).length;
 const employeeTotal=num(p.employeeTotal),employeeSurveyed=num(p.employeeSurveyed);
 const surveyResponse=employeeTotal>0&&employeeSurveyed!==null?round(employeeSurveyed/employeeTotal*100,1):null;
 if(!text(p.goal))issues.push("Formuleer in fase 1 het meetbare doel.");
 if(!text(p.commercialUse))issues.push("Leg vast hoe vrijgekomen capaciteit commercieel wordt ingezet.");
 if(problems.length<3)issues.push("Onderzoek minstens drie concrete marketingknelpunten (fase 1).");
 if(p.route==="volledig"&&(surveyResponse===null||surveyResponse<70))issues.push("Volledige route: minstens 70% van betrokken medewerkers moet de korte vragenlijst beantwoorden.");
 if(!p.route)issues.push("Kies lichte of volledige route.");
 if(w.mode==="AHP nog niet compleet/consistent")issues.push("Voltooi de paarsgewijze weging of herzie tegenstrijdige voorkeuren.");
 if(!tasks.length)issues.push("Splits het marketingproces op in afzonderlijke taken.");
 if(tasks.length&&tasks.some(x=>x.fitFail.length))alerts.push("Minstens één taak scoort lager dan 3 op geschiktheid en vraagt herstel.");
 if(tasks.length<5)issues.push("De KPI-streefwaarde is vijf beoordeelde taken.");
 if(tasks.some(t=>t.fitComplete&&t.agreement===null))issues.push("Een tweede onafhankelijke geschiktheidsbeoordeling ontbreekt bij een of meer taken.");
 if(tasks.some(t=>t.agreement!==null&&t.agreement<80))alerts.push("Twee beoordelaars verschillen op meer dan 20% van de geschiktheidscriteria ruim één punt.");
 if(!chosen)issues.push("Kies een eerste taak uit de eligible kandidaten.");
 if(chosen&&!chosen.eligible)alerts.push("Geselecteerde taak voldoet niet aan alle geschiktheids- en eerste-toepassingstoetsen.");
 if(chosen&&chosen.priorityScore!==null&&chosen.priorityScore<60)alerts.push("De gekozen taak behaalt niet de startgrens van 60/100.");
 if(risk.level==="onbekend")issues.push("Beantwoord de drie risicoclassificatievragen.");
 if(risk.blocked.length)alerts.push("Een kritieke risicomaatregel is geblokkeerd.");
 if(!risk.go)issues.push("Go/no-go ontbreekt of verplichte risicomaatregelen zijn niet aantoonbaar geregeld.");
 if(sel.aiFunction&&sel.aiFunction==="")issues.push("Vertaal de gekozen taak naar een AI-functie.");
 if(!t.minOptions)issues.push("Vergelijk minimaal twee opties met de acht toolcriteria.");
 if(!t.sameCases)issues.push("Voer een gelijke selectietest met 3–5 opdrachten uit voor minimaal twee opties.");
 if(!t.validChoice)issues.push("Er is nog geen bewezen selectie-uitkomst volgens kwaliteit/tijd.");
 if(m.baselineCount<5)issues.push("Meet de huidige taak minstens vijfmaal vóór de pilot.");
 if(m.pdsacycles<2)issues.push("Voer en documenteer minimaal twee PDSA-verbetercycli.");
 if(!m.qualityOK&&m.afterCount)alerts.push("Kwaliteit is slechter dan in de nulmeting.");
 if(m.gain!==null&&m.gain<=0)alerts.push("De volledige tijd per uitvoering is niet verbeterd.");
 if(m.incidentsOpen>0)alerts.push("Er staan open incidenten in de evaluatie.");
 const survey=Object.values(sel.acceptance||{}).map(numScore).filter(x=>x!==null);
 const acceptanceAvg=survey.length===4?round(sum(survey)/4,2):null;
 const kpis={
  phase1:{readiness:phase1,problems:problems.length,goal:!!text(p.goal),commercial:!!text(p.commercialUse),surveyResponse},
  phase2:{scored:tasks.filter(x=>x.fitComplete&&x.priorityComplete).length,candidate60:!!chosen&&chosen.priorityScore>=60,firstCheck:!!chosen&&chosen.firstOK,agreement:chosen?.agreement??null,ahp:w},
  phase3:{risk:risk.level,measures: risk.required.length-risk.unverified.length,total:risk.required.length,go:risk.go},
  phase4:{options:t.scores.length,shortlisted:t.shortlisted.length,matched:t.sameCases,baseline:m.baselineCount,pdsa:m.pdsacycles,acceptance:acceptanceAvg,adoption:num(sel.lastCycleUsePercent)},
  phase5:{timeGain:m.gain,netHours:m.net,qualityOK:m.qualityOK,roi:m.roi,evidence:m.evidenceLevel}
 };
 const gate1=!!p.route&&phase1===7&&problems.length>=3&&!!text(p.goal)&&!!text(p.commercialUse)&&!!text(p.owner)&&(p.route!=="volledig"||surveyResponse!==null&&surveyResponse>=70);
 const riskFirstOK=risk.level==="onbekend"||(risk.level!=="hoog"&&(p.route!=="licht"||risk.level==="laag"));
 if(chosen&&!riskFirstOK)alerts.push("Deze risicoklasse is niet geschikt als eerste toepassing in de gekozen route.");
 const gate2=!!chosen&&chosen.eligible&&chosen.priorityScore>=60&&w.consistent&&riskFirstOK;
 const gate3=risk.go;
 const gate4=gate3&&t.validChoice&&m.baselineCount>=5&&m.pdsacycles>=2&&acceptanceAvg!==null&&acceptanceAvg>=3.5&&num(sel.lastCycleUsePercent)>=80&&text(sel.training).length>0&&text(sel.roles?.reviewer).length>0;
 const passes=gate4&&m.gain!==null&&m.gain>0&&m.qualityOK&&m.incidentsOpen===0&&m.net!==null&&m.net>0;
 const decision=text(ev.decision),shouldContinue=passes?"doorgaan":m.afterCount===0?"onbekend":m.incidentsOpen>0||!m.qualityOK||m.gain<=0?"stoppen-of-bijsturen":"bijsturen";
 const conflict=decision==="doorgaan"&&!passes;
 if(conflict)alerts.push("Vervolgkeuze 'doorgaan' is strijdig met de vereiste kwaliteit, netto-opbrengst of open incidenten.");
 const goStatus=gate3?(gate4?"Pilot afgerond en geselecteerd":"Go voor gecontroleerde pilotvoorbereiding"):"Geen vrijgave voor echte AI-pilot";
 return {d,w,tasks,ranked:sorted,chosen,risk,tools:t,metrics:m,acceptanceAvg,issues,alerts,kpis,
  gates:[gate1,gate2,gate3,gate4,!!decision&&m.afterCount>0&&m.net!==null&&m.evidenceLevel>=2],decision,shouldContinue,conflict,goStatus,
  nextTask:sorted.find(x=>x.id!==chosen?.id)||null,
  disclaimer:"Startwegingen, normgrenzen, scoreankers en richttijden zijn voorlopige ontwerpkeuzes van de projectgroep. Juridische controles zijn geen rechtszekerheid; veldvalidatie en menselijke beoordeling blijven noodzakelijk."};
}
root.GroeikompasV3={FIT,PRIOR,TOOL,QUALITY,RISK,normalize,ahpWeights,weightsFor,taskScore,riskLevel,riskGate,toolScore,toolTest,quality,totalMinutes,measures,evaluate,esc,round};
})(typeof window!=="undefined"?window:globalThis);
