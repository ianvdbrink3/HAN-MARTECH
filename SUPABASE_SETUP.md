# AI-Groeikompas · Supabase + Google-login (preview)

Deze implementatie blijft op branch `preview/supabase-google-auth-v1` totdat een echte Supabase-omgeving en beveiligingstest klaar zijn. Vercel Production wordt **niet** aangepast.

## Wat is gebouwd
- Verplichte Google-login via Supabase Auth met PKCE.
- Eén eigen verzameling dossiers per geauthenticeerde gebruiker.
- PostgreSQL-tabel met RLS op `owner_id = auth.uid()` voor SELECT/INSERT/UPDATE/DELETE.
- Automatisch opslaan met wachtrij, statusmelding, handmatige retry en expliciete foutmeldingen.
- Toevoegen, hernoemen, verwijderen, JSON-export en **toevoegen** van geïmporteerde JSON-dossiers.
- Optionele migratie van oude browserdossiers **alleen na bevestiging van de ingelogde gebruiker**.
- Behoud van alle vijf adviesmodelfasen en het rapport.
- Basis-Vercel-beveiligingsheaders.

## Inrichten van Supabase (eenmalig)

1. Maak een Supabase-project aan in bij voorkeur een EU-regio. Beoordeel samen met de HAN/opdrachtgever of opslag bij deze leverancier voor de beoogde bedrijfsinformatie is toegestaan.
2. Open **Supabase SQL Editor** en voer `supabase/schema.sql` uit. Controleer vervolgens in **Table Editor** dat de tabel `groeikompas_dossiers` bestaat en dat **RLS enabled** zichtbaar is.
3. Ga naar **Supabase Authentication → Providers → Google** en activeer Google. Maak in **Google Cloud Console → Google Auth Platform** een OAuth Web Client ID + Client Secret aan.
4. Voeg bij Google Cloud als **Authorized redirect URI** toe: `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`. Controleer de exacte callback-URL op de Supabase Google-providerpagina; bij custom domains kan deze afwijken.
5. Vul in Supabase de Google Client ID en **Client Secret** in. Het secret blijft uitsluitend in Supabase/Google Cloud. Zet andere inlogmethoden uit als Google de enige toegestane methode moet zijn. Bepaal of nieuwe gebruikers zich zelfstandig mogen registreren.
6. In **Supabase Authentication → URL Configuration**: stel de Site URL in op de bedoelde Vercel-domeinnaam; voeg de **exacte preview-URL** toe aan de toegestane Redirect URLs. Voeg later de definitieve productiedomeinnaam toe bij gecontroleerde uitrol. Sta geen onbeperkte redirect-domeinen toe.
7. Ga naar **Supabase → Project Settings / Connect / API Keys** en kopieer alléén de publieke **Project URL** en de **publishable key** (of legacy anon key) naar `assets/supabase-config.js`. De sleutel in deze statische frontend is zichtbaar en **moet daarom publiek mogen zijn**. Gebruik **NOOIT** een secret, service_role key, databasewachtwoord of Google Client Secret in de browser of GitHub.
8. Commit deze twee **publieke** instellingen in deze previewbranch. De automatische Vercel-preview bouwt daarna opnieuw. Controleer dat je geen credentials in overige bestanden hebt geplaatst.

## Testen vóór een release

1. Open de preview zonder sessie: je mag geen bedrijfsdossiers zien. Controleer dat Google-login werkt en dat je terugkeert naar de juiste preview-URL.
2. Log in met **Google Account A**. Maak twee testdossiers aan, vul stappen in en wacht tot bovenin 'Opgeslagen in beveiligde database' staat. Herlaad de pagina en open de app op een tweede apparaat.
3. Log uit en log in met **Google Account B**: A's dossiers mogen niet zichtbaar zijn. Verifieer in een echte database/API-test dat B ook met een zelfgemaakt verzoek A's rijen niet kan lezen, wijzigen of verwijderen. Alleen een verborgen knop is geen beveiliging.
4. Test verwijderen, opnieuw opslaan na netwerkfout, meerdere snel opeenvolgende wijzigingen en grote JSON-import. Controleer dat import nooit bestaande dossiers stilzwijgend overschrijft.
5. Controleer RLS-policies en grants via `pg_policies` en voer negatieve/positieve toegangstests uit onder beide echte gebruikers, inclusief anonieme toegang. De lokale Node-tests testen **geen** echte RLS.
6. Controleer de volledige vijf-fasenroute en een PDF-/HTML-adviesrapport met uitsluitend fictieve data.
7. Bespreek AVG: verwerkingsgrondslag, verwerkersovereenkomst, bewaartermijn, inzage/verwijdering, incidentproces, dataregio en eventuele internationale doorgifte. Pas daarna echte vertrouwelijke bedrijfsgegevens verwerken.

## Bestaande browsergegevens

De oude applicatie bewaarde gegevens in `localStorage`. Een preview heeft meestal een **ander domein**, dus kan die gegevens niet rechtstreeks zien. Exporteer oude gegevens via de productieapplicatie als JSON en importeer het bestand na Google-login in de preview. Import voegt dossiers toe en verwijdert bestaande cloudgegevens niet.

Als de nieuwe versie later op hetzelfde domein als de oude versie wordt geopend, verschijnt ook de knop **Importeer oude browserdossiers**. Die voert pas na expliciete bevestiging een migratie uit, wist de lokale oude gegevens pas na succesvol opslaan en controleert dat de gebruiker bij het gewenste Google-account is ingelogd.

## Beperkingen

- Geen gezamenlijke bedrijfsteams of rollen; per gebruikersaccount zijn dossiers strikt individueel.
- Gelijktijdig bewerken op verschillende apparaten is nog geen realtime samenwerking; de laatste geslaagde opslag kan een eerdere wijziging overschrijven.
- Het automatisch opslaan heeft een korte debounce. Sluit een tabblad niet terwijl 'Wijzigingen opslaan…' wordt getoond.
- Een gekoppeld Supabase-account of de code alleen bewijst **niet** dat schema en Google-provider al op een echt project zijn geconfigureerd.
- Het adviesmodel bevat ontwerpkeuzes en automatische regels die nog praktijkvalidatie vereisen.

## Regressietests

```bash
node tests/cloud-auth.test.cjs
node tests/adaptive-flow.test.cjs
node tests/report-engine.test.cjs
node tests/guidance-engine.test.cjs
```

## Referenties
- Google OAuth: https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase JavaScript: https://supabase.com/docs/reference/javascript/installing
