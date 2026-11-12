/* AI-GROEIKOMPAS — evidence-first decision support, preview only.
 * Does not claim legal compliance, financial ROI or scientific validity.
 * Previous 5-phase taxonomy is intentionally preserved.
 */
(function(root){
"use strict";
const weights=[["Commerciële waarde",25],["Efficiëntie",20],["Klantwaarde",15],["Benodigde inspanning",15],["Meetbaarheid",15],["Afhankelijkheden",10]];
const fitKeys=["Duidelijkheid","Beschikbaarheid informatie","Controleerbaarheid","Herhaalbaarheid","Toegevoegde waarde","Beheersbaarheid fouten","Menselijke betrokkenheid"];
const toolKeys=["Taakfit","Data","Integratie","Kosten","Outputkwaliteit","Gebruiksgemak","Meerwaarde","Leveranciersafhankelijkheid"];
const risks=["Gegevens beschikbaar en betrouwbaar","Doel en grondslag persoonsgegevens vastgesteld","Noodzaak DPIA beoordeeld","AI-verordening en marketingkanaal beoordeeld","Menselijk toezicht geregeld","Toegangsbeheer en beveiliging onderzocht","Verantwoordelijke aangewezen"];
const s=v=>typeof v==="string"?v.trim():"";
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const n=v=>v!==""&&v!==null&&v!==undefined&&Number.isFinite(Number(v))?Number(v):null;
const rating=v=>Number.isInteger(Number(v))&&Number(v)>=1&&Number(v)<=5?Number(v):0;
const list=(values)=>"<ul>"+values.map(v=>"<li>"+esc(v)+"</li>").join("")+"</ul>";
const part=(title,body)=>'<section class="report-section"><h2>'+esc(title)+'</h2>'+body+'</section>';
function analyse(raw){
 const d=raw&&typeof raw==="object"?raw:{};
 const issues=[],redFlags=[],evidence=[],warnings=[];
 const checks=d.checks||{},ratings=d.ratings||{},ratingNotes=d.ratingNotes||{},toolScores=d.toolScores||{},toolScoreNotes=d.toolScoreNotes||{};
 const evidenceMap=d.riskEvidence||{},riskStatus=d.riskStatus||{};
 const tasks=(Array.isArray(d.tasks)?d.tasks:[]).filter(t=>s(t)).map(t=>{
  const fit=fitKeys.map(k=>({name:k,score:rating(ratings[t+"|fit:"+k]),note:s(ratingNotes[t+"|fit:"+k])}));
  const priority=weights.map(([name,weight])=>({name,weight,score:rating(ratings[t+"|priority:"+name]),note:s(ratingNotes[t+"|priority:"+name])}));
  const ready=fit.every(x=>x.score)&&priority.every(x=>x.score);
  return {name:t,fit,priority,complete:ready,fitScore:ready?+(fit.reduce((a,x)=>a+x.score,0)/fit.length).toFixed(2):null,
   priorityScore:ready?+(priority.reduce((a,x)=>a+x.score*x.weight,0)/5).toFixed(1):null,
   filled:fit.filter(x=>x.score).length+priority.filter(x=>x.score).length};
 });
 const ranked=tasks.filter(t=>t.complete).sort((a,b)=>b.priorityScore-a.priorityScore||b.fitScore-a.fitScore);
 const chosen=tasks.find(t=>t.name===d.candidateTask)||null;
 const candidate=chosen||ranked[0]||null;
 const selectedTask=candidate?candidate.name:"";
 const deficient=tasks.filter(t=>!t.complete);
 const lowScores=candidate&&candidate.complete?candidate.fit.concat(candidate.priority).filter(x=>x.score<=2):[];
 const veryLow=candidate&&candidate.complete&&candidate.fit.every(x=>x.score<=2)&&candidate.priority.every(x=>x.score<=2);
 const alternative=s(d.nonAiAlternative),alternativeCompared=s(d.alternativeComparison);
 const alternativeChoice=s(d.aiNecessity)||"onbekend";
 const alternativeReason=s(d.aiNecessityReason);
 const aiUnproven=!alternative||!alternativeCompared||!alternativeReason||alternativeChoice==="onbekend";
 if(!s(d.problem))issues.push("Beschrijf het marketingprobleem met een concreet voorbeeld.");
 if(!s(d.goal))issues.push("Formuleer een toetsbaar verbeterdoel.");
 if(!tasks.length)issues.push("Voeg minimaal één concrete marketingtaak toe.");
 if(!selectedTask)issues.push("Selecteer de taak die je verder wilt onderzoeken.");
 if(deficient.length)warnings.push("De 1–5-expertscores zijn nog niet volledig voor "+deficient.map(t=>t.name).join(", ")+".");
 if(aiUnproven)issues.push("Vergelijk AI met een oplossing zonder AI en motiveer de keuze.");
 if(veryLow)redFlags.push("De onderzochte taak scoort zeer ongunstig op alle criteria. Een positieve AI-aanbeveling is niet verantwoord.");
 else if(lowScores.length)warnings.push("Bij de onderzochte taak zijn "+lowScores.length+" criteria laag beoordeeld. Onderzoek deze zwakke punten.");
 const riskItems=risks.map((name,i)=>{
  const key="risk"+i;const status=s(riskStatus[key])||(checks[key]===true?"afgevinkt-zonder-bewijs":"onbekend");const source=s(evidenceMap[key]);
  const verified=status==="beoordeeld"&&source.length>=8;
  return {key,name,status,source,verified};
 });
 const vendorItems=[["vendorPrivacy","Gegevensverwerking en leveranciersvoorwaarden"],["vendorSecurity","Beveiliging en menselijke controle"]].map(([key,name])=>{
  const status=s(riskStatus[key])||(checks[key]===true?"afgevinkt-zonder-bewijs":"onbekend"),source=s(evidenceMap[key]);
  return {key,name,status,source,verified:status==="beoordeeld"&&source.length>=8};
 });
 const blocked=riskItems.concat(vendorItems).filter(r=>r.status==="blokkade");
 const unverified=riskItems.concat(vendorItems).filter(r=>!r.verified&&r.status!=="blokkade");
 if(blocked.length)redFlags.push("Er zijn "+blocked.length+" expliciete juridische, technische of organisatorische blokkades.");
 if(unverified.length)issues.push(unverified.length+" risico-/leverancierscontroles missen bewijs of zijn nog onbekend.");
 const toolRows=(Array.isArray(d.tools)?d.tools:[]).map((name,i)=>{
  const items=toolKeys.map(k=>({name:k,score:rating(toolScores[i+"|"+k]),note:s(toolScoreNotes[i+"|"+k])}));
  const complete=items.every(x=>x.score);
  return {name:s(name)||"Optie "+(i+1),items,complete,mean:complete?+(items.reduce((a,x)=>a+x.score,0)/items.length).toFixed(2):null};
 });
 const selectedTool=s(d.selectedTool),toolEvidence=s(d.toolTestEvidence),costEvidence=s(d.toolCostEvidence);
 if(alternativeChoice!=="zonder_ai"&&!selectedTool)issues.push("Kies en motiveer een AI-oplossing of leg uit waarom AI niet nodig is.");
 if(alternativeChoice!=="zonder_ai"&&!toolEvidence)issues.push("Leg een echte praktijktest of concrete verificatie van de gekozen oplossing vast.");
 if(alternativeChoice!=="zonder_ai"&&!costEvidence)issues.push("Vergelijk de werkelijke en verwachte kosten van de oplossing.");
 const before=n(d.kpiBefore),after=n(d.kpiAfter),measured=before!==null&&after!==null;
 const delta=measured?+(after-before).toFixed(2):null;
 const pct=measured&&before!==0?+((after-before)/Math.abs(before)*100).toFixed(1):null;
 const direction=s(d.kpiDirection)||"onbekend";
 const unfavorable=measured&&(direction==="hoger"&&after<before||direction==="lager"&&after>before);
 const quality=s(d.qualityStatus)||"onbekend";
 const sample=n(d.sampleCount);
 const decision=["Doorgaan","Bijsturen","Stoppen"].includes(d.decision)?d.decision:null;
 const mismatch=!!decision&&((decision==="Doorgaan"&&(unfavorable||quality==="onvoldoende"||veryLow||blocked.length>0))||
   (decision==="Stoppen"&&measured&&!unfavorable&&quality==="voldoende"&&s(d.overrideReason)===""));
 if(unfavorable)redFlags.push("De hoofd-KPI is verslechterd ten opzichte van de nulmeting.");
 if(quality==="onvoldoende")redFlags.push("De outputkwaliteit is als onvoldoende beoordeeld.");
 if(mismatch)redFlags.push("Het gekozen vervolg '"+decision+"' is strijdig met de huidige meetgegevens of kritische controles.");
 if(!direction||direction==="onbekend")issues.push("Leg vast of voor deze KPI een hogere of lagere waarde wenselijk is.");
 if(!measured)issues.push("Voer een vergelijkbare nul- en effectmeting in.");
 if(!sample||sample<1)issues.push("Leg vast hoeveel taakuitvoeringen zijn gemeten.");
 if(quality==="onbekend")issues.push("Onderbouw de kwaliteit van de output afzonderlijk van tijdsbesparing.");
 if(!decision)issues.push("Registreer een voorlopig vervolg- of stopbesluit na evaluatie.");
 const verifiedRisk=riskItems.every(x=>x.verified)&&vendorItems.every(x=>x.verified);
 const phase1=!!s(d.problem)&&!!s(d.goal);
 const evidenceReady=phase1&&!!selectedTask&&!aiUnproven;
 const pilotDone=measured&&direction!=="onbekend"&&!!sample&&quality!=="onbekend"&&!!decision;
 let recommendation="Nog geen advies mogelijk",reason="Start met het bedrijfsprobleem en een concrete marketingtaak.",severity="empty";
 if(evidenceReady){
  if(blocked.length){recommendation="Eerst risico's oplossen";reason="Er is een expliciete blokkade. Start geen pilot met echte bedrijfsgegevens.";severity="blocked";}
  else if(alternativeChoice==="zonder_ai"){recommendation="Onderzoek eerst de oplossing zonder AI";reason="De ingevoerde vergelijking wijst op een eenvoudiger alternatief. Laat de businesscase en uitvoerbaarheid toetsen.";severity="noai";}
  else if(veryLow){recommendation="Geen positieve AI-aanbeveling";reason="De ingevulde scores zijn overal ongunstig. Herzie het probleem of de gekozen taak.";severity="blocked";}
  else if(mismatch){recommendation="Besluit herzien";reason="De voorgestelde vervolgbeslissing botst met belangrijke meetgegevens of kwaliteit.";severity="blocked";}
  else if(unfavorable||quality==="onvoldoende"){recommendation="Bijsturen of stoppen onderzoeken";reason="De metingen of outputkwaliteit geven onvoldoende grond om de toepassing voort te zetten.";severity="warning";}
  else if(!verifiedRisk){recommendation="Onderzoek voortzetten — nog geen vrijgave";reason="De noodzakelijke risico- en leverancierscontroles zijn nog niet aantoonbaar beoordeeld.";severity="warning";}
  else if(!pilotDone){recommendation="Pilot onder voorwaarden voorbereiden";reason="De eerste keuze is voorbereid, maar een effectmeting en evaluatie ontbreken nog.";severity="partial";}
  else if(!toolEvidence&&alternativeChoice!=="zonder_ai"){recommendation="Toolkeuze nog niet bewezen";reason="Er is onvoldoende verificatie van de geselecteerde AI-oplossing.";severity="warning";}
  else if(decision==="Stoppen"){recommendation="Stoppen en alternatief onderzoeken";reason="Het bedrijf heeft een stopbesluit vastgelegd. Documenteer de onderbouwing en eventuele alternatieven.";severity="noai";}
  else if(decision==="Bijsturen"){recommendation="Aanpassen en opnieuw testen";reason="Maak een nieuwe meetronde en leg vast welke aanpassingen worden uitgevoerd.";severity="warning";}
  else{recommendation="Concept implementatieadvies — menselijke goedkeuring nodig";reason="De minimale controles en metingen zijn vastgelegd. De inhoud vraagt nog onafhankelijke verificatie en werkveldvalidatie.";severity="ready";}
 }
 if(recommendation==="Nog geen advies mogelijk"&&phase1)reason="Selecteer een taak en vergelijk AI eerst met eenvoudigere alternatieven.";
 const status=severity==="ready"?"Concept eindadvies — verificatie nodig":severity==="empty"?"Onvoldoende gegevens":"Voorlopig advies — niet vrijgegeven";
 return {
  company:s(d.business)||"Onbenoemd bedrijf",problem:s(d.problem),goal:s(d.goal),resources:s(d.resources),experience:s(d.experience),
  tasks,ranked,candidate,selectedTask,unrated:deficient.map(t=>t.name),veryLow,lowScores,
  alternatives:{name:alternative,comparison:alternativeCompared,choice:alternativeChoice,reason:alternativeReason},
  risks:riskItems,vendors:vendorItems,riskMissing:unverified.map(r=>r.name),vendorMissing:vendorItems.filter(r=>!r.verified).map(r=>r.name),
  blocked,unverified,riskReady:verifiedRisk,selectedTool,tools:toolRows,toolsDone:toolRows.filter(t=>t.complete),toolEvidence,costEvidence,
  pilot:{task:s(d.pilotTask),owner:s(d.pilotOwner),duration:s(d.pilotDuration),success:s(d.pilotSuccess)},
  kpi:{name:s(d.kpiName),target:s(d.kpiTarget),before,after,change:delta,relative:pct,measured,direction,unfavorable,sample,quality,qualityEvidence:s(d.qualityEvidence)},
  decision,notes:s(d.notes),overrideReason:s(d.overrideReason),mismatch,issues,redFlags,warnings,phase1,provisional:evidenceReady,
  finalReady:severity==="ready",recommendation,reason,severity,status,
  limitations:["Prioriteitsgewichten en beoordelingsankers zijn voorlopige ontwerpkeuzes.","Geregistreerde scores zijn inschattingen; onderliggende bronnen moeten controleerbaar zijn.","Een voor- en nameting alleen bewijst geen causaal effect van AI.","Juridische beoordeling, beveiliging en investeringsbesluiten vereisen menselijke verificatie."]
 };
}
function createReport(d){
 const a=analyse(d),top=a.candidate;
 const block=(title,body)=>part(title,body);
 const status='<div class="report-verdict '+esc(a.severity)+'"><span>ADVIESRICHTING</span><h2>'+esc(a.recommendation)+'</h2><p>'+esc(a.reason)+'</p></div>';
 const facts='<div class="report-evidence-grid"><div><small>BEDRIJFSFEIT</small><b>'+esc(a.problem||"Nog niet ingevuld")+'</b></div><div><small>GEWENST RESULTAAT</small><b>'+esc(a.goal||"Nog niet ingevuld")+'</b></div></div>';
 const rank= a.ranked.length?'<table><thead><tr><th>Taak</th><th>Score*</th><th>Geschiktheid*</th></tr></thead><tbody>'+a.ranked.map(t=>'<tr><td>'+esc(t.name)+'</td><td>'+t.priorityScore+'/100</td><td>'+t.fitScore+'/5</td></tr>').join("")+'</tbody></table>':'<p>Er is nog geen volledig beoordeelde taak. Dat verhindert een definitieve vergelijking.</p>';
 const candidate=top?'<p><b>Gekozen onderzoekstaak:</b> '+esc(top.name)+(top.complete?' ('+top.priorityScore+'/100, voorlopige gewichten).':'. Expertbeoordeling nog onvolledig.')+'</p>':'<p>Nog geen taak geselecteerd.</p>';
 const prior=top&&top.complete?'<details><summary>Bekijk onderliggende scores en argumenten</summary><ul>'+top.priority.concat(top.fit).map(v=>'<li>'+esc(v.name)+': '+v.score+'/5'+(v.note?' — '+esc(v.note):' (geen toelichting)')+'</li>').join("")+'</ul></details>':'';
 const noai='<p><b>Alternatief zonder AI:</b> '+esc(a.alternatives.name||"Nog niet onderzocht")+'</p><p><b>Vergelijking:</b> '+esc(a.alternatives.comparison||"Ontbreekt")+'</p><p><b>Voorlopige keuze:</b> '+esc(a.alternatives.choice)+" — "+esc(a.alternatives.reason||"niet gemotiveerd")+'</p>';
 const riskStatus=a.blocked.length?'Er zijn blokkades. De inzet van echte gegevens is niet verantwoord.':a.unverified.length?'Nog niet alle controles zijn met bewijs onderbouwd. Geen vrijgave.':'Alle controles zijn geregistreerd met toelichting. Dit is geen juridisch certificaat.';
 const riskList='<p class="report-alert">'+esc(riskStatus)+'</p>'+list(a.blocked.concat(a.unverified).map(r=>r.name+' — '+(r.status==="blokkade"?"blokkade":r.status==="afgevinkt-zonder-bewijs"?"afgevinkt zonder bewijs":"bewijs of beoordeling ontbreekt")));
 const choices='<p><b>AI-oplossing:</b> '+esc(a.selectedTool||"Nog niet gekozen")+'</p><p><b>Praktijktest:</b> '+esc(a.toolEvidence||"Nog niet uitgevoerd of onderbouwd")+'</p><p><b>Kostenvergelijking:</b> '+esc(a.costEvidence||"Ontbreekt")+'</p>';
 const pilot='<p><b>Pilot:</b> '+esc(a.pilot.task||"Niet bepaald")+'</p><p><b>Eigenaar:</b> '+esc(a.pilot.owner||"Niet bepaald")+'</p><p><b>Duur:</b> '+esc(a.pilot.duration||"Niet bepaald")+'</p><p><b>Succes/stop:</b> '+esc(a.pilot.success||"Niet bepaald")+'</p>';
 const metrics=a.kpi.measured?'<p>Waargenomen verschil: <b>'+a.kpi.change+'</b> '+esc(a.kpi.name)+', '+(a.kpi.relative===null?"geen procentberekening mogelijk":a.kpi.relative+"%")+'.</p>':'<p>Er zijn nog geen vergelijkbare nul- en effectmetingen.</p>';
 const warning=a.mismatch?'<p class="report-alert"><b>Besluitconflict:</b> het gekozen besluit past niet bij de negatieve metingen, kwaliteit of blokkades.</p>':'';
 const directions=a.redFlags.length?list(a.redFlags):'<p>Geen expliciete alarmsignalen uit de ingevulde velden. Dit is geen onafhankelijke goedkeuring.</p>';
 const open=a.issues.length?list(a.issues):'<p>Geen ontbrekende invulvelden gedetecteerd; externe toetsing blijft nodig.</p>';
 let html='<header class="report-cover"><p>AI-GROEIKOMPAS · Onderzoeksprototype</p><h1>Bedrijfsspecifiek AI-advies</h1><h3>'+esc(a.company)+'</h3><p>'+esc(a.status)+'</p></header>';
 html+=block("Beslisadvies",status+facts);
 html+=block("1. Probleem en kans",candidate+rank+prior+'<p class="report-muted">*Scores zijn voorlopige beoordelingen, geen gevalideerde voorspellingen.</p>');
 html+=block("2. AI of eenvoudiger alternatief?",noai);
 html+=block("3. Risico's en randvoorwaarden",riskList);
 html+=block("4. Oplossing en pilot",choices+pilot);
 html+=block("5. Resultaten en evaluatie",'<p><b>KPI:</b> '+esc(a.kpi.name||"Niet bepaald")+'. <b>Wenselijke richting:</b> '+esc(a.kpi.direction)+'.</p><p><b>Nulmeting:</b> '+(a.kpi.before===null?"Onbekend":a.kpi.before)+'. <b>Effectmeting:</b> '+(a.kpi.after===null?"Onbekend":a.kpi.after)+'. <b>Aantal uitvoeringen:</b> '+(a.kpi.sample===null?"Onbekend":a.kpi.sample)+'.</p>'+metrics+'<p><b>Kwaliteit:</b> '+esc(a.kpi.quality)+' — '+esc(a.kpi.qualityEvidence||"geen onderbouwing")+'</p><p><b>Bedrijfsbesluit:</b> '+esc(a.decision||"Niet gekozen")+' — '+esc(a.notes||"geen toelichting")+'</p>'+warning);
 html+=block("6. Kritische signalen",directions);
 html+=block("7. Eerstvolgende acties",open);
 html+=block("Onderzoeksbeperkingen",list(a.limitations));
 html+='<footer>Concept ter controle door onderzoeker en bedrijfscoach. Geen automatisch juridisch of financieel fiat.</footer>';
 return {analysis:a,html,text:plainText(a)};
}
function plainText(a){return [
 "AI-GROEIKOMPAS · "+a.company,"Advies: "+a.recommendation,"Waarom: "+a.reason,
 "Probleem: "+a.problem,"Doel: "+a.goal,"Taak: "+a.selectedTask,
 "Alternatief zonder AI: "+a.alternatives.name,"Vergelijking: "+a.alternatives.comparison,
 "Gekozen AI: "+a.selectedTool,"Risico's open: "+a.unverified.length,"Blokkades: "+a.blocked.length,
 "KPI: "+a.kpi.name,"Meetverschil: "+a.kpi.change,"Besluit: "+a.decision,
 "Waarschuwingen: "+a.redFlags.join("; "),"Open acties: "+a.issues.join("; "),"Nog niet gevalideerde adviesmethodiek."
].join("\n")}
root.GroeikompasReport={analyse,createReport,escape:esc,weights,fitKeys,risks,toolKeys};
})(typeof window!=="undefined"?window:globalThis);
