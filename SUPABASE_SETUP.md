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

1. Kies een SMTP-aanbieder met een geschikt gratis abonnement (bijvoorbeeld Brevo of Resend, afhankelijk van actuele gratis limieten en domeinvoorwaarden).
2. Verifieer daar een verzenddomein dat je beheert. Richt de vereiste SPF/DKIM/D(M)ARC-records in.
3. Ga naar `https://supabase.com/dashboard/project/lluklxiwsrpvqzfxlakq/settings/auth` en stel Custom SMTP in (host, poort, verzendadres, gebruikersnaam en wachtwoord). Bewaar de SMTP-credentials alleen in Supabase, nooit in GitHub, de browsercode of deze chat.
4. Ga naar `https://supabase.com/dashboard/project/lluklxiwsrpvqzfxlakq/auth/url-configuration`. Stel **Site URL** en de toegestane Redirect URL exact in op: `https://groeikompas-git-preview-supabase-g-fb0158-ianvdbrink3s-projects.vercel.app`.
5. Controleer onder Authentication → Providers → Email dat e-mailregistratie en bevestiging ingeschakeld zijn. Verifieer dat het aantal registratiebevestigingen past binnen het SMTP-free-abonnement.

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
