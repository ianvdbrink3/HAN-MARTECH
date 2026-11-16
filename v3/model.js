/* AI-GROEIKOMPAS v3 — decision logic derived from AI - Groeikompas-2.docx, sections 1.4–1.10. Research prototype, not legal advice. */
(function(root){"use strict";
const FIT=[["task","Taak en doel"],["information","Beschikbare informatie"],["review","Controleerbaarheid"],["added","Toegevoegde waarde"],["errors","Gevolgen van fouten"],["digital","Digitaal en herhalend"],["contact","Persoonlijk contact"]];
const PRIORITY=[["commercial","Commerciële waarde",25],["efficiency","Efficiëntie",20],["customer","Klantwaarde",15],["effort","Benodigde inspanning",15],["measurable","Meetbaarheid",15],["dependencies","Afhankelijkheden",10]];
const FIRST=[["advantage","Voordeel boven de huidige werkwijze?"],["compatible","Past dit bij hoe het team werkt?"],["simple","Eenvoudig voor de huidige kennis?"],["small","Klein te testen?"],["visible","Resultaten zichtbaar voor eigenaar en collega's?"]];
const TOOL=[["fit","Aansluiting op taak"],["data","Data"],["integration","Technische aansluiting"],["costs","Kosten en middelen"],["quality","Outputkwaliteit"],["usability","Kennis en gebruiksgemak"],["value","Verwachte meerwaarde"],["dependency","Leveranciersafhankelijkheid"]];
const QUALITY=[["correctness","Juistheid"],["brand","Merkfit"],["clarity","Helderheid"],["relevance","Relevantie"],["authenticity","Authenticiteit"]];
const ANCHORS={
 correctness:["Meerdere feitelijke fouten","Eén duidelijke feitelijke fout","Een kleine fout","Geen fouten, maar een claim onduidelijk","Alle feiten en claims kloppen"],
 brand:["Past niet bij toon en huisstijl","Sterke afwijking van de toon","Enkele punten aanpassen","Past, kleine woordkeuzes aanpassen","Direct bruikbaar in huisstijl"],
 clarity:["Onduidelijk opgebouwd","Rommelig opgebouwd","Begrijpelijk maar met zwakke zinnen","Helder met minimale correctie","Helder en logisch opgebouwd"],
 relevance:["Mist doelgroep en doel","Sluit bij slechts één aan","Sluit deels aan","Sluit aan met één gemis","Sluit volledig aan"],
 authenticity:["Generiek en uitwisselbaar","Grotendeels generiek","Deels bedrijfseigen","Grotendeels eigen","Voelt volledig eigen"]
};
const CONTROLS={
 low:[["owner","Eigenaar benoemd"],["policy","Gebruiksafspraak vastgesteld"],["approved","Goedgekeurde tool en afbakening"],["literacy","Basis AI-geletterdheid"],["reviewer","Menselijke controle vóór gebruik"]],
 medium:[["processor","Verwerkersovereenkomst en doorgifte beoordeeld"],["transparency","Transparantie en kanaalregels gecontroleerd"],["checkpoints","Vaste controlepunten en incidentenlog"]],
 high:[["lawful","Grondslag en doelbinding getoetst"],["dpia","DPIA-noodzaak en eventuele DPIA beoordeeld"],["director","Eigenaars-/directiebesluit vastgelegd"]]
};
const DIRECTIONS=[["assistant","Zakelijke AI-assistent"],["embedded","AI in bestaande software"],["specialist","Gespecialiseerde tool"],["agent","Eigen AI-koppeling/agent"],["nonai","Automatisering zonder AI"]];
const PHASES=["Bedrijfsanalyse en marketingvraagstuk","Procesanalyse en prioritering","Randvoorwaarden en risicobeoordeling","AI-selectie en implementatie","Meten, evalueren en groeien"];
const s=v=>typeof v==="string"?v.trim():"";
const n=v=>v!==""&&v!==undefined&&v!==null&&Number.isFinite(Number(v))?Number(v):null;
const sc=v=>{const x=n(v);return x!==null&&Number.isInteger(x)&&x>=1&&x<=5?x:null};
const avg=v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:null;
const fix=(v,p=1)=>v===null||!Number.isFinite(v)?null:Number(v.toFixed(p));
const arr=v=>Array.isArray(v)?v:[];
const uid=()=>Math.random().toString(36).slice(2,10);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function newTask(name=""){return {id:uid(),name,kind:"unknown",contentType:"unknown",nonAI:"",aiNeeded:"unknown",fit:{},priority:{},riskLevel:"unknown",startTests:{},notes:""}}
function newTool(name=""){return {id:uid(),name,direction:"embedded",hard:{},ratings:{},tests:[],blind:"unknown",setupCost:"",monthlyCost:"",notes:""}}
function newCase(name="Bedrijf"){
 return {id:uid(),name,route:"light",phase:0,created:new Date().toISOString(),
 company:{size:"micro",employees:"",strategy:"",marketingGoal:"",knowledge:"",capacity:"",culture:"",currentAI:"",systems:"",environment:"",owner:"",reviewer:"",recurrence:"",measurementCapacity:"",problem:"",goal:"",indicator:"",commercialUse:"",issues:["","",""],surveyCovered:"",surveyInvited:"",evidence:""},
 process:{sipoc:{supplier:"",input:"",steps:"",output:"",customer:""},tasks:[],selectedTaskId:"",pairs:{},notes:""},
 risk:{profile:"unknown",personal:"unknown",direct:"unknown",dataQuality:"",brandContext:"",channel:"",privacy:"",aiAct:"",humanReview:"",usageAgreement:"",owner:"",controls:{},decision:"unknown",decisionBy:"",actions:"",incidentLog:[]},
 implementation:{function:"",direction:"unknown",tools:[],selectedToolId:"",roles:{owner:"",executor:"",reviewer:"",coach:""},training:{practice:"",literacy:"",support:"",feedback:"",acceptance:{}},pilot:{task:"",period:"",success:"",stop:"",baseline:[],cycles:[{name:"PDSA 1",plan:"",do:"",study:"",act:"",runs:[]},{name:"PDSA 2",plan:"",do:"",study:"",act:"",runs:[]}],decisionDate:"",usedCount:"",totalCount:"",handover:""}},
 evaluation:{frequency:"",setupMinutes:"",trainingMinutes:"",laborRate:"",monthlyLicence:"",monthlyMaintenance:"",otherCost:"",financialBenefit:"",reallocated:"",customerMetric:"",customerBaseline:"",customerAfter:"",userFeedback:"",evidenceLevel:"unknown",decision:"unknown",decisionReason:"",nextTaskId:"",incidents:"",limitations:""}
 };
}
function riskLevel(r){if(r.profile==="yes")return "high";if(r.profile!=="no")return "unknown";if(r.personal==="yes"||r.direct==="yes")return "medium";if(r.personal!=="no"||r.direct!=="no")return "unknown";return "low"}
function requiredControls(level){if(level==="unknown")return [];return CONTROLS.low.concat(level==="medium"||level==="high"?CONTROLS.medium:[],level==="high"?CONTROLS.high:[])}
function riskCheck(r,route){const level=riskLevel(r),controls=requiredControls(level).map(x=>({key:x[0],label:x[1],ok:r.controls?.[x[0]]?.status==="done"&&s(r.controls[x[0]].evidence).length>=8}));const blocked=Object.values(r.controls||{}).some(x=>x.status==="blocked"),incomplete=controls.filter(x=>!x.ok),routeConflict=route==="light"&&level!=="low";const ready=level!=="unknown"&&!blocked&&!routeConflict&&!incomplete.length&&!!s(r.owner)&&!!s(r.usageAgreement);return {level,controls,incomplete,blocked,routeConflict,ready,go:ready&&r.decision==="go"}}
function fitCheck(t){const rows=FIT.map(x=>({key:x[0],label:x[1],score:sc(t.fit?.[x[0]])})),complete=rows.every(x=>x.score!==null),fails=rows.filter(x=>x.score!==null&&x.score<3);return {rows,complete,fails,pass:complete&&!fails.length,average:complete?fix(avg(rows.map(x=>x.score)),2):null}}
function ahp(pairs){const z=6,m=Array.from({length:z},(_,i)=>Array.from({length:z},(_,j)=>i===j?1:0));for(let i=0;i<z;i++)for(let j=i+1;j<z;j++){let v=n((pairs||{})[i+"-"+j]);if(v===null||v<1/9-1e-8||v>9+1e-8)return {complete:false,cr:null,weights:null};v=Math.min(9,Math.max(1/9,v));m[i][j]=v;m[j][i]=1/v}
 let w=Array(z).fill(1/z);for(let i=0;i<120;i++){let u=m.map(row=>row.reduce((total,v,j)=>total+v*w[j],0));let sum=u.reduce((a,b)=>a+b,0);u=u.map(x=>x/sum);if(u.every((v,j)=>Math.abs(v-w[j])<1e-11)){w=u;break}w=u}
 const lambda=avg(m.map((row,i)=>row.reduce((v,x,j)=>v+x*w[j],0)/w[i])),cr=Math.max(0,(lambda-z)/(z-1)/1.24);return {complete:true,cr:fix(cr,3),weights:w.map(x=>x*100),consistent:cr<=.1}
}
function priorityCheck(t,route,pairs){const a=ahp(pairs),weights=route==="full"&&a.complete&&a.consistent?a.weights:PRIORITY.map(x=>x[2]);const rows=PRIORITY.map((x,i)=>({key:x[0],label:x[1],score:sc(t.priority?.[x[0]]),weight:weights[i]})),complete=rows.every(x=>x.score!==null);const total=complete?fix(rows.reduce((sum,x)=>sum+((x.score-1)/4)*x.weight,0),1):null;return {rows,complete,total,pass:total!==null&&total>=60,ahp:a,source:route==="full"&&a.complete&&a.consistent?"AHP":"startweging"}}
function firstCheck(t){const rows=FIRST.map(x=>({key:x[0],label:x[1],answer:t.startTests?.[x[0]]||"unknown"}));return {rows,pass:rows.every(x=>x.answer==="yes")}}
function processCheck(c){const tasks=arr(c.process.tasks).map(t=>{let fit=fitCheck(t),priority=priorityCheck(t,c.route,c.process.pairs),first=firstCheck(t);return {...t,fit,priority,first,eligible:fit.pass&&priority.pass&&first.pass&&t.riskLevel!=="unknown"&&t.riskLevel!=="high"&&t.aiNeeded!=="no"}});
 const order={executive:0,analytical:1,relational:2,unknown:3},ranked=tasks.filter(t=>t.eligible).sort((a,b)=>b.priority.total-a.priority.total||(order[a.kind]??3)-(order[b.kind]??3));
 const chosen=tasks.find(t=>t.id===c.process.selectedTaskId)||null;
 return {tasks,ranked,chosen,eligible:!!chosen&&chosen.eligible,ahp:ahp(c.process.pairs),fiveTasks:tasks.filter(x=>x.fit.complete).length>=5}
}
function qualityCheck(q){const rows=QUALITY.map(x=>({key:x[0],label:x[1],value:sc(q?.[x[0]])}));const complete=rows.every(x=>x.value!==null);return {rows,complete,mean:complete?fix(avg(rows.map(x=>x.value)),2):null,min:complete?Math.min(...rows.map(x=>x.value)):null}}
function runCheck(r){const parts=["prepare","prompt","check","correct"].map(k=>n(r?.[k]));const minutes=parts.every(x=>x!==null&&x>=0)?fix(parts.reduce((a,b)=>a+b,0),2):null;return {minutes,quality:qualityCheck(r?.quality),usedAI:r?.usedAI==="yes"}}
function trialCheck(t){const tests=arr(t.tests).map(runCheck),complete=tests.length>=3&&tests.length<=5&&tests.every(x=>x.minutes!==null&&x.quality.complete);const means=Object.fromEntries(QUALITY.map(([k])=>[k,complete?fix(avg(t.tests.map(x=>sc(x.quality?.[k]))),2):null]));return {complete,blind:t.blind==="yes",tests,means,pass:complete&&t.blind==="yes"&&Object.values(means).every(x=>x>=3),mean:complete?fix(avg(tests.map(x=>x.quality.mean)),2):null,time:complete?fix(avg(tests.map(x=>x.minutes)),2):null}}
function toolCheck(t){const rows=TOOL.map(x=>({key:x[0],label:x[1],score:sc(t.ratings?.[x[0]])})),complete=rows.every(x=>x.score!==null);const hard=!!(t.hard?.data==="yes"&&t.hard?.training==="yes"&&t.hard?.agreement==="yes"&&t.hard?.access==="yes");return {tool:t,rows,complete,hard,mean:complete?fix(avg(rows.map(x=>x.score)),2):null,pass:complete&&rows.every(x=>x.score>=3)&&hard,trial:trialCheck(t)}}
function selectTools(tools){const checked=arr(tools).map(toolCheck),shortlist=checked.filter(x=>x.pass).sort((a,b)=>b.mean-a.mean).slice(0,3),tested=shortlist.filter(x=>x.trial.pass);let winner=tested.length>=2?tested.slice().sort((a,b)=>{if(Math.abs(a.trial.mean-b.trial.mean)>=.5)return b.trial.mean-a.trial.mean;if(a.trial.time!==b.trial.time)return a.trial.time-b.trial.time;return (n(a.tool.monthlyCost)??Infinity)-(n(b.tool.monthlyCost)??Infinity)})[0]:null;return {checked,shortlist,tested,winner,comparable:tested.length>=2}}
function implementationCheck(c){const i=c.implementation,p=i.pilot,tools=selectTools(i.tools),baseline=arr(p.baseline).map(runCheck);const baseOK=baseline.length>=5&&baseline.every(x=>x.minutes!==null&&x.quality.complete);
 const cycles=arr(p.cycles).map(cy=>({name:cy.name,complete:!!(s(cy.plan)&&s(cy.do)&&s(cy.study)&&s(cy.act)&&arr(cy.runs).length&&cy.runs.every(r=>runCheck(r).minutes!==null&&runCheck(r).quality.complete)),runs:arr(cy.runs).map(runCheck)}));
 const scores=Object.values(i.training.acceptance||{}).map(sc),acceptanceOK=scores.length===4&&scores.every(x=>x!==null)&&avg(scores)>=3.5;
 const utilization=n(p.totalCount)>0&&n(p.usedCount)!==null?fix(Number(p.usedCount)/Number(p.totalCount)*100,1):null;
 const complete=baseOK&&cycles.length>=2&&cycles.every(x=>x.complete)&&!!s(p.decisionDate)&&!!s(p.success)&&!!s(p.stop)&&!!s(i.training.practice)&&!!s(i.training.literacy)&&scores.length===4&&scores.every(x=>x!==null)&&utilization!==null&&tools.checked.filter(x=>x.trial.complete).length>=2;
 return {tools,baseline,baseOK,cycles,acceptanceOK,utilization,complete}
}
function evaluate(c){const im=implementationCheck(c),p=c.implementation.pilot,e=c.evaluation,first=im.baseline.filter(x=>x.minutes!==null),last=im.cycles.at(-1)?.runs.filter(x=>x.minutes!==null)||[],before=first.length?avg(first.map(x=>x.minutes)):null,after=last.length?avg(last.map(x=>x.minutes)):null,per=before!==null&&after!==null?before-after:null;
 const freq=n(e.frequency),setup=n(e.setupMinutes),training=n(e.trainingMinutes),net=per!==null&&freq!==null&&setup!==null&&training!==null?per*freq-setup-training:null,payback=per!==null&&per>0&&setup!==null&&training!==null?fix((setup+training)/per,1):null;
 const qb=first.length&&first.every(x=>x.quality.complete)?avg(first.map(x=>x.quality.mean)):null,qa=last.length&&last.every(x=>x.quality.complete)?avg(last.map(x=>x.quality.mean)):null,qualityOK=qb!==null&&qa!==null&&qa>=qb;
 const monthly=["monthlyLicence","monthlyMaintenance","otherCost"].map(k=>n(e[k]));const cost=monthly.every(x=>x!==null)?monthly.reduce((a,b)=>a+b,0):null,benefit=n(e.financialBenefit),roi=cost!==null&&cost>0&&benefit!==null?fix((benefit-cost)/cost*100,1):null;
 const incidents=arr(c.risk.incidentLog).some(x=>x.status!=="closed"),conflict=e.decision==="continue"&&(net===null||net<=0||!qualityOK||incidents),next=c.process.tasks.find(x=>x.id===e.nextTaskId)||null;
 return {before:fix(before,2),after:fix(after,2),per:fix(per,2),net:fix(net,2),payback,qb:fix(qb,2),qa:fix(qa,2),qualityOK,cost,roi,incidents,conflict,next,evidence:e.evidenceLevel,proof:e.evidenceLevel!=="unknown",canContinue:e.decision==="continue"&&!conflict&&e.evidenceLevel!=="unknown"&&!!s(e.reallocated)};
}
function status(c){const p=processCheck(c),r=riskCheck(c.risk,c.route),i=implementationCheck(c),e=evaluate(c),x=c.company;
 const one=!!(s(x.problem)&&s(x.goal)&&s(x.indicator)&&s(x.commercialUse)&&s(x.owner)&&s(x.reviewer));
 const two=!!(p.chosen&&p.chosen.fit.complete&&p.chosen.priority.complete&&p.chosen.first.pass),three=!!(r.level!=="unknown"&&["go","no-go"].includes(c.risk.decision)&&s(c.risk.decisionBy)),four=two&&r.go&&i.complete,five=four&&c.evaluation.decision!=="unknown"&&s(c.evaluation.decisionReason)&&e.proof;
 return {phase:[one,!!two,three,!!four,!!five],process:p,risk:r,implementation:i,evaluation:e}
}
function guidance(c){const st=status(c),p=st.process,r=st.risk,i=st.implementation,e=st.evaluation,chosen=p.chosen||p.ranked[0];
 return [
 {title:"Bedrijfsanalyse",summary:s(c.company.problem)?"Onderzoek vanuit: "+c.company.problem:"Beschrijf eerst de commerciële problemen",next:"Leg drie knelpunten vast; kies lichte of volledige route."},
 {title:"Procesprioritering",summary:chosen?(chosen.eligible?"Geschikte eerste kandidaat: ":"Taak nog niet vrijgegeven: ")+chosen.name:"Splits het proces via SIPOC op in taken.",next:"Bepaal per taak fit, prioriteit en risicodrempel; kies een eerste taak."},
 {title:"Randvoorwaarden",summary:r.level==="unknown"?"Risiconiveau nog niet vastgesteld":r.go?"Voorbereidend go-besluit gedocumenteerd":r.routeConflict?"De lichte route staat dit risiconiveau niet toe":"Go/no-go nog niet verantwoord",next:"Controleer alle verplichte maatregelen voor "+r.level+" risico."},
 {title:"AI-selectie & pilot",summary:i.tools.winner?"Beste onderzochte tool: "+i.tools.winner.tool.name:i.tools.shortlist.length?"Selectietest voor "+i.tools.shortlist.map(x=>x.tool.name).join(", "):"Geen geverifieerde toolselectie beschikbaar",next:"Selectietest: 3–5 taken blind beoordelen, vijf nulmetingen en twee PDSA-cycli."},
 {title:"Meten & groeien",summary:e.conflict?"Doorgaan is strijdig met de gemeten resultaten":e.canContinue?"Doorlopen en volgende taak kiezen":e.net===null?"Effect nog niet aantoonbaar":"Resultaten beoordelen vóór het besluit",next:e.canContinue&&e.next?"Start opnieuw bij fase 2: "+e.next.name:"Controleer netto tijdwinst, kwaliteit, bewijsniveau en incidenten."}
 ]}
function report(c){const st=status(c),g=guidance(c),e=st.evaluation,missing=g.filter((_,i)=>!st.phase[i]).map(x=>x.title),body=g.map((x,i)=>'<section class="r-section"><small>FASE '+(i+1)+'</small><h2>'+esc(x.title)+'</h2><p>'+esc(x.summary)+'</p><p><b>Vervolg:</b> '+esc(x.next)+'</p></section>').join("");
 return {html:'<div class="r-cover"><small>AI-GROEIKOMPAS • ONDERZOEKSVERSIE</small><h1>Bedrijfsspecifiek advies</h1><h3>'+esc(c.name)+'</h3><p>'+esc(c.route==="light"?"Lichte route":"Volledige route")+'</p></div>'+body+'<section class="r-section"><h2>Netto commerciële effecten</h2><p>Netto tijdwinst: '+esc(e.net===null?"niet meetbaar":e.net+" minuten")+'</p><p>Terugverdienpunt: '+esc(e.payback===null?"onbekend":e.payback+" uitvoeringen")+'</p><p>ROI: '+esc(e.roi===null?"niet betrouwbaar te berekenen":e.roi+"%")+'</p><p>Bestemming vrijgekomen tijd: '+esc(c.company.commercialUse||"niet benoemd")+'</p></section><section class="r-section"><h2>Open onderzoeksstappen</h2><p>'+esc(missing.length?missing.join(", "):"De digitale controles zijn voltooid; onafhankelijke beoordeling blijft nodig.")+'</p></section><footer>Gebaseerd op AI - Groeikompas-2 (30 november 2026). Grenzen en ankers zijn voorlopige projectgroepkeuzes.</footer>',status:st}
}
root.GK3={FIT,PRIORITY,FIRST,TOOL,QUALITY,ANCHORS,CONTROLS,DIRECTIONS,PHASES,newCase,newTask,newTool,riskLevel,riskCheck,requiredControls,fitCheck,ahp,priorityCheck,firstCheck,processCheck,qualityCheck,runCheck,trialCheck,toolCheck,selectTools,implementationCheck,evaluate,status,guidance,report,esc,s,n,sc,fix};
})(typeof window!=="undefined"?window:globalThis);