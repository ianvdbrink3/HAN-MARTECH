/* AI-GROEIKOMPAS: adaptive guidance engine.
   Evidence-aware suggestions only. Never writes a risk approval, KPI, score, or measured fact.
   Each suggestion is a hypothesis to investigate, not a verified tool recommendation.
*/
(function(root){
"use strict";
const norm=x=>typeof x==="string"?x.trim():"";
const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const groups=[
 {id:"reporting",terms:/rapport|dashboard|cijfer|analyse|analytics|ga4|marketingresultaat|kpi|data.visualis|performance|campagne.overzicht/i,task:"Campagnerapportages verzamelen, controleren en samenvatten",nonai:"Bestaande rapportagekoppeling en dashboardautomatisering",value:"Minder handmatig gegevens verzamelen; betrouwbaarheid van broncijfers behouden",kind:"AI-functie binnen bestaande BI- of rapportagesoftware",brands:["AI-functie in bestaande BI-/CRM-software","Gespecialiseerde AI-analyseassistent"],question:"Kan een standaarddashboard de gegevens al automatisch samenbrengen?",risk:"Controle van broncijfers, toegang tot marketingdata en het voorkomen van foutieve samenvattingen"},
 {id:"crm",terms:/crm|lead|verkoop|sales|klantsegment|offert|salesfunnel|pipeline|opvolg|prospect/i,task:"Leads kwalificeren en opvolgacties voorbereiden",nonai:"CRM-workflow met heldere opvolgregels en automatische taaktoewijzing",value:"Snellere en consistentere opvolging zonder ongecontroleerde klantprofilering",kind:"AI-functie in het bestaande CRM-systeem",brands:["AI-assistent binnen het bestaande CRM","Workflowautomatisering zonder AI"],question:"Kan jullie CRM dit al met workflows of segmentregels oplossen?",risk:"Persoonsgegevens, profiling, ongewenste bias en controle op klantcommunicatie"},
 {id:"content",terms:/content|tekst|seo|blog|social|nieuwsbrief|advertentie.tekst|e.mail|copywrit|communicatie/i,task:"Marketingcontent voorbereiden en op kwaliteit controleren",nonai:"Herbruikbare contenttemplates, redactieplanning en bestaande automatisering",value:"Sneller een eerste concept maken zonder merktoon of feitelijke nauwkeurigheid te verliezen",kind:"AI-schrijfassistent met menselijke eindredactie",brands:["AI-functie in bestaande werkomgeving","Zakelijke AI-schrijfassistent"],question:"Kan een goede template of vaste contentworkflow hetzelfde probleem oplossen?",risk:"Auteursrechten, onjuiste claims, merkconsistentie en eventuele invoer van persoonsgegevens"},
 {id:"service",terms:/klantenservice|support|klantvragen|faq|servicevragen|ticket|contactform/i,task:"Terugkerende klantvragen herkennen en conceptantwoorden voorbereiden",nonai:"Kennisbank, slimme FAQ of routering van vragen",value:"Medewerkers sneller laten reageren terwijl de inhoud gecontroleerd blijft",kind:"AI-assistent op basis van een gecontroleerde kennisbank",brands:["AI-functie in bestaande klantenservice-software","Kennisbankassistent met menselijke controle"],question:"Kan een betere kennisbank de meeste vragen al afhandelen?",risk:"Onjuiste antwoorden, verwerking van persoonsgegevens en overdracht aan medewerkers"},
 {id:"generic",terms:/.*/i,task:"De concrete marketingtaak achter het beschreven probleem",nonai:"Het proces vereenvoudigen en bestaande software beter benutten",value:"Meetbare verbetering van het vastgestelde marketingprobleem",kind:"AI-functie in de software die jullie nu al gebruiken",brands:["AI-functie in bestaande software","Losse gespecialiseerde AI-oplossing"],question:"Wat kan de huidige software al automatiseren zonder een AI-model?",risk:"Datakwaliteit, privacy, menselijke controle en procesverantwoordelijkheid"}
];
const stack=[
 {test:/hubspot/i,option:"HubSpot: bestaande AI- of workflowfunctionaliteit onderzoeken",why:"HubSpot wordt in jullie huidige systemen genoemd."},
 {test:/salesforce/i,option:"Salesforce: bestaande AI- en automatiseringsfuncties onderzoeken",why:"Salesforce wordt in jullie huidige systemen genoemd."},
 {test:/microsoft|office 365|m365|power bi|excel|teams\b/i,option:"Microsoft 365/Power BI: bestaande AI- en rapportagefuncties onderzoeken",why:"Microsoft-software wordt in jullie huidige werkwijze genoemd."},
 {test:/google workspace|google sheets|gmail|gemini/i,option:"Google Workspace: bestaande AI- en automatiseringsfuncties onderzoeken",why:"Google Workspace wordt in jullie bestaande werkwijze genoemd."},
 {test:/mailchimp/i,option:"Mailchimp: bestaande automatisering en eventuele AI-functies onderzoeken",why:"Mailchimp wordt in jullie bestaande werkwijze genoemd."},
 {test:/look(er)? studio|ga4|google ads/i,option:"Bestaande Google-rapportagetools met een afzonderlijke AI-samenvattingsstap onderzoeken",why:"Marketingdata of Google-rapportagetools worden genoemd; controleer eerst een dashboard zonder AI."},
 {test:/wordpress/i,option:"WordPress: bestaande contentworkflow en eventuele AI-extensies onderzoeken",why:"WordPress is onderdeel van het huidige proces."}
];
function infer(d){
 d=d||{};
 const full=[d.problem,d.goal,d.experience,d.resources,d.candidateTask,d.tasks&&d.tasks.join(" ")].map(norm).filter(Boolean).join(" ");
 let choice=groups.find(g=>g.id!=="generic"&&g.terms.test(full))||groups[groups.length-1];
 const stackCandidates=stack.filter(z=>z.test.test([d.resources,d.experience].map(norm).join(" ")));
 const problem=norm(d.problem),goal=norm(d.goal);
 const basis=[problem&&"Marketingprobleem: "+problem,goal&&"Gewenst resultaat: "+goal,norm(d.candidateTask)&&"Gekozen taak: "+d.candidateTask].filter(Boolean);
 return {kind:choice.id,task:choice.task,nonai:choice.nonai,value:choice.value,toolType:choice.kind,
  candidates:stackCandidates.length?stackCandidates.slice(0,2).map(x=>({name:x.option,why:x.why})):
   choice.brands.map(x=>({name:x,why:"Past als oplossingscategorie bij het herkende proces. Nog niet getoetst bij dit bedrijf."})),
  question:choice.question,risk:choice.risk,basis,
  confidence:choice.id==="generic"?"laag":"voorlopig",
  caveat:choice.id==="generic"?"De probleemomschrijving herkent nog geen specifiek proces; maak de taak concreet.":"De koppeling aan dit proces is gebaseerd op tekstherkenning, niet op een geslaagde tooltest."};
}
function stage(d,i,analysis){
 d=d||{};const x=infer(d);const a=analysis||{};
 const task=norm(d.candidateTask)||x.task;
 if(i===0)return {
  headline:"Van bedrijfsprobleem naar een eerste marketingtaak",
  summary:x.basis.length?"Op basis van jullie probleemomschrijving stellen we een concrete taak voor om in fase 2 te onderzoeken.":"Vul eerst het marketingprobleem en verbeterdoel in. Dan volgt hier een gerichte suggestie.",
  reasoning:x.basis,
  recommendations:x.basis.length?[
   {title:"Te onderzoeken marketingtaak",value:x.task,detail:"Voorstel op basis van de omschreven situatie. Pas aan als dit niet precies jullie werkproces is.",action:{kind:"add-task",value:x.task}},
   {title:"Eerste controle zonder AI",value:x.nonai,detail:"Leg dit alternatief naast AI voordat je een oplossing kiest.",action:{kind:"set-alternative",value:x.nonai}}
  ]:[],next:"Fase 2: kies of verfijn de marketingtaak en vergelijk AI met een eenvoudiger alternatief.",limitations:x.caveat
 };
 if(i===1)return {
  headline:"Van taakselectie naar gerichte risicoanalyse",
  summary:task?"Voor '"+task+"' zijn de volgende risico's en ontbrekende feiten extra relevant. De zeven formele controlepunten blijven verplicht om apart te onderzoeken.":"Selecteer eerst een taak. Dan past het model de vervolgvraag aan.",
  reasoning:[task&&"Taak: "+task,norm(d.nonAiAlternative)&&"Alternatief zonder AI: "+d.nonAiAlternative,norm(d.aiNecessityReason)&&"Overweging: "+d.aiNecessityReason].filter(Boolean),
  recommendations:task?[
   {title:"Belangrijkste onderzoeksvraag",value:x.question,detail:"Onderzoek en onderbouw dit met de betrokken medewerker of bestaande systemen."},
   {title:"Risico's die hierbij extra aandacht verdienen",value:x.risk,detail:"Een aandachtsgebied is geen juridische risicobeoordeling."}
  ]:[],next:"Fase 3: maak onbekende, beoordeelde en geblokkeerde randvoorwaarden expliciet.",limitations:"Risico's zijn aandachtspunten. Een positieve score geeft nooit automatisch toestemming om bedrijfs- of persoonsgegevens te gebruiken."
 };
 if(i===2){
  const blocked=(a.blocked||[]).length,open=(a.unverified||[]).length;
  const summary=blocked?"Er zijn "+blocked+" expliciete blokkades. Fase 4 mag nu hooguit een onderzoeksplan opleveren, geen vrijgave voor een praktijkpilot.":
   open?"Er zijn "+open+" controles zonder verifieerbaar bewijs. Je kunt geschikte oplossingen verkennen, maar niet veilig vrijgeven.":
   "De controles zijn vastgelegd. Beoordeel in fase 4 alsnog de specifieke leverancier en de echte werkomgeving.";
  return {headline:"Van risicoanalyse naar oplossingskeuze",summary,
   reasoning:[task&&"Geselecteerde taak: "+task,blocked&&blocked+" blokkade(s)",open&&open+" ontbrekende beoordelingen"].filter(Boolean).map(String),
   recommendations:[{title:"Voorkom overhaaste toolkeuze",value:x.question,detail:"Onderzoek eerst het alternatief zonder AI."},
    {title:"Risicofocus voor de toolvergelijking",value:x.risk,detail:"Verifieer dit vóór gebruik van echte bedrijfsgegevens."}],
   next:"Fase 4: vergelijk eerst passende oplossingscategorieën en maak vervolgens een afgebakend testplan.",
   limitations:"Een vinkje of ingevulde toelichting is geen onafhankelijk bewijs van naleving."
  };
 }
 if(i===3){
  const noai=norm(d.aiNecessity)==="zonder_ai";
  const blocked=(a.blocked||[]).length,open=(a.unverified||[]).length;
  const options=noai?[{title:"Eerste oplossingsrichting",value:norm(d.nonAiAlternative)||x.nonai,detail:"De vorige fase kiest voorlopig voor een aanpak zonder AI. Onderzoek kosten en kwaliteit."}]:
   [{title:"Meest logische AI-categorie om eerst te onderzoeken",value:x.toolType,detail:"Afgeleid uit het gekozen proces. Dit is geen bewezen leveranciersadvies."},
    ...x.candidates.map(v=>({title:"Mogelijke toolrichting",value:v.name,detail:v.why+" Controleer functionaliteit, kosten, privacy en geschiktheid.",action:{kind:"candidate-tool",value:v.name}}))];
  return {
   headline:noai?"De vorige fases wijzen eerst naar een oplossing zonder AI":"Deze AI-oplossingen passen mogelijk bij jullie proces",
   summary:blocked?"Er is een expliciete blokkade. Gebruik deze opties alleen voor deskresearch, niet voor een live pilot.":
     open?"Dit zijn onderzoeksopties, geen definitieve keuze: risico's en/of leveranciersvoorwaarden zijn nog niet volledig onderbouwd.":
     "De genoemde oplossingen zijn hypotheses. Laat twee alternatieven dezelfde praktijkopdracht uitvoeren voordat je kiest.",
   reasoning:[task&&"Marketingtaak: "+task,norm(d.nonAiAlternative)&&"Alternatief zonder AI: "+d.nonAiAlternative,norm(d.resources)&&"Beschikbare systemen: "+d.resources,norm(d.aiNecessityReason)&&"Motivatie: "+d.aiNecessityReason].filter(Boolean),
   recommendations:options,
   next:noai?"Test de eenvoudige oplossing met dezelfde KPI's als een AI-pilot.":"Selecteer hoogstens een kandidaat voor onderzoek, toets twee mogelijkheden en leg kosten, testresultaten en menselijke controle vast.",
   limitations:x.caveat+" Namen van software zijn voorbeelden om te onderzoeken; prijzen, functionaliteit en geschiktheid zijn niet geverifieerd."
  };
 }
 return {
   headline:"Van pilotplan naar een toetsbaar vervolgadvies",
   summary:a.kpi&&a.kpi.measured?"De nul- en effectmeting zijn ingevoerd. Controleer de kwaliteit, het aantal metingen en of de gekozen beslissing logisch volgt.":"De vorige fase heeft een taak en een pilothypothese opgeleverd. Leg nu eerst de nulmeting vast, vóórdat je resultaten claimt.",
   reasoning:[norm(d.pilotTask)&&"Pilottaak: "+d.pilotTask,norm(d.pilotSuccess)&&"Succescriterium: "+d.pilotSuccess,norm(d.goal)&&"Bedrijfsdoel: "+d.goal].filter(Boolean),
   recommendations:[
    {title:"Voorstel voor te meten KPI",value:(x.kind==="reporting"||/tijd|uur|minuten|snel/i.test(norm(d.goal)))?"Netto tijd per gecontroleerde taakuitvoering (minuten)":"Eén meetbare KPI gekoppeld aan het oorspronkelijke commerciële probleem",detail:"Bepaal meeteenheid en richting vooraf. Vul geen meetresultaten automatisch in.",action:{kind:"suggest-kpi",value:(x.kind==="reporting"||/tijd|uur|minuten|snel/i.test(norm(d.goal)))?"Netto tijd per gecontroleerde taakuitvoering (minuten)":"Resultaat per taakuitvoering"}},
    {title:"Controleer de kwaliteit",value:"Meet ook foutcorrecties en de outputkwaliteit.",detail:"Een dalende tijdsbesteding is niet voldoende als de uitkomsten slechter zijn."}
   ],next:"Na fase 5: bekijk het bedrijfsspecifieke beslisadvies en de nog ontbrekende onderbouwing.",
   limitations:"Een voor-/nameting bewijst niet zelfstandig dat de toepassing het effect heeft veroorzaakt."
 };
}
root.GroeikompasGuidance={infer,stage,escape:esc};
})(typeof window!=="undefined"?window:globalThis);