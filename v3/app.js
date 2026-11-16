/* AI-GROEIKOMPAS v3 — five-phase research workspace. No external AI calls, all data remains in this browser. */
(function(){"use strict";
const M=window.GK3,KEY="ghub-groeikompas-v3";
let vault,active,current="overview",taskIndex=0,toolIndex=0,openMenu=false;
const $=id=>document.getElementById(id),E=M.esc;
function oldMigration(){let legacy;try{legacy=JSON.parse(localStorage.getItem("han-ai-groeikompas-dossiers-v1")||"null")}catch(e){}
 if(!legacy?.cases?.length)return null;
 return legacy.cases.map(c=>{
  const x=M.newCase(c.name||"Geïmporteerd bedrijf"),d=c.data||{};
  x.legacyRaw=d;x.company.problem=d.problem||"";x.company.goal=d.goal||"";x.company.currentAI=d.experience||"";
  x.company.systems=d.resources||"";x.company.indicator=d.kpiName||"";
  x.process.tasks=(Array.isArray(d.tasks)?d.tasks:[]).map(t=>M.newTask(t));
  x.implementation.pilot.task=d.pilotTask||"";x.implementation.pilot.period=d.pilotDuration||"";
  x.implementation.pilot.success=d.pilotSuccess||"";x.evaluation.decision=d.decision==="Doorgaan"?"continue":d.decision==="Bijsturen"?"adjust":d.decision==="Stoppen"?"stop":"unknown";
  return x;
 });
}
function init(){try{vault=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){}
 if(!vault||!Array.isArray(vault.cases)||!vault.cases.length){let existing=oldMigration();vault={version:3,cases:existing?.length?existing:[M.newCase("Bedrijf 1")],selected:null,migrated:!!existing};vault.selected=vault.cases[0].id;persist()}
 active=vault.cases.find(x=>x.id===vault.selected)||vault.cases[0];vault.selected=active.id;render()}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(vault))}catch(e){alert("Opslaan mislukt. Exporteer de gegevens en controleer de browseropslag.")}}
function get(path){return path.split(".").reduce((v,k)=>v==null?undefined:v[k],active)}
function set(path,value){const keys=path.split("."),last=keys.pop();let node=active;for(const key of keys){if(node[key]===undefined)node[key]={};node=node[key]}node[last]=value;persist()}
function input(path,label,hint="",type="text",opts){
 const v=get(path)??"",id="f-"+path.replace(/[^a-z0-9]/gi,"-");
 let control="";
 if(type==="textarea")control='<textarea rows="3" id="'+id+'" data-field="'+path+'" placeholder="'+E(opts?.placeholder||"")+'">'+E(v)+'</textarea>';
 else if(type==="select")control='<select id="'+id+'" data-field="'+path+'">'+opts.map(o=>'<option value="'+E(o[0])+'" '+(String(v)===String(o[0])?"selected":"")+'>'+E(o[1])+'</option>').join("")+'</select>';
 else control='<input id="'+id+'" data-field="'+path+'" type="'+type+'" value="'+E(v)+'" placeholder="'+E(opts?.placeholder||"")+'">';
 return '<div class="field '+(type==="textarea"?"wide":"")+'"><label for="'+id+'">'+E(label)+'</label>'+(hint?'<small>'+E(hint)+'</small>':"")+control+'</div>';
}
function fields(items){return '<div class="form-grid">'+items.map(item=>input.apply(null,item)).join("")+'</div>'}
function choices(path,options){const v=get(path);return '<div class="optionrow">'+options.map(o=>'<button type="button" class="chip '+(v===o[0]?"selected ":"")+(o[0]==="blocked"?"bad":"")+'" data-choice="'+E(path)+'" data-value="'+E(o[0])+'">'+E(o[1])+'</button>').join("")+'</div>'}
const yesno=[["unknown","Nog onbekend"],["yes","Ja"],["no","Nee"]];
function button(label,action,cls="secondary",value=""){return '<button type="button" class="btn '+cls+'" data-action="'+action+'" data-value="'+E(value)+'">'+E(label)+'</button>'}
function card(title,body,id){return '<section class="card" '+(id?'id="'+id+'"':"")+'><h2>'+title+'</h2>'+body+'</section>'}
function note(t,kind=""){return '<div class="notice '+kind+'">'+t+'</div>'}
function fold(title,body,opened=false){return '<details class="fold" '+(opened?"open":"")+'><summary>'+title+'</summary>'+body+'</details>'}
function progress(){const st=M.status(active);return '<span class="pill '+(st.phase.filter(Boolean).length?"good":"")+'">'+st.phase.filter(Boolean).length+'/5 fasen onderbouwd</span>'}
function title(name,sub){$("title").textContent=name;$("subtitle").textContent=sub}
function nav(){const st=M.status(active);$("navigation").innerHTML=[["overview","Overzicht","⌂"],...M.PHASES.map((n,i)=>["p"+i,(i+1)+". "+n,String(i+1)]),["compare","Bedrijven vergelijken","≡"],["report","Adviesrapport","▤"],["about","Methodiek & bronnen","◈"]].map(x=>'<button class="'+(current===x[0]?"active":"")+'" data-nav="'+x[0]+'"><span class="number">'+E(x[2])+'</span><span>'+E(x[1])+'</span>'+(x[0].startsWith("p")&&st.phase[Number(x[0].slice(1))]?'<span class="tick">✓</span>':"")+'</button>').join("")}
function headingStage(i,subtitle){return '<header class="stagehero"><span class="stagecount">FASE '+(i+1)+' VAN 5 • BRON: AI-GROEIKOMPAS §1.7</span><h2>'+E(M.PHASES[i])+'</h2><p>'+E(subtitle)+'</p></header>'}
function guide(i){const g=M.guidance(active)[i],a=window.GK3Advisor?.plan(active,i);
 const cards=a?.results.map(x=>'<div class="taskcard"><div class="taskhead"><b>'+E(x.title)+'</b>'+(x.action?button("Gebruik voorstel","advisor-"+x.action,"xs",x.value):"")+'</div><p style="font-weight:750;color:#274e62">'+E(x.body)+'</p><small>'+E(x.info)+'</small></div>').join("")||"";
 const facts=a?.basis.length?fold("Waarop zijn deze voorstellen gebaseerd?",'<ul>'+a.basis.map(x=>'<li>'+E(x)+'</li>').join("")+'</ul>'):"";
 return '<section class="guidance"><span class="eyebrow">✦ UIT EERDERE BEDRIJFSANTWOORDEN</span><h3>'+E(g.summary)+'</h3><p>Deze voorstellen zijn gerichte onderzoekshypothesen uit het gekozen proces en de beschikbare bedrijfsinformatie — geen geteste productaanbevelingen.</p>'+
 (cards?'<div class="tasks">'+cards+'</div>':"")+facts+'<div class="guide-next">↳ '+E(g.next)+'</div></section>'
}
function kpiPanel(i){
 const q=window.GK3Kpis?.phase(active,i);
 if(!q)return "";
 return card("KPI's van deze fase — uit het brondocument",'<div class="metricbar"><div class="metric"><strong>'+q.passed+'/'+q.items.length+'</strong><small>Voorlopige doelen behaald</small></div><div class="metric"><strong>'+q.pending+'</strong><small>Nog niet meetbaar</small></div><div class="metric"><strong>'+q.failed+'</strong><small>Streefwaarde nog niet gehaald</small></div></div>'+
 fold("Bekijk alle fase-indicatoren",q.items.map(x=>'<div class="riskline"><div><strong>'+E(x.label)+'</strong><p>'+E(x.detail)+'</p></div><span class="pill '+(x.ok===true?"good":x.ok===false?"bad":"")+'">'+(x.ok===true?"Streefwaarde gehaald":x.ok===false?"Nog niet gehaald":"Onbekend")+'</span></div>').join(""))+
 '<p class="muted">Dit zijn voorlopige KPI-streefwaarden van de projectgroep. Een negatieve uitkomst kan methodologisch valide zijn en vormt niet automatisch een onvolledige onderzoeksfase.</p>');
}
function next(i){return '<div class="phase-nav">'+(i>0?'<button class="btn secondary" data-nav="p'+(i-1)+'">← Vorige fase</button>':"<span></span>")+'<button class="btn" data-nav="'+(i<4?"p"+(i+1):"report")+'">'+(i===4?"Bekijk adviesrapport →":"Naar fase "+(i+2)+" →")+'</button></div>'}
function summary(){title("AI-GROEIKOMPAS","Van marketingprobleem naar een verantwoorde, geteste en gemeten toepassing.");
 const st=M.status(active),g=M.guidance(active);
 return '<div class="hero"><span class="eyebrow">GHUB-M7 · HBO COMMERCIËLE ECONOMIE</span><h2>Een echt besluit begint bij het probleem. Niet bij een AI-tool.</h2><p>Dit onderzoekstraject vertaalt jullie AI-Groeikompas naar vijf opeenvolgende stappen. Geen fictieve scores of juridische vinkjes: ontbrekend bewijs blijft zichtbaar.</p>'+button("Start of vervolg het onderzoek","go-current","")+'</div>'+
 '<div class="grid">'+card("Voortgang",'<div class="stat">'+st.phase.filter(Boolean).length+' <small>/ 5 fasen</small></div><p class="statlabel">Onderbouwd volgens de digitale minimumcontroles</p>')+
 card("Risico",'<div class="stat">'+E(st.risk.level)+'</div><p class="statlabel">Afgeleid uit de drie risico-indicatoren</p>')+
 card("Volgende beslissing",'<p style="font-weight:800;color:#234d5d">'+E(g[active.phase||0].summary)+'</p>')+'</div>'+
 card("De vijf fasen",'<div class="tasks">'+M.PHASES.map((n,i)=>'<div class="taskcard"><div class="taskhead"><b>'+(i+1)+'. '+E(n)+'</b><span class="pill '+(st.phase[i]?"good":"")+'">'+(st.phase[i]?"Onderbouwd":"Onderzoek loopt")+'</span>'+button("Open","nav","xs","p"+i)+'</div><p>'+E(g[i].next)+'</p></div>').join("")+'</div>')+
 (vault.migrated?note("Gegevens uit het oudere dashboard zijn bewaard. Omdat het officiële model andere criteria en scoreformules heeft, zijn oude scores niet zonder herbeoordeling overgenomen.","warn"):"")+
 note("Onderzoeksversie. De projectgroep moet aannames, normwaarden en bruikbaarheid toetsen bij MKB-bedrijven. Lokaal opgeslagen: exporteer regelmatig een back-up.","blue");
}
function phase1(){title("Fase 1 · Bedrijfsanalyse","TOE, AI-gereedheid en een meetbaar verbeterdoel.");
 const c=active.company;
 return headingStage(0,"Beschrijf de uitgangssituatie langs technologie, organisatie en omgeving. Het document schrijft zeven analyseonderdelen, een routekeuze en drie concrete knelpunten voor.")+
 guide(0)+
 card("1. Kies de juiste onderzoeksroute",'<p>De lichte route is bedoeld voor microbedrijven met een eerste toepassing met laag risico; de volledige route heeft uitgebreidere medewerkers- en wegingstoetsen.</p>'+choices("route",[["light","Licht · microbedrijf"],["full","Volledig · groter MKB"]])+
 fields([["company.size","Bedrijfsgrootte","Vul de organisatiegrootte in.","select",[["micro","Microbedrijf"],["small","Klein MKB"],["medium","Middelgroot MKB"]]],["company.employees","Aantal medewerkers","Aantal mensen in loondienst.","number"]]))+
 card("2. Organisatie — TOE & AI-gereedheid",fields([
 ["company.strategy","Strategie en marketingdoelen","Wat wil de organisatie commercieel bereiken?","textarea"],
 ["company.marketingGoal","Commerciële relevantie van AI","Waarom zou procesverbetering helpen?","textarea"],
 ["company.knowledge","Kennis en ervaring medewerkers","Wie kent de mogelijkheden én beperkingen van AI?","textarea"],
 ["company.capacity","Tijd en budget","Beschikbare uren, testbudget en middelen.","textarea"],
 ["company.culture","Cultuur en veranderbereidheid","Willen medewerkers deelnemen en mogen fouten worden besproken?","textarea"],
 ["company.currentAI","Huidig AI-gebruik","Ook informeel gebruik door medewerkers.","textarea"],
 ["company.systems","Software, CRM en datakwaliteit","Welke systemen en data zijn al beschikbaar?","textarea"],
 ["company.environment","Klanten en omgeving","Verwachtingen, kanalen, branchecontext.","textarea"]]))+
 card("3. Marketingprobleem en verbeterdoel",fields([
 ["company.problem","Wat gaat er momenteel mis?","Omschrijf een concreet marketingproces en de kosten, fouten of tijdsbesteding.","textarea"],
 ["company.goal","Wat moet concreet beter?","Meetbare gewenste situatie.","textarea"],
 ["company.indicator","Indicator en nulmeting","Welke meeteenheid ga je volgen?","text"],
 ["company.commercialUse","Commerciële bestemming van de capaciteit","Waar gaan vrijgekomen uren werkelijk naartoe?","textarea"],
 ["company.evidence","Onderbouwing huidige situatie","Tijdregistratie, observatie of interview; noteer waar het bewijs staat.","textarea"]])+
 '<h3>Minstens drie marketingknelpunten</h3>'+fields([0,1,2].map(i=>["company.issues."+i,"Knelpunt "+(i+1),"Vermeld tijd, geld of fouten.","textarea"])))+
 card("4. Instapeisen & mensen",fields([
 ["company.owner","Eigenaar met beslisbevoegdheid","Wie neemt het go/no-go-besluit?"],
 ["company.reviewer","Onafhankelijke outputbeoordelaar","Wie heeft de inhoudelijke vakkennis?"],
 ["company.recurrence","Herhaling van de taak","Hoe vaak kan dit proces tijdens een proef worden uitgevoerd?"],
 ["company.measurementCapacity","Ruimte voor nulmeting en pilot","Welke tijd is beschikbaar voor vijf nulmetingen en meerdere cycli?"]])+
 (active.route==="full"?fold("Aanvullend: medewerkersvragenlijst bij volledige route",fields([
 ["company.surveyInvited","Aantal betrokken medewerkers","Uitgenodigd voor kennis/houdingvragenlijst.","number"],
 ["company.surveyCovered","Aantal respondenten","Document streeft naar ≥70% dekking.","number"]])):""))+
 note("Fase 1 is inhoudelijk gereed wanneer het bedrijfsprofiel, drie knelpunten, eigenaar, indicator en commerciële bestemming van vrijgekomen tijd zijn uitgewerkt. Richttermijn in het document: twee weken.")+kpiPanel(0)+next(0);
}
function guessedTask(){const c=active.company.problem.toLowerCase();return /rapport|dashboard|cijfer/.test(c)?"Campagnerapportages maken":/lead|crm|sales/.test(c)?"Leads opvolgen":/content|social|blog|tekst/.test(c)?"Marketingcontent voorbereiden":/klantvragen|service/.test(c)?"Klantvragen beantwoorden":"Een concrete, herhaalbare marketingtaak"}
function taskCard(t,i,p){const fit=p.fitCheck(t),pr=p.priorityCheck(t,active.route,active.process.pairs),first=p.firstCheck(t),chosen=t.id===active.process.selectedTaskId;
 const ready=fit.pass&&pr.pass&&first.pass&&t.riskLevel!=="unknown"&&t.riskLevel!=="high"&&t.aiNeeded!=="no";
 return '<div class="taskcard '+(chosen?"active":"")+'"><div class="taskhead"><b>'+E(t.name||"Naamloze taak")+'</b><span class="pill '+(ready?"good":fit.fails.length?"bad":"")+'">'+(ready?"Kansrijke eerste taak":fit.fails.length?"Knelpunten eerst oplossen":"Nog te onderzoeken")+'</span>'+button(chosen?"Gekozen":"Selecteer","select-task","xs",t.id)+button("Verwijder","delete-task","danger xs",t.id)+'</div>'+
 '<div class="metricbar"><div class="metric"><strong>'+(fit.average??"—")+'</strong><small>Geschiktheid /5</small></div><div class="metric"><strong>'+(pr.total??"—")+'</strong><small>Prioriteit /100</small></div><div class="metric"><strong>'+first.rows.filter(x=>x.answer==="yes").length+'/5</strong><small>Starttoets</small></div><div class="metric"><strong>'+E(t.riskLevel)+'</strong><small>Risico</small></div></div>'+
 (chosen?taskEditor(t,i,p):'<p>'+E(t.notes||"Selecteer deze taak om de onderbouwing te openen.")+'</p>')+'</div>';
}
function scoreGrid(prefix,defs,obj,subtitle){return '<p class="muted">'+E(subtitle)+'</p>'+defs.map(x=>{
 const path=prefix+"."+x[0],value=obj?.[x[0]];
 return '<div class="criterion"><div><b>'+E(x[1])+'</b>'+(x[2]?'<small>'+E(x[2])+'</small>':"")+'</div><div class="scale">'+[1,2,3,4,5].map(v=>'<button type="button" class="'+(Number(value)===v?"active":"")+'" data-choice="'+E(path)+'" data-value="'+v+'">'+v+'</button>').join("")+'</div><small>1 = ongunstig, 5 = gunstig · ontbrekend = nog niet beoordeeld</small></div>';
 }).join("")}
function taskEditor(t,i,p){const path="process.tasks."+i;
 const riskOpts=[["unknown","Nog onbekend"],["low","Laag"],["medium","Middel"],["high","Hoog"]];
 return '<div class="form-grid">'+input(path+".name","Naam concrete taak","Beschrijf één handeling, geen hele afdeling.")+
 input(path+".kind","Groeitype","Eerst uitvoerend, dan analytisch en relationeel.","select",[["unknown","Nog bepalen"],["executive","Uitvoerend"],["analytical","Analytisch"],["relational","Relationeel"]])+
 input(path+".contentType","Contenttype","Feitelijke content is een gunstiger start dan emotionele.","select",[["unknown","Niet relevant"],["factual","Feitelijk"],["emotional","Emotioneel"]])+
 input(path+".riskLevel","Risico voor deze taak","Tussentijdse inschatting; fase 3 stelt het risico definitief vast.","select",riskOpts)+
 input(path+".nonAI","Oplossing zonder AI","Kan een procesafspraak of bestaande automatisering volstaan?","textarea")+
 input(path+".aiNeeded","Is AI nodig?","Zo niet, ga niet met AI door voor deze taak.","select",[["unknown","Nog onderzoeken"],["yes","AI mogelijk nuttig"],["no","Geen AI nodig"]])+'</div>'+
 fold("Stap 4 · Geschiktheidsscan — zeven criteria",scoreGrid(path+".fit",M.FIT,t.fit,"Geen enkel criterium mag lager dan 3 zijn. Score 1–2 = eerst knelpunt oplossen."))+
 fold("Tweede beoordelaar · interbeoordelaarsbetrouwbaarheid (optioneel)",scoreGrid(path+".fitReviewer2",M.FIT,t.fitReviewer2||{},"Het document streeft naar minstens 80% overeenstemming: de twee scores verschillen maximaal 1 punt.")+(p.fitCheck(t).agreement===null?"<p class=\"muted\">Nog geen volledige vergelijking tussen twee beoordelaars.</p>":note("Overeenstemming: "+p.fitCheck(t).agreement+"% · "+(p.fitCheck(t).agreementOK?"streefwaarde gehaald":"streefwaarde nog niet gehaald"),p.fitCheck(t).agreementOK?"blue":"warn")))+
 fold("Stap 6 · Prioriteitsscore — zes gewogen criteria",scoreGrid(path+".priority",M.PRIORITY,t.priority,"Formule: som ((score − 1) / 4 × gewicht). Minimum voor eerste toepassing is 60/100."))+
 fold("Stap 7 · Eerste-toepassingstoets — vijf ja-vragen",M.FIRST.map(x=>'<div class="criterion"><b>'+E(x[1])+'</b>'+choices(path+".startTests."+x[0],yesno)+'</div>').join(""))+
 input(path+".notes","Onderbouwing van de keuze","Noteer bewijs, onzekerheid en wie heeft beoordeeld.","textarea");
}
function phase2(){title("Fase 2 · Procesprioritering","SIPOC, taakgeschiktheid, risicodrempel en exacte prioriteit.");
 const p=active.process,st=M.processCheck(active);
 return headingStage(1,"Maak eerst het proces zichtbaar. Splits het op in taken, onderzoek of AI nodig is, toets de geschiktheid en rangschik alleen taken die de harde eisen halen.")+
 guide(1)+card("1. SIPOC-procesanalyse",fields([
 ["process.sipoc.supplier","Suppliers · Leveranciers","Wie levert informatie?","textarea"],
 ["process.sipoc.input","Inputs · Invoer","Welke data of middelen zijn nodig?","textarea"],
 ["process.sipoc.steps","Process · Processtappen","Welke handelingen volgen op elkaar?","textarea"],
 ["process.sipoc.output","Outputs · Uitvoer","Wat wordt opgeleverd?","textarea"],
 ["process.sipoc.customer","Customers · Afnemers","Wie ontvangt of gebruikt de uitkomst?","textarea"]]))+
 card("2. Splits het proces op in marketingtaken",'<p>Het document streeft naar minstens vijf gescoorde taken. Een toegevoegde taak krijgt géén automatische score.</p><div class="itembar"><input id="addTaskName" placeholder="Bijvoorbeeld: campagnerapportage samenvatten">'+button("Taak toevoegen","add-task","")+'</div>'+
 (p.tasks.length?'<div class="tasks">'+p.tasks.map((t,i)=>taskCard(t,i,M)).join("")+'</div>':note("Er zijn nog geen taken. Mogelijke eerste taak bij het opgegeven probleem: <b>"+E(guessedTask())+"</b>. "+'<button class="btn xs" data-action="suggest-task">Gebruik voorstel</button>','blue')))+
 (active.route==="full"?card("3. Volledige route — AHP-weging per bedrijf",'<p>Vergelijk de zes prioriteitscriteria paarsgewijs. De matrix wordt alleen gebruikt wanneer alle 15 paren ingevuld zijn en de consistentieverhouding ≤0,10 is.</p>'+
 fold("15 paarsgewijze vergelijkingen",'<div class="form-grid">'+M.PRIORITY.flatMap((a,i)=>M.PRIORITY.slice(i+1).map((b,j)=>[i,i+j+1,a,b])).map(pair=>input("process.pairs."+pair[0]+"-"+pair[1],pair[2][1]+" versus "+pair[3][1],"9 = eerste criterium veel belangrijker; 1/9 = tweede veel belangrijker.","select",[[ "", "Nog niet ingevuld"],["0.1111111111","1/9"],["0.2","1/5"],["0.3333333333","1/3"],["1","1 (gelijk)"],["3","3"],["5","5"],["9","9"]])).join("")+'</div>')+
 note(st.ahp.complete?"Consistentieverhouding CR = "+st.ahp.cr+". "+(st.ahp.consistent?"Eigen gewichten kunnen worden toegepast.":"Matrix inconsistent: startweging blijft actief."):"De startweging van 25/20/15/15/15/10 blijft actief totdat de AHP-vergelijkingen volledig en consistent zijn.","blue")):"")+
 card("4. Rangorde en selectie",st.ranked.length?'<div class="tablewrap"><table><thead><tr><th>Rang</th><th>Taak</th><th>Prioriteit</th><th>Geschiktheid</th></tr></thead><tbody>'+st.ranked.map((t,i)=>'<tr><td>'+(i+1)+'</td><td>'+E(t.name)+'</td><td>'+t.priority.total+'/100</td><td>'+t.fit.average+'/5</td></tr>').join("")+'</tbody></table></div>':note("Nog geen taken voldoen aantoonbaar aan alle selectievoorwaarden. Dat is een geldige uitkomst; er wordt geen winnaar verzonnen.","warn"))+
 note("De risicoklasse per taak is een voorlopige inschatting. Gebruik fase 3 om het risiconiveau vast te stellen. Een hoogrisicotaak mag niet de eerste toepassing worden.")+kpiPanel(1)+next(1);
}
function phase3(){title("Fase 3 · Randvoorwaarden & risico's","Proportionele eisen, gebruiksafspraak en onderbouwd go/no-go.");
 const r=active.risk,st=M.riskCheck(r,active.route);
 const labels={low:"Laag risico",medium:"Middelrisico",high:"Hoog risico",unknown:"Nog onbekend"};
 return headingStage(2,"Bepaal met drie vragen het risiconiveau. De eerste 'ja' bepaalt de klasse; bij twijfel geldt de hogere klasse. Het risiconiveau bepaalt welke controlemaatregelen nodig zijn.")+
 guide(2)+card("1. Automatische risicoclassificatie",'<div class="criterion"><b>Worden persoonsgegevens gebruikt om mensen te profileren of verschillend te behandelen (bijv. andere prijzen/aanbiedingen)?</b>'+choices("risk.profile",yesno)+'</div>'+
 '<div class="criterion"><b>Komen persoonsgegevens in de tool of werkt AI in systemen met klantgegevens?</b>'+choices("risk.personal",yesno)+'</div>'+
 '<div class="criterion"><b>Gaat output zonder medewerkercontrole direct naar klanten?</b>'+choices("risk.direct",yesno)+'</div>'+
 '<div class="notice '+(st.level==="high"?"danger":st.level==="unknown"?"warn":"")+'"><b>Afgeleid niveau: '+E(labels[st.level])+'</b>. '+(st.routeConflict?"De lichte route is alleen geschikt voor laag risico. Schakel zo nodig over naar de volledige route.":"De vereiste maatregelen worden hieronder automatisch aangepast.")+'</div>')+
 card("2. Data, privacy en menselijke controle",fields([
 ["risk.dataQuality","Datakwaliteit","Juistheid, volledigheid, actualiteit en toegankelijkheid.","textarea"],
 ["risk.brandContext","Merkcontextset","Tone of voice, productinformatie, doelgroepinformatie.","textarea"],
 ["risk.privacy","Privacy en doelbinding","Beoordeel AVG-aspecten proportioneel; geen juridisch certificaat.","textarea"],
 ["risk.aiAct","AI-verordening","AI-geletterdheid, verboden praktijken, transparantie.","textarea"],
 ["risk.channel","Marketingkanaal","Bij elektronische reclame: toestemming/uitzonderingen en afmelden.","textarea"],
 ["risk.humanReview","Menselijke controle","Wie, wanneer, wat en met welke vakkennis?","textarea"],
 ["risk.usageAgreement","Gebruiksafspraak van één pagina","Toegestane tools, verboden gegevens, controle en transparantie.","textarea"],
 ["risk.owner","Eigenaar van de toepassing","Moet verantwoordelijk kunnen handelen.","text"]]))+
 card("3. Checklist voor risiconiveau",st.level==="unknown"?note("Vul alle drie classificatievragen in om de juiste checklist te tonen.","warn"):st.controls.map(x=>'<div class="riskline"><div><strong>'+E(x.label)+'</strong><p>'+E(x.key)+' · '+(x.ok?"Onderbouwd":"Controle en bewijs nodig")+'</p></div><div>'+
 input("risk.controls."+x.key+".status","Beoordeling","","select",[["unknown","Nog onbekend"],["done","Geregeld"],["blocked","Blokkade"]])+
 input("risk.controls."+x.key+".evidence","Bron/bewijs","Vermeld document, verantwoordelijke en controle.","textarea")+'</div></div>').join(""))+
 card("4. Go/no-go vóór de pilot",'<div class="notice '+(st.go?"":"warn")+'">'+(st.go?"Go is geregistreerd en alle digitale minimumcontroles zijn ingevuld.":"Geen onderbouwde go: "+(st.incomplete.length?st.incomplete.length+" verplichte maatregelen ontbreken. ":"")+(!st.ready?"Controleer risico, eigenaar en gebruiksafspraak.":""))+'</div>'+
 fields([["risk.decision","Besluit","Go alleen wanneer alle eisen van het niveau zijn geregeld.","select",[["unknown","Nog geen besluit"],["go","Go — voorbereiden pilot"],["no-go","No-go — eerst maatregelen"]]],["risk.decisionBy","Beslisser","Naam/functie van degene die akkoord geeft."],["risk.startedAt","Start risicobeoordeling","Richttijd: laag binnen 5 werkdagen, middel binnen 15.","date"],["risk.decisionAt","Datum go/no-go","Vastgelegd besluitmoment.","date"],["risk.actions","Acties bij no-go","Wat moet wanneer worden verbeterd?","textarea"]])+
 note("Het dashboard beoordeelt of het formulier compleet is; het beoordeelt niet zelfstandig de juridische juistheid van ingevulde verklaringen.","warn"))+kpiPanel(2)+next(2);
}
function toolEditor(t,i){const path="implementation.tools."+i,chk=M.toolCheck(t,M.riskLevel(active.risk));
 return '<div class="taskcard"><div class="taskhead"><b>'+E(t.name||"Nog geen naam")+'</b><span class="pill '+(chk.pass?"good":"")+'">'+(chk.pass?"Klaar voor selectietest":"Niet gekwalificeerd")+'</span>'+button("Selecteer","select-tool","xs",t.id)+button("Verwijder","delete-tool","danger xs",t.id)+'</div>'+
 '<div class="form-grid">'+input(path+".name","Oplossing","Concrete product- of oplossingsnaam.")+
 input(path+".direction","Type oplossing","","select",M.DIRECTIONS.map(x=>[x[0],x[1]]))+'</div>'+
 fold("Harde leveranciereisen (vóór scorevergelijking)",'<p>Toets bij persoonsgegevens gegevensverwerking, training, verwerkersovereenkomst en gebruikersrechten.</p>'+
 [["data","Dataverwerking en locatie bekend?"],["training","Gebruik input voor modeltraining beoordeeld?"],["agreement","Verwerkersovereenkomst haalbaar waar vereist?"],["access","Toegang per gebruiker mogelijk?"]].map(x=>'<div class="criterion"><b>'+x[1]+'</b>'+choices(path+".hard."+x[0],yesno)+'</div>').join(""))+
 fold("Selectiematrix — acht criteria",scoreGrid(path+".ratings",M.TOOL,t.ratings,"Een optie valt af als één criterium lager dan 3 is. Pas na harde eisen vergelijken."))+
 fold("Blinde selectietest — 3 tot 5 vergelijkbare opdrachten",'<p>Laat 2–3 opties dezelfde 3–5 echte opdrachten uitvoeren. Beoordelaar weet niet welke tool de output maakte.</p>'+
 '<div class="criterion"><b>Was de beoordeling blind?</b>'+choices(path+".blind",yesno)+'</div>'+
 (t.tests||[]).map((run,j)=>runForm(path+".tests."+j,run,"Selectietaak "+(j+1),true)).join("")+
 '<div class="itembar">'+button("Voeg selectietaak toe","add-test","secondary xs",t.id)+'</div>'+
 (chk.trial.complete?note("Gemiddelde kwaliteit: "+chk.trial.mean+"/5 · gemiddelde tijd: "+chk.trial.time+" minuten · "+(chk.trial.pass?"kwaliteitsgrens gehaald":"één of meer criteria onder 3 of beoordeling niet blind"),chk.trial.pass?"":"warn"):""))+
 fields([[path+".monthlyCost","Maandelijkse licentiekosten (€)","Controleer actuele contractkosten.","number"],[path+".setupCost","Eenmalige inrichtkosten (€)","","number"],[path+".notes","Voor- en nadelen","Gebruik bronverwijzingen en testresultaten.","textarea"]])+'</div>';
}
function runForm(path,run,title,quality=true){let result=M.runCheck(run);return fold(E(title)+' · '+(result.minutes===null?"Nog geen volledige tijdmeting":result.minutes+" min"),'<div class="form-grid">'+
 (path.includes(".tests.")?input(path+".taskName","Identieke testopdracht","Gebruik bij iedere tool exact dezelfde naam, bijvoorbeeld Opdracht A."):"")+
 input(path+".date","Datum","Datum van de taakuitvoering.","date")+
 input(path+".usedAI","Oplossing gebruikt?","","select",[["unknown","Onbekend"],["yes","Ja"],["no","Nee"]])+
 input(path+".prepare","Voorbereiding (min)","Gemeten tijd.","number")+
 input(path+".prompt","Prompten/invoer (min)","","number")+
 input(path+".check","Controleren (min)","","number")+
 input(path+".correct","Corrigeren (min)","","number")+'</div>'+
 (quality?fold("Blinde kwaliteitsbeoordeling · vijf criteria",M.QUALITY.map(x=>'<div class="criterion"><b>'+E(x[1])+'</b><p>Score volgens de verankerde kwaliteitsschaal in het document.</p>'+choices(path+".quality."+x[0],[["","Niet beoordeeld"],["1","1"],["2","2"],["3","3"],["4","4"],["5","5"]])+
 '<small>1: '+E(M.ANCHORS[x[0]][0])+' | 5: '+E(M.ANCHORS[x[0]][4])+'</small>'+fold("Alle vijf ankers",'<ol>'+M.ANCHORS[x[0]].map((anchor,index)=>'<li><b>'+(index+1)+'</b> — '+E(anchor)+'</li>').join("")+'</ol>')+'</div>').join("")):"")+
 input(path+".notes","Observaties en afwijkingen","Beschrijf fouten, herstelwerk en bewijs.","textarea"));
}
function phase4(){title("Fase 4 · AI-selectie & implementatie","Task-Technology Fit, blinde selectietest, training en twee PDSA-cycli.");
 const i=active.implementation,p=i.pilot,st=M.implementationCheck(active),pro=M.processCheck(active),risk=M.riskCheck(active.risk,active.route);
 return headingStage(3,"Vertaal eerst de gekozen taak naar een AI-functie. Onderzoek de eenvoudigste optie die werkt, vergelijk tools op dezelfde opdrachten en voer een beperkte pilot met twee verbetercycli uit.")+
 guide(3)+(!risk.go?note("Fase 3 heeft nog geen onderbouwde GO. Gebruik deze fase voor voorbereiding en onderzoek, niet voor inzet van echte gevoelige bedrijfsgegevens.","warn"):"")+
 card("1. Van taak naar oplossingsrichting",'<div class="notice blue"><b>Taak uit fase 2:</b> '+E(pro.chosen?.name||"Nog niet geselecteerd")+'<br><b>Vastgestelde risicoklasse:</b> '+E(risk.level)+'</div>'+
 fields([["implementation.function","Welke AI-functie is nodig?","Bijv. tekst genereren, samenvatten, patronen herkennen of segmenteren.","textarea"],
 ["implementation.direction","Eenvoudigste passende oplossingsrichting","Selecteer pas na taak en risicoanalyse.","select",[["unknown","Nog beoordelen"],...M.DIRECTIONS.map(x=>[x[0],x[1]])]]]))+
 card("2. Toolvergelijking en shortlist",'<p>De harde eisen komen vóór de acht scores. Een enkele score onder 3 sluit de optie uit. Daarna gaan twee of drie alternatieven naar dezelfde blinde test.</p>'+
 '<div class="itembar"><input id="newTool" placeholder="Naam van AI-oplossing">'+button("Tool toevoegen","add-tool","")+'</div>'+
 (i.tools.length?i.tools.map(toolEditor).join(""):note("Nog geen tools toegevoegd. Onderzoek eerst een bestaande AI-functie of gewone automatisering.","blue"))+
 (st.tools.shortlist.length?note("Shortlist na harde eisen en criteria: "+E(st.tools.shortlist.map(x=>x.tool.name).join(", ")),"blue"):"")+
 (st.tools.winner?note("Selectietest wijst voorlopig naar: <b>"+E(st.tools.winner.tool.name)+"</b>. De bedrijfscoach moet de onderliggende metingen controleren.","blue"):note("Nog geen winnaar: minstens twee alternatieven moeten dezelfde 3–5 opdrachten blind hebben uitgevoerd en beoordeeld.","warn")))+
 card("3. Medewerkers en verantwoordelijkheden",fields([
 ["implementation.roles.owner","Eigenaar","Neemt het besluit."],
 ["implementation.roles.executor","Uitvoerder","Voert uit en registreert tijd."],
 ["implementation.roles.reviewer","Beoordelaar","Beoordeelt blind en met vakkennis."],
 ["implementation.roles.coach","Begeleider","Bewaakt meetopzet en PDSA."],
 ["implementation.training.practice","Oefenen met eigen taken","Inclusief laten zien wanneer AI faalt.","textarea"],
 ["implementation.training.literacy","AI-geletterdheid","Hoe leren medewerkers output te beoordelen?","textarea"],
 ["implementation.training.support","Steun van de leiding","Hoe is die zichtbaar?","textarea"],
 ["implementation.training.feedback","Openheid, vragen en fouten","Hoe wordt feedback geregistreerd?","textarea"]])+
 fold("Medewerkeracceptatie · vier stellingen",scoreGrid("implementation.training.acceptance",[["usefulness","Nut"],["quality","Kwaliteit"],["ease","Gebruiksgemak"],["support","Steun van leiding"]],i.training.acceptance,"Gemiddelde acceptatie streefwaarde ≥3,5/5.")))+
 card("4. Nulmeting en pilotplan",fields([
 ["implementation.pilot.task","Afbakening","Eén taak en één team/medewerker."],
 ["implementation.pilot.period","Pilotduur","Genoeg uitvoeringen in beide cycli."],
 ["implementation.pilot.success","Vooraf bepaald succescriterium","Tijd, kwaliteit en andere relevante KPI's.","textarea"],
 ["implementation.pilot.stop","Vooraf bepaald stopcriterium","Wanneer niet doorgaan?","textarea"],
 ["implementation.pilot.decisionDate","Besluitdatum","Wanneer beslist de eigenaar?","date"],
 ["implementation.pilot.usedCount","Aantal uitvoeringen mét AI in laatste ronde","Voor adoptie-indicator.","number"],
 ["implementation.pilot.totalCount","Totaal aantal uitvoeringen in laatste ronde","80%-doel volgens model.","number"]])+
 fold("Nulmeting — minimaal vijf taakuitvoeringen",'<p>Voer dezelfde taak op de oude manier uit. Meet voorbereiding, uitvoeren, controle en correctie. Laat kwaliteit waar mogelijk blind beoordelen.</p>'+
 p.baseline.map((run,j)=>runForm("implementation.pilot.baseline."+j,run,"Nulmeting "+(j+1))).join("")+
 button("Nulmeting toevoegen","add-baseline","secondary xs")+
 (st.baseOK?note("De minimale vijf nulmetingen zijn volledig ingevuld.","blue"):note("Nog geen volledige nulmeting met vijf vergelijkbare uitvoeringen.","warn"))))+
 card("5. Twee PDSA-verbetercycli",p.cycles.map((cy,j)=>fold(E(cy.name),fields([
 ["implementation.pilot.cycles."+j+".plan","Plan","Wat willen we wijzigen?","textarea"],
 ["implementation.pilot.cycles."+j+".do","Do","Wat hebben we daadwerkelijk uitgevoerd?","textarea"],
 ["implementation.pilot.cycles."+j+".study","Study","Wat lieten metingen en feedback zien?","textarea"],
 ["implementation.pilot.cycles."+j+".act","Act","Wat passen we in de volgende ronde aan?","textarea"]])+
 cy.runs.map((run,k)=>runForm("implementation.pilot.cycles."+j+".runs."+k,run,"Uitvoering "+(k+1))).join("")+
 button("Meetuitvoering toevoegen","add-cycle-run","secondary xs",String(j)),j===0)).join("")+
 note("De tweede cyclus mag pas inhoudelijk worden geëvalueerd nadat de eerste is uitgevoerd. Meet ook controle- en correctietijd."))+
 card("6. Overdracht",fields([["implementation.pilot.handover","Borgingsafspraken","Eigenaar, instructie, prompts, controlepunten, monitoring en inwerken nieuwe collega's.","textarea"]]))+kpiPanel(3)+next(3);
}
function phase5(){title("Fase 5 · Meten, evalueren & groeien","Netto-opbrengst, bewijskracht, besluit en volgende taak.");
 const e=active.evaluation,ev=M.evaluate(active),ps=M.processCheck(active);
 return headingStage(4,"Meet de volledige taakduur, de kwaliteit en eventuele klantwaarde. Maak onderscheid tussen gemeten effecten, geschatte baten en extra capaciteit. Na een succesvolle ronde begint de volgende bij fase 2.")+
 guide(4)+card("1. Netto tijdwinst — gemeten in fase 4",'<div class="metricbar"><div class="metric"><strong>'+(ev.before??"—")+'</strong><small>Nulmeting · minuten</small></div><div class="metric"><strong>'+(ev.after??"—")+'</strong><small>Laatste PDSA · minuten</small></div><div class="metric"><strong>'+(ev.net??"—")+'</strong><small>Netto tijdwinst · minuten</small></div><div class="metric"><strong>'+(ev.payback??"—")+'</strong><small>Terugverdienpunt · uitvoeringen</small></div></div>'+
 fields([["evaluation.frequency","Aantal herhalingen in evaluatieperiode","Voor netto tijdwinstberekening.","number"],
 ["evaluation.setupMinutes","Inrichttijd in minuten","Eenmalige inrichting.","number"],
 ["evaluation.trainingMinutes","Leertijd in minuten","Alle training meenemen.","number"],
 ["evaluation.reallocated","Waar wordt de vrijgekomen tijd besteed?","Capaciteit is niet automatisch financiële besparing.","textarea",
 ["evaluation.reallocatedShare","Welk percentage van de vrijgekomen tijd gaat naar de benoemde commerciële activiteit?","Fase 5 noemt circa 50% als voorlopige streefwaarde.","number"]])+
 note("Netto tijdwinst = (gemiddelde nulmeting − gemiddelde laatste ronde) × uitvoeringen − inrichttijd − leertijd. ROI verschijnt alleen wanneer kosten én gerealiseerde financiële baten met bronnen zijn onderbouwd.","blue"))+
 card("2. Kwaliteit, kosten en klantwaarde",'<div class="metricbar"><div class="metric"><strong>'+(ev.qb??"—")+'</strong><small>Blinde kwaliteit vóór</small></div><div class="metric"><strong>'+(ev.qa??"—")+'</strong><small>Blinde kwaliteit ná</small></div><div class="metric"><strong>'+(ev.cost??"—")+'</strong><small>Terugkerende kosten €</small></div><div class="metric"><strong>'+(ev.roi===null?"—":ev.roi+"%")+'</strong><small>Voorwaardelijke ROI</small></div></div>'+
 fields([["evaluation.laborRate","Uurtarief arbeid (€)","Alleen voor onderbouwde scenarioanalyse.","number"],["evaluation.monthlyLicence","Licentiekosten evaluatieperiode (€)","","number"],
 ["evaluation.monthlyMaintenance","Onderhoudskosten (€)","","number"],["evaluation.otherCost","Overige/variabele kosten (€)","","number"],
 ["evaluation.financialBenefit","Aantoonbare financiële baten (€)","Niet invullen als alleen capaciteit is vrijgekomen.","number"],
 ["evaluation.financialBenefitEvidence","Bron van de financiële baten","Bijvoorbeeld factuur, omzetverschil of aangetoonde besparing.","textarea"],
 ["evaluation.costEvidence","Bron van de volledige kosten","Onderbouw licentie, inrichten, leren en onderhoud.","textarea"],
 ["evaluation.customerMetric","Klant-KPI","Bijvoorbeeld conversie, CTR of klantrelevantie."],
 ["evaluation.customerBaseline","Klant-KPI vóór","Bij weinig volume slechts indicatief.","number"],
 ["evaluation.customerAfter","Klant-KPI na","Gebruik zo mogelijk controlegroep.","number"],
 ["evaluation.userFeedback","Medewerkers- en klantfeedback","Leg kwalitatieve observaties vast.","textarea"]]))+
 card("3. Bewijskracht en incidenten",fields([["evaluation.evidenceLevel","Bewijsniveau","1 ervaring; 2 voor/na; 3 controleperiode; 4 experiment.","select",[["unknown","Nog niet vastgelegd"],["1","1 — Gebruikservaring"],["2","2 — Voor- en nameting"],["3","3 — Controlegroep of controleperiode"],["4","4 — Gecontroleerd experiment"]]],["evaluation.incidents","Incidenten en opvolging","Beschrijf fouten en hoe ze zijn opgelost.","textarea"]])+
 '<h3>Incidentenlog</h3>'+(active.risk.incidentLog.length?active.risk.incidentLog.map((it,j)=>'<div class="taskcard">'+fields([["risk.incidentLog."+j+".issue","Incident/afwijking","Beschrijving","textarea"],["risk.incidentLog."+j+".status","Status","","select",[["open","Open"],["closed","Opgelost"]]]])+'</div>').join(""):"<p>Geen incidenten geregistreerd.</p>")+
 button("Incident toevoegen","add-incident","secondary xs"))+
 card("4. Besluit en nieuwe groeironde",ev.conflict?note("Waarschuwing: doorgaan is strijdig met de gemeten tijdwinst, kwaliteitsontwikkeling of open incidenten.","danger"):""+
 fields([["evaluation.decision","Vervolgkeuze","Op basis van vooraf bepaalde succes- en stopcriteria.","select",[["unknown","Nog niet besloten"],["continue","Doorgaan en borgen"],["adjust","Bijsturen en opnieuw testen"],["stop","Stoppen en leren"]]],
 ["evaluation.decisionReason","Onderbouwing van het besluit","Gebruik data en beperkingen, geen gevoel alleen.","textarea"],
 ["evaluation.limitations","Beperkingen van de meting","Bijv. klein aantal uitvoeringen of leercurve.","textarea"],
 ["evaluation.nextTaskId","Volgende taak in de groeiroute","Na doorgaan opnieuw beginnen in fase 2.","select",[["","Nog niet gekozen"],...ps.tasks.filter(t=>t.id!==ps.chosen?.id).map(t=>[t.id,t.name])]]])+
 (ev.canContinue&&ev.next?note("Groeipad: ga voor de volgende toepassing terug naar fase 2 en onderzoek <b>"+E(ev.next.name)+"</b>.","blue"):"")+
 note("Een besluit om door te gaan vraagt minimaal bewijsniveau 2 (voor-/nameting), positieve netto tijdwinst, minstens gelijke kwaliteit en geen open incidenten. Het blijft geen bewijs voor causaliteit. Bij weinig volume is klantimpact vaak indicatief.","warn"))+kpiPanel(4)+next(4);
}
function compare(){title("Vergelijk de bedrijven","Een kwalitatieve vergelijking van onafhankelijke casussen.");
 return '<header class="stagehero"><span class="stagecount">G-CLUSTER · WERKVELDTOETSING</span><h2>Welke patronen zien we in het MKB?</h2><p>Vergelijk de bedrijfsdossiers, zonder te doen alsof vijf bedrijven statistisch representatief zijn.</p></header>'+
 card("Vergelijking",'<div class="tablewrap"><table><thead><tr><th>Bedrijf</th><th>Route</th><th>Fasen</th><th>Geselecteerde taak</th><th>Go/no-go</th><th>Besluit</th></tr></thead><tbody>'+
 vault.cases.map(c=>{const st=M.status(c);return '<tr><td>'+E(c.name)+'</td><td>'+E(c.route)+'</td><td>'+st.phase.filter(Boolean).length+'/5</td><td>'+E(st.process.chosen?.name||"—")+'</td><td>'+E(c.risk.decision)+'</td><td>'+E(c.evaluation.decision)+'</td></tr>'}).join("")+'</tbody></table></div>')+
 note("Voor een hbo-analyse: koppel deze gegevens aan interviewtranscripten en beschrijf patronen, uitzonderingen en de mate van zelfstandig gebruik. Vergelijk ook de lichte en volledige route.","blue");
}
function report(){title("AI-adviesrapport","Bedrijfsspecifieke uitkomsten, berekeningen en ontbrekend bewijs.");
 const r=window.GK3Report.build(active);
 return '<header class="stagehero"><span class="stagecount">DIGITAAL ONDERZOEKSRAPPORT</span><h2>Wat kunnen we op basis van het onderzoek adviseren?</h2><p>Een controleerbare samenvatting van de vijf fasen, niet een willekeurige tekstgenerator. Ontbrekende bewijzen blijven zichtbaar.</p></header>'+
 '<div class="itembar report-actions">'+button("Afdrukken / PDF","print","")+button("Download HTML","download-report","secondary")+button("Terug naar overzicht","nav","secondary","overview")+'</div>'+
 '<article class="report" id="reportPaper">'+r.html+'</article>';
}
function about(){title("Methodiek & bronnen","Digitale implementatie van het officiële AI-Groeikompas.");
 return '<header class="stagehero"><span class="stagecount">METHODISCHE VERANTWOORDING</span><h2>Vijf fasen uit het brondocument</h2><p>Geen extra fasen: dit dashboard maakt de instrumenten uit het schriftelijke model uitvoerbaar en meetbaar.</p></header>'+
 card("Welke onderdelen zijn overgenomen?",'<div class="tasks">'+[
 ["1. Bedrijfsanalyse","TOE, AI-gereedheid, lichte/volledige route, drie knelpunten, verbeterdoel en commerciële tijdsbesteding."],
 ["2. Procesprioritering","SIPOC, zeven geschiktheidscriteria, harde grens ≥3, AHP-weging, formule (s−1)/4, minimum 60, vijf eerste-toepassingstoetsen."],
 ["3. Randvoorwaarden","Drie vragen voor risico laag/middel/hoog; proportionele checklist, AI-geletterdheid, gebruiksafspraak en go/no-go."],
 ["4. Implementatie","Task-Technology Fit, vier AI-richtingen, acht selectieregels, blinde selectietest, vijf nulmetingen, training, twee PDSA-cycli."],
 ["5. Evaluatie","Vijf kwaliteitsankers, totale uitvoertijd, netto tijdwinst, conditionele ROI, bewijsniveau 1–4 en vervolgcyclus."]
 ].map(x=>'<div class="taskcard"><b>'+x[0]+'</b><p>'+x[1]+'</p></div>').join("")+'</div>')+
 card("Onderzoeksintegriteit",'<p>De startgewichten, fit-grenzen, KPI-streefwaarden en andere drempels zijn keuzes uit de conceptversie van de projectgroep. Ze zijn niet extern gevalideerd. Een juridische checklist is geen juridisch oordeel. Eén voor-/nameting toont verandering, geen bewezen causaliteit.</p><p><b>Bron:</b> AI - Groeikompas-2, GHUB-M7, conceptversie 30 november 2026, hoofdstukken 1.4–1.10.</p>')+
 card("Dataveiligheid en samenwerking",'<p>Bedrijfsdossiers staan alleen in deze browser. Gebruik voor de werkveldtoets bij voorkeur fictieve of geanonimiseerde gegevens. Exporteer en beveilig back-ups; er is geen gedeelde cloud-database of ingeschakelde AI-API.</p>');
}
function render(keepScroll=false){const prevY=keepScroll?window.scrollY:0;const detailsOpen=keepScroll?[...document.querySelectorAll("#view details")].map((x,i)=>x.open?i:-1).filter(x=>x>=0):[];
 nav();$("caseList").innerHTML=vault.cases.map(x=>'<option value="'+E(x.id)+'" '+(x.id===active.id?"selected":"")+'>'+E(x.name)+'</option>').join("");
 const pages={overview:summary,p0:phase1,p1:phase2,p2:phase3,p3:phase4,p4:phase5,compare,report,about};
 $("view").innerHTML=(pages[current]||summary)();
 if(keepScroll)detailsOpen.forEach(i=>{const x=document.querySelectorAll("#view details")[i];if(x)x.open=true});
 window.scrollTo(0,keepScroll?prevY:0);
 $("screenMenu").setAttribute("aria-expanded",openMenu?"true":"false")}
function chooseCompany(id){active=vault.cases.find(x=>x.id===id)||active;vault.selected=active.id;current="overview";taskIndex=0;toolIndex=0;persist();render()}
function move(page){current=page;if(page.startsWith("p"))active.phase=Number(page.slice(1));persist();openMenu=false;$("sidebar").classList.remove("open");$("scrim").classList.remove("open");render()}
function command(action,value){
 switch(action){
 case "nav":move(value);break;
 case "go-current":move("p"+(active.phase||0));break;
 case "add-task":{const name=$("addTaskName")?.value.trim();if(!name)return;active.process.tasks.push(M.newTask(name));taskIndex=active.process.tasks.length-1;persist();render(true);break}
 case "suggest-task":active.process.tasks.push(M.newTask(window.GK3Advisor?.classify(active).task||guessedTask()));taskIndex=active.process.tasks.length-1;persist();render(true);break;
 case "advisor-suggest-task":{if(!active.process.tasks.some(t=>t.name===value))active.process.tasks.push(M.newTask(value));taskIndex=active.process.tasks.findIndex(t=>t.name===value);persist();render(true);break}
 case "advisor-suggest-function":{if(active.implementation.function&&active.implementation.function!==value&&!confirm("Bestaande AI-functie vervangen door dit voorstel?"))return;active.implementation.function=value;persist();render(true);break}
 case "select-task":active.process.selectedTaskId=value;taskIndex=active.process.tasks.findIndex(x=>x.id===value);persist();render(true);break;
 case "delete-task":if(confirm("Taak verwijderen? De beoordelingen gaan verloren.")){active.process.tasks=active.process.tasks.filter(x=>x.id!==value);if(active.process.selectedTaskId===value)active.process.selectedTaskId="";persist();render(true)}break;
 case "add-tool":{const name=$("newTool")?.value.trim();if(!name)return;active.implementation.tools.push(M.newTool(name));persist();render(true);break}
 case "select-tool":active.implementation.selectedToolId=value;persist();render(true);break;
 case "delete-tool":if(confirm("Tool en onderzoeksresultaten verwijderen?")){active.implementation.tools=active.implementation.tools.filter(x=>x.id!==value);persist();render(true)}break;
 case "add-test":{const t=active.implementation.tools.find(x=>x.id===value);if(t){if(t.tests.length>=5)return alert("Het model gebruikt maximaal vijf selectietaken.");t.tests.push({taskName:"",date:"",usedAI:"yes",prepare:"",prompt:"",check:"",correct:"",quality:{},notes:""});persist();render(true)}break}
 case "add-baseline":active.implementation.pilot.baseline.push({date:"",usedAI:"no",prepare:"",prompt:"",check:"",correct:"",quality:{}});persist();render(true);break;
 case "add-cycle-run":{const x=active.implementation.pilot.cycles[Number(value)];if(x){x.runs.push({date:"",usedAI:"yes",prepare:"",prompt:"",check:"",correct:"",quality:{}});persist();render(true)}break}
 case "add-incident":active.risk.incidentLog.push({issue:"",status:"open"});persist();render(true);break;
 case "print":window.print();break;
 case "download-report":{const html=window.GK3Report.standalone(active);download(html,"AI-Groeikompas-advies-"+active.id+".html","text/html");break}
 case "export":download(JSON.stringify({format:"GROEIKOMPAS-V3",version:3,cases:vault.cases,selected:vault.selected},null,2),"AI-Groeikompas-bedrijfsdossiers.json","application/json");break;
 case "import":$("fileImport").click();break;
 case "new-company":{const name=prompt("Naam van het nieuwe bedrijf:","Bedrijf "+(vault.cases.length+1));if(!s(name))return;const x=M.newCase(name.trim());vault.cases.push(x);chooseCompany(x.id);move("p0");break}
 case "rename-company":{const name=prompt("Nieuwe bedrijfsnaam:",active.name);if(!s(name))return;active.name=name.trim().slice(0,100);persist();render(true);break}
 case "delete-company":if(vault.cases.length<=1)return alert("Er moet ten minste één bedrijfsdossier blijven.");if(confirm("Verwijder dit dossier definitief? Maak eerst een export.")){vault.cases=vault.cases.filter(x=>x.id!==active.id);chooseCompany(vault.cases[0].id)}break;
 }
}
function download(content,name,mime){const blob=new Blob([content],{type:mime+";charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200)}
function onInput(el){if(!el.dataset.field)return;const path=el.dataset.field;set(path,el.value);if(path==="company.problem"||path==="company.goal"){} }
function refreshAfterChange(el){if(el.dataset.field){onInput(el);if(el.tagName==="SELECT"||el.type==="date")render(true)}}
function initEvents(){
 document.addEventListener("input",e=>{if(e.target.dataset?.field)onInput(e.target)});
 document.addEventListener("change",e=>{if(e.target.dataset?.field)refreshAfterChange(e.target)});
 document.addEventListener("click",e=>{
  const route=e.target.closest("[data-nav]");if(route){move(route.dataset.nav);return}
  const choice=e.target.closest("[data-choice]");if(choice){set(choice.dataset.choice,choice.dataset.value);render(true);return}
  const act=e.target.closest("[data-action]");if(act){command(act.dataset.action,act.dataset.value);return}
 });
 $("caseList").addEventListener("change",e=>chooseCompany(e.target.value));
 $("fileImport").addEventListener("change",e=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);if(parsed.format!=="GROEIKOMPAS-V3"||!Array.isArray(parsed.cases)||!parsed.cases.length)throw Error("Geen geschikt V3-back-upbestand");if(!confirm("Dit vervangt alle dossiers in de browser. Eerst een back-up exporteren? Annuleren om af te breken."))return;vault={version:3,cases:parsed.cases,selected:parsed.selected};active=vault.cases.find(x=>x.id===vault.selected)||vault.cases[0];persist();move("overview")}catch(err){alert("Import mislukt: "+err.message)}};reader.readAsText(file)});
 $("screenMenu").addEventListener("click",()=>{openMenu=!openMenu;$("sidebar").classList.toggle("open",openMenu);$("scrim").classList.toggle("open",openMenu);$("screenMenu").setAttribute("aria-expanded",String(openMenu))});
 $("scrim").addEventListener("click",()=>{openMenu=false;$("sidebar").classList.remove("open");$("scrim").classList.remove("open")});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){$("sidebar").classList.remove("open");$("scrim").classList.remove("open");openMenu=false}});
}
function s(v){return typeof v==="string"?v.trim():""}
initEvents();init();
})();