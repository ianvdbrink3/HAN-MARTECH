# AI-GROEIKOMPAS v3 — Onderzoekswerkruimte

**Methodische bron:** AI - Groeikompas-2.docx, GHUB-M7, concept 30 november 2026.

Dit is een digitale uitvoering van de vijf fasen uit het schriftelijke model. De vijf fasen zijn ongewijzigd: Bedrijfsanalyse en marketingvraagstuk; Procesanalyse en prioritering; Randvoorwaarden en risicobeoordeling; AI-selectie en implementatie; Meten, evalueren en groeien.

## Wat de software doet

**Fase 1:** TOE/AI-gereedheid, lichte of volledige route, drie marketingknelpunten, eigenaar, meetbaar doel en commerciële bestemming van vrijgekomen tijd.

**Fase 2:** SIPOC, losse marketingtaken, nutvraag (AI wel/niet nodig), zeven geschiktheidscriteria en harde grens van 3, risicodrempel, zes prioriteitscriteria, startweging of consistente AHP-matrix en vijf eerste-toepassingstoetsvragen.

**Fase 3:** Classificatie laag, middel of hoog via drie risico-indicatoren; niveaugebonden checklist met bewijs; afspraken, menselijke controle en go/no-go.

**Fase 4:** Task-Technology Fit, vier AI-richtingen plus geen-AI-alternatief, acht toolcriteria, harde leveranciereisen, drie tot vijf identieke blinde testopdrachten bij twee of drie alternatieven, vijf nulmetingen, vier medewerkeracceptatievragen en twee PDSA-cycli.

**Fase 5:** Kwaliteitsbeoordeling met vijf ankerschalen, totale taakduur, netto tijdwinst, terugverdienpunt, conditionele financiële ROI, klantwaarde, bewijsniveau 1–4, besluit en de volgende taak in de groeicyclus.

Overzicht, Bedrijven vergelijken, Adviesrapport en Methodiek zijn hulpmiddelen, **geen extra fasen**.

## Correcte berekening

De voorgeschreven prioriteitsformule uit het brondocument op pagina 13 is:

**Som van (score − 1) / 4 × gewicht** (gewichten tellen op tot 100).

Alle criteria op 1 geven 0/100, op 2 geven 25/100, op 3 geven 50/100, op 4 geven 75/100 en op 5 geven 100/100.

Een taak wordt niet als geschikte eerste toepassing gerangschikt wanneer een fitcriterium onder 3 ligt, de prioriteit lager dan 60 is, een van de vijf eerste-toepassingstoetsvragen niet positief is, de taak een hoog of onbekend risico heeft of AI niet nuttiger lijkt dan een eenvoudigere oplossing.

## Gebruik bij vijf bedrijven

Maak voor ieder bedrijf een eigen dossier aan. Vul de fase-instrumenten samen met een verantwoordelijke in, bewaar de onderbouwing en gebruik de automatisch voorgestelde volgende onderzoekshandeling. Bij een no-go of stopbesluit is een negatieve uitkomst waardevol bewijs, geen reden om fictieve cijfers toe te voegen.

Microbedrijven gebruiken de lichte route en starten uitsluitend bij laag risico. De volledige route gebruikt zo nodig paarsgewijze AHP-vergelijking en een uitgebreidere medewerkersvragenlijst. Scores en normen zijn ontwerpkeuzes van de projectgroep, geen gevalideerde wetenschappelijke norm.

## Privacy en gegevensmigratie

Gegevens staan uitsluitend in de browser en niet op een gedeelde server. Maak via de Back-up-knop een JSON-export. De oudere V1-dossiers worden bij de eerste opening overgenomen; de oorspronkelijke browseropslag wordt niet overschreven. Oude scores worden niet automatisch omgezet naar de nieuwe criteria; de ruwe gegevens blijven aanwezig in het migratierecord.

Voer geen vertrouwelijke bedrijfs- of persoonsgegevens in zonder passende afspraken. De software biedt geen wettelijke conformiteitsgarantie en maakt geen externe AI-API-aanroepen.

## Testen

Voer vanuit de projectroot uit:

- node v3/model.test.cjs
- node v3/ui.test.cjs

Zie v3/METHODOLOGIE.md voor de koppeling tussen brondocument, instrumenten en beslisregels.

De software is een onderzoeksprototype. Toets de begrijpelijkheid, navolgbaarheid, voorlopige drempels, selectieprocedures en commerciële toepasbaarheid met echte MKB-respondenten en deskundigen.
