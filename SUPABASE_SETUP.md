# AI-Groeikompas — e-mailaccounts en registratiemeldingen (gratis preview)

## Ingericht
- Supabase Free in EU Frankfurt: project `lluklxiwsrpvqzfxlakq`.
- Een eigen PostgreSQL-dossier per account, afgedwongen via Row Level Security.
- E-mailregistratie met wachtwoord (minimaal 8 tekens), inloggen, bevestiging per e-mail, uitloggen, en wachtwoordherstel.
- Database-trigger die **uitsluitend na e-mailbevestiging** een nieuwe registratie toevoegt aan `private.groeikompas_registration_alerts`. Deze gegevens zijn niet via de publieke API opvraagbaar.
- ChatGPT-taak `Nieuwe AI-Groeikompas-accounts`: controleert ieder uur de privé-wachtrij en meldt nieuwe accounts in ChatGPT. Dat is geen realtime e-mailmelding. Een taak moet actief blijven en toegang hebben tot Supabase.
- Nieuwe Vercel Preview: `preview/supabase-google-auth-v1`. De productieversie is bewust niet gewijzigd.

## Nog vereist om registratie van willekeurige e-mailadressen mogelijk te maken

Supabase biedt standaard een beperkte SMTP-testdienst die **alleen naar geautoriseerde team-e-mailadressen** kan verzenden. Daarom werkt e-mailbevestiging voor willekeurige respondenten nog NIET. Laat e-mailbevestiging aan staan; schakel dit niet uit als omweg.

### A. Gratis Brevo SMTP activeren (account en afzenderbevestiging zijn vereist)
1. Maak zelf een **Brevo Free**-account aan op https://www.brevo.com/ en bevestig het account. Kies uitsluitend Free; geen betaalmethode of upgrade nodig voor ons voorstel. Gratis limiet volgens Brevo: 300 e-mailverzendingen per dag. Verzendlimieten en beschikbaarheid kunnen later veranderen.
2. Verifieer een verzenddomein dat je daadwerkelijk beheert via de vereiste DKIM/DMARC-records (en eventueel SPF) en stel een afzender in, bijvoorbeeld `no-reply@jouwdomein.nl`. Als je nog geen eigen domein hebt, bespreek dan eerst welke bestaande afzender je mag gebruiken. Brevo vereist soms extra activering van transactionele e-mail. De applicatie mag dit nooit als ingesteld behandelen voordat een echte mail aankomt.
3. In Brevo → **Settings → SMTP & API → SMTP**: maak een **SMTP key** aan en gebruik de exacte daar getoonde SMTP-login. Dit is niet dezelfde sleutel als de Brevo API-key en niet jouw normale accountwachtwoord.
4. Open in Supabase [Authentication / Emails / SMTP settings](https://supabase.com/dashboard/project/lluklxiwsrpvqzfxlakq/auth/settings) en activeer **Custom SMTP**. Vul in:
   - Sender email: je door Brevo geverifieerde afzender
   - Sender name: `AI-Groeikompas`
   - Host: `smtp-relay.brevo.com`
   - Port: `587` (STARTTLS) of `465` (SSL/TLS)
   - Username: de **SMTP Login** zoals Brevo die toont
   - Password: jouw **SMTP key** rechtstreeks in Supabase
   - Minimum interval / rate limit: behoud een conservatieve limiet voor het gratis pakket
5. Sla op. **Nooit je SMTP key in GitHub, front-end-config of ChatGPT plakken.**

### B. Redirects exact configureren
1. Open [Supabase URL Configuration](https://supabase.com/dashboard/project/lluklxiwsrpvqzfxlakq/auth/url-configuration).
2. Zet Site URL op: `https://groeikompas-git-preview-supabase-g-fb0158-ianvdbrink3s-projects.vercel.app`
3. Voeg onder Additional Redirect URLs exact dezelfde HTTPS-URL toe (met en zonder afsluitende slash indien nodig). Vermijd globaal toegestane `**`-domeinen.
4. Controleer in [Authentication → Providers → Email](https://supabase.com/dashboard/project/lluklxiwsrpvqzfxlakq/auth/providers) dat e-mailregistratie en **Confirm Email** aan staan. Schakel bevestiging niet uit als omweg.

### C. Regressietest vóór gebruik
Gebruik uitsluitend een eigen, bereikbare testmailbox. Test eerst registratie → ontvangen bevestigingslink → terugkeer op de preview → inloggen → gegevens opslaan en opnieuw ophalen. Test vervolgens `Wachtwoord vergeten` en controleer de accountisolatie met een tweede geverifieerd account.

**Status:** deze stappen zijn nog niet als uitgevoerd geverifieerd. De beschikbare Supabase-integratie kan SQL en RLS beheren, maar biedt geen beheeractie voor Auth-redirects of SMTP-credentials. Een externe Brevo-registratie en verificatie kunnen niet zonder accounttoestemming en een werkende browserverbinding worden afgerond. Het gepubliceerde G-versie blijft onaangetast.

## Acceptatietest voor live gebruik
1. Maak met een test-e-mailadres een nieuw account aan. Ontvang de bevestigingslink en activeer het account.
2. Log in, voer gegevens in een dossier in, wacht tot synchronisatie gereed is en controleer dat gegevens na herladen blijven bestaan.
3. Probeer met een tweede geverifieerd account toegang tot het eerste dossier te krijgen, zowel in de UI als via een handgemaakte API-aanroep. Die toegang moet worden geweigerd. Test ook anonieme requests.
4. Controleer of er één nieuw record in `private.groeikompas_registration_alerts` staat. Wacht op de eerstvolgende ChatGPT-controle en controleer of de melding wordt afgeleverd en het record daarna een `alerted_at` krijgt.
5. Test wachtwoordherstel en grote/ongeldige importbestanden.
6. Verifieer met de opleiding en opdrachtgever of onderzoek met echte bedrijfsinformatie hier mag worden opgeslagen.

## Tests lokaal
```bash
node tests/cloud-auth.test.cjs
node tests/adaptive-flow.test.cjs
node tests/report-engine.test.cjs
node tests/guidance-engine.test.cjs
```

## Beperkingen en veiligheid
- De gratis Supabase database is aangemaakt en beveiliging gecontroleerd, maar zonder Custom SMTP en URL-configuratie is een **openbare registratie niet klaar voor gebruik**.
- Alleen een succesvolle **echte** tweepersoonstest bewijst dat accountisolatie in productie werkt. Lokale mocks zijn geen RLS-integratietest.
- De meldingen komen via ChatGPT maximaal ongeveer eenmaal per uur; niet als directe e-mail. Wijzigingen aan het persoonlijke ChatGPT-account of gekoppelde Supabase kunnen de taak beïnvloeden.
- Dit prototype ondersteunt geen gedeelde organisatie-accounts, realtime samenwerken of gegarandeerde synchronisatie bij abrupt sluiten.
- Gebruikers ontvangen geen automatische goedkeuring voor AI-verwerking of vertrouwelijke informatie.

Documentatie: https://supabase.com/docs/guides/auth/passwords en https://supabase.com/docs/guides/auth/auth-smtp
