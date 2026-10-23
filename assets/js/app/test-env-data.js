/* Catalogue de tests — module « test-env-data.js ».
   Fait partie de l'application principale (index.html). L'ordre de chargement
   des <script> compte : voir index.html. Ne pas ouvrir isolément. */
/* ===== Test environments et test data (plan qualité, semaine 6) =====
   « Un journal d'indisponibilité par test environment et un circuit de test data request. »
   - Modèle « Test environment : fiche » : les champs de la fiche sont sur l'environnement
     (openEnvironmentModal) ; env.outages = journal d'indisponibilité {date, hours, cause,
     blockedTests, lostDays} (S6-2).
   - Modèle « Test data request » : state.testDataRequests, avec un circuit Demandée →
     En préparation → Fournie (ou Refusée) et le retard sur le délai annoncé (S6-5) ;
     settings.testData = {usualDelayDays, sendTo}.
   - Catalogue des test data sets par processus : state.testDataSets (S6-4). */

const TDR_STATUSES = [
  { id: 'requested', label: 'Demandée', badge: 'badge-accent', open: true },
  { id: 'in_progress', label: 'En préparation', badge: 'badge-primary', open: true },
  { id: 'delivered', label: 'Fournie', badge: 'badge-success', open: false },
  { id: 'refused', label: 'Refusée', badge: 'badge-muted', open: false },
];
const tdrStatusMeta = id => TDR_STATUSES.find(s => s.id === id) || TDR_STATUSES[0];
const tdSettings = () => ((state.settings || {}).testData || {});

/* Ajoute n jours ouvrés (lundi à vendredi) à une date AAAA-MM-JJ. */
function addBusinessDays(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  let left = Math.max(0, Math.round(Number(n) || 0));
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left--;
  }
  return wrIso(d);
}
/* Échéance : la date de besoin, sinon la demande + le délai habituel annoncé. */
function tdrDueDate(r) {
  if (r.neededBy) return r.neededBy;
  const delay = tdSettings().usualDelayDays;
  return r.requestedAt && delay !== '' && delay != null ? addBusinessDays(r.requestedAt, delay) : '';
}
/* En retard : pas fournie à l'échéance, ou fournie après. refIso = aujourd'hui par défaut. */
function tdrLate(r, refIso) {
  const due = tdrDueDate(r);
  if (!due || r.status === 'refused') return false;
  if (r.status === 'delivered') return !!r.deliveredAt && r.deliveredAt > due;
  return (refIso || wrIso(new Date())) > due;
}
function nextTdrNumber() {
  const n = (state.testDataRequests || []).reduce((m, r) => Math.max(m, parseInt(String(r.number || '').replace(/\D/g, ''), 10) || 0), 0) + 1;
  return 'TDR-' + String(n).padStart(3, '0');
}
function envTitle(id) { return ((state.environments || []).find(e => e.id === id) || {}).title || '—'; }
function tdrForWhat(r) {
  const p = r.projectId && (state.projects || []).find(x => x.id === r.projectId);
  const pl = r.planId && state.testPlans.find(x => x.id === r.planId);
  return [p ? p.name : '', pl ? planDisplayTitle(pl) : '', r.forWhat].filter(Boolean).join(' · ') || '—';
}

/* ---------- Journal d'indisponibilité d'un test environment (S6-2) ---------- */
function envOutagesIn(env, fromIso, toIso) {
  return (env.outages || []).filter(o => o.date && o.date >= fromIso && o.date <= toIso);
}

function openEnvOutagesModal(envId) {
  const env = (state.environments || []).find(e => e.id === envId);
  if (!env) return;
  const canEdit = !window.QAPerm || QAPerm.can('update', 'environments');
  const list = (env.outages || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const td = 'padding:6px 8px;border-bottom:1px solid var(--border);vertical-align:top;';
  const th = td + 'text-align:left;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:0.04em;';
  const field = 'font:inherit;font-size:13px;padding:5px 8px;border:1px solid var(--border-strong);border-radius:var(--radius-sm);background:var(--surface);width:100%;';
  const month = wrIso(new Date()).slice(0, 7);
  const thisMonth = list.filter(o => String(o.date).startsWith(month));
  openModal(`Journal d’indisponibilité · ${env.title}`, `
    <p style="margin:0 0 10px;font-size:12.5px;color:var(--text-soft);">Ce mois : ${thisMonth.length} indisponibilité${thisMonth.length > 1 ? 's' : ''}, ${thisMonth.reduce((a, o) => a + (Number(o.hours) || 0), 0)} h, ${thisMonth.reduce((a, o) => a + (Number(o.lostDays) || 0), 0)} jour(s) de test perdus.</p>
    ${canEdit ? `
      <div style="display:grid;grid-template-columns:130px 80px 1fr 1fr 90px auto;gap:6px;align-items:end;font-size:11.5px;color:var(--text-soft);margin-bottom:10px;">
        <label>Date<input type="date" id="eo-date" style="${field}" value="${wrIso(new Date())}"></label>
        <label>Durée (h)<input type="number" id="eo-hours" min="0" step="0.5" style="${field}"></label>
        <label>Cause<input id="eo-cause" style="${field}" placeholder="Refresh, panne, déploiement…"></label>
        <label>Tests bloqués<input id="eo-blocked" style="${field}" placeholder="Test cases, campagne…"></label>
        <label>Jours perdus<input type="number" id="eo-lost" min="0" step="0.5" style="${field}"></label>
        <button class="btn btn-sm" id="eo-add">${ICON.plus}<span>Ajouter</span></button>
      </div>` : ''}
    ${list.length === 0 ? '<p style="font-size:12.5px;color:var(--text-muted);font-style:italic;">Aucune indisponibilité enregistrée.</p>' : `
      <table style="border-collapse:collapse;width:100%;font-size:12.5px;">
        <thead><tr><th style="${th}">Date</th><th style="${th}">Durée</th><th style="${th}">Cause</th><th style="${th}">Tests bloqués</th><th style="${th}">Jours perdus</th><th style="${th}"></th></tr></thead>
        <tbody>${list.map(o => `<tr>
          <td style="${td}white-space:nowrap;">${escapeHtml(wrFmt(o.date))}</td><td style="${td}">${o.hours ? escapeHtml(o.hours) + ' h' : '–'}</td>
          <td style="${td}">${escapeHtml(o.cause || '')}</td><td style="${td}">${escapeHtml(o.blockedTests || '')}</td><td style="${td}">${o.lostDays ? escapeHtml(o.lostDays) : '–'}</td>
          <td style="${td}text-align:right;">${canEdit ? `<button class="btn-icon btn-ghost" data-eo-delete="${escapeHtml(o.id)}" title="Supprimer">${ICON.trash}</button>` : ''}</td>
        </tr>`).join('')}</tbody>
      </table>`}
  `, `<button class="btn" data-close-modal>Fermer</button>`);
  if (!canEdit) return;
  document.getElementById('eo-add').onclick = () => {
    const entry = {
      id: uid(),
      date: document.getElementById('eo-date').value,
      hours: document.getElementById('eo-hours').value,
      cause: document.getElementById('eo-cause').value.trim(),
      blockedTests: document.getElementById('eo-blocked').value.trim(),
      lostDays: document.getElementById('eo-lost').value,
    };
    if (!entry.date || !entry.cause) { toast('Indiquez au moins la date et la cause'); return; }
    env.outages = [...(env.outages || []), entry];
    save();
    openEnvOutagesModal(envId);
  };
  document.querySelectorAll('[data-eo-delete]').forEach(b => b.onclick = () => {
    env.outages = (env.outages || []).filter(o => o.id !== b.dataset.eoDelete);
    save();
    openEnvOutagesModal(envId);
  });
}

/* Fiche d'un test environment (modèle), à coller dans un wiki. */
function envFicheHtml(env) {
  const cell = 'border:1px solid #ccc;padding:4px 8px;vertical-align:top;';
  const rows = [
    ['Nom', env.title], ['Rôle', env.role], ['Responsable', env.owner], ['Systèmes et versions', env.systems],
    ['Interfaces', env.interfaces], ['Dernier refresh', (env.lastRefresh ? wrFmt(env.lastRefresh) : '') + (env.refreshFrequency ? ` ; fréquence : ${env.refreshFrequency}` : '')],
    ['Écarts connus avec la production', env.prodGaps], ['Règles d’utilisation', env.usageRules],
  ];
  const outages = (env.outages || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return `<h1>Test environment : ${escapeHtml(env.title)}</h1>
    <table style="border-collapse:collapse;"><tbody>${rows.map(([k, v]) => `<tr><th style="${cell}background:#f4f5f7;text-align:left;">${escapeHtml(k)}</th><td style="${cell}">${escapeHtml(v || '')}</td></tr>`).join('')}</tbody></table>
    <h2>Journal d’indisponibilité</h2>
    ${outages.length ? `<table style="border-collapse:collapse;"><thead><tr>${['Date', 'Durée', 'Cause', 'Tests bloqués'].map(h => `<th style="${cell}background:#f4f5f7;text-align:left;">${h}</th>`).join('')}</tr></thead>
      <tbody>${outages.map(o => `<tr><td style="${cell}">${escapeHtml(wrFmt(o.date))}</td><td style="${cell}">${o.hours ? escapeHtml(o.hours) + ' h' : ''}</td><td style="${cell}">${escapeHtml(o.cause || '')}</td><td style="${cell}">${escapeHtml(o.blockedTests || '')}</td></tr>`).join('')}</tbody></table>` : '<p>Aucune indisponibilité enregistrée.</p>'}`;
}
function envFicheMarkdown(env) {
  const md = t => String(t == null ? '' : t).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const outages = (env.outages || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return [
    `# Test environment : ${env.title}`, '', '| Rubrique | Valeur |', '| --- | --- |',
    ...[['Nom', env.title], ['Rôle', env.role], ['Responsable', env.owner], ['Systèmes et versions', env.systems], ['Interfaces', env.interfaces],
      ['Dernier refresh', (env.lastRefresh ? wrFmt(env.lastRefresh) : '') + (env.refreshFrequency ? ` ; fréquence : ${env.refreshFrequency}` : '')],
      ['Écarts connus avec la production', env.prodGaps], ['Règles d’utilisation', env.usageRules]].map(([k, v]) => `| ${k} | ${md(v)} |`),
    '', '## Journal d’indisponibilité', '',
    ...(outages.length ? ['| Date | Durée | Cause | Tests bloqués |', '| --- | --- | --- | --- |', ...outages.map(o => `| ${wrFmt(o.date)} | ${o.hours ? o.hours + ' h' : ''} | ${md(o.cause)} | ${md(o.blockedTests)} |`)] : ['Aucune indisponibilité enregistrée.']),
  ].join('\n');
}

/* ---------- Test data : circuit des demandes et catalogue (S6-4, S6-5) ---------- */
function renderTestDataCircuit(container) {
  if (!container) return;
  const canEdit = !window.QAPerm || QAPerm.can('update', 'dataTables');
  const s = tdSettings();
  const reqs = (state.testDataRequests || []).slice().sort((a, b) => {
    const ao = tdrStatusMeta(a.status).open ? 0 : 1, bo = tdrStatusMeta(b.status).open ? 0 : 1;
    return ao - bo || String(b.requestedAt).localeCompare(String(a.requestedAt));
  });
  const sets = (state.testDataSets || []).slice().sort((a, b) => String(a.process).localeCompare(String(b.process)));
  const open = reqs.filter(r => tdrStatusMeta(r.status).open);
  const late = reqs.filter(r => tdrLate(r));
  const td = 'padding:6px 8px;border-bottom:1px solid var(--border);vertical-align:top;';
  const th = td + 'text-align:left;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:0.04em;';
  const field = 'font:inherit;font-size:13px;padding:5px 8px;border:1px solid var(--border-strong);border-radius:var(--radius-sm);background:var(--surface);';
  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">
        <div>
          <h3 style="font-size:15px;margin:0 0 4px;">Test data requests</h3>
          <div style="font-size:12.5px;color:var(--text-soft);">${open.length} en cours${late.length ? ` · <span style="color:#8a3a2c;font-weight:600;">${late.length} en retard</span>` : ''} · aucune donnée réelle de client sans anonymisation.</div>
        </div>
        <button class="btn btn-primary btn-sm" id="tdr-add" data-perm="dataTables:create">${ICON.plus}<span>Nouvelle demande</span></button>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;font-size:12.5px;margin:10px 0;">
        <label>Délai habituel (jours ouvrés)<br><input type="number" min="0" id="tds-delay" style="${field}width:110px;" value="${escapeHtml(s.usualDelayDays != null ? s.usualDelayDays : '')}" ${canEdit ? '' : 'disabled'}></label>
        <label style="flex:1;min-width:200px;">À envoyer à<br><input id="tds-send" style="${field}width:100%;" value="${escapeHtml(s.sendTo || '')}" placeholder="Personne ou canal" ${canEdit ? '' : 'disabled'}></label>
        ${canEdit ? '<button class="btn btn-sm" id="tds-save">Enregistrer</button>' : ''}
      </div>
      ${reqs.length === 0 ? '<p style="font-size:12.5px;color:var(--text-muted);font-style:italic;margin:0;">Aucune demande.</p>' : `
        <div style="overflow-x:auto;"><table style="border-collapse:collapse;width:100%;font-size:12.5px;">
          <thead><tr><th style="${th}">N°</th><th style="${th}">Pour quel test</th><th style="${th}">Environment</th><th style="${th}">Objets nécessaires</th><th style="${th}">Échéance</th><th style="${th}">Statut</th><th style="${th}"></th></tr></thead>
          <tbody>${reqs.map(r => {
            const st = tdrStatusMeta(r.status);
            const isLate = tdrLate(r);
            return `<tr>
              <td style="${td}white-space:nowrap;"><strong>${escapeHtml(r.number)}</strong></td>
              <td style="${td}">${escapeHtml(tdrForWhat(r))}</td>
              <td style="${td}">${escapeHtml(envTitle(r.environmentId))}</td>
              <td style="${td}">${escapeHtml(r.objects || '')}</td>
              <td style="${td}white-space:nowrap;">${tdrDueDate(r) ? escapeHtml(wrFmt(tdrDueDate(r))) : '–'}</td>
              <td style="${td}"><span class="badge ${st.badge}">${st.label}</span>${isLate ? ' <span class="badge badge-danger">En retard</span>' : ''}</td>
              <td style="${td}text-align:right;"><button class="btn btn-sm" data-tdr-open="${escapeHtml(r.id)}">Ouvrir</button></td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>`}
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">
        <div>
          <h3 style="font-size:15px;margin:0 0 4px;">Catalogue des test data sets</h3>
          <div style="font-size:12.5px;color:var(--text-soft);">Par processus métier : quels objets, comment les obtenir, qui les fournit, en combien de temps.</div>
        </div>
        <button class="btn btn-sm" id="tds-add-set" data-perm="dataTables:create">${ICON.plus}<span>Ajouter un data set</span></button>
      </div>
      ${sets.length === 0 ? '<p style="font-size:12.5px;color:var(--text-muted);font-style:italic;margin:10px 0 0;">Aucun data set décrit.</p>' : `
        <div style="overflow-x:auto;margin-top:10px;"><table style="border-collapse:collapse;width:100%;font-size:12.5px;">
          <thead><tr><th style="${th}">Processus</th><th style="${th}">Objets</th><th style="${th}">Comment les obtenir</th><th style="${th}">Qui</th><th style="${th}">Délai</th><th style="${th}"></th></tr></thead>
          <tbody>${sets.map(x => `<tr>
            <td style="${td}"><strong>${escapeHtml(x.process || '')}</strong></td><td style="${td}">${escapeHtml(x.objects || '')}</td>
            <td style="${td}">${escapeHtml(x.howToGet || '')}</td><td style="${td}">${escapeHtml(x.provider || '')}</td><td style="${td}">${escapeHtml(x.leadTime || '')}</td>
            <td style="${td}text-align:right;"><button class="btn-icon btn-ghost" data-tds-edit="${escapeHtml(x.id)}" title="Modifier">${ICON.edit}</button></td>
          </tr>`).join('')}</tbody>
        </table></div>`}
    </div>`;

  container.querySelector('#tdr-add').onclick = () => openTestDataRequestModal(null);
  container.querySelectorAll('[data-tdr-open]').forEach(b => b.onclick = () => openTestDataRequestModal(b.dataset.tdrOpen));
  container.querySelector('#tds-add-set').onclick = () => openTestDataSetModal(null);
  container.querySelectorAll('[data-tds-edit]').forEach(b => b.onclick = () => openTestDataSetModal(b.dataset.tdsEdit));
  if (canEdit) container.querySelector('#tds-save').onclick = () => {
    if (!state.settings) state.settings = {};
    state.settings.testData = {
      usualDelayDays: container.querySelector('#tds-delay').value,
      sendTo: container.querySelector('#tds-send').value.trim(),
    };
    save();
    toast('Circuit des test data enregistré');
    renderTestDataCircuit(container);
  };
}

function testDataRequestText(r) {
  return [
    `Test data request ${r.number}`,
    `Pour quel test : ${tdrForWhat(r)}`,
    `Test environment : ${envTitle(r.environmentId)}`,
    `Objets métier nécessaires : ${r.objects || ''}`,
    `Date de besoin : ${r.neededBy ? wrFmt(r.neededBy) : '–'}`,
    `Durée d’utilisation : ${r.usageDuration || '–'}`,
    `Les données seront-elles modifiées ou consommées ? ${r.consumed === 'yes' ? 'oui' : r.consumed === 'no' ? 'non' : '–'}`,
    'Confidentialité : aucune donnée réelle de client sans anonymisation.',
    `Demandeur : ${r.requester || ''}`,
    `Fournisseur des données : ${r.provider || ''}`,
  ].join('\n');
}

function openTestDataRequestModal(id) {
  const existing = (state.testDataRequests || []).find(r => r.id === id);
  const r = existing ? JSON.parse(JSON.stringify(existing)) : {
    id: uid(), number: nextTdrNumber(), status: 'requested', projectId: '', planId: '', forWhat: '', environmentId: '',
    objects: '', neededBy: '', usageDuration: '', consumed: '', confidentialityOk: false,
    requester: (QASession.username && QASession.username()) || '', provider: '', requestedAt: wrIso(new Date()), deliveredAt: '', note: '',
  };
  const opts = (list, cur) => '<option value="">—</option>' + list.map(x => `<option value="${x.id}" ${cur === x.id ? 'selected' : ''}>${escapeHtml(x.label)}</option>`).join('');
  const s = tdSettings();
  openModal(`Test data request ${r.number}`, `
    ${s.usualDelayDays !== '' && s.usualDelayDays != null || s.sendTo ? `<p style="margin:0 0 10px;font-size:12.5px;color:var(--text-soft);">Délai habituel : ${escapeHtml(s.usualDelayDays || '–')} jour(s) ouvré(s). À envoyer à : ${escapeHtml(s.sendTo || '–')}.</p>` : ''}
    <div class="form-row">
      <div class="form-group"><label class="field-label">Pour quel test : projet</label><select id="tdr-project">${opts((state.projects || []).map(p => ({ id: p.id, label: p.name })), r.projectId)}</select></div>
      <div class="form-group"><label class="field-label">Test plan</label><select id="tdr-plan">${opts(state.testPlans.map(p => ({ id: p.id, label: planDisplayTitle(p) })), r.planId)}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="field-label">Changement ou test case</label><input id="tdr-for" value="${escapeHtml(r.forWhat)}"></div>
      <div class="form-group"><label class="field-label">Test environment</label><select id="tdr-env">${opts((state.environments || []).map(e => ({ id: e.id, label: e.title })), r.environmentId)}</select></div>
    </div>
    <div class="form-group"><label class="field-label">Objets métier nécessaires <span class="required">*</span> <span class="hint">type, nombre, caractéristiques</span></label><textarea id="tdr-objects" rows="2">${escapeHtml(r.objects)}</textarea></div>
    <div class="form-row form-row-3">
      <div class="form-group"><label class="field-label">Date de besoin</label><input type="date" id="tdr-needed" value="${escapeHtml(r.neededBy)}"></div>
      <div class="form-group"><label class="field-label">Durée d’utilisation</label><input id="tdr-duration" value="${escapeHtml(r.usageDuration)}" placeholder="Ex. 2 semaines"></div>
      <div class="form-group"><label class="field-label">Modifiées ou consommées ?</label><select id="tdr-consumed"><option value="">—</option><option value="yes" ${r.consumed === 'yes' ? 'selected' : ''}>Oui</option><option value="no" ${r.consumed === 'no' ? 'selected' : ''}>Non</option></select></div>
    </div>
    <label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:0 0 12px;"><input type="checkbox" id="tdr-confidential" ${r.confidentialityOk ? 'checked' : ''}> Confidentialité : aucune donnée réelle de client sans anonymisation <span class="required">*</span></label>
    <div class="form-row">
      <div class="form-group"><label class="field-label">Demandeur</label><input id="tdr-requester" value="${escapeHtml(r.requester)}"></div>
      <div class="form-group"><label class="field-label">Fournisseur des données</label><input id="tdr-provider" value="${escapeHtml(r.provider)}"></div>
    </div>
    <div class="form-row form-row-3">
      <div class="form-group"><label class="field-label">Demandée le</label><input type="date" id="tdr-requested" value="${escapeHtml(r.requestedAt)}"></div>
      <div class="form-group"><label class="field-label">Statut</label><select id="tdr-status">${TDR_STATUSES.map(x => `<option value="${x.id}" ${r.status === x.id ? 'selected' : ''}>${x.label}</option>`).join('')}</select></div>
      <div class="form-group"><label class="field-label">Fournie le</label><input type="date" id="tdr-delivered" value="${escapeHtml(r.deliveredAt)}"></div>
    </div>
    <div class="form-group"><label class="field-label">Note</label><textarea id="tdr-note" rows="2">${escapeHtml(r.note)}</textarea></div>
  `, `
    <button class="btn" data-close-modal>Annuler</button>
    ${existing ? '<button class="btn btn-danger" id="tdr-delete" data-perm="dataTables:delete">Supprimer</button>' : ''}
    <button class="btn" id="tdr-copy" title="Le texte de la demande, à envoyer par e-mail ou dans un ticket">Copier la demande</button>
    <button class="btn btn-primary" id="tdr-save">Enregistrer</button>
  `, (body) => {
    const read = () => {
      r.projectId = body.querySelector('#tdr-project').value;
      r.planId = body.querySelector('#tdr-plan').value;
      r.forWhat = body.querySelector('#tdr-for').value.trim();
      r.environmentId = body.querySelector('#tdr-env').value;
      r.objects = body.querySelector('#tdr-objects').value.trim();
      r.neededBy = body.querySelector('#tdr-needed').value;
      r.usageDuration = body.querySelector('#tdr-duration').value.trim();
      r.consumed = body.querySelector('#tdr-consumed').value;
      r.confidentialityOk = body.querySelector('#tdr-confidential').checked;
      r.requester = body.querySelector('#tdr-requester').value.trim();
      r.provider = body.querySelector('#tdr-provider').value.trim();
      r.requestedAt = body.querySelector('#tdr-requested').value || r.requestedAt;
      r.status = body.querySelector('#tdr-status').value;
      r.deliveredAt = body.querySelector('#tdr-delivered').value;
      r.note = body.querySelector('#tdr-note').value.trim();
    };
    // Fournie : la date de fourniture se pose d'elle-même
    body.querySelector('#tdr-status').addEventListener('change', (e) => {
      if (e.target.value === 'delivered' && !body.querySelector('#tdr-delivered').value) body.querySelector('#tdr-delivered').value = wrIso(new Date());
    });
    document.getElementById('tdr-copy').onclick = async () => {
      read();
      const text = testDataRequestText(r);
      const ok = await copyRichText(`<pre style="font-family:inherit;white-space:pre-wrap;">${escapeHtml(text)}</pre>`, text);
      toast(ok ? 'Demande copiée' : 'Copie impossible');
    };
    if (existing) document.getElementById('tdr-delete').onclick = () => {
      state.testDataRequests = (state.testDataRequests || []).filter(x => x.id !== r.id);
      save();
      closeModal();
      switchTab('data');
      toast('Demande supprimée');
    };
    document.getElementById('tdr-save').onclick = () => {
      read();
      if (!r.objects) { toast('Décrivez les objets métier nécessaires'); return; }
      if (!r.confidentialityOk) { toast('Confirmez la règle de confidentialité : aucune donnée réelle de client sans anonymisation'); return; }
      if (r.status === 'delivered' && !r.deliveredAt) r.deliveredAt = wrIso(new Date());
      if (!Array.isArray(state.testDataRequests)) state.testDataRequests = [];
      const i = state.testDataRequests.findIndex(x => x.id === r.id);
      if (i >= 0) state.testDataRequests[i] = r; else state.testDataRequests.push(r);
      save();
      closeModal();
      switchTab('data');
      toast(existing ? 'Demande modifiée' : 'Demande enregistrée');
    };
  });
}

function openTestDataSetModal(id) {
  const existing = (state.testDataSets || []).find(x => x.id === id);
  const x = existing ? JSON.parse(JSON.stringify(existing)) : { id: uid(), process: '', objects: '', howToGet: '', provider: '', leadTime: '' };
  openModal(existing ? `Data set · ${x.process}` : 'Nouveau test data set', `
    <div class="form-group"><label class="field-label">Processus métier <span class="required">*</span></label><input id="ds-process" value="${escapeHtml(x.process)}"></div>
    <div class="form-group"><label class="field-label">Objets</label><input id="ds-objects" value="${escapeHtml(x.objects)}" placeholder="Types d’objets métier et caractéristiques"></div>
    <div class="form-group"><label class="field-label">Comment les obtenir</label><textarea id="ds-how" rows="2" placeholder="Génération, copie anonymisée, création par script…">${escapeHtml(x.howToGet)}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label class="field-label">Qui les fournit</label><input id="ds-provider" value="${escapeHtml(x.provider)}"></div>
      <div class="form-group"><label class="field-label">Délai</label><input id="ds-lead" value="${escapeHtml(x.leadTime)}" placeholder="Ex. 2 jours ouvrés"></div>
    </div>
  `, `
    <button class="btn" data-close-modal>Annuler</button>
    ${existing ? '<button class="btn btn-danger" id="ds-delete" data-perm="dataTables:delete">Supprimer</button>' : ''}
    <button class="btn btn-primary" id="ds-save">Enregistrer</button>
  `);
  if (existing) document.getElementById('ds-delete').onclick = () => {
    state.testDataSets = (state.testDataSets || []).filter(y => y.id !== x.id);
    save();
    closeModal();
    switchTab('data');
  };
  document.getElementById('ds-save').onclick = () => {
    x.process = document.getElementById('ds-process').value.trim();
    if (!x.process) { toast('Indiquez le processus métier'); return; }
    x.objects = document.getElementById('ds-objects').value.trim();
    x.howToGet = document.getElementById('ds-how').value.trim();
    x.provider = document.getElementById('ds-provider').value.trim();
    x.leadTime = document.getElementById('ds-lead').value.trim();
    if (!Array.isArray(state.testDataSets)) state.testDataSets = [];
    const i = state.testDataSets.findIndex(y => y.id === x.id);
    if (i >= 0) state.testDataSets[i] = x; else state.testDataSets.push(x);
    save();
    closeModal();
    switchTab('data');
  };
}
