/* Catalogue de tests — module « risks.js ».
   Fait partie de l'application principale (index.html). L'ordre de chargement
   des <script> compte : voir index.html. Ne pas ouvrir isolément. */
/* ===== Product risk analysis =====
   Plan qualité, semaine 5 : « Des risques notés en likelihood et impact, reliés aux test
   cases, pour prioriser et choisir les regression tests. »
   Modèle « Product risk analysis » : likelihood et impact de 1 à 3 ; risk level =
   likelihood × impact ; Élevé (6 ou 9), Moyen (3 ou 4), Faible (1 ou 2), chacun avec sa
   profondeur de test. Check-list : ST-02, ST-03, ST-04, ST-13, ST-15.
   - state.productRisks : {id, code, divisionId, domain, title, likelihood, impact,
     testCaseIds, technique, notes, createdAt, updatedAt}
   - state.settings.riskAnalysis : {participants, date, review} (« Notée avec [noms] le [date] »)
   - Priorité d'un test case = classe du risque le plus élevé qui le cite : P1, P2, P3. */

const RISK_CLASSES = [
  { id: 'high', label: 'Élevé', levels: '6 ou 9', priority: 'P1', badge: 'badge-danger', cell: '#F4D9D4',
    depth: 'Test techniques explicites, full regression des processus touchés, UAT sign-off obligatoire.' },
  { id: 'medium', label: 'Moyen', levels: '3 ou 4', priority: 'P2', badge: 'badge-warning', cell: '#F6E9C9',
    depth: 'Test cases prioritaires, targeted regression.' },
  { id: 'low', label: 'Faible', levels: '1 ou 2', priority: 'P3', badge: 'badge-muted', cell: '#E8F0EA',
    depth: 'Vérification du changement, smoke test.' },
];
const RISK_SCALE = [1, 2, 3];
/* Test techniques (check-list ST-17, ST-18, ST-19) : la réponse de test d'un risque élevé. */
const TEST_TECHNIQUES = [
  { id: 'equivalence', label: 'Partitions d’équivalence' },
  { id: 'boundary', label: 'Valeurs limites' },
  { id: 'decision_table', label: 'Table de décisions' },
  { id: 'state_transition', label: 'Transitions d’état' },
  { id: 'domain', label: 'Test de domaine' },
  { id: 'pairwise', label: 'Combinatoire par paires' },
  { id: 'crud', label: 'CRUD' },
  { id: 'scenario', label: 'Scénarios (cas d’utilisation)' },
  { id: 'metamorphic', label: 'Test métamorphique' },
  { id: 'exploratory', label: 'Exploratory testing (charte)' },
];
const RISK_CLASS_RANK = { high: 3, medium: 2, low: 1 };

const riskLevel = r => (Number(r.likelihood) || 0) * (Number(r.impact) || 0);
function riskClass(r) {
  const l = riskLevel(r);
  return l >= 6 ? 'high' : l >= 3 ? 'medium' : 'low';
}
const riskClassMeta = id => RISK_CLASSES.find(c => c.id === id) || RISK_CLASSES[2];
function risksForCase(caseId) {
  return (state.productRisks || []).filter(r => (r.testCaseIds || []).includes(caseId));
}
/* Classe du risque le plus élevé qui cite le test case (null si aucun). */
function caseRiskClass(caseId) {
  let best = null;
  risksForCase(caseId).forEach(r => {
    const c = riskClass(r);
    if (!best || RISK_CLASS_RANK[c] > RISK_CLASS_RANK[best]) best = c;
  });
  return best;
}
function casePriorityBadge(caseId) {
  const cls = caseRiskClass(caseId);
  if (!cls) return '';
  const m = riskClassMeta(cls);
  const codes = risksForCase(caseId).map(r => `${r.code} (${riskClassMeta(riskClass(r)).label.toLowerCase()})`).join(', ');
  return `<span class="badge ${m.badge}" title="Priorité dérivée du risque : ${escapeHtml(codes)}">${m.priority}</span>`;
}
function riskDomainLabel(r) {
  const d = r.divisionId && (state.businessDivisions || []).find(x => x.id === r.divisionId);
  return [d ? d.name : '', r.domain].filter(Boolean).join(' · ') || '—';
}
function nextRiskCode() {
  const n = (state.productRisks || []).reduce((m, r) => Math.max(m, parseInt(String(r.code || '').replace(/\D/g, ''), 10) || 0), 0) + 1;
  return 'R-' + String(n).padStart(2, '0');
}
/* Ce qui manque à la réponse de test d'un risque (modèle et S5-3, S5-6). */
function riskWarnings(r) {
  const w = [];
  const cases = (r.testCaseIds || []).map(id => state.testCases.find(c => c.id === id)).filter(Boolean);
  if (!cases.length) w.push('aucun test case lié');
  if (riskClass(r) === 'high') {
    if (cases.length && !cases.some(c => (c.types || []).includes('regression'))) w.push('aucun regression test case');
    if (!r.technique) w.push('test technique explicite à choisir');
  }
  return w;
}

function riskAnalysisTableHtml() {
  const cell = 'border:1px solid #ccc;padding:4px 8px;vertical-align:top;';
  const th = cell + 'background:#f4f5f7;text-align:left;';
  const ra = (state.settings || {}).riskAnalysis || {};
  const rows = (state.productRisks || []).slice().sort((a, b) => riskLevel(b) - riskLevel(a));
  return `
    <h1>Product risk analysis</h1>
    <p>Notée avec ${escapeHtml(ra.participants || '[noms]')} le ${ra.date ? wrFmt(ra.date) : '[date]'}. Likelihood et impact de 1 à 3 ; risk level = likelihood × impact.</p>
    <table style="border-collapse:collapse;"><thead><tr>${['Code', 'Domaine', 'Ce qui pourrait mal tourner', 'Likelihood', 'Impact', 'Risk level', 'Réponse de test'].map(h => `<th style="${th}">${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>
      <td style="${cell}">${escapeHtml(r.code)}</td><td style="${cell}">${escapeHtml(riskDomainLabel(r))}</td><td style="${cell}">${escapeHtml(r.title)}</td>
      <td style="${cell}">${r.likelihood}</td><td style="${cell}">${r.impact}</td><td style="${cell}">${riskLevel(r)} (${escapeHtml(riskClassMeta(riskClass(r)).label)})</td>
      <td style="${cell}">${(r.testCaseIds || []).length} test case(s)${r.technique ? ' · ' + escapeHtml((TEST_TECHNIQUES.find(t => t.id === r.technique) || {}).label || '') : ''}</td></tr>`).join('')}</tbody></table>
    <h2>Lecture</h2>
    <table style="border-collapse:collapse;"><thead><tr>${['Risk level', 'Classe', 'Profondeur de test'].map(h => `<th style="${th}">${h}</th>`).join('')}</tr></thead>
    <tbody>${RISK_CLASSES.map(c => `<tr><td style="${cell}">${c.levels}</td><td style="${cell}">${c.label}</td><td style="${cell}">${escapeHtml(c.depth)}</td></tr>`).join('')}</tbody></table>
    <p>Revue ${escapeHtml(ra.review || 'à chaque projet et au moins une fois par an')}.</p>`;
}

function riskAnalysisMarkdown() {
  const md = t => String(t == null ? '' : t).replace(/\|/g, '\\|');
  const ra = (state.settings || {}).riskAnalysis || {};
  const rows = (state.productRisks || []).slice().sort((a, b) => riskLevel(b) - riskLevel(a));
  return [
    '# Product risk analysis', '',
    `Notée avec ${ra.participants || '[noms]'} le ${ra.date ? wrFmt(ra.date) : '[date]'}. Likelihood et impact de 1 à 3 ; risk level = likelihood × impact.`, '',
    '| Code | Domaine | Ce qui pourrait mal tourner | Likelihood | Impact | Risk level | Réponse de test |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map(r => `| ${md(r.code)} | ${md(riskDomainLabel(r))} | ${md(r.title)} | ${r.likelihood} | ${r.impact} | ${riskLevel(r)} (${riskClassMeta(riskClass(r)).label}) | ${(r.testCaseIds || []).length} test case(s)${r.technique ? ' · ' + md((TEST_TECHNIQUES.find(t => t.id === r.technique) || {}).label) : ''} |`),
    '', '## Lecture', '',
    '| Risk level | Classe | Profondeur de test |', '| --- | --- | --- |',
    ...RISK_CLASSES.map(c => `| ${c.levels} | ${c.label} | ${c.depth} |`),
    '', `Revue ${ra.review || 'à chaque projet et au moins une fois par an'}.`,
  ].join('\n');
}

function renderRisks(view) {
  const risks = (state.productRisks || []).slice().sort((a, b) => riskLevel(b) - riskLevel(a) || String(a.code).localeCompare(String(b.code)));
  const ra = (state.settings || {}).riskAnalysis || {};
  const canEdit = !window.QAPerm || QAPerm.can('update', 'risks');
  const count = (l, i) => risks.filter(r => Number(r.likelihood) === l && Number(r.impact) === i).length;
  const td = 'padding:6px 8px;border-bottom:1px solid var(--border);vertical-align:top;';
  const th = td + 'text-align:left;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:0.04em;';
  const field = 'font:inherit;font-size:13px;padding:5px 8px;border:1px solid var(--border-strong);border-radius:var(--radius-sm);background:var(--surface);';

  view.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Risques</h1>
        <div class="subtitle">Product risk analysis : likelihood et impact de 1 à 3, risk level = likelihood × impact. Le risque fixe la profondeur de test et la priorité des test cases.</div>
      </div>
      <div class="actions">
        <button class="btn" id="risk-copy" ${risks.length ? '' : 'disabled'} title="Colle le tableau dans un wiki, un e-mail ou un document">Copier l’analyse</button>
        <button class="btn" id="risk-regression" ${risks.length ? '' : 'disabled'}>Choisir les regression tests</button>
        <button class="btn btn-primary" id="risk-add" data-perm="risks:create">${ICON.plus}<span>Nouveau risque</span></button>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;font-size:12.5px;">
        <label style="flex:2;min-width:200px;">Notée avec<br><input id="ra-participants" style="${field}width:100%;" value="${escapeHtml(ra.participants || '')}" placeholder="Rôles ou noms : métier, QA…" ${canEdit ? '' : 'disabled'}></label>
        <label style="flex:1;min-width:140px;">le<br><input type="date" id="ra-date" style="${field}width:100%;" value="${escapeHtml(ra.date || '')}" ${canEdit ? '' : 'disabled'}></label>
        <label style="flex:2;min-width:200px;">Revue<br><input id="ra-review" style="${field}width:100%;" value="${escapeHtml(ra.review || '')}" placeholder="à chaque projet et au moins une fois par an" ${canEdit ? '' : 'disabled'}></label>
        ${canEdit ? '<button class="btn btn-sm" id="ra-save">Enregistrer</button>' : ''}
      </div>
    </div>

    <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;margin-bottom:16px;">
      <div class="card" style="flex:0 0 auto;">
        <div style="font-size:12px;font-weight:600;color:var(--text-soft);margin-bottom:6px;">Matrice likelihood × impact</div>
        <table style="border-collapse:collapse;font-size:12.5px;">
          <tr><td></td>${RISK_SCALE.map(i => `<td style="padding:2px 8px;color:var(--text-muted);text-align:center;">Impact ${i}</td>`).join('')}</tr>
          ${RISK_SCALE.slice().reverse().map(l => `<tr><td style="padding:2px 8px;color:var(--text-muted);">Likelihood ${l}</td>${RISK_SCALE.map(i => {
            const cls = riskClassMeta(riskClass({ likelihood: l, impact: i }));
            const n = count(l, i);
            return `<td style="width:64px;height:40px;text-align:center;background:${cls.cell};border:1px solid var(--surface);font-weight:${n ? 700 : 400};color:${n ? 'var(--text)' : 'var(--text-muted)'};" title="${l * i} · ${cls.label}">${n || '·'}</td>`;
          }).join('')}</tr>`).join('')}
        </table>
      </div>
      <div class="card" style="flex:1;min-width:280px;">
        <div style="font-size:12px;font-weight:600;color:var(--text-soft);margin-bottom:6px;">Lecture</div>
        <table style="border-collapse:collapse;width:100%;font-size:12.5px;">
          ${RISK_CLASSES.map(c => `<tr><td style="${td}white-space:nowrap;">${c.levels}</td><td style="${td}"><span class="badge ${c.badge}">${c.label} · ${c.priority}</span></td><td style="${td}">${escapeHtml(c.depth)}</td>
            <td style="${td}white-space:nowrap;color:var(--text-muted);">${risks.filter(r => riskClass(r) === c.id).length} risque(s)</td></tr>`).join('')}
        </table>
      </div>
    </div>

    ${risks.length === 0 ? emptyState('Aucun risque', 'Notez les risques avec le métier : par domaine, ce qui pourrait mal tourner, likelihood et impact de 1 à 3.') : `
      <div class="card" style="overflow-x:auto;">
        <table style="border-collapse:collapse;width:100%;font-size:12.5px;">
          <thead><tr><th style="${th}">Code</th><th style="${th}">Domaine</th><th style="${th}">Ce qui pourrait mal tourner</th><th style="${th}">L</th><th style="${th}">I</th><th style="${th}">Risk level</th><th style="${th}">Réponse de test</th><th style="${th}"></th></tr></thead>
          <tbody>${risks.map(r => {
            const c = riskClassMeta(riskClass(r));
            const w = riskWarnings(r);
            const tech = TEST_TECHNIQUES.find(t => t.id === r.technique);
            return `<tr>
              <td style="${td}white-space:nowrap;"><strong>${escapeHtml(r.code)}</strong></td>
              <td style="${td}">${escapeHtml(riskDomainLabel(r))}</td>
              <td style="${td}">${escapeHtml(r.title)}</td>
              <td style="${td}">${r.likelihood}</td><td style="${td}">${r.impact}</td>
              <td style="${td}"><span class="badge ${c.badge}">${riskLevel(r)} · ${c.label}</span></td>
              <td style="${td}">${(r.testCaseIds || []).length} test case${(r.testCaseIds || []).length > 1 ? 's' : ''}${tech ? ` · ${escapeHtml(tech.label)}` : ''}
                ${w.length ? `<div style="color:#8a6a25;font-size:11.5px;margin-top:2px;">⚠ ${w.map(escapeHtml).join(' ; ')}</div>` : ''}</td>
              <td style="${td}"><div style="display:flex;gap:2px;justify-content:flex-end;">
                <button class="btn-icon btn-ghost" data-edit-risk="${r.id}" title="Modifier">${ICON.edit}</button>
                <button class="btn-icon btn-ghost" data-delete-risk="${r.id}" title="Supprimer">${ICON.trash}</button>
              </div></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>`}
  `;

  document.getElementById('risk-add').onclick = () => openRiskModal();
  view.querySelectorAll('[data-edit-risk]').forEach(b => b.onclick = () => openRiskModal(b.dataset.editRisk));
  view.querySelectorAll('[data-delete-risk]').forEach(b => b.onclick = () => {
    confirmDialog('Supprimer ce risque ? Les test cases liés perdent la priorité qu’il leur donnait.', () => {
      state.productRisks = (state.productRisks || []).filter(r => r.id !== b.dataset.deleteRisk);
      save();
      renderRisks(view);
      toast('Risque supprimé');
    });
  });
  if (risks.length) {
    document.getElementById('risk-copy').onclick = async () => {
      const ok = await copyRichText(riskAnalysisTableHtml(), riskAnalysisMarkdown());
      toast(ok ? 'Analyse copiée : collez-la dans votre wiki' : 'Copie impossible');
    };
    document.getElementById('risk-regression').onclick = () => openRiskRegressionModal();
  }
  if (canEdit) document.getElementById('ra-save').onclick = () => {
    if (!state.settings) state.settings = {};
    state.settings.riskAnalysis = {
      participants: document.getElementById('ra-participants').value.trim(),
      date: document.getElementById('ra-date').value,
      review: document.getElementById('ra-review').value.trim(),
    };
    save();
    toast('Analyse enregistrée');
  };
}

function openRiskModal(id) {
  const existing = (state.productRisks || []).find(r => r.id === id);
  const risk = existing ? JSON.parse(JSON.stringify(existing)) : {
    id: uid(), code: nextRiskCode(), divisionId: '', domain: '', title: '', likelihood: 2, impact: 2,
    testCaseIds: [], technique: '', notes: '', createdAt: new Date().toISOString(),
  };
  const divisions = state.businessDivisions || [];
  const sel = (id2, values, current, labelOf) => `<select id="${id2}">${values.map(x => `<option value="${x}" ${String(current) === String(x) ? 'selected' : ''}>${escapeHtml(labelOf(x))}</option>`).join('')}</select>`;
  const cases = [...state.testCases].sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  openModal(existing ? `Risque ${risk.code}` : 'Nouveau risque', `
    <div class="form-row">
      <div class="form-group">
        <label class="field-label">Domaine ${divisions.length ? '<span class="hint">division métier</span>' : ''}</label>
        ${divisions.length ? `<select id="rk-division"><option value="">—</option>${divisions.map(d => `<option value="${d.id}" ${risk.divisionId === d.id ? 'selected' : ''}>${escapeHtml(d.name)}</option>`).join('')}</select>` : ''}
        <input type="text" id="rk-domain" value="${escapeHtml(risk.domain || '')}" placeholder="Système, processus ou interface" style="margin-top:${divisions.length ? '6px' : '0'};">
      </div>
      <div class="form-group">
        <label class="field-label">Code</label>
        <input type="text" id="rk-code" value="${escapeHtml(risk.code)}">
      </div>
    </div>
    <div class="form-group">
      <label class="field-label">Ce qui pourrait mal tourner <span class="required">*</span></label>
      <textarea id="rk-title" rows="2" placeholder="Processus et défaillance : par exemple, une facture émise avec un mauvais montant">${escapeHtml(risk.title || '')}</textarea>
    </div>
    <div class="form-row form-row-3">
      <div class="form-group"><label class="field-label">Likelihood <span class="hint">1 à 3</span></label>${sel('rk-l', RISK_SCALE, risk.likelihood, x => String(x))}</div>
      <div class="form-group"><label class="field-label">Impact <span class="hint">1 à 3</span></label>${sel('rk-i', RISK_SCALE, risk.impact, x => String(x))}</div>
      <div class="form-group"><label class="field-label">Risk level</label><div id="rk-level" style="padding-top:6px;"></div></div>
    </div>
    <div id="rk-depth" style="font-size:12px;color:var(--text-soft);margin:-6px 0 12px;"></div>
    <div class="form-group">
      <label class="field-label">Test technique explicite <span class="hint">obligatoire pour un risque élevé (S5-3)</span></label>
      <select id="rk-technique"><option value="">—</option>${TEST_TECHNIQUES.map(t => `<option value="${t.id}" ${risk.technique === t.id ? 'selected' : ''}>${escapeHtml(t.label)}</option>`).join('')}</select>
    </div>
    <div class="form-group">
      <label class="field-label">Test cases qui couvrent ce risque <span class="hint">ils prennent la priorité du risque</span></label>
      <div class="picker-filter"><input type="text" id="rk-search" placeholder="Rechercher un test case…">
        <select id="rk-only"><option value="">Tous</option><option value="linked">Uniquement liés</option></select></div>
      <div class="picker" id="rk-cases" style="max-height:220px;">
        ${cases.map(c => `<label class="picker-item" data-title="${escapeHtml((c.title || '').toLowerCase())}">
          <input type="checkbox" value="${c.id}" ${(risk.testCaseIds || []).includes(c.id) ? 'checked' : ''}>
          <span>${escapeHtml(c.title || '(sans titre)')}</span>
          <span class="meta">${(c.types || []).includes('regression') ? 'regression' : ''}</span>
        </label>`).join('')}
      </div>
      <div class="picker-count" id="rk-count"></div>
    </div>
    <div class="form-group">
      <label class="field-label">Notes</label>
      <textarea id="rk-notes" rows="2">${escapeHtml(risk.notes || '')}</textarea>
    </div>
  `, `
    <button class="btn" data-close-modal>Annuler</button>
    <button class="btn btn-primary" id="rk-save">${existing ? 'Enregistrer' : 'Créer'}</button>
  `, (body) => {
    const refreshLevel = () => {
      const r = { likelihood: +body.querySelector('#rk-l').value, impact: +body.querySelector('#rk-i').value };
      const c = riskClassMeta(riskClass(r));
      body.querySelector('#rk-level').innerHTML = `<span class="badge ${c.badge}">${riskLevel(r)} · ${c.label} · ${c.priority}</span>`;
      body.querySelector('#rk-depth').textContent = `Profondeur de test : ${c.depth}`;
    };
    body.querySelector('#rk-l').onchange = refreshLevel;
    body.querySelector('#rk-i').onchange = refreshLevel;
    refreshLevel();
    const filter = () => {
      const term = body.querySelector('#rk-search').value.toLowerCase().trim();
      const only = body.querySelector('#rk-only').value;
      let shown = 0;
      body.querySelectorAll('#rk-cases .picker-item').forEach(item => {
        const checked = item.querySelector('input').checked;
        const show = (!term || item.dataset.title.includes(term)) && (only !== 'linked' || checked);
        item.style.display = show ? '' : 'none';
        if (show) shown++;
      });
      const n = body.querySelectorAll('#rk-cases input:checked').length;
      body.querySelector('#rk-count').innerHTML = `<span>${n} test case${n > 1 ? 's' : ''} lié${n > 1 ? 's' : ''}</span><span>${shown} affiché${shown > 1 ? 's' : ''}</span>`;
    };
    body.querySelector('#rk-search').addEventListener('input', filter);
    body.querySelector('#rk-only').addEventListener('change', filter);
    body.querySelectorAll('#rk-cases input').forEach(i => i.addEventListener('change', filter));
    filter();

    document.getElementById('rk-save').onclick = () => {
      risk.title = body.querySelector('#rk-title').value.trim();
      if (!risk.title) { toast('Décrivez ce qui pourrait mal tourner'); return; }
      risk.code = body.querySelector('#rk-code').value.trim() || nextRiskCode();
      risk.divisionId = body.querySelector('#rk-division') ? body.querySelector('#rk-division').value : '';
      risk.domain = body.querySelector('#rk-domain').value.trim();
      risk.likelihood = +body.querySelector('#rk-l').value;
      risk.impact = +body.querySelector('#rk-i').value;
      risk.technique = body.querySelector('#rk-technique').value;
      risk.testCaseIds = Array.from(body.querySelectorAll('#rk-cases input:checked')).map(i => i.value);
      risk.notes = body.querySelector('#rk-notes').value.trim();
      risk.updatedAt = new Date().toISOString();
      if (!Array.isArray(state.productRisks)) state.productRisks = [];
      const i = state.productRisks.findIndex(r => r.id === risk.id);
      if (i >= 0) state.productRisks[i] = risk; else state.productRisks.push(risk);
      save();
      closeModal();
      switchTab('risks');
      toast(existing ? 'Risque modifié' : 'Risque créé');
    };
  });
}

/* Choisir les regression tests par le risque (S5-6, ST-15) : un test plan de régression
   composé des test cases des risques retenus, du plus risqué au moins risqué. */
function openRiskRegressionModal() {
  const divisions = state.businessDivisions || [];
  openModal('Choisir les regression tests par le risque', `
    <p style="margin:0 0 10px;font-size:12.5px;color:var(--text-soft);">Plan qualité, S5-6 : « Choisir les regression tests par le risque : chaque risque élevé a ses regression test cases. »</p>
    <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:13px;margin-bottom:8px;">
      ${RISK_CLASSES.map(c => `<label style="display:flex;gap:6px;align-items:center;"><input type="checkbox" data-rr-class="${c.id}" ${c.id !== 'low' ? 'checked' : ''}> ${c.label} (${c.priority})</label>`).join('')}
      ${divisions.length ? `<select id="rr-division" style="font-size:12.5px;"><option value="">Tous les domaines</option>${divisions.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('')}</select>` : ''}
    </div>
    <div id="rr-list" style="max-height:260px;overflow:auto;border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 10px;font-size:12.5px;"></div>
    <div class="form-row" style="margin-top:12px;">
      <div class="form-group"><label class="field-label">Titre du test plan</label><input type="text" id="rr-title" value="Regression par le risque · ${wrFmt(wrIso(new Date()))}"></div>
      <div class="form-group"><label class="field-label">Nature</label>
        <select id="rr-kind">${CR_PLAN_KINDS.filter(k => k.id !== 'change').map(k => `<option value="${k.id}" ${k.id === 'targeted' ? 'selected' : ''}>${k.label}</option>`).join('')}</select></div>
    </div>
    <label style="display:flex;gap:8px;align-items:center;font-size:12.5px;"><input type="checkbox" id="rr-mark" checked> Donner aussi le type « Régression » à ces test cases</label>
  `, `
    <button class="btn" data-close-modal>Annuler</button>
    <button class="btn btn-primary" id="rr-create" data-perm="testplans:create">Créer le test plan</button>
  `, (body) => {
    let selected = [];
    const compute = () => {
      const classes = Array.from(body.querySelectorAll('[data-rr-class]:checked')).map(i => i.dataset.rrClass);
      const div = body.querySelector('#rr-division') ? body.querySelector('#rr-division').value : '';
      const byCase = new Map();
      (state.productRisks || [])
        .filter(r => classes.includes(riskClass(r)) && (!div || r.divisionId === div))
        .forEach(r => (r.testCaseIds || []).forEach(cid => {
          const prev = byCase.get(cid);
          if (!prev || riskLevel(r) > riskLevel(prev)) byCase.set(cid, r);
        }));
      selected = Array.from(byCase.entries())
        .map(([cid, r]) => ({ c: state.testCases.find(x => x.id === cid), r }))
        .filter(x => x.c)
        .sort((a, b) => riskLevel(b.r) - riskLevel(a.r) || (a.c.title || '').localeCompare(b.c.title || ''));
      body.querySelector('#rr-list').innerHTML = selected.length
        ? `<div style="color:var(--text-muted);margin-bottom:4px;">${selected.length} test case${selected.length > 1 ? 's' : ''}, du plus risqué au moins risqué</div>`
          + selected.map(x => `<div style="padding:2px 0;"><span class="badge ${riskClassMeta(riskClass(x.r)).badge}">${riskClassMeta(riskClass(x.r)).priority}</span> ${escapeHtml(x.c.title || '(sans titre)')} <span style="color:var(--text-muted);">· ${escapeHtml(x.r.code)}</span></div>`).join('')
        : '<div style="color:var(--text-muted);font-style:italic;">Aucun test case lié aux risques retenus.</div>';
    };
    body.querySelectorAll('[data-rr-class]').forEach(i => i.addEventListener('change', compute));
    if (body.querySelector('#rr-division')) body.querySelector('#rr-division').addEventListener('change', compute);
    compute();
    document.getElementById('rr-create').onclick = () => {
      if (!selected.length) { toast('Aucun test case à mettre dans le plan'); return; }
      const plan = {
        id: uid(), title: body.querySelector('#rr-title').value.trim() || 'Regression par le risque',
        items: selected.map(x => ({ type: 'case', id: x.c.id })), divisionIds: [],
        kind: body.querySelector('#rr-kind').value,
      };
      state.testPlans.push(plan);
      if (body.querySelector('#rr-mark').checked) {
        selected.forEach(x => { if (!(x.c.types || []).includes('regression')) x.c.types = [...(x.c.types || []), 'regression']; });
      }
      save();
      closeModal();
      switchTab('testplans');
      toast(`Test plan créé : ${selected.length} test cases`);
    };
  });
}
