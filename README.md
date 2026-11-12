# AI-GROEIKOMPAS — HAN Martech

Interactief prototype van het GHUB-adviesmodel voor AI-implementatie in MKB-marketingprocessen.

## Inhoud
- Overzicht met voortgang van de vijf fasen
- Bedrijfsanalyse en probleemdefinitie
- Procesgeschiktheid en gewogen prioriteitenmatrix
- Risico- en randvoorwaardencheck
- Selectiematrix voor AI-oplossingen en pilotplan
- KPI-nulmeting, effectmeting en vervolgkeuze
- **Aandachtspunten**: 17 verbeterpunten, ieder met checklist en eigen notities

## Starten
Open `index.html` rechtstreeks in een browser. Er zijn geen dependencies, buildstappen of API-sleutels nodig.

## Vercel
Importeer deze repository bij Vercel als statische website (Framework Preset: **Other**, geen build command, root directory `/`). Indien een Vercel-project al aan deze repository is gekoppeld, kan een push naar `main` automatisch worden gedeployed volgens die projectinstellingen.

## Belangrijke beperkingen
- De scorewegingen en beslisregels zijn **voorlopige ontwerpkeuzes**, nog niet gevalideerd.
- De risicochecklist is geen juridisch advies of toestemming om persoonsgegevens te verwerken.
- De voortgang wordt lokaal per browser opgeslagen. JSON-export/import is beschikbaar; team-synchronisatie en autorisatie zijn nog niet gebouwd.
- Vul geen privacygevoelige of vertrouwelijke bedrijfsinformatie in bij een onbeheerde of gedeelde computer.
- Na het selecteren van een concrete AI-tool is aanvullende leveranciersspecifieke risicobeoordeling nodig.

## Onderzoek
Gebaseerd op het aangeleverde `Vooronderzoek GHUB M7` en het concept `AI-Groeikompas`. Voor definitieve oplevering moeten de hulpmiddelen, prioriteitswegingen en MKB-toepasbaarheid worden getest en onderbouwd.

## Mobile UX update (november 2026)
- Sidebar wordt op smalle schermen een uitschuifbaar menu met overlay en Escape-sluiting.
- Fase 2 en fase 4 gebruiken mobiele, aantikbare scores van 1–5 in plaats van horizontale scoretabellen.
- Taken en AI-oplossingen kunnen één voor één worden beoordeeld, met uitleg bij ieder criterium en een teller voor ontbrekende beoordelingen.
- Er wordt geen totaalscore getoond zolang niet alle betreffende criteria zijn ingevuld.
- De 1–5-betekenissen en de wegingen zijn nog conceptueel. Toets deze met MKB-gebruikers en deskundigen voordat de score als beoordelingsinstrument wordt gebruikt.
- HTML/JavaScript-rendertests en gesimuleerde interactietests zijn uitgevoerd; een visuele browsertest op echte telefoons staat nog open.

## Bedrijfsdossiers (november 2026)
- Gebruik **+ Nieuw bedrijf** om voor ieder MKB-bedrijf een **apart, leeg invulformulier** te starten.
- Kies een bedrijfsdossier in de selector om tussen de vijf bedrijven te wisselen. Antwoorden, marketingtaken, AI-scores, checklists en fasevoortgang zijn per bedrijf gescheiden.
- Bestaande gegevens uit de oudere dashboardversie worden bij de eerste opening automatisch behouden in een apart dossier.
- De **exportknop** maakt nu één JSON-back-up met alle bedrijfsdossiers. Import vervangt alle dossiers alleen na een extra bevestiging; het oude exportformaat kan als nieuw dossier worden toegevoegd.
- **Beperking:** dossiers zijn voorlopig opgeslagen in de browser van dit apparaat; andere groepsleden zien ze niet automatisch. Gebruik export/import voor uitwisseling, maar deel nooit vertrouwelijke of persoonsgegevens in een onveilig bestand. Voor gelijktijdig samenwerken zijn authenticatie en gedeelde opslag nodig.
- Het verwijderen van een dossier vraagt bevestiging. Maak vooraf een export als back-up.

## Adviesrapport – previewfunctionaliteit
De branch `preview/adviesrapport-v1` voegt **Mijn AI-advies** toe. De generator:
- maakt per bedrijfsdossier een controleerbaar voorlopig advies op basis van ingevulde problemen, doelen, proces- en toolscores, kwalitatieve toelichtingen en risico-checklists;
- onderscheidt een voorlopig advies van een concept-eindadvies ná KPI-effectmeting;
- toont open onderzoeksvragen en waarschuwt dat scorewegingen, juridische conformiteit en causale effecten niet zijn gevalideerd;
- ondersteunt afdrukken/opslaan als PDF via de browser, HTML-download, samenvatting kopiëren en vrijwillig een reviewprompt kopiëren voor ChatGPT;
- stuurt **geen** bedrijfsgegevens automatisch naar ChatGPT. Controleer zelf welke informatie je daar plakt.

### Gebruik tijdens het afstuderen
Maak eerst een apart dossier per MKB-bedrijf. Leg probleem en verbeterdoel vast, beoordeel taken en AI-opties met argumenten, voer beide risicocontroles uit en bepaal een meetbare pilot. Het rapport wordt telkens opnieuw samengesteld vanuit het actieve dossier. Het is geen autonoom gegenereerde of juridisch gegarandeerde aanbeveling; laat het door bedrijfscoach/onderzoeker beoordelen.

### Uitvoeren van tests
`node tests/report-engine.test.cjs`

### Deploymentveiligheid
De featurebranch is uitsluitend voor Vercel **Preview**. Gebruik nooit `vercel --prod` of promoot de deployment zonder nieuwe expliciete toestemming. Bestaande production wordt niet bijgewerkt door deze branch-deployment.
