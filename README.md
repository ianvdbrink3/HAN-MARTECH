# AI-GROEIKOMPAS — onderzoeksstudio

**Van marketingvraagstuk naar een verantwoorde, geteste en gemeten AI-toepassing voor het MKB.**

Deze repository bevat de digitale uitvoering van het groepsmodel van **GHUB-M7 (HAN, Commerciële Economie, Martech & Innovatie)**. De leidraad is **AI - Groeikompas-2.docx**, de conceptversie met datum **30 november 2026**.

## De vijf fasen

1. **Bedrijfsanalyse en marketingvraagstuk** — TOE-raamwerk, AI-gereedheid, lichte/volledige route, drie problemen, meetbaar doel en commerciële koppeling.
2. **Procesanalyse en prioritering** — SIPOC, AI-nutvraag, zeven geschiktheidscriteria met harde grens 3, zes criteria en correcte prioriteitsscore 0–100, AHP, eerste-toepassingstoets.
3. **Randvoorwaarden en risicobeoordeling** — klassering laag/middel/hoog, proportionele maatregelen, documentatie, gebruiksafspraak, eigenaar en expliciet go/no-go-besluit.
4. **AI-selectie en implementatie** — Task-Technology Fit, de eenvoudigste oplossingsrichting, acht selectiecriteria, vergelijkbare blinde opdrachten, medewerkeracceptatie, vijf nulmetingen en twee PDSA-cycli.
5. **Meten, evalueren en groeien** — kwaliteit, volledige taakduur, netto tijd, kosten en ROI indien bewezen, bewijsniveau 1–4, besluit en volgende taak.

**Deze vijf modelstappen zijn bewust behouden.** De extra weergaven Adviesrapport, Bedrijven vergelijken en Methodiek zijn hulpmiddelen, geen zesde of zevende fase.

## Starten

De app is statisch en heeft geen externe API-sleutel nodig. Open index.html vanuit een lokale webserver:

    python3 -m http.server 8000

Open vervolgens localhost:8000 in je browser.

Klik op **+ Bedrijf** voor een zelfstandig dossier of gebruik **Demo** voor een fictieve casus. Dossiers blijven lokaal in deze browser opgeslagen. Gebruik **Export** en **Import** voor back-ups en uitwisseling. Het adviesrapport kan als HTML worden gedownload en via de browser als PDF worden afgedrukt.

## Beperkingen

- Dit is een **onderzoeksprototype**, niet een wetenschappelijk gevalideerd beslisinstrument.
- De startwegingen, grenswaarden, scoreankers en tijdsindicaties komen uit keuzes van de projectgroep en moeten worden getoetst bij MKB-bedrijven en deskundigen.
- De ingebrachte softwarevoorbeelden zijn **te onderzoeken categorieën**, geen automatisch geverifieerde leverancierstips.
- Juridische controles vormen geen automatische juridische vrijgave. Werk met een bevoegde beoordelaar en volg de actuele regels.
- De app berekent geen ROI zonder verifieerbare financiële baten en kosten.
- Gegevens staan in browser-localStorage, **niet in een beveiligde gezamenlijke database**. Gebruik geen gevoelige gegevens of persoonsgegevens bij onzekere opslag.
- Er worden geen externe AI-diensten, analytics of externe lettertypen ingeladen.

## Documentatie

**MODEL_TOEPASSING.md** bevat de koppeling van elk hulpmiddel met de pagina's uit het brondocument, de formules en de meet- en veiligheidsvoorwaarden.

## Testen

    npm ci
    npm test

De test-suite gebruikt jsdom voor DOM- en interactiesimulatie; jsdom wordt als ontwikkelafhankelijkheid geïnstalleerd. Voor het openen van de app zelf is geen npm-installatie nodig. Een zelfstandige visuele test in Chrome/Safari op echte telefoon en laptop blijft nodig.

## Deployment

Deze ingrijpende herbouw staat eerst op **preview/modelgetrouw-v3**, los van de huidige productieversie. Publiceer pas naar main/production na review en expliciete keuze.
