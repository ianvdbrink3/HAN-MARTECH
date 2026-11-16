/* Adaptive assistance grounded in form answers; not autonomous vendor research. */
(function(root){"use strict";
const s=v=>typeof v==="string"?v.trim():"";
const RULES=[
 {id:"report",regex:/rapport|dashboard|analytics|ga4|cijfers|analyse|campagne.result|performance/i,task:"Marketingrapportages opstellen",function:"Cijfers samenvatten, inconsistenties signaleren en toelichten",noai:"Dashboardkoppeling of automatische rapportage in bestaande BI-software",kpi:"Netto minuten per gecontroleerde rapportage",risk:"Controleer broncijfers en toegang tot systemen",directions:["embedded","assistant","nonai"]},
 {id:"lead",regex:/lead|crm|sales|prospect|klantsegment|pipeline|verkoop|offert/i,task:"Leads kwalificeren en opvolgen",function:"Leads structureren, opvolgprioriteiten toelichten",noai:"CRM-workflows met vaste taaktoewijzing en segmentregels",kpi:"Tijd per gecontroleerde leadopvolging",risk:"Profilering, AVG, bias, marketingkanaalregels",directions:["embedded","specialist","nonai"]},
 {id:"content",regex:/content|social|blog|tekst|seo|copy|nieuwsbrief|email|e.mail|advertentie/i,task:"Marketingcontent voorbereiden",function:"Tekstconcepten en samenvattingen genereren met menselijke eindredactie",noai:"Contenttemplates, redactieplanning en CMS-workflows",kpi:"Netto minuten per goedgekeurd contentstuk",risk:"Merkfit, auteursrechten, claims en menselijke beoordeling",directions:["assistant","embedded","nonai"]},
 {id:"service",regex:/klantvragen|klantenservice|support|ticket|faq|service/i,task:"Klantvragen structureren",function:"Veelvoorkomende vragen classificeren en conceptantwoorden voorstellen",noai:"Verbeterde kennisbank en vraagroutering",kpi:"Minuten per gecontroleerd antwoord",risk:"Hallucinaties, persoonsgegevens en transparantie",directions:["embedded","specialist","nonai"]},
 {id:"general",regex:/.*/,task:"Een concrete herhaalbare marketingtaak",function:"Bepaal welke functie de gekozen taak daadwerkelijk vraagt",noai:"Het bestaande proces eenvoudiger maken en software beter benutten",kpi:"Tijd en kwaliteit per taak",risk:"Gegevenskwaliteit, mensen en privacy",directions:["embedded","assistant","nonai"]}
];
const PACKAGES=[
 [/hubspot/i,"Bestaande HubSpot-workflows en AI-functies onderzoeken"],
 [/power bi|microsoft|excel|office 365/i,"Bestaande Power BI/Microsoft 365-automatisering en AI-functies onderzoeken"],
 [/salesforce/i,"Bestaande Salesforce-workflows en AI-functies onderzoeken"],
 [/mailchimp/i,"Bestaande Mailchimp-automatisering onderzoeken"],
 [/google ads|looker|ga4|search console/i,"Google Looker Studio-/GA4-rapportagekoppeling onderzoeken"]
];
function classify(c){const p=c.process||{},chosen=p.tasks?.find(t=>t.id===p.selectedTaskId),text=[chosen?.name,c.company?.problem,c.company?.goal].map(s).join(" ");return RULES.find(x=>x.id!=="general"&&x.regex.test(text))||RULES.at(-1)}
function plan(c,phase){
 const r=classify(c),p=c.process||{},chosen=p.tasks?.find(t=>t.id===p.selectedTaskId),risk=root.GK3.riskCheck(c.risk,c.route);
 const results=[],basis=[s(c.company?.problem),s(c.company?.goal),s(chosen?.name),s(c.company?.systems)].filter(Boolean);
 if(phase===0){
  results.push({title:"Voorgestelde te onderzoeken taak",body:r.task,action:"suggest-task",value:r.task,info:"Afgeleid uit de omschreven marketingproblemen; dit is geen vastgestelde prioriteit."});
  results.push({title:"Start bij een eenvoudiger alternatief",body:r.noai,info:"Onderzoek dit vóór de keuze voor AI."});
 }else if(phase===1){
  results.push({title:"Eerste taaktoets",body:chosen?chosen.name:"Selecteer eerst een taak",info:"Rangschik pas na fit ≥3, prioriteit ≥60, risicodrempel en vijf startvragen."});
  results.push({title:"Mogelijk knelpunt",body:r.risk,info:"Onderzoek dit in fase 3 en leg bewijs vast."});
 }else if(phase===2){
  results.push({title:"Risicobesluit",body:risk.level==="unknown"?"Risicoklasse nog niet te bepalen":risk.go?"Voorlopige voorbereiding kan door naar toolselectie":"Geen onderbouwde GO",info:"De beslissing komt voort uit de risico-indicatoren en vereiste maatregelen."});
  results.push({title:"Benodigde AI-functie om te toetsen",body:r.function,info:"Vertaal de taak naar een functie voordat je producten vergelijkt."});
 }else if(phase===3){
  const tools=PACKAGES.filter(x=>x[0].test(s(c.company?.systems))).map(x=>x[1]);
  results.push({title:"AI-functie voor de geselecteerde taak",body:r.function,action:"suggest-function",value:r.function,info:"Functioneel voorstel. Geen bewijs dat een concrete tool hier goed in is."});
  results.push({title:"Voorkeursroute uit jullie bestaande systemen",body:tools[0]||"AI-functie binnen bestaande software onderzoeken",info:"De eenvoudigste geschikte oplossing heeft voorrang."});
  results.push({title:"Alternatief zonder AI",body:r.noai,info:"De nutvraag uit fase 2 blijft leidend."});
  if(risk.level==="high"||risk.blocked)results.push({title:"Let op: geen vrijgave",body:"Onderzoek eerst de blokkades en het hoge risiconiveau",info:"Dit voorkomt automatisch doorschuiven naar een echte pilot."});
 }else{
  results.push({title:"Aanbevolen hoofdmeting",body:r.kpi,info:"Meet inclusief voorbereiding, controle en correctie; geen meetresultaten invullen zonder bewijs."});
  results.push({title:"Kwaliteit blijft een tweede harde maat",body:"Juistheid, merkfit, helderheid, relevantie en authenticiteit",info:"Blind scoren volgens de vijf ankers in het document."});
 }
 return {results,basis,confidence:r.id==="general"?"laag":"voorlopig",rule:r.id};
}
root.GK3Advisor={plan,classify};
})(typeof window!=="undefined"?window:globalThis);