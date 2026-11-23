/* AI-Groeikompas · Supabase Auth en persoonlijke dossiers.
   De toegang wordt op DB-niveau afgedwongen via RLS, niet door de zichtbaarheid van dit scherm. */
(function (global) {
  "use strict";

  var client = null;
  var currentUser = null;
  var pending = new Map();
  var removed = new Set();
  var timer = null;
  var writeQueue = Promise.resolve();
  var saveError = null;
  var isStarted = false;
  var table = "groeikompas_dossiers";

  function node(id) { return document.getElementById(id); }
  function setStatus(value, isError) {
    var el = node("cloudStatus");
    if (el) {
      el.textContent = value;
      el.dataset.state = isError ? "error" : "ok";
      el.title = isError ? "Controleer je verbinding. Laat dit tabblad open en probeer opnieuw." : "";
    }
  }
  function showGate(title, detail, signIn) {
    node("authTitle").textContent = title;
    node("authMessage").textContent = detail;
    node("emailAuthForm").hidden = !signIn;
    node("authGate").hidden = false;
    node("appShell").hidden = true;
  }
  function configuration() {
    var c = global.GROEIKOMPAS_SUPABASE || {};
    var key = c.publishableKey || c.anonKey;
    if (!/^https:\/\/[^/]+/.test(c.url || "") || !key) return null;
    return { url: c.url, key: key };
  }
  function queueSave(dossier) {
    if (!currentUser || removed.has(dossier.id)) return;
    // Copy values now: the app continues changing this object after keystrokes.
    var snapshot = JSON.parse(JSON.stringify(dossier.data || {}));
    pending.set(dossier.id, {
      owner_id: currentUser.id,
      id: dossier.id,
      name: dossier.name,
      data: snapshot,
      updated_at: new Date().toISOString()
    });
    saveError = null;
    setStatus("Wijzigingen opslaan…");
    clearTimeout(timer);
    timer = setTimeout(function () { flushPending().catch(function () {}); }, 650);
  }
  function serialized(operation) {
    var result = writeQueue.then(operation);
    writeQueue = result.catch(function () {});
    return result;
  }
  async function flushPending() {
    clearTimeout(timer);
    if (!pending.size || !currentUser) {
      await writeQueue;
      if (saveError) throw saveError;
      return;
    }
    var batch = Array.from(pending.values()).filter(function (row) { return !removed.has(row.id); });
    pending.clear();
    if (!batch.length) return;
    try {
      await serialized(async function () {
        var result = await client.from(table).upsert(batch, { onConflict: "owner_id,id" });
        if (result.error) throw result.error;
      });
      saveError = null;
      if (pending.size) {
        setStatus("Nieuwe wijzigingen opslaan…");
        clearTimeout(timer);
        timer = setTimeout(function () { flushPending().catch(function () {}); }, 650);
      } else setStatus("Opgeslagen in beveiligde database");
    } catch (error) {
      batch.forEach(function (row) {
        if (!removed.has(row.id) && !pending.has(row.id)) pending.set(row.id, row);
      });
      saveError = error;
      setStatus("Opslaan mislukt — probeer opnieuw", true);
      throw error;
    }
  }
  async function flushAll() {
    clearTimeout(timer);
    if (pending.size) await flushPending();
    await writeQueue;
    if (saveError) throw saveError;
  }
  async function deleteCase(id) {
    if (!currentUser) throw new Error("Je bent niet ingelogd.");
    removed.add(id);
    pending.delete(id);
    try {
      await serialized(async function () {
        var result = await client.from(table).delete().eq("owner_id", currentUser.id).eq("id", id);
        if (result.error) throw result.error;
      });
      setStatus("Dossier verwijderd");
    } catch (error) {
      removed.delete(id);
      setStatus("Verwijderen mislukt", true);
      throw error;
    }
  }
  async function saveMany(cases) {
    cases.forEach(queueSave);
    await flushAll();
  }
  async function loadUser() {
    var sessionResponse = await client.auth.getSession();
    if (sessionResponse.error) throw sessionResponse.error;
    if (!sessionResponse.data.session) {
      showGate("Welkom bij het AI-Groeikompas", "Log in met je e-mailadres of maak een nieuw account aan.", true);
      return;
    }
    var response = await client.auth.getUser();
    if (response.error || !response.data.user) {
      showGate("Sessie verlopen", "Log opnieuw in met je e-mailadres.", true);
      return;
    }
    currentUser = response.data.user;
    var dossiers = await client.from(table).select("id,name,data").eq("owner_id", currentUser.id).order("updated_at", { ascending: false });
    if (dossiers.error) throw dossiers.error;
    node("accountLabel").textContent = currentUser.email || "Ingelogd";
    node("appShell").hidden = false;
    node("authGate").hidden = true;
    isStarted = true;
    global.startGroeikompas(dossiers.data || [], currentUser);
  }
  async function init() {
    var cfg = configuration();
    if (!cfg) {
      showGate("Supabase nog niet ingesteld", "Vul de publieke Project URL en publishable key in assets/supabase-config.js en voer de SQL-migratie uit.", false);
      return;
    }
    if (!global.supabase || typeof global.supabase.createClient !== "function") {
      showGate("Inloggen is tijdelijk niet beschikbaar", "De Supabase-bibliotheek kon niet worden geladen. Controleer je verbinding en vernieuw de pagina.", false);
      return;
    }
    client = global.supabase.createClient(cfg.url, cfg.key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" }
    });
    client.auth.onAuthStateChange(function (event) {
      if (event === "SIGNED_OUT" && isStarted) global.location.reload();
    });
    var mode = "login";
    var form = node("emailAuthForm");
    var emailInput = node("authEmail");
    var passwordInput = node("authPassword");
    var submit = node("authSubmit");
    var switchMode = node("toggleAuthMode");
    var forgot = node("forgotPassword");
    function updateMode() {
      submit.textContent = mode === "login" ? "Inloggen" : "Account aanmaken";
      switchMode.textContent = mode === "login" ? "Nog geen account? Registreren" : "Al een account? Inloggen";
      passwordInput.autocomplete = mode === "login" ? "current-password" : "new-password";
      forgot.hidden = mode !== "login";
      node("authMessage").textContent = mode === "login"
        ? "Log in om je eigen bedrijfsdossiers te openen."
        : "Registreer met je e-mailadres en een wachtwoord van minimaal 8 tekens. Je ontvangt een bevestigingsmail.";
    }
    switchMode.addEventListener("click", function () {
      mode = mode === "login" ? "signup" : "login";
      passwordInput.value = "";
      updateMode();
    });
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      var email = emailInput.value.trim();
      var password = passwordInput.value;
      submit.disabled = true;
      switchMode.disabled = true;
      node("authMessage").textContent = "Je aanvraag wordt verwerkt…";
      try {
        if (mode === "signup") {
          var signUp = await client.auth.signUp({
            email: email, password: password,
            options: { emailRedirectTo: global.location.origin + global.location.pathname }
          });
          if (signUp.error) throw signUp.error;
          passwordInput.value = "";
          mode = "login";
          updateMode();
          node("authMessage").textContent = "Controleer je mailbox voor de verificatielink. Je kunt daarna inloggen. Als het e-mailadres al bestaat, ontvang je mogelijk geen nieuwe bevestiging.";
        } else {
          var signIn = await client.auth.signInWithPassword({ email: email, password: password });
          if (signIn.error) throw signIn.error;
          passwordInput.value = "";
          await loadUser();
        }
      } catch (error) {
        node("authMessage").textContent = "Aanmelden mislukt: " + error.message;
      } finally {
        submit.disabled = false;
        switchMode.disabled = false;
      }
    });
    forgot.addEventListener("click", async function () {
      if (!emailInput.reportValidity()) {
        node("authMessage").textContent = "Vul eerst je e-mailadres in.";
        return;
      }
      forgot.disabled = true;
      try {
        var result = await client.auth.resetPasswordForEmail(emailInput.value.trim(), {
          redirectTo: global.location.origin + global.location.pathname
        });
        if (result.error) throw result.error;
        node("authMessage").textContent = "Als dit e-mailadres bekend is, ontvang je een herstelmail.";
      } catch (error) {
        node("authMessage").textContent = "Herstelmail aanvragen mislukt: " + error.message;
      } finally {
        forgot.disabled = false;
      }
    });
    client.auth.onAuthStateChange(function (event) {
      if (event === "PASSWORD_RECOVERY") {
        global.setTimeout(async function () {
          var replacement = global.prompt("Voer je nieuwe wachtwoord in (minimaal 8 tekens):");
          if (!replacement) return;
          if (replacement.length < 8) { alert("Het wachtwoord moet minimaal 8 tekens bevatten."); return; }
          var response = await client.auth.updateUser({password: replacement});
          alert(response.error ? "Wachtwoord aanpassen mislukt: "+response.error.message : "Je wachtwoord is gewijzigd.");
        }, 0);
      }
    });
    node("logout").addEventListener("click", async function () {
      try {
        await flushAll();
        var result = await client.auth.signOut();
        if (result.error) throw result.error;
        global.location.reload();
      } catch (error) {
        alert("Uitloggen geblokkeerd: je wijzigingen zijn nog niet veilig opgeslagen. " + error.message);
      }
    });
    node("retrySync").addEventListener("click", function () {
      flushAll().catch(function (error) { alert("Opnieuw opslaan mislukt: " + error.message); });
    });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") flushPending().catch(function () {});
    });
    global.addEventListener("pagehide", function () {
      // Best-effort; bij trage verbinding altijd de zichtbare opslagstatus controleren.
      flushPending().catch(function () {});
    });
    try {
      await loadUser();
    } catch (error) {
      showGate("Dossiers konden niet worden geopend",
        "Controleer of de SQL-migratie en toegangsregels zijn ingesteld. Fout: " + error.message, false);
      setStatus("Databaseverbinding mislukt", true);
    }
  }

  global.GroeikompasCloud = {
    init: init,
    queueSave: queueSave,
    flushAll: flushAll,
    deleteCase: deleteCase,
    saveMany: saveMany
  };
})(window);
