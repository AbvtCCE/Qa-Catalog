/* Catalogue de tests — module « completion-report.js ».
   Fait partie de l'application principale (index.html). L'ordre de chargement
   des <script> compte : voir index.html. Ne pas ouvrir isolément. */
/* ===== Test completion report =====
   Modèle « Test completion report » du plan qualité (S3-5) : la test evidence jointe au
   changement dans ServiceNow, ce que le CAB lit pour décider. Un rapport par changement,
   rangé dans project.completionReports.
   - Les exit criteria suivent le modèle « Entry et exit criteria » selon le risk level.
   - Les résultats viennent des exécutions importées (state.testRuns), les defects des anomalies.
   - « Figer » enregistre le rapport tel quel (HTML et Markdown) : après le CAB, il ne bouge plus. */

const CR_RISK_LEVELS = [
  { id: 'low', label: 'Faible' },
  { id: 'medium', label: 'Moyen' },
  { id: 'high', label: 'Élevé' },
];
const CR_REGRESSION_KINDS = [
  { id: 'smoke', label: 'Smoke test', rank: 1 },
  { id: 'targeted', label: 'Targeted regression', rank: 2 },
  { id: 'full', label: 'Full regression', rank: 3 },
];
const CR_REQUIRED_REGRESSION = { low: 'smoke', medium: 'targeted', high: 'full' };
const CR_RECOMMENDATIONS = [
  { id: 'go', label: 'Mise en production recommandée' },
  { id: 'go_conditions', label: 'Mise en production recommandée sous conditions' },
  { id: 'no_go', label: 'Mise en production déconseillée' },
];
const CR_CRITERIA = [
  { key: 'executed', label: 'Test cases exécutés',
    required: { low: 'Ceux du changement', medium: 'Ceux du changement et les test cases prioritaires du domaine', high: 'Tous les test cases prévus' } },
  { key: 'defects', label: 'Defects ouverts',
    required: { low: 'Aucun Blocker', medium: 'Aucun Blocker ; Major acceptés par le responsable', high: 'Aucun Blocker ni Major' } },
  { key: 'regression', label: 'Regression testing',
    required: { low: 'Smoke test passé', medium: 'Targeted regression passée', high: 'Full regression passée' } },
  { key: 'uat', label: 'UAT sign-off',
    required: { low: 'Non requis', medium: 'Recommandé', high: 'Obligatoire' } },
];
const CR_STATUS_LABELS = { met: 'Atteint', not_met: 'Non atteint', check: 'À vérifier' };
const CR_SEVERITY_ORDER = ['critical', 'major', 'minor', 'trivial'];

const crLabel = (list, id) => (list.find(x => x.id === id) || {}).label || id;
const crSeverityLabel = id => (WR_SEVERITY_ROWS.find(s => s.id === id) || {}).label || id;

function newCompletionReport(p) {
  return {
    id: uid(),
    changeNumber: '', deliveryVersion: '', reportDate: wrIso(new Date()), riskLevel: 'medium',
    planIds: (p.planIds || []).slice(),
    regressionRunId: '', regressionKind: 'targeted',
    untestedReason: '', decisions: {}, risks: '',
    recommendation: '', recommendationText: '',
    uatName: '', uatDate: '', evidenceLinks: '',
    createdAt: new Date().toISOString(), createdBy: (QASession.username && QASession.username()) || '',
    frozenAt: null, frozenBy: null, snapshot: null,
  };
}

/* Dernier résultat (hors « non exécuté ») de chaque test case de l'ensemble donné. */
function crLatestResults(runs, caseIds) {
  const latest = new Map();
  runs.forEach(run => (run.results || []).forEach(res => {
    if (!caseIds.has(res.caseId) || res.outcome === 'not_run') return;
    const t = new Date(res.finishedAt || run.exportedAt || run.importedAt);
    if (isNaN(t)) return;
    const prev = latest.get(res.caseId);
    if (!prev || t >= prev.t) latest.set(res.caseId, { t, res, run });
  }));
  return latest;
}

function completionReportData(p, rep) {
  const risk = rep.riskLevel || 'medium';
  const projectPlanIds = new Set(p.planIds || []);
  const scopePlans = state.testPlans.filter(pl => projectPlanIds.has(pl.id) && (rep.planIds || []).includes(pl.id));
  const scopeIds = new Set();
  const scopeCases = [];
  scopePlans.forEach(pl => collectPlanCases(pl, true).forEach(c => {
    if (!scopeIds.has(c.id)) { scopeIds.add(c.id); scopeCases.push(c); }
  }));
  const runs = projectRuns(p);

  // Résultats sur le scope du changement
  const latest = crLatestResults(runs, scopeIds);
  let passed = 0, failed = 0, blocked = 0;
  const untested = [];
  scopeCases.forEach(c => {
    const l = latest.get(c.id);
    if (!l) { untested.push({ title: c.title, why: 'non exécuté' }); return; }
    if (l.res.outcome === 'passed') passed++;
    else if (l.res.outcome === 'failed') failed++;
    else if (l.res.outcome === 'blocked') {
      blocked++;
      untested.push({ title: c.title, why: 'bloqué · ' + (BLOCKED_REASON_LABELS[l.res.blockedReason] || 'motif non précisé') });
    }
  });
  const executed = passed + failed;

  // Tous les test cases du projet (exit criterion du risque élevé)
  const allCases = projectStats(p).allCases;
  const latestAll = crLatestResults(runs, new Set(allCases.map(c => c.id)));
  const allExecuted = allCases.filter(c => {
    const l = latestAll.get(c.id);
    return l && (l.res.outcome === 'passed' || l.res.outcome === 'failed');
  }).length;

  const openDefects = (state.anomalies || [])
    .filter(a => anomalyIsOpen(a) && (a.testCaseIds || []).some(id => scopeIds.has(id)))
    .sort((a, b) => CR_SEVERITY_ORDER.indexOf(a.severity) - CR_SEVERITY_ORDER.indexOf(b.severity));
  const decided = a => !!String((rep.decisions || {})[a.id] || '').trim();

  const regRun = runs.find(r => r.id === rep.regressionRunId) || null;
  const regCounts = regRun ? runCounts(regRun) : null;
  const rank = k => (CR_REGRESSION_KINDS.find(x => x.id === k) || { rank: 0 }).rank;

  // Exit criteria
  const status = {}, detail = {};
  if (risk === 'high') {
    status.executed = allCases.length > 0 && allExecuted === allCases.length ? 'met' : 'not_met';
    detail.executed = `${allExecuted} / ${allCases.length} test cases du projet exécutés`;
  } else {
    const all = scopeCases.length > 0 && executed === scopeCases.length;
    status.executed = !all ? 'not_met' : (risk === 'medium' ? 'check' : 'met');
    detail.executed = `${executed} / ${scopeCases.length} test cases du changement exécutés`
      + (risk === 'medium' ? ' ; test cases prioritaires du domaine à vérifier (le catalogue ne gère pas encore la priorité)' : '');
  }
  const nBlocker = openDefects.filter(a => a.severity === 'critical').length;
  const majors = openDefects.filter(a => a.severity === 'major');
  const majorsUndecided = majors.filter(a => !decided(a)).length;
  if (risk === 'low') status.defects = nBlocker ? 'not_met' : 'met';
  else if (risk === 'medium') status.defects = nBlocker || majorsUndecided ? 'not_met' : 'met';
  else status.defects = nBlocker || majors.length ? 'not_met' : 'met';
  detail.defects = `${nBlocker} Blocker et ${majors.length} Major ouvert${majors.length > 1 ? 's' : ''}`
    + (risk === 'medium' && majorsUndecided ? ` ; ${majorsUndecided} Major sans décision du responsable` : '');
  const reqKind = CR_REQUIRED_REGRESSION[risk];
  if (!regRun) {
    status.regression = 'not_met';
    detail.regression = 'Aucune exécution de régression choisie';
  } else {
    const kindOk = rank(rep.regressionKind) >= rank(reqKind);
    const resOk = regCounts.failed === 0 && regCounts.blocked === 0 && regCounts.not_run === 0;
    status.regression = kindOk && resOk ? 'met' : 'not_met';
    detail.regression = `${crLabel(CR_REGRESSION_KINDS, rep.regressionKind)} du ${runDateLabel(regRun)} : ${regCounts.passed} passed, ${regCounts.failed} failed, ${regCounts.blocked} blocked, ${regCounts.not_run} non exécutés`
      + (kindOk ? '' : ` ; ${crLabel(CR_REGRESSION_KINDS, reqKind)} exigée pour ce risk level`);
  }
  const hasUat = !!(String(rep.uatName || '').trim() && rep.uatDate);
  status.uat = hasUat || risk === 'low' ? 'met' : (risk === 'medium' ? 'check' : 'not_met');
  detail.uat = hasUat ? `${rep.uatName}, le ${wrFmt(rep.uatDate)}` : (risk === 'low' ? 'Non requis' : 'Non fourni');

  const criteria = CR_CRITERIA.map(c => ({ key: c.key, label: c.label, required: c.required[risk], status: status[c.key], detail: detail[c.key] }));
  const notMet = criteria.filter(c => c.status === 'not_met');
  const toCheck = criteria.filter(c => c.status === 'check');
  const proposal = notMet.length ? 'no_go' : (toCheck.length ? 'go_conditions' : 'go');

  return {
    risk, scopePlans, scopeCases, passed, failed, blocked, executed, untested, openDefects,
    regRun, regCounts, criteria, notMet, toCheck, proposal,
    runsInScope: runs.filter(r => (r.results || []).some(x => scopeIds.has(x.caseId))),
  };
}

function crEvidenceLine(r) {
  const c = runCounts(r);
  return `${runDateLabel(r)} · ${runSourceLabel(r)} · ${r.tester || '—'} : ${c.passed} passed, ${c.failed} failed, ${c.blocked} blocked, ${c.not_run} non exécutés`;
}

/* Le rapport en HTML sémantique : il se colle tel quel dans Confluence ou dans ServiceNow. */
function completionReportHtml(p, rep, d) {
  const txt = t => escapeHtml(t || '').replace(/\n/g, '<br>');
  const cell = 'border:1px solid #ccc;padding:4px 8px;vertical-align:top;';
  const th = cell + 'background:#f4f5f7;text-align:left;';
  const table = (head, rows) => `<table style="border-collapse:collapse;"><thead><tr>${head.map(h => `<th style="${th}">${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(v => `<td style="${cell}">${escapeHtml(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const reco = rep.recommendation || d.proposal;
  const shown = d.untested.slice(0, 30);
  return `
    <h1>Test completion report</h1>
    <p>Changement : <strong>${escapeHtml(rep.changeNumber || '[numéro ServiceNow]')}</strong>. Livraison : ${escapeHtml(rep.deliveryVersion || '[version]')}. Date : ${rep.reportDate ? wrFmt(rep.reportDate) : '–'}.<br>
       Projet : ${escapeHtml(p.name || '')}. Risk level du changement : ${escapeHtml(crLabel(CR_RISK_LEVELS, d.risk))}.</p>
    <h2>Ce qui a été testé</h2>
    <p>${d.scopePlans.length ? `Scope : ${d.scopePlans.map(pl => escapeHtml(planDisplayTitle(pl))).join(', ')}, soit ${d.scopeCases.length} test case${d.scopeCases.length > 1 ? 's' : ''}.` : 'Aucun plan dans le scope.'}</p>
    ${d.untested.length ? `<p>Non testé : ${d.untested.length} test case${d.untested.length > 1 ? 's' : ''}.</p>
      <ul>${shown.map(u => `<li>${escapeHtml(u.title)} (${escapeHtml(u.why)})</li>`).join('')}${d.untested.length > shown.length ? `<li>et ${d.untested.length - shown.length} autres</li>` : ''}</ul>
      ${rep.untestedReason ? `<p>Raison : ${txt(rep.untestedReason)}</p>` : ''}` : '<p>Tous les test cases du scope ont été exécutés.</p>'}
    <h2>Résultats</h2>
    ${table(['Exécutés', 'Passed', 'Failed', 'Blocked', 'Regression testing'], [[d.executed, d.passed, d.failed, d.blocked, d.regRun ? crEvidenceLine(d.regRun) : 'Non fournie']])}
    <h2>Defects ouverts</h2>
    ${d.openDefects.length ? table(['Defect', 'Severity', 'Contournement', 'Décision'], d.openDefects.map(a => [a.title || '(sans titre)', crSeverityLabel(a.severity), a.workaround || '–', (rep.decisions || {})[a.id] || '–'])) : '<p>Aucun defect ouvert sur le scope.</p>'}
    <h2>Exit criteria</h2>
    ${table(['Criterion', `Exigé (risque ${crLabel(CR_RISK_LEVELS, d.risk).toLowerCase()})`, 'Constat', 'Statut'], d.criteria.map(c => [c.label, c.required, c.detail, CR_STATUS_LABELS[c.status]]))}
    <p>${d.notMet.length ? `Non atteints : ${d.notMet.map(c => escapeHtml(c.label)).join(', ')}.` : 'Tous les exit criteria sont atteints' + (d.toCheck.length ? ', sous réserve des points à vérifier.' : '.')}</p>
    <h2>Risques restants</h2>
    <p>${rep.risks ? txt(rep.risks) : '–'}</p>
    <h2>Recommandation</h2>
    <p><strong>${escapeHtml(crLabel(CR_RECOMMENDATIONS, reco))}</strong>${rep.recommendationText ? ` : ${txt(rep.recommendationText)}` : '.'}</p>
    <h2>UAT sign-off</h2>
    <p>${String(rep.uatName || '').trim() ? `${escapeHtml(rep.uatName)}${rep.uatDate ? `, le ${wrFmt(rep.uatDate)}` : ''}` : `Non fourni${d.risk === 'high' ? ' (obligatoire pour un risque élevé)' : ''}.`}</p>
    <h2>Test evidence</h2>
    ${d.runsInScope.length ? `<ul>${d.runsInScope.map(r => `<li>Exécution du ${escapeHtml(crEvidenceLine(r))}</li>`).join('')}</ul>` : '<p>Aucune exécution importée sur ce scope.</p>'}
    <p>Captures : dans les rapports PDF des checklists.${rep.evidenceLinks ? `<br>${txt(rep.evidenceLinks)}` : ''}</p>
    <p><small>Établi le ${new Date().toLocaleString('fr-CH')} par le catalogue de tests${rep.frozenAt ? ` ; figé le ${new Date(rep.frozenAt).toLocaleString('fr-CH')} par ${escapeHtml(rep.frozenBy || '')}` : ''}.</small></p>`;
}

function completionReportMarkdown(p, rep, d) {
  const md = t => String(t == null ? '' : t).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const row = cols => `| ${cols.map(md).join(' | ')} |`;
  const table = (head, rows) => [row(head), row(head.map(() => '---')), ...rows.map(row)].join('\n');
  const reco = rep.recommendation || d.proposal;
  const shown = d.untested.slice(0, 30);
  return [
    '# Test completion report', '',
    `Changement : **${rep.changeNumber || '[numéro ServiceNow]'}**. Livraison : ${rep.deliveryVersion || '[version]'}. Date : ${rep.reportDate ? wrFmt(rep.reportDate) : '–'}.`,
    `Projet : ${p.name || ''}. Risk level du changement : ${crLabel(CR_RISK_LEVELS, d.risk)}.`, '',
    '## Ce qui a été testé', '',
    d.scopePlans.length ? `Scope : ${d.scopePlans.map(pl => planDisplayTitle(pl)).join(', ')}, soit ${d.scopeCases.length} test case(s).` : 'Aucun plan dans le scope.', '',
    ...(d.untested.length
      ? [`Non testé : ${d.untested.length} test case(s).`, '', ...shown.map(u => `- ${u.title} (${u.why})`),
         ...(d.untested.length > shown.length ? [`- et ${d.untested.length - shown.length} autres`] : []),
         ...(rep.untestedReason ? ['', `Raison : ${rep.untestedReason}`] : [])]
      : ['Tous les test cases du scope ont été exécutés.']), '',
    '## Résultats', '',
    table(['Exécutés', 'Passed', 'Failed', 'Blocked', 'Regression testing'], [[d.executed, d.passed, d.failed, d.blocked, d.regRun ? crEvidenceLine(d.regRun) : 'Non fournie']]), '',
    '## Defects ouverts', '',
    d.openDefects.length ? table(['Defect', 'Severity', 'Contournement', 'Décision'], d.openDefects.map(a => [a.title || '(sans titre)', crSeverityLabel(a.severity), a.workaround || '–', (rep.decisions || {})[a.id] || '–'])) : 'Aucun defect ouvert sur le scope.', '',
    '## Exit criteria', '',
    table(['Criterion', `Exigé (risque ${crLabel(CR_RISK_LEVELS, d.risk).toLowerCase()})`, 'Constat', 'Statut'], d.criteria.map(c => [c.label, c.required, c.detail, CR_STATUS_LABELS[c.status]])), '',
    d.notMet.length ? `Non atteints : ${d.notMet.map(c => c.label).join(', ')}.` : 'Tous les exit criteria sont atteints' + (d.toCheck.length ? ', sous réserve des points à vérifier.' : '.'), '',
    '## Risques restants', '', rep.risks || '–', '',
    '## Recommandation', '', `**${crLabel(CR_RECOMMENDATIONS, reco)}**${rep.recommendationText ? ` : ${rep.recommendationText}` : '.'}`, '',
    '## UAT sign-off', '',
    String(rep.uatName || '').trim() ? `${rep.uatName}${rep.uatDate ? `, le ${wrFmt(rep.uatDate)}` : ''}` : `Non fourni${d.risk === 'high' ? ' (obligatoire pour un risque élevé)' : ''}.`, '',
    '## Test evidence', '',
    ...(d.runsInScope.length ? d.runsInScope.map(r => `- Exécution du ${crEvidenceLine(r)}`) : ['Aucune exécution importée sur ce scope.']), '',
    'Captures : dans les rapports PDF des checklists.', ...(rep.evidenceLinks ? [rep.evidenceLinks] : []), '',
    `_Établi le ${new Date().toLocaleString('fr-CH')} par le catalogue de tests${rep.frozenAt ? ` ; figé le ${new Date(rep.frozenAt).toLocaleString('fr-CH')} par ${rep.frozenBy || ''}` : ''}._`,
  ].join('\n');
}

function crDownloadMarkdown(rep, text) {
  const blob = new Blob([text], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const safe = String(rep.changeNumber || 'changement').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'changement';
  a.download = `test-completion-report-${safe}.md`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function crSaveReport(p, rep) {
  const list = (p.completionReports || []).slice();
  const i = list.findIndex(r => r.id === rep.id);
  if (i >= 0) list[i] = rep; else list.push(rep);
  p.completionReports = list;
  save();
}

/* Liste des rapports d'un projet */
function openCompletionReportsModal(projectId) {
  const p = (state.projects || []).find(x => x.id === projectId);
  if (!p) return;
  const canEdit = !window.QAPerm || QAPerm.can('update', 'projects');
  const reports = (p.completionReports || []).slice().sort((a, b) => String(b.reportDate).localeCompare(String(a.reportDate)));
  const td = 'padding:6px 8px;border-bottom:1px solid var(--border);vertical-align:top;';
  openModal(`Test completion reports · ${p.name || ''}`, `
    <p style="margin:0 0 12px;font-size:12.5px;color:var(--text-soft);">Un rapport par changement : la test evidence jointe au changement dans ServiceNow, que le CAB lit pour décider. Figé, il ne change plus.</p>
    ${reports.length === 0 ? '<p style="font-size:12.5px;color:var(--text-muted);font-style:italic;">Aucun rapport pour ce projet.</p>' : `
      <table style="border-collapse:collapse;width:100%;font-size:12.5px;">
        <thead><tr style="text-align:left;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:0.04em;">
          <th style="${td}">Changement</th><th style="${td}">Date</th><th style="${td}">Risque</th><th style="${td}">Recommandation</th><th style="${td}">Statut</th><th style="${td}"></th>
        </tr></thead>
        <tbody>${reports.map(r => {
          const reco = r.snapshot ? r.snapshot.recommendation : (r.recommendation || completionReportData(p, r).proposal);
          return `<tr>
            <td style="${td}"><strong>${escapeHtml(r.changeNumber || '(sans numéro)')}</strong>${r.deliveryVersion ? `<br><span style="color:var(--text-muted);">${escapeHtml(r.deliveryVersion)}</span>` : ''}</td>
            <td style="${td}white-space:nowrap;">${r.reportDate ? wrFmt(r.reportDate) : '–'}</td>
            <td style="${td}">${escapeHtml(crLabel(CR_RISK_LEVELS, r.riskLevel))}</td>
            <td style="${td}">${escapeHtml(crLabel(CR_RECOMMENDATIONS, reco))}</td>
            <td style="${td}">${r.frozenAt ? '<span class="badge badge-primary">Figé</span>' : '<span class="badge badge-muted">Brouillon</span>'}</td>
            <td style="${td}text-align:right;"><button class="btn btn-sm" data-open-cr="${escapeHtml(r.id)}">Ouvrir</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table>`}
  `, `
    <button class="btn" data-close-modal>Fermer</button>
    ${canEdit ? '<button class="btn btn-primary" id="cr-new">Nouveau rapport</button>' : ''}
  `);
  document.querySelectorAll('[data-open-cr]').forEach(b => b.onclick = () => openCompletionReportEditor(projectId, b.dataset.openCr));
  if (canEdit) document.getElementById('cr-new').onclick = () => openCompletionReportEditor(projectId, null);
}

function openCompletionReportEditor(projectId, reportId) {
  const p = (state.projects || []).find(x => x.id === projectId);
  if (!p) return;
  const existing = (p.completionReports || []).find(r => r.id === reportId);
  const rep = existing ? deepClone(existing) : newCompletionReport(p);
  const canEdit = !window.QAPerm || QAPerm.can('update', 'projects');
  const backBtn = '<button class="btn" id="cr-back">‹ Liste</button>';

  // Rapport figé : on montre ce qui a été remis au CAB, sans recalcul.
  if (rep.frozenAt && rep.snapshot) {
    openModal(`Test completion report · ${rep.changeNumber || ''}`, `
      <p style="margin:0 0 10px;font-size:12.5px;color:var(--text-soft);">Figé le ${new Date(rep.frozenAt).toLocaleString('fr-CH')} par ${escapeHtml(rep.frozenBy || '')} : ce rapport ne change plus.</p>
      <div class="wr-preview">${rep.snapshot.html}</div>
    `, `
      ${backBtn}
      ${canEdit ? '<button class="btn btn-danger" id="cr-delete">Supprimer</button>' : ''}
      <button class="btn" id="cr-md">Télécharger (.md)</button>
      <button class="btn btn-primary" id="cr-copy">Copier pour Confluence</button>
    `);
    document.getElementById('modal').classList.add('modal-wide');
    document.getElementById('cr-back').onclick = () => openCompletionReportsModal(projectId);
    document.getElementById('cr-md').onclick = () => crDownloadMarkdown(rep, rep.snapshot.markdown);
    document.getElementById('cr-copy').onclick = async () => {
      const ok = await copyRichText(rep.snapshot.html, rep.snapshot.markdown);
      toast(ok ? 'Rapport copié : collez-le dans Confluence ou joignez-le au changement' : 'Copie impossible : utilisez « Télécharger (.md) »');
    };
    if (canEdit) document.getElementById('cr-delete').onclick = () => {
      confirmDialog('Supprimer ce test completion report figé ? S’il a été remis au CAB, gardez-en une copie.', () => {
        p.completionReports = (p.completionReports || []).filter(r => r.id !== rep.id);
        save();
        toast('Rapport supprimé');
      });
    };
    return;
  }

  const field = 'width:100%;font:inherit;font-size:13px;padding:6px 8px;border:1px solid var(--border-strong);border-radius:var(--radius-sm);background:var(--surface);';
  const label = 'display:block;font-size:11.5px;font-weight:600;color:var(--text-soft);margin:10px 0 4px;';
  const runs = projectRuns(p).slice().sort((a, b) => String(b.exportedAt || b.importedAt).localeCompare(String(a.exportedAt || a.importedAt)));
  const projectPlans = state.testPlans.filter(pl => (p.planIds || []).includes(pl.id));
  const d0 = completionReportData(p, rep);

  openModal(`Test completion report · ${p.name || ''}`, `
    <div class="wr-layout">
      <div>
        <label style="${label}margin-top:0;" for="cr-change">Changement ServiceNow</label>
        <input id="cr-change" style="${field}" placeholder="CHG0012345" value="${escapeHtml(rep.changeNumber)}">
        <label style="${label}" for="cr-version">Livraison (version)</label>
        <input id="cr-version" style="${field}" value="${escapeHtml(rep.deliveryVersion)}">
        <div style="display:flex;gap:8px;">
          <div style="flex:1;"><label style="${label}" for="cr-date">Date</label><input type="date" id="cr-date" style="${field}" value="${escapeHtml(rep.reportDate)}"></div>
          <div style="flex:1;"><label style="${label}" for="cr-risk">Risk level</label>
            <select id="cr-risk" style="${field}">${CR_RISK_LEVELS.map(r => `<option value="${r.id}"${rep.riskLevel === r.id ? ' selected' : ''}>${r.label}</option>`).join('')}</select></div>
        </div>

        <label style="${label}">Scope : plans du changement</label>
        <div id="cr-plans" style="font-size:12.5px;max-height:120px;overflow:auto;border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 8px;">
          ${projectPlans.length ? projectPlans.map(pl => `<label style="display:flex;gap:6px;align-items:center;padding:2px 0;"><input type="checkbox" value="${pl.id}"${(rep.planIds || []).includes(pl.id) ? ' checked' : ''}> ${escapeHtml(planDisplayTitle(pl))}</label>`).join('') : '<span style="color:var(--text-muted);">Aucun plan rattaché au projet.</span>'}
        </div>
        <label style="${label}" for="cr-untested">Raison des test cases non testés</label>
        <textarea id="cr-untested" rows="2" style="${field}">${escapeHtml(rep.untestedReason)}</textarea>

        <label style="${label}" for="cr-reg-run">Regression testing : exécution</label>
        <select id="cr-reg-run" style="${field}">
          <option value="">— Aucune —</option>
          ${runs.map(r => `<option value="${escapeHtml(r.id)}"${rep.regressionRunId === r.id ? ' selected' : ''}>${escapeHtml(`${runDateLabel(r)} · ${runSourceLabel(r)} · ${r.tester || '—'}`)}</option>`).join('')}
        </select>
        <label style="${label}" for="cr-reg-kind">Nature de cette exécution</label>
        <select id="cr-reg-kind" style="${field}">${CR_REGRESSION_KINDS.map(k => `<option value="${k.id}"${rep.regressionKind === k.id ? ' selected' : ''}>${k.label}</option>`).join('')}</select>

        <label style="${label}">Décision sur chaque defect ouvert</label>
        <div id="cr-decisions"></div>

        <label style="${label}" for="cr-risks">Risques restants</label>
        <textarea id="cr-risks" rows="2" style="${field}">${escapeHtml(rep.risks)}</textarea>

        <label style="${label}" for="cr-reco">Recommandation</label>
        <select id="cr-reco" style="${field}">
          <option value="">Automatique (proposée : ${escapeHtml(crLabel(CR_RECOMMENDATIONS, d0.proposal))})</option>
          ${CR_RECOMMENDATIONS.map(r => `<option value="${r.id}"${rep.recommendation === r.id ? ' selected' : ''}>${escapeHtml(r.label)}</option>`).join('')}
        </select>
        <textarea id="cr-reco-text" rows="2" style="${field}margin-top:6px;" placeholder="Conditions ou commentaire">${escapeHtml(rep.recommendationText)}</textarea>

        <div style="display:flex;gap:8px;">
          <div style="flex:2;"><label style="${label}" for="cr-uat-name">UAT sign-off : nom</label><input id="cr-uat-name" style="${field}" value="${escapeHtml(rep.uatName)}"></div>
          <div style="flex:1;"><label style="${label}" for="cr-uat-date">Date</label><input type="date" id="cr-uat-date" style="${field}" value="${escapeHtml(rep.uatDate)}"></div>
        </div>
        <label style="${label}" for="cr-links">Test evidence : liens (journaux, captures…)</label>
        <textarea id="cr-links" rows="2" style="${field}">${escapeHtml(rep.evidenceLinks)}</textarea>
      </div>
      <div class="wr-preview" id="cr-preview"></div>
    </div>
  `, `
    ${backBtn}
    <button class="btn" id="cr-md">Télécharger (.md)</button>
    <button class="btn" id="cr-copy">Copier pour Confluence</button>
    ${canEdit ? '<button class="btn" id="cr-save">Enregistrer le brouillon</button><button class="btn btn-primary" id="cr-freeze">Figer pour le CAB</button>' : ''}
  `);
  document.getElementById('modal').classList.add('modal-wide');

  const val = id => document.getElementById(id).value;
  const readForm = () => {
    rep.changeNumber = val('cr-change').trim();
    rep.deliveryVersion = val('cr-version').trim();
    rep.reportDate = val('cr-date');
    rep.riskLevel = val('cr-risk');
    rep.planIds = Array.from(document.querySelectorAll('#cr-plans input:checked')).map(i => i.value);
    rep.untestedReason = val('cr-untested').trim();
    rep.regressionRunId = val('cr-reg-run');
    rep.regressionKind = val('cr-reg-kind');
    rep.risks = val('cr-risks').trim();
    rep.recommendation = val('cr-reco');
    rep.recommendationText = val('cr-reco-text').trim();
    rep.uatName = val('cr-uat-name').trim();
    rep.uatDate = val('cr-uat-date');
    rep.evidenceLinks = val('cr-links').trim();
    document.querySelectorAll('[data-cr-decision]').forEach(i => {
      rep.decisions = Object.assign({}, rep.decisions, { [i.dataset.crDecision]: i.value.trim() });
    });
  };
  // Les champs de décision dépendent du scope : on les redessine quand le scope change.
  const renderDecisions = (d) => {
    document.getElementById('cr-decisions').innerHTML = d.openDefects.length
      ? d.openDefects.map(a => `
          <div style="margin-bottom:6px;">
            <div style="font-size:12px;"><span class="badge ${a.severity === 'critical' || a.severity === 'major' ? 'badge-danger' : 'badge-muted'}">${escapeHtml(crSeverityLabel(a.severity))}</span> ${escapeHtml(a.title || '(sans titre)')}</div>
            <input data-cr-decision="${escapeHtml(a.id)}" style="${field}margin-top:3px;" placeholder="Qui accepte le risque, jusqu’à quand ; ou : à corriger avant la mise en production" value="${escapeHtml((rep.decisions || {})[a.id] || '')}">
          </div>`).join('')
      : '<div style="font-size:12px;color:var(--text-muted);">Aucun defect ouvert sur le scope.</div>';
    document.querySelectorAll('[data-cr-decision]').forEach(i => i.addEventListener('input', refresh));
  };
  const refresh = () => {
    readForm();
    const d = completionReportData(p, rep);
    document.getElementById('cr-preview').innerHTML = completionReportHtml(p, rep, d);
    document.querySelector('#cr-reco option[value=""]').textContent = `Automatique (proposée : ${crLabel(CR_RECOMMENDATIONS, d.proposal)})`;
    return d;
  };
  document.querySelectorAll('.modal-body input, .modal-body select, .modal-body textarea').forEach(el => {
    if (el.dataset.crDecision === undefined) el.addEventListener('input', refresh);
  });
  document.querySelectorAll('#cr-plans input, #cr-risk').forEach(el => el.addEventListener('change', () => renderDecisions(refresh())));
  renderDecisions(d0);
  refresh();

  document.getElementById('cr-back').onclick = () => openCompletionReportsModal(projectId);
  document.getElementById('cr-md').onclick = () => { const d = refresh(); crDownloadMarkdown(rep, completionReportMarkdown(p, rep, d)); };
  document.getElementById('cr-copy').onclick = async () => {
    const d = refresh();
    const ok = await copyRichText(completionReportHtml(p, rep, d), completionReportMarkdown(p, rep, d));
    toast(ok ? 'Rapport copié (brouillon) : figez-le avant de le remettre au CAB' : 'Copie impossible : utilisez « Télécharger (.md) »');
  };
  if (!canEdit) return;
  document.getElementById('cr-save').onclick = () => {
    refresh();
    rep.updatedAt = new Date().toISOString();
    crSaveReport(p, rep);
    toast('Brouillon enregistré');
  };
  document.getElementById('cr-freeze').onclick = () => {
    if (!rep.changeNumber) { toast('Renseignez le numéro du changement ServiceNow avant de figer'); return; }
    refresh();
    crSaveReport(p, rep);   // le brouillon est gardé même si l'on annule
    confirmDialog(`Figer le rapport du changement ${rep.changeNumber} ? Les chiffres et le texte ne bougeront plus.`, () => {
      rep.frozenAt = new Date().toISOString();
      rep.frozenBy = (QASession.username && QASession.username()) || '';
      const d = completionReportData(p, rep);
      rep.snapshot = {
        html: completionReportHtml(p, rep, d),
        markdown: completionReportMarkdown(p, rep, d),
        recommendation: rep.recommendation || d.proposal,
        criteria: d.criteria.map(c => ({ key: c.key, status: c.status })),
      };
      crSaveReport(p, rep);
      toast('Rapport figé');
      openCompletionReportEditor(projectId, rep.id);
    });
  };
}
