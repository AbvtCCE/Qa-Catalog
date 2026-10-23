/* Catalogue de tests — module « completion-report.js ».
   Fait partie de l'application principale (index.html). L'ordre de chargement
   des <script> compte : voir index.html. Ne pas ouvrir isolément. */
/* ===== Changement, entry / exit criteria et test completion report d'un test plan =====
   Plan qualité, semaine 3, rendu générique (l'outil des changements se configure dans
   « Outils reliés ») : « Dans chaque test plan : entry et exit criteria, référence du
   changement, et un test completion report généré, prêt pour le CAB. »
   - Sur le test plan : changeNumber, riskLevel, kind (nature, d'après la Test strategy).
   - plan.deliveries : livraisons reçues en test, contrôlées avec les entry criteria du
     modèle « Entry et exit criteria » (S3-1), décision et jours de test perdus (S3-6).
   - plan.exitAdaptations : exit criteria adaptés par ce plan, avec la raison (modèle :
     « Un test plan peut les adapter ; il dit alors pourquoi »).
   - plan.completionReports : test completion reports (modèle « Test completion report »,
     S3-5). « Figer » enregistre le rapport tel quel : après le CAB, il ne bouge plus. */

const CR_RISK_LEVELS = [
  { id: 'low', label: 'Faible' },
  { id: 'medium', label: 'Moyen' },
  { id: 'high', label: 'Élevé' },
];
/* Nature du test plan : les trois regression suites de la Test strategy, ou un changement. */
const CR_PLAN_KINDS = [
  { id: 'change', label: 'Changement', rank: 0 },
  { id: 'smoke', label: 'Smoke test', rank: 1 },
  { id: 'targeted', label: 'Targeted regression', rank: 2 },
  { id: 'full', label: 'Full regression', rank: 3 },
];
const CR_REQUIRED_REGRESSION = { low: 'smoke', medium: 'targeted', high: 'full' };
const CR_ENTRY_CRITERIA = [
  { id: 'release_notes', label: 'La liste des changements ou les release notes disent ce qui a changé et ce qui est touché.' },
  { id: 'installed', label: 'La livraison est installée dans le test environment et sa version est identifiée.' },
  { id: 'component_tests', label: 'Le component testing du développeur ou les tests de l’éditeur sont faits, et leur résultat est joint.' },
  { id: 'smoke', label: 'Le smoke test passe.' },
  { id: 'test_data', label: 'Les test data nécessaires sont disponibles ou demandées.' },
  { id: 'known_defects', label: 'Les defects connus sont listés.' },
];
const CR_DELIVERY_DECISIONS = [
  { id: 'accepted', label: 'Acceptée' },
  { id: 'accepted_with_reserve', label: 'Acceptée avec réserve' },
  { id: 'refused', label: 'Refusée' },
];
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
const CR_STATUS_LABELS = { met: 'Atteint', not_met: 'Non atteint' };
const CR_SEVERITY_ORDER = ['critical', 'major', 'minor', 'trivial'];

const crLabel = (list, id) => (list.find(x => x.id === id) || {}).label || id;
const crSeverityLabel = id => (WR_SEVERITY_ROWS.find(s => s.id === id) || {}).label || id;
const crKindRank = id => (CR_PLAN_KINDS.find(k => k.id === id) || { rank: 0 }).rank;
const crPlanById = id => state.testPlans.find(p => p.id === id);
/* Référence du changement, en lien si l'outil des changements a un modèle de lien (Outils reliés). */
function crChangeRefHtml(ref) {
  if (!ref) return '[référence du changement]';
  const url = toolUrl('changes', ref);
  return url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(ref)}</a>` : escapeHtml(ref);
}

/* Entry criteria non remplis d'une livraison */
function deliveryMissingCriteria(dlv) {
  return CR_ENTRY_CRITERIA.filter(c => !(dlv.checks || {})[c.id]);
}
/* Une livraison est conforme quand les 6 entry criteria sont remplis et qu'elle est acceptée. */
function deliveryCompliant(dlv) {
  return dlv.decision === 'accepted' && deliveryMissingCriteria(dlv).length === 0;
}
function crSortedDeliveries(plan) {
  return (plan.deliveries || []).slice().sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt)));
}

/* Exécutions des plans de régression (nature smoke / targeted / full), plus récentes d'abord. */
function crRegressionRuns() {
  return (state.testRuns || [])
    .filter(r => r.sourceType === 'plan' && crKindRank((crPlanById(r.sourceId) || {}).kind) > 0)
    .sort((a, b) => String(b.exportedAt || b.importedAt).localeCompare(String(a.exportedAt || a.importedAt)));
}

function newCompletionReport(plan) {
  const required = crKindRank(CR_REQUIRED_REGRESSION[plan.riskLevel || 'medium']);
  const regRuns = crRegressionRuns();
  const reg = regRuns.find(r => crKindRank(crPlanById(r.sourceId).kind) >= required) || regRuns[0];
  const dlv = crSortedDeliveries(plan).find(x => x.decision !== 'refused');
  return {
    id: uid(),
    reportDate: wrIso(new Date()),
    deliveryId: dlv ? dlv.id : '',
    regressionRunId: reg ? reg.id : '',
    priorityConfirmed: false,
    manualStatus: {},
    untestedReason: '', decisions: {}, risks: '',
    recommendation: '', recommendationText: '',
    uatName: '', uatDate: '', evidenceLinks: '',
    createdAt: new Date().toISOString(), createdBy: (QASession.username && QASession.username()) || '',
    frozenAt: null, frozenBy: null, snapshot: null,
  };
}

/* Test cases prioritaires du domaine du plan : ceux des risques élevés de ses divisions.
   riskBased = false quand on ne peut pas le savoir (aucun risque noté, plan sans division). */
function crPriorityCases(plan) {
  const divs = new Set(plan.divisionIds || []);
  const risks = state.productRisks || [];
  if (!risks.length || !divs.size) return { riskBased: false, ids: [] };
  const ids = new Set();
  risks.filter(r => riskClass(r) === 'high' && divs.has(r.divisionId)).forEach(r => (r.testCaseIds || []).forEach(id => ids.add(id)));
  return { riskBased: true, ids: Array.from(ids) };
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

function completionReportData(plan, rep) {
  const risk = plan.riskLevel || 'medium';
  const scopeCases = collectPlanCases(plan, true);
  const scopeIds = new Set(scopeCases.map(c => c.id));
  const runs = state.testRuns || [];

  // Résultats : dernier résultat connu de chaque test case du plan, quelle que soit l'exécution
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

  const openDefects = (state.anomalies || [])
    .filter(a => anomalyIsOpen(a) && (a.testCaseIds || []).some(id => scopeIds.has(id)))
    .sort((a, b) => CR_SEVERITY_ORDER.indexOf(a.severity) - CR_SEVERITY_ORDER.indexOf(b.severity));
  // Décision saisie dans le rapport ; à défaut, celle d'un defect Deferred (risque accepté nommé)
  const decision = a => String((rep.decisions || {})[a.id] || '').trim()
    || (a.state === 'deferred' && a.deferredBy ? `Deferred : risque accepté par ${a.deferredBy}${a.deferredUntil ? ` jusqu’au ${wrFmt(a.deferredUntil)}` : ''}` : '');

  const delivery = (plan.deliveries || []).find(x => x.id === rep.deliveryId) || null;
  const regRun = runs.find(r => r.id === rep.regressionRunId) || null;
  const regPlan = regRun && regRun.sourceType === 'plan' ? crPlanById(regRun.sourceId) : null;
  const regKind = regPlan ? (regPlan.kind || 'change') : null;
  const regCounts = regRun ? runCounts(regRun) : null;

  // Exit criteria, selon le risk level du plan
  const status = {}, detail = {};
  const allExecuted = scopeCases.length > 0 && executed === scopeCases.length;
  // Risque moyen : test cases prioritaires du domaine = ceux des risques élevés des divisions du
  // plan (product risk analysis, S5). Sans analyse ou sans division, la QA le constate à la main.
  const prio = crPriorityCases(plan);
  let prioOk = !!rep.priorityConfirmed, prioDetail;
  if (prio.riskBased) {
    const latestPrio = crLatestResults(runs, new Set(prio.ids));
    const prioExecuted = prio.ids.filter(id => {
      const l = latestPrio.get(id);
      return l && (l.res.outcome === 'passed' || l.res.outcome === 'failed');
    }).length;
    prioOk = prioExecuted === prio.ids.length;
    prioDetail = prio.ids.length
      ? ` ; ${prioExecuted} / ${prio.ids.length} test cases prioritaires du domaine (risques élevés) exécutés`
      : ' ; aucun test case prioritaire (risque élevé) dans ce domaine';
  } else {
    prioDetail = rep.priorityConfirmed
      ? ` ; test cases prioritaires du domaine exécutés (confirmé par ${rep.priorityConfirmedBy || 'la QA'})`
      : ' ; test cases prioritaires du domaine : non confirmés';
  }
  status.executed = allExecuted && (risk !== 'medium' || prioOk) ? 'met' : 'not_met';
  detail.executed = `${executed} / ${scopeCases.length} test cases du plan exécutés` + (risk === 'medium' ? prioDetail : '');

  const nBlocker = openDefects.filter(a => a.severity === 'critical').length;
  const majors = openDefects.filter(a => a.severity === 'major');
  const majorsUndecided = majors.filter(a => !decision(a)).length;
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
    const kindOk = crKindRank(regKind) >= crKindRank(reqKind);
    const resOk = regCounts.failed === 0 && regCounts.blocked === 0 && regCounts.not_run === 0;
    status.regression = kindOk && resOk ? 'met' : 'not_met';
    detail.regression = `${regPlan ? planDisplayTitle(regPlan) : runSourceLabel(regRun)} (${crLabel(CR_PLAN_KINDS, regKind)}) du ${runDateLabel(regRun)} : ${regCounts.passed} passed, ${regCounts.failed} failed, ${regCounts.blocked} blocked, ${regCounts.not_run} non exécutés`
      + (kindOk ? '' : ` ; une ${crLabel(CR_PLAN_KINDS, reqKind)} est exigée`);
  }

  const hasUat = !!(String(rep.uatName || '').trim() && rep.uatDate);
  status.uat = hasUat || risk !== 'high' ? 'met' : 'not_met';
  detail.uat = hasUat ? `${rep.uatName}, le ${wrFmt(rep.uatDate)}`
    : ({ low: 'Non requis', medium: 'Non fourni (recommandé)', high: 'Non fourni' })[risk];

  // Criterion adapté par le plan : le constat est posé à la main dans le rapport
  const adapt = plan.exitAdaptations || {};
  const criteria = CR_CRITERIA.map(c => {
    const a = adapt[c.key];
    if (a && String(a.text || '').trim()) {
      const manual = (rep.manualStatus || {})[c.key];
      return { key: c.key, label: c.label, required: `${a.text} (adapté : ${a.reason || 'raison non donnée'})`,
        status: manual === 'met' ? 'met' : 'not_met', detail: `${detail[c.key]} ; constat posé par la QA`, adapted: true };
    }
    return { key: c.key, label: c.label, required: c.required[risk], status: status[c.key], detail: detail[c.key], adapted: false };
  });
  const notMet = criteria.filter(c => c.status === 'not_met');

  // Conditions : ce que la mise en production accepte en connaissance de cause
  const conditions = [];
  if (risk === 'medium') majors.forEach(a => { if (decision(a)) conditions.push(`Major accepté : ${a.title || '(sans titre)'} (${decision(a)})`); });
  if (delivery && delivery.decision === 'accepted_with_reserve') {
    conditions.push(`Livraison ${delivery.version || ''} acceptée avec réserve : ${deliveryMissingCriteria(delivery).map(c => c.label).join(' ') || 'voir la note de la livraison'}`);
  }
  criteria.filter(c => c.adapted).forEach(c => conditions.push(`Exit criterion adapté : ${c.label}`));
  const proposal = notMet.length ? 'no_go' : (conditions.length ? 'go_conditions' : 'go');

  return {
    risk, scopeCases, passed, failed, blocked, executed, untested, openDefects,
    decisionFor: Object.fromEntries(openDefects.map(a => [a.id, decision(a)])),
    delivery, regRun, regCounts, criteria, notMet, conditions, proposal,
    runsInScope: runs.filter(r => (r.results || []).some(x => scopeIds.has(x.caseId)) || r.id === rep.regressionRunId),
  };
}

function crEvidenceLine(r) {
  const c = runCounts(r);
  return `${runDateLabel(r)} · ${runSourceLabel(r)} · ${r.tester || '—'} : ${c.passed} passed, ${c.failed} failed, ${c.blocked} blocked, ${c.not_run} non exécutés`;
}

function crDeliveryLabel(d) {
  if (!d) return '[version]';
  return `${d.version || '(sans version)'} (reçue le ${d.receivedAt ? wrFmt(d.receivedAt) : '–'}, ${crLabel(CR_DELIVERY_DECISIONS, d.decision).toLowerCase()})`;
}

/* Le rapport en HTML sémantique : il se colle tel quel dans un wiki ou dans l'outil des changements. */
function completionReportHtml(plan, rep, d) {
  const txt = t => escapeHtml(t || '').replace(/\n/g, '<br>');
  const cell = 'border:1px solid #ccc;padding:4px 8px;vertical-align:top;';
  const th = cell + 'background:#f4f5f7;text-align:left;';
  const table = (head, rows) => `<table style="border-collapse:collapse;"><thead><tr>${head.map(h => `<th style="${th}">${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(v => `<td style="${cell}">${escapeHtml(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const reco = rep.recommendation || d.proposal;
  const shown = d.untested.slice(0, 30);
  return `
    <h1>Test completion report</h1>
    <p>Changement : <strong>${crChangeRefHtml(plan.changeNumber)}</strong>. Livraison : ${escapeHtml(crDeliveryLabel(d.delivery))}. Date : ${rep.reportDate ? wrFmt(rep.reportDate) : '–'}.<br>
       Test plan : ${escapeHtml(planDisplayTitle(plan))}. Risk level : ${escapeHtml(crLabel(CR_RISK_LEVELS, d.risk))}.</p>
    <h2>Ce qui a été testé</h2>
    <p>${d.scopeCases.length} test case${d.scopeCases.length > 1 ? 's' : ''} prévu${d.scopeCases.length > 1 ? 's' : ''} dans le test plan.</p>
    ${d.untested.length ? `<p>Non testé : ${d.untested.length} test case${d.untested.length > 1 ? 's' : ''}.</p>
      <ul>${shown.map(u => `<li>${escapeHtml(u.title)} (${escapeHtml(u.why)})</li>`).join('')}${d.untested.length > shown.length ? `<li>et ${d.untested.length - shown.length} autres</li>` : ''}</ul>
      ${rep.untestedReason ? `<p>Raison : ${txt(rep.untestedReason)}</p>` : ''}` : '<p>Tous les test cases prévus ont été exécutés.</p>'}
    <h2>Résultats</h2>
    ${table(['Exécutés', 'Passed', 'Failed', 'Blocked', 'Regression testing'], [[d.executed, d.passed, d.failed, d.blocked, d.regRun ? crEvidenceLine(d.regRun) : 'Non fournie']])}
    <h2>Defects ouverts</h2>
    ${d.openDefects.length ? table(['Defect', 'Severity', 'Contournement', 'Décision'], d.openDefects.map(a => [a.title || '(sans titre)', crSeverityLabel(a.severity), a.workaround || '–', d.decisionFor[a.id] || '–'])) : '<p>Aucun defect ouvert sur ce test plan.</p>'}
    <h2>Exit criteria</h2>
    ${table(['Criterion', `Exigé (risque ${crLabel(CR_RISK_LEVELS, d.risk).toLowerCase()})`, 'Constat', 'Statut'], d.criteria.map(c => [c.label, c.required, c.detail, CR_STATUS_LABELS[c.status]]))}
    <p>${d.notMet.length ? `Non atteints : ${d.notMet.map(c => escapeHtml(c.label)).join(', ')}. Le CAB décide : report, ou mise en production avec un risque accepté par une personne nommée.` : 'Tous les exit criteria sont atteints.'}</p>
    <h2>Risques restants</h2>
    <p>${rep.risks ? txt(rep.risks) : '–'}</p>
    <h2>Recommandation</h2>
    <p><strong>${escapeHtml(crLabel(CR_RECOMMENDATIONS, reco))}</strong>${rep.recommendationText ? ` : ${txt(rep.recommendationText)}` : '.'}</p>
    ${reco === 'go_conditions' && d.conditions.length ? `<ul>${d.conditions.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>` : ''}
    <h2>UAT sign-off</h2>
    <p>${String(rep.uatName || '').trim() ? `${escapeHtml(rep.uatName)}${rep.uatDate ? `, le ${wrFmt(rep.uatDate)}` : ''}` : `Non fourni${d.risk === 'high' ? ' (obligatoire pour un risque élevé)' : ''}.`}</p>
    <h2>Test evidence</h2>
    ${d.runsInScope.length ? `<ul>${d.runsInScope.map(r => `<li>Exécution du ${escapeHtml(crEvidenceLine(r))}</li>`).join('')}</ul>` : '<p>Aucune exécution importée pour ce test plan.</p>'}
    <p>Captures : dans les rapports PDF des checklists.${rep.evidenceLinks ? `<br>${txt(rep.evidenceLinks)}` : ''}</p>
    <p><small>Établi le ${new Date().toLocaleString('fr-CH')} par le catalogue de tests${rep.frozenAt ? ` ; figé le ${new Date(rep.frozenAt).toLocaleString('fr-CH')} par ${escapeHtml(rep.frozenBy || '')}` : ''}.</small></p>`;
}

function completionReportMarkdown(plan, rep, d) {
  const md = t => String(t == null ? '' : t).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const row = cols => `| ${cols.map(md).join(' | ')} |`;
  const table = (head, rows) => [row(head), row(head.map(() => '---')), ...rows.map(row)].join('\n');
  const reco = rep.recommendation || d.proposal;
  const shown = d.untested.slice(0, 30);
  return [
    '# Test completion report', '',
    `Changement : **${plan.changeNumber || '[référence du changement]'}**. Livraison : ${crDeliveryLabel(d.delivery)}. Date : ${rep.reportDate ? wrFmt(rep.reportDate) : '–'}.`,
    `Test plan : ${planDisplayTitle(plan)}. Risk level : ${crLabel(CR_RISK_LEVELS, d.risk)}.`, '',
    '## Ce qui a été testé', '',
    `${d.scopeCases.length} test case(s) prévu(s) dans le test plan.`, '',
    ...(d.untested.length
      ? [`Non testé : ${d.untested.length} test case(s).`, '', ...shown.map(u => `- ${u.title} (${u.why})`),
         ...(d.untested.length > shown.length ? [`- et ${d.untested.length - shown.length} autres`] : []),
         ...(rep.untestedReason ? ['', `Raison : ${rep.untestedReason}`] : [])]
      : ['Tous les test cases prévus ont été exécutés.']), '',
    '## Résultats', '',
    table(['Exécutés', 'Passed', 'Failed', 'Blocked', 'Regression testing'], [[d.executed, d.passed, d.failed, d.blocked, d.regRun ? crEvidenceLine(d.regRun) : 'Non fournie']]), '',
    '## Defects ouverts', '',
    d.openDefects.length ? table(['Defect', 'Severity', 'Contournement', 'Décision'], d.openDefects.map(a => [a.title || '(sans titre)', crSeverityLabel(a.severity), a.workaround || '–', d.decisionFor[a.id] || '–'])) : 'Aucun defect ouvert sur ce test plan.', '',
    '## Exit criteria', '',
    table(['Criterion', `Exigé (risque ${crLabel(CR_RISK_LEVELS, d.risk).toLowerCase()})`, 'Constat', 'Statut'], d.criteria.map(c => [c.label, c.required, c.detail, CR_STATUS_LABELS[c.status]])), '',
    d.notMet.length ? `Non atteints : ${d.notMet.map(c => c.label).join(', ')}. Le CAB décide : report, ou mise en production avec un risque accepté par une personne nommée.` : 'Tous les exit criteria sont atteints.', '',
    '## Risques restants', '', rep.risks || '–', '',
    '## Recommandation', '', `**${crLabel(CR_RECOMMENDATIONS, reco)}**${rep.recommendationText ? ` : ${rep.recommendationText}` : '.'}`,
    ...(reco === 'go_conditions' && d.conditions.length ? ['', ...d.conditions.map(c => `- ${c}`)] : []), '',
    '## UAT sign-off', '',
    String(rep.uatName || '').trim() ? `${rep.uatName}${rep.uatDate ? `, le ${wrFmt(rep.uatDate)}` : ''}` : `Non fourni${d.risk === 'high' ? ' (obligatoire pour un risque élevé)' : ''}.`, '',
    '## Test evidence', '',
    ...(d.runsInScope.length ? d.runsInScope.map(r => `- Exécution du ${crEvidenceLine(r)}`) : ['Aucune exécution importée pour ce test plan.']), '',
    'Captures : dans les rapports PDF des checklists.', ...(rep.evidenceLinks ? [rep.evidenceLinks] : []), '',
    `_Établi le ${new Date().toLocaleString('fr-CH')} par le catalogue de tests${rep.frozenAt ? ` ; figé le ${new Date(rep.frozenAt).toLocaleString('fr-CH')} par ${rep.frozenBy || ''}` : ''}._`,
  ].join('\n');
}

function crDownloadMarkdown(plan, text) {
  const blob = new Blob([text], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const safe = String(plan.changeNumber || plan.title || 'changement').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'changement';
  a.download = `test-completion-report-${safe}.md`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function crUpsert(plan, key, item) {
  const list = (plan[key] || []).slice();
  const i = list.findIndex(x => x.id === item.id);
  if (i >= 0) list[i] = item; else list.push(item);
  plan[key] = list;
  save();
}

const crField = 'width:100%;font:inherit;font-size:13px;padding:6px 8px;border:1px solid var(--border-strong);border-radius:var(--radius-sm);background:var(--surface);';
const crFieldLabel = 'display:block;font-size:11.5px;font-weight:600;color:var(--text-soft);margin:10px 0 4px;';
const crTd = 'padding:6px 8px;border-bottom:1px solid var(--border);vertical-align:top;';
const crTh = crTd + 'text-align:left;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:0.04em;';
const crCanEdit = () => !window.QAPerm || QAPerm.can('update', 'testplans');

/* ===== Fenêtre du test plan : changement, livraisons, exit criteria, completion reports ===== */
function openPlanCriteriaModal(planId) {
  const plan = crPlanById(planId);
  if (!plan) return;
  const canEdit = crCanEdit();
  const risk = plan.riskLevel || '';
  const deliveries = crSortedDeliveries(plan);
  const reports = (plan.completionReports || []).slice().sort((a, b) => String(b.reportDate).localeCompare(String(a.reportDate)));
  const adapt = plan.exitAdaptations || {};

  openModal(`Changement et criteria · ${planDisplayTitle(plan)}`, `
    <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:6px;">
      <span class="badge ${plan.changeNumber ? 'badge-primary' : 'badge-muted'}">Changement : ${plan.changeNumber ? crChangeRefHtml(plan.changeNumber) : 'non renseigné'}</span>
      <span class="badge ${risk ? '' : 'badge-warning'}">Risk level : ${escapeHtml(risk ? crLabel(CR_RISK_LEVELS, risk) : 'non renseigné')}</span>
      <span class="badge">Nature : ${escapeHtml(crLabel(CR_PLAN_KINDS, plan.kind || 'change'))}</span>
      ${canEdit ? '<button class="btn btn-sm" id="pc-edit-plan">Modifier dans le plan</button>' : ''}
    </div>
    ${!plan.changeNumber || !risk ? '<p style="font-size:12px;color:#8a6a25;margin:0 0 8px;">Renseignez la référence du changement et le risk level dans le plan : les exit criteria et le test completion report en dépendent.</p>' : ''}

    <h3 style="font-size:14px;margin:16px 0 6px;">Livraisons reçues en test <span style="font-weight:400;color:var(--text-muted);font-size:12px;">· entry criteria</span></h3>
    ${deliveries.length === 0 ? '<p style="font-size:12.5px;color:var(--text-muted);font-style:italic;margin:0;">Aucune livraison enregistrée.</p>' : `
      <table style="border-collapse:collapse;width:100%;font-size:12.5px;">
        <thead><tr><th style="${crTh}">Version</th><th style="${crTh}">Reçue le</th><th style="${crTh}">Entry criteria</th><th style="${crTh}">Décision</th><th style="${crTh}">Jours perdus</th><th style="${crTh}"></th></tr></thead>
        <tbody>${deliveries.map(dl => {
          const missing = deliveryMissingCriteria(dl).length;
          return `<tr>
            <td style="${crTd}"><strong>${escapeHtml(dl.version || '(sans version)')}</strong></td>
            <td style="${crTd}white-space:nowrap;">${dl.receivedAt ? wrFmt(dl.receivedAt) : '–'}</td>
            <td style="${crTd}"><span class="badge ${missing ? 'badge-warning' : 'badge-success'}">${CR_ENTRY_CRITERIA.length - missing} / ${CR_ENTRY_CRITERIA.length}</span></td>
            <td style="${crTd}"><span class="badge ${dl.decision === 'accepted' ? 'badge-success' : dl.decision === 'refused' ? 'badge-danger' : 'badge-warning'}">${escapeHtml(crLabel(CR_DELIVERY_DECISIONS, dl.decision))}</span></td>
            <td style="${crTd}">${dl.lostDays ? escapeHtml(dl.lostDays) : '–'}</td>
            <td style="${crTd}text-align:right;">${canEdit ? `<button class="btn btn-sm" data-edit-dlv="${escapeHtml(dl.id)}">Ouvrir</button>` : ''}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>`}
    ${canEdit ? '<button class="btn btn-sm" id="pc-add-dlv" style="margin-top:8px;">' + ICON.plus + '<span>Enregistrer une livraison</span></button>' : ''}

    <h3 style="font-size:14px;margin:18px 0 6px;">Exit criteria <span style="font-weight:400;color:var(--text-muted);font-size:12px;">· modèle « Entry et exit criteria »${risk ? ', risque ' + escapeHtml(crLabel(CR_RISK_LEVELS, risk).toLowerCase()) : ''}</span></h3>
    <p style="font-size:12px;color:var(--text-soft);margin:0 0 6px;">Un test plan peut les adapter ; il dit alors pourquoi.</p>
    <table style="border-collapse:collapse;width:100%;font-size:12.5px;">
      <thead><tr><th style="${crTh}">Criterion</th><th style="${crTh}">Exigé</th><th style="${crTh}">Adaptation pour ce plan</th><th style="${crTh}">Raison</th></tr></thead>
      <tbody>${CR_CRITERIA.map(c => `<tr>
        <td style="${crTd}">${escapeHtml(c.label)}</td>
        <td style="${crTd}">${escapeHtml(risk ? c.required[risk] : '— (risk level à renseigner)')}</td>
        <td style="${crTd}"><input data-adapt-text="${c.key}" style="${crField}" value="${escapeHtml((adapt[c.key] || {}).text || '')}" placeholder="Aucune" ${canEdit ? '' : 'disabled'}></td>
        <td style="${crTd}"><input data-adapt-reason="${c.key}" style="${crField}" value="${escapeHtml((adapt[c.key] || {}).reason || '')}" ${canEdit ? '' : 'disabled'}></td>
      </tr>`).join('')}</tbody>
    </table>
    ${canEdit ? '<button class="btn btn-sm" id="pc-save-adapt" style="margin-top:8px;">Enregistrer les adaptations</button>' : ''}

    <h3 style="font-size:14px;margin:18px 0 6px;">Test completion reports <span style="font-weight:400;color:var(--text-muted);font-size:12px;">· test evidence pour le CAB</span></h3>
    ${reports.length === 0 ? '<p style="font-size:12.5px;color:var(--text-muted);font-style:italic;margin:0;">Aucun rapport pour ce test plan.</p>' : `
      <table style="border-collapse:collapse;width:100%;font-size:12.5px;">
        <thead><tr><th style="${crTh}">Date</th><th style="${crTh}">Livraison</th><th style="${crTh}">Recommandation</th><th style="${crTh}">Statut</th><th style="${crTh}"></th></tr></thead>
        <tbody>${reports.map(r => {
          const reco = r.snapshot ? r.snapshot.recommendation : (r.recommendation || completionReportData(plan, r).proposal);
          const dl = (plan.deliveries || []).find(x => x.id === r.deliveryId);
          return `<tr>
            <td style="${crTd}white-space:nowrap;">${r.reportDate ? wrFmt(r.reportDate) : '–'}</td>
            <td style="${crTd}">${escapeHtml(dl ? dl.version || '' : '–')}</td>
            <td style="${crTd}">${escapeHtml(crLabel(CR_RECOMMENDATIONS, reco))}</td>
            <td style="${crTd}">${r.frozenAt ? '<span class="badge badge-primary">Figé</span>' : '<span class="badge badge-muted">Brouillon</span>'}</td>
            <td style="${crTd}text-align:right;"><button class="btn btn-sm" data-open-cr="${escapeHtml(r.id)}">Ouvrir</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table>`}
  `, `
    <button class="btn" data-close-modal>Fermer</button>
    ${canEdit ? '<button class="btn btn-primary" id="pc-new-cr">Nouveau test completion report</button>' : ''}
  `);
  document.getElementById('modal').classList.add('modal-wide');

  document.querySelectorAll('[data-open-cr]').forEach(b => b.onclick = () => openCompletionReportEditor(planId, b.dataset.openCr));
  if (!canEdit) return;
  document.getElementById('pc-edit-plan').onclick = () => openTestPlanModal(planId);
  document.getElementById('pc-add-dlv').onclick = () => openDeliveryEditor(planId, null);
  document.querySelectorAll('[data-edit-dlv]').forEach(b => b.onclick = () => openDeliveryEditor(planId, b.dataset.editDlv));
  document.getElementById('pc-new-cr').onclick = () => {
    if (!plan.riskLevel) { toast('Renseignez d’abord le risk level du plan'); return; }
    openCompletionReportEditor(planId, null);
  };
  document.getElementById('pc-save-adapt').onclick = () => {
    const next = {};
    for (const c of CR_CRITERIA) {
      const text = document.querySelector(`[data-adapt-text="${c.key}"]`).value.trim();
      const reason = document.querySelector(`[data-adapt-reason="${c.key}"]`).value.trim();
      if (!text) continue;
      if (!reason) { toast(`Adaptation « ${c.label} » : donnez la raison`); return; }
      next[c.key] = { text, reason };
    }
    plan.exitAdaptations = next;
    save();
    toast('Adaptations enregistrées');
    openPlanCriteriaModal(planId);
  };
}

/* Livraison reçue en test : entry criteria, décision, jours de test perdus (S3-1, S3-6). */
function openDeliveryEditor(planId, deliveryId) {
  const plan = crPlanById(planId);
  if (!plan) return;
  const existing = (plan.deliveries || []).find(x => x.id === deliveryId);
  const dlv = existing ? deepClone(existing) : { id: uid(), version: '', receivedAt: wrIso(new Date()), checks: {}, decision: 'accepted', lostDays: '', note: '' };
  openModal(existing ? `Livraison ${dlv.version || ''}` : 'Enregistrer une livraison', `
    <div style="display:flex;gap:8px;">
      <div style="flex:2;"><label style="${crFieldLabel}margin-top:0;" for="dl-version">Version livrée</label><input id="dl-version" style="${crField}" value="${escapeHtml(dlv.version)}" placeholder="Ex. release 2.4.1, transport K900123"></div>
      <div style="flex:1;"><label style="${crFieldLabel}margin-top:0;" for="dl-date">Reçue en test le</label><input type="date" id="dl-date" style="${crField}" value="${escapeHtml(dlv.receivedAt)}"></div>
    </div>
    <label style="${crFieldLabel}">Entry criteria : la livraison est acceptée en test si</label>
    <div id="dl-checks">
      ${CR_ENTRY_CRITERIA.map(c => `<label style="display:flex;gap:8px;align-items:flex-start;font-size:13px;padding:3px 0;"><input type="checkbox" value="${c.id}" ${(dlv.checks || {})[c.id] ? 'checked' : ''} style="margin-top:3px;"> <span>${escapeHtml(c.label)}</span></label>`).join('')}
    </div>
    <div style="display:flex;gap:8px;">
      <div style="flex:2;"><label style="${crFieldLabel}" for="dl-decision">Décision</label>
        <select id="dl-decision" style="${crField}">${CR_DELIVERY_DECISIONS.map(x => `<option value="${x.id}"${dlv.decision === x.id ? ' selected' : ''}>${x.label}</option>`).join('')}</select></div>
      <div style="flex:1;"><label style="${crFieldLabel}" for="dl-lost">Jours de test perdus</label><input type="number" id="dl-lost" min="0" step="0.5" style="${crField}" value="${escapeHtml(dlv.lostDays)}"></div>
    </div>
    <div id="dl-rule" style="font-size:12px;color:#8a6a25;margin-top:6px;"></div>
    <label style="${crFieldLabel}" for="dl-note">Note (réserve, retard, signalé à…)</label>
    <textarea id="dl-note" rows="2" style="${crField}">${escapeHtml(dlv.note)}</textarea>
  `, `
    <button class="btn" id="dl-back">‹ Retour</button>
    ${existing ? '<button class="btn btn-danger" id="dl-delete">Supprimer</button>' : ''}
    <button class="btn btn-primary" id="dl-save">Enregistrer</button>
  `);
  // Règle du modèle : si un criterion manque, la livraison est refusée ou acceptée avec réserve.
  const checked = () => Array.from(document.querySelectorAll('#dl-checks input:checked')).map(i => i.value);
  const applyRule = () => {
    const complete = checked().length === CR_ENTRY_CRITERIA.length;
    const sel = document.getElementById('dl-decision');
    sel.querySelector('option[value="accepted"]').disabled = !complete;
    if (!complete && sel.value === 'accepted') sel.value = 'accepted_with_reserve';
    document.getElementById('dl-rule').textContent = complete ? ''
      : `${CR_ENTRY_CRITERIA.length - checked().length} entry criterion manquant : la livraison est refusée ou acceptée avec réserve. Le retard compte en jours de test perdus, signalé au chef de projet et au CAB.`;
  };
  document.querySelectorAll('#dl-checks input').forEach(i => i.addEventListener('change', applyRule));
  applyRule();
  document.getElementById('dl-back').onclick = () => openPlanCriteriaModal(planId);
  if (existing) document.getElementById('dl-delete').onclick = () => {
    plan.deliveries = (plan.deliveries || []).filter(x => x.id !== dlv.id);
    save();
    toast('Livraison supprimée');
    openPlanCriteriaModal(planId);
  };
  document.getElementById('dl-save').onclick = () => {
    dlv.version = document.getElementById('dl-version').value.trim();
    if (!dlv.version) { toast('Indiquez la version livrée'); return; }
    dlv.receivedAt = document.getElementById('dl-date').value;
    dlv.checks = {};
    checked().forEach(id => { dlv.checks[id] = true; });
    dlv.decision = document.getElementById('dl-decision').value;
    dlv.lostDays = document.getElementById('dl-lost').value;
    dlv.note = document.getElementById('dl-note').value.trim();
    crUpsert(plan, 'deliveries', dlv);
    toast('Livraison enregistrée');
    openPlanCriteriaModal(planId);
  };
}

function openCompletionReportEditor(planId, reportId) {
  const plan = crPlanById(planId);
  if (!plan) return;
  const existing = (plan.completionReports || []).find(r => r.id === reportId);
  const rep = existing ? deepClone(existing) : newCompletionReport(plan);
  const canEdit = crCanEdit();
  const backBtn = '<button class="btn" id="cr-back">‹ Retour</button>';

  // Rapport figé : on montre ce qui a été remis au CAB, sans recalcul.
  if (rep.frozenAt && rep.snapshot) {
    openModal(`Test completion report · ${plan.changeNumber || ''}`, `
      <p style="margin:0 0 10px;font-size:12.5px;color:var(--text-soft);">Figé le ${new Date(rep.frozenAt).toLocaleString('fr-CH')} par ${escapeHtml(rep.frozenBy || '')} : ce rapport ne change plus.</p>
      <div class="wr-preview">${rep.snapshot.html}</div>
    `, `
      ${backBtn}
      ${canEdit ? '<button class="btn btn-danger" id="cr-delete">Supprimer</button>' : ''}
      <button class="btn" id="cr-md">Télécharger (.md)</button>
      <button class="btn btn-primary" id="cr-copy" title="Colle titres et tableaux dans un wiki, un e-mail ou un document">Copier le rapport</button>
    `);
    document.getElementById('modal').classList.add('modal-wide');
    document.getElementById('cr-back').onclick = () => openPlanCriteriaModal(planId);
    document.getElementById('cr-md').onclick = () => crDownloadMarkdown(plan, rep.snapshot.markdown);
    document.getElementById('cr-copy').onclick = async () => {
      const ok = await copyRichText(rep.snapshot.html, rep.snapshot.markdown);
      toast(ok ? 'Rapport copié : collez-le dans votre wiki ou joignez-le au changement' : 'Copie impossible : utilisez « Télécharger (.md) »');
    };
    if (canEdit) document.getElementById('cr-delete').onclick = () => {
      confirmDialog('Supprimer ce test completion report figé ? S’il a été remis au CAB, gardez-en une copie.', () => {
        plan.completionReports = (plan.completionReports || []).filter(r => r.id !== rep.id);
        save();
        toast('Rapport supprimé');
      });
    };
    return;
  }

  const risk = plan.riskLevel || 'medium';
  const regRuns = crRegressionRuns();
  const adapt = plan.exitAdaptations || {};
  const adaptedKeys = CR_CRITERIA.filter(c => adapt[c.key] && String(adapt[c.key].text || '').trim());
  const d0 = completionReportData(plan, rep);

  openModal(`Test completion report · ${planDisplayTitle(plan)}`, `
    <div class="wr-layout">
      <div>
        <div style="font-size:12.5px;color:var(--text-soft);">Changement <strong>${escapeHtml(plan.changeNumber || 'non renseigné')}</strong> · risque ${escapeHtml(crLabel(CR_RISK_LEVELS, risk).toLowerCase())}</div>
        <div style="display:flex;gap:8px;">
          <div style="flex:2;"><label style="${crFieldLabel}" for="cr-dlv">Livraison</label>
            <select id="cr-dlv" style="${crField}"><option value="">— Aucune enregistrée —</option>
              ${crSortedDeliveries(plan).map(x => `<option value="${escapeHtml(x.id)}"${rep.deliveryId === x.id ? ' selected' : ''}>${escapeHtml(crDeliveryLabel(x))}</option>`).join('')}</select></div>
          <div style="flex:1;"><label style="${crFieldLabel}" for="cr-date">Date</label><input type="date" id="cr-date" style="${crField}" value="${escapeHtml(rep.reportDate)}"></div>
        </div>
        <label style="${crFieldLabel}" for="cr-untested">Raison des test cases non testés</label>
        <textarea id="cr-untested" rows="2" style="${crField}">${escapeHtml(rep.untestedReason)}</textarea>
        ${risk === 'medium' && !adapt.executed && !crPriorityCases(plan).riskBased ? `
          <label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;margin-top:10px;"><input type="checkbox" id="cr-priority" ${rep.priorityConfirmed ? 'checked' : ''} style="margin-top:3px;">
            <span>Les test cases prioritaires du domaine ont été exécutés <span style="color:var(--text-muted);">(exit criterion du risque moyen, constaté par la QA)</span></span></label>` : ''}

        <label style="${crFieldLabel}" for="cr-reg-run">Regression testing : exécution</label>
        <select id="cr-reg-run" style="${crField}">
          <option value="">— Aucune —</option>
          ${regRuns.map(r => { const pl = crPlanById(r.sourceId); return `<option value="${escapeHtml(r.id)}"${rep.regressionRunId === r.id ? ' selected' : ''}>${escapeHtml(`${crLabel(CR_PLAN_KINDS, pl.kind)} · ${planDisplayTitle(pl)} · ${runDateLabel(r)} · ${r.tester || '—'}`)}</option>`; }).join('')}
        </select>
        ${regRuns.length === 0 ? '<div style="font-size:11.5px;color:#8a6a25;margin-top:4px;">Aucune exécution d’un plan de régression : donnez la nature « Smoke test », « Targeted regression » ou « Full regression » au plan concerné (Modifier le plan), puis importez ses résultats.</div>' : ''}

        ${adaptedKeys.length ? `<label style="${crFieldLabel}">Exit criteria adaptés : constat</label>
          ${adaptedKeys.map(c => `<div style="display:flex;gap:8px;align-items:center;font-size:12.5px;margin-bottom:4px;"><span style="flex:1;">${escapeHtml(c.label)} : ${escapeHtml(adapt[c.key].text)}</span>
            <select data-cr-manual="${c.key}" style="${crField}width:130px;"><option value="not_met">Non atteint</option><option value="met"${(rep.manualStatus || {})[c.key] === 'met' ? ' selected' : ''}>Atteint</option></select></div>`).join('')}` : ''}

        <label style="${crFieldLabel}">Décision sur chaque defect ouvert</label>
        <div id="cr-decisions">${d0.openDefects.length ? d0.openDefects.map(a => `
          <div style="margin-bottom:6px;">
            <div style="font-size:12px;"><span class="badge ${a.severity === 'critical' || a.severity === 'major' ? 'badge-danger' : 'badge-muted'}">${escapeHtml(crSeverityLabel(a.severity))}</span> ${escapeHtml(a.title || '(sans titre)')}</div>
            <input data-cr-decision="${escapeHtml(a.id)}" style="${crField}margin-top:3px;" placeholder="Qui accepte le risque, jusqu’à quand ; ou : à corriger avant la mise en production" value="${escapeHtml((rep.decisions || {})[a.id] || '')}">
          </div>`).join('') : '<div style="font-size:12px;color:var(--text-muted);">Aucun defect ouvert sur ce test plan.</div>'}</div>

        <label style="${crFieldLabel}" for="cr-risks">Risques restants</label>
        <textarea id="cr-risks" rows="2" style="${crField}">${escapeHtml(rep.risks)}</textarea>

        <label style="${crFieldLabel}" for="cr-reco">Recommandation</label>
        <select id="cr-reco" style="${crField}">
          <option value="">Automatique</option>
          ${CR_RECOMMENDATIONS.map(r => `<option value="${r.id}"${rep.recommendation === r.id ? ' selected' : ''}>${escapeHtml(r.label)}</option>`).join('')}
        </select>
        <textarea id="cr-reco-text" rows="2" style="${crField}margin-top:6px;" placeholder="Conditions ou commentaire">${escapeHtml(rep.recommendationText)}</textarea>

        <div style="display:flex;gap:8px;">
          <div style="flex:2;"><label style="${crFieldLabel}" for="cr-uat-name">UAT sign-off : nom</label><input id="cr-uat-name" style="${crField}" value="${escapeHtml(rep.uatName)}"></div>
          <div style="flex:1;"><label style="${crFieldLabel}" for="cr-uat-date">Date</label><input type="date" id="cr-uat-date" style="${crField}" value="${escapeHtml(rep.uatDate)}"></div>
        </div>
        <label style="${crFieldLabel}" for="cr-links">Test evidence : liens (journaux, captures…)</label>
        <textarea id="cr-links" rows="2" style="${crField}">${escapeHtml(rep.evidenceLinks)}</textarea>
      </div>
      <div class="wr-preview" id="cr-preview"></div>
    </div>
  `, `
    ${backBtn}
    <button class="btn" id="cr-md">Télécharger (.md)</button>
    <button class="btn" id="cr-copy" title="Colle titres et tableaux dans un wiki, un e-mail ou un document">Copier le rapport</button>
    ${canEdit ? '<button class="btn" id="cr-save">Enregistrer le brouillon</button><button class="btn btn-primary" id="cr-freeze">Figer pour le CAB</button>' : ''}
  `);
  document.getElementById('modal').classList.add('modal-wide');

  const val = id => document.getElementById(id).value;
  const readForm = () => {
    rep.deliveryId = val('cr-dlv');
    rep.reportDate = val('cr-date');
    rep.untestedReason = val('cr-untested').trim();
    const prio = document.getElementById('cr-priority');
    if (prio) {
      if (prio.checked && !rep.priorityConfirmed) rep.priorityConfirmedBy = (QASession.username && QASession.username()) || '';
      rep.priorityConfirmed = prio.checked;
    }
    rep.regressionRunId = val('cr-reg-run');
    rep.manualStatus = {};
    document.querySelectorAll('[data-cr-manual]').forEach(s => { rep.manualStatus[s.dataset.crManual] = s.value; });
    rep.decisions = {};
    document.querySelectorAll('[data-cr-decision]').forEach(i => { rep.decisions[i.dataset.crDecision] = i.value.trim(); });
    rep.risks = val('cr-risks').trim();
    rep.recommendation = val('cr-reco');
    rep.recommendationText = val('cr-reco-text').trim();
    rep.uatName = val('cr-uat-name').trim();
    rep.uatDate = val('cr-uat-date');
    rep.evidenceLinks = val('cr-links').trim();
  };
  const refresh = () => {
    readForm();
    const d = completionReportData(plan, rep);
    document.getElementById('cr-preview').innerHTML = completionReportHtml(plan, rep, d);
    document.querySelector('#cr-reco option[value=""]').textContent = `Automatique (proposée : ${crLabel(CR_RECOMMENDATIONS, d.proposal)})`;
    return d;
  };
  document.querySelectorAll('#modal-body input, #modal-body select, #modal-body textarea').forEach(el => {
    el.addEventListener('input', refresh);
    el.addEventListener('change', refresh);
  });
  refresh();

  document.getElementById('cr-back').onclick = () => openPlanCriteriaModal(planId);
  document.getElementById('cr-md').onclick = () => { const d = refresh(); crDownloadMarkdown(plan, completionReportMarkdown(plan, rep, d)); };
  document.getElementById('cr-copy').onclick = async () => {
    const d = refresh();
    const ok = await copyRichText(completionReportHtml(plan, rep, d), completionReportMarkdown(plan, rep, d));
    toast(ok ? 'Brouillon copié : figez le rapport avant de le remettre au CAB' : 'Copie impossible : utilisez « Télécharger (.md) »');
  };
  if (!canEdit) return;
  document.getElementById('cr-save').onclick = () => {
    refresh();
    rep.updatedAt = new Date().toISOString();
    crUpsert(plan, 'completionReports', rep);
    toast('Brouillon enregistré');
  };
  document.getElementById('cr-freeze').onclick = () => {
    if (!plan.changeNumber) { toast('Renseignez la référence du changement dans le plan avant de figer'); return; }
    refresh();
    crUpsert(plan, 'completionReports', rep);   // le brouillon est gardé même si l'on annule
    confirmDialog(`Figer le test completion report du changement ${plan.changeNumber} ? Les chiffres et le texte ne bougeront plus.`, () => {
      rep.frozenAt = new Date().toISOString();
      rep.frozenBy = (QASession.username && QASession.username()) || '';
      const d = completionReportData(plan, rep);
      rep.snapshot = {
        html: completionReportHtml(plan, rep, d),
        markdown: completionReportMarkdown(plan, rep, d),
        changeNumber: plan.changeNumber,
        riskLevel: risk,
        recommendation: rep.recommendation || d.proposal,
        criteria: d.criteria.map(c => ({ key: c.key, status: c.status })),
      };
      crUpsert(plan, 'completionReports', rep);
      toast('Rapport figé');
      openCompletionReportEditor(planId, rep.id);
    });
  };
}
