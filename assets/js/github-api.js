/* Client GitHub API minimal pour lire/ecrire data.json.
   - Les donnees vivent dans un depot PRIVE (QA_CONFIG.owner/repo), distinct du depot public
     qui publie le code via GitHub Pages. Lecture ET ecriture passent par l'API authentifiee :
     sans PAT ayant acces a ce depot, aucune donnee n'est lisible.
   - Au-dela de 1 Mo, l'API ne renvoie plus le contenu en base64 : on le relit en brut.
   - Cache local en localStorage pour survivre aux ratees reseau (jamais en cas de refus d'acces) */
(function () {
  const CFG = window.QA_CONFIG;

  function apiUrl() {
    return `https://api.github.com/repos/${CFG.owner}/${CFG.repo}/contents/${CFG.dataPath}?ref=${CFG.branch}`;
  }

  function getPat() {
    return localStorage.getItem(CFG.patKey) || '';
  }

  function setPat(token) {
    if (token) localStorage.setItem(CFG.patKey, token);
    else localStorage.removeItem(CFG.patKey);
  }

  function cacheGet() {
    try { return JSON.parse(localStorage.getItem(CFG.cacheKey) || 'null'); }
    catch (e) { return null; }
  }

  function cacheSet(data, sha) {
    localStorage.setItem(CFG.cacheKey, JSON.stringify({ data, sha, cachedAt: Date.now() }));
  }

  /* Repli hors ligne : uniquement pour une panne reseau ou serveur, pas pour un refus d'acces. */
  function fromCacheOrThrow(err) {
    const cached = cacheGet();
    if (cached) {
      console.warn('Fetch GitHub echoue, fallback cache local', err);
      return { data: cached.data, sha: cached.sha, source: 'cache', error: err.message };
    }
    throw err;
  }

  /* Lit data.json dans le depot prive. PAT obligatoire.
     Erreurs typees : PAT_REQUIRED (aucun jeton), PAT_INVALID (401), NO_ACCESS (403/404 :
     le jeton ne voit pas le depot). Voir describeError() pour le message a afficher. */
  async function fetchData() {
    const pat = getPat();
    if (!pat) throw new Error('PAT_REQUIRED');
    const opts = accept => ({
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${pat}`, 'Accept': accept },
    });
    let res;
    try {
      // Media type "object" : renvoie toujours le sha ; le contenu base64 seulement jusqu'a 1 Mo.
      res = await fetch(apiUrl(), opts('application/vnd.github.object+json'));
      if (res.ok) {
        const meta = await res.json();
        let data;
        if (meta.encoding === 'base64' && meta.content) {
          const content = atob(meta.content.replace(/\n/g, ''));
          data = JSON.parse(new TextDecoder().decode(Uint8Array.from(content, c => c.charCodeAt(0))));
        } else {
          // Fichier > 1 Mo : contenu vide en "object", on le relit en brut (jusqu'a 100 Mo).
          const raw = await fetch(apiUrl(), opts('application/vnd.github.raw+json'));
          if (!raw.ok) throw new Error(`GitHub API ${raw.status}`);
          data = await raw.json();
        }
        cacheSet(data, meta.sha);
        return { data, sha: meta.sha, source: 'api' };
      }
    } catch (e) {
      return fromCacheOrThrow(e);
    }
    if (res.status === 401) throw new Error('PAT_INVALID');
    if (res.status === 403 || res.status === 404) throw new Error('NO_ACCESS');
    return fromCacheOrThrow(new Error(`GitHub API ${res.status}`));
  }

  /* Message lisible pour les erreurs typees de fetchData(). */
  function describeError(e) {
    const code = e && e.message;
    if (code === 'PAT_REQUIRED') return 'Jeton GitHub requis pour accéder aux données.';
    if (code === 'PAT_INVALID') return 'Jeton GitHub invalide ou expiré.';
    if (code === 'NO_ACCESS') return `Ce jeton GitHub n'a pas accès au dépôt des données (${CFG.owner}/${CFG.repo}).`;
    return code || 'Erreur inconnue';
  }

  /* Ecrit data.json sur GitHub. Necessite un PAT avec scope "contents:write". */
  async function saveData(data, sha, message) {
    const pat = getPat();
    if (!pat) throw new Error('PAT GitHub requis pour ecrire');
    const content = JSON.stringify(data, null, 2);
    const b64 = btoa(unescape(encodeURIComponent(content)));
    const body = {
      message: message || `Update data.json (${new Date().toISOString()})`,
      content: b64,
      branch: CFG.branch,
    };
    if (sha) body.sha = sha;
    const res = await fetch(apiUrl(), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      let ghMsg = txt;
      try { ghMsg = (JSON.parse(txt).message) || txt; } catch (e) { /* corps non-JSON */ }
      if (res.status === 409) throw new Error('CONFLICT');
      // On remonte le VRAI message GitHub : il dit exactement pourquoi l'ecriture est refusee
      // (ex: "Resource not accessible by personal access token" = jeton fine-grained sans
      //  droit Contents:write ; "Repository was archived so is read-only" = depot archive).
      if (res.status === 401) throw new Error(`Jeton invalide (401) : ${ghMsg}`);
      if (res.status === 403) throw new Error(`Ecriture refusee (403) : ${ghMsg}`);
      throw new Error(`GitHub PUT ${res.status} : ${ghMsg}`);
    }
    const json = await res.json();
    cacheSet(data, json.content.sha);
    return json.content.sha;
  }

  /* Verifie qu'un PAT est valide et a acces en ecriture au repo. */
  async function checkPat(pat) {
    try {
      const res = await fetch(`https://api.github.com/repos/${CFG.owner}/${CFG.repo}`, {
        headers: { 'Authorization': `Bearer ${pat}`, 'Accept': 'application/vnd.github+json' }
      });
      // Depot prive : GitHub repond 404 (et non 403) quand le jeton ne le voit pas.
      if (res.status === 404) return { ok: false, reason: `pas d'accès au dépôt ${CFG.owner}/${CFG.repo}` };
      if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
      const json = await res.json();
      // ATTENTION: json.permissions refletent le role du COMPTE sur le depot, PAS ce que
      // le jeton (surtout fine-grained) est reellement autorise a faire. Un depot archive
      // est aussi en lecture seule quel que soit le role. On ne garantit donc "ecriture"
      // que si le compte peut push ET que le depot n'est pas archive — le seul test 100%
      // fiable reste une vraie ecriture (cf. saveData).
      const hasPushRole = !!(json.permissions && (json.permissions.push || json.permissions.admin || json.permissions.maintain));
      const archived = !!json.archived;
      return { ok: true, canWrite: hasPushRole && !archived, hasPushRole, archived, repo: json.full_name };
    } catch (e) {
      return { ok: false, reason: e.message };
    }
  }

  window.QAGitHub = { fetchData, saveData, getPat, setPat, checkPat, cacheGet, describeError };
})();
