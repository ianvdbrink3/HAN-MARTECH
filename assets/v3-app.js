/* AI-GROEIKOMPAS — onderzoeksstudio v3, vijf fasen, brongetrouwe uitvoering. */
(function(){
"use strict";
const M=window.GroeikompasV3, STORE="ai-groeikompas-v3-dossiers";
const PHASES=["Bedrijfsanalyse en marketingvraagstuk","Procesanalyse en prioritering","Randvoorwaarden en risicobeoordeling","AI-selectie en implementatie","Meten, evalueren en groeien"];
const esc=M.esc, txt=x=>String(x==null?"":x), n=v=>v===null||v===""?null:Number(v);
const uid=()=>Math.random().toString(36).slice(2,10);
const clone=x=>JSON.parse(JSON.stringify(x));
function blank(title){
 return {id:uid(),title:title||"Nieuw bedrijf",profile:{name:title||"",size:"",route:"",strategy:"",skills:"",budget:"",culture:"",existingAI:"",systems:"",environment:"",owner:"",goal:"",indicator:"",commercialUse:"",problems:[]},
 tasks:[],risk:{personalize:"onbekend",personalData:"onbekend",unreviewedCustomer:"onbekend",measures:{},owner:"",decision:"",decisionEvidence:"",agreement:"",dataQuality:"",brandContext:"",incidentLog:""},
 selection:{selectedTask:"",pairwise:{},aiFunction:"",direction:"",options:[],selectedTool:"",baseline:[],cycles:[],roles:{},training:"",acceptance:{}},
 evaluation:{executions:"",setupHours:"",learningHours:"",subscriptionMonthly:"",maintenanceMonthly:"",oneOffCosts:"",horizonMonths:"",verifiedFinancialBenefit:"",benefitEvidence:"",financialEvidence:"",freedTimeUse:"",incidentsOpen:"",customerValue:"",evidenceLevel:"2",decision:"",decisionReason:"",nextNotes:""}};
}
function convertOld(){
 let older;try{older=JSON.parse(localStorage.getItem("han-ai-groeikompas-dossiers-v1")||"null")}catch{}
 if(!older?.cases?.length)return [];
 return older.cases.map(old=>{
  const d=old.data||{},c=blank(old.name||d.business||"Oud dossier");
  c.profile.name=d.business||old.name||"";c.profile.goal=d.goal||"";c.profile.existingAI=d.experience||"";c.profile.systems=d.resources||"";
  if(d.problem)c.profile.problems=[{id:uid(),description:d.problem,impact:"",source:"Overgenomen uit vorige dashboardversie — controleer opnieuw"}];
  c.tasks=(d.tasks||[]).map(name=>({id:uid(),name,category:"",contentKind:"",aiNeeded:"onbekend",sipoc:{},fit:{},priority:{},firstCheck:[],fitNotes:{},priorityNotes:{}}));
  c.selection.aiFunction=d.pilotTask||"";c.selection.training="";
  c.evaluation.decision=(d.decision||"").toLowerCase();c.evaluation.decisionReason=d.notes||"";
  return c;
 });
}
let vault;
try{vault=JSON.parse(localStorage.getItem(STORE)||"null")}catch{}
if(!vault||!Array.isArray(vault.cases)||!vault.cases.length){
 const earlier=convertOld();
 vault={cases:earlier.length?earlier:[blank("Bedrijf 1")],active:earlier[0]?.id||"",version:3,migrated:earlier.length>0};
 vault.active||=vault.cases[0].id;
}
if(!vault.cases.find(c=>c.id===vault.active))vault.active=vault.cases[0].id;
let page="home",taskId="",optionId="",mobile=false,toastTimer;
const active=()=>vault.cases.find(c=>c.id===vault.active)||vault.cases[0];
const evaluate=()=>M.evaluate(active());
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(vault))}catch{notify("Opslaan mislukt. Exporteer je gegevens als back-up.","error")}};
const steps=path=>path.split(".");
function get(path){return steps(path).reduce((x,k)=>x==null?undefined:x[k],active())}
function set(path,v){
 const seg=steps(path);let obj=active();
 for(let i=0;i<seg.length-1;i++){if(obj[seg[i]]==null)obj[seg[i]]={};obj=obj[seg[i]]}
 obj[seg[seg.length-1]]=v;
 if(path==="profile.name"&&v?.trim())active().title=v.trim();
 save();
}
const create=(path,val)=>{const arr=get(path)||[];arr.push(val);set(path,arr)};
function del(path,index){const arr=get(path)||[];arr.splice(index,1);set(path,arr)}
function notify(message,kind="ok"){const el=document.getElementById("toast");if(el){el.textContent=message;el.className="toast show "+kind;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.className="toast",3200)}}
function field(path,label,placeholder="",hint="",type="text",opts={}){
 const value=get(path)??"",required=opts.required?" <i class='required'>*</i>":"",id="f-"+path.replace(/\W/g,"_");
 const input=type==="textarea"?'<textarea id="'+id+'" data-bind="'+esc(path)+'" rows="'+(opts.rows||3)+'" placeholder="'+esc(placeholder)+'">'+esc(value)+'</textarea>':
  '<input id="'+id+'" type="'+type+'" data-bind="'+esc(path)+'" value="'+esc(value)+'" placeholder="'+esc(placeholder)+'" '+(type==="number"?'min="0" step="any" inputmode="decimal"':"")+'/>';
 return '<div class="field"><label for="'+id+'">'+esc(label)+required+'</label>'+(hint?'<div class="hint">'+esc(hint)+'</div>':"")+input+'</div>';
}
function pick(path,label,options,hint=""){
 const raw=get(path),v=typeof raw==="boolean"?(raw?"ja":"nee"):(raw??"");
 return '<div class="field pick"><label>'+esc(label)+'</label>'+(hint?'<div class="hint">'+esc(hint)+'</div>':"")+
 '<div class="choices">'+options.map(opt=>'<button type="button" class="choice '+(v===opt[0]?"selected":"")+'" data-set="'+esc(path)+'" data-value="'+esc(opt[0])+'">'+esc(opt[1])+'</button>').join("")+'</div></div>';
}
function select(path,label,options,hint=""){
 const v=get(path)??"";
 return '<div class="field"><label>'+esc(label)+'</label>'+(hint?'<div class="hint">'+esc(hint)+'</div>':"")+
 '<select data-bind="'+esc(path)+'">'+options.map(o=>'<option value="'+esc(o[0])+'" '+(o[0]===v?"selected":"")+'>'+esc(o[1])+'</option>').join("")+'</select></div>';
}
function score(path){const v=M.taskScore?get(path):null;return '<div class="score">'+[1,2,3,4,5].map(j=>'<button type="button" data-set="'+esc(path)+'" data-value="'+j+'" class="'+(Number(v)===j?"active":"")+'" aria-pressed="'+(Number(v)===j)+'">'+j+'</button>').join("")+'<button type="button" class="score-clear" data-set="'+esc(path)+'" data-value="" title="Nog niet beoordeeld">?</button></div>'}
function checkbox(path,label){return '<label class="check"><input type="checkbox" data-check="'+esc(path)+'" '+(get(path)===true?"checked":"")+'><span>'+esc(label)+'</span></label>'}
function section(title,desc,content,open=true,id=""){
 return '<section class="panel" '+(id?'id="'+esc(id)+'"':"")+'><div class="panel-heading"><div><h2>'+esc(title)+'</h2>'+(desc?'<p>'+esc(desc)+'</p>':"")+'</div></div>'+content+'</section>';
}
function disclose(title,sub,content,open=false){
 return '<details class="disclose" '+(open?"open":"")+'><summary><span>'+esc(title)+'<small>'+esc(sub)+'</small></span><span class="chevron">⌄</span></summary><div class="disclose-body">'+content+'</div></details>';
}
function progress(i,result){
 const val=result.gates[i];return '<div class="phase-progress '+(val?"completed":"")+'"><span class="pulse"></span><b>'+(val?"Eindvoorwaarden geregistreerd":"Nog niet volledig")+'</b><p>'+(val?"Controleer de onderbouwing: een registratiestatus is geen wetenschappelijke validatie.":"Je kunt verder naar de volgende fase; onvolledige onderdelen blijven zichtbaar in het adviesrapport.")+'</p></div>';
}
function stepHead(i,kicker,title,lead,result){
 return '<div class="step-hero"><div class="step-hero-top"><span>FASE '+(i+1)+' VAN 5</span><span class="step-hero-status">'+(result.gates[i]?"✓ Basis afgerond":"● In onderzoek")+'</span></div><h1>'+esc(title)+'</h1><p>'+esc(lead)+'</p><div class="step-hero-bottom"><span class="dot"></span>'+esc(kicker)+'</div></div>';
}
function endStep(i,result){
 return progress(i,result)+'<div class="step-actions">'+(i>0?'<button class="button ghost" data-nav="p'+(i-1)+'">← Vorige fase</button>':'')+
 '<button class="button primary" data-nav="'+(i<4?"p"+(i+1):"report")+'">'+(i<4?"Naar fase "+(i+2)+" →":"Bekijk mijn adviesrapport →")+'</button></div>';
}
function anchorInfo(title,body,children=""){
 return '<div class="insight"><div class="insight-icon">✦</div><div><span class="insight-label">UITKOMST VAN DE EERDERE STAPPEN</span><h3>'+esc(title)+'</h3><p>'+esc(body)+'</p>'+children+'</div></div>';
}
function choiceCard(title,details,action="",label=""){
 return '<div class="microcard"><h4>'+esc(title)+'</h4><p>'+esc(details)+'</p>'+(action?'<button class="mini-button" data-action="'+esc(action)+'">'+esc(label||"Overnemen")+' →</button>':"")+'</div>';
}
function recommendTask(c){
 const p=(c.profile.problems||[]).map(x=>x.description).join(" ")+" "+c.profile.goal;
 if(/rapport|dashboard|analyse|cijfer|metrics|ga4/i.test(p))return {name:"Campagnerapportage opstellen",type:"uitvoerend",why:"De beschreven werkzaamheden bestaan uit terugkerende verwerking van campagnegegevens.",nonai:"Standaard rapportagekoppeling of dashboard"};
 if(/lead|crm|sales|opvolg/i.test(p))return {name:"Leadopvolging voorbereiden",type:"analytisch",why:"De beschrijving noemt het opvolgen of kwalificeren van potentiële klanten.",nonai:"CRM-workflow met vaste opvolgregels"};
 if(/tekst|content|social|seo|blog/i.test(p))return {name:"Contentconcepten voorbereiden",type:"uitvoerend",why:"De beschrijving gaat over terugkerende marketingcontent.",nonai:"Contenttemplates en vaste redactieplanning"};
 return {name:"Terugkerende marketingtaak achter het knelpunt",type:"uitvoerend",why:"Een voorstel om het probleem uit fase 1 om te zetten naar één toetsbare taak.",nonai:"Procesvereenvoudiging en bestaande automatisering"};
}
function nextInsight(i,result){
 const c=active(),p=c.profile,sel=c.selection,task=c.tasks.find(x=>x.id===sel.selectedTask),risk=result.risk;
 if(i===1){const rec=recommendTask(c);return anchorInfo("Van het bedrijfsprobleem naar een taak","Herkenbaar uit jullie eigen probleembeschrijving. Dit is een voorlopige suggestie, geen gescoorde aanbeveling.",
  '<div class="microgrid">'+choiceCard(rec.name,rec.why,"suggest-task","Taak toevoegen")+choiceCard("Alternatief zonder AI",rec.nonai,"suggest-nonai","Vergelijken")+'</div>');}
 if(i===2){return anchorInfo("De gekozen taak bepaalt de risicobeoordeling",task?("Taak: "+task.name+". Beoordeel persoonsgegevens, klantimpact en het ontbreken van menselijke controle afzonderlijk."):"Kies eerst een taak in fase 2. De risico's worden dan aan die taak gekoppeld.");}
 if(i===3){
  let warning=risk.blocked.length?"Er zijn blokkades. Geen echte pilot totdat deze zijn opgelost.":!risk.go?"Het go/no-go-besluit is nog niet positief en onderbouwd. Je kunt oplossingsrichtingen onderzoeken, maar nog geen echte AI-pilot vrijgeven.":"Go voor pilotvoorbereiding is vastgelegd; controleer nu de specifieke leverancier.";
  return anchorInfo("Van risico naar een passende AI-functie",warning+(task?" Geselecteerde taak: "+task.name+".":""),
   '<div class="microgrid">'+choiceCard("Functie vóór tool","Vertaal de taak eerst naar samenvatten, genereren, patronen herkennen of segmenteren.")+choiceCard("Eenvoudige richting","Onderzoek bestaande software en een oplossing zonder AI voordat je een losse AI-tool aanschaft.")+'</div>');
 }
 if(i===4){return anchorInfo("Van selectietest naar meetbare waarde",sel.aiFunction?"AI-functie: "+sel.aiFunction+". Leg eerst minimaal vijf nulmetingen vast en vergelijk de werkelijke totale tijd inclusief controleren en corrigeren.":"Kies eerst de AI-functie in fase 4 en toets concrete opties op dezelfde taken.");}
 return "";
}
function fmt(v,suffix=""){return v===null||v===undefined?"Niet berekend":String(v)+suffix}
function phase1(result){
 const p=active().profile,fields=[["strategy","Strategie en marketingdoelen","Wat wil de organisatie commercieel bereiken?"],["skills","Kennis","Welke AI-kennis en ervaring heeft het team?"],["budget","Tijd en budget","Hoeveel capaciteit kan het bedrijf beschikbaar stellen?"],["culture","Cultuur en veranderbereidheid","Hoe staan medewerkers tegenover AI?"],["existingAI","Huidig AI-gebruik","Welke toepassingen worden nu al gebruikt?"],["systems","Systemen en data","Welke CRM, CMS en andere software en gegevens zijn aanwezig?"],["environment","Klanten en regels","Welke klantverwachtingen en relevante branche-eisen spelen?"]];
 let problems=(p.problems||[]).map((x,i)=>'<div class="repeat-card"><div class="repeat-head"><b>Knelpunt '+(i+1)+'</b><button class="text-danger" data-action="remove-problem" data-index="'+i+'">Verwijderen</button></div>'+
 field('profile.problems.'+i+'.description',"Wat is het knelpunt?","Bijv. leadopvolging duurt te lang")+
 field('profile.problems.'+i+'.impact',"Wat kost het in tijd, geld of fouten?","Bijv. 6 uur per week")+
 field('profile.problems.'+i+'.source',"Waarop is dit gebaseerd?","Interview, meting of observatie")+'</div>').join("");
 return stepHead(0,"TOE + AI-gereedheid","Begin bij het marketingprobleem.","Het model kiest nog geen AI-tool. Eerst bepalen we wat er zakelijk moet verbeteren en hoeveel ruimte er is om te testen.",result)+
 section("Bedrijfsprofiel","Kies de juiste onderzoeksroute. De lichte route vereenvoudigt de aanpak, niet de vereiste bewijsvoering.",
 field("profile.name","Bedrijfsnaam","Bijv. Noordlicht Bouwgroep","Gebruik voor interviews eventueel een pseudoniem.")+
 select("profile.size","Organisatiegrootte",[["","Maak een keuze"],["micro","Microbedrijf"],["mkb","MKB met marketingteam"]])+
 pick("profile.route","Onderzoeksroute",[["licht","Lichte route · eigenaar/klein team"],["volledig","Volledige route · groter MKB"]],"Volgens het document gebruikt de volledige route een bedrijfsspecifieke paarsgewijze prioriteitsweging.")+
 field("profile.owner","Wie is eigenaar van het besluit?","Naam of functie van de beslisser")+
 (p.route==="volledig"?'<div class="formgrid">'+field("profile.employeeTotal","Aantal betrokken medewerkers","","","number")+field("profile.employeeSurveyed","Aantal ingevulde korte vragenlijsten","","","number")+'</div><div class="calcout">Responsdoel volledige route: minstens 70%.</div>':""))+
 section("Zeven onderdelen van de bedrijfsanalyse","Gebaseerd op het TOE-raamwerk en de vijf factoren voor AI-gereedheid.",
 '<div class="formgrid">'+fields.map(([k,label,hint])=>field('profile.'+k,label,"",hint,"textarea",{rows:2})).join("")+'</div>')+
 section("Drie concrete marketingknelpunten","Het document noemt drie problemen als streefwaarde vóórdat één verbeterdoel wordt gekozen.",
 problems+'<button class="button outline" data-action="add-problem">+ Knelpunt toevoegen</button>')+
 section("Meetbaar verbeterdoel","De commerciële koppeling moet al in fase 1 duidelijk zijn.",
 field("profile.goal","Wat moet meetbaar verbeteren?","Bijv. rapportagetijd van 90 naar 45 minuten")+
 field("profile.indicator","Hoe ga je dat meten?","Bijv. minuten per gecontroleerde rapportage")+
 field("profile.commercialUse","Waar zet je de gewonnen capaciteit voor in?","Bijv. 4 uur extra leadopvolging per maand"))+
 nextInsight(0,result)+endStep(0,result);
}

function createTask(name="Nieuwe marketingtaak"){
 return {id:uid(),name,category:"onbekend",contentKind:"onbekend",aiNeeded:"onbekend",sipoc:{supplier:"",input:"",process:"",output:"",customer:""},fit:{},fitSecond:{},priority:{},fitNotes:{},priorityNotes:{},firstCheck:["","","","",""]};
}
function phase2(result){
 const c=active(),rec=recommendTask(c),s=c.selection,all=result.tasks;
 if(!taskId||!c.tasks.some(t=>t.id===taskId))taskId=c.tasks[0]?.id||"";
 const t=c.tasks.find(t=>t.id===taskId);
 const ti=c.tasks.findIndex(t=>t.id===taskId);
 const flags=t?M.taskScore(t,result.w.weights):null;
 let navigator=c.tasks.map((t,i)=>'<button class="task-tab '+(t.id===taskId?"selected":"")+'" data-action="choose-task" data-id="'+t.id+'"><span>'+(i+1)+'. '+esc(t.name)+'</span><small>'+fmt(all[i]?.priorityScore,"/100")+'</small></button>').join("");
 let editor="";
 if(t){
  const base="tasks."+ti+".";
  const fit=M.FIT.map(([id,name,hint])=>'<div class="criterion"><div class="criterion-text"><b>'+esc(name)+'</b><small>'+esc(hint)+'</small></div>'+score(base+"fit."+id)+
   field(base+"fitNotes."+id,"Onderbouwing (optioneel)","Feit of waarneming")+'</div>').join("");
  const fitSecond=M.FIT.map(([id,name])=>'<div class="criterion"><div class="criterion-text"><b>'+esc(name)+'</b><small>Onafhankelijke score van tweede beoordelaar</small></div>'+score(base+"fitSecond."+id)+'</div>').join("");
  const prior=M.PRIOR.map(([id,name,wt])=>'<div class="criterion"><div class="criterion-text"><b>'+esc(name)+'</b><small>Startgewicht: '+wt+'% · 5 is gunstig</small></div>'+score(base+"priority."+id)+
   field(base+"priorityNotes."+id,"Toelichting (optioneel)","Waarom deze score?")+'</div>').join("");
  let first=["Duidelijk voordeel boven de huidige werkwijze","Past bij de huidige manier van werken","Eenvoudig genoeg voor aanwezige kennis","Op kleine schaal uit te proberen","Resultaten zijn zichtbaar voor team en eigenaar"].map((label,i)=>pick(base+"firstCheck."+i,label,[["","Nog niet onderzocht"],["ja","Ja"],["nee","Nee"]])).join("");
  // store yes/no strings; engine expects all true -> handler maps yes to true
  editor=section("Onderzochte taak · "+t.name,"Splits het marketingproces op in afzonderlijke taken; beoordeel alleen wat je kunt onderbouwen.",
  field(base+"name","Taaknaam","Bijv. wekelijkse e-mailrapportage")+
  select(base+"category","Taaktype",[["onbekend","Nog niet bepaald"],["uitvoerend","Uitvoerend"],["analytisch","Analytisch"],["relationeel","Relationeel"]])+
  select(base+"contentKind","Bij content: welk type boodschap?",[["onbekend","Niet relevant / onbekend"],["feitelijk","Feitelijke content"],["emotioneel","Emotionele merkcommunicatie"]])+
  pick(base+"aiNeeded","Is AI nodig?",[["onbekend","Eerst onderzoeken"],["ja","AI lijkt nodig"],["nee","Zonder AI mogelijk"]],"De nutvraag komt vóór de score: een eenvoudige oplossing verdient de voorkeur als die het probleem ook oplost.")+
  disclose("SIPOC: maak het proces zichtbaar","Leveranciers · input · proces · output · afnemers",
  field(base+"sipoc.supplier","Suppliers / leveranciers","Bijv. advertentieplatformen")+
  field(base+"sipoc.input","Input","Bijv. campagnecijfers")+
  field(base+"sipoc.process","Processtappen","Bijv. exporteren, combineren, controleren")+
  field(base+"sipoc.output","Output","Bijv. directierapport")+
  field(base+"sipoc.customer","Afnemers","Bijv. commercieel directeur"))+
  disclose("Geschiktheidsscan · zeven criteria","Harde grens: geen enkel criterium lager dan 3",'<div class="criterion-list">'+fit+'</div><div class="calcout '+(flags.fitFail.length?"bad":"")+'">'+
  (flags.fitComplete?(flags.fitFail.length?"Niet geschikt zonder verbetering: "+esc(flags.fitFail.join(", ")):"Geen score onder 3; vervolgonderzoek mogelijk."):"Vul zeven scores in om een geschiktheidsuitkomst te krijgen.")+'</div>')+
  disclose("Tweede onafhankelijke beoordelaar","Overeenstemming op minimaal 80% van de zeven scores binnen één punt",'<div class="criterion-list">'+fitSecond+'</div><div class="calcout">Overeenstemming: '+fmt(flags.agreement,"%")+'.</div>')+
  disclose("Prioriteitenmatrix · zes criteria","Correcte formule: Σ[(score−1)/4 × (gewicht/100)] × 100",'<div class="criterion-list">'+prior+'</div><div class="calcout">Voorlopige prioriteitsscore: <strong>'+fmt(flags.priorityScore,"/100")+'</strong></div>')+
  disclose("Eerste-toepassingstoets · vijf vragen","Alle vijf voorwaarden moeten 'ja' zijn.",first)+
  '<div class="note-line"><button class="text-danger" data-action="remove-task" data-id="'+t.id+'">Verwijder deze taak</button></div>');
 }
 const pairwise=result.d.profile.route==="volledig"?disclose("Volledige route: bedrijfsspecifieke AHP-weging","15 paarsgewijze vergelijkingen · consistentie controleren",
 '<p class="helper-text">Geef per criteriapaar aan welk aspect belangrijker is. Gelijke waarde = 1, links belangrijker = 3 of 5, rechts belangrijker = 1/3 of 1/5. De berekende gewichten gelden alleen als alle 15 vergelijkingen zijn ingevuld en de consistentieratio niet hoger is dan 0,10.</p>'+
 M.PRIOR.flatMap((a,i)=>M.PRIOR.slice(i+1).map(b=>{
   const key=a[0]+"|"+b[0],v=s.pairwise?.[key]??"";
   return '<div class="pair"><b>'+esc(a[1])+'</b><select data-bind="selection.pairwise.'+key+'">'+
   [["","Maak keuze"],["0.2","Rechts veel belangrijker"],["0.3333333333","Rechts belangrijker"],["1","Gelijk"],["3","Links belangrijker"],["5","Links veel belangrijker"]].map(o=>'<option value="'+o[0]+'" '+(String(v)===o[0]?"selected":"")+'>'+o[1]+'</option>').join("")+'</select><b>'+esc(b[1])+'</b></div>';
 })).join("")+
 '<div class="calcout '+(result.w.consistent?"":"bad")+'">Consistentieratio: <b>'+fmt(result.w.cr)+'</b> · '+esc(result.w.mode)+'</div>'
 ):section("Lichte route · vaste startweging","Commerciële waarde 25%, efficiëntie 20%, klantwaarde 15%, inspanning 15%, meetbaarheid 15%, afhankelijkheden 10%. Deze startwaarden zijn ontwerpkeuzes van de projectgroep.","");
 const ranked=result.ranked.map((t,i)=>'<div class="ranking"><span class="rank">'+(i+1)+'</span><div><strong>'+esc(t.name)+'</strong><small>'+esc(t.category)+' · geschiktheid minimaal 3</small></div><b>'+t.priorityScore+'/100</b><button class="mini-button" data-action="select-first-task" data-id="'+t.id+'">'+(s.selectedTask===t.id?"Gekozen ✓":"Selecteer")+'</button></div>').join("");
 return stepHead(1,"SIPOC · geschiktheid · AHP","Welke taak verdient de eerste proef?","Het model rangschikt alleen taken die de geschiktheidsdrempel halen. Een risico uit fase 3 kan een hoge score alsnog blokkeren.",result)+
 nextInsight(1,result)+section("Taken inventariseren","De KPI-streefwaarde uit jullie document is vijf gescoorde taken. Eén taak mag per pilot worden geselecteerd.",
 '<div class="task-tabs">'+navigator+'</div><button class="button outline" data-action="add-task">+ Nieuwe taak toevoegen</button>')+
 editor+pairwise+
 section("Voorlopige rangorde","Taken met score 1 of 2 op een geschiktheidscriterium vallen af. Ook de vijf eerste-toepassingsvragen moeten positief zijn.",
 (ranked||'<div class="empty">Er is nog geen taak die aan alle selectieregels voldoet. Vul de scan en de eerste-toepassingstoets in.</div>')+
 (result.chosen?'<div class="calcout">Gekozen eerste taak: <b>'+esc(result.chosen.name)+'</b> · '+fmt(result.chosen.priorityScore,"/100")+'</div>':""))+endStep(1,result);
}
function phase3(result){
 const r=active().risk,level=result.risk.level,required=result.risk.required,depth=["laag","middel","hoog"].indexOf(level);
 const riskChoices=[["onbekend","Nog onbekend"],["geregeld","Geregeld"],["blokkade","Blokkade"]];
 const body=required.map((r,i)=>{
   const m=active().risk.measures?.[r.id]||{};
   return '<div class="risk-measure"><div class="risk-head"><b>'+(i+1)+'. '+esc(r.name)+'</b><span>Risiconiveau '+esc(r.min)+'</span></div>'+
   pick("risk.measures."+r.id+".status","Status",riskChoices)+field("risk.measures."+r.id+".evidence","Bewijs of verantwoordelijke","Document, besluit, datum, controle","Een vinkje alleen is geen bewijs.")+'</div>';
 }).join("");
 return stepHead(2,"NIST · AVG · AI-verordening","Wat moet geregeld zijn vóór de pilot?","Beoordeel eerst het risiconiveau. De verplichte maatregelen volgen automatisch uit de antwoorden en stapelen per risicoklasse.",result)+
 nextInsight(2,result)+section("Risiconiveau bepalen","Drie vragen uit het document. Bij twijfel kies je de hogere risicoklasse.",
 pick("risk.personalize","1. Worden personen beoordeeld, geprofileerd of verschillend behandeld?",[["onbekend","Nog onbekend"],["ja","Ja · hoog"],["nee","Nee"]])+
 pick("risk.personalData","2. Komen persoonsgegevens in de AI-tool of een klantsysteem?",[["onbekend","Nog onbekend"],["ja","Ja · middel"],["nee","Nee"]])+
 pick("risk.unreviewedCustomer","3. Komt AI-output zonder menselijke controle bij de klant?",[["onbekend","Nog onbekend"],["ja","Ja · middel"],["nee","Nee"]])+
 '<div class="risk-result '+(level==="hoog"?"danger":level==="onbekend"?"unknown":"")+'"><span>RISICOKLASSE</span><strong>'+esc(level==="onbekend"?"Onbekend":level.toUpperCase())+'</strong><p>'+(level==="onbekend"?"Beantwoord de risicovragen vóór je een vrijgave kunt overwegen.":"Maatregelen voor dit niveau én alle lagere niveaus zijn verplicht.")+'</p></div>')+
 section("Controlepunten per risiconiveau","Alleen zichtbaar voor de vastgestelde klasse. De onderliggende wettelijke verplichtingen moeten in de praktijk worden geverifieerd.",
 body||'<div class="empty">Bepaal eerst een risiconiveau. Bij onzekerheid geen go-besluit.</div>')+
 section("Datakwaliteit, merkcontext en gebruiksafspraak","Dit zijn de instrumenten uit jullie fase 3, niet alleen algemene vinkjes.",
 field("risk.dataQuality","Hoe is de volledigheid, actualiteit en kwaliteit van de data onderzocht?","","Noem eigenaar, bron en methode.","textarea")+
 field("risk.brandContext","Welke merk- en productinformatie wordt als vaste AI-context gebruikt?","","Huisstijl, tone of voice, productfeiten; geen vertrouwelijke gegevens.","textarea")+
 field("risk.agreement","Gebruiksafspraak van één pagina","Welke tools zijn toegestaan? Welke data niet? Wie controleert? Wanneer transparant zijn?","","textarea")+
 field("risk.incidentLog","Incidentenlog of meldprocedure","Waar komen fouten en incidenten terecht?","","textarea"))+
 section("Go/no-go-besluit","Dit is de expliciete beslissing na fase 3. Bij openstaande maatregelen mag het dashboard geen goedgekeurde pilot suggereren.",
 field("risk.owner","Eigenaar van de pilot","Naam of functie")+
 pick("risk.decision","Besluit van de eigenaar",[["","Nog geen besluit"],["no-go","No-go"],["go","Go · alleen indien onderbouwd"]])+
 field("risk.decisionEvidence","Onderbouwing, datum en eventuele open acties","","Bijvoorbeeld ondertekend formulier, besluitdatum en verantwoordelijkheden","textarea")+
 '<div class="calcout '+(result.risk.go?"":"bad")+'"><b>'+(result.risk.go?"Go voorbereid":"Geen geldige go")+'</b> · '+result.risk.unverified.length+' verplichte controles niet volledig onderbouwd.</div>')+
 endStep(2,result);
}

function newRun(caseId=""){return {caseId,prepare:"",prompt:"",review:"",correct:"",ratings:{}}}
function runForm(base,run,index,label,allowRemove=true){
 const elapsed=M.totalMinutes(run),quality=M.quality(run);
 return disclose(label+' · '+fmt(elapsed," min")+' · '+fmt(quality,"/5"),"Volledige tijd inclusief voorbereiden, prompten, controleren en corrigeren",
 '<div class="formgrid">'+
 field(base+".caseId","Opdracht-ID (voor blinde vergelijking)","Bijv. opdracht-1","Gebruik dezelfde ID bij iedere tool.","text")+
 [["prepare","Voorbereiding (min)"],["prompt","Uitvoering / prompten (min)"],["review","Controleren (min)"],["correct","Corrigeren (min)"]].map(x=>field(base+"."+x[0],x[1],"0","","number")).join("")+'</div>'+
 '<div class="criterion-list">'+M.QUALITY.map(([id,name])=>'<div class="criterion"><div class="criterion-text"><b>'+esc(name)+'</b><small>Beoordelaar scoort 1–5, bij voorkeur blind</small></div>'+score(base+".ratings."+id)+'</div>').join("")+'</div>'+
 (allowRemove?'<button class="text-danger" data-action="remove-run" data-target="'+esc(base.substring(0,base.lastIndexOf(".")))+'" data-index="'+index+'">Verwijder meting</button>':""),false);
}
function describeQualityAnchors(){
 const a=[
 ["Juistheid","1: meerdere fouten · 3: kleine fout · 5: alle claims en feiten correct"],
 ["Merkfit","1: past niet bij toon · 3: enkele aanpassingen · 5: direct bruikbaar in huisstijl"],
 ["Helderheid","1: onduidelijk · 3: begrijpelijk met zwakke zinnen · 5: helder en logisch"],
 ["Relevantie","1: doel/doelgroep gemist · 3: deels passend · 5: volledig passend"],
 ["Authenticiteit","1: generiek · 3: deels eigen · 5: voelt echt en eigen"]
 ];
 return '<div class="anchors">'+a.map(x=>'<div><b>'+x[0]+'</b><small>'+x[1]+'</small></div>').join("")+'</div>';
}
function optionForm(opt,i,result){
 const base="selection.options."+i,score=M.toolScore(opt),tests=opt.tests||[];
 let tc=M.TOOL.map(([k,name])=>'<div class="criterion"><div class="criterion-text"><b>'+esc(name)+'</b><small>Ondergrens: 3/5 per criterium</small></div>'+scoreFn(base+".scores."+k)+
 field(base+".notes."+k,"Onderbouwing (optioneel)","Wat is getest of gecontroleerd?")+'</div>').join("");
 const hard=pick(base+".hard.dataLocation","Waar worden gegevens verwerkt?",[["","Nog niet gecontroleerd"],["ja","Beoordeeld"],["nee","Onvoldoende / afgevallen"]])+
 pick(base+".hard.training","Gebruikt leverancier invoer voor training?",[["","Nog niet gecontroleerd"],["ja","Voorwaarden beoordeeld"],["nee","Onvoldoende / afgevallen"]])+
 pick(base+".hard.dpa","Verwerkersovereenkomst indien nodig?",[["","Nog niet gecontroleerd"],["ja","Beschikbaar / beoordeeld"],["nee","Niet beschikbaar"]])+
 pick(base+".hard.access","Toegang per gebruiker mogelijk?",[["","Nog niet gecontroleerd"],["ja","Ja / gecontroleerd"],["nee","Nee"]])+
 field(base+".hardEvidence","Controleerbaar bewijs voor deze harde eisen","Contract, document of leverancierstoets met datum");
 return section("Geselecteerde oplossing · "+(opt.name||"Naam ontbreekt"),"De acht criteria maken een shortlist; de blinde selectietest bepaalt daarna de winnaar.",
 field(base+".name","Naam van de tool of aanpak","Bijv. AI-functie in bestaande CRM")+
 field(base+".category","Oplossingsrichting","Algemene assistent / bestaande software / specialist / eigen koppeling")+
 field(base+".totalCost","Geschatte kosten over testperiode (€)","Alleen indien onderbouwd","", "number")+
 disclose("Harde leverancierseisen","Bij persoonsdata: verwerking, training, overeenkomst, toegang",hard)+
 disclose("Selectiematrix · acht criteria","Score < 3 op een criterium sluit de tool uit",'<div class="criterion-list">'+tc+'</div><div class="calcout '+(score.below.length?"bad":"")+'">Gemiddelde: '+fmt(score.mean,"/5")+' · '+(score.shortlist?"Voorlopige shortlist mogelijk":"Nog geen geschikte shortlistscore")+'</div>')+
 disclose("Blinde selectietest","Drie tot vijf identieke opdrachten per optie. Meet ook correctietijd.",
 '<p class="helper-text">Laat een collega de vijf kwaliteitspunten beoordelen zonder te weten met welke tool de output is gemaakt. Opdracht-ID’s moeten overeenkomen tussen de tools.</p>'+
 describeQualityAnchors()+
 tests.map((x,j)=>runForm(base+".tests."+j,x,j,"Testopdracht "+(j+1))).join("")+
 '<button class="button outline" data-action="add-test" data-id="'+opt.id+'">+ Testopdracht toevoegen</button>')+
 '<div class="note-line"><button class="text-danger" data-action="remove-tool" data-id="'+opt.id+'">Tool verwijderen</button></div>');
}
function scoreFn(path){return score(path)}
function toolDirections(c){
 const task=c.tasks.find(x=>x.id===c.selection.selectedTask);
 const job=(task?.name||"").toLowerCase(),sys=(c.profile.systems||"").toLowerCase();
 let primary="AI binnen de bestaande marketingsoftware",kind="bestaand",why="Een bestaande toepassing sluit doorgaans eenvoudiger aan op huidige data en werkwijze.";
 if(sys.includes("hubspot")){primary="AI-functionaliteit in HubSpot onderzoeken";why="HubSpot wordt genoemd als bestaand systeem. Controleer functies, licentie en dataverwerking."}
 else if(/power bi|microsoft|excel/.test(sys)){primary="Bestaande Microsoft-rapportage- en AI-functies onderzoeken";why="Microsoft-software is opgegeven. Controleer beschikbare licenties en toegang."}
 else if(sys.includes("salesforce")){primary="AI- en workflowfuncties binnen Salesforce onderzoeken";why="Salesforce is een bestaand systeem volgens de bedrijfsanalyse."}
 else if(/content|social|tekst|blog/.test(job)){primary="Zakelijke AI-schrijfassistent met menselijke eindredactie";kind="algemeen";why="De taak betreft het ontwikkelen van content; kwaliteit en merkaansluiting blijven doorslaggevend."}
 const alternative=/rapport|analyse|dashboard/.test(job)?"Standaard dashboardkoppeling zonder AI":/lead|sales/.test(job)?"CRM-workflow zonder generatieve AI":/tekst|social|content/.test(job)?"Herbruikbare templates en redactieplanning":"Procesvereenvoudiging en bestaande automatisering";
 return [
  {name:alternative,kind:"zonder-ai",why:"Controleer eerst of dezelfde gewenste verbetering eenvoudiger bereikt wordt."},
  {name:primary,kind,why},
  {name:"Gespecialiseerde AI-tool voor deze taak",kind:"specialist",why:"Alleen onderzoeken als eenvoudige oplossingen tekortschieten en de taak voldoende terugkomt."}
 ];
}
function phase4(result){
 const c=active(),s=c.selection,risk=result.risk,opts=s.options||[];
 if(!optionId||!opts.some(x=>x.id===optionId))optionId=opts[0]?.id||"";
 const opt=opts.find(x=>x.id===optionId),index=opts.findIndex(x=>x.id===optionId);
 const catOptions=[
 ["algemeen","Algemene AI-assistent met zakelijk account"],["bestaand","AI binnen bestaande software"],
 ["specialist","Gespecialiseerde tool"],["eigen","Eigen koppeling of agent"],["zonder-ai","Geen AI: proces/standaardautomatisering"]
 ];
 const proposed=(()=>{
  const t=c.tasks.find(x=>x.id===s.selectedTask),src=(t?.name||"").toLowerCase(),systems=(c.profile.systems||"").toLowerCase();
  if(/rapport|dashboard|analyse/.test(src))return {function:"Samenvatten en patronen herkennen",direction:"bestaand",why:"De geselecteerde taak betreft gegevens verzamelen en rapporteren.",alt:"Eerst een gewone dashboardkoppeling onderzoeken."};
  if(/content|blog|tekst|social/.test(src))return {function:"Tekst genereren en redigeren",direction:"algemeen",why:"Het gaat om een terugkerende contenttaak.",alt:"Vergelijk met templates en een redactieproces."};
  if(/lead|crm|sales/.test(src))return {function:"Classificeren en opvolgacties voorstellen",direction:"bestaand",why:"De taak bevat leads of CRM-processen.",alt:"Probeer eerst CRM-workflows met vaste regels."};
  return {function:"Taakgerichte AI-functie onderzoeken",direction:"bestaand",why:"Specificeer eerst welke handeling de software moet uitvoeren.",alt:"Vergelijk altijd met bestaande automatisering."};
 })();
 const tools=opts.map(x=>'<button class="task-tab '+(x.id===optionId?"selected":"")+'" data-action="choose-tool" data-id="'+x.id+'">'+esc(x.name||"Nieuwe optie")+'</button>').join("");
 const bottom=result.tools.scores.map(x=>'<div class="ranking"><span class="rank">'+(x.shortlist?"✓":"—")+'</span><div><strong>'+esc(x.name)+'</strong><small>'+esc(x.decisionBasis)+'</small></div><b>'+fmt(x.mean,"/5")+'</b></div>').join("");
 const baseline=s.baseline||[],cycles=s.cycles||[];
 return stepHead(3,"Task-Technology Fit · TAM/UTAUT · PDSA","Welke oplossing werkt in het echte werk?","De geselecteerde taak bepaalt de benodigde AI-functie. Vergelijk eerst twee oplossingen met dezelfde opdrachten; de tool met de hoogste reclameclaim wint niet.",result)+
 nextInsight(3,result)+section("1. Van taak naar AI-functie","Gebaseerd op Task-Technology Fit. De suggestie is een hypothese; ze moet worden getest.",
 '<div class="insight compact"><div class="insight-icon">✦</div><div><b>Voorstel: '+esc(proposed.function)+'</b><p>'+esc(proposed.why)+' '+esc(proposed.alt)+'</p><button class="mini-button" data-action="apply-function">Gebruik dit als uitgangspunt</button></div></div>'+
 field("selection.aiFunction","Welke functie moet AI uitvoeren?","Bijv. samenvatten, genereren, segmenteren")+
 select("selection.direction","Welke oplossingsrichting onderzoek je?",[["","Kies eerst een richting"],...catOptions])+
 '<p class="helper-text">Voorkeursvolgorde uit het model: eenvoudigste oplossing die werkt, bestaande software vóór extra complexiteit. Functionaliteit en prijzen worden niet automatisch extern geverifieerd.</p>')+
 section("2. Voorgestelde oplossingsrichtingen","Gebaseerd op de gekozen taak en bestaande software. Dit zijn hypotheses die je zelf moet vergelijken, geen bewezen aanbevelingen.",
 '<div class="microgrid">'+toolDirections(c).map((item,i)=>'<div class="microcard"><h4>'+esc(item.name)+'</h4><p>'+esc(item.why)+'</p><button class="mini-button" data-action="add-recommended" data-index="'+i+'">Toevoegen aan de test →</button></div>').join("")+'</div>')+
 section("3. Maak de shortlist","Minstens twee opties. Scores van 1 of 2 vallen af; bepaal de uiteindelijke keuze via een blinde selectietest.",
 '<div class="task-tabs">'+tools+'</div><button class="button outline" data-action="add-tool">+ Optie toevoegen</button>')+
 (opt?optionForm(opt,index,result):'<div class="empty">Voeg een te onderzoeken AI-tool of niet-AI-alternatief toe.</div>')+
 section("3. Vergelijk de geteste alternatieven","De hoogste kwaliteit wint, bij verschil < 0,5 punt de kortste tijd, daarna eenvoud en kosten.",
 (bottom||'<div class="empty">Nog geen tools beoordeeld.</div>')+
 '<div class="calcout '+(result.tools.validChoice?"":"bad")+'">Selectieregel: '+esc(result.tools.note)+
 (result.tools.best?"<p>Voorlopig beste geteste optie: <b>"+esc(result.tools.best.name)+"</b></p>":"")+'</div>'+
 select("selection.selectedTool","Gekozen tool na selectietest",[["","Nog niet gekozen"],...opts.map(x=>[x.id,x.name||"Naamloos"])])+
 '<p class="helper-text">Het dashboard accepteert een ingevoerde keuze niet automatisch als bewezen wanneer de selectietest nog ontbreekt.</p>')+
 section("4. Nulmeting vóór de pilot","Volgens jullie model minstens vijf uitvoeringen op de huidige manier; inclusief voorbereiding, uitvoering, controle en correctie.",
 baseline.map((x,j)=>runForm("selection.baseline."+j,x,j,"Nulmeting "+(j+1))).join("")+
 '<button class="button outline" data-action="add-baseline">+ Nulmeting toevoegen</button><div class="calcout">Volledig gemeten nulmetingen: '+result.metrics.baselineCount+'/5 minimaal.</div>')+
 section("5. Medewerkers voorbereiden","Medewerkers moeten willen en kunnen meedoen. Rollen en oefentijd zijn onderdeel van de implementatie.",
 '<div class="formgrid">'+
 [["owner","Eigenaar · neemt besluit"],["operator","Uitvoerder · gebruikt de tool"],["reviewer","Beoordelaar · toetst blind"],["coach","Begeleider · bewaakt metingen"]].map(([id,label])=>field("selection.roles."+id,label,"Naam of functie")).join("")+'</div>'+
 field("selection.training","Training en medewerkersbetrokkenheid","Wat leren medewerkers en hoe oefenen ze met echte taken?","","textarea")+
 field("selection.lastCycleUsePercent","Aandeel taakuitvoeringen mét AI in laatste cyclus (0–100%)","Streefwaarde volgens model: 80%","","number")+
 '<div class="criterion-list">'+[["useful","De medewerker ziet het nut"],["quality","De kwaliteit is bruikbaar"],["easy","De tool is eenvoudig genoeg"],["support","De leiding ondersteunt het gebruik"]].map(([id,name])=>'<div class="criterion"><b>'+esc(name)+'</b>'+scoreFn("selection.acceptance."+id)+'</div>').join("")+'</div>'+
 '<div class="calcout">Acceptatiegemiddelde: '+fmt(result.acceptanceAvg,"/5")+' · streefwaarde 3,5.</div>')+
 section("6. Pilot en PDSA-cycli","Twee gedocumenteerde rondes met meten, leren en verbeteren; dezelfde taak, één team en een vast besluitmoment.",
 field("selection.pilotStart","Startdatum pilot","","", "date")+
 field("selection.pilotEnd","Besluitdatum / einde pilot","","", "date")+
 field("selection.success","Succescriteria vóór de pilot","Bijv. ≥30% netto tijdwinst en geen kritieke fouten")+
 field("selection.stop","Stopcriteria vóór de pilot","Bijv. oncontroleerbare fouten of privacy-incidenten")+
 cycles.map((cycle,i)=>disclose("PDSA-cyclus "+(i+1),"Plan · Do · Study · Act · meet meerdere uitvoeringen",
 field("selection.cycles."+i+".change","Wat is aangepast ten opzichte van de vorige ronde?","Bijv. verplichte controle op cijfers")+
 field("selection.cycles."+i+".learning","Wat heb je geleerd en wat verander je hierna?","Bijv. output was onbetrouwbaar bij ontbrekende data")+
 '<h4>Uitvoeringen in deze cyclus</h4>'+
 (cycle.runs||[]).map((x,j)=>runForm("selection.cycles."+i+".runs."+j,x,j,"Metingen "+(j+1))).join("")+
 '<button class="button outline" data-action="add-cycle-run" data-index="'+i+'">+ Uitvoering meten</button>'+
 '<div class="note-line"><button class="text-danger" data-action="remove-cycle" data-index="'+i+'">Cyclus verwijderen</button></div>'
 )) .join("")+
 '<button class="button outline" data-action="add-cycle">+ Verbetercyclus toevoegen</button><div class="calcout">Volledige PDSA-cycli: '+result.metrics.pdsacycles+'/2 minimaal.</div>')+
 endStep(3,result);
}
function phase5(result){
 const m=result.metrics,ev=active().evaluation;
 const benefits=["Ervaren tijdwinst is geen gemeten tijdwinst.","Benoem het bewijskrachtniveau en wees voorzichtig met causaliteit.","Een daling in uren is vaak eerst vrijgekomen capaciteit, geen directe loonkostenbesparing."];
 return stepHead(4,"DeLone & McLean · Balanced Scorecard","Wat levert de toepassing werkelijk op?","Hier bepalen we of de pilot aan de oorspronkelijke doelen voldoet, wat er voor organisatie en klant verandert en welke marketingtaak daarna volgt.",result)+
 nextInsight(4,result)+
 section("1. Gemeten resultaten","Het dashboard berekent nu uit de geregistreerde uitvoeringen van fase 4, in plaats van percentages te laten schatten.",
 '<div class="metric-grid">'+
 [["Vóór",fmt(m.before," min"),"Gemiddelde totale tijd"],["Met toepassing",fmt(m.after," min"),"Gemiddelde totale tijd"],["Tijdwinst",fmt(m.gain," min"),"Per uitvoering"],["Kwaliteit",fmt(m.qualityAfter,"/5"),"Blind beoordeeld"]].map(x=>'<div class="metric"><small>'+x[0]+'</small><strong>'+x[1]+'</strong><span>'+x[2]+'</span></div>').join("")+
 '</div><div class="calcout '+(m.qualityOK?"":"bad")+'">Kwaliteitsvergelijking: '+fmt(m.qualityBefore,"/5")+' vóór → '+fmt(m.qualityAfter,"/5")+' na · '+(m.qualityOK?"minstens gelijk":"nog niet aangetoond of lager")+'</div>')+
 section("2. Netto tijdwinst en commerciële waarde","Tijdwinst ≠ direct financieel rendement. Inrichttijd en leren moeten worden afgetrokken.",
 '<div class="formgrid">'+
 field("evaluation.executions","Aantal uitvoeringen in meetperiode","","","number")+
 field("evaluation.setupHours","Inrichttijd in uren","","","number")+
 field("evaluation.learningHours","Leertijd in uren","","","number")+
 field("evaluation.freedTimeUse","Percentage vrijgekomen tijd commercieel ingezet (0–100)","","","number")+'</div>'+
 '<div class="calcout"><strong>Netto tijdwinst: '+fmt(m.net," uur")+'</strong><small>Formule: (bespaarde minuten per uitvoering × aantal) / 60 − inrichting − leren.</small></div>'+
 field("evaluation.commercialUseEvidence","Waaraan zijn de vrijgekomen uren besteed?","Bijv. gesprekken met leads, aantoonbaar in CRM")+
 field("evaluation.customerValue","Waargenomen klantwaarde","Bijv. CTR, conversie, klanttevredenheid; alleen waar aantoonbaar.","","textarea"))+
 section("3. Kosten en ROI, uitsluitend als betrouwbaar","Bereken geen rendement uit alleen een geschatte tijdwinst.",
 '<div class="formgrid">'+
 field("evaluation.subscriptionMonthly","Licentie per maand (€)","","","number")+
 field("evaluation.maintenanceMonthly","Onderhoud per maand (€)","","","number")+
 field("evaluation.oneOffCosts","Eenmalige kosten (€)","","","number")+
 field("evaluation.horizonMonths","Aantal maanden in berekening","","","number")+
 field("evaluation.verifiedFinancialBenefit","Geverifieerde financiële baten (€)","","","number")+
 field("evaluation.financialEvidence","Bewijs van de werkelijke financiële baten","Verkooprapport, gedocumenteerd contract of boekhoudcontrole")+
 select("evaluation.benefitEvidence","Onderbouwing baten",[["","Niet geverifieerd"],["geverifieerd","Baten met bewijs onderbouwd"]])+'</div>'+
 '<div class="metric-grid"><div class="metric"><small>Totale kosten</small><strong>'+fmt(m.costs," €")+'</strong></div><div class="metric"><small>ROI indien bewijs</small><strong>'+fmt(m.roi,"%")+'</strong></div></div>')+
 section("4. Bewijskracht, incidenten en besluit","Het model onderscheidt een ervaring, voor/na, controlegroep en gecontroleerd experiment.",
 select("evaluation.evidenceMethod","Meetopzet",[["","Voor/na zonder controlegroep"],["control","Met controlegroep of controleperiode"],["experiment","Gecontroleerd experiment / A/B-test"]])+
 field("evaluation.evidenceReference","Bewijs voor controlegroep of experiment","Referentie van onderzoeksopzet, testdata of analyse")+
 select("evaluation.evidenceLevel","Bewijsniveau",[["1","1 · Gebruikerservaring"],["2","2 · Voor- en nameting"],["3","3 · Controlegroep/periode"],["4","4 · Gecontroleerd experiment / A/B-test"]])+
 field("evaluation.incidentsOpen","Hoeveel incidenten zijn nog open?","0","","number")+
 pick("evaluation.decision","Besluit van de eigenaar",[["","Nog geen besluit"],["doorgaan","Doorgaan"],["bijsturen","Bijsturen"],["stoppen","Stoppen"]])+
 field("evaluation.decisionReason","Waarom is dit besluit verantwoord?","Verwijs naar kwaliteit, netto tijd, risico's en controle.","","textarea")+
 '<div class="calcout '+(result.conflict?"bad":"")+'"><b>Modeluitkomst: '+esc(result.shouldContinue)+'</b>'+
 (result.conflict?'<p>Let op: de gekozen beslissing botst met de vereiste voorwaarden.</p>':"")+'</div>')+
 section("5. Volgende taak: het Groeikompas draait door","Na een geslaagde toepassing begint een nieuwe ronde bij fase 2; alleen bij veranderde marketingdoelen opnieuw fase 1.",
 result.nextTask?'<div class="recommend"><div><small>VOLGENDE KANDIDAAT</small><h3>'+esc(result.nextTask.name)+'</h3><p>Voorlopige prioriteit '+fmt(result.nextTask.priorityScore,"/100")+'; opnieuw de geschiktheid en risico’s onderzoeken.</p></div><button class="button outline" data-action="next-task" data-id="'+result.nextTask.id+'">Nieuwe ronde starten →</button></div>':
 '<div class="empty">Nog geen volgende geschikte taak. Vul bij fase 2 een aanvullende taak in en toets de voorwaarden.</div>'+
 field("evaluation.nextNotes","Wat nemen we mee in de volgende cyclus?","Kennis, training, verbeteringen, vaste eigenaar en monitoring.","","textarea"))+
 endStep(4,result);
}

function stageKpis(result){
 const k=result.kpis;
 return [
 ["1","Bedrijfsanalyse",k.phase1.readiness+"/7 contextvelden",k.phase1.problems+"/3 knelpunten",k.phase1.goal?"Doel vastgelegd":"Doel ontbreekt"],
 ["2","Procesprioritering",k.phase2.scored+"/5 beoordeelde taken",fmt(result.chosen?.priorityScore,"/100"),k.phase2.firstCheck?"Eerste-toepassingstoets ✓":"Eerste-toepassingstoets open"],
 ["3","Randvoorwaarden",k.phase3.risk.toUpperCase(),k.phase3.measures+"/"+k.phase3.total+" maatregelen",k.phase3.go?"Go vastgelegd":"Geen go"],
 ["4","AI-selectie & pilot",k.phase4.shortlisted+" shortlisttools",k.phase4.baseline+"/5 nulmetingen",k.phase4.pdsa+"/2 verbetercycli"],
 ["5","Meten & groeien",fmt(k.phase5.timeGain," min"),fmt(k.phase5.netHours," netto uur"),"Bewijsniveau "+k.phase5.evidence]
 ];
}
function bannerStatus(r){
 const list=r.alerts.length?'<div class="alerts"><h3>Directe aandacht</h3>'+r.alerts.map(x=>'<p>⚠ '+esc(x)+'</p>').join("")+'</div>':"";
 return '<div class="verdict '+(r.conflict?"critical":r.risk.go?"go":"pending")+'"><div><small>BESTE VERDEDIGBARE CONCLUSIE OP DIT MOMENT</small><h2>'+esc(r.conflict?"Niet doorgaan zonder herbeoordeling":r.goStatus)+'</h2><p>'+
 (r.conflict?"De gekozen beslissing wijkt af van de gemeten kwaliteit, tijdwinst of incidenten.":r.risk.go?"Een formeel go/no-go-besluit is onderbouwd; de resultaten van selectie en pilot bepalen de volgende stap.":"Een positief investerings- of pilotbesluit is nog niet onderbouwd. Ga door met onderzoek, niet met echte bedrijfsgegevens.")+
 '</p></div><div class="verdict-symbol">'+(r.conflict?"!":r.risk.go?"✓":"?")+'</div></div>'+list;
}
function home(result){
 const c=active(),done=result.gates.filter(Boolean).length;
 return '<div class="welcome"><div class="eyebrow">ONDERZOEKSSTUDIO · GHUB-M7</div><h1>Niet beginnen bij AI. <em>Beginnen bij waarde.</em></h1><p>Een onderbouwde route van marketingvraagstuk naar een geteste, gemeten en verantwoord ingevoerde toepassing. Precies vijf fasen. Geen fictieve scores, geen automatische juridische vrijgave.</p><div class="welcome-actions"><button class="button primary" data-nav="p'+(result.gates.findIndex(x=>!x)<0?4:result.gates.findIndex(x=>!x))+'">Verder met mijn onderzoek →</button><button class="button ghost-light" data-nav="report">Bekijk conceptadvies</button></div></div>'+
 '<div class="dashboard-row"><div class="dashboard-feature"><div class="pie" style="--pct:'+(done/5*100)+'"><strong>'+done+'/5</strong></div><div><span>Onderzoeksvoortgang</span><b>'+esc(c.profile.name||c.title)+'</b><p>Een fase wordt pas als afgerond gezien wanneer de benodigde onderdelen zijn geregistreerd.</p></div></div>'+
 '<div class="dashboard-feature"><div class="feature-icon">⚖</div><div><span>Risicobeoordeling</span><b>'+esc(result.risk.level.toUpperCase())+'</b><p>'+esc(result.risk.go?"Go voorbereid, bewijs blijven controleren.":"Geen volledige go-vrijgave: "+result.risk.unverified.length+" controlepunten open.")+'</p></div></div></div>'+
 section("De vijf fasen","Alle vijf onderdelen komen rechtstreeks uit het AI-Groeikompas. De volgende fase gebruikt de conclusies uit de vorige.",
 '<div class="phase-cards">'+PHASES.map((name,i)=>'<button class="phase-card" data-nav="p'+i+'"><div class="phase-num">0'+(i+1)+'</div><div><b>'+esc(name)+'</b><small>'+["Probleem & TOE-analyse","SIPOC & prioriteitenmatrix","Risicoklasse & go/no-go","Selectietest & PDSA","Netto waarde & groeiroute"][i]+'</small></div><span class="phase-chip '+(result.gates[i]?"done":"")+'">'+(result.gates[i]?"✓":"→")+'</span></button>').join("")+'</div>')+
 section("Onderzoeksstatus","De beslisregels maken open onderzoekswerk zichtbaar in plaats van het te verbergen.",
 bannerStatus(result)+'<div class="bottom-links"><button data-nav="report" class="button outline">Volledig advies en open punten →</button><button data-nav="compare" class="button outline">Vergelijk bedrijfsdossiers</button></div>')+
 (vault.migrated?'<div class="source-note"><b>Oude dossiers:</b> eerdere bedrijfsgegevens zijn als concept overgenomen waar dat veilig mogelijk was. Scores en risicogoedkeuringen zijn bewust niet als geverifieerd overgenomen. De oorspronkelijke opslag blijft bestaan.</div>':"");
}
function report(result){
 const c=active(),p=c.profile,r=result,m=r.metrics;
 const tasks=r.tasks,selected=r.chosen;
 const profile='<div class="report-facts"><div><small>BEDRIJF</small><b>'+esc(p.name||c.title)+'</b></div><div><small>ONDERZOEKSROUTE</small><b>'+esc(p.route||"Nog niet gekozen")+'</b></div><div><small>RISICOKLASSE</small><b>'+esc(r.risk.level)+'</b></div><div><small>STATUS</small><b>'+esc(r.risk.go?"Go voor onderzoek":"Geen onderbouwde go")+'</b></div></div>';
 const taskTable='<table class="data-table"><thead><tr><th>Marketingtaak</th><th>Geschikt</th><th>Prioriteit</th><th>Resultaat</th></tr></thead><tbody>'+tasks.map(t=>'<tr><td>'+esc(t.name)+'</td><td>'+(t.fitOK?"Ja":t.fitComplete?"Nee":"Onbekend")+'</td><td>'+fmt(t.priorityScore,"/100")+'</td><td>'+(t.eligible?"Kandidaat":"Open/afgevallen")+'</td></tr>').join("")+'</tbody></table>';
 const tests='<table class="data-table"><thead><tr><th>Optie</th><th>Criteria</th><th>Testkwaliteit</th><th>Tijd</th></tr></thead><tbody>'+r.tools.scores.map(t=>'<tr><td>'+esc(t.name)+'</td><td>'+fmt(t.mean,"/5")+'</td><td>'+fmt(t.meanQuality,"/5")+'</td><td>'+fmt(t.avgTime," min")+'</td></tr>').join("")+'</tbody></table>';
 const missing='<ul class="report-bullets">'+r.issues.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>';
 const alerts='<ul class="report-bullets">'+r.alerts.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>';
 const next= r.decision==="doorgaan"&&r.nextTask?"Start de volgende groeironde met "+r.nextTask.name+".":"Evalueer eerst de huidige toepassing en open acties voordat het bedrijf verder groeit.";
 return '<div class="report-toolbar"><div><span class="eyebrow">CONCEPT ADVIESRAPPORT · ONDERZOEKSMODEL</span><h1>Een beslissing die je kunt verantwoorden.</h1><p>Geen marketingtekst, maar een herleidbaar onderzoeksdossier met ontbrekend bewijs en voorlopige aannames.</p></div><div class="report-controls"><button class="button outline" data-action="print">Afdrukken / PDF</button><button class="button primary" data-action="download-report">Download HTML</button></div></div>'+
 '<article class="report-sheet" id="reportPrint"><div class="report-cover"><div class="report-mark">✦ AI-GROEIKOMPAS</div><h1>AI-implementatieadvies</h1><p>'+esc(p.name||c.title)+'</p><div class="report-under">G-cluster · Onderzoeksversie · 30 november 2026</div></div>'+
 '<div class="report-section"><h2>Managementsamenvatting</h2>'+profile+bannerStatus(r)+'<p><b>Marketingdoel:</b> '+esc(p.goal||"Nog niet vastgelegd")+'. <b>Commerciële koppeling:</b> '+esc(p.commercialUse||"Ontbreekt")+'.</p>'+
 '<p><b>Eerste taak:</b> '+esc(selected?.name||"Nog niet aangetoond")+'. <b>Beslisregel:</b> geen scores onder 3 en geen verboden/ongecontroleerde risico’s.</p></div>'+
 '<div class="report-section"><h2>Fase 1 — Bedrijfsanalyse</h2><p>'+esc((p.problems||[]).map(x=>x.description).join("; ")||"Knelpunten nog te beschrijven")+'</p><p><b>TOE-context:</b> '+esc(p.strategy||"strategie onbekend")+' · '+esc(p.systems||"technologie onbekend")+' · '+esc(p.environment||"omgeving onbekend")+'</p></div>'+
 '<div class="report-section"><h2>Fase 2 — Procesprioritering</h2><div class="table-scroller">'+taskTable+'</div><p>Correcte schaal: score 1 → 0; score 3 → 50; score 5 → 100. '+esc(r.w.mode)+'.</p>'+
 '<p>De rangorde gebruikt uitsluitend taken die de geschiktheidsscan en eerste-toepassingstoets halen. Deze waarden zijn voorlopige ontwerpkeuzes.</p></div>'+
 '<div class="report-section"><h2>Fase 3 — Randvoorwaarden</h2><p>Risiconiveau: <b>'+esc(r.risk.level)+'</b> · vereiste maatregelen: '+r.risk.required.length+' · niet volledig: '+r.risk.unverified.length+'.</p>'+
 '<p><b>Go/no-go:</b> '+esc(r.risk.decision)+'. <b>Eigenaar:</b> '+esc(r.risk.owner||"ontbreekt")+'.</p>'+
 '<p>De beoordeling is geen juridische goedkeuring en moet worden getoetst door een bevoegde deskundige.</p></div>'+
 '<div class="report-section"><h2>Fase 4 — Selectie en implementatie</h2><div class="table-scroller">'+tests+'</div><p>De selectietest gebruikt identieke opdrachten, blinde scores en totale tijd per taak. <b>Uitkomst:</b> '+esc(r.tools.best?.name||"Nog geen bewezen winnaar")+'.</p>'+
 '<p>Vijf nulmetingen: '+m.baselineCount+' geregistreerd · gedocumenteerde PDSA-cycli: '+m.pdsacycles+'.</p></div>'+
 '<div class="report-section"><h2>Fase 5 — Effect en waardecreatie</h2><div class="metric-grid">'+
 [["Volledige taakduur vóór",fmt(m.before," min")],["Volledige taakduur na",fmt(m.after," min")],["Netto tijdwinst",fmt(m.net," uur")],["ROI indien bewezen",fmt(m.roi,"%")]].map(x=>'<div class="metric"><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>').join("")+
 '</div><p><b>Kwaliteit:</b> '+fmt(m.qualityBefore,"/5")+" → "+fmt(m.qualityAfter,"/5")+'. Bewijsniveau '+m.evidenceLevel+'/4.</p><p><b>Besluit:</b> '+esc(r.decision||"nog niet genomen")+'. <b>Volgende stap:</b> '+esc(next)+'</p></div>'+
 (r.alerts.length?'<div class="report-section critical"><h2>Kritische signalen</h2>'+alerts+'</div>':"")+
 '<div class="report-section"><h2>Ontbrekend bewijs en actiepunten</h2>'+missing+'</div>'+
 '<div class="report-section"><h2>Onderzoeksbeperkingen</h2><p>'+esc(r.disclaimer)+'</p><p>Een voor- en nameting alleen bewijst geen causaal effect. Het rapport wordt pas definitief na beoordeling door het bedrijf en de onderzoeker.</p></div>'+
 '<footer>AI-GROEIKOMPAS · gebaseerd op het model van GHUB-M7 · Geen autonome juridische of financiële besluitvorming</footer></article>';
}
function compare(){
 const rows=vault.cases.map(c=>{const r=M.evaluate(c);return '<tr><td><b>'+esc(c.profile.name||c.title)+'</b></td><td>'+esc(r.d.profile.route||"onbekend")+'</td><td>'+r.tasks.length+'</td><td>'+esc(r.risk.level)+'</td><td>'+r.kpis.phase4.pdsa+'</td><td>'+fmt(r.metrics.net," uur")+'</td></tr>'}).join("");
 return '<div class="page-intro"><span class="eyebrow">VERGELIJKEND G-CLUSTERONDERZOEK</span><h1>Bedrijven naast elkaar</h1><p>Vergelijk vijf unieke MKB-casussen zonder uit vijf gesprekken conclusies over het hele MKB te trekken.</p></div>'+
 section("Vergelijking van de dossiers","Kwalitatieve verschillen. Ieder dossier heeft zijn eigen antwoorden en bewijs.",
 '<div class="table-scroller"><table class="data-table"><thead><tr><th>Bedrijf</th><th>Route</th><th>Taken</th><th>Risico</th><th>PDSA</th><th>Netto tijd</th></tr></thead><tbody>'+rows+'</tbody></table></div>')+
 section("Bewijskwaliteit","Een interview of score is nog geen bewijs dat een AI-implementatie commercieel effectief is.",
 '<p class="helper-text">Houd interviews, observaties en experimenten gescheiden. Noteer welke criteria respondenten moeilijk vonden en hoe het model hierdoor is aangepast. De projectgroep toetst de bruikbaarheid op een gemiddelde van minimaal 3,5/5; dit is een voorlopige projectgroepgrens.</p>');
}
function methods(){
 return '<div class="page-intro"><span class="eyebrow">METHODISCHE HERLEIDBAARHEID</span><h1>De onderbouwing achter het kompas</h1><p>De software is ontworpen als digitale uitvoering van AI - Groeikompas-2.docx. Startdrempels zijn voorstellen van jullie projectgroep, niet bewezen algemene normen.</p></div>'+
 section("Vijf fasen en hun modelmatige basis","Elke fase houdt zijn eigen doel, hulpmiddelen en output.",
 '<div class="method-list">'+[
 ["1. Bedrijfsanalyse","TOE, AI-gereedheid","Bedrijfsprofiel, lichte/volledige route, meetbaar verbeterdoel, commerciële koppeling"],
 ["2. Procesprioritering","SIPOC, taakniveau, AHP","Geschiktheidsscan ≥3, risico als drempel, gewogen prioriteitenrangorde, eerste-toepassingstoets"],
 ["3. Randvoorwaarden","NIST AI RMF, AVG, AI-verordening","Risicoklasse laag/middel/hoog, proportionele maatregelen, eigenaar, go/no-go"],
 ["4. AI-selectie & implementatie","Task-Technology Fit, TAM/UTAUT, PDSA","Vergelijking acht criteria, blinde test, nulmeting, medewerkers, twee leercycli"],
 ["5. Meten & groeien","DeLone & McLean, Balanced Scorecard","Netto tijd, kwaliteit, ROI indien bewijs, bewijskracht 1–4, volgende groeironde"]
 ].map(x=>'<div class="method"><b>'+x[0]+'</b><span>'+x[1]+'</span><p>'+x[2]+'</p></div>').join("")+'</div>')+
 '<div class="source-note"><b>Bron:</b> AI-Groeikompas GHUB-M7, conceptversie 30 november 2026, paragraaf 1.7 en 1.8. Deze app bevat géén geautomatiseerde controle of genoemde wetgeving nog actueel is.</div>';
}

function sampleCase(){
 const c=blank("DEMO · Noordlicht Bouwgroep");
 const p=c.profile;
 Object.assign(p,{name:c.title,size:"mkb",route:"licht",owner:"Marketingmanager",strategy:"Meer leads uit bestaande advertentiekanalen en betere commerciële sturing.",skills:"Twee marketeers kunnen rapportages beoordelen en hebben basiservaring met AI.",budget:"Vier uur per week voor test; budget voor beperkte licentie.",culture:"Team staat open voor experimenteren en bespreekt fouten.",existingAI:"Incidenteel gebruik van een AI-assistent voor tekstideeën.",systems:"CRM, Google Ads, GA4 en bestaande dashboardsoftware.",environment:"Zakelijke klanten; dataverwerking moet vooraf onderzocht worden.",goal:"Maandelijkse rapportagetijd van 90 naar 50 minuten zonder verlies aan juistheid.",indicator:"Netto minuten per gecontroleerde rapportage en kwaliteitsscore.",commercialUse:"Vrijgekomen tijd inzetten voor actief opvolgen van offerteaanvragen.",
 problems:[
 {id:uid(),description:"Maandelijkse rapportage maken kost veel handmatige tijd.",impact:"90 minuten per rapportage",source:"Fictieve tijdregistratie"},
 {id:uid(),description:"Leads worden niet consequent nagebeld.",impact:"Onbekende gemiste kansen",source:"Fictief interview met sales"},
 {id:uid(),description:"Sociale content komt onregelmatig online.",impact:"Twee uur extra planning",source:"Fictieve observatie"}
 ]});
 const t=createTask("Campagnerapportage samenstellen");t.aiNeeded="ja";t.category="uitvoerend";t.contentKind="feitelijk";
 t.sipoc={supplier:"Google Ads, GA4",input:"Campagnecijfers",process:"Verzamelen, controleren, samenvatten",output:"Directierapport",customer:"Marketingmanager"};
 for(const [id] of M.FIT)t.fit[id]=4;
 for(const [id] of M.PRIOR)t.priority[id]=4;
 t.firstCheck=[true,true,true,true,true];c.tasks=[t];c.selection.selectedTask=t.id;
 Object.assign(c.risk,{personalize:"nee",personalData:"nee",unreviewedCustomer:"nee",owner:"Marketingmanager",decision:"go",decisionEvidence:"Fictief besluit van eigenaar, geen persoonsgegevens in proef.",dataQuality:"Fictieve broncontrole uitgevoerd"});
 c.risk.measures={};
 for(const item of M.RISK.filter(x=>x.min==="laag"))c.risk.measures[item.id]={status:"geregeld",evidence:"Fictief gecontroleerd met datum en verantwoordelijke."};
 c.selection.aiFunction="Samenvatten van gecontroleerde campagnerapportages";c.selection.direction="bestaand";
 for(let i=0;i<2;i++){
  const tool={id:uid(),name:i===0?"Bestaande software met AI-functie":"Zakelijke AI-assistent",category:i===0?"bestaand":"algemeen",totalCost:i===0?"35":"20",scores:{},notes:{},hard:{dataLocation:"ja",training:"ja",dpa:"ja",access:"ja"},tests:[]};
  for(const [id] of M.TOOL)tool.scores[id]=i===0?4:3;
  for(let j=1;j<=3;j++){const run={caseId:"Opdracht-"+j,prepare:"5",prompt:"15",review:"8",correct:"5",ratings:{}};for(const [k] of M.QUALITY)run.ratings[k]=i===0?4:3;tool.tests.push(run)}
  c.selection.options.push(tool);
 }
 c.selection.selectedTool=c.selection.options[0].id;
 for(let i=1;i<=5;i++){const run={caseId:"Nul-"+i,prepare:"15",prompt:"50",review:"15",correct:"10",ratings:{}};for(const [id] of M.QUALITY)run.ratings[id]=4;c.selection.baseline.push(run)}
 c.selection.roles={owner:"Marketingmanager",operator:"Marketeer",reviewer:"Collega",coach:"Marketingmanager"};
 c.selection.training="Fictieve oefensessie met dezelfde marketingrapportages.";c.selection.lastCycleUsePercent="85";c.selection.acceptance={useful:4,quality:4,easy:4,support:4};
 c.selection.success="Rapportage onder 60 minuten met kwaliteit minimaal 4/5.";c.selection.stop="Stop bij kritieke cijferfouten.";
 for(let i=1;i<=2;i++){
  const cycle={change:i===1?"Brontabel vooraf controleren":"Dubbele controle op afwijkingen",learning:"Controle verkleinde foutkans",runs:[]};
  for(let j=1;j<=3;j++){const run={caseId:"Pilot-"+i+"-"+j,prepare:"5",prompt:"23",review:"13",correct:"4",ratings:{}};for(const [id] of M.QUALITY)run.ratings[id]=4;cycle.runs.push(run)}
  c.selection.cycles.push(cycle);
 }
 Object.assign(c.evaluation,{executions:"20",setupHours:"1",learningHours:"1",freedTimeUse:"65",incidentsOpen:"0",evidenceLevel:"2",decision:"doorgaan",decisionReason:"Fictieve tijdwinst, gelijkblijvende kwaliteit en geen open incidenten.",nextNotes:"Volgende taak uit de rangorde onderzoeken."});
 return c;
}
function exportDownload(filename,data,type="application/json"){
 const blob=new Blob([data],{type}),u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);
}
function navHTML(result){
 const links=[["home","Overzicht","⌂"],...PHASES.map((p,i)=>["p"+i,p,String(i+1)]),["report","Adviesrapport","▤"],["compare","Bedrijven vergelijken","▥"],["methods","Methodiek","◎"]];
 return links.map(([id,label,icon])=>'<button class="nav-link '+(page===id?"active":"")+'" data-nav="'+id+'"><span class="nav-icon">'+icon+'</span><span>'+esc(label)+'</span>'+(id.startsWith("p")&&id.length===2&&result.gates[Number(id[1])]?'<span class="nav-done">✓</span>':"")+'</button>').join("");
}
function render(keepScroll=false){
 const y=keepScroll?window.scrollY:0;
 const details=keepScroll?Array.from(document.querySelectorAll("main details")).map((d,i)=>d.open?i:-1).filter(x=>x>=0):[];
 const c=active(),r=M.evaluate(c);
 const content=page==="home"?home(r):page==="report"?report(r):page==="compare"?compare():page==="methods"?methods():
 page==="p0"?phase1(r):page==="p1"?phase2(r):page==="p2"?phase3(r):page==="p3"?phase4(r):phase5(r);
 document.getElementById("app").innerHTML='<div class="shell">'+
 '<aside class="sidebar '+(mobile?"mobile-open":"")+'"><div class="brand"><div class="brand-symbol">✦</div><div><strong>AI-GROEIKOMPAS</strong><small>RESEARCH STUDIO · HAN</small></div></div>'+
 '<div class="sidebar-label">WERKOMGEVING</div><nav class="navigation">'+navHTML(r)+'</nav>'+
 '<div class="side-bottom"><span class="side-dot"></span><strong>Onderzoeksprototype</strong><p>30 november 2026 · Model GHUB-M7</p><small>Gewichten en normgrenzen zijn voorlopige ontwerpkeuzes.</small></div></aside>'+
 '<button class="scrim '+(mobile?"visible":"")+'" data-action="toggle-menu" aria-label="Sluit menu"></button>'+
 '<div class="workspace"><header class="topbar"><button class="hamburger" data-action="toggle-menu" aria-label="Open navigatiemenu">☰</button>'+
 '<div class="topbar-path"><b>HAN · Martech & Innovatie</b><small>Van marketingvraagstuk naar meetbare waarde</small></div>'+
 '<div class="topbar-actions"><button class="top-minor" data-action="export">Export</button><button class="top-minor" data-action="import">Import</button></div></header>'+
 '<div class="casebar"><div class="casebar-name"><div class="case-avatar">⌁</div><div><small>ACTIEF BEDRIJFSDOSSIER</small><select id="case-picker" aria-label="Kies bedrijfsdossier">'+vault.cases.map(x=>'<option value="'+x.id+'" '+(x.id===vault.active?"selected":"")+'>'+esc(x.profile.name||x.title)+'</option>').join("")+'</select></div></div>'+
 '<div class="casebar-buttons"><button class="case-button" data-action="add-case">+ Bedrijf</button><button class="case-button secondary" data-action="demo">Demo</button><button class="case-button ghost" data-action="delete-case">Verwijder</button></div></div>'+
 '<main class="main" id="content">'+content+'</main>'+
 '<footer class="app-footer">AI-GROEIKOMPAS · Praktisch onderzoek, geen onbewezen automatiseringsbelofte. Gegevens blijven lokaal op dit apparaat.</footer></div></div>'+
 '<div id="toast" class="toast" role="status"></div><input type="file" id="importer" accept="application/json" hidden>';
 if(keepScroll){const ds=document.querySelectorAll("main details");details.forEach(i=>{if(ds[i])ds[i].open=true});window.scrollTo(0,y)}else window.scrollTo(0,0);
 save();
}
function addTool(){
 const c=active(),opt={id:uid(),name:"Nieuwe optie",category:"",scores:{},notes:{},hard:{},tests:[],totalCost:""};
 c.selection.options.push(opt);optionId=opt.id;save();
}
function act(type,el){
 const c=active(),s=c.selection,idx=Number(el?.dataset.index||0),id=el?.dataset.id||"";
 if(type==="toggle-menu"){mobile=!mobile;render(true);return}
 if(type==="add-case"){const v=prompt("Naam van het nieuwe MKB-bedrijf:","Nieuw bedrijf");if(v===null)return;const a=blank(v.trim()||"Nieuw bedrijf");vault.cases.push(a);vault.active=a.id;page="p0";taskId="";optionId="";}
 else if(type==="demo"){if(!confirm("Een extra fictief demo-dossier toevoegen? Bestaande gegevens blijven behouden."))return;const a=sampleCase();vault.cases.push(a);vault.active=a.id;page="home";taskId="";optionId="";}
 else if(type==="delete-case"){if(vault.cases.length<2)return notify("Maak eerst een ander dossier aan.","error");if(!confirm("Het actieve dossier verwijderen? Maak zo nodig eerst een back-up."))return;vault.cases=vault.cases.filter(x=>x.id!==vault.active);vault.active=vault.cases[0].id;page="home";}
 else if(type==="add-problem")create("profile.problems",{id:uid(),description:"",impact:"",source:""});
 else if(type==="remove-problem")del("profile.problems",idx);
 else if(type==="suggest-task"){const rec=recommendTask(c);const t=createTask(rec.name);t.category=rec.type;c.tasks.push(t);taskId=t.id;notify("Taak toegevoegd als onderzoeksvoorstel.");}
 else if(type==="suggest-nonai"){const rec=recommendTask(c);notify("Onderzoek ook: "+rec.nonai);}
 else if(type==="add-task"){const t=createTask();c.tasks.push(t);taskId=t.id;}
 else if(type==="remove-task"){if(!confirm("Deze taak en zijn beoordelingen verwijderen?"))return;c.tasks=c.tasks.filter(x=>x.id!==id);if(s.selectedTask===id)s.selectedTask="";taskId=c.tasks[0]?.id||"";}
 else if(type==="choose-task")taskId=id;
 else if(type==="select-first-task")s.selectedTask=id;
 else if(type==="add-recommended"){
  const item=toolDirections(c)[idx];if(!item)return;
  const found=s.options.find(x=>x.name===item.name);
  if(found){optionId=found.id;notify("Deze optie staat al in de selectie.")}
  else {const opt={id:uid(),name:item.name,category:item.kind,scores:{},notes:{},hard:{},tests:[],totalCost:""};s.options.push(opt);optionId=opt.id;notify("Onderzoeksoptie toegevoegd. Beoordeel en test deze eerst.");}
 }
 else if(type==="add-tool")addTool();
 else if(type==="choose-tool")optionId=id;
 else if(type==="remove-tool"){if(!confirm("Deze tool en testresultaten verwijderen?"))return;s.options=s.options.filter(x=>x.id!==id);if(s.selectedTool===id)s.selectedTool="";optionId=s.options[0]?.id||"";}
 else if(type==="add-test"){const o=s.options.find(x=>x.id===id);if(o){o.tests.push(newRun("Opdracht-"+(o.tests.length+1)));}}
 else if(type==="add-baseline")s.baseline.push(newRun("Nulmeting-"+(s.baseline.length+1)));
 else if(type==="add-cycle")s.cycles.push({change:"",learning:"",runs:[]});
 else if(type==="add-cycle-run"){const cy=s.cycles[idx];if(cy)cy.runs.push(newRun("Pilot-"+(idx+1)+"-"+(cy.runs.length+1)))}
 else if(type==="remove-cycle")s.cycles.splice(idx,1);
 else if(type==="remove-run")del(el.dataset.target,idx);
 else if(type==="apply-function"){const p=(c.tasks.find(x=>x.id===s.selectedTask)?.name||"").toLowerCase();s.aiFunction=/rapport|analys/.test(p)?"Samenvatten en patronen herkennen":/tekst|content|social/.test(p)?"Tekst genereren":/lead|sales/.test(p)?"Classificeren en opvolgacties voorstellen":"Taakgerichte AI-functie testen";}
 else if(type==="next-task"){if(!confirm("Nieuwe groeironde starten met deze taak? De huidige metingen worden in een dossierhistorie bewaard."))return;
  c.history??=[];c.history.push({date:new Date().toISOString(),selectedTask:s.selectedTask,selection:clone(s),evaluation:clone(c.evaluation)});
  s.selectedTask=id;s.options=[];s.baseline=[];s.cycles=[];s.selectedTool="";s.aiFunction="";c.risk.decision="";c.risk.decisionEvidence="";c.evaluation=blank().evaluation;taskId=id;page="p2";notify("Vorige ronde bewaard in dossierhistorie.");}
 else if(type==="export")exportDownload("AI-Groeikompas-bedrijfsdossiers-v3.json",JSON.stringify({format:"AI-GROEIKOMPAS-V3",version:3,exportedAt:new Date().toISOString(),cases:vault.cases,active:vault.active},null,2));
 else if(type==="import"){document.getElementById("importer").click();return;}
 else if(type==="print"){window.print();return;}
 else if(type==="download-report"){
  const content=document.getElementById("reportPrint")?.outerHTML||"";
  const reportCSS="body{margin:0;background:#f1f6f4;color:#24444a;font:14px Arial,sans-serif} .report-sheet{max-width:860px;margin:30px auto;padding:42px;background:white} h1,h2{color:#193d46} .report-cover{border-bottom:3px solid #5dbb9c;padding-bottom:25px;margin-bottom:25px} .report-section{margin-bottom:25px;padding-bottom:17px;border-bottom:1px solid #dbe8e3;break-inside:avoid} p,li{line-height:1.65} .report-facts,.metric-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:12px 0}.report-facts>div,.metric{padding:12px;background:#eef8f3;border-radius:7px} small{display:block;color:#688c83} .data-table{width:100%;border-collapse:collapse;font-size:11px}.data-table th,.data-table td{padding:10px;border-bottom:1px solid #dee9e5;text-align:left}.verdict{background:#fff5e8;padding:16px;margin:15px 0;border-left:4px solid #9cccb9}.alerts{background:#fff1e8;padding:15px}.report-under,footer{font-size:11px;color:#79948c}@media print{body{background:white}.report-sheet{padding:0;margin:0;max-width:none}@page{size:A4;margin:15mm}}";
  const doc='<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>AI-Groeikompas Advies</title><style>'+reportCSS+'</style></head><body>'+content+'</body></html>';
  exportDownload("AI-Groeikompas-advies.html",doc,"text/html;charset=utf-8");return;
}
 else return;
 save();render(true);
}
document.addEventListener("click",function(e){
 const nav=e.target.closest("[data-nav]");if(nav){page=nav.dataset.nav;mobile=false;render();return;}
 const setBtn=e.target.closest("[data-set]");if(setBtn){
  let value=setBtn.dataset.value,path=setBtn.dataset.set;
  if(path.includes("firstCheck."))value=value==="ja"?true:value==="nee"?false:"";
  set(path,value);render(true);return;
 }
 const btn=e.target.closest("[data-action]");if(btn){act(btn.dataset.action,btn);return;}
});
document.addEventListener("input",function(e){
 const el=e.target;if(el.dataset.bind!==undefined){set(el.dataset.bind,el.value);}
});
document.addEventListener("change",function(e){
 const el=e.target;
 if(el.id==="case-picker"){vault.active=el.value;page="home";taskId="";optionId="";render();return}
 if(el.dataset.check!==undefined){set(el.dataset.check,el.checked);render(true);return}
 if(el.dataset.bind!==undefined){set(el.dataset.bind,el.value);render(true);return}
 if(el.id==="importer"&&el.files[0]){
  const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);if(data.format!=="AI-GROEIKOMPAS-V3"||!Array.isArray(data.cases)||!data.cases.length)throw Error("Geen geldig v3-dossierbestand");if(!confirm("Alle huidige dossiers vervangen door dit bestand? Exporteer eerst een back-up als je ze wilt bewaren."))return;vault={cases:data.cases,active:data.active,version:3};if(!vault.cases.some(x=>x.id===vault.active))vault.active=vault.cases[0].id;page="home";save();render();notify("Dossiers geïmporteerd.");}catch(err){alert("Import mislukt: "+err.message)}};reader.readAsText(el.files[0]);
 }
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&mobile){mobile=false;render(true)}});
render();
})();
