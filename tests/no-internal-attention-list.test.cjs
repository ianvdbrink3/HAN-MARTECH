// Regressietest: de 17 interne ontwikkelaandachtspunten zijn niet zichtbaar in de webapp.
// De vijf onderzoeksfasen, persoonlijke dossiers en het advies blijven beschikbaar.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const html = fs.readFileSync("index.html", "utf8");

const formerIssueTitles = [
  "Scoreankers ontbreken",
  "Wegingspercentages onvoldoende onderbouwd",
  "Rekenregel prioriteitsscore expliciteren",
  "Risicocontrole na toolkeuze",
  "Nulmeting staat dubbel",
  "Hulpmiddelen nog niet uitgewerkt",
  "MKB-toepasbaarheid niet aangetoond",
  "Model onvoldoende gevalideerd",
  "Selectiecriteria tool versus proces overlappen",
  "Concrete vergelijking van AI-tools ontbreekt",
  "Medewerkersscan niet uitgewerkt",
  "Pilot- en stopcriteria onvoldoende specifiek",
  "KPI-definities en ROI-berekening ontbreken",
  "Overdracht en borging beperkt",
  "Theorie naar stappen preciezer koppelen",
  "Juridische checklist verifiëren",
  "Naamgeving en rapportopmaak inconsistent"
];
assert.equal(formerIssueTitles.length, 17);
for (const title of formerIssueTitles) assert.ok(!html.includes(title), "Ontwikkelpunt staat nog in de webapp: " + title);
for (const pattern of ["var issues=", "var issueDetails=", "function attention()", 'data-nav="issues"', "Aandachtspunten", "issueCards(", "issueslist", "data-filter=\"high\""]) {
  assert.ok(!html.includes(pattern), "Interne aandachtspuntenfunctionaliteit is nog aanwezig: " + pattern);
}
for (const pattern of ['Bedrijfsanalyse', 'Procesprioritering', 'AI-selectie & pilot', 'Meten & evalueren', 'Mijn AI-advies', 'authOtpForm', 'emailAuthForm', 'startGroeikompas']) {
  assert.ok(html.includes(pattern), "Belangrijke functionaliteit ontbreekt: " + pattern);
}
assert.match(html, /card\("Mijn dossiers"/);
assert.match(html, /data-nav="report">Bekijk mijn AI-advies/);
assert.ok(!html.includes('Bedrijven vergelijken'), 'Vergelijkingsmenu mag niet terugkomen');
assert.ok(!html.includes('function companyComparison'), 'Vergelijkingsscherm mag niet terugkomen');
assert.ok(!html.includes('current==="compare"'), 'Vergelijkingsroutering mag niet terugkomen');
console.log("PASS: alle 17 aandachtspunten uit de webapp; vijf fasen, accounts, dossiers en advies behouden");
