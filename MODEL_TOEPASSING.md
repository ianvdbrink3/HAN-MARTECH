# AI-GROEIKOMPAS · Onderzoeksstudio v3

**Leidend document:** AI - Groeikompas-2.docx (GHUB-M7, concept van 30 november 2026), met name paragrafen 1.4 en 1.7–1.10. De vijf fasen zijn intact gebleven.

> **Onderzoeksstatus:** startgewichten, scoreankers en normgrenzen zijn projectgroepvoorstellen die nog gevalideerd moeten worden. De software geeft geen automatische juridische of financiële goedkeuring.

## Van document naar dashboard

| Document | Onderdeel | Digitale uitvoering |
|---|---|---|
| p. 10–11 | TOE, AI-gereedheid, zeven analysevelden, routekeuze, minstens drie knelpunten, meetbaar doel en commerciële koppeling | Fase 1 met contextvragen, lichte/volledige route, medewerkersrespons, knelpunten, eigenaar en doel |
| p. 12–14 | SIPOC, taken, nutvraag, zeven geschiktheidscriteria, risico als drempel, zes prioriteitscriteria, AHP, eerste-toepassingstoets | Fase 2 met SIPOC, onafhankelijke tweede beoordelaar, harde geschiktheidsgrens, correcte score 0–100 en AHP |
| p. 15–17 | Risico laag/middel/hoog, cumulatieve maatregelen, data, merkcontext, gebruiksafspraak, eigenaar, go/no-go | Fase 3 met drie risico-ingangsvragen, controlepunten per niveau, bewijs, eigenaar en expliciet besluit |
| p. 18–22 | Task-Technology Fit, vier toolrichtingen, acht criteria, harde vendorvoorwaarden, blinde test, medewerkers, vijf nulmetingen, twee PDSA-rondes | Fase 4 met functiekeuze, toolmatrix, opdrachten met blind beoordeelde kwaliteit, tijdmetingen, training en verbetercycli |
| p. 22–25 | Proces-, organisatie- en klant-KPI's, vijf kwaliteitscriteria, netto tijdwinst, ROI met bewijs, bewijsniveaus 1–4, vervolg en groeironde | Fase 5 met berekeningen op echte ingevoerde metingen, kwaliteit laatste cyclus, kosten en verifieerbare baten, bewijsniveau en volgende taak |
| p. 25–26 | Hulpmiddelen en toetsing | Digitaal adviesrapport, demonstratiecasus, geïsoleerde dossiers en kwalitatieve vergelijking |

## Beslisregels

**Prioriteit 0–100:** Som van ((score − 1) / 4 × gewicht in procentpunten), over zes criteria. Startweging: 25/20/15/15/15/10. Score overal 1 betekent 0/100; overal 3 is 50/100; overal 5 is 100/100. In de volledige route: 15 paarsgewijze vergelijkingen volgens AHP, met consistentiecontrole maximaal 0,10.

**Geschiktheid:** Een taak met een 1 of 2 op één van de zeven geschiktheidscriteria is nog niet geschikt. Een taak heeft bovendien een positieve nutvraag, vijf positieve eerste-toepassingstoetsen en een verantwoord risiconiveau nodig. Hoog risico mag nooit door een hoge prioriteitsscore worden gecompenseerd; bij de lichte route past als eerste toepassing alleen laag risico.

**Selectietest:** Minimaal twee te vergelijken opties met dezelfde drie tot vijf opdrachten. Acht criteria, geen enkele lager dan 3/5. Praktijktest met vijf kwaliteitselementen, gemiddeld 3,5 of meer en geen element onder 3. Als de kwaliteit duidelijk verschilt (0,5 of meer) wint de hoogste kwaliteit; bij kleiner verschil de kortste volledige tijd; daarna eenvoud en kosten. Risicovolle gegevens vereisen gecontroleerde leveranciersvoorwaarden.

**PDSA:** Voor de eerste pilot minimaal vijf nulmetingen; vervolgens minimaal twee gedocumenteerde verbetercycli. De uiteindelijke meting gebruikt de **laatste** cyclus.

**Netto tijdwinst:** (tijd vóór − tijd ná) × aantal uitvoeringen, omgerekend naar uren, minus inrichting en leren. Vrijgekomen uren zijn niet automatisch financiële besparing. ROI verschijnt alleen met onderbouwde kosten én geverifieerde financiële baten.

**Bewijsniveau:** Ervaring (1), voor/na (2), controlegroep (3), experiment/A/B-test (4). Een opgegeven bewijsniveau wordt begrensd door de daadwerkelijk vastgelegde onderzoeksopzet.

## Handleiding voor bedrijven

1. Kies een afzonderlijk bedrijfsdossier of maak een nieuw bedrijf aan.
2. Doorloop de **vijf** fasen. Iedere stap genereert of verwerkt informatie voor de volgende, zonder ontbrekende metingen te verzinnen.
3. Vul waar mogelijk bron, verantwoordelijke en datum in. Onbekend is niet hetzelfde als goedgekeurd.
4. Bekijk het adviesrapport met conclusies, open acties en aannames. Druk het af als PDF of bewaar als HTML.
5. Exporteer de JSON-back-up vóór browsergegevens worden gewist of gegevens naar een andere computer moeten worden verplaatst.

De Demo-knop creëert een **fictief** bedrijfsdossier. Deze resultaten zijn geen echt fieldresearchbewijs. Het tabblad Bedrijven vergelijken is een aanvullende kwalitatieve onderzoeksweergave, geen zesde modelstap.

## Gegevensbescherming en beperkingen

- Statische webapp zonder externe AI-API, tracking of externe lettertype-aanvragen.
- Dossiers staan **lokaal in de browser** (localStorage), niet in een beveiligde gedeelde database.
- De vorige opslag wordt niet gewist. Een gedeeltelijke, veilige migratie is mogelijk; oude afgevinkte risico's worden niet automatisch als juridisch geverifieerd overgenomen.
- Gebruik pseudoniemen en geen klant- of medewerkersgegevens zolang de omgeving niet op vertrouwelijke gegevens is ingericht.
- Wettelijke verplichtingen, toolfuncties en prijzen moeten afzonderlijk worden gecontroleerd.
- Alle startnormen en de daadwerkelijke toepasbaarheid moeten nog bij MKB-bedrijven worden getoetst.

## Tests en deployment

Tests vanuit de projectroot:
- node tests/v3-engine.test.cjs
- node tests/v3-browser.test.cjs (jsdom DOM-simulatie; visuele echte browsertest blijft nodig)

Ontwikkelbranch: preview/modelgetrouw-v3. Er is geen impliciete toestemming om deze nieuwe herbouw zonder extra verificatie naar productie te publiceren.
