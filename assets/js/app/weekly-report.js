/* Catalogue de tests — module « weekly-report.js ».
   Fait partie de l'application principale (index.html). L'ordre de chargement
   des <script> compte : voir index.html. Ne pas ouvrir isolément. */
/* ===== Weekly test progress report =====
   Modèle « Weekly test progress report » du plan qualité (semaine 3) : une page par
   semaine pour le chef de projet et l'éditeur.
   - Avancement : dernier résultat connu de chaque test case du projet à la fin de la
     semaine, d'après les exécutions importées (state.testRuns).
   - Defects : anomalies liées aux test cases du projet (createdAt / resolvedAt).
   - Les parties rédigées (état général, raison, blocages, jours perdus, risques, semaine
     prochaine) sont gardées par projet et par semaine dans project.weeklyNotes[lundi]. */

const WR_SEVERITY_ROWS = [
  { id: 'critical', label: 'Blocker' },
  { id: 'major',    label: 'Major' },
  { id: 'minor',    label: 'Minor' },
  { id: 'trivial',  label: 'Cosmetic' },
];
const WR_STATUSES = [
  { id: 'on_track', label: 'Dans les temps' },
  { id: 'at_risk',  label: 'À risque' },
  { id: 'late',     label: 'En retard' },
];

/* Dates locales au format AAAA-MM-JJ (today() de helpers.js est en UTC). */
function wrIso(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function wrAddDays(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return wrIso(d);
}
function wrMondayOf(iso) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return wrIso(d);
}
function wrFmt(iso) {
  const [y, m, d] = String(iso).split('-');
  return `${d}.${m}.${y}`;
}

/* Exécutions d'un projet : checklists générées pour ce projet, ou exécutions de ses plans. */
function projectRuns(p) {
  const planSet = new Set(p.planIds || []);
  return (state.testRuns || []).filter(r => r.projectId === p.id || (r.sourceType === 'plan' && planSet.has(r.sourceId)));
}

/* Avancement temporel du projet à une date donnée (null si sans dates ou pas commencé). */
function wrTimePct(p, refIso) {
  if (!p.startDate || !p.endDate) return null;
  const total = Math.max(1, daysBetween(p.startDate, p.endDate));
  const elapsed = daysBetween(p.startDate, refIso);
  if (elapsed < 0) return null;
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

function weeklyReportData(p, weekStart) {
  const weekEnd = wrAddDays(weekStart, 6);
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(weekEnd + 'T23:59:59.999');
  const now = new Date();
  const ref = end < now ? end : now;               // semaine en cours : on s'arrête à maintenant
  const s = projectStats(p);
  const planned = s.allCases;
  const plannedIds = new Set(planned.map(c => c.id));
  const runs = projectRuns(p);

  // Dernier résultat de chaque test case jusqu'à la fin de la semaine. Un « non exécuté »
  // n'efface pas un résultat antérieur : il dit seulement que le cas n'a pas été rejoué.
  const latest = new Map();
  let minutesWeek = 0;
  const runsWeek = new Set();
  runs.forEach(run => (run.results || []).forEach(res => {
    if (!plannedIds.has(res.caseId) || res.outcome === 'not_run') return;
    const t = new Date(res.finishedAt || run.exportedAt || run.importedAt);
    if (isNaN(t) || t > end) return;
    if (t >= start) {
      runsWeek.add(run.id);
      if (typeof res.durationMin === 'number') minutesWeek += res.durationMin;
    }
    const prev = latest.get(res.caseId);
    if (!prev || t >= prev.t) latest.set(res.caseId, { t, res });
  }));

  let passed = 0, failed = 0, blocked = 0, executedThisWeek = 0;
  const blockedByReason = {};
  planned.forEach(c => {
    const l = latest.get(c.id);
    if (!l) return;
    if (l.t >= start) executedThisWeek++;
    if (l.res.outcome === 'passed') passed++;
    else if (l.res.outcome === 'failed') failed++;
    else if (l.res.outcome === 'blocked') {
      blocked++;
      const key = l.res.blockedReason || 'unknown';
      (blockedByReason[key] = blockedByReason[key] || []).push(c.title || '(sans titre)');
    }
  });
  const executed = passed + failed;
  const notRun = planned.length - executed - blocked;

  // Defects par severity
  // Nouveaux : date de détection ; corrigés : passage en Ready for retest (fixedAt), sinon la clôture
  const created = a => new Date(a.detectedAt ? a.detectedAt + 'T12:00:00' : a.createdAt);
  const resolved = a => (a.resolvedAt ? new Date(a.resolvedAt) : null);
  const fixed = a => (a.fixedAt ? new Date(a.fixedAt) : (a.state === 'closed' ? resolved(a) : null));
  const openAt = a => created(a) <= ref && (anomalyIsOpen(a) || (resolved(a) && resolved(a) > ref));
  const defects = WR_SEVERITY_ROWS.map(sev => {
    const list = s.linkedAnomalies.filter(a => a.severity === sev.id);
    const open = list.filter(openAt);
    return {
      label: sev.label,
      created: list.filter(a => created(a) >= start && created(a) <= end).length,
      fixed: list.filter(a => fixed(a) && fixed(a) >= start && fixed(a) <= end).length,
      open: open.length,
      oldestDays: open.length ? Math.max(...open.map(a => Math.floor((ref - created(a)) / 86400000))) : null,
    };
  });

  // Livraisons reçues en test cette semaine dans les plans du projet (entry criteria, S3-6)
  const planSet = new Set(p.planIds || []);
  const deliveriesWeek = [];
  state.testPlans.filter(pl => planSet.has(pl.id)).forEach(pl => (pl.deliveries || []).forEach(dl => {
    if (!dl.receivedAt || dl.receivedAt < weekStart || dl.receivedAt > weekEnd) return;
    deliveriesWeek.push({
      plan: planDisplayTitle(pl), version: dl.version || '(sans version)', decision: dl.decision,
      compliant: deliveryCompliant(dl), missing: deliveryMissingCriteria(dl).map(c => c.label),
      lostDays: Number(dl.lostDays) || 0,
    });
  }));
  // Indisponibilités des test environments des test cases du projet (journal, S6-2)
  const envIds = new Set(planned.flatMap(c => c.environmentIds || []));
  const outagesWeek = [];
  (state.environments || []).filter(e => envIds.has(e.id)).forEach(e => envOutagesIn(e, weekStart, weekEnd).forEach(o => outagesWeek.push({
    env: e.title, date: o.date, hours: Number(o.hours) || 0, cause: o.cause || '', blockedTests: o.blockedTests || '', lostDays: Number(o.lostDays) || 0,
  })));
  // Test data requests du projet en retard à la fin de la semaine (S6-5)
  const tdrLateWeek = (state.testDataRequests || [])
    .filter(r => (r.projectId === p.id || planSet.has(r.planId)) && r.requestedAt && r.requestedAt <= weekEnd && tdrLate(r, weekEnd))
    .map(r => ({ number: r.number, objects: r.objects || '', due: tdrDueDate(r) }));
  const lostDaysAuto = deliveriesWeek.reduce((a, x) => a + x.lostDays, 0) + outagesWeek.reduce((a, x) => a + x.lostDays, 0);
  const nonCompliant = deliveriesWeek.filter(x => !x.compliant);

  // État général proposé : à valider ou corriger par la QA
  const execPct = planned.length ? Math.round((executed / planned.length) * 100) : 0;
  const timePct = wrTimePct(p, wrIso(ref));
  const why = [];
  let status = 'on_track';
  if (defects[0].open > 0) {
    status = 'late';
    why.push(`${defects[0].open} defect${defects[0].open > 1 ? 's' : ''} Blocker ouvert${defects[0].open > 1 ? 's' : ''}`);
  }
  if (timePct !== null && execPct < timePct - 20) {
    status = 'late';
    why.push(`${execPct} % des test cases exécutés pour ${timePct} % du temps écoulé`);
  } else if (timePct !== null && execPct < timePct) {
    if (status === 'on_track') status = 'at_risk';
    why.push(`${execPct} % des test cases exécutés pour ${timePct} % du temps écoulé`);
  }
  if (blocked > 0) {
    if (status === 'on_track') status = 'at_risk';
    why.push(`${blocked} test case${blocked > 1 ? 's' : ''} bloqué${blocked > 1 ? 's' : ''}`);
  }
  if (outagesWeek.length > 0 || tdrLateWeek.length > 0) {
    if (status === 'on_track') status = 'at_risk';
    if (outagesWeek.length) why.push(`${outagesWeek.length} indisponibilité${outagesWeek.length > 1 ? 's' : ''} de test environment`);
    if (tdrLateWeek.length) why.push(`${tdrLateWeek.length} test data request${tdrLateWeek.length > 1 ? 's' : ''} en retard`);
  }
  if (nonCompliant.length > 0) {
    if (status === 'on_track') status = 'at_risk';
    why.push(`${nonCompliant.length} livraison${nonCompliant.length > 1 ? 's' : ''} hors entry criteria`);
  }
  if (why.length === 0) why.push(`${execPct} % des test cases exécutés${timePct !== null ? ` pour ${timePct} % du temps écoulé` : ''}, aucun Blocker ouvert`);

  return {
    project: p, weekStart, weekEnd, planned: planned.length, passed, failed, blocked, executed, notRun,
    executedThisWeek, minutesWeek, runsWeekCount: runsWeek.size, runsCount: runs.length,
    blockedGroups: Object.keys(blockedByReason).map(k => ({
      label: BLOCKED_REASON_LABELS[k] || 'Motif non précisé', cases: blockedByReason[k],
    })),
    defects, execPct, timePct, deliveriesWeek, nonCompliant, outagesWeek, tdrLateWeek, lostDaysAuto,
    proposal: { status, reason: why.join(' ; ') },
  };
}

function wrStatusLabel(id) { return (WR_STATUSES.find(s => s.id === id) || WR_STATUSES[0]).label; }

/* Jours de test perdus : la valeur saisie prime, sinon la somme des livraisons de la semaine. */
function wrLostDays(d, notes) {
  if (notes.lostDays !== '' && notes.lostDays != null) return String(notes.lostDays);
  return d.lostDaysAuto ? `${d.lostDaysAuto} (livraisons)` : '–';
}
/* Blocages de la semaine, dans l'ordre du modèle : livraisons hors entry criteria, test
   environments, test data, puis test cases bloqués par motif. */
function wrBlockerLines(d) {
  return [
    ...d.nonCompliant.map(wrDeliveryLine),
    ...(d.outagesWeek || []).map(o => `Test environment ${o.env} indisponible le ${wrFmt(o.date)}${o.hours ? ` (${o.hours} h)` : ''} : ${o.cause}${o.blockedTests ? ` ; tests bloqués : ${o.blockedTests}` : ''}`),
    ...(d.tdrLateWeek || []).map(r => `Test data request ${r.number} en retard${r.due ? ` (échéance ${wrFmt(r.due)})` : ''} : ${r.objects}`),
    ...d.blockedGroups.map(g => `${g.label} : ${g.cases.join(', ')}`),
  ];
}
function wrDeliveryLine(x) {
  return `Livraison ${x.version} (${x.plan}) : ${crLabel(CR_DELIVERY_DECISIONS, x.decision).toLowerCase()}`
    + (x.missing.length ? ` ; entry criteria manquants : ${x.missing.join(' ')}` : '');
}

/* Le rapport en HTML sémantique (titres, tableaux, listes) : il se colle tel quel dans un wiki, un e-mail ou un document. */
function weeklyReportHtml(d, notes) {
  const txt = t => escapeHtml(t || '').replace(/\n/g, '<br>');
  const cell = 'border:1px solid #ccc;padding:4px 8px;';
  const th = cell + 'background:#f4f5f7;text-align:left;';
  const table = (head, rows) => `<table style="border-collapse:collapse;"><thead><tr>${head.map(h => `<th style="${th}">${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(v => `<td style="${cell}">${escapeHtml(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return `
    <h1>Weekly test progress report</h1>
    <p>Semaine du ${wrFmt(d.weekStart)} au ${wrFmt(d.weekEnd)}. Projet : ${escapeHtml(d.project.name || '')}.</p>
    <h2>État général</h2>
    <p><strong>${escapeHtml(wrStatusLabel(notes.status))}</strong>${notes.reason ? `, parce que ${txt(notes.reason)}` : ''}.</p>
    <h2>Avancement</h2>
    ${table(['Test cases prévus', 'Exécutés', 'Passed', 'Failed', 'Blocked'], [[d.planned, d.executed, d.passed, d.failed, d.blocked]])}
    <p>Non exécutés : ${d.notRun}. Cette semaine : ${d.executedThisWeek} test case${d.executedThisWeek > 1 ? 's' : ''} joué${d.executedThisWeek > 1 ? 's' : ''}${d.minutesWeek ? `, ${escapeHtml(formatMin(d.minutesWeek))} de test mesurées` : ''}.</p>
    <h2>Defects</h2>
    ${table(['Severity', 'Nouveaux', 'Corrigés', 'Ouverts', 'Plus ancien (jours)'], d.defects.map(r => [r.label, r.created, r.fixed, r.open, r.oldestDays === null ? '–' : r.oldestDays]))}
    <h2>Blocages</h2>
    ${d.deliveriesWeek.length ? `<p>Livraisons reçues en test : ${d.deliveriesWeek.length}, dont ${d.deliveriesWeek.length - d.nonCompliant.length} conforme${d.deliveriesWeek.length - d.nonCompliant.length > 1 ? 's' : ''} aux entry criteria.</p>` : ''}
    ${wrBlockerLines(d).length ? `<ul>${wrBlockerLines(d).map(l => `<li>${escapeHtml(l)}</li>`).join('')}</ul>` : ''}
    ${notes.blockers ? `<p>${txt(notes.blockers)}</p>` : (wrBlockerLines(d).length ? '' : '<p>Aucun blocage signalé.</p>')}
    <p>Jours de test perdus : ${escapeHtml(wrLostDays(d, notes))}.</p>
    <h2>Risques et décisions attendues</h2>
    <p>${notes.risks ? txt(notes.risks) : 'Aucune décision attendue.'}</p>
    <h2>Semaine prochaine</h2>
    <p>${notes.next ? txt(notes.next) : '–'}</p>
    <p><small>Chiffres calculés le ${new Date().toLocaleString('fr-CH')} par le catalogue de tests, à partir de ${d.runsCount} exécution${d.runsCount > 1 ? 's' : ''} importée${d.runsCount > 1 ? 's' : ''} et des anomalies du projet.</small></p>`;
}

function weeklyReportMarkdown(d, notes) {
  const md = t => String(t == null ? '' : t).replace(/\|/g, '\\|');
  const row = cols => `| ${cols.map(md).join(' | ')} |`;
  const table = (head, rows) => [row(head), row(head.map(() => '---')), ...rows.map(row)].join('\n');
  const lines = [
    '# Weekly test progress report', '',
    `Semaine du ${wrFmt(d.weekStart)} au ${wrFmt(d.weekEnd)}. Projet : ${d.project.name || ''}.`, '',
    '## État général', '',
    `**${wrStatusLabel(notes.status)}**${notes.reason ? `, parce que ${notes.reason}` : ''}.`, '',
    '## Avancement', '',
    table(['Test cases prévus', 'Exécutés', 'Passed', 'Failed', 'Blocked'], [[d.planned, d.executed, d.passed, d.failed, d.blocked]]), '',
    `Non exécutés : ${d.notRun}. Cette semaine : ${d.executedThisWeek} test case(s) joué(s)${d.minutesWeek ? `, ${formatMin(d.minutesWeek)} de test mesurées` : ''}.`, '',
    '## Defects', '',
    table(['Severity', 'Nouveaux', 'Corrigés', 'Ouverts', 'Plus ancien (jours)'], d.defects.map(r => [r.label, r.created, r.fixed, r.open, r.oldestDays === null ? '–' : r.oldestDays])), '',
    '## Blocages', '',
    ...(d.deliveriesWeek.length ? [`Livraisons reçues en test : ${d.deliveriesWeek.length}, dont ${d.deliveriesWeek.length - d.nonCompliant.length} conforme(s) aux entry criteria.`, ''] : []),
    ...wrBlockerLines(d).map(l => `- ${l}`),
    ...(notes.blockers ? ['', notes.blockers] : (wrBlockerLines(d).length ? [] : ['Aucun blocage signalé.'])), '',
    `Jours de test perdus : ${wrLostDays(d, notes)}.`, '',
    '## Risques et décisions attendues', '',
    notes.risks || 'Aucune décision attendue.', '',
    '## Semaine prochaine', '',
    notes.next || '–', '',
    `_Chiffres calculés le ${new Date().toLocaleString('fr-CH')} par le catalogue de tests, à partir de ${d.runsCount} exécution(s) importée(s) et des anomalies du projet._`,
  ];
  return lines.join('\n');
}

/* Copie riche (HTML + texte) pour un collage propre dans un wiki ; repli execCommand. */
async function copyRichText(html, text) {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      })]);
      return true;
    }
  } catch (e) { /* repli ci-dessous */ }
  const box = document.createElement('div');
  box.contentEditable = 'true';
  box.innerHTML = html;
  box.style.cssText = 'position:fixed;left:-9999px;top:0;';
  document.body.appendChild(box);
  const range = document.createRange();
  range.selectNodeContents(box);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  sel.removeAllRanges();
  box.remove();
  return ok;
}

function openWeeklyReportModal(projectId, weekStart) {
  const p = (state.projects || []).find(x => x.id === projectId);
  if (!p) return;
  const week = weekStart || wrMondayOf(wrIso(new Date()));
  const d = weeklyReportData(p, week);
  const saved = (p.weeklyNotes || {})[week] || {};
  const initial = {
    status: saved.status || d.proposal.status,
    reason: saved.reason != null ? saved.reason : d.proposal.reason,
    blockers: saved.blockers || '',
    lostDays: saved.lostDays != null ? saved.lostDays : '',
    risks: saved.risks || '',
    next: saved.next || '',
  };
  const canSave = !window.QAPerm || QAPerm.can('update', 'projects');
  const field = 'width:100%;font:inherit;font-size:13px;padding:6px 8px;border:1px solid var(--border-strong);border-radius:var(--radius-sm);background:var(--surface);';
  const label = 'display:block;font-size:11.5px;font-weight:600;color:var(--text-soft);margin:10px 0 4px;';

  openModal(`Weekly test progress report · ${p.name || ''}`, `
    <div class="wr-layout">
      <div>
        <label style="${label}margin-top:0;">Semaine</label>
        <div style="display:flex;gap:6px;align-items:center;">
          <button class="btn btn-sm" id="wr-prev" title="Semaine précédente">‹</button>
          <input type="date" id="wr-week" value="${week}" style="${field}flex:1;" title="Choisir un jour : la semaine du lundi au dimanche est prise">
          <button class="btn btn-sm" id="wr-next" title="Semaine suivante">›</button>
        </div>
        <div style="font-size:11.5px;color:var(--text-muted);margin-top:4px;">Du ${wrFmt(d.weekStart)} au ${wrFmt(d.weekEnd)}</div>
        ${d.runsCount === 0 ? `<div style="margin-top:10px;font-size:12px;color:#8a6a25;background:var(--warning-soft);padding:8px;border-radius:var(--radius-sm);">Aucune exécution importée pour ce projet : l'avancement est vide. Importez les résultats des checklists (onglet Export / Import).</div>` : ''}

        <label style="${label}" for="wr-status">État général</label>
        <select id="wr-status" style="${field}">
          ${WR_STATUSES.map(s => `<option value="${s.id}"${initial.status === s.id ? ' selected' : ''}>${escapeHtml(s.label)}</option>`).join('')}
        </select>
        <div style="font-size:11.5px;color:var(--text-muted);margin-top:4px;">Proposé : ${escapeHtml(wrStatusLabel(d.proposal.status))}</div>
        <label style="${label}" for="wr-reason">Parce que</label>
        <textarea id="wr-reason" rows="3" style="${field}">${escapeHtml(initial.reason)}</textarea>

        <label style="${label}" for="wr-blockers">Blocages (en plus des test cases bloqués)</label>
        <textarea id="wr-blockers" rows="2" style="${field}" placeholder="Livraison hors entry criteria, test environment, test data…">${escapeHtml(initial.blockers)}</textarea>
        <label style="${label}" for="wr-lost">Jours de test perdus</label>
        <input type="number" id="wr-lost" min="0" step="0.5" value="${escapeHtml(initial.lostDays)}" style="${field}max-width:120px;" placeholder="${d.lostDaysAuto || ''}" title="Vide : somme des jours perdus des livraisons de la semaine">
        ${d.deliveriesWeek.length ? `<div style="font-size:11.5px;color:var(--text-muted);margin-top:4px;">${d.deliveriesWeek.length} livraison${d.deliveriesWeek.length > 1 ? 's' : ''} cette semaine, ${d.nonCompliant.length} hors entry criteria, ${d.lostDaysAuto} jour${d.lostDaysAuto > 1 ? 's' : ''} perdu${d.lostDaysAuto > 1 ? 's' : ''}.</div>` : ''}

        <label style="${label}" for="wr-risks">Risques et décisions attendues</label>
        <textarea id="wr-risks" rows="3" style="${field}" placeholder="Quoi, qui décide, pour quand.">${escapeHtml(initial.risks)}</textarea>
        <label style="${label}" for="wr-next-week">Semaine prochaine</label>
        <textarea id="wr-next-week" rows="3" style="${field}">${escapeHtml(initial.next)}</textarea>
      </div>
      <div class="wr-preview" id="wr-preview"></div>
    </div>
  `, `
    <button class="btn" data-close-modal>Fermer</button>
    <button class="btn" id="wr-md">Télécharger (.md)</button>
    ${canSave ? '<button class="btn" id="wr-save">Enregistrer les notes</button>' : ''}
    <button class="btn btn-primary" id="wr-copy" title="Colle titres et tableaux dans un wiki, un e-mail ou un document">Copier le rapport</button>
  `);
  document.getElementById('modal').classList.add('modal-wide');

  const readNotes = () => ({
    status: document.getElementById('wr-status').value,
    reason: document.getElementById('wr-reason').value.trim(),
    blockers: document.getElementById('wr-blockers').value.trim(),
    lostDays: document.getElementById('wr-lost').value,
    risks: document.getElementById('wr-risks').value.trim(),
    next: document.getElementById('wr-next-week').value.trim(),
  });
  const refresh = () => { document.getElementById('wr-preview').innerHTML = weeklyReportHtml(d, readNotes()); };
  // Notes gardées seulement si elles ont changé, pour ne pas créer un commit à chaque copie.
  const persistNotes = () => {
    if (!canSave) return;
    const notes = readNotes();
    const prev = (p.weeklyNotes || {})[week];
    if (prev && sameJson(prev, notes)) return;
    p.weeklyNotes = Object.assign({}, p.weeklyNotes, { [week]: notes });
    save();
  };
  ['wr-status', 'wr-reason', 'wr-blockers', 'wr-lost', 'wr-risks', 'wr-next-week'].forEach(id => {
    document.getElementById(id).addEventListener('input', refresh);
  });
  document.getElementById('wr-week').onchange = (e) => {
    if (e.target.value) openWeeklyReportModal(projectId, wrMondayOf(e.target.value));
  };
  document.getElementById('wr-prev').onclick = () => openWeeklyReportModal(projectId, wrAddDays(week, -7));
  document.getElementById('wr-next').onclick = () => openWeeklyReportModal(projectId, wrAddDays(week, 7));
  if (canSave) document.getElementById('wr-save').onclick = () => { persistNotes(); toast('Notes enregistrées pour cette semaine'); };
  document.getElementById('wr-copy').onclick = async () => {
    persistNotes();
    const notes = readNotes();
    const ok = await copyRichText(weeklyReportHtml(d, notes), weeklyReportMarkdown(d, notes));
    toast(ok ? 'Rapport copié : collez-le dans votre wiki ou un e-mail' : 'Copie impossible : utilisez « Télécharger (.md) »');
  };
  document.getElementById('wr-md').onclick = () => {
    persistNotes();
    const blob = new Blob([weeklyReportMarkdown(d, readNotes())], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const safe = String(p.name || 'projet').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'projet';
    a.download = `weekly-report-${safe}-${week}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  refresh();
}
