/* Session utilisateur courante (stockee dans localStorage, scope navigateur).
   La vraie protection des donnees est le depot prive : sans PAT GitHub y ayant acces, rien n'est lisible.
   La session ne fait que cloisonner l'UI et identifier qui a modifie quoi. */
(function () {
  const CFG = window.QA_CONFIG;

  function get() {
    try { return JSON.parse(localStorage.getItem(CFG.sessionKey) || 'null'); }
    catch (e) { return null; }
  }

  function set(session) {
    localStorage.setItem(CFG.sessionKey, JSON.stringify(session));
  }

  function clear() {
    localStorage.removeItem(CFG.sessionKey);
  }

  function isAuthenticated() {
    const s = get();
    return !!(s && s.username);
  }

  function isAdmin() {
    const s = get();
    return !!(s && (s.role === 'admin' || s.role === 'qa_manager'));
  }
  function role() {
    const s = get();
    return s ? s.role : null;
  }

  function username() {
    const s = get();
    return s ? s.username : null;
  }

  /* Sans PAT, le depot prive des donnees est illisible : on renvoie vers login pour le saisir. */
  function hasDataAccess() {
    return !!(window.QAGitHub && window.QAGitHub.getPat());
  }

  /* Garde de route : redirige vers login si pas connecte ou sans PAT.
     adminOnly: redirige les non-admins vers catalog. */
  function requireAuth(opts) {
    opts = opts || {};
    if (!isAuthenticated() || !hasDataAccess()) {
      const here = encodeURIComponent(location.pathname.split('/').pop() || 'index.html');
      location.replace(`login.html?next=${here}`);
      return false;
    }
    if (opts.adminOnly && !isAdmin()) {
      location.replace('index.html');
      return false;
    }
    return true;
  }

  function logout() {
    clear();
    location.replace('login.html');
  }

  window.QASession = { get, set, clear, isAuthenticated, hasDataAccess, isAdmin, role, username, requireAuth, logout };
})();
