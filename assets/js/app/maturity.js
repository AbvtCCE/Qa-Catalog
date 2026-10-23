/* Catalogue de tests — module « maturity.js ».
   Fait partie de l'application principale (index.html). L'ordre de chargement
   des <script> compte : voir index.html. Ne pas ouvrir isolément. */
/* ===== Maturité de la QA =====
   En arrivant dans une entreprise : un profil (criticité, taille), le questionnaire des 112 points
   de la check-list ISTQB (maturity-data.js), un niveau indicatif d'après TMMi et un plan
   d'amélioration tiré du plan qualité en huit semaines, rendu générique.
   « Le test dépend du contexte » (CTFL 1.3, check-list ST-01) : le profil rend certains points
   indispensables (poids 2) ou optionnels (poids ½), et fixe le niveau visé.
   Règles de contexte, rattachement aux process areas TMMi, seuils et étapes : proposition, à ajuster.
   state.maturity = {profile{criticality, size, company, standard},
                     assessments[{id, date, label, answers{pointId: {v: yes|partial|no|na, note}}, createdAt, by}],
                     currentId}. */

const MATURITY_ANSWERS = [
  { id: 'yes', label: 'Oui', value: 1, badge: 'badge-success' },
  { id: 'partial', label: 'En partie', value: 0.5, badge: 'badge-warning' },
  { id: 'no', label: 'Non', value: 0, badge: 'badge-danger' },
  { id: 'na', label: 'Sans objet', value: null, badge: 'badge-muted' },
];
const MATURITY_CRITICALITY = [
  { id: 'safety', label: 'Sûreté ou réglementé', examples: 'nucléaire, médical, rail, aviation, automobile, défense', target: 3,
    essential: ['AU-05', 'AU-11', 'AU-12', 'AU-13', 'AU-14', 'AU-15', 'AU-22', 'AU-30', 'ST-03', 'ST-04', 'ST-08', 'ST-11', 'ST-18', 'ST-20', 'ST-23', 'ST-24', 'AR-09', 'AR-15', 'AT-24', 'AT-29', 'AT-34', 'AT-35'],
    optional: [],
    note: 'Les normes du domaine priment (par exemple IEC 61508, IEC 62304, EN 50128, DO-178C, ISO 26262) : indépendance du test, traçabilité complète, revues formelles et couverture structurelle y sont souvent obligatoires.' },
  { id: 'business', label: 'Métier critique', examples: 'banque, assurance, énergie, télécom, santé administrative, service public', target: 3,
    essential: ['AU-11', 'AU-16', 'AU-21', 'AU-22', 'ST-02', 'ST-04', 'ST-11', 'ST-15', 'ST-27', 'AR-09', 'AR-10', 'AR-12', 'AT-35'],
    optional: [],
    note: 'Une panne touche des clients ou des obligations légales : risques, critères de sortie, données de test protégées et retour arrière passent en premier.' },
  { id: 'standard', label: 'Standard', examples: 'logiciel de gestion, e-commerce, SaaS', target: 2,
    essential: [], optional: ['AU-30', 'ST-18', 'AR-14'],
    note: 'La check-list s’applique telle quelle ; l’évaluation formelle de maturité et les techniques avancées peuvent attendre.' },
  { id: 'low', label: 'Faible', examples: 'produit grand public sans enjeu de sécurité, outil interne, site vitrine', target: 2,
    essential: [],
    optional: ['AU-05', 'AU-14', 'AU-15', 'AU-25', 'AU-30', 'AU-32', 'ST-12', 'ST-18', 'ST-20', 'AR-04', 'AR-12', 'AR-14', 'AT-06', 'AT-15', 'AT-16', 'AT-17', 'AT-21'],
    note: 'Hors systèmes critiques, une technique légère suffit (ST-03) : viser l’essentiel, sans formalisme lourd.' },
];
const MATURITY_SIZE = [
  { id: 'solo', label: 'QA seul', examples: 'une personne pour toute la qualité',
    essential: ['AU-03', 'AU-06', 'ST-16', 'AT-07'], optional: ['AR-05', 'AU-32', 'AT-28'],
    note: 'La qualité ne doit pas dépendre d’une seule personne : répartir le test et documenter l’automatisation passent en premier.' },
  { id: 'small', label: 'Petite équipe', examples: '2 à 5 personnes qui testent, une ou deux équipes produit',
    essential: ['AU-03', 'ST-16'], optional: ['AR-05', 'AU-32'],
    note: 'Des rôles clairs suffisent souvent ; la coordination entre équipes pèse peu.' },
  { id: 'multi', label: 'Plusieurs équipes', examples: '5 à 20 personnes qui testent, plusieurs équipes ou fournisseurs',
    essential: ['AU-02', 'AU-04', 'AU-18', 'AU-24', 'AR-05', 'AR-16'], optional: [],
    note: 'Une stratégie commune, des parties prenantes connues et des outils reliés évitent que chaque équipe teste à sa façon.' },
  { id: 'large', label: 'Grande organisation', examples: 'plus de 20 personnes qui testent, programme, plusieurs sites',
    essential: ['AU-02', 'AU-04', 'AU-06', 'AU-18', 'AU-24', 'AU-28', 'AU-30', 'AU-32', 'AR-04', 'AR-05', 'AR-16', 'AR-17', 'AT-08'], optional: [],
    note: 'À cette échelle, la maturité se pilote : modèle reconnu, compétences, flux de livraison et nombre d’outils.' },
];
/* Process areas TMMi (niveaux 2 et 3) et points de la check-list qui en relèvent. */
const MATURITY_TMMI = [
  { level: 2, area: 'Test Policy and Strategy', points: ['AU-01', 'AU-02', 'AU-29', 'ST-01', 'ST-04', 'ST-06', 'ST-07', 'ST-14'] },
  { level: 2, area: 'Test Planning', points: ['AU-07', 'AU-08', 'ST-02', 'ST-03', 'ST-05', 'ST-11', 'ST-12', 'ST-13'] },
  { level: 2, area: 'Test Monitoring and Control', points: ['AU-09', 'AU-10', 'AU-23', 'AU-24', 'AU-26', 'ST-28'] },
  { level: 2, area: 'Test Design and Execution', points: ['AU-11', 'AU-16', 'AU-17', 'AU-19', 'ST-15', 'ST-17', 'ST-22', 'ST-23', 'ST-24', 'ST-26', 'ST-27'] },
  { level: 2, area: 'Test Environment', points: ['AU-20', 'AU-21', 'AU-22', 'AR-03', 'AR-05', 'AR-08', 'ST-25'] },
  { level: 3, area: 'Test Organization', points: ['AU-03', 'AU-04', 'AU-05', 'ST-16'] },
  { level: 3, area: 'Test Training Program', points: ['AU-06'] },
  { level: 3, area: 'Test Lifecycle and Integration', points: ['AU-12', 'ST-09', 'ST-21', 'AR-10', 'AR-11', 'AR-15', 'AR-16'] },
  { level: 3, area: 'Non-functional Testing', points: ['ST-08', 'AR-14'] },
  { level: 3, area: 'Peer Reviews', points: ['AU-13', 'AU-14'] },
];
const TMMI_LEVEL_LABELS = { 1: 'Niveau 1 · Initial', 2: 'Niveau 2 · Managed', 3: 'Niveau 3 · Defined' };
const MATURITY_IN_PLACE = 0.8, MATURITY_IN_PROGRESS = 0.4;
/* Étapes du plan d'amélioration : les huit semaines du plan qualité, rendues génériques, puis la consolidation. */
const MATURITY_PHASES = [
  { n: 1, title: 'Mesurer la baseline', why: 'Sans baseline, aucun progrès ne se prouve.', points: ['AU-09', 'AU-23', 'AU-25', 'AU-26', 'AU-27', 'AU-32'] },
  { n: 2, title: 'Donner une seule adresse à la QA', why: 'Règles, modèles, test cases et defects ont chacun une seule adresse ; la test policy est écrite.', points: ['AU-01', 'AU-12', 'AU-22', 'AR-15', 'AR-17'] },
  { n: 3, title: 'Fournir le kit projet', why: 'Test plan, entry et exit criteria, rapports d’avancement et de fin de test, appliqués tout de suite au projet en cours.', points: ['AU-07', 'AU-08', 'AU-10', 'AU-24', 'ST-05', 'ST-11', 'ST-12', 'ST-28'] },
  { n: 4, title: 'Mettre les defects sous contrôle', why: 'Un seul circuit, du signalement à la clôture.', points: ['AU-11', 'AU-16', 'AU-17', 'AU-18', 'AU-19', 'AR-16', 'ST-27'] },
  { n: 5, title: 'Décider par les risques, et la règle de mise en production', why: 'Une product risk analysis avec le métier ; la profondeur de test, la répartition et la règle de mise en production en découlent.', points: ['AU-02', 'AU-03', 'AU-04', 'AU-05', 'ST-01', 'ST-02', 'ST-03', 'ST-04', 'ST-06', 'ST-07', 'ST-13', 'ST-14', 'ST-15', 'ST-16', 'ST-17', 'AR-10'] },
  { n: 6, title: 'Rendre test data et test environments prévisibles', why: 'Fiches des environnements, journal d’indisponibilité, catalogue et circuit des test data.', points: ['AU-20', 'AU-21', 'AR-01', 'AR-03', 'AR-04', 'AR-05', 'AR-06', 'AR-08', 'AR-09', 'ST-25'] },
  { n: 7, title: 'Rendre l’automatisation durable et la chiffrer', why: 'Objectifs, inventaire trié, règles de maintenance, retour sur investissement.', points: ['AU-28', ...Array.from({ length: 32 }, (_, i) => 'AT-' + String(i + 1).padStart(2, '0'))] },
  { n: 8, title: 'Présenter le bilan et installer l’amélioration continue', why: 'Bilan chiffré à la direction, rétrospective, prochaine évaluation.', points: ['AU-06', 'AU-29', 'AU-30', 'AU-31', 'AT-33', 'AT-34', 'AT-35'] },
  { n: 9, title: 'Consolider dans la durée', why: 'Revues des exigences, techniques avancées, non fonctionnel, livraison continue : les mois suivants installent les pratiques.', points: ['AU-13', 'AU-14', 'AU-15', 'ST-08', 'ST-09', 'ST-10', 'ST-18', 'ST-19', 'ST-20', 'ST-21', 'ST-22', 'ST-23', 'ST-24', 'ST-26', 'AR-02', 'AR-07', 'AR-11', 'AR-12', 'AR-13', 'AR-14'] },
];
/* Où le catalogue aide à mettre le point en place (onglet). */
const MATURITY_TOOL_LINKS = {
  'AU-06': 'testers', 'AU-07': 'testplans', 'AU-08': 'projects', 'AU-09': 'measure', 'AU-10': 'testplans', 'AU-11': 'testcases',
  'AU-12': 'testcases', 'AU-16': 'anomalies', 'AU-17': 'anomalies', 'AU-18': 'anomalies', 'AU-19': 'anomalies', 'AU-20': 'environments',
  'AU-21': 'data', 'AU-22': 'testplans', 'AU-23': 'measure', 'AU-24': 'measure', 'AU-25': 'measure', 'AU-26': 'measure', 'AU-28': 'automation',
  'AU-29': 'maturity', 'AU-30': 'maturity', 'ST-02': 'risks', 'ST-03': 'risks', 'ST-04': 'risks', 'ST-05': 'projects', 'ST-11': 'testplans',
  'ST-13': 'risks', 'ST-15': 'risks', 'ST-17': 'risks', 'ST-25': 'data', 'ST-27': 'anomalies', 'ST-28': 'projects', 'AR-03': 'environments',
  'AR-05': 'environments', 'AR-08': 'data', 'AR-16': 'environments', 'AT-01': 'automation', 'AT-04': 'measure', 'AT-07': 'automation',
  'AT-09': 'automation', 'AT-10': 'automation', 'AT-14': 'anomalies', 'AT-27': 'automation', 'AT-30': 'automation', 'AT-31': 'automation', 'AT-32': 'automation',
};

const MATURITY_POINTS = MATURITY_CHECKLIST.flatMap(p => p.groups.flatMap(g => g.items.map(i => Object.assign({ part: p.id, partTitle: p.title, group: g.title }, i))));
const maturityPoint = id => MATURITY_POINTS.find(p => p.id === id);
const maturityState = () => {
  if (!state.maturity || typeof state.maturity !== 'object') state.maturity = {};
  const m = state.maturity;
  if (!m.profile) m.profile = {};
  if (!Array.isArray(m.assessments)) m.assessments = [];
  return m;
};
function maturityCurrent() {
  const m = maturityState();
  return m.assessments.find(a => a.id === m.currentId) || m.assessments.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null;
}
const matCrit = id => MATURITY_CRITICALITY.find(c => c.id === id);
const matSize = id => MATURITY_SIZE.find(s => s.id === id);

/* Importance d'un point pour le profil : indispensable (poids 2), normal (1), optionnel (½). */
function maturityPointClass(id, profile) {
  const c = matCrit(profile.criticality), s = matSize(profile.size);
  const ess = [...((c && c.essential) || []), ...((s && s.essential) || [])];
  if (ess.includes(id)) return 'essential';
  const opt = [...((c && c.optional) || []), ...((s && s.optional) || [])];
  return opt.includes(id) ? 'optional' : 'normal';
}
const MATURITY_WEIGHTS = { essential: 2, normal: 1, optional: 0.5 };

/* Score : Oui = 1, En partie = 0,5, Non = 0, sans les points sans objet ni les points non répondus.
   weighted = false : la règle de la check-list ; true : pondéré par le profil. */
function maturityScore(assessment, ids, weighted) {
  const profile = maturityState().profile;
  let num = 0, den = 0, answered = 0;
  (ids || MATURITY_POINTS.map(p => p.id)).forEach(id => {
    const a = ((assessment && assessment.answers) || {})[id];
    const ans = a && MATURITY_ANSWERS.find(x => x.id === a.v);
    if (!ans || ans.value === null) return;
    const w = weighted ? MATURITY_WEIGHTS[maturityPointClass(id, profile)] : 1;
    num += ans.value * w;
    den += w;
    answered++;
  });
  return { pct: den ? Math.round((num / den) * 100) : null, answered };
}
function maturityAreaStatus(assessment, area) {
  const s = maturityScore(assessment, area.points, true);
  if (s.pct === null) return { id: 'unknown', label: 'À évaluer', badge: 'badge-muted', pct: null };
  if (s.pct >= MATURITY_IN_PLACE * 100) return { id: 'done', label: 'En place', badge: 'badge-success', pct: s.pct };
  if (s.pct >= MATURITY_IN_PROGRESS * 100) return { id: 'doing', label: 'En cours', badge: 'badge-warning', pct: s.pct };
  return { id: 'todo', label: 'À faire', badge: 'badge-danger', pct: s.pct };
}
/* Niveau TMMi indicatif : un niveau est atteint quand chaque process area du niveau, et des
   niveaux inférieurs, est en place. */
function maturityLevel(assessment) {
  let level = 1;
  for (const l of [2, 3]) {
    const areas = MATURITY_TMMI.filter(a => a.level === l);
    if (areas.every(a => maturityAreaStatus(assessment, a).id === 'done')) level = l; else break;
  }
  return level;
}
function maturityTarget() {
  const c = matCrit(maturityState().profile.criticality);
  return c ? c.target : 2;
}
/* Plan d'amélioration : les Non et les En partie, étape par étape ; dans chaque étape, les
   points indispensables pour le profil, puis les « D'abord », puis les Non avant les En partie. */
function maturityPlan(assessment) {
  const profile = maturityState().profile;
  const rank = { essential: 0, normal: 1, optional: 2 };
  return MATURITY_PHASES.map(ph => {
    const items = ph.points.map(id => {
      const a = ((assessment && assessment.answers) || {})[id];
      return { point: maturityPoint(id), answer: a ? a.v : null, note: a ? a.note : '', cls: maturityPointClass(id, profile) };
    }).filter(x => x.point && (x.answer === 'no' || x.answer === 'partial'))
      .sort((a, b) => rank[a.cls] - rank[b.cls] || (b.point.first ? 1 : 0) - (a.point.first ? 1 : 0) || (a.answer === 'no' ? 0 : 1) - (b.answer === 'no' ? 0 : 1));
    return Object.assign({}, ph, { items });
  });
}
function maturityTabLabel(tabId) { return ((typeof TABS !== 'undefined' ? TABS : []).find(t => t.id === tabId) || {}).label || tabId; }

function maturityReportHtml(assessment) {
  const m = maturityState();
  const cell = 'border:1px solid #ccc;padding:4px 8px;vertical-align:top;';
  const th = cell + 'background:#f4f5f7;text-align:left;';
  const c = matCrit(m.profile.criticality), s = matSize(m.profile.size);
  const plan = maturityPlan(assessment);
  const lvl = maturityLevel(assessment);
  return `
    <h1>Maturité de la QA${m.profile.company ? ' · ' + escapeHtml(m.profile.company) : ''}</h1>
    <p>Évaluation du ${assessment.date ? wrFmt(assessment.date) : '–'}${assessment.label ? ' (' + escapeHtml(assessment.label) + ')' : ''}. Profil : criticité ${escapeHtml(c ? c.label.toLowerCase() : 'non renseignée')}, ${escapeHtml(s ? s.label.toLowerCase() : 'taille non renseignée')}${m.profile.standard ? ', norme : ' + escapeHtml(m.profile.standard) : ''}.</p>
    <h2>Résultat</h2>
    <table style="border-collapse:collapse;"><tbody>
      <tr><th style="${th}">Score pondéré pour ce contexte</th><td style="${cell}">${maturityScore(assessment, null, true).pct ?? '–'} %</td></tr>
      <tr><th style="${th}">Score de la check-list (Oui = 1, En partie = 0,5, Non = 0)</th><td style="${cell}">${maturityScore(assessment, null, false).pct ?? '–'} %</td></tr>
      <tr><th style="${th}">Points évalués</th><td style="${cell}">${maturityScore(assessment, null, false).answered} sur ${MATURITY_POINTS.length}</td></tr>
      <tr><th style="${th}">Niveau indicatif (TMMi)</th><td style="${cell}">${escapeHtml(TMMI_LEVEL_LABELS[lvl])} ; visé : ${escapeHtml(TMMI_LEVEL_LABELS[maturityTarget()])}</td></tr>
    </tbody></table>
    <table style="border-collapse:collapse;margin-top:6px;"><thead><tr>${['Partie', 'Score'].map(h => `<th style="${th}">${h}</th>`).join('')}</tr></thead>
      <tbody>${MATURITY_CHECKLIST.map(p => `<tr><td style="${cell}">${escapeHtml(p.title)}</td><td style="${cell}">${(v => v === null ? 'non évalué' : v + ' %')(maturityScore(assessment, p.groups.flatMap(g => g.items.map(i => i.id)), true).pct)}</td></tr>`).join('')}</tbody></table>
    <h2>Process areas TMMi</h2>
    <table style="border-collapse:collapse;"><thead><tr>${['Niveau', 'Process area', 'Statut'].map(h => `<th style="${th}">${h}</th>`).join('')}</tr></thead>
      <tbody>${MATURITY_TMMI.map(a => { const st = maturityAreaStatus(assessment, a); return `<tr><td style="${cell}">${a.level}</td><td style="${cell}">${escapeHtml(a.area)}</td><td style="${cell}">${escapeHtml(st.label)}${st.pct !== null ? ' (' + st.pct + ' %)' : ''}</td></tr>`; }).join('')}</tbody></table>
    <h2>Plan d’amélioration</h2>
    ${plan.filter(ph => ph.items.length).map(ph => `<h3>${ph.n}. ${escapeHtml(ph.title)}</h3><p>${escapeHtml(ph.why)}</p>
      <ul>${ph.items.map(x => `<li><strong>${escapeHtml(x.point.id)}</strong> ${escapeHtml(x.point.t)} (${x.answer === 'no' ? 'Non' : 'En partie'}${x.cls === 'essential' ? ', indispensable pour ce contexte' : ''}${x.point.first ? ', D’abord' : ''})${x.note ? ' · ' + escapeHtml(x.note) : ''}</li>`).join('')}</ul>`).join('') || '<p>Aucun point Non ou En partie.</p>'}
    <p><small>Niveau indicatif : il ne remplace pas une évaluation TMMi menée par un assessor accrédité. Règles de contexte et rattachement aux process areas : proposition, à ajuster. Les points sont des résumés ; le texte des syllabus ISTQB fait foi.</small></p>`;
}

function renderMaturity(view) {
  const m = maturityState();
  const canEdit = !window.QAPerm || QAPerm.can('update', 'maturity');
  const a = maturityCurrent();
  const profile = m.profile;
  const field = 'font:inherit;font-size:13px;padding:5px 8px;border:1px solid var(--border-strong);border-radius:var(--radius-sm);background:var(--surface);';
  const dis = canEdit ? '' : 'disabled';
  const countClass = cls => MATURITY_POINTS.filter(p => maturityPointClass(p.id, profile) === cls).length;
  const filter = view.dataset.matFilter || 'all';
  const search = view.dataset.matSearch || '';
  const guided = guidedMode();
  const plain = id => MATURITY_PLAIN[id] || ['', ''];
  const choiceHelp = rows => `<ul class="help-choices">${rows.map(([q, r]) => `<li>${escapeHtml(q)} <strong>→ ${escapeHtml(r)}</strong></li>`).join('')}</ul>`;

  view.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Maturité de la QA</h1>
        <div class="subtitle">Les 112 points de la check-list ISTQB, adaptés à la criticité et à la taille de l’entreprise : un niveau indicatif d’après TMMi et un plan d’amélioration.</div>
      </div>
      <div class="actions">
        ${guideToggle('mat-guided')}
        ${a ? `<button class="btn" id="mat-copy" title="Colle le rapport dans un wiki, un e-mail ou un document">Copier le rapport</button><button class="btn" id="mat-md">Télécharger (.md)</button>` : ''}
      </div>
    </div>

    ${guideBox('Par où commencer ?', 'Ce questionnaire dit où en est la qualité des logiciels dans votre entreprise et ce qu’il faut faire pour progresser. Pas besoin d’être informaticien : chaque point est expliqué en mots simples, avec la question à poser pour vérifier.', MATURITY_GUIDE, guided)}

    <div class="card" style="margin-bottom:16px;">
      <h3 style="font-size:15px;margin:0 0 8px;">Profil de l’entreprise <span style="font-weight:400;color:var(--text-muted);font-size:12px;">· le test dépend du contexte (CTFL 1.3)</span></h3>
      ${helpDetails('Comment choisir la criticité et la taille ?', `<p style="margin:0 0 4px;"><strong>Criticité</strong> : que se passe-t-il si le logiciel tombe en panne ? Prenez la première réponse « oui » en partant du haut.</p>${choiceHelp(MATURITY_PROFILE_HELP.criticality)}
        <p style="margin:8px 0 4px;"><strong>Taille</strong> : combien de personnes testent, toutes équipes confondues (QA, métier, développeurs, fournisseurs) ?</p>${choiceHelp(MATURITY_PROFILE_HELP.size)}
        <p style="margin:8px 0 0;">En cas de doute entre deux choix, prenez le plus exigeant. Vous pourrez changer le profil à tout moment : vos réponses sont gardées.</p>`, guided && !(profile.criticality && profile.size))}
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;font-size:12.5px;">
        <label>Entreprise<br><input id="mat-company" style="${field}width:180px;" value="${escapeHtml(profile.company || '')}" ${dis}></label>
        <label>Criticité<br><select id="mat-crit" style="${field}max-width:320px;" ${dis}><option value="">—</option>${MATURITY_CRITICALITY.map(c => `<option value="${c.id}" ${profile.criticality === c.id ? 'selected' : ''}>${escapeHtml(c.label)} (${escapeHtml(c.examples)})</option>`).join('')}</select></label>
        <label>Taille<br><select id="mat-size" style="${field}max-width:320px;" ${dis}><option value="">—</option>${MATURITY_SIZE.map(s => `<option value="${s.id}" ${profile.size === s.id ? 'selected' : ''}>${escapeHtml(s.label)} (${escapeHtml(s.examples)})</option>`).join('')}</select></label>
        <label style="flex:1;min-width:200px;">Norme applicable <span style="color:var(--text-muted);">(si réglementé)</span><br><input id="mat-standard" style="${field}width:100%;" value="${escapeHtml(profile.standard || '')}" placeholder="Ex. IEC 62304, EN 50128, ISO 26262" ${dis}></label>
        ${canEdit ? '<button class="btn btn-sm" id="mat-profile-save">Enregistrer le profil</button>' : ''}
      </div>
      <div style="font-size:12px;color:var(--text-soft);margin-top:8px;" id="mat-profile-note">
        ${[matCrit(profile.criticality), matSize(profile.size)].filter(Boolean).map(x => `<div><strong>${escapeHtml(x.label)}</strong> (${escapeHtml(x.examples)}) : ${escapeHtml(x.note)}</div>`).join('') || 'Choisissez la criticité et la taille : elles fixent les points indispensables, les points optionnels et le niveau visé.'}
        ${profile.criticality || profile.size ? `<div style="margin-top:4px;">Pour ce profil : <span class="badge badge-danger">${countClass('essential')} indispensables</span> <span class="badge badge-muted">${countClass('optional')} optionnels</span> · niveau visé ${escapeHtml(TMMI_LEVEL_LABELS[maturityTarget()])}.</div>` : ''}
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <h3 style="font-size:15px;margin:0;">Évaluation</h3>
        ${m.assessments.length ? `<select id="mat-current" style="${field}width:auto;min-width:220px;">${m.assessments.slice().sort((x, y) => String(y.date).localeCompare(String(x.date))).map(x => `<option value="${x.id}" ${a && a.id === x.id ? 'selected' : ''}>${escapeHtml(wrFmt(x.date))}${x.label ? ' · ' + escapeHtml(x.label) : ''} · ${maturityScore(x, null, false).pct ?? '–'} %</option>`).join('')}</select>` : ''}
        ${canEdit ? `<button class="btn btn-primary btn-sm" id="mat-new">${m.assessments.length ? 'Nouvelle évaluation (repart de celle-ci)' : 'Commencer l’évaluation'}</button>` : ''}
        ${canEdit && a ? `<input id="mat-label" style="${field}width:200px;" value="${escapeHtml(a.label || '')}" placeholder="Libellé : arrivée, bilan à 3 mois…"><input type="date" id="mat-date" style="${field}width:auto;" value="${escapeHtml(a.date || '')}"><button class="btn btn-sm" id="mat-meta-save">Enregistrer</button><button class="btn-icon btn-ghost" id="mat-delete" title="Supprimer cette évaluation">${ICON.trash}</button>` : ''}
      </div>
      ${guided ? '<p class="help-plain" style="margin:8px 0 0;">Une évaluation est une photo de la situation à une date. La première fois, cliquez « Commencer l’évaluation ». Dans trois ou six mois, « Nouvelle évaluation » reprend vos réponses : vous changez seulement ce qui a bougé, et le progrès s’affiche. Le libellé et la date servent à les reconnaître.</p>' : ''}
    </div>

    ${a ? `<div id="mat-results"></div>
    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
        <h3 style="font-size:15px;margin:0 8px 0 0;">Questionnaire</h3>
        ${[['all', 'Tous', 'Tous les points'], ['todo', 'À traiter', 'Les points répondus Non ou En partie'], ['unanswered', 'Non répondus', 'Les points pas encore répondus'], ['essential', 'Indispensables', 'Les points vitaux pour votre contexte'], ['first', 'D’abord', 'Les points à mettre en place en premier']].map(([id, l, t]) => `<button class="btn btn-sm ${filter === id ? 'btn-primary' : ''}" data-mat-filter="${id}" title="${t}">${l}</button>`).join('')}
        <input id="mat-search" style="${field}flex:1;min-width:160px;" placeholder="Rechercher" value="${escapeHtml(search)}">
      </div>
      ${helpDetails('Comment répondre ?', `${helpList(MATURITY_ANSWER_HELP)}
        <p style="margin:6px 0;"><strong>Vous ne savez pas ?</strong> Laissez le point sans réponse, ou répondez Non et notez « à vérifier avec… » dans la case à droite. Un point sans réponse ne compte pas dans le score. Cliquer une deuxième fois sur une réponse l’efface.</p>
        <p style="margin:6px 0 2px;"><strong>Les étiquettes</strong></p>${helpList(MATURITY_BADGE_HELP)}
        ${guided ? '' : '<p style="margin:6px 0 0;">Activez « Mode guidé » en haut de la page pour voir chaque point expliqué en clair.</p>'}`, guided && !(a.answers && Object.keys(a.answers).length))}
      <div id="mat-questions"></div>
    </div>
    <div class="card" id="mat-plan"></div>` : `
    <div class="card" style="text-align:center;padding:28px;"><p style="margin:0;color:var(--text-soft);">Aucune évaluation. Renseignez le profil, puis commencez l’évaluation : pour chaque point, cherchez une preuve (un document, un outil, une réunion, un chiffre) et répondez Oui, En partie, Non ou Sans objet.</p></div>`}
    ${glossaryCard(field)}
  `;
  wireGlossary(view);
  view.querySelector('#mat-guided').onchange = (e) => { setGuidedMode(e.target.checked); renderMaturity(view); };

  const renderResults = () => {
    const box = view.querySelector('#mat-results');
    if (!box) return;
    const first = m.assessments.slice().sort((x, y) => String(x.date).localeCompare(String(y.date)))[0];
    const sw = maturityScore(a, null, true), sc = maturityScore(a, null, false);
    const lvl = maturityLevel(a), target = maturityTarget();
    const delta = first && first.id !== a.id ? (sc.pct ?? 0) - (maturityScore(first, null, false).pct ?? 0) : null;
    // L'aide garde son état ouvert ou fermé pendant qu'on répond
    const prevHelp = box.querySelector('#mat-results-help details');
    const helpOpen = prevHelp ? prevHelp.open : guided;
    box.innerHTML = `
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;margin-bottom:16px;">
        <div class="card" style="flex:1;min-width:240px;">
          <div style="font-size:12px;color:var(--text-soft);">Score pondéré pour ce contexte</div>
          <div style="font-size:30px;font-weight:700;">${sw.pct ?? '–'}<span style="font-size:16px;color:var(--text-soft);"> %</span></div>
          <div style="font-size:12px;color:var(--text-soft);">Score de la check-list : <strong>${sc.pct ?? '–'} %</strong>${delta !== null ? ` · <span style="color:${delta >= 0 ? 'var(--success)' : '#8a3a2c'};">${delta >= 0 ? '+' : ''}${delta} pts depuis le ${escapeHtml(wrFmt(first.date))}</span>` : ''}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${sc.answered} point${sc.answered > 1 ? 's' : ''} évalué${sc.answered > 1 ? 's' : ''} sur ${MATURITY_POINTS.length}</div>
          <div style="margin-top:10px;font-size:13px;">${escapeHtml(TMMI_LEVEL_LABELS[lvl])} <span style="color:var(--text-muted);">· visé : ${escapeHtml(TMMI_LEVEL_LABELS[target])}</span></div>
          ${MATURITY_CHECKLIST.map(p => { const ps = maturityScore(a, p.groups.flatMap(g => g.items.map(i => i.id)), true).pct; return `<div style="font-size:12px;margin:8px 0 2px;">${escapeHtml(p.title)} · <strong>${ps === null ? 'non évalué' : ps + ' %'}</strong></div>
            <div style="height:7px;background:var(--surface-soft);border-radius:4px;"><div style="height:7px;width:${ps || 0}%;background:var(--primary);border-radius:4px;"></div></div>`; }).join('')}
        </div>
        <div class="card" style="flex:1;min-width:300px;">
          <div style="font-size:12px;font-weight:600;color:var(--text-soft);margin-bottom:6px;">Process areas TMMi <span style="font-weight:400;">· en place à ${MATURITY_IN_PLACE * 100} %, en cours à ${MATURITY_IN_PROGRESS * 100} %</span></div>
          <table style="border-collapse:collapse;width:100%;font-size:12.5px;">${MATURITY_TMMI.map(ar => { const st = maturityAreaStatus(a, ar); return `<tr>
            <td style="padding:4px 6px;border-bottom:1px solid var(--border);color:var(--text-muted);">N${ar.level}</td>
            <td style="padding:4px 6px;border-bottom:1px solid var(--border);" title="${escapeHtml(MATURITY_RESULT_HELP.areas[ar.area] || '')}">${escapeHtml(ar.area)}${guided && MATURITY_RESULT_HELP.areas[ar.area] ? `<div style="font-size:11.5px;color:var(--text-muted);">${escapeHtml(MATURITY_RESULT_HELP.areas[ar.area])}</div>` : ''}</td>
            <td style="padding:4px 6px;border-bottom:1px solid var(--border);text-align:right;"><span class="badge ${st.badge}">${escapeHtml(st.label)}${st.pct !== null ? ' · ' + st.pct + ' %' : ''}</span></td></tr>`; }).join('')}</table>
          <p style="font-size:11.5px;color:var(--text-muted);margin:8px 0 0;">Niveau indicatif : il ne remplace pas une évaluation TMMi menée par un assessor accrédité. Rattachement des points et seuils : proposition, à ajuster.</p>
        </div>
      </div>
      <div class="card" id="mat-results-help" style="margin:-4px 0 16px;">${helpDetails('Comment lire ce résultat ?', `<p style="margin:0 0 6px;">${escapeHtml(MATURITY_RESULT_HELP.scores)}</p>
        <p style="margin:0 0 4px;"><strong>Le niveau</strong> suit le modèle TMMi. Il est atteint quand tous ses domaines (les « process areas ») sont en place, c’est-à-dire à ${MATURITY_IN_PLACE * 100} % ou plus ; « en cours » à partir de ${MATURITY_IN_PROGRESS * 100} %. Le niveau visé dépend de la criticité choisie dans le profil.</p>
        ${helpList(MATURITY_RESULT_HELP.levels)}
        <p style="margin:6px 0 0;">Un niveau bas en arrivant est normal : c’est la photo de départ. Ce qui compte, c’est la progression d’une évaluation à l’autre, et le plan d’amélioration plus bas dit quoi faire.</p>`, helpOpen)}</div>`;
  };

  const renderPlan = () => {
    const box = view.querySelector('#mat-plan');
    if (!box) return;
    const plan = maturityPlan(a);
    const total = plan.reduce((s, ph) => s + ph.items.length, 0);
    const unanswered = MATURITY_POINTS.filter(p => !(a.answers || {})[p.id]).length;
    box.innerHTML = `
      <h3 style="font-size:15px;margin:0 0 4px;">Plan d’amélioration <span style="font-weight:400;color:var(--text-muted);font-size:12px;">· ${total} point${total > 1 ? 's' : ''} à traiter${unanswered ? `, ${unanswered} non évalué${unanswered > 1 ? 's' : ''}` : ''}</span></h3>
      <p style="font-size:12px;color:var(--text-soft);margin:0 0 10px;">Les Non et les En partie, dans l’ordre des étapes du plan qualité : dans chaque étape, les points indispensables pour ce contexte, puis les « D’abord ». Pour un QA seul à plein temps, une étape prend environ une semaine ; une équipe peut en mener plusieurs de front.${guided ? ' Commencez par l’étape 1, point par point. Le bouton à droite d’un point ouvre l’onglet du catalogue qui aide à le mettre en place ; quand c’est fait, repassez le point à Oui dans le questionnaire.' : ''}</p>
      ${plan.filter(ph => ph.items.length).map(ph => `
        <div style="margin-bottom:12px;">
          <div style="font-weight:600;font-size:13.5px;">${ph.n}. ${escapeHtml(ph.title)} <span style="font-weight:400;color:var(--text-muted);font-size:12px;">· ${ph.items.length} point${ph.items.length > 1 ? 's' : ''}</span></div>
          <div style="font-size:12px;color:var(--text-soft);margin-bottom:4px;">${escapeHtml(guided && MATURITY_PHASE_PLAIN[ph.n] ? MATURITY_PHASE_PLAIN[ph.n] : ph.why)}</div>
          ${ph.items.map(x => `<div style="display:flex;gap:8px;align-items:flex-start;padding:4px 0;border-bottom:1px solid var(--border);font-size:12.5px;">
            <span class="badge ${x.answer === 'no' ? 'badge-danger' : 'badge-warning'}" style="flex-shrink:0;">${x.answer === 'no' ? 'Non' : 'En partie'}</span>
            <div style="flex:1;"><strong>${escapeHtml(x.point.id)}</strong> ${escapeHtml(guided && plain(x.point.id)[0] ? plain(x.point.id)[0] : x.point.t)}
              ${x.cls === 'essential' ? ' <span class="badge badge-danger" style="font-size:10px;">indispensable</span>' : ''}${x.point.first ? ' <span class="badge badge-primary" style="font-size:10px;">D’abord</span>' : ''}${x.cls === 'optional' ? ' <span class="badge badge-muted" style="font-size:10px;">optionnel</span>' : ''}
              ${x.note ? `<div style="color:var(--text-muted);">${escapeHtml(x.note)}</div>` : ''}</div>
            ${MATURITY_TOOL_LINKS[x.point.id] && MATURITY_TOOL_LINKS[x.point.id] !== 'maturity' ? `<button class="btn btn-sm" data-mat-goto="${MATURITY_TOOL_LINKS[x.point.id]}" title="Le catalogue aide à le mettre en place" style="flex-shrink:0;">${escapeHtml(maturityTabLabel(MATURITY_TOOL_LINKS[x.point.id]))} ›</button>` : ''}
          </div>`).join('')}
        </div>`).join('') || '<p style="font-size:12.5px;color:var(--text-muted);font-style:italic;">Aucun point Non ou En partie pour l’instant.</p>'}`;
    box.querySelectorAll('[data-mat-goto]').forEach(b => b.onclick = () => switchTab(b.dataset.matGoto));
  };

  const renderQuestions = () => {
    const box = view.querySelector('#mat-questions');
    if (!box) return;
    const term = search.toLowerCase();
    const keep = p => {
      const ans = ((a.answers || {})[p.id] || {}).v;
      if (filter === 'todo' && !(ans === 'no' || ans === 'partial')) return false;
      if (filter === 'unanswered' && ans) return false;
      if (filter === 'essential' && maturityPointClass(p.id, profile) !== 'essential') return false;
      if (filter === 'first' && !p.first) return false;
      return !term || (p.id + ' ' + p.t + ' ' + p.d + ' ' + plain(p.id).join(' ')).toLowerCase().includes(term);
    };
    box.innerHTML = MATURITY_CHECKLIST.map(part => {
      const groups = part.groups.map(g => ({ g, items: g.items.map(i => maturityPoint(i.id)).filter(keep) })).filter(x => x.items.length);
      if (!groups.length) return '';
      return `<div style="margin-bottom:14px;"><div style="font-weight:700;font-size:14px;margin:6px 0;">${escapeHtml(part.title)}</div>
        ${groups.map(({ g, items }) => `<div style="font-size:12px;font-weight:600;color:var(--text-soft);text-transform:uppercase;letter-spacing:0.04em;margin:8px 0 4px;">${escapeHtml(g.title)}</div>
          ${items.map(p => {
            const ans = (a.answers || {})[p.id] || {};
            const cls = maturityPointClass(p.id, profile);
            const badges = `${cls === 'essential' ? ' <span class="badge badge-danger" style="font-size:10px;" title="Vital pour votre contexte : compte double">indispensable</span>' : ''}${p.first ? ' <span class="badge badge-primary" style="font-size:10px;" title="À mettre en place en premier">D’abord</span>' : ''}${cls === 'optional' ? ' <span class="badge badge-muted" style="font-size:10px;" title="Peut attendre dans votre contexte : compte moitié">optionnel</span>' : ''}`;
            const [pl, check] = plain(p.id);
            const technical = `<div style="font-size:12px;color:var(--text-soft);margin:2px 0;">${escapeHtml(p.d)}</div>
              <div style="font-size:11px;color:var(--text-muted);">${p.r.map(escapeHtml).join(' · ')}</div>`;
            return `<div style="padding:8px 0;border-bottom:1px solid var(--border);" data-mat-row="${p.id}">
              ${guided && pl ? `<div style="font-size:13.5px;"><strong>${escapeHtml(p.id)}</strong> ${escapeHtml(pl)}${badges}</div>
                <div class="mat-check"><strong>Pour vérifier :</strong> ${escapeHtml(check)}</div>
                ${helpDetails('Formulation de la check-list et preuve attendue', `<div style="font-size:12.5px;">${escapeHtml(p.t)}</div>${technical}`)}`
              : `<div style="font-size:13px;"><strong>${escapeHtml(p.id)}</strong> ${escapeHtml(p.t)}${badges}</div>
                ${technical}
                ${pl ? helpDetails('En clair', `<div>${escapeHtml(pl)}</div><div style="margin-top:3px;"><strong>Pour vérifier :</strong> ${escapeHtml(check)}</div>`) : ''}`}
              <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:6px;">
                ${MATURITY_ANSWERS.map(x => `<button class="btn btn-sm ${ans.v === x.id ? 'btn-primary' : ''}" data-mat-answer="${p.id}:${x.id}" title="${escapeHtml((MATURITY_ANSWER_HELP.find(h => h[0] === x.label) || ['', ''])[1])}" ${dis}>${x.label}</button>`).join('')}
                <input data-mat-note="${p.id}" style="${field}flex:1;min-width:180px;" placeholder="${guided ? 'La preuve vue, ou qui vous a répondu' : 'Preuve ou décision'}" value="${escapeHtml(ans.note || '')}" ${dis}>
              </div>
            </div>`;
          }).join('')}`).join('')}</div>`;
    }).join('') || '<p style="font-size:12.5px;color:var(--text-muted);font-style:italic;">Aucun point ne correspond au filtre.</p>';
    box.querySelectorAll('[data-mat-answer]').forEach(b => b.onclick = () => {
      const [id, v] = b.dataset.matAnswer.split(':');
      if (!a.answers) a.answers = {};
      const cur = a.answers[id] || {};
      a.answers[id] = Object.assign({}, cur, { v: cur.v === v ? null : v });
      if (!a.answers[id].v && !a.answers[id].note) delete a.answers[id];
      save();
      b.parentElement.querySelectorAll('[data-mat-answer]').forEach(x => x.classList.toggle('btn-primary', a.answers[id] && x.dataset.matAnswer === `${id}:${a.answers[id].v}`));
      renderResults();
      renderPlan();
    });
    box.querySelectorAll('[data-mat-note]').forEach(i => i.onchange = () => {
      const id = i.dataset.matNote;
      if (!a.answers) a.answers = {};
      a.answers[id] = Object.assign({}, a.answers[id] || {}, { note: i.value.trim() });
      save();
      renderPlan();
    });
  };

  if (a) { renderResults(); renderQuestions(); renderPlan(); }

  view.querySelectorAll('[data-mat-filter]').forEach(b => b.onclick = () => { view.dataset.matFilter = b.dataset.matFilter; renderMaturity(view); });
  const searchEl = view.querySelector('#mat-search');
  if (searchEl) searchEl.oninput = () => { view.dataset.matSearch = searchEl.value; renderQuestionsDebounced(); };
  let t = null;
  function renderQuestionsDebounced() { clearTimeout(t); t = setTimeout(() => { renderMaturity(view); const s2 = view.querySelector('#mat-search'); if (s2) { s2.focus(); s2.setSelectionRange(s2.value.length, s2.value.length); } }, 250); }
  const cur = view.querySelector('#mat-current');
  if (cur) cur.onchange = () => { m.currentId = cur.value; save(); renderMaturity(view); };
  if (a) {
    view.querySelector('#mat-copy').onclick = async () => {
      const html = maturityReportHtml(a);
      const text = html.replace(/<li>/g, '- ').replace(/<\/t[dh]>/g, ' | ').replace(/<\/(h1|h2|h3|p|li|tr)>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      const ok = await copyRichText(html, text);
      toast(ok ? 'Rapport copié' : 'Copie impossible');
    };
    view.querySelector('#mat-md').onclick = () => {
      const md = maturityReportHtml(a).replace(/<h1>/g, '# ').replace(/<h2>/g, '\n## ').replace(/<h3>/g, '\n### ').replace(/<li>/g, '- ').replace(/<tr>/g, '| ')
        .replace(/<\/t[dh]>/g, ' | ').replace(/<\/(h1|h2|h3|p|li|tr)>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n{3,}/g, '\n\n');
      const blob = new Blob([md], { type: 'text/markdown' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `maturite-qa-${a.date || 'evaluation'}.md`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    };
  }
  if (!canEdit) return;
  view.querySelector('#mat-profile-save').onclick = () => {
    m.profile = {
      company: view.querySelector('#mat-company').value.trim(),
      criticality: view.querySelector('#mat-crit').value,
      size: view.querySelector('#mat-size').value,
      standard: view.querySelector('#mat-standard').value.trim(),
    };
    save();
    toast('Profil enregistré');
    renderMaturity(view);
  };
  view.querySelector('#mat-new').onclick = () => {
    const base = maturityCurrent();
    const n = { id: uid(), date: wrIso(new Date()), label: base ? '' : 'Arrivée', answers: base ? JSON.parse(JSON.stringify(base.answers || {})) : {}, createdAt: new Date().toISOString(), by: (QASession.username && QASession.username()) || '' };
    m.assessments.push(n);
    m.currentId = n.id;
    save();
    toast(base ? 'Nouvelle évaluation : les réponses précédentes sont reprises, modifiez ce qui a bougé' : 'Évaluation commencée');
    renderMaturity(view);
  };
  if (a) {
    view.querySelector('#mat-meta-save').onclick = () => {
      a.label = view.querySelector('#mat-label').value.trim();
      a.date = view.querySelector('#mat-date').value || a.date;
      save();
      toast('Évaluation enregistrée');
      renderMaturity(view);
    };
    view.querySelector('#mat-delete').onclick = () => confirmDialog('Supprimer cette évaluation ? Ses réponses seront perdues.', () => {
      m.assessments = m.assessments.filter(x => x.id !== a.id);
      m.currentId = null;
      save();
      switchTab('maturity');
    });
  }
}

/* Pour « Mesurer » (S8) : score de la check-list de la dernière évaluation au plus tard à la date
   donnée, et statut des process areas TMMi niveau 2. */
function maturityScoreAt(isoDate) {
  const list = maturityState().assessments.filter(a => a.date && (!isoDate || a.date <= isoDate)).sort((x, y) => String(y.date).localeCompare(String(x.date)));
  return list.length ? maturityScore(list[0], null, false).pct : null;
}
function maturityFirstScore() {
  const list = maturityState().assessments.slice().sort((x, y) => String(x.date).localeCompare(String(y.date)));
  return list.length ? maturityScore(list[0], null, false).pct : null;
}
function maturityTmmiL2At(isoDate) {
  const list = maturityState().assessments.filter(a => a.date && (!isoDate || a.date <= isoDate)).sort((x, y) => String(y.date).localeCompare(String(x.date)));
  if (!list.length) return null;
  const out = {};
  MATURITY_TMMI.filter(x => x.level === 2).forEach(x => { const st = maturityAreaStatus(list[0], x); out[x.area] = st.id === 'unknown' ? 'todo' : st.id; });
  return out;
}
