/* Catalogue de tests — module « automation.js ».
   Fait partie de l'application principale (index.html). L'ordre de chargement
   des <script> compte : voir index.html. Ne pas ouvrir isolément. */
/* ===== Test automation (plan qualité, semaine 7) =====
   « Un statut d'automatisation par test case (candidat, automatisé, flaky), le lien vers
   [l'outil d'automatisation] et le temps de maintenance. » L'outil n'est pas imposé : son nom
   et son modèle de lien se règlent dans « Outils reliés » (settings.tools.automation).
   Modèle « Test automation : objectifs, inventaire, règles » ; actions S7-1 à S7-3 et S7-7 ;
   check-list AT-09, AT-10, AT-12, AT-27, AT-30, AT-31.
   - Sur le test case : automationStatus (AUTOMATION_STATUSES), automationRef, automationGrid
     {6 critères}, automationDecision (keep, repair, retire), automationReviewedAt,
     automationExecsPerMonth, manualReason, maintenanceLog[{id, date, minutes, note, by}].
   - settings.automation : {goal, scope, staysManual, toolsEnvs, stakeholders, rules}. */

/* Grille du modèle (AT-10) : automatiser si le test case est faisable, rentable, exécuté
   souvent, répétable, maintenable, et s'il porte sur un flux métier fréquent. */
const AUTOMATION_GRID = [
  { id: 'feasible', label: 'Faisable' },
  { id: 'profitable', label: 'Rentable' },
  { id: 'frequent', label: 'Exécuté souvent' },
  { id: 'repeatable', label: 'Répétable' },
  { id: 'maintainable', label: 'Maintenable' },
  { id: 'frequentFlow', label: 'Flux métier fréquent' },
];
const AUTOMATION_DECISIONS = [
  { id: 'keep', label: 'Garder' },
  { id: 'repair', label: 'Réparer' },
  { id: 'retire', label: 'Retirer' },
];
/* Règles de maintenance du modèle, modifiables (S7-3). */
const DEFAULT_AUTOMATION_RULES = [
  'Naming conventions : [reprendre l’existant].',
  'Chaque module a un propriétaire.',
  'Un flaky test sort de la suite active jusqu’à sa correction.',
  'Un test case crée ses propres test data quand c’est possible.',
  'Chaque exécution laisse un journal exploitable : date, statut, captures.',
  'Le confirmation test d’un defect Major corrigé rejoint la regression suite s’il est automatisable.',
  'Si la maintenance coûte plus que le temps manuel économisé, le test case est revu.',
].join('\n');

const autoSettings = () => ((state.settings || {}).automation || {});
const autoStatusMeta = id => AUTOMATION_STATUSES.find(s => s.id === id) || AUTOMATION_STATUSES[0];
const AUTO_STATUS_BADGE = { manual: 'badge-muted', candidate: 'badge-warning', automated: 'badge-accent', flaky: 'badge-danger', retired: 'badge-muted' };
const autoToolLabel = () => toolName('automation') || 'l’outil d’automatisation';

function autoGridScore(c) {
  const g = c.automationGrid || {};
  return AUTOMATION_GRID.filter(x => g[x.id]).length;
}
/* Référence dans l'outil d'automatisation, en lien si l'outil a un modèle de lien. */
function autoRefHtml(c) {
  if (!c.automationRef) return '';
  const url = toolUrl('automation', c.automationRef);
  return url
    ? `<a class="jira-pill" href="${escapeHtml(url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${escapeHtml(c.automationRef)}<span class="ext-icon">${ICON.externalLink}</span></a>`
    : `<span class="jira-pill">${escapeHtml(c.automationRef)}</span>`;
}
/* Durée à la main : la médiane des durées mesurées (checklists), sinon le temps estimé. */
function caseManualMinutes(c) {
  const d = [];
  (state.testRuns || []).forEach(r => (r.results || []).forEach(x => {
    if (x.caseId === c.id && typeof x.durationMin === 'number' && x.outcome !== 'not_run') d.push(x.durationMin);
  }));
  if (d.length) {
    d.sort((a, b) => a - b);
    const m = Math.floor(d.length / 2);
    return { minutes: d.length % 2 ? d[m] : Math.round((d[m - 1] + d[m]) / 2), measured: true, samples: d.length };
  }
  return { minutes: Number(c.estimatedTime) || null, measured: false, samples: 0 };
}
function caseMaintenanceMinutes(c, monthIso) {
  return (c.maintenanceLog || []).filter(m => String(m.date).startsWith(monthIso)).reduce((a, m) => a + (Number(m.minutes) || 0), 0);
}
/* Ligne d'inventaire : exécutions, durée à la main, maintenance du mois, temps manuel économisé,
   et le signal d'alarme (AT-31) : la maintenance coûte plus que le temps manuel économisé. */
function automationRow(c, monthIso) {
  const manual = caseManualMinutes(c);
  const execs = Number(c.automationExecsPerMonth) || 0;
  const maint = caseMaintenanceMinutes(c, monthIso);
  const saved = manual.minutes ? execs * manual.minutes : 0;
  return { execs, manual, maint, saved, alarm: maint > 0 && maint > saved };
}

function automationPageHtml(monthIso) {
  const s = autoSettings();
  const cell = 'border:1px solid #ccc;padding:4px 8px;vertical-align:top;';
  const th = cell + 'background:#f4f5f7;text-align:left;';
  const txt = t => escapeHtml(t || '').replace(/\n/g, '<br>');
  const inv = state.testCases.filter(c => ['automated', 'flaky'].includes(c.automationStatus));
  return `
    <h1>Test automation : objectifs, inventaire, règles</h1>
    <h2>Objectifs</h2>
    <ul><li>But : ${txt(s.goal || '[…]')}</li><li>Scope : ${txt(s.scope || '[…]')}</li><li>Ce qui reste manuel, et pourquoi : ${txt(s.staysManual || '[…]')}</li>
      <li>Outils et test environments : ${txt(s.toolsEnvs || toolName('automation') || '[…]')}</li><li>Parties prenantes : ${txt(s.stakeholders || '[…]')}</li></ul>
    <h2>Inventaire (${escapeHtml(monthIso)})</h2>
    <table style="border-collapse:collapse;"><thead><tr>${['Test case', 'Processus', 'Risk level', 'Exécutions par mois', 'Durée à la main', 'Maintenance ce mois', 'Flaky', 'Décision'].map(h => `<th style="${th}">${h}</th>`).join('')}</tr></thead>
    <tbody>${inv.map(c => {
      const r = automationRow(c, monthIso);
      const rc = caseRiskClass(c.id);
      return `<tr><td style="${cell}">${escapeHtml(c.title)}${c.automationRef ? ` (${escapeHtml(c.automationRef)})` : ''}</td>
        <td style="${cell}">${escapeHtml((c.divisionIds || []).map(id => ((state.businessDivisions || []).find(d => d.id === id) || {}).name).filter(Boolean).join(', '))}</td>
        <td style="${cell}">${rc ? escapeHtml(riskClassMeta(rc).label) : '–'}</td><td style="${cell}">${r.execs || '–'}</td>
        <td style="${cell}">${r.manual.minutes ? escapeHtml(formatMin(r.manual.minutes)) : '–'}</td><td style="${cell}">${r.maint ? escapeHtml(formatMin(r.maint)) : '–'}</td>
        <td style="${cell}">${c.automationStatus === 'flaky' ? 'oui' : 'non'}</td><td style="${cell}">${escapeHtml(autoDecisionLabel(c.automationDecision) || '–')}</td></tr>`;
    }).join('')}</tbody></table>
    <h2>Grille pour un nouveau candidat</h2>
    <p>Automatiser si le test case est faisable, rentable, exécuté souvent, répétable, maintenable, et s’il porte sur un flux métier fréquent.</p>
    <h2>Règles de maintenance</h2>
    <ul>${String(s.rules || DEFAULT_AUTOMATION_RULES).split('\n').filter(Boolean).map(l => `<li>${escapeHtml(l)}</li>`).join('')}</ul>`;
}
function autoDecisionLabel(id) { return (AUTOMATION_DECISIONS.find(d => d.id === id) || {}).label || ''; }

function renderAutomation(view) {
  const month = wrIso(new Date()).slice(0, 7);
  const s = autoSettings();
  const canEdit = !window.QAPerm || QAPerm.can('update', 'automation');
  const cases = state.testCases;
  const by = id => cases.filter(c => (c.automationStatus || 'manual') === id);
  const inv = cases.filter(c => ['automated', 'flaky'].includes(c.automationStatus)).sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  const backlog = by('candidate').sort((a, b) => autoGridScore(b) - autoGridScore(a));
  const rows = inv.map(c => ({ c, r: automationRow(c, month) }));
  const alarms = rows.filter(x => x.r.alarm);
  const totMaint = rows.reduce((a, x) => a + x.r.maint, 0);
  const totSaved = rows.reduce((a, x) => a + x.r.saved, 0);
  // Répartition des tests automatisés par type (AT-09 : forme actuelle, pyramide visée)
  const layers = [
    { label: 'Composant, API, intégration', ids: ['api', 'integration'] },
    { label: 'Système, fonctionnel, régression', ids: ['systeme', 'fonctionnel', 'regression', 'smoke'] },
    { label: 'Bout en bout, acceptation (UI)', ids: ['e2e', 'acceptation'] },
  ];
  const layerCount = l => inv.filter(c => (c.types || []).some(t => l.ids.includes(t))).length;
  const maxLayer = Math.max(1, ...layers.map(layerCount));
  const td = 'padding:6px 8px;border-bottom:1px solid var(--border);vertical-align:top;';
  const th = td + 'text-align:left;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:0.04em;';
  const field = 'font:inherit;font-size:13px;padding:5px 8px;border:1px solid var(--border-strong);border-radius:var(--radius-sm);background:var(--surface);width:100%;';
  const objective = (key, label, ph) => `<label style="font-size:12px;color:var(--text-soft);">${label}<textarea data-auto-obj="${key}" rows="2" style="${field}" placeholder="${escapeHtml(ph)}" ${canEdit ? '' : 'disabled'}>${escapeHtml(s[key] || '')}</textarea></label>`;

  view.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Automatisation</h1>
        <div class="subtitle">Objectifs, inventaire et règles de l’automatisation. Outil : ${escapeHtml(toolName('automation') || 'à régler dans Environnements › Outils reliés')}.</div>
      </div>
      <div class="actions">
        <button class="btn" id="auto-copy" title="Colle la page dans un wiki, un e-mail ou un document">Copier la page</button>
      </div>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
      ${AUTOMATION_STATUSES.map(st => `<span class="badge ${AUTO_STATUS_BADGE[st.id]}" title="${escapeHtml(st.desc)}">${by(st.id).length} ${escapeHtml(st.label.toLowerCase())}</span>`).join('')}
      ${alarms.length ? `<span class="badge badge-danger">${alarms.length} signal d’alarme : maintenance > temps manuel économisé</span>` : ''}
    </div>

    <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;margin-bottom:16px;">
      <div class="card" style="flex:2;min-width:320px;">
        <h3 style="font-size:15px;margin:0 0 8px;">Objectifs <span style="font-weight:400;color:var(--text-muted);font-size:12px;">· S7-1</span></h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${objective('goal', 'But', 'Ex. revérifier les processus critiques à chaque livraison sans mobiliser les key users')}
          ${objective('scope', 'Scope', 'Processus, systèmes')}
          ${objective('staysManual', 'Ce qui reste manuel, et pourquoi', 'Jugement visuel, exploratory testing, cas rares')}
          ${objective('toolsEnvs', 'Outils et test environments', toolName('automation') || 'Outil, environnements')}
          ${objective('stakeholders', 'Parties prenantes', 'Qui demande, qui maintient, qui lit les résultats')}
        </div>
        ${canEdit ? '<button class="btn btn-sm" id="auto-obj-save" style="margin-top:8px;">Enregistrer les objectifs</button>' : ''}
      </div>
      <div class="card" style="flex:1;min-width:260px;">
        <h3 style="font-size:15px;margin:0 0 8px;">Répartition des tests automatisés <span style="font-weight:400;color:var(--text-muted);font-size:12px;">· AT-09</span></h3>
        ${layers.map(l => `<div style="font-size:12px;margin:6px 0 2px;">${escapeHtml(l.label)} · <strong>${layerCount(l)}</strong></div>
          <div style="height:8px;background:var(--surface-soft);border-radius:4px;"><div style="height:8px;width:${Math.round(layerCount(l) / maxLayer * 100)}%;background:var(--primary);border-radius:4px;"></div></div>`).join('')}
        <p style="font-size:11.5px;color:var(--text-muted);margin:8px 0 0;">Forme visée : une pyramide, beaucoup de tests rapides en bas, peu de tests de bout en bout en haut.</p>
        <p style="font-size:12px;margin:10px 0 0;">Ce mois : ${formatMin(totMaint)} de maintenance pour ${formatMin(totSaved)} de test manuel économisé.</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;overflow-x:auto;">
      <h3 style="font-size:15px;margin:0 0 4px;">Inventaire <span style="font-weight:400;color:var(--text-muted);font-size:12px;">· S7-2 : valeur, fréquence, maintenance, stabilité ; garder, réparer ou retirer</span></h3>
      ${inv.length === 0 ? '<p style="font-size:12.5px;color:var(--text-muted);font-style:italic;margin:6px 0 0;">Aucun test case automatisé.</p>' : `
        <table style="border-collapse:collapse;width:100%;font-size:12.5px;">
          <thead><tr><th style="${th}">Test case</th><th style="${th}">Risk level</th><th style="${th}">Exécutions / mois</th><th style="${th}">Durée à la main</th><th style="${th}">Maintenance ce mois</th><th style="${th}">Statut</th><th style="${th}">Décision</th><th style="${th}"></th></tr></thead>
          <tbody>${rows.map(({ c, r }) => {
            const rc = caseRiskClass(c.id);
            return `<tr>
              <td style="${td}">${escapeHtml(c.title || '(sans titre)')} ${autoRefHtml(c)}</td>
              <td style="${td}">${rc ? `<span class="badge ${riskClassMeta(rc).badge}">${riskClassMeta(rc).label}</span>` : '–'}</td>
              <td style="${td}">${r.execs || '–'}</td>
              <td style="${td}" title="${r.manual.measured ? `médiane de ${r.manual.samples} durée(s) mesurée(s)` : 'temps estimé'}">${r.manual.minutes ? formatMin(r.manual.minutes) + (r.manual.measured ? '' : ' (estimé)') : '–'}</td>
              <td style="${td}">${r.maint ? formatMin(r.maint) : '–'}${r.alarm ? '<div style="color:#8a3a2c;font-size:11.5px;">⚠ plus que le temps manuel économisé</div>' : ''}</td>
              <td style="${td}"><span class="badge ${AUTO_STATUS_BADGE[c.automationStatus]}">${escapeHtml(autoStatusMeta(c.automationStatus).label)}</span></td>
              <td style="${td}">${escapeHtml(autoDecisionLabel(c.automationDecision) || '–')}${c.automationReviewedAt ? `<div style="color:var(--text-muted);font-size:11px;">revu le ${escapeHtml(wrFmt(c.automationReviewedAt))}</div>` : ''}</td>
              <td style="${td}text-align:right;"><button class="btn btn-sm" data-auto-open="${c.id}">Ouvrir</button></td>
            </tr>`;
          }).join('')}</tbody>
        </table>`}
    </div>

    <div class="card" style="margin-bottom:16px;overflow-x:auto;">
      <h3 style="font-size:15px;margin:0 0 4px;">Candidats <span style="font-weight:400;color:var(--text-muted);font-size:12px;">· grille AT-10 : faisable, rentable, exécuté souvent, répétable, maintenable, flux métier fréquent</span></h3>
      ${backlog.length === 0 ? '<p style="font-size:12.5px;color:var(--text-muted);font-style:italic;margin:6px 0 0;">Aucun candidat. Donnez le statut « Candidat » à un test case (fenêtre du test case ou édition groupée).</p>' : `
        <table style="border-collapse:collapse;width:100%;font-size:12.5px;">
          <thead><tr><th style="${th}">Test case</th><th style="${th}">Risk level</th><th style="${th}">Grille</th><th style="${th}"></th></tr></thead>
          <tbody>${backlog.map(c => {
            const sc = autoGridScore(c);
            const rc = caseRiskClass(c.id);
            return `<tr>
              <td style="${td}">${escapeHtml(c.title || '(sans titre)')}</td>
              <td style="${td}">${rc ? `<span class="badge ${riskClassMeta(rc).badge}">${riskClassMeta(rc).label}</span>` : '–'}</td>
              <td style="${td}"><span class="badge ${sc === AUTOMATION_GRID.length ? 'badge-success' : sc ? 'badge-warning' : 'badge-muted'}">${sc} / ${AUTOMATION_GRID.length}</span>${sc === AUTOMATION_GRID.length ? ' à automatiser' : sc ? ' critères manquants : ' + escapeHtml(AUTOMATION_GRID.filter(x => !(c.automationGrid || {})[x.id]).map(x => x.label.toLowerCase()).join(', ')) : ' grille à remplir'}</td>
              <td style="${td}text-align:right;"><button class="btn btn-sm" data-auto-open="${c.id}">Ouvrir</button></td>
            </tr>`;
          }).join('')}</tbody>
        </table>`}
    </div>

    <div class="card">
      <h3 style="font-size:15px;margin:0 0 8px;">Règles de maintenance <span style="font-weight:400;color:var(--text-muted);font-size:12px;">· S7-3, une règle par ligne</span></h3>
      <textarea id="auto-rules" rows="7" style="${field}" ${canEdit ? '' : 'disabled'}>${escapeHtml(s.rules || DEFAULT_AUTOMATION_RULES)}</textarea>
      ${canEdit ? '<button class="btn btn-sm" id="auto-rules-save" style="margin-top:8px;">Enregistrer les règles</button>' : ''}
    </div>
  `;

  view.querySelectorAll('[data-auto-open]').forEach(b => b.onclick = () => openAutomationCaseModal(b.dataset.autoOpen));
  document.getElementById('auto-copy').onclick = async () => {
    const html = automationPageHtml(month);
    const text = html.replace(/<li>/g, '- ').replace(/<\/t[dh]>/g, ' | ').replace(/<\/(h1|h2|p|li|tr)>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    const ok = await copyRichText(html, text);
    toast(ok ? 'Page copiée : collez-la dans votre wiki' : 'Copie impossible');
  };
  if (!canEdit) return;
  const saveSettings = (patch, msg) => {
    if (!state.settings) state.settings = {};
    state.settings.automation = Object.assign({}, autoSettings(), patch);
    save();
    toast(msg);
  };
  document.getElementById('auto-obj-save').onclick = () => {
    const patch = {};
    view.querySelectorAll('[data-auto-obj]').forEach(t => { patch[t.dataset.autoObj] = t.value.trim(); });
    saveSettings(patch, 'Objectifs enregistrés');
  };
  document.getElementById('auto-rules-save').onclick = () => saveSettings({ rules: document.getElementById('auto-rules').value.trim() }, 'Règles enregistrées');
}

/* Fiche d'automatisation d'un test case : statut, référence, grille, décision, maintenance. */
function openAutomationCaseModal(caseId) {
  const c = state.testCases.find(x => x.id === caseId);
  if (!c) return;
  const month = wrIso(new Date()).slice(0, 7);
  const log = (c.maintenanceLog || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const r = automationRow(c, month);
  const grid = c.automationGrid || {};
  openModal(`Automatisation · ${c.title || ''}`, `
    <div class="form-row">
      <div class="form-group"><label class="field-label">Statut</label>
        <select id="ac-status">${AUTOMATION_STATUSES.map(st => `<option value="${st.id}" ${c.automationStatus === st.id ? 'selected' : ''} title="${escapeHtml(st.desc)}">${escapeHtml(st.label)}</option>`).join('')}</select>
        <div id="ac-status-hint" style="font-size:11.5px;color:var(--text-muted);margin-top:4px;"></div></div>
      <div class="form-group"><label class="field-label">Référence dans ${escapeHtml(autoToolLabel())}</label>
        <input type="text" id="ac-ref" value="${escapeHtml(c.automationRef || '')}" placeholder="Identifiant ou chemin du test automatisé">${c.automationRef && toolUrl('automation', c.automationRef) ? `<div style="margin-top:4px;">${autoRefHtml(c)}</div>` : ''}</div>
    </div>
    <div class="form-group" id="ac-manual-block"><label class="field-label">Pourquoi il reste manuel <span class="hint">ce qui reste manuel l’est pour une raison écrite</span></label>
      <input type="text" id="ac-manual" value="${escapeHtml(c.manualReason || '')}" placeholder="Jugement visuel, exploration, cas rare, interaction humaine…"></div>
    <div class="form-group"><label class="field-label">Grille <span class="hint">automatiser si les six critères sont remplis</span></label>
      <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:13px;">${AUTOMATION_GRID.map(x => `<label style="display:flex;gap:6px;align-items:center;"><input type="checkbox" data-ac-grid="${x.id}" ${grid[x.id] ? 'checked' : ''}> ${x.label}</label>`).join('')}</div></div>
    <div class="form-row form-row-3">
      <div class="form-group"><label class="field-label">Exécutions par mois</label><input type="number" min="0" id="ac-execs" value="${escapeHtml(c.automationExecsPerMonth || '')}"></div>
      <div class="form-group"><label class="field-label">Décision <span class="hint">S7-2</span></label>
        <select id="ac-decision"><option value="">—</option>${AUTOMATION_DECISIONS.map(d => `<option value="${d.id}" ${c.automationDecision === d.id ? 'selected' : ''}>${d.label}</option>`).join('')}</select></div>
      <div class="form-group"><label class="field-label">Revu le</label><input type="date" id="ac-reviewed" value="${escapeHtml(c.automationReviewedAt || '')}"></div>
    </div>
    <div style="font-size:12.5px;color:var(--text-soft);margin:-4px 0 12px;">Durée à la main : ${r.manual.minutes ? formatMin(r.manual.minutes) + (r.manual.measured ? ` (médiane de ${r.manual.samples} mesure${r.manual.samples > 1 ? 's' : ''})` : ' (estimée)') : '–'} · ce mois : ${formatMin(r.maint)} de maintenance pour ${formatMin(r.saved)} de test manuel économisé${r.alarm ? ' · <strong style="color:#8a3a2c;">signal d’alarme</strong>' : ''}.</div>
    <div class="form-group"><label class="field-label">Temps de maintenance</label>
      <div style="display:grid;grid-template-columns:140px 100px 1fr auto;gap:6px;align-items:end;">
        <input type="date" id="ac-m-date" value="${wrIso(new Date())}"><input type="number" min="0" id="ac-m-min" placeholder="minutes"><input type="text" id="ac-m-note" placeholder="Ce qui a été réparé ou adapté">
        <button class="btn btn-sm" id="ac-m-add">${ICON.plus}<span>Ajouter</span></button>
      </div>
      <div style="margin-top:8px;font-size:12.5px;">${log.length ? log.slice(0, 12).map(m => `<div style="padding:2px 0;">${escapeHtml(wrFmt(m.date))} · ${escapeHtml(formatMin(Number(m.minutes) || 0))}${m.note ? ' · ' + escapeHtml(m.note) : ''}${m.by ? ` <span style="color:var(--text-muted);">(${escapeHtml(m.by)})</span>` : ''}</div>`).join('') : '<span style="color:var(--text-muted);font-style:italic;">Aucun temps de maintenance enregistré.</span>'}</div>
    </div>
  `, `
    <button class="btn" data-close-modal>Annuler</button>
    <button class="btn btn-primary" id="ac-save">Enregistrer</button>
  `, (body) => {
    const sync = () => {
      const st = body.querySelector('#ac-status').value;
      body.querySelector('#ac-status-hint').textContent = autoStatusMeta(st).desc;
      body.querySelector('#ac-manual-block').style.display = st === 'manual' ? '' : 'none';
    };
    body.querySelector('#ac-status').addEventListener('change', sync);
    sync();
    const persist = () => {
      setAutomationStatus(c, body.querySelector('#ac-status').value);
      c.automationRef = body.querySelector('#ac-ref').value.trim();
      c.manualReason = body.querySelector('#ac-manual').value.trim();
      c.automationGrid = {};
      body.querySelectorAll('[data-ac-grid]').forEach(i => { if (i.checked) c.automationGrid[i.dataset.acGrid] = true; });
      c.automationExecsPerMonth = body.querySelector('#ac-execs').value;
      c.automationDecision = body.querySelector('#ac-decision').value;
      c.automationReviewedAt = body.querySelector('#ac-reviewed').value || (c.automationDecision ? wrIso(new Date()) : '');
    };
    body.querySelector('#ac-m-add').onclick = () => {
      const minutes = Number(body.querySelector('#ac-m-min').value);
      if (!minutes) { toast('Indiquez les minutes de maintenance'); return; }
      persist();
      c.maintenanceLog = [...(c.maintenanceLog || []), {
        id: uid(), date: body.querySelector('#ac-m-date').value || wrIso(new Date()), minutes,
        note: body.querySelector('#ac-m-note').value.trim(), by: (QASession.username && QASession.username()) || '',
      }];
      save();
      openAutomationCaseModal(caseId);
    };
    document.getElementById('ac-save').onclick = () => {
      persist();
      save();
      closeModal();
      switchTab(currentTab || 'automation');
      toast('Automatisation enregistrée');
    };
  });
}
