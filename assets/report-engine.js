/* AI-GROEIKOMPAS - deterministic advice engine v1.
 * Proposed ranking weights are research hypotheses, NOT validated standards.
 * No generated values, inferred ROI, or legal clearance.
 */
(function(root) {
"use strict";
var weights=[["Commerciële waarde",25],["Efficiëntie",20],["Klantwaarde",15],["Benodigde inspanning",15],["Meetbaarheid",15],["Afhankelijkheden",10]];
var fitKeys=["Duidelijkheid","Beschikbaarheid informatie","Controleerbaarheid","Herhaalbaarheid","Toegevoegde waarde","Beheersbaarheid fouten","Menselijke betrokkenheid"];
var toolKeys=["Taakfit","Data","Integratie","Kosten","Outputkwaliteit","Gebruiksgemak","Meerwaarde","Leveranciersafhankelijkheid"];
var riskLabels=["Gegevens beschikbaar en betrouwbaar","Doel en grondslag persoonsgegevens vastgesteld","Noodzaak DPIA beoordeeld","AI-verordening en marketingkanaal beoordeeld","Menselijk toezicht geregeld","Toegangsbeheer en beveiliging onderzocht","Verantwoordelijke aangewezen"];
function string(v){return typeof v==="string"?v.trim():""}
function has(v){return v!==null&&v!==undefined&&string(String(v))!==""}
function val(n){var v=Number(n);return Number.isFinite(v)&&v>=1&&v<=5?v:0}
function inputs(d){return d&&typeof d==="object"?d:{}}
function getScores(d,task) {
 var ratings=d.ratings||{}, notes=d.ratingNotes||{};
 var fit=fitKeys.map(function(k){return {name:k,score:val(ratings[task+"|fit:"+k]),note:string(notes[task+"|fit:"+k])}});
 var priority=weights.map(function(w){return {name:w[0],weight:w[1],score:val(ratings[task+"|priority:"+w[0]]),note:string(notes[task+"|priority:"+w[0]])}});
 var completeFit=fit.every(function(x){return x.score>0}),completePriority=priority.every(function(x){return x.score>0});
 var weighted=completePriority?Math.round(priority.reduce(function(a,x){return a+x.score*x.weight},0)/5*10)/10:null;
 var average=completeFit?Math.round(fit.reduce(function(a,x){return a+x.score},0)/fit.length*100)/100:null;
 return {name:task,fit:fit,priority:priority,fitComplete:completeFit,priorityComplete:completePriority,fitScore:average,priorityScore:weighted,
 completeness:fit.filter(function(x){return x.score}).length+priority.filter(function(x){return x.score}).length};
}
function analyse(d){
 d=inputs(d);
 var tasks=(Array.isArray(d.tasks)?d.tasks:[]).filter(function(t){return string(t)}).map(function(t){return getScores(d,String(t))});
 var ranked=tasks.filter(function(t){return t.fitComplete&&t.priorityComplete}).sort(function(a,b){return b.priorityScore-a.priorityScore||b.fitScore-a.fitScore});
 var pending=tasks.filter(function(t){return !t.fitComplete||!t.priorityComplete}).map(function(t){return t.name});
 var issues=[];
 if(!string(d.problem))issues.push("Formuleer het huidige marketingprobleem in fase 1.");
 if(!string(d.goal))issues.push("Leg een meetbaar verbeterdoel vast in fase 1.");
 if(!tasks.length)issues.push("Voeg marketingtaken toe in fase 2.");
 if(!ranked.length)issues.push("Vul de geschiktheids- en prioriteitsbeoordelingen van minimaal één taak volledig in.");
 if(pending.length)issues.push("Nog niet volledig beoordeeld: "+pending.join(", ")+".");
 var checks=d.checks||{};
 var riskMissing=riskLabels.filter(function(label,i){return checks["risk"+i]!==true});
 var vendorMissing=["vendorPrivacy","vendorSecurity"].filter(function(k){return checks[k]!==true});
 if(riskMissing.length)issues.push("Er zijn "+riskMissing.length+" algemene risico-controlepunten open.");
 if(vendorMissing.length)issues.push("De leveranciersspecifieke privacy- en beveiligingscontrole is nog niet volledig.");
 var tools=(Array.isArray(d.tools)?d.tools:[]).map(function(name,i){
   var scoreMap=d.toolScores||{}, noteMap=d.toolScoreNotes||{};
   var items=toolKeys.map(function(k){return {name:k,score:val(scoreMap[i+"|"+k]),note:string(noteMap[i+"|"+k])}});
   var completed=items.every(function(x){return x.score>0});
   return {name:string(name)||"Optie "+(i+1),complete:completed,items:items,mean:completed?Math.round(items.reduce(function(sum,x){return sum+x.score},0)/items.length*100)/100:null};
 });
 var toolsDone=tools.filter(function(t){return t.complete}).sort(function(a,b){return b.mean-a.mean});
 var selected=string(d.selectedTool);
 if(!selected)issues.push("Onderbouw de keuze voor een concrete AI-oplossing in fase 4.");
 if(!string(d.pilotTask)||!string(d.pilotSuccess))issues.push("Leg de pilottaken en succes-/stopcriteria vooraf vast.");
 var before=has(d.kpiBefore)?Number(d.kpiBefore):null;
 var after=has(d.kpiAfter)?Number(d.kpiAfter):null;
 var measured=before!==null&&after!==null&&Number.isFinite(before)&&Number.isFinite(after);
 var change=measured?Math.round((after-before)*100)/100:null;
 var relative=measured&&before!==0?Math.round((after-before)/Math.abs(before)*1000)/10:null;
 var decision=["Doorgaan","Bijsturen","Stoppen"].includes(d.decision)?d.decision:null;
 var riskReady=!riskMissing.length&&!vendorMissing.length;
 var company=string(d.business)||"Onbenoemd bedrijf";
 var candidate=ranked[0]||null;
 var scoreGap=ranked.length>1?Math.round((ranked[0].priorityScore-ranked[1].priorityScore)*10)/10:null;
 var tie=scoreGap!==null&&scoreGap===0;
 var phase1=!!(string(d.problem)&&string(d.goal));
 var provisional=phase1&&!!candidate;
 var finalReady=provisional&&riskReady&&selected&&string(d.pilotTask)&&string(d.pilotSuccess)&&measured&&!!decision;
 var qualityUnknown=true;
 if(!measured)issues.push("Effectmeting ontbreekt: vul KPI, nulmeting en effectmeting in.");
 if(!decision)issues.push("Leg het vervolgadvies doorgaan, bijsturen of stoppen vast.");
 return {
  company:company,problem:string(d.problem),goal:string(d.goal),resources:string(d.resources),experience:string(d.experience),
  tasks:tasks,ranked:ranked,candidate:candidate,scoreGap:scoreGap,tie:tie,unrated:pending,
  riskMissing:riskMissing,vendorMissing:vendorMissing,riskReady:riskReady,
  selectedTool:selected,tools:tools,toolsDone:toolsDone,
  pilot:{task:string(d.pilotTask),owner:string(d.pilotOwner),duration:string(d.pilotDuration),success:string(d.pilotSuccess)},
  kpi:{name:string(d.kpiName),target:string(d.kpiTarget),before:before,after:after,change:change,relative:relative,measured:measured},
  decision:decision,notes:string(d.notes),issues:issues,phase1:phase1,provisional:provisional,finalReady:!!finalReady,qualityUnknown:qualityUnknown,
  limitations:["De prioriteitsgewichten en scoreankers zijn nog niet extern gevalideerd.","De scores zijn inschattingen, geen bewezen commerciële effecten.","Een eenvoudige voor- en nameting bewijst geen causaal AI-effect.","Afgevinkte controles vormen geen juridische goedkeuring."],
  status:!provisional?"Onvoldoende gegevens":finalReady?"Concept eindadvies – ter beoordeling":"Voorlopig advies – nog niet gevalideerd"
 };
}
function esc(value){return String(value==null?"":value).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function p(v,empty){return esc(v||empty||"Nog niet ingevuld")}
function list(items){return "<ul>"+items.map(function(x){return "<li>"+esc(x)+"</li>"}).join("")+"</ul>"}
function section(title,body){return '<section class="report-section"><h2>'+esc(title)+'</h2>'+body+'</section>'}
function createReport(d) {
 var a=analyse(d),top=a.candidate;
 var ranking=a.ranked.length?'<div class="report-table-wrap"><table><thead><tr><th>Marketingtaak</th><th>Prioriteit</th><th>Geschiktheid</th><th>Status</th></tr></thead><tbody>'+a.ranked.map(function(t,i){return '<tr><td>'+esc(t.name)+'</td><td>'+t.priorityScore+'/100</td><td>'+t.fitScore+'/5</td><td>'+(i===0?"Eerste kandidaat":"Alternatief")+'</td></tr>'}).join("")+'</tbody></table></div>':'<p class="report-muted">Nog geen volledig beoordeelde marketingtaak.</p>';
 var explanation=top?top.priority.map(function(c){return '<li><b>'+esc(c.name)+' ('+c.weight+'%):</b> '+c.score+'/5'+(c.note?" — "+esc(c.note):" — geen inhoudelijke toelichting toegevoegd")+'</li>'}).join(""):"";
 var fitEvidence=top?top.fit.map(function(c){return '<li><b>'+esc(c.name)+':</b> '+c.score+'/5'+(c.note?" — "+esc(c.note):" — toelichting ontbreekt")+'</li>'}).join(""):"";
 var risks=a.riskMissing.length?'<p class="report-alert">Niet alle randvoorwaarden zijn beoordeeld. Voer geen echte pilot met persoonsgegevens uit zonder passende controles.</p>'+list(a.riskMissing):'<p>Alle zeven algemene controlepunten zijn afgevinkt. Controleer het onderliggende bewijs: dit is geen juridische vrijgave.</p>';
 var vendor=a.vendorMissing.length?'<p class="report-alert">Leveranciersspecifieke controles staan nog open: '+esc(a.vendorMissing.join(", "))+'.</p>':'<p>Leverancierscontroles zijn als uitgevoerd gemarkeerd. Verifieer het bewijs.</p>';
 var rankedTools=a.toolsDone.length?'<p>Volledig beoordeelde alternatieven: '+a.toolsDone.map(function(t){return esc(t.name)+' ('+t.mean+'/5)'}).join("; ")+'.</p>':'<p class="report-muted">Er is nog geen volledig beoordeelde AI-tool.</p>';
 var toolEvidence=a.toolsDone.length?a.toolsDone.map(function(t){
   return '<h3>'+esc(t.name)+' ('+t.mean+'/5)</h3><ul>'+t.items.map(function(item){return '<li><b>'+esc(item.name)+':</b> '+item.score+'/5'+(item.note?' — '+esc(item.note):' — toelichting ontbreekt')+'</li>'}).join("")+'</ul>';
 }).join(""):'';

 var evidence='<p>'+ (top?'Eerste kandidaat op basis van volledig ingevulde criteria: <b>'+esc(top.name)+'</b> ('+top.priorityScore+'/100).':'Een aanbeveling voor een marketingtaak is nog niet mogelijk.')+'</p>'+(a.tie?'<p class="report-alert">Gelijke topscore: bespreek de doorslaggevende argumenten met het bedrijf.</p>':'')+(a.unrated.length?'<p>Niet alle taken zijn beoordeeld. De huidige rangorde is mogelijk onvolledig.</p>':'');
 var content='<header class="report-cover"><p>AI-GROEIKOMPAS • Bedrijfsspecifiek conceptadvies</p><h1>AI-implementatieadvies</h1><h3>'+esc(a.company)+'</h3><p>Gebaseerd op het ingevulde bedrijfsdossier. Status: '+esc(a.status)+'.</p></header>';
 content+=section("1. Managementsamenvatting",'<p><b>Marketingprobleem:</b> '+p(a.problem)+'</p><p><b>Gewenste verbetering:</b> '+p(a.goal)+'</p>'+evidence+'<p><b>Belangrijke begrenzing:</b> dit is een voorlopig, regelgestuurd advies. De methodiek en resultaten moeten door het bedrijf en de onderzoeker worden gevalideerd.</p>');
 content+=section("2. Procesprioritering",ranking+(top?'<h3>Commerciële prioriteit: onderbouwing</h3><ul>'+explanation+'</ul><h3>Taakgeschiktheid: onderbouwing</h3><ul>'+fitEvidence+'</ul>':'')+'<p class="report-muted">Rangorde is berekend met de voorlopige 25/20/15/15/15/10-gewichten. Geen definitieve norm.</p>');
 content+=section("3. Risico’s en voorwaarden",risks+vendor);
 content+=section("4. AI-oplossing en pilot",'<p><b>Gekozen oplossing en motivatie:</b> '+p(a.selectedTool)+'</p>'+rankedTools+toolEvidence+'<p><b>Afgebakende pilottaak:</b> '+p(a.pilot.task)+'</p><p><b>Verantwoordelijke:</b> '+p(a.pilot.owner)+'</p><p><b>Duur en herhalingen:</b> '+p(a.pilot.duration)+'</p><p><b>Succes- en stopcriteria:</b> '+p(a.pilot.success)+'</p>');
 content+=section("5. Meten en evalueren",'<p><b>KPI:</b> '+p(a.kpi.name)+'</p><p><b>Vooraf bepaald doel:</b> '+p(a.kpi.target)+'</p><p><b>Nulmeting:</b> '+(a.kpi.before===null?"Ontbreekt":a.kpi.before)+'</p><p><b>Effectmeting:</b> '+(a.kpi.after===null?"Ontbreekt":a.kpi.after)+'</p>'+(a.kpi.measured?'<p><b>Waargenomen verschil:</b> '+a.kpi.change+' eenheden'+(a.kpi.relative===null?"":" ("+a.kpi.relative+"%)")+'. Of een stijging gunstig is hangt af van de KPI.</p>':'<p class="report-muted">Er kan nog geen effect worden bepaald.</p>')+'<p><b>Vervolgkeuze:</b> '+p(a.decision)+'</p><p><b>Onderbouwing:</b> '+p(a.notes)+'</p>');
 content+=section("6. Open acties vóór definitieve besluitvorming",a.issues.length?list(a.issues):'<p>Geen open invulpunten herkend. Deskundige controle en externe validatie blijven noodzakelijk.</p>');
 content+=section("7. Onderzoeksbeperkingen",list(a.limitations));
 content+='<footer>AI-GROEIKOMPAS · Conceptadvies · Controleer feiten, bronverwijzingen en randvoorwaarden vóór extern gebruik.</footer>';
 return {analysis:a,html:content,text:plainText(a)};
}
function plainText(a){return ["AI-GROEIKOMPAS – adviesrapport",a.company,a.status,"Marketingprobleem: "+(a.problem||"ontbreekt"),"Doel: "+(a.goal||"ontbreekt"),"Eerste kandidaat: "+(a.candidate?a.candidate.name+" ("+a.candidate.priorityScore+"/100)":"nog niet vast te stellen"),"Geselecteerde AI-oplossing: "+(a.selectedTool||"nog niet gekozen"),"Vervolg: "+(a.decision||"nog geen besluit"),"Open acties: "+a.issues.join("; "),"Dit advies gebruikt nog niet gevalideerde gewichten. Controle en validatie vereist."].join("\n")}
root.GroeikompasReport={analyse:analyse,createReport:createReport,escape:esc,weights:weights,fitKeys:fitKeys};
})(typeof window!=="undefined"?window:globalThis);
