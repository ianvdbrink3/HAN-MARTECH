const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync("assets/report-engine.js","utf8"),sandbox);
const engine=sandbox.window.GroeikompasReport;
const base={
 business:"Fictief MKB",problem:"Rapportage kost 8 uur",goal:"Minder tijd en dezelfde kwaliteit",
 tasks:["Rapportage"],candidateTask:"Rapportage",ratings:{},ratingNotes:{},checks:{},
 aiNecessity:"ai",aiNecessityReason:"Mogelijk zinvol omdat complexe toelichting nodig is.",
 nonAiAlternative:"Een standaard dashboardkoppeling",alternativeComparison:"Koppeling geeft cijfers, AI kan toelichtingen verwerken.",
 riskStatus:{},riskEvidence:{},tools:["Tool A"],toolScores:{},toolScoreNotes:{},
 selectedTool:"Tool A na vergelijking",toolTestEvidence:"Drie controleerbare proefopdrachten en correcties bijgehouden.",
 toolCostEvidence:"Licentie plus implementatiekosten voorlopig geraamd op basis van offerte.",
 pilotTask:"Rapportage",pilotOwner:"Marketingteam",pilotDuration:"Drie weken",pilotSuccess:"Geen kritieke fouten",
 kpiName:"Minuten",kpiBefore:"90",kpiAfter:"50",kpiDirection:"lager",sampleCount:"3",
 qualityStatus:"voldoende",qualityEvidence:"Broncijfers onafhankelijk gecontroleerd",
 decision:"Doorgaan",notes:"Op basis van metingen onder voorbehoud",overrideReason:""
};
for(const k of engine.fitKeys)base.ratings["Rapportage|fit:"+k]=4;
for(const [k] of engine.weights)base.ratings["Rapportage|priority:"+k]=4;
base.ratingNotes["Rapportage|fit:Duidelijkheid"]="Herkenbare routinetaak";
for(let i=0;i<7;i++){base.riskStatus["risk"+i]="beoordeeld";base.riskEvidence["risk"+i]="Document en verantwoordelijke d.d. 2026-11-12";}
for(const k of ["vendorPrivacy","vendorSecurity"]){base.riskStatus[k]="beoordeeld";base.riskEvidence[k]="Leveranciersdocument gecontroleerd door manager";}
for(const k of engine.toolKeys){base.toolScores["0|"+k]=4;}
base.toolScoreNotes["0|Taakfit"]="Tests tonen passende integratie.";
const a=engine.analyse(base);
assert.equal(a.candidate.name,"Rapportage");
assert.equal(a.kpi.relative,-44.4);
assert.equal(a.finalReady,true);
assert.match(engine.createReport(base).html,/Herkenbare routinetaak/);
assert.match(engine.createReport(base).html,/Een standaard dashboardkoppeling/);
assert.match(engine.createReport(base).html,/geen automatisch juridisch/ig);
const worse=engine.analyse({...base,kpiAfter:"130",decision:"Doorgaan"});
assert.equal(worse.mismatch,true);
assert.equal(worse.finalReady,false);
assert.equal(worse.recommendation,"Besluit herzien");
const low=structuredClone(base);
for(const k of engine.fitKeys)low.ratings["Rapportage|fit:"+k]=1;
for(const [k] of engine.weights)low.ratings["Rapportage|priority:"+k]=1;
const lowOut=engine.analyse(low);
assert.equal(lowOut.candidate.priorityScore,20);
assert.equal(lowOut.veryLow,true);
assert.equal(lowOut.finalReady,false);
assert.equal(lowOut.recommendation,"Geen positieve AI-aanbeveling");
const noEvidence=structuredClone(base);delete noEvidence.riskEvidence.risk0;
assert.equal(engine.analyse(noEvidence).riskReady,false);
assert.equal(engine.analyse(noEvidence).finalReady,false);
const blocked=structuredClone(base);blocked.riskStatus.risk0="blokkade";
assert.equal(engine.analyse(blocked).recommendation,"Eerst risico's oplossen");
const noai=structuredClone(base);noai.aiNecessity="zonder_ai";noai.aiNecessityReason="Een koppeling is aantoonbaar goedkoper";noai.selectedTool="";noai.toolTestEvidence="";noai.toolCostEvidence="";delete noai.riskStatus.vendorPrivacy;delete noai.riskStatus.vendorSecurity;
assert.equal(engine.analyse(noai).recommendation,"Onderzoek eerst de oplossing zonder AI");
assert.equal(engine.analyse(noai).vendorMissing.length,0);
const unknown=structuredClone(base);unknown.kpiDirection="onbekend";
assert.equal(engine.analyse(unknown).finalReady,false);
const html=engine.createReport({...base,business:"A <script>alert(1)</script>"}).html;
assert.match(html,/A &lt;script&gt;/);
assert.doesNotMatch(html,/<script>alert\(1\)<\/script>/);
assert.equal(engine.analyse({}).candidate,null);
console.log("PASS 13 evidence-first advice checks: no-AI, bad outcomes, hard stops, sources, escaping, five-phase input.");
