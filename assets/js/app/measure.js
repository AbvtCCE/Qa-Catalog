/* Catalogue de tests — module « measure.js ».
   Fait partie de l'application principale (index.html). L'ordre de chargement
   des <script> compte : voir index.html. Ne pas ouvrir isolément. */
/* ===== Mesurer et chiffrer (plan qualité, semaine 8) =====
   « Un dashboard avec les indicateurs de l'onglet Mesurer et le calcul en francs. »
   Repris de l'onglet « Mesurer et chiffrer » de la page du plan et des modèles « Metrics :
   définitions et baseline » et « Rapport mensuel pour la direction ». Trois règles :
   1. la méthode est validée avant de présenter un chiffre (décision D4) ;
   2. en francs, seul compte ce qui aurait été fait à la main de toute façon ;
   3. les coûts évités sont une estimation, présentée à part.
   Calcul (identique au calculateur du plan) :
     heures économisées = durée d'une full regression à la main × full regressions qui
                          auraient été faites à la main − maintenance − analyse des résultats
     économies mesurées = heures économisées × taux horaire validé
     coûts évités       = defects Blocker ou Major trouvés avant la production × coût moyen
                          mesuré d'un incident de même gravité
     exécutions en plus = exécutions automatiques de la regression suite − full regressions
   state.measure = {method, baseline{K1..K9}, months[{month, calc, kpi, report, savedAt, savedBy}]}. */

const MEASURE_CALC_FIELDS = [
  { id: 'taux', label: 'Taux horaire interne validé', unit: 'rate' },
  { id: 'duree', label: 'Durée d’une full regression faite à la main', unit: 'h' },
  { id: 'nbreg', label: 'Full regressions qui auraient été faites à la main ce mois', unit: 'fois' },
  { id: 'maint', label: 'Maintenance de l’automatisation ce mois', unit: 'h' },
  { id: 'analyse', label: 'Analyse des résultats automatisés ce mois', unit: 'h' },
  { id: 'execs', label: 'Exécutions automatiques de la regression suite ce mois', unit: 'fois' },
  { id: 'anom', label: 'Defects Blocker ou Major trouvés avant la production ce mois', unit: '' },
  { id: 'cout', label: 'Coût moyen mesuré d’un incident de production de même gravité', unit: 'money' },
];
/* Les 9 indicateurs de « Mesurer » (sens : +1 plus haut = mieux, −1 plus bas = mieux). */
const MEASURE_KPIS = [
  { id: 'K1', name: 'Change failure rate', question: 'Les mises en production sont-elles plus sûres ?', type: 'ratio', a: 'en échec', b: 'mis en production', sens: -1,
    formula: 'changements en échec (rollback, incident causé, hotfix) ÷ changements mis en production', source: 'outil des changements' },
  { id: 'K2', name: 'Defect detection percentage (DDP)', question: 'Le test arrête-t-il les defects avant les clients ?', type: 'ratio', a: 'trouvés en test', b: 'trouvés en test + en production', sens: 1,
    formula: 'defects trouvés en test ÷ (trouvés en test + trouvés en production), sur la même période', source: 'anomalies du catalogue' },
  { id: 'K3', name: 'Changements approuvés avec test evidence', question: 'Le CAB décide-t-il sur des faits ?', type: 'ratio', a: 'avec test evidence', b: 'approuvés', sens: 1,
    formula: 'changements approuvés avec une test evidence conforme ÷ changements approuvés', source: 'outil des changements et completion reports figés' },
  { id: 'K4', name: 'Durée d’une full regression', question: 'Combien de temps faut-il pour revérifier l’existant ?', type: 'value', unit: 'h', sens: -1,
    formula: 'à la main : durée mesurée ; automatisée : durée d’exécution + analyse des résultats', source: 'checklists chronométrées et outil d’automatisation' },
  { id: 'K5', name: 'Defect reopen rate', question: 'Les corrections tiennent-elles ?', type: 'ratio', a: 'rouverts', b: 'corrigés', sens: -1,
    formula: 'defects rouverts ÷ defects corrigés', source: 'historique des anomalies' },
  { id: 'K6', name: 'Livraisons conformes aux entry criteria', question: 'Les livraisons arrivent-elles prêtes à tester ?', type: 'ratio', a: 'conformes', b: 'reçues', sens: 1,
    formula: 'livraisons conformes ÷ livraisons reçues en test', source: 'livraisons des test plans' },
  { id: 'K7', name: 'Jours de test perdus', question: 'Combien de temps de test les retards et les pannes coûtent-ils ?', type: 'value', unit: 'j', sens: -1,
    formula: 'jours perdus par livraison en retard, test environment indisponible ou test data manquantes', source: 'livraisons et journal des test environments' },
  { id: 'K8', name: 'Personnes qui testent hors QA', question: 'La qualité tient-elle sans une seule personne ?', type: 'value', unit: 'pers.', sens: 1,
    formula: 'personnes ayant exécuté des tests ce mois, hors QA', source: 'exécutions importées' },
  { id: 'K9', name: 'Score de la check-list', question: 'Où en est la maturité du service ?', type: 'value', unit: '%', sens: 1,
    formula: 'Oui = 1, En partie = 0,5, Non = 0, sans les points sans objet', source: 'check-list QA d’après l’ISTQB' },
];
const TMMI_L2_AREAS = ['Test Policy and Strategy', 'Test Planning', 'Test Monitoring and Control', 'Test Design and Execution', 'Test Environment'];
const TMMI_STATUSES = [{ id: 'todo', label: 'À faire' }, { id: 'doing', label: 'En cours' }, { id: 'done', label: 'En place' }];

const measureState = () => {
  if (!state.measure || typeof state.measure !== 'object') state.measure = {};
  const m = state.measure;
  if (!m.method) m.method = {};
  if (!m.baseline) m.baseline = {};
  if (!Array.isArray(m.months)) m.months = [];
  return m;
};
const msNum = v => {
  if (v === '' || v == null) return null;
  const n = parseFloat(String(v).replace(/[’'\s]/g, '').replace(',', '.'));
  return isFinite(n) ? n : null;
};
function msMoney(v) {
  const cur = measureState().method.currency || 'CHF';
  if (v == null || !isFinite(v)) return '–';
  try { return new Intl.NumberFormat('fr-CH', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v); }
  catch (e) { return `${Math.round(v)} ${cur}`; }
}
const msFmt = (v, d) => (v == null || !isFinite(v) ? '–' : (Math.round(v * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toLocaleString('fr-CH'));
const msInMonth = (iso, month) => !!iso && String(iso).slice(0, 7) === month;

/* Le calcul du plan, à l'identique. */
function measureCompute(calc) {
  const g = k => msNum(calc[k]);
  const t = g('taux'), d = g('duree'), n = g('nbreg'), m = g('maint') || 0, an = g('analyse') || 0;
  const ex = g('execs'), ao = g('anom'), c = g('cout');
  const r = { h: null, chf: null, ev: null, plus: null };
  if (d !== null && n !== null) r.h = d * n - m - an;
  if (r.h !== null && t !== null) r.chf = r.h * t;
  if (ao !== null && c !== null) r.ev = ao * c;
  if (ex !== null && n !== null) r.plus = ex - n;
  return r;
}

/* Durée d'une full regression faite à la main : la dernière exécution chronométrée d'un test
   plan de nature « Full regression », si toutes ses durées sont mesurées. */
function measuredFullRegressionHours() {
  const runs = (state.testRuns || [])
    .filter(r => r.sourceType === 'plan' && ((state.testPlans.find(p => p.id === r.sourceId) || {}).kind === 'full'))
    .sort((a, b) => String(b.exportedAt || b.importedAt).localeCompare(String(a.exportedAt || a.importedAt)));
  for (const r of runs) {
    const played = (r.results || []).filter(x => x.outcome !== 'not_run');
    if (played.length && played.every(x => typeof x.durationMin === 'number')) {
      return { h: played.reduce((a, x) => a + x.durationMin, 0) / 60, run: r };
    }
  }
  return null;
}

/* Ce que le catalogue sait du mois : valeurs proposées au calculateur et aux indicateurs. */
function measureAuto(month) {
  const anomalies = state.anomalies || [];
  const inMonth = a => msInMonth(a.detectedAt || a.createdAt, month);
  const foundTest = anomalies.filter(a => inMonth(a) && a.foundIn !== 'production');
  const foundProd = anomalies.filter(a => inMonth(a) && a.foundIn === 'production');
  const hist = anomalies.flatMap(a => (a.history || []).filter(h => msInMonth(h.at, month)));
  const deliveries = state.testPlans.flatMap(p => (p.deliveries || []).filter(d => msInMonth(d.receivedAt, month)));
  const outages = (state.environments || []).flatMap(e => (e.outages || []).filter(o => msInMonth(o.date, month)));
  const frozen = state.testPlans.flatMap(p => (p.completionReports || []).filter(r => msInMonth(r.frozenAt, month)));
  const qa = String(measureState().method.qaPeople || '').split(/[,;\n]/).map(s => s.trim().toLowerCase()).filter(Boolean);
  const testers = new Set((state.testRuns || []).filter(r => msInMonth(r.exportedAt || r.importedAt, month))
    .map(r => String(r.tester || '').trim()).filter(t => t && !qa.includes(t.toLowerCase())));
  const maintMin = state.testCases.reduce((a, c) => a + (c.maintenanceLog || []).filter(m => msInMonth(m.date, month)).reduce((s, m) => s + (Number(m.minutes) || 0), 0), 0);
  const fr = measuredFullRegressionHours();
  return {
    calc: {
      taux: measureState().method.rate,
      duree: fr ? Math.round(fr.h * 10) / 10 : null,
      maint: maintMin ? Math.round(maintMin / 6) / 10 : null,
      anom: foundTest.filter(a => a.severity === 'critical' || a.severity === 'major').length,
    },
    kpi: {
      K2: { a: foundTest.length, b: foundTest.length + foundProd.length },
      K3: { a: frozen.length },
      K4: { v: fr ? Math.round(fr.h * 10) / 10 : null },
      K5: { a: hist.filter(h => h.to === 'reopened').length, b: hist.filter(h => h.to === 'ready_for_retest').length },
      K6: { a: deliveries.filter(deliveryCompliant).length, b: deliveries.length },
      K7: { v: deliveries.reduce((s, d) => s + (Number(d.lostDays) || 0), 0) + outages.reduce((s, o) => s + (Number(o.lostDays) || 0), 0) },
      K8: { v: testers.size },
      // Score de la check-list : la dernière évaluation de maturité du mois (onglet Maturité)
      K9: { v: typeof maturityScoreAt === 'function' ? maturityScoreAt(month + '-31') : null },
    },
    sources: { fr },
  };
}

/* Valeur d'un indicateur : un ratio en %, sinon la valeur. */
function kpiValue(k, x) {
  if (!x) return null;
  if (k.type === 'ratio') {
    const a = msNum(x.a), b = msNum(x.b);
    return a !== null && b ? (a / b) * 100 : null;
  }
  return msNum(x.v);
}
function kpiLabel(k, v) {
  if (v == null) return '–';
  return k.type === 'ratio' ? `${msFmt(v)} %` : `${msFmt(v, 1)}${k.unit ? ' ' + k.unit : ''}`;
}
function kpiEvolution(k, base, cur) {
  if (base == null || cur == null) return { text: '–', good: null };
  const diff = cur - base;
  const unit = k.type === 'ratio' ? ' pts' : (k.unit ? ' ' + k.unit : '');
  return { text: `${diff > 0 ? '+' : ''}${msFmt(diff, 1)}${unit}`, good: diff === 0 ? null : diff * k.sens > 0 };
}
function measureMonthRecord(month) {
  return measureState().months.find(x => x.month === month) || null;
}

function measureReportHtml(month, rec, notes) {
  const m = measureState();
  const cell = 'border:1px solid #ccc;padding:4px 8px;vertical-align:top;';
  const th = cell + 'background:#f4f5f7;text-align:left;';
  const txt = t => escapeHtml(t || '').replace(/\n/g, '<br>');
  const months = m.months.slice().sort((a, b) => a.month.localeCompare(b.month));
  const upTo = months.filter(x => x.month <= month);
  const res = rec ? measureCompute(rec.calc || {}) : { chf: null, ev: null };
  const cumChf = upTo.reduce((s, x) => s + (measureCompute(x.calc || {}).chf || 0), 0);
  const cumEv = upTo.reduce((s, x) => s + (measureCompute(x.calc || {}).ev || 0), 0);
  const kpis = ['K1', 'K2', 'K3', 'K4', 'K9'].map(id => MEASURE_KPIS.find(k => k.id === id));
  const doneAreas = TMMI_L2_AREAS.filter(a => (notes.tmmi || {})[a] === 'done').length;
  const method = m.method;
  return `
    <h1>Rapport mensuel QA · ${escapeHtml(msMonthLabel(month))}</h1>
    <h2>Le mois en bref</h2><p>${txt(notes.brief || '[Trois phrases.]')}</p>
    <h2>Ce que la QA a rapporté</h2>
    <table style="border-collapse:collapse;"><thead><tr><th style="${th}"></th><th style="${th}">Ce mois</th><th style="${th}">Depuis le début</th></tr></thead>
      <tbody><tr><td style="${cell}">Économies mesurées</td><td style="${cell}">${escapeHtml(msMoney(res.chf))}</td><td style="${cell}">${escapeHtml(msMoney(cumChf))}</td></tr>
      <tr><td style="${cell}">Coûts évités (estimation)</td><td style="${cell}">${escapeHtml(msMoney(res.ev))}</td><td style="${cell}">${escapeHtml(msMoney(cumEv))}</td></tr></tbody></table>
    <p>Méthode validée par ${escapeHtml(method.validatedBy || '[nom]')} le ${method.validatedAt ? wrFmt(method.validatedAt) : '[date]'} : en francs, seul compte ce qui aurait été fait à la main de toute façon.</p>
    <h2>Indicateurs</h2>
    <table style="border-collapse:collapse;"><thead><tr>${['Indicateur', 'Baseline', 'Ce mois', 'Évolution'].map(h => `<th style="${th}">${h}</th>`).join('')}</tr></thead>
      <tbody>${kpis.map(k => {
        const b = kpiValue(k, m.baseline[k.id]), c = kpiValue(k, rec && rec.kpi ? rec.kpi[k.id] : null);
        return `<tr><td style="${cell}">${escapeHtml(k.name)}</td><td style="${cell}">${escapeHtml(kpiLabel(k, b))}</td><td style="${cell}">${escapeHtml(kpiLabel(k, c))}</td><td style="${cell}">${escapeHtml(kpiEvolution(k, b, c).text)}</td></tr>`;
      }).join('')}</tbody></table>
    <h2>Maturité</h2>
    <p>Check-list : ${escapeHtml(kpiLabel(MEASURE_KPIS[8], kpiValue(MEASURE_KPIS[8], rec && rec.kpi ? rec.kpi.K9 : null)))} (départ : ${escapeHtml(kpiLabel(MEASURE_KPIS[8], kpiValue(MEASURE_KPIS[8], m.baseline.K9)))}). Process areas du niveau 2 de TMMi en place : ${doneAreas} sur 5.</p>
    <h2>Risques et besoins</h2><p>${txt(notes.risks || '[Décisions attendues de la direction.]')}</p>
    <h2>Le mois prochain</h2><p>${txt(notes.next || '[…]')}</p>`;
}
function msMonthLabel(month) {
  const [y, mo] = month.split('-');
  return new Date(+y, +mo - 1, 1).toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' });
}

function renderMeasure(view, monthArg) {
  const m = measureState();
  const month = monthArg || view.dataset.measureMonth || wrIso(new Date()).slice(0, 7);
  view.dataset.measureMonth = month;
  const canEdit = !window.QAPerm || QAPerm.can('update', 'measure');
  const auto = measureAuto(month);
  const rec = measureMonthRecord(month);
  const calc = Object.assign({}, auto.calc, (rec && rec.calc) || {});
  if (calc.taux == null || calc.taux === '') calc.taux = m.method.rate;
  const kpiCur = {};
  MEASURE_KPIS.forEach(k => { kpiCur[k.id] = Object.assign({}, auto.kpi[k.id] || {}, (rec && rec.kpi && rec.kpi[k.id]) || {}); });
  const res = measureCompute(calc);
  const cur = m.method.currency || 'CHF';
  const months = m.months.slice().sort((a, b) => b.month.localeCompare(a.month));
  const field = 'font:inherit;font-size:13px;padding:5px 8px;border:1px solid var(--border-strong);border-radius:var(--radius-sm);background:var(--surface);';
  const td = 'padding:6px 8px;border-bottom:1px solid var(--border);vertical-align:top;';
  const th = td + 'text-align:left;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:0.04em;';
  const dis = canEdit ? '' : 'disabled';
  const autoTag = (has) => has ? ' <span class="badge badge-primary" style="font-size:10px;padding:0 5px;" title="Proposé par le catalogue, modifiable">catalogue</span>' : '';
  const unitLabel = u => (u === 'rate' ? `${cur}/h` : u === 'money' ? cur : u);
  let notes = (rec && rec.report) || {};
  // Statuts TMMi niveau 2 proposés par la dernière évaluation de maturité, tant qu'ils ne sont pas saisis
  if (!notes.tmmi && typeof maturityTmmiL2At === 'function' && maturityTmmiL2At(month + '-31')) notes = Object.assign({}, notes, { tmmi: maturityTmmiL2At(month + '-31') });
  // Baseline du score de la check-list : la première évaluation de maturité, tant qu'elle n'est pas saisie
  const autoBase = {};
  if (typeof maturityFirstScore === 'function' && maturityFirstScore() !== null) autoBase.K9 = { v: maturityFirstScore() };
  const baseOf = id => Object.assign({}, autoBase[id] || {}, m.baseline[id] || {});
  const kpiInput = (k, x, prefix) => k.type === 'ratio'
    ? `<input data-${prefix}="${k.id}:a" style="${field}width:70px;" value="${escapeHtml(x && x.a != null ? x.a : '')}" ${dis}> sur <input data-${prefix}="${k.id}:b" style="${field}width:70px;" value="${escapeHtml(x && x.b != null ? x.b : '')}" ${dis}>`
    : `<input data-${prefix}="${k.id}:v" style="${field}width:90px;" value="${escapeHtml(x && x.v != null ? x.v : '')}" ${dis}> ${escapeHtml(k.unit || '')}`;

  view.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Mesurer et chiffrer</h1>
        <div class="subtitle">Des économies mesurées en ${escapeHtml(cur)}, des coûts évités présentés à part, et l’évolution des indicateurs depuis la baseline.</div>
      </div>
      <div class="actions">
        <label style="font-size:12.5px;">Mois <input type="month" id="ms-month" value="${month}" style="${field}"></label>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <h3 style="font-size:15px;margin:0 0 6px;">Méthode <span style="font-weight:400;color:var(--text-muted);font-size:12px;">· décision D4, à valider avant de présenter le moindre chiffre</span></h3>
      <ol style="font-size:12.5px;color:var(--text-soft);margin:0 0 10px;padding-left:18px;">
        <li>Faire valider la méthode avant de présenter un chiffre : taux horaire, période de référence, règles de comptage.</li>
        <li>En francs, ne compter que ce qui aurait été fait à la main de toute façon. Les exécutions en plus comptent en coverage.</li>
        <li>Présenter les coûts évités à part, comme une estimation, avec un coût d’incident mesuré plutôt qu’un multiplicateur tiré d’un livre.</li>
      </ol>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;font-size:12.5px;">
        <label>Taux horaire validé<br><input id="mm-rate" style="${field}width:100px;" value="${escapeHtml(m.method.rate || '')}" ${dis}> <input id="mm-currency" style="${field}width:60px;" value="${escapeHtml(cur)}" title="Monnaie" ${dis}>/h</label>
        <label>Période de référence<br><input type="date" id="mm-from" style="${field}" value="${escapeHtml(m.method.referenceFrom || '')}" ${dis}> → <input type="date" id="mm-to" style="${field}" value="${escapeHtml(m.method.referenceTo || '')}" ${dis}></label>
        <label>Validée par<br><input id="mm-by" style="${field}width:160px;" value="${escapeHtml(m.method.validatedBy || '')}" ${dis}></label>
        <label>le<br><input type="date" id="mm-at" style="${field}" value="${escapeHtml(m.method.validatedAt || '')}" ${dis}></label>
        <label style="flex:1;min-width:200px;">Personnes QA (exclues de K8)<br><input id="mm-qa" style="${field}width:100%;" value="${escapeHtml(m.method.qaPeople || '')}" placeholder="Noms séparés par des virgules" ${dis}></label>
        ${canEdit ? '<button class="btn btn-sm" id="mm-save">Enregistrer la méthode</button>' : ''}
      </div>
      ${!m.method.validatedBy ? '<div style="font-size:12px;color:#8a6a25;margin-top:8px;">Méthode pas encore validée : les chiffres ne sont pas présentables.</div>' : ''}
    </div>

    <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;margin-bottom:16px;">
      <div class="card" style="flex:3;min-width:420px;">
        <h3 style="font-size:15px;margin:0 0 8px;">Économies du mois · ${escapeHtml(msMonthLabel(month))}</h3>
        <table style="border-collapse:collapse;width:100%;font-size:12.5px;">
          ${MEASURE_CALC_FIELDS.map(f => `<tr><td style="${td}">${escapeHtml(f.label)}${autoTag(auto.calc[f.id] != null && auto.calc[f.id] !== '' && !(rec && rec.calc && rec.calc[f.id] !== undefined && String(rec.calc[f.id]) !== String(auto.calc[f.id])))}</td>
            <td style="${td}white-space:nowrap;"><input data-ms-calc="${f.id}" style="${field}width:100px;" value="${escapeHtml(calc[f.id] != null ? calc[f.id] : '')}" ${dis}> ${escapeHtml(unitLabel(f.unit))}</td></tr>`).join('')}
        </table>
        ${auto.sources.fr ? `<div style="font-size:11.5px;color:var(--text-muted);margin-top:6px;">Durée de la full regression : exécution chronométrée du ${escapeHtml(runDateLabel(auto.sources.fr.run))} (${escapeHtml(runSourceLabel(auto.sources.fr.run))}).</div>` : '<div style="font-size:11.5px;color:var(--text-muted);margin-top:6px;">Durée de la full regression : aucune exécution chronométrée d’un test plan de nature « Full regression » ; à saisir.</div>'}
      </div>
      <div class="card" style="flex:2;min-width:280px;" id="ms-results">
        ${measureResultsHtml(res, cur)}
        ${canEdit ? `<button class="btn btn-primary btn-sm" id="ms-save-month" style="margin-top:10px;">${rec ? 'Mettre à jour' : 'Ajouter au cumul'} : ${escapeHtml(msMonthLabel(month))}</button>` : ''}
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;overflow-x:auto;">
      <h3 style="font-size:15px;margin:0 0 8px;">Cumul</h3>
      ${months.length === 0 ? '<p style="font-size:12.5px;color:var(--text-muted);font-style:italic;margin:0;">Aucun mois enregistré.</p>' : `
        <table style="border-collapse:collapse;width:100%;font-size:12.5px;">
          <thead><tr><th style="${th}">Mois</th><th style="${th}">Heures</th><th style="${th}">Économies mesurées</th><th style="${th}">Coûts évités (estimation)</th><th style="${th}"></th></tr></thead>
          <tbody>${months.map(x => { const r = measureCompute(x.calc || {}); return `<tr><td style="${td}">${escapeHtml(msMonthLabel(x.month))}</td><td style="${td}">${msFmt(r.h, 1)}</td><td style="${td}">${escapeHtml(msMoney(r.chf))}</td><td style="${td}">${escapeHtml(msMoney(r.ev))}</td>
            <td style="${td}"><div style="display:flex;gap:4px;justify-content:flex-end;align-items:center;"><button class="btn btn-sm" data-ms-open="${x.month}">Ouvrir</button>${canEdit ? `<button class="btn-icon btn-ghost" data-ms-delete="${x.month}" title="Retirer du cumul">${ICON.trash}</button>` : ''}</div></td></tr>`; }).join('')}
            <tr><td style="${td}"><strong>Total</strong></td><td style="${td}"><strong>${msFmt(months.reduce((s, x) => s + (measureCompute(x.calc || {}).h || 0), 0), 1)}</strong></td>
              <td style="${td}"><strong>${escapeHtml(msMoney(months.reduce((s, x) => s + (measureCompute(x.calc || {}).chf || 0), 0)))}</strong></td>
              <td style="${td}"><strong>${escapeHtml(msMoney(months.reduce((s, x) => s + (measureCompute(x.calc || {}).ev || 0), 0)))}</strong></td><td style="${td}"></td></tr>
          </tbody>
        </table>`}
    </div>

    <div class="card" style="margin-bottom:16px;overflow-x:auto;">
      <h3 style="font-size:15px;margin:0 0 4px;">Avant et après</h3>
      <p style="font-size:12px;color:var(--text-soft);margin:0 0 8px;">À gauche, la baseline (période de référence) ; à droite, ${escapeHtml(msMonthLabel(month))}. Pour un taux, saisir les deux nombres : le calcul suit. Les valeurs marquées « catalogue » sont proposées, modifiables.</p>
      <table style="border-collapse:collapse;width:100%;font-size:12.5px;">
        <thead><tr><th style="${th}">Indicateur</th><th style="${th}">Baseline</th><th style="${th}">${escapeHtml(msMonthLabel(month))}</th><th style="${th}">Évolution</th></tr></thead>
        <tbody>${MEASURE_KPIS.map(k => {
          const b = kpiValue(k, baseOf(k.id)), c = kpiValue(k, kpiCur[k.id]);
          const ev = kpiEvolution(k, b, c);
          const hasAuto = !!auto.kpi[k.id] && kpiValue(k, auto.kpi[k.id]) !== null;
          return `<tr>
            <td style="${td}" title="${escapeHtml(k.question)}"><strong>${escapeHtml(k.name)}</strong><div style="color:var(--text-muted);font-size:11.5px;">${escapeHtml(k.formula)} · ${escapeHtml(k.id === 'K1' && toolName('changes') ? toolName('changes') : k.source)}</div></td>
            <td style="${td}white-space:nowrap;">${kpiInput(k, baseOf(k.id), 'ms-base')}${autoBase[k.id] && !m.baseline[k.id] ? autoTag(true) : ''}<div style="font-size:11.5px;color:var(--text-muted);">${escapeHtml(kpiLabel(k, b))}</div></td>
            <td style="${td}white-space:nowrap;">${kpiInput(k, kpiCur[k.id], 'ms-kpi')}${autoTag(hasAuto)}<div style="font-size:11.5px;color:var(--text-muted);">${escapeHtml(kpiLabel(k, c))}</div></td>
            <td style="${td}white-space:nowrap;color:${ev.good === null ? 'var(--text-muted)' : ev.good ? 'var(--success)' : '#8a3a2c'};font-weight:600;">${escapeHtml(ev.text)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
      ${canEdit ? '<button class="btn btn-sm" id="ms-save-base" style="margin-top:8px;">Enregistrer la baseline</button>' : ''}
    </div>

    <div class="card">
      <h3 style="font-size:15px;margin:0 0 8px;">Rapport pour la direction · ${escapeHtml(msMonthLabel(month))}</h3>
      <div class="wr-layout">
        <div>
          <label style="font-size:12px;color:var(--text-soft);">Le mois en bref<textarea id="mr-brief" rows="3" style="${field}width:100%;" placeholder="Trois phrases." ${dis}>${escapeHtml(notes.brief || '')}</textarea></label>
          <label style="font-size:12px;color:var(--text-soft);">Risques et besoins<textarea id="mr-risks" rows="3" style="${field}width:100%;" placeholder="Décisions attendues de la direction" ${dis}>${escapeHtml(notes.risks || '')}</textarea></label>
          <label style="font-size:12px;color:var(--text-soft);">Le mois prochain<textarea id="mr-next" rows="2" style="${field}width:100%;" ${dis}>${escapeHtml(notes.next || '')}</textarea></label>
          <div style="font-size:12px;color:var(--text-soft);margin-top:6px;">Maturité TMMi, niveau 2</div>
          ${TMMI_L2_AREAS.map(a => `<div style="display:flex;justify-content:space-between;gap:6px;align-items:center;font-size:12.5px;margin:3px 0;"><span>${escapeHtml(a)}</span>
            <select data-mr-tmmi="${escapeHtml(a)}" style="${field}" ${dis}>${TMMI_STATUSES.map(s => `<option value="${s.id}" ${((notes.tmmi || {})[a] || 'todo') === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}</select></div>`).join('')}
        </div>
        <div class="wr-preview" id="mr-preview"></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
        <button class="btn" id="mr-copy" title="Colle titres et tableaux dans un wiki, un e-mail ou un document">Copier le rapport</button>
        <button class="btn" id="mr-md">Télécharger (.md)</button>
        <button class="btn" id="mr-print">Imprimer ou enregistrer en PDF</button>
        ${canEdit ? '<button class="btn btn-primary" id="mr-save">Enregistrer avec le mois</button>' : ''}
      </div>
    </div>
  `;

  const readNotes = () => {
    const tmmi = {};
    view.querySelectorAll('[data-mr-tmmi]').forEach(s => { tmmi[s.dataset.mrTmmi] = s.value; });
    return { brief: view.querySelector('#mr-brief').value.trim(), risks: view.querySelector('#mr-risks').value.trim(), next: view.querySelector('#mr-next').value.trim(), tmmi };
  };
  const readCalc = () => {
    const c = {};
    view.querySelectorAll('[data-ms-calc]').forEach(i => { c[i.dataset.msCalc] = i.value.trim(); });
    return c;
  };
  const readKpis = (prefix) => {
    const out = {};
    view.querySelectorAll(`[data-${prefix}]`).forEach(i => {
      const [id, part] = i.dataset[prefix === 'ms-base' ? 'msBase' : 'msKpi'].split(':');
      if (!out[id]) out[id] = {};
      out[id][part] = i.value.trim();
    });
    return out;
  };
  const currentRecord = () => ({ month, calc: readCalc(), kpi: readKpis('ms-kpi'), report: readNotes() });
  const refreshPreview = () => { view.querySelector('#mr-preview').innerHTML = measureReportHtml(month, currentRecord(), readNotes()); };
  const refreshResults = () => {
    const box = view.querySelector('#ms-results');
    const btn = box.querySelector('#ms-save-month');
    box.innerHTML = measureResultsHtml(measureCompute(readCalc()), cur);
    if (btn) box.appendChild(btn);
    refreshPreview();
  };
  view.querySelectorAll('[data-ms-calc]').forEach(i => i.addEventListener('input', refreshResults));
  view.querySelectorAll('[data-ms-kpi], #mr-brief, #mr-risks, #mr-next, [data-mr-tmmi]').forEach(i => i.addEventListener('input', refreshPreview));
  view.querySelectorAll('[data-mr-tmmi]').forEach(i => i.addEventListener('change', refreshPreview));
  refreshPreview();

  view.querySelector('#ms-month').onchange = (e) => { if (e.target.value) renderMeasure(view, e.target.value); };
  view.querySelectorAll('[data-ms-open]').forEach(b => b.onclick = () => renderMeasure(view, b.dataset.msOpen));
  const reportMd = () => measureReportHtml(month, currentRecord(), readNotes())
    .replace(/<h1>/g, '# ').replace(/<h2>/g, '\n## ').replace(/<\/t[dh]>/g, ' | ').replace(/<tr>/g, '| ').replace(/<\/(h1|h2|p|tr)>/g, '\n')
    .replace(/<br>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n').trim();
  view.querySelector('#mr-copy').onclick = async () => {
    const ok = await copyRichText(measureReportHtml(month, currentRecord(), readNotes()), reportMd());
    toast(ok ? 'Rapport copié' : 'Copie impossible');
  };
  view.querySelector('#mr-md').onclick = () => {
    const blob = new Blob([reportMd()], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rapport-qa-${month}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  view.querySelector('#mr-print').onclick = () => {
    const w = window.open('', '_blank');
    if (!w) { toast('Fenêtre bloquée par le navigateur'); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Rapport QA ${escapeHtml(month)}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:24px auto;font-size:14px;line-height:1.5}table{margin-bottom:8px}</style></head><body>${measureReportHtml(month, currentRecord(), readNotes())}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };
  if (!canEdit) return;
  view.querySelector('#mm-save').onclick = () => {
    Object.assign(m.method, {
      rate: view.querySelector('#mm-rate').value.trim(), currency: view.querySelector('#mm-currency').value.trim() || 'CHF',
      referenceFrom: view.querySelector('#mm-from').value, referenceTo: view.querySelector('#mm-to').value,
      validatedBy: view.querySelector('#mm-by').value.trim(), validatedAt: view.querySelector('#mm-at').value,
      qaPeople: view.querySelector('#mm-qa').value.trim(),
    });
    save();
    toast('Méthode enregistrée');
    renderMeasure(view, month);
  };
  const saveMonth = () => {
    const record = Object.assign(currentRecord(), { savedAt: new Date().toISOString(), savedBy: (QASession.username && QASession.username()) || '' });
    m.months = m.months.filter(x => x.month !== month).concat([record]);
    save();
  };
  view.querySelector('#ms-save-month').onclick = () => { saveMonth(); toast('Mois enregistré dans le cumul'); renderMeasure(view, month); };
  view.querySelector('#mr-save').onclick = () => { saveMonth(); toast('Rapport et chiffres du mois enregistrés'); renderMeasure(view, month); };
  view.querySelector('#ms-save-base').onclick = () => { m.baseline = readKpis('ms-base'); save(); toast('Baseline enregistrée'); renderMeasure(view, month); };
  view.querySelectorAll('[data-ms-delete]').forEach(b => b.onclick = () => {
    confirmDialog(`Retirer ${msMonthLabel(b.dataset.msDelete)} du cumul ?`, () => {
      m.months = m.months.filter(x => x.month !== b.dataset.msDelete);
      save();
      switchTab('measure');
    });
  });
}

function measureResultsHtml(r, cur) {
  return `
    <div style="font-size:12px;color:var(--text-soft);">Heures économisées</div><div style="font-size:22px;font-weight:600;">${r.h == null ? '–' : msFmt(r.h, 1) + ' h'}</div>
    <div style="font-size:12px;color:var(--text-soft);margin-top:8px;">Économies mesurées</div><div style="font-size:22px;font-weight:600;color:var(--success);">${escapeHtml(msMoney(r.chf))}</div>
    <div style="font-size:12px;color:var(--text-soft);margin-top:8px;">Coûts évités, estimation présentée à part</div><div style="font-size:18px;font-weight:600;">${escapeHtml(msMoney(r.ev))}</div>
    <div style="font-size:12px;color:var(--text-soft);margin-top:8px;">Exécutions automatiques en plus <span title="Elles comptent en coverage, pas en ${escapeHtml(cur)}">(coverage)</span></div><div style="font-size:16px;font-weight:600;">${r.plus == null ? '–' : msFmt(r.plus)}</div>
    ${r.h != null && r.h < 0 ? '<div style="font-size:12px;color:#8a3a2c;margin-top:8px;">Ce mois, l’automatisation coûte plus de temps qu’elle n’en économise : repasser les test cases dans la grille de la semaine 7 (onglet Automatisation).</div>' : ''}`;
}

/* Résumé sur le tableau de bord : économies et indicateurs du dernier mois enregistré. */
function renderMeasureSummary() {
  const m = measureState();
  const months = m.months.slice().sort((a, b) => b.month.localeCompare(a.month));
  if (!months.length) return '';
  const last = months[0];
  const r = measureCompute(last.calc || {});
  const cum = months.reduce((s, x) => s + (measureCompute(x.calc || {}).chf || 0), 0);
  const cumEv = months.reduce((s, x) => s + (measureCompute(x.calc || {}).ev || 0), 0);
  const kpis = ['K1', 'K2', 'K5', 'K6'].map(id => MEASURE_KPIS.find(k => k.id === id));
  return `
    <div class="card" style="margin-bottom:20px;cursor:pointer;" data-goto-measure>
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;">
        <h3 style="font-size:15px;margin:0;">Mesurer · ${escapeHtml(msMonthLabel(last.month))}</h3>
        <span style="font-size:12px;color:var(--text-muted);">${m.method.validatedBy ? `méthode validée par ${escapeHtml(m.method.validatedBy)}` : 'méthode à faire valider (D4)'}</span>
      </div>
      <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:10px;">
        <div><div style="font-size:12px;color:var(--text-soft);">Économies mesurées</div><div style="font-size:20px;font-weight:600;color:var(--success);">${escapeHtml(msMoney(r.chf))}</div><div style="font-size:11.5px;color:var(--text-muted);">depuis le début : ${escapeHtml(msMoney(cum))}</div></div>
        <div><div style="font-size:12px;color:var(--text-soft);">Coûts évités (estimation)</div><div style="font-size:20px;font-weight:600;">${escapeHtml(msMoney(r.ev))}</div><div style="font-size:11.5px;color:var(--text-muted);">depuis le début : ${escapeHtml(msMoney(cumEv))}</div></div>
        ${kpis.map(k => {
          const b = kpiValue(k, m.baseline[k.id]), c = kpiValue(k, (last.kpi || {})[k.id]);
          const ev = kpiEvolution(k, b, c);
          return `<div><div style="font-size:12px;color:var(--text-soft);">${escapeHtml(k.name)}</div><div style="font-size:20px;font-weight:600;">${escapeHtml(kpiLabel(k, c))}</div>
            <div style="font-size:11.5px;color:${ev.good === null ? 'var(--text-muted)' : ev.good ? 'var(--success)' : '#8a3a2c'};">${b == null ? 'baseline à saisir' : `baseline ${escapeHtml(kpiLabel(k, b))} · ${escapeHtml(ev.text)}`}</div></div>`;
        }).join('')}
      </div>
    </div>`;
}
