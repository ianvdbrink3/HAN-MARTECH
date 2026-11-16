/* SMART indicator cards derived from the draft's phase KPIs (pp.11–26).
   Targets are provisional; an unmet performance KPI does not erase valid research. */
(function(root){"use strict";
const M=root.GK3;
const is=v=>v!==null&&v!==undefined&&v!=="";
function bizDays(a,b){if(!a||!b)return null;const start=new Date(a+"T12:00:00Z"),end=new Date(b+"T12:00:00Z");if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<start)return null;let days=0;for(let d=new Date(start);d<end;d.setUTCDate(d.getUTCDate()+1))if(d.getUTCDay()!==0&&d.getUTCDay()!==6)days++;return days}
function item(label,ok,detail){return {label,ok:ok===true?true:ok===false?false:null,detail}}
function phase(c,index){
 const st=M.status(c),r=st.risk,p=st.process,i=st.implementation,e=st.evaluation,x=c.company,ev=c.evaluation;
 let out=[];
 if(index===0){
  const surveyInv=M.n(x.surveyInvited),surveyCov=M.n(x.surveyCovered),coverage=surveyInv>0&&surveyCov!==null?M.fix(surveyCov/surveyInv*100,1):null;
  out=[
   item("Drie concrete marketingknelpunten",x.issues.filter(M.s).length>=3,x.issues.filter(M.s).length+"/3"),
   item("Meetbaar verbeterdoel en indicator",!!(M.s(x.goal)&&M.s(x.indicator)),M.s(x.indicator)||"Nog geen indicator"),
   item("Bestemming vrijgekomen uren benoemd",!!M.s(x.commercialUse),"Directe commerciële koppeling"),
   item("Eigenaar en beoordelaar benoemd",!!(M.s(x.owner)&&M.s(x.reviewer)),"Voor zelfstandig go/no-go en inhoudelijke controle")
  ];
  if(c.route==="full")out.push(item("Medewerkersvragenlijst: minstens 70% dekking",coverage===null?null:coverage>=70,coverage===null?"Nog geen responsgegevens":coverage+"%"));
 }
 if(index===1){
  const chosen=p.chosen;
  out=[
   item("Minstens vijf taken gescoord",p.tasks.filter(t=>t.fit.complete).length>=5,p.tasks.filter(t=>t.fit.complete).length+"/5"),
   item("Twee beoordelaars: ≥80% overeenstemming",!chosen?null:chosen.fit.agreement===null?null:chosen.fit.agreement>=80,chosen?.fit.agreement===null?"Nog niet gemeten":chosen.fit.agreement+"%"),
   item("Taaktype voor alle gescoorde taken bekend",p.tasks.length?p.tasks.filter(t=>t.kind!=="unknown").length===p.tasks.length:null,p.tasks.filter(t=>t.kind!=="unknown").length+"/"+p.tasks.length),
   item("Eerste taak: prioriteit ≥60/100",chosen?.priority.total===null||!chosen?null:chosen.priority.total>=60,chosen?.priority.total===null||!chosen?"Nog niet berekend":chosen.priority.total+"/100"),
   item("Eerste-toepassingstoets: 5 van 5 ja",!!chosen&&chosen.first.pass,chosen?chosen.first.rows.filter(y=>y.answer==="yes").length+"/5":"Kies een taak"),
   item("Overgebleven taken gerangschikt",p.ranked.length>0,p.ranked.length+" geschikt voor een eerste/volgende ronde")
  ];
 }
 if(index===2){
  const days=bizDays(c.risk.startedAt,c.risk.decisionAt),limit=r.level==="low"?5:r.level==="medium"?15:null;
  out=[
   item("Risicoklasse bepaald",r.level!=="unknown",r.level),
   item("100% niveaugebonden maatregelen gedocumenteerd",r.level==="unknown"?null:r.incomplete.length===0,(r.controls.length-r.incomplete.length)+"/"+r.controls.length),
   item("Go/no-go vastgelegd door eigenaar",["go","no-go"].includes(c.risk.decision)&&!!M.s(c.risk.decisionBy),c.risk.decision),
   item("Gebruiksafspraak en eigenaar aanwezig",!!(M.s(c.risk.owner)&&M.s(c.risk.usageAgreement)),"Met controle, datagrenzen en rollen"),
   item("Richttermijn besluit bereikt",limit===null||days===null?null:days<=limit,limit===null?"Niet gespecificeerd voor deze klasse":days===null?"Data ontbreken":"Binnen "+days+" werkdagen, richttijd "+limit)
  ];
 }
 if(index===3){
  const avgQuality=i.tools.winner?.trial.mean;
  out=[
   item("Selectietest: minstens twee opties op identieke opdrachten",i.tools.comparable,i.tools.comparisonCount+"/2"),
   item("Gekozen optie kwaliteit ≥3,5",avgQuality===undefined?null:avgQuality>=3.5,avgQuality===undefined?"Nog geen winnaar":avgQuality+"/5"),
   item("Minstens vijf nulmetingen",i.baseOK,i.baseline.length+"/5"),
   item("AI-gebruik laatste ronde ≥80%",i.utilization===null?null:i.utilization>=80,i.utilization===null?"Nog niet gemeten":i.utilization+"%"),
   item("Medewerkeracceptatie gemiddeld ≥3,5",Object.keys(c.implementation.training.acceptance).length<4?null:i.acceptanceOK,i.acceptanceOK?"Streefwaarde gehaald":"Niet of onvoldoende gemeten"),
   item("Twee volledige PDSA-cycli",i.cycles.filter(x=>x.complete).length>=2,i.cycles.filter(x=>x.complete).length+"/2")
  ];
 }
 if(index===4){
  const ratio=M.n(ev.reallocatedShare);
  out=[
   item("Netto tijdwinst positief",e.net===null?null:e.net>0,e.net===null?"Ontbrekende metingen":e.net+" minuten"),
   item("Uitkomstkwaliteit minimaal gelijk",e.qb===null||e.qa===null?null:e.qualityOK,e.qb===null||e.qa===null?"Nog niet gemeten":e.qb+" → "+e.qa),
   item("Minstens 50% vrijgekomen tijd commercieel ingezet",ratio===null?null:ratio>=50,ratio===null?"Nog niet gerapporteerd":ratio+"%"),
   item("Geen open incidenten",!e.incidents,e.incidents?"Open incidenten":"Geen open meldingen"),
   item("Bij doorgaan: minimaal bewijsniveau 2",ev.decision!=="continue"?null:M.n(ev.evidenceLevel)>=2,ev.evidenceLevel==="unknown"?"Nog niet beoordeeld":"Niveau "+ev.evidenceLevel),
   item("Vervolgbesluit en groeitaak",ev.decision!=="unknown"&&!!M.s(ev.decisionReason),ev.decision==="unknown"?"Nog niet besloten":ev.decision)
  ];
 }
 return {items:out,passed:out.filter(x=>x.ok===true).length,pending:out.filter(x=>x.ok===null).length,failed:out.filter(x=>x.ok===false).length};
}
root.GK3Kpis={phase,bizDays};
})(typeof window!=="undefined"?window:globalThis);