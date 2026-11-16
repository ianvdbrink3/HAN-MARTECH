/* Evidence-first business advice from the documented five-phase Groeikompas. */
(function(root){"use strict";
const M=root.GK3,esc=M.esc,s=M.s;
const line=(label,value)=>'<div class="r-line"><span>'+esc(label)+'</span><strong>'+esc(value===undefined||value===null||value===""?"Nog niet onderbouwd":value)+'</strong></div>';
const section=(num,title,body)=>'<section class="r-section"><div class="r-chapter">FASE '+num+' · OFFICIEEL AI-GROEIKOMPAS</div><h2>'+esc(title)+'</h2>'+body+'</section>';
const list=items=>'<ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>';
const para=(name,value)=>'<p><b>'+esc(name)+'</b> '+esc(value||"Nog niet onderbouwd")+'</p>';
function build(c){
 const st=M.status(c),p=st.process,r=st.risk,impl=st.implementation,e=st.evaluation,x=c.company,ev=c.evaluation,t=p.chosen;
 const issues=[],warnings=[],nextActions=[];
 const add=(phase,title,detail)=>{issues.push({phase,title,detail});nextActions.push("Fase "+phase+": "+detail)};
 if(!st.phase[0])add(1,"Bedrijfsprofiel onvolledig","Vul het commerciële doel, de indicator, eigenaar en commerciële besteding van capaciteit aan.");
 if(M.FIT.some(z=>!t||t.fit.rows.some(y=>y.key===z[0]&&y.score===null)))add(2,"Geschiktheid ontbreekt","Beoordeel alle zeven taakcriteria op 1–5 en onderbouw lage waarden.");
 if(!p.fiveTasks)warnings.push("Het streefdoel van minimaal vijf gescoorde taken is nog niet gehaald.");
 if(t&&!t.fit.pass)add(2,"Ongeschikte taak","Los de geschiktheidscriteria onder 3 eerst op of kies een andere taak.");
 if(t&&!t.priority.pass)add(2,"Prioriteit onvoldoende","Onderbouw minimaal 60/100 volgens de formule uit het model.");
 if(t&&!t.first.pass)add(2,"Eerste-toepassingstoets","Beantwoord de vijf toepassingsvragen allemaal met ja, of kies een andere taak.");
 if(t&&t.riskLevel==="high")add(2,"Hoogrisicotaak","Gebruik deze taak niet als eerste AI-toepassing.");
 if(p.ahp.complete&&!p.ahp.consistent&&c.route==="full")warnings.push("AHP-matrix heeft een inconsistente weging; de startweging blijft leidend.");
 if(r.level==="unknown")add(3,"Risicoklasse ontbreekt","Beoordeel profilering, persoonsgegevens en directe klantoutput.");
 else if(r.routeConflict)add(3,"Verkeerde route voor risico","Bij middel-/hoog risico is de lichte route niet geschikt.");
 if(r.incomplete.length)add(3,"Verplichte maatregelen ontbreken","Werk "+r.incomplete.length+" controles voor risiconiveau "+r.level+" met bewijs uit.");
 if(r.blocked)add(3,"Risico geblokkeerd","Los de vastgelegde risico-blokkade op voordat echte bedrijfsgegevens worden gebruikt.");
 if(!r.go)add(3,"Geen geldige go","Laat de eigenaar een onderbouwd go/no-go-besluit nemen.");
 if(impl.tools.shortlist.length<2)add(4,"Geen gekwalificeerde shortlist","Vergelijk minstens twee opties op acht criteria en toets harde eisen.");
 if(impl.tools.tested.length<2)add(4,"Selectietest ontbreekt","Laat minstens twee opties dezelfde drie tot vijf opdrachten blind beoordelen.");
 if(!impl.baseOK)add(4,"Nulmeting ontbreekt","Meet minstens vijf huidige uitvoeringen op tijd en kwaliteit.");
 if(impl.cycles.filter(y=>y.complete).length<2)add(4,"PDSA-cycli onvoldoende","Documenteer twee volledige plan-do-study-act-rondes en meetresultaten.");
 if(!impl.acceptanceOK)warnings.push("De medewerkeracceptatie haalt de voorlopige streefwaarde 3,5/5 niet of is niet volledig gemeten.");
 if(impl.utilization!==null&&impl.utilization<80)warnings.push("Het AI-gebruik in de laatste cyclus blijft onder de voorlopige streefwaarde van 80%.");
 if(e.before===null||e.after===null)add(5,"Effectmeting ontbreekt","Voeg de volledige nul- en eindmetingen toe.");
 if(e.net===null)add(5,"Netto tijdwinst onbekend","Leg herhalingen, inrichttijd en leertijd vast.");
 if(e.conflict)add(5,"Besluitconflict","Doorgaan is niet te verantwoorden bij negatieve netto tijdwinst, lagere kwaliteit of open incidenten.");
 if(e.evidence==="unknown")add(5,"Bewijsniveau ontbreekt","Classificeer de meetopzet van ervaring (1) tot experiment (4).");
 if(e.roi===null)warnings.push("Geen aantoonbare ROI berekend. Dat is correct zolang kosten of gerealiseerde financiële baten onvoldoende onderbouwd zijn.");
 let verdict;
 if(r.blocked||r.routeConflict||t?.riskLevel==="high")verdict={tone:"danger",title:"Nog geen veilige eerste toepassing",subtitle:"Eerst risicoblokkades en routeconflicten oplossen. Geen vrijgave voor een live AI-pilot."};
 else if(t&&(!t.fit.pass||t.priority.complete&&!t.priority.pass))verdict={tone:"danger",title:"Deze taak is nog geen geschikte AI-start",subtitle:"De selectiegrenzen uit jullie model zijn niet gehaald. Onderzoek een ander proces of los knelpunten op."};
 else if(e.conflict)verdict={tone:"danger",title:"Bijsturen of stoppen is aangewezen",subtitle:"De gekozen beslissing botst met netto tijdwinst, kwaliteit of incidenten."};
 else if(e.canContinue&&st.phase[4])verdict={tone:"good",title:"Voorwaardelijk doorgaan en groeien",subtitle:"De gemeten resultaten zijn voldoende voor een onderbouwd vervolg, na controle door de eigenaar."};
 else if(p.chosen&&p.eligible)verdict={tone:"warn",title:"Onderzoekskandidaat geselecteerd",subtitle:"De taak voldoet aan de ingevoerde criteria; veiligheidscontrole, tooltest en effectmeting bepalen de definitieve keuze."};
 else verdict={tone:"warn",title:"Onderzoek in uitvoering",subtitle:"Het model verzamelt eerst aantoonbare bedrijfsfeiten, taakbeoordelingen en risico's vóór een aanbeveling."};
 const phase1='<div class="r-grid">'+
 line("Bedrijf",c.name)+line("Route",c.route==="light"?"Lichte route · microbedrijf":"Volledige route · groter MKB")+
 line("Commercieel doel",x.marketingGoal)+line("Marketingprobleem",x.problem)+
 line("Meetbaar verbeterdoel",x.goal)+line("Indicator",x.indicator)+
 line("Verantwoordelijke",x.owner)+line("Beschikbare systemen",x.systems)+
 line("Huidig AI-gebruik",x.currentAI)+line("Bestemming vrijgekomen tijd",x.commercialUse)+'</div>'+
 '<h3>Onderzochte marketingknelpunten</h3>'+list(x.issues.filter(s).length?x.issues.filter(s):["Nog geen drie concrete knelpunten uitgewerkt."])+
 '<p class="r-muted">Herleidbaarheid: TOE-raamwerk, AI-gereedheid en commerciële koppeling (brondocument p. 10–11).</p>';
 const sip=c.process.sipoc;
 const sipoc='<div class="r-grid">'+line("Suppliers",sip.supplier)+line("Inputs",sip.input)+line("Process",sip.steps)+line("Outputs",sip.output)+line("Customers",sip.customer)+'</div>';
 const rows=p.tasks.map(y=>'<tr><td>'+esc(y.name)+'</td><td>'+esc(y.kind)+'</td><td>'+esc(y.fit.average??"—")+'/5</td><td>'+esc(y.priority.total??"—")+'/100</td><td>'+esc(y.riskLevel)+'</td><td>'+esc(y.eligible?"Kan naar selectie":"Nog niet geschikt")+'</td></tr>').join("");
 const phase2=sipoc+'<h3>Taakbeoordelingen</h3><div class="tablewrap"><table><thead><tr><th>Taak</th><th>Groeitype</th><th>Fit</th><th>Prioriteit</th><th>Risico</th><th>Uitkomst</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
 para("Geselecteerde taak:",t?.name)+para("Voorgesteld alternatief zonder AI:",t?.nonAI)+
 para("Prioriteitsweging:",t?.priority.source||"Startweging 25/20/15/15/15/10")+
 '<p class="r-muted">De prioriteitsscore = Σ((score−1)/4 × gewicht). Eén fit-score onder 3 blokkeert geschiktheid. Grens eerste toepassing: 60/100. Risico hoog valt af.</p>';
 const needed=r.controls.map(y=>'<tr><td>'+esc(y.label)+'</td><td>'+esc(y.ok?"Onderbouwd":"Nog open")+'</td><td>'+esc(c.risk.controls[y.key]?.evidence||"Geen controleerbare bron")+'</td></tr>').join("");
 const phase3='<div class="r-grid">'+line("Risicoklasse",r.level)+line("Lichte route toegestaan",r.routeConflict?"Nee":"Niet geblokkeerd door route")+
 line("Verplichte controles",r.controls.length)+line("Ontbrekende controles",r.incomplete.length)+
 line("Eigenaar",c.risk.owner)+line("Go/no-go",c.risk.decision)+line("Beslisser",c.risk.decisionBy)+'</div>'+
 '<h3>Proportionele maatregelen</h3><div class="tablewrap"><table><thead><tr><th>Controle</th><th>Status</th><th>Onderbouwing</th></tr></thead><tbody>'+needed+'</tbody></table></div>'+
 para("Gebruiksafspraak:",c.risk.usageAgreement)+para("Menselijke controle:",c.risk.humanReview)+
 '<p class="r-muted">Deze beoordeling registreert aangeleverd bewijs; zij certificeert geen naleving van de AVG of AI-verordening.</p>';
 const toolRows=impl.tools.checked.map(y=>'<tr><td>'+esc(y.tool.name)+'</td><td>'+esc(y.mean??"—")+'/5</td><td>'+esc(y.hard?"Getoetst":"Nog open")+'</td><td>'+esc(y.trial.mean??"—")+'/5</td><td>'+esc(y.trial.time??"—")+'</td><td>'+esc(y.trial.pass?"Geschikt getest":"Nog geen geldige test")+'</td></tr>').join("");
 const phase4='<div class="r-grid">'+line("Benodigde AI-functie",c.implementation.function)+line("Oplossingsrichting",M.DIRECTIONS.find(y=>y[0]===c.implementation.direction)?.[1]||"Nog niet gekozen")+
 line("Tool uit blinde selectietest",impl.tools.winner?.tool.name||"Geen verantwoord testresultaat")+
 line("Volledige nulmetingen",impl.baseOK?"Ja":"Nee")+
 line("Voltooide PDSA-cycli",impl.cycles.filter(y=>y.complete).length+"/2")+
 line("Medewerkeracceptatie",impl.acceptanceOK?"≥3,5/5 behaald":"Nog niet aangetoond")+
 line("Gebruik laatste ronde",impl.utilization===null?"Niet vastgesteld":impl.utilization+"%")+
 line("Besluitdatum",c.implementation.pilot.decisionDate)+'</div>'+
 '<h3>Gelijke selectietest</h3><div class="tablewrap"><table><thead><tr><th>Optie</th><th>Matrixscore</th><th>Harde eisen</th><th>Testkwaliteit</th><th>Minuten/opdracht</th><th>Uitkomst</th></tr></thead><tbody>'+toolRows+'</tbody></table></div>'+
 para("Succescriterium:",c.implementation.pilot.success)+para("Stopcriterium:",c.implementation.pilot.stop)+
 para("Opleiding en oefenen:",c.implementation.training.practice)+para("Overdracht:",c.implementation.pilot.handover);
 const phase5='<div class="r-grid">'+line("Tijd oude werkwijze",e.before===null?"Nog niet gemeten":e.before+" minuten")+
 line("Tijd laatste pilotronde",e.after===null?"Nog niet gemeten":e.after+" minuten")+
 line("Netto tijdwinst",e.net===null?"Onbekend":e.net+" minuten")+
 line("Terugverdienpunt",e.payback===null?"Onbekend":e.payback+" uitvoeringen")+
 line("Kwaliteit vóór",e.qb===null?"Onbekend":e.qb+"/5")+
 line("Kwaliteit ná",e.qa===null?"Onbekend":e.qa+"/5")+
 line("Kosten totaal",e.cost===null?"Niet volledig onderbouwd":"€ "+e.cost)+
 line("ROI",e.roi===null?"Geen betrouwbare financiële ROI":e.roi+"%")+
 line("Bewijsniveau",e.evidence==="unknown"?"Niet vastgesteld":e.evidence+"/4")+
 line("Eindbesluit",ev.decision)+line("Volgende taak",e.next?.name||"Nog niet vastgesteld")+'</div>'+
 para("Onderbouwing besluit:",ev.decisionReason)+para("Klant-KPI:",ev.customerMetric)+
 para("Klantbeleving:",ev.userFeedback)+para("Commerciële inzet van vrijgekomen tijd:",ev.reallocated)+
 '<p class="r-muted">Netto tijd = bespaarde minuten × uitvoeringen − inrichten − leren. Financiële ROI alleen met aantoonbare baten én de volledige kosten. Een voor-/nameting bewijst geen causaliteit.</p>';
 const actions=nextActions.slice(0,12).map((x,i)=>'<li><b>Actie '+(i+1)+':</b> '+esc(x)+'</li>').join("");
 const html='<header class="r-cover"><small>GHUB-M7 · AI-GROEIKOMPAS · ONDERZOEKSPRODUCT</small><h1>AI-implementatieadvies</h1><h3>'+esc(c.name)+'</h3><p>'+esc(c.route==="light"?"Lichte route":"Volledige route")+' · '+esc(st.phase.filter(Boolean).length)+'/5 fasen gedocumenteerd</p></header>'+
 '<div class="r-decision '+esc(verdict.tone)+'"><span>VOORLOPIGE BESLISRICHTING</span><h2>'+esc(verdict.title)+'</h2><p>'+esc(verdict.subtitle)+'</p></div>'+
 section(1,"Bedrijfsanalyse en marketingvraagstuk",phase1)+section(2,"Procesanalyse en prioritering",phase2)+
 section(3,"Randvoorwaarden en risicobeoordeling",phase3)+section(4,"AI-selectie en implementatie",phase4)+section(5,"Meten, evalueren en groeien",phase5)+
 '<section class="r-section"><div class="r-chapter">PRIORITEITEN EN VERVOLGSTAPPEN</div><h2>Wat moet het bedrijf nu doen?</h2>'+(actions?'<ol>'+actions+'</ol>':'<p>De digitale formulieren zijn compleet; controleer de brongegevens en besluitvorming met de bedrijfscoach.</p>')+'</section>'+
 '<section class="r-section"><div class="r-chapter">ONDERZOEKSKWALITEIT</div><h2>Beperkingen en bewijskracht</h2><p>Startwegingen, kwaliteitsankers, risicodrempels en KPI-normen zijn keuzes van de projectgroep en moeten nog worden getoetst. De beoordeling is uitsluitend gebaseerd op ingevoerde gegevens. Een AI-tool of juridische checkbox wordt niet onafhankelijk geverifieerd. Bewijsniveau '+esc(e.evidence==="unknown"?"onbekend":e.evidence)+'</p>'+
 (warnings.length?list(warnings):"")+'</section>'+
 '<footer><p>Bron: AI - Groeikompas-2, GHUB-M7, conceptversie 30 november 2026, §1.4–1.10. Dit is een onderzoeksinstrument en geen onafhankelijk juridisch of financieel advies.</p></footer>';
 return {html,verdict,issues,warnings,status:st};
}
const printCSS='body{max-width:850px;margin:24px auto;padding:0 24px;font:14px Arial,sans-serif;color:#243b48;line-height:1.55}.r-cover{padding:20px 0;border-bottom:3px solid #157f72}.r-cover h1{font-size:28px}.r-cover small,.r-chapter{font-size:10px;letter-spacing:1px;color:#167d71;font-weight:800}.r-section{padding:14px 0;border-bottom:1px solid #ddd;break-inside:avoid}.r-line{display:flex;justify-content:space-between;gap:20px;padding:8px 0;border-bottom:1px solid #eaeaea}.r-line span{color:#657a86}.r-line strong{max-width:58%;overflow-wrap:anywhere}.r-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}.r-decision{background:#edf8f5;border-left:4px solid #167d71;padding:16px}.r-decision.danger{background:#fff0eb;border-color:#ba5840}.tablewrap{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #dde5e6;padding:8px;text-align:left}th{background:#f0f6f5}.r-muted,footer{color:#74858e;font-size:11px}@media print{@page{size:A4;margin:14mm}}';
function standalone(c){return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>AI-Groeikompas | '+esc(c.name)+'</title><style>'+printCSS+'</style></head><body>'+build(c).html+'</body></html>'}
root.GK3Report={build,standalone};
})(typeof window!=="undefined"?window:globalThis);