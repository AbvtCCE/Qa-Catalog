/* Catalogue de tests — module « guide.js ».
   Fait partie de l'application principale (index.html). L'ordre de chargement
   des <script> compte : voir index.html. Ne pas ouvrir isolément. */
/* ===== Guide pour débutants =====
   « Mesurer » et « Maturité » doivent être utilisables par quelqu'un qui n'a aucune
   expérience de l'informatique, du test ou de la gestion de projet : guide pas à pas,
   aide de chaque champ (ce que c'est, où le trouver, conseil, exemple), explication en
   clair de chaque point de la check-list, lexique. L'aide des champs du calculateur et des
   indicateurs reprend celle de la page du plan qualité, rendue générique. */

/* Mode guidé : explications toujours visibles. Préférence de chaque navigateur. */
const GUIDE_KEY = 'qa-guided-mode';
function guidedMode() {
  try { return localStorage.getItem(GUIDE_KEY) !== 'off'; } catch (e) { return true; }
}
function setGuidedMode(on) {
  try { localStorage.setItem(GUIDE_KEY, on ? 'on' : 'off'); } catch (e) { /* navigation privée */ }
}

/* Bloc d'aide repliable (natif, sans script). */
function helpDetails(summary, html, open) {
  return `<details class="help-details"${open ? ' open' : ''}><summary>${escapeHtml(summary)}</summary><div class="help-body">${html}</div></details>`;
}
/* Encadré « Par où commencer » : des étapes numérotées, déplié en mode guidé. */
function guideBox(title, intro, steps, open) {
  return `<details class="guide-box"${open ? ' open' : ''}>
    <summary class="guide-title">${escapeHtml(title)}</summary>
    ${intro ? `<p>${escapeHtml(intro)}</p>` : ''}
    <ol>${steps.map(s => `<li><strong>${escapeHtml(s[0])}</strong>${s[1] ? ' ' + escapeHtml(s[1]) : ''}</li>`).join('')}</ol>
  </details>`;
}
function guideToggle(id) {
  return `<label class="guide-toggle" title="Afficher les explications partout"><input type="checkbox" id="${id}" ${guidedMode() ? 'checked' : ''}> Mode guidé</label>`;
}
/* Aide d'un champ {q, o, c, ex} : en mode guidé, l'explication est visible et le reste se déplie. */
function fieldHelp(h, guided, moreTitle) {
  if (!h) return '';
  const more = [h.read && `<div><strong>Comment le lire :</strong> ${escapeHtml(h.read)}</div>`,
    h.o && `<div><strong>Où le trouver :</strong> ${escapeHtml(h.o)}</div>`,
    h.c && `<div><strong>Conseil :</strong> ${escapeHtml(h.c)}</div>`,
    h.ex && `<div><strong>Exemple :</strong> ${escapeHtml(h.ex)}</div>`].filter(Boolean).join('');
  return guided
    ? `<div class="help-plain">${escapeHtml(h.q)}</div>${more ? helpDetails(moreTitle || 'Où trouver ce chiffre ?', more) : ''}`
    : helpDetails('Aide', `<div>${escapeHtml(h.q)}</div>${more}`);
}
/* Une liste « terme : explication ». */
function helpList(rows) {
  return `<dl class="help-list">${rows.map(([t, d]) => `<dt>${escapeHtml(t)}</dt><dd>${escapeHtml(d)}</dd>`).join('')}</dl>`;
}
function glossaryCard(field) {
  return `<div class="card" style="margin-top:16px;">${helpDetails('Lexique : les mots techniques expliqués simplement', glossaryHtml(field))}</div>`;
}

/* ---------- Lexique ---------- */
const GLOSSARY = [
  ['Anomalie, defect', 'Un défaut du logiciel : il ne fait pas ce qu’il devrait faire.'],
  ['Automatisation des tests', 'Faire exécuter des tests par un logiciel plutôt qu’à la main. Ça coûte à construire et à entretenir, mais ça peut se rejouer souvent et vite.'],
  ['Baseline', 'La situation de départ, mesurée une fois, à laquelle on compare tous les chiffres suivants. Sans baseline, on ne peut pas prouver un progrès.'],
  ['Blocker, Major, Minor, Cosmetic', 'La gravité d’un défaut. Blocker : un processus important est impossible. Major : un résultat faux ou un arrêt, avec un contournement coûteux. Minor : gênant, sans effet sur les résultats. Cosmetic : présentation ou libellé.'],
  ['CAB', 'Le comité qui autorise les mises en production (Change Advisory Board). Dans une petite entreprise, c’est parfois simplement le responsable qui donne son accord.'],
  ['Changement', 'Une modification apportée à un système en production : nouvelle version, correctif, paramétrage.'],
  ['Coûts évités', 'Ce que des incidents auraient coûté s’ils n’avaient pas été évités grâce au test. C’est une estimation : on la présente à part, jamais additionnée aux économies mesurées.'],
  ['Coverage, couverture', 'La part de ce qui est vérifié par des tests. Plus d’exécutions automatiques donnent plus de couverture, mais pas d’économies en francs.'],
  ['Critères d’entrée et de sortie', 'Entrée : ce qu’une livraison doit apporter pour qu’on commence à la tester. Sortie : les conditions pour dire que le test est terminé et que la mise en production peut être décidée.'],
  ['Environnement de test', 'Une copie du système, séparée de la production, sur laquelle on teste sans risquer de déranger les vrais utilisateurs.'],
  ['Exécution', 'Le fait de jouer un test une fois et de noter son résultat : réussi, échec ou bloqué.'],
  ['Flaky', 'Un test automatisé instable : il réussit ou échoue au hasard. On le met de côté jusqu’à sa correction, sinon plus personne ne croit aux résultats.'],
  ['Full regression', 'Rejouer tous les tests de régression : la vérification la plus complète de ce qui existait déjà.'],
  ['Hotfix', 'Une correction faite en urgence en production, parce qu’un problème ne pouvait pas attendre.'],
  ['Incident de production', 'Un problème rencontré par les vrais utilisateurs, après la mise en production.'],
  ['ISTQB', 'L’organisation internationale qui décrit les bonnes pratiques du test logiciel et ses certifications. La check-list s’appuie sur ses programmes (syllabus).'],
  ['Key users', 'Des utilisateurs métier de référence, qui connaissent bien les processus et participent aux tests.'],
  ['Livraison', 'Une nouvelle version du logiciel remise à l’équipe de test, par l’équipe interne ou par un fournisseur.'],
  ['Maintenance de l’automatisation', 'Le temps passé à réparer ou adapter les tests automatisés quand le logiciel change.'],
  ['Mise en production', 'Le moment où une nouvelle version est installée pour les vrais utilisateurs.'],
  ['Période de référence', 'La période (par exemple les six mois avant votre arrivée) sur laquelle on mesure la baseline. Elle est la même pour tous les indicateurs.'],
  ['Plan de test', 'Le document d’un projet qui dit ce qu’on va tester, comment, quand, avec qui, et à quelles conditions on commence et on s’arrête.'],
  ['Politique de test (test policy)', 'Un texte court, validé par la direction, qui dit pourquoi l’entreprise teste et ce qu’elle attend du test.'],
  ['Process area', 'Dans le modèle TMMi, un domaine de pratiques (par exemple « planifier le test »). Un niveau est atteint quand tous ses domaines sont en place.'],
  ['Production', 'Le système réel, utilisé par les clients ou les employés.'],
  ['Pyramide de tests', 'Beaucoup de tests rapides et ciblés en bas, peu de tests longs de bout en bout en haut. C’est la forme qui coûte le moins et trouve le plus vite.'],
  ['Régression', 'Un défaut apparu dans ce qui marchait avant, à cause d’un changement. Le test de régression revérifie l’existant après chaque changement.'],
  ['Risque produit, risque projet', 'Produit : ce qui pourrait mal tourner dans le logiciel (une facture fausse). Projet : ce qui pourrait faire dérailler le projet (un fournisseur en retard).'],
  ['Rollback', 'Annuler une mise en production et revenir à la version d’avant.'],
  ['ROI, retour sur investissement', 'Ce qu’une dépense rapporte comparé à ce qu’elle coûte.'],
  ['Smoke test', 'Une vérification rapide que l’essentiel fonctionne, juste après une livraison, avant les tests approfondis.'],
  ['Stratégie de test', 'Les règles de test communes à tous les projets : quels tests, à quel moment, avec quelle profondeur selon le risque.'],
  ['Taux horaire chargé', 'Le coût complet d’une heure de travail d’un rôle pour l’entreprise (salaire, charges, frais), fourni par le contrôle de gestion. Ce n’est pas le salaire d’une personne.'],
  ['Test case, cas de test', 'La description d’une vérification : ce qu’il faut faire, avec quelles données, et le résultat qu’on doit obtenir.'],
  ['Test data, données de test', 'Les données utilisées pour tester (clients fictifs, contrats, montants). Elles ne doivent jamais contenir de données personnelles réelles en clair.'],
  ['Test evidence', 'Les preuves que les tests ont été faits : résultats, captures, rapport de fin de test.'],
  ['TMMi', 'Un modèle reconnu qui décrit la maturité du test en 5 niveaux : 1 Initial (le test dépend des personnes), 2 Managed (géré projet par projet), 3 Defined (une façon commune à toute l’entreprise), 4 Measured, 5 Optimization.'],
  ['UAT', 'La recette par les utilisateurs métier (User Acceptance Testing) : ils vérifient que le logiciel répond à leur besoin avant la mise en production.'],
];
function glossaryHtml(field) {
  return `<input class="glossary-search" placeholder="Chercher un terme" style="${field || ''}width:100%;margin-bottom:6px;">
    <dl class="glossary">${GLOSSARY.map(([t, d]) => `<div data-gl="${escapeHtml((t + ' ' + d).toLowerCase())}"><dt>${escapeHtml(t)}</dt><dd>${escapeHtml(d)}</dd></div>`).join('')}</dl>`;
}
function wireGlossary(root) {
  root.querySelectorAll('.glossary-search').forEach(inp => inp.oninput = () => {
    const term = inp.value.toLowerCase().trim();
    inp.parentElement.querySelectorAll('[data-gl]').forEach(x => { x.style.display = !term || x.dataset.gl.includes(term) ? '' : 'none'; });
  });
}

/* ---------- Mesurer ---------- */
const MEASURE_GUIDE = [
  ['Faire valider la méthode, une seule fois.', 'Demandez à votre responsable ou au contrôle de gestion le taux horaire à utiliser, et fixez la période de référence (par exemple les six mois avant votre arrivée). Notez qui a validé et quand : sans cette validation, ne présentez aucun chiffre.'],
  ['Saisir la baseline, une seule fois.', 'Dans « Avant et après », colonne Baseline : la situation pendant la période de référence. Ce que vous ne savez pas, laissez-le vide, et expliquez-le quand vous présentez.'],
  ['Chaque fin de mois, remplir le calculateur.', 'Les valeurs marquées « catalogue » sont déjà proposées ; vérifiez-les. Complétez les autres avec l’aide de chaque ligne, puis cliquez « Ajouter au cumul ».'],
  ['Comparer avec la baseline.', 'La colonne « Évolution » est verte quand ça va mieux, rouge quand ça va moins bien.'],
  ['Préparer le rapport pour la direction.', 'Trois phrases simples, les risques et ce que vous demandez, puis « Copier le rapport » pour l’envoyer par e-mail ou le coller dans un document.'],
];
/* Aide des champs du calculateur : q ce que c'est, o où le trouver, c conseil, ex exemple. */
const MEASURE_FIELD_HELP = {
  taux: { q: 'Le coût d’une heure de travail de la personne qui aurait fait les tests à la main : la QA, les key users, ou une moyenne des deux. C’est ce nombre qui transforme les heures en francs.',
    o: 'Le contrôle de gestion (coût horaire chargé du rôle), ou le tarif facturé pour une prestation de test, validé par votre hiérarchie. Saisir le nombre seul.',
    c: 'Toujours le taux d’un rôle, jamais le salaire d’une personne ; entre deux taux possibles, prendre le plus bas.', ex: '95 (pour 95 CHF de l’heure).' },
  duree: { q: 'Le temps qu’il faudrait pour exécuter à la main, une fois, tous les tests de régression qui sont automatisés.',
    o: 'Le catalogue le propose quand une exécution d’un test plan « Full regression » a été chronométrée. Sinon : chronométrer 5 à 10 tests, faire la moyenne, multiplier par le nombre de tests automatisés.',
    ex: '20 tests de 9 minutes en moyenne : 20 × 9 = 180 minutes, soit 3 h.' },
  nbreg: { q: 'Combien de fois cette full regression aurait été faite à la main ce mois, sans automatisation : en général une fois par livraison importante.',
    o: 'Le calendrier des mises en production du mois (outil des changements, ou la personne qui organise les mises en production). Les exécutions en plus, permises par l’automatisation, ne comptent pas ici.',
    ex: '2 mises en production ce mois : 2.' },
  maint: { q: 'Les heures passées ce mois à réparer ou adapter les tests automatisés.',
    o: 'Le catalogue additionne le temps de maintenance saisi dans l’onglet Automatisation. Sinon, demandez à la personne qui gère l’automatisation.', ex: '1,5 (pour une heure et demie).' },
  analyse: { q: 'Les heures passées ce mois à lire les résultats automatisés, comprendre les échecs et relancer.',
    o: 'Un relevé simple du temps passé, tenu chaque semaine ; ou une estimation honnête de la personne concernée.', ex: '0,5.' },
  execs: { q: 'Le nombre de fois où les tests de régression automatisés ont tourné ce mois. Ce qui dépasse les full regressions manuelles est de la couverture en plus, comptée sans francs.',
    o: 'Les journaux de l’outil d’automatisation (rapports d’exécution).', ex: '20 (une exécution par jour ouvré).' },
  anom: { q: 'Les défauts graves (Blocker ou Major) trouvés en test ce mois, donc arrêtés avant les clients. Seulement les confirmés : ni rejetés, ni doublons.',
    o: 'Le catalogue les compte dans l’onglet Anomalies (gravité Blocker ou Major, « trouvé en test », détectés ce mois).', ex: '3.' },
  cout: { q: 'Ce que coûte en moyenne un incident en production de gravité comparable : les heures de toutes les personnes mobilisées, multipliées par le taux horaire.',
    o: 'Le temps saisi sur les incidents dans l’outil de support. S’il n’existe pas, estimez-le avec les équipes sur trois ou quatre incidents réels, et dites-le en présentant le chiffre.',
    c: 'Préférez un coût mesuré chez vous à un multiplicateur tiré d’un livre.', ex: '5 personnes × 8 h × 95 CHF = 3 800.' },
};
/* Aide des indicateurs : q en clair, read comment le lire, o où trouver, ex exemple. */
const MEASURE_KPI_HELP = {
  K1: { q: 'La part des mises en production qui ont posé problème : il a fallu annuler (rollback), corriger en urgence (hotfix), ou elles ont causé un incident.',
    read: 'Plus bas, c’est mieux.', o: 'L’outil des changements : les changements fermés de la période et les incidents qui leur sont liés. Sinon, la personne qui organise les mises en production.',
    ex: '4 changements en échec sur 40 mis en production : 10 %.' },
  K2: { q: 'La part des défauts trouvés par le test, avant les clients. Les autres ont été trouvés en production.',
    read: 'Plus haut, c’est mieux : à 90 %, le test arrête 9 défauts sur 10.', o: 'Le catalogue la calcule avec les anomalies du mois (« trouvé en test » ou « trouvé en production »).',
    ex: '18 trouvés en test, 2 en production : 18 sur 20, soit 90 %.' },
  K3: { q: 'La part des mises en production autorisées avec une preuve que les tests ont été faits.',
    read: 'Plus haut, c’est mieux. Avant que la règle existe, la baseline est proche de zéro : c’est normal.', o: 'Le nombre de completion reports figés vient du catalogue ; le nombre de changements autorisés vient de l’outil des changements ou du comité qui les autorise.',
    ex: '12 sur 15 autorisés avec une preuve : 80 %.' },
  K4: { q: 'Le temps qu’il faut pour revérifier tout l’existant. Baseline : à la main. Aujourd’hui : avec l’automatisation, analyse comprise.',
    read: 'Plus bas, c’est mieux.', o: 'Le catalogue la propose depuis la dernière full regression chronométrée ; sinon les journaux de l’outil d’automatisation.',
    ex: '24 h à la main, 3 h automatisée.' },
  K5: { q: 'La part des corrections qui n’ont pas tenu : le défaut a dû être rouvert.',
    read: 'Plus bas, c’est mieux.', o: 'Le catalogue la calcule avec l’historique des anomalies (passages en Reopened et en Ready for retest).',
    ex: '2 rouverts sur 20 corrigés : 10 %.' },
  K6: { q: 'La part des livraisons reçues en test qui étaient prêtes : tous les critères d’entrée remplis.',
    read: 'Plus haut, c’est mieux.', o: 'Le catalogue la calcule avec les livraisons enregistrées dans les test plans.', ex: '3 conformes sur 4 reçues : 75 %.' },
  K7: { q: 'Les jours de test perdus : livraison en retard, environnement de test en panne, données de test manquantes.',
    read: 'Plus bas, c’est mieux.', o: 'Le catalogue additionne les jours perdus des livraisons et du journal d’indisponibilité des environnements.', ex: '2,5 jours.' },
  K8: { q: 'Le nombre de personnes qui testent en dehors de la QA : utilisateurs métier, développeurs, champions.',
    read: 'Plus haut, c’est mieux : la qualité ne dépend pas d’une seule personne.', o: 'Le catalogue compte les testeurs des exécutions du mois, sans les personnes QA listées dans la méthode.', ex: '6 personnes.' },
  K9: { q: 'Le score de la check-list de maturité : Oui = 1, En partie = 0,5, Non = 0, sans les points sans objet.',
    read: 'Plus haut, c’est mieux.', o: 'Le catalogue reprend la dernière évaluation de l’onglet Maturité ; la baseline est la première évaluation.', ex: '19 % au départ, 45 % trois mois plus tard.' },
};

const MEASURE_METHOD_HELP = [
  ['Taux horaire validé', 'Le coût d’une heure de travail du rôle qui aurait fait les tests à la main, fourni par le contrôle de gestion ou votre responsable. À côté, la monnaie (CHF, EUR…).'],
  ['Période de référence', 'La période « avant », par exemple les six mois avant votre arrivée. Toute la baseline est mesurée sur cette période.'],
  ['Validée par, le', 'Le nom de la personne qui a accepté le taux, la période et les règles de calcul (votre responsable, le contrôle de gestion), et la date. Tant que c’est vide, ne présentez aucun chiffre.'],
  ['Personnes QA', 'Les noms des personnes de la QA, séparés par des virgules, écrits comme dans les exécutions. Elles ne sont pas comptées dans l’indicateur « Personnes qui testent hors QA ».'],
];
const MEASURE_RESULT_HELP = [
  ['Heures économisées', 'Le temps qu’il aurait fallu pour faire ces tests à la main, moins le temps passé à entretenir l’automatisation et à lire ses résultats.'],
  ['Économies mesurées', 'Ces heures multipliées par le taux horaire. C’est le chiffre que vous pouvez défendre : il ne compte que ce qui aurait été fait à la main de toute façon.'],
  ['Coûts évités', 'Les défauts graves arrêtés en test, multipliés par le coût moyen d’un incident. C’est une estimation : présentez-la à part, jamais additionnée aux économies.'],
  ['Exécutions automatiques en plus', 'Les fois où les tests automatiques ont tourné en plus de ce qu’on aurait fait à la main. Elles vérifient plus souvent, mais ne comptent pas en francs.'],
  ['Heures négatives', 'Ce mois, l’automatisation a coûté plus de temps qu’elle n’en a fait gagner : il faut revoir quels tests valent la peine d’être automatisés.'],
];
const MEASURE_SECTION_HELP = {
  cumul: 'Chaque mois ajouté avec « Ajouter au cumul » s’affiche ici, avec le total depuis le début. Enregistrer à nouveau un mois déjà présent le remplace.',
  baseline: 'La baseline, c’est la situation de départ, mesurée une seule fois sur la période de référence. La colonne du mois, ce sont les chiffres du mois choisi en haut de la page. Pour un pourcentage, saisissez les deux nombres (par exemple 4 sur 40) : le catalogue calcule le pourcentage. Ce que vous ne connaissez pas, laissez-le vide.',
};
const MEASURE_REPORT_HELP = {
  brief: { q: 'Trois phrases pour la direction : ce qui a changé, ce que ça a rapporté, ce qui reste à faire.', c: 'Sans jargon de test : la direction lit des résultats, pas des processus.', ex: 'Ce mois, 2 mises en production sans incident. L’automatisation a fait gagner 10 heures, soit 950 CHF. Reste à former deux utilisateurs métier.' },
  risks: { q: 'Ce qui peut faire dérailler la qualité, et ce que la direction peut décider pour l’éviter.', c: 'Par exemple : du temps pour les utilisateurs qui testent, un accès à un outil, un arbitrage avec un fournisseur.' },
  next: { q: 'Les deux ou trois actions du mois suivant.', o: 'Les prochaines étapes du plan d’amélioration (onglet Maturité).' },
  tmmi: { q: 'L’état de chaque domaine du niveau 2 de TMMi. Il est proposé par la dernière évaluation de l’onglet Maturité ; vous pouvez le corriger.', c: 'C’est une auto-évaluation, et le rapport doit le dire : une évaluation officielle demande un évaluateur accrédité.' },
};

/* ---------- Maturité ---------- */
const MATURITY_GUIDE = [
  ['Décrire l’entreprise.', 'Choisissez la criticité et la taille (l’aide sous le profil vous guide) : elles changent les points indispensables et le niveau visé.'],
  ['Commencer l’évaluation.', 'Un point à la fois. Lisez « En clair », puis posez la question « Pour vérifier » à la personne concernée, ou cherchez le document.'],
  ['Répondre avec une preuve.', 'Oui seulement si vous avez vu la preuve (un document, un outil, une réunion, un chiffre). Notez la preuve ou le nom de la personne qui vous a répondu.'],
  ['Ne pas savoir n’est pas grave.', 'Laissez le point sans réponse, ou répondez Non et notez « à vérifier avec… ». Un point sans réponse ne compte pas dans le score.'],
  ['Lire le résultat et le plan.', 'Le plan d’amélioration liste ce qu’il faut mettre en place, dans l’ordre. Le bouton à droite d’un point ouvre l’onglet du catalogue qui aide à le faire.'],
  ['Refaire l’évaluation dans trois mois.', '« Nouvelle évaluation » reprend vos réponses : modifiez seulement ce qui a changé, et l’évolution s’affiche.'],
];
const MATURITY_PROFILE_HELP = {
  criticality: [
    ['Une panne peut-elle blesser quelqu’un, mettre une vie en danger, ou une loi impose-t-elle une norme de sécurité ?', 'Sûreté ou réglementé (nucléaire, médical, rail, aviation, automobile).'],
    ['Une panne touche-t-elle beaucoup de clients, de l’argent, ou des obligations légales (factures, paiements, données personnelles) ?', 'Métier critique (banque, assurance, énergie, service public).'],
    ['Une panne gêne-t-elle surtout le travail, sans conséquence grave ni durable ?', 'Standard (logiciel de gestion, e-commerce).'],
    ['Une panne est-elle seulement désagréable, vite corrigée, sans enjeu financier ni de sécurité ?', 'Faible (produit grand public sans enjeu de sécurité, outil interne, site vitrine).'],
  ],
  size: [
    ['Êtes-vous la seule personne chargée de la qualité ?', 'QA seul.'],
    ['Deux à cinq personnes testent, dans une ou deux équipes ?', 'Petite équipe.'],
    ['Cinq à vingt personnes testent, dans plusieurs équipes ou chez des fournisseurs ?', 'Plusieurs équipes.'],
    ['Plus de vingt personnes testent, sur plusieurs sites ou dans un grand programme ?', 'Grande organisation.'],
  ],
};
const MATURITY_ANSWER_HELP = [
  ['Oui', 'Ça existe, c’est à jour, et c’est réellement utilisé. Vous avez vu la preuve.'],
  ['En partie', 'Ça existe, mais c’est incomplet, ancien, ou utilisé seulement par certains.'],
  ['Non', 'Ça n’existe pas, ou personne ne l’utilise.'],
  ['Sans objet', 'Ça ne concerne pas votre entreprise (par exemple : pas d’automatisation prévue, pas d’intelligence artificielle utilisée). Le point ne compte pas.'],
];
const MATURITY_BADGE_HELP = [
  ['indispensable', 'Vital pour votre contexte (criticité, taille) : le point compte double dans le score pondéré et passe en premier dans le plan.'],
  ['optionnel', 'Peut attendre dans votre contexte : le point compte moitié.'],
  ['D’abord', 'Un point à mettre en place en premier selon la check-list, surtout si vous êtes seul pour la qualité.'],
  ['CTFL, CTAL, TMMi…', 'Les références des programmes ISTQB et du modèle TMMi : utiles pour approfondir, pas nécessaires pour répondre.'],
];
/* Les étapes du plan d'amélioration, en clair. */
const MATURITY_PHASE_PLAIN = {
  1: 'Avant de changer quoi que ce soit, noter les chiffres de départ, pour pouvoir prouver les progrès ensuite.',
  2: 'Ranger au même endroit les règles, les modèles, les tests et les défauts, et écrire pourquoi l’entreprise teste.',
  3: 'Donner aux projets des modèles prêts à l’emploi : plan de test, conditions pour commencer et pour finir, rapports.',
  4: 'Faire suivre à tous les défauts le même parcours, du signalement à la fermeture.',
  5: 'Lister avec le métier ce qui pourrait mal tourner, tester plus là où ce serait grave, et fixer la règle pour autoriser une mise en production.',
  6: 'Faire en sorte que les environnements et les données de test soient disponibles quand on en a besoin.',
  7: 'Si des tests sont automatisés : vérifier qu’ils valent ce qu’ils coûtent et qu’ils ne dépendent pas d’une seule personne.',
  8: 'Présenter les résultats chiffrés à la direction, faire le bilan, et prévoir la prochaine évaluation.',
  9: 'Les mois suivants : installer une à une les pratiques plus avancées.',
};
const MATURITY_RESULT_HELP = {
  scores: 'Le score de la check-list suit la règle du plan : Oui = 1, En partie = 0,5, Non = 0, sans les points sans objet ni ceux sans réponse. Le score pondéré compte double les points indispensables pour votre contexte et moitié les points optionnels : c’est le plus parlant pour vous.',
  levels: [
    ['Niveau 1 · Initial', 'Le test dépend des personnes : il se fait, mais chacun à sa façon, et sans méthode commune.'],
    ['Niveau 2 · Managed', 'Le test est géré projet par projet : il est planifié, suivi, conçu avec méthode, sur des environnements maîtrisés.'],
    ['Niveau 3 · Defined', 'Une façon de tester commune à toute l’entreprise, présente dès le début des projets, avec des rôles, une formation, des revues et du test non fonctionnel.'],
  ],
  areas: {
    'Test Policy and Strategy': 'Pourquoi et comment l’entreprise teste, par écrit.',
    'Test Planning': 'Chaque projet planifie ses tests : périmètre, risques, critères, calendrier.',
    'Test Monitoring and Control': 'On suit l’avancement des tests avec des chiffres, et on agit quand ça dérape.',
    'Test Design and Execution': 'Les tests sont conçus avec méthode, exécutés, et les défauts suivis jusqu’à leur correction.',
    'Test Environment': 'Les environnements et les données de test sont décrits, disponibles et maîtrisés.',
    'Test Organization': 'Les rôles du test sont clairs, avec un regard indépendant quand le risque le demande.',
    'Test Training Program': 'Les compétences de test sont connues et développées.',
    'Test Lifecycle and Integration': 'Le test est intégré au développement dès le début et jusqu’à la mise en production.',
    'Non-functional Testing': 'La rapidité, la sécurité, la fiabilité sont testées quand c’est nécessaire.',
    'Peer Reviews': 'Les documents et le code sont relus par d’autres, selon une méthode.',
  },
};

/* Chaque point de la check-list, en clair, avec une question pour vérifier. */
const MATURITY_PLAIN = {
  'AU-01': ['Un document court, validé par la direction, qui dit pourquoi l’entreprise teste ses logiciels et ce qu’elle en attend.', 'Existe-t-il un tel document, et les équipes le connaissent-elles ?'],
  'AU-02': ['Des règles de test communes à tous les projets : quels tests on fait, à quel moment, et quand on considère que c’est assez testé.', 'Les règles de test du dernier projet viennent-elles d’un document commun, ou chacun a-t-il fait à sa façon ?'],
  'AU-03': ['On sait qui teste quoi : les développeurs testent leur code, le métier valide que ça répond au besoin, la QA organise et vérifie l’ensemble.', 'Posez la question « qui teste quoi ? » à trois personnes : si les réponses diffèrent, c’est En partie ou Non.'],
  'AU-04': ['On connaît les personnes concernées par la qualité (direction, chefs de projet, métier, développeurs, exploitation, fournisseurs) et ce que chacune attend.', 'Existe-t-il une liste de ces personnes et de leurs attentes, utilisée pour envoyer les rapports ?'],
  'AU-05': ['Plus un changement est risqué, plus il faut que quelqu’un d’autre que son auteur le vérifie.', 'Pour un changement important récent, qui l’a testé ? Si c’est seulement la personne qui l’a fait, c’est Non.'],
  'AU-06': ['Un tableau qui montre qui sait tester quoi, et ce qu’il faut apprendre pour combler les manques.', 'Existe-t-il un tableau des compétences de test, avec un plan de formation ?'],
  'AU-07': ['Chaque projet ou version a un document qui dit ce qu’on va tester, comment, quand, et à quelles conditions on commence et on s’arrête.', 'Demandez le plan de test des deux dernières versions.'],
  'AU-08': ['Les objectifs de test sont précis et vérifiables, par exemple « tous les processus critiques testés avant le 15 mars », pas vagues comme « bien tester ».', 'Relisez les objectifs du dernier plan de test : peut-on dire objectivement s’ils sont atteints ?'],
  'AU-09': ['On suit l’avancement des tests avec des chiffres, et on prend des décisions quand ça dérape.', 'Trouvez un exemple récent où un retard de test a conduit à une décision : report, renfort, périmètre réduit.'],
  'AU-10': ['À la fin d’un projet, on fait un bilan écrit, on note les leçons, et on range les tests pour pouvoir les réutiliser.', 'Demandez le bilan de fin de test de la dernière version, et où sont rangés ses tests.'],
  'AU-11': ['On peut suivre le fil entre un besoin, les tests qui le vérifient, leurs résultats et les défauts trouvés.', 'Prenez un besoin au hasard : retrouvez-vous ses tests et leurs derniers résultats en quelques minutes ?'],
  'AU-12': ['Tous les tests, les données de test et la description des environnements sont rangés à un seul endroit, avec leurs versions.', 'Où sont les tests ? S’ils sont dans des fichiers dispersés sur des postes, c’est Non.'],
  'AU-13': ['On relit les besoins avant de développer : corriger une erreur à ce moment coûte beaucoup moins cher qu’après.', 'Demandez un compte rendu de relecture des besoins d’un projet récent.'],
  'AU-14': ['Les relectures suivent une méthode connue (qui relit, comment, ce qu’on note), plus ou moins formelle selon l’enjeu.', 'Existe-t-il une façon décrite de faire les relectures, ou chacun relit-il comme il veut ?'],
  'AU-15': ['Un outil vérifie automatiquement le code à chaque construction du logiciel et signale les erreurs probables ; on traite ses alertes.', 'Demandez aux développeurs le dernier rapport de leur outil d’analyse du code, et ce qui a été fait des alertes graves.'],
  'AU-16': ['Chaque défaut suit le même parcours (signalé, trié, corrigé, revérifié, fermé), avec un responsable à chaque étape.', 'Prenez trois défauts récents : ont-ils suivi les mêmes étapes, dans le même outil ?'],
  'AU-17': ['Un défaut signalé contient tout ce qu’il faut pour le reproduire et décider : où, quand, comment, ce qu’on attendait, ce qu’on a obtenu, sa gravité.', 'Lisez cinq défauts récents : un développeur pourrait-il les reproduire sans poser de question ?'],
  'AU-18': ['Les défauts sont gérés avec les mêmes règles par tout le monde : métier, exploitation, fournisseurs.', 'Le métier et les fournisseurs utilisent-ils le même outil, ou au moins les mêmes règles de priorité ?'],
  'AU-19': ['On regarde régulièrement d’où viennent les défauts (besoin mal écrit, erreur de code, paramétrage…) pour les éviter à l’avenir.', 'Existe-t-il une analyse des causes des défauts des derniers mois, avec des actions ?'],
  'AU-20': ['Chaque environnement de test a une fiche : à quoi il sert, qui s’en occupe, en quoi il diffère de la production.', 'Demandez la fiche de l’environnement de test principal.'],
  'AU-21': ['Les données utilisées pour tester ressemblent aux vraies, mais ne contiennent pas de données personnelles réelles en clair.', 'Trouve-t-on de vrais noms de clients ou de vraies adresses dans les environnements de test ? Si oui, c’est Non.'],
  'AU-22': ['On sait toujours quelle version du logiciel et quelle version des tests ont été utilisées.', 'Pour un défaut récent, retrouvez-vous la version exacte du logiciel testée ?'],
  'AU-23': ['Chaque chiffre suivi répond à une vraie question, par exemple « nos mises en production sont-elles plus sûres ? », et ne compte pas juste l’activité.', 'Pour chaque chiffre du dernier rapport : à quelle question répond-il, et quelle décision permet-il ?'],
  'AU-24': ['La direction, les chefs de projet et les techniciens reçoivent des rapports différents, adaptés à ce qu’ils ont à décider.', 'Comparez deux rapports du même mois, l’un pour la direction, l’autre pour l’équipe.'],
  'AU-25': ['On estime ce que coûte la qualité : prévenir, vérifier, et réparer les défauts trouvés avant ou après la mise en production.', 'Existe-t-il une estimation chiffrée de ce que coûtent les défauts trouvés en production ?'],
  'AU-26': ['On suit quelques chiffres sur les mises en production, dont la part de celles qui posent problème.', 'Connaît-on la part des mises en production qui ont dû être annulées ou corrigées en urgence ?'],
  'AU-27': ['On a la liste des outils de test, avec leur usage, leur responsable et leur coût.', 'Demandez la liste des outils de test et le nom du responsable de chacun.'],
  'AU-28': ['Chaque outil a montré qu’il rapporte plus qu’il ne coûte.', 'Pour l’outil de test le plus cher, sait-on ce qu’il rapporte ?'],
  'AU-29': ['Les améliorations suivent une démarche : constater, choisir quoi améliorer, agir, mesurer le résultat.', 'Les améliorations de la QA sont-elles décidées après un diagnostic comme celui-ci ?'],
  'AU-30': ['On évalue la maturité du test avec un modèle reconnu (TMMi ou TPI NEXT), et on recommence pour mesurer les progrès.', 'Une évaluation a-t-elle déjà été faite ? Celle que vous remplissez compte comme une première.'],
  'AU-31': ['On fait régulièrement le point sur ce qui marche et ce qui coince, et on mène les actions décidées jusqu’au bout.', 'Les actions décidées à la dernière réunion de bilan ont-elles été faites ?'],
  'AU-32': ['On a dessiné le chemin d’un changement, de la demande à la mise en production, pour voir où le temps se perd.', 'Existe-t-il un schéma de ce chemin, avec les temps d’attente ?'],
  'ST-01': ['La façon de tester est choisie selon l’entreprise : son domaine, ses risques, sa façon de développer, ses contraintes.', 'La façon de tester a-t-elle été réfléchie pour cette entreprise, ou copiée d’ailleurs ?'],
  'ST-02': ['On a listé avec les utilisateurs métier ce qui pourrait mal tourner dans le logiciel.', 'Existe-t-il une liste des risques faite avec le métier ? Le catalogue la tient dans l’onglet Risques.'],
  'ST-03': ['Chaque risque est noté selon sa probabilité et la gravité de ses conséquences, sur une échelle simple, par exemple de 1 à 3.', 'Les risques de la liste ont-ils une note ?'],
  'ST-04': ['On teste plus, et mieux, là où le risque est le plus élevé.', 'Les zones les plus risquées ont-elles réellement plus de tests ?'],
  'ST-05': ['On suit aussi les risques du projet lui-même : fournisseurs en retard, environnements indisponibles, personnes absentes.', 'Le plan de test liste-t-il ces risques, avec qui s’en occupe ?'],
  'ST-06': ['On a défini les étapes de test (chaque morceau, leur assemblage, le système complet, la validation par le métier) et qui fait chacune.', 'Pour un projet, sait-on qui fait chaque étape de test, et sur quel environnement ?'],
  'ST-07': ['On a choisi quels genres de tests faire : vérifier les fonctions, mais aussi la rapidité, la sécurité, etc.', 'Des tests de rapidité ou de sécurité sont-ils prévus quand c’est nécessaire ?'],
  'ST-08': ['Pour les qualités les plus importantes (rapidité, sécurité, fiabilité, compatibilité, facilité d’usage), on sait qui les teste, avec quoi et selon quels critères.', 'Pour la qualité la plus importante de votre logiciel, qui la teste, et comment ?'],
  'ST-09': ['On commence à tester dès le début : relecture des besoins, critères d’acceptation, tests écrits avant le code.', 'Les testeurs participent-ils à l’écriture des besoins, ou n’arrivent-ils qu’à la fin ?'],
  'ST-10': ['Quand un fournisseur livre une mise à jour ou un correctif, on analyse ce qui est touché et on reteste en conséquence.', 'Pour la dernière mise à jour d’un logiciel acheté, qu’a-t-on retesté, et pourquoi ?'],
  'ST-11': ['On a écrit à l’avance quand on peut commencer à tester et quand on peut s’arrêter, et on s’en sert pour décider d’une mise en production.', 'Existe-t-il des critères écrits pour dire « c’est prêt pour la production » ?'],
  'ST-12': ['On estime le temps de test avec une méthode, et on le compare ensuite à la réalité.', 'Comment a été estimé le temps de test du dernier projet, et a-t-il été respecté ?'],
  'ST-13': ['Les tests sont classés par importance : si le temps manque, on fait d’abord les plus importants.', 'Si vous n’aviez qu’un jour pour tester, sauriez-vous quels tests faire en premier ?'],
  'ST-14': ['On sait quelle proportion de tests rapides et ciblés, et de tests longs de bout en bout, on veut avoir (la « pyramide de tests »).', 'Sait-on combien de tests sont de chaque sorte, et quelle répartition on vise ?'],
  'ST-15': ['Pour revérifier ce qui marchait déjà, on choisit les tests à rejouer selon ce qui a changé et selon le risque.', 'Comment choisit-on les tests à rejouer après un changement ?'],
  'ST-16': ['Chacun teste ce qu’il connaît le mieux ; la QA organise et outille, plutôt que de tout tester seule.', 'La QA fait-elle tous les tests, ou les développeurs et le métier testent-ils aussi ?'],
  'ST-17': ['Pour écrire les tests, on utilise des méthodes reconnues selon la règle à vérifier, par exemple tester juste au-dessous et juste au-dessus d’un seuil.', 'Pour une règle de calcul importante, les tests vérifient-ils les cas limites ?'],
  'ST-18': ['Pour les zones les plus critiques, on utilise des méthodes plus poussées : combinaisons, scénarios complets, etc.', 'Les zones les plus critiques ont-elles des tests conçus avec une méthode avancée ?'],
  'ST-19': ['On organise aussi des sessions où un testeur explore librement le logiciel, pendant un temps donné et avec un objectif, pour trouver ce que les tests écrits ne cherchent pas.', 'Des sessions de test libre, avec un objectif et un compte rendu, ont-elles lieu ?'],
  'ST-20': ['Pour le logiciel développé en interne, on mesure quelle part du code les tests font réellement fonctionner.', 'Les développeurs connaissent-ils le pourcentage de code couvert par leurs tests ?'],
  'ST-21': ['Chaque besoin écrit avec le métier est accompagné de critères vérifiables qui disent quand il est satisfait.', 'Lisez trois besoins récents : ont-ils des critères d’acceptation ?'],
  'ST-22': ['On a choisi le niveau de détail des tests : de simples idées à vérifier, ou des étapes précises avec données et résultats attendus.', 'Les tests écrits sont-ils assez détaillés pour quelqu’un qui ne connaît pas le logiciel ?'],
  'ST-23': ['Les tests eux-mêmes sont de bonne qualité : justes, faisables, clairs, reliés à un besoin.', 'Faites relire cinq tests par quelqu’un d’autre : les comprend-il, et sont-ils corrects ?'],
  'ST-24': ['Pour chaque test, on sait d’où vient le résultat attendu : le besoin, une règle métier, un expert.', 'Pour un test pris au hasard, peut-on justifier son résultat attendu ?'],
  'ST-25': ['Les données nécessaires à chaque test sont décrites avec le test, y compris combien de temps elles restent valables.', 'Un test échoue-t-il parfois parce qu’une donnée a expiré ou a déjà été utilisée ?'],
  'ST-26': ['Les tests disent ce qu’il faut préparer avant, dans quel ordre les faire, et comment remettre le système en état après.', 'Quelqu’un peut-il rejouer un test sans aide, grâce aux préparatifs décrits ?'],
  'ST-27': ['Après chaque correction, on vérifie qu’elle marche, puis on revérifie ce qui l’entoure : une correction peut casser autre chose.', 'Après la dernière correction, a-t-on aussi retesté ce qui était autour ?'],
  'ST-28': ['Les rapports de test aident à décider : avancement, ce qui est couvert, risques restants, défauts encore ouverts.', 'Le dernier rapport de test permettait-il de dire « on peut mettre en production » ou « pas encore » ?'],
  'AR-01': ['On a un schéma des applications et de leurs échanges, qui montre les points de contact à tester.', 'Existe-t-il un schéma à jour des applications et de leurs interfaces ?'],
  'AR-02': ['Quand on conçoit un système, on vérifie qu’il sera facile à tester : accès, journaux, données.', 'Les testeurs participent-ils aux revues de conception technique ?'],
  'AR-03': ['On sait quel test se fait sur quel environnement, et à quel point chacun ressemble à la production.', 'Pour chaque environnement : à quoi sert-il, et quelles différences a-t-il avec la production ?'],
  'AR-04': ['Les environnements de test peuvent être recréés à l’identique, idéalement automatiquement.', 'Combien de temps faut-il pour recréer un environnement de test propre ?'],
  'AR-05': ['Les environnements partagés ont un responsable et un planning, pour que personne ne gêne les tests des autres.', 'Un environnement a-t-il récemment été modifié sans prévenir, pendant des tests ?'],
  'AR-06': ['Quand un système voisin n’est pas disponible, on le remplace par un simulateur pour pouvoir tester quand même.', 'Des tests restent-ils bloqués en attendant le système d’un fournisseur ?'],
  'AR-07': ['Les échanges entre systèmes sont vérifiés directement, sans attendre les tests complets de bout en bout.', 'Les interfaces entre applications ont-elles leurs propres tests ?'],
  'AR-08': ['Les données de test sont fournies par une méthode établie : création, extraction, masquage des données personnelles, mise à jour.', 'Comment obtient-on des données de test, et en combien de temps ?'],
  'AR-09': ['Les environnements de test sont protégés comme la production : accès, comptes, copies de données.', 'Qui a accès aux environnements de test, et contiennent-ils des données sensibles ?'],
  'AR-10': ['À chaque étape de la mise en production, des tests vérifient automatiquement la qualité et bloquent la suite si un seuil n’est pas atteint.', 'Une mise en production peut-elle être arrêtée automatiquement par un test qui échoue ?'],
  'AR-11': ['Chaque modification du code est relue et vérifiée avant d’être intégrée.', 'Les développeurs relisent-ils systématiquement le code des autres ?'],
  'AR-12': ['Une mise en production prévoit comment revenir en arrière si ça se passe mal, ou comment l’activer progressivement.', 'Pour la dernière mise en production, existait-il un plan pour revenir en arrière ?'],
  'AR-13': ['Le logiciel en production est surveillé, par exemple par des tests automatiques qui vérifient régulièrement qu’il fonctionne.', 'Apprenez-vous les pannes par la surveillance, ou par les clients ?'],
  'AR-14': ['Les tests de charge reproduisent l’usage réel : combien d’utilisateurs, ce qu’ils font, à quelle heure.', 'Les tests de rapidité s’appuient-ils sur des chiffres d’usage réels ?'],
  'AR-15': ['Les tests, les scripts et la configuration des environnements ont des versions alignées sur celles du logiciel.', 'Retrouve-t-on la version des tests qui correspond à une ancienne version du logiciel ?'],
  'AR-16': ['Les outils des besoins, des tests, des défauts et de la mise en production partagent les mêmes références.', 'Un défaut renvoie-t-il au test et au besoin concernés, sans ressaisie ?'],
  'AR-17': ['On garde seulement les outils qu’on peut réellement entretenir.', 'Y a-t-il des outils de test que plus personne n’utilise ou ne sait administrer ?'],
  'AT-01': ['On a écrit pourquoi on automatise des tests (les faire exécuter par un logiciel), sur quoi, avec quels outils et quels environnements.', 'Existe-t-il un document qui dit ce que l’automatisation doit apporter ? Sans automatisation prévue, répondez Sans objet.'],
  'AT-02': ['Avant d’automatiser, on vérifie que les conditions sont réunies : un logiciel testable, une stratégie, des outils adaptés.', 'Les conditions de réussite ont-elles été vérifiées avant de commencer ?'],
  'AT-03': ['Avant d’investir, on a réfléchi au coût de départ, à la durée de vie du logiciel et au coût d’entretien.', 'La décision d’automatiser a-t-elle tenu compte de la durée de vie du logiciel ?'],
  'AT-04': ['On a calculé ce que l’automatisation fait gagner par rapport à ce qu’elle coûte, et à partir de quand elle devient rentable.', 'Sait-on à partir de quand l’automatisation est rentable ? L’onglet Mesurer aide à le calculer.'],
  'AT-05': ['Tout le monde sait ce qu’on peut en attendre, et ce qui peut mal tourner : attentes trop fortes, entretien sous-estimé.', 'La direction a-t-elle été informée des limites et des risques de l’automatisation ?'],
  'AT-06': ['On a choisi de faire en interne, d’acheter une solution ou de sous-traiter, en connaissant le coût total, licences comprises.', 'Le choix a-t-il comparé le coût total des différentes options ?'],
  'AT-07': ['L’automatisation ne repose pas sur une seule personne : elle est documentée et relue par d’autres.', 'Si la personne qui gère l’automatisation partait demain, quelqu’un pourrait-il reprendre ?'],
  'AT-08': ['La direction et les équipes ont validé un plan d’automatisation, avec des étapes et les bénéfices attendus.', 'Existe-t-il un plan d’automatisation validé par la direction ?'],
  'AT-09': ['On connaît la répartition actuelle des tests automatisés, et la forme qu’on veut atteindre.', 'Sait-on combien de tests automatisés sont rapides et ciblés, et combien passent par les écrans ?'],
  'AT-10': ['Avant d’automatiser un test, on vérifie avec une grille qu’il en vaut la peine : faisable, rentable, joué souvent, répétable, facile à entretenir.', 'Comment a-t-on choisi les tests à automatiser ? L’onglet Automatisation contient la grille.'],
  'AT-11': ['On automatise d’abord ce qui est impossible à la main : gros volumes, nombreuses combinaisons, charge.', 'Des tests de volume ou de charge sont-ils automatisés ?'],
  'AT-12': ['On assume ce qui reste manuel (jugement visuel, exploration), pour une raison écrite.', 'Sait-on pourquoi certains tests restent manuels ?'],
  'AT-13': ['On commence par automatiser les tests de régression, après avoir vérifié à la main qu’ils sont justes.', 'Les tests ont-ils été vérifiés à la main avant d’être automatisés ?'],
  'AT-14': ['Le test qui a confirmé la correction d’un défaut rejoint les tests rejoués régulièrement : un défaut corrigé peut revenir.', 'Après la correction d’un défaut important, son test est-il rejoué ensuite ?'],
  'AT-15': ['L’outil d’automatisation a été choisi après une comparaison et un essai.', 'Plusieurs outils ont-ils été comparés et essayés avant de choisir ?'],
  'AT-16': ['L’organisation technique de l’automatisation sépare bien les tests de la façon de piloter le logiciel.', 'Un changement d’écran oblige-t-il à modifier beaucoup de tests ? Si oui, c’est Non.'],
  'AT-17': ['Le code des tests est rangé en couches simples : les tests, la logique métier, les outils de base.', 'Demandez à la personne qui automatise comment le code des tests est organisé.'],
  'AT-18': ['On a choisi une façon d’écrire les tests automatisés (par mots-clés, par données…) ; un simple enregistrement de clics ne tient pas dans la durée.', 'Les tests automatisés sont-ils de simples enregistrements de clics ?'],
  'AT-19': ['Le code des tests suit de bonnes pratiques qui évitent de corriger la même chose à plusieurs endroits.', 'Un changement d’écran se corrige-t-il à un seul endroit ?'],
  'AT-20': ['Un essai sur un petit périmètre a précédé la généralisation.', 'L’automatisation a-t-elle commencé par un essai mesuré ?'],
  'AT-21': ['L’installation et les mises à jour de l’outil d’automatisation sont préparées : serveurs, réseau, journaux.', 'La dernière mise à jour de l’outil s’est-elle faite sans casser les tests ?'],
  'AT-22': ['Les tests automatisés s’adaptent à chaque environnement (adresses, comptes, données) sans être réécrits.', 'Le même test automatisé peut-il tourner sur deux environnements différents ?'],
  'AT-23': ['Les tests automatisés créent eux-mêmes les données dont ils ont besoin.', 'Des tests automatisés échouent-ils parce qu’une donnée a disparu ?'],
  'AT-24': ['Le code des tests automatisés est relu et vérifié, comme celui du logiciel.', 'Le code des tests est-il relu par quelqu’un d’autre ?'],
  'AT-25': ['Les tests rapides tournent à chaque changement ; les tests complets tournent à part, par exemple la nuit.', 'Quand, et à quelle fréquence, les tests automatisés tournent-ils ?'],
  'AT-26': ['Quand un test automatisé échoue, on a de quoi comprendre pourquoi : heure, captures, messages.', 'Combien de temps faut-il pour comprendre pourquoi un test automatisé a échoué ?'],
  'AT-27': ['On suit les chiffres de l’automatisation : réussites, échecs, durée, ce qui est couvert.', 'Existe-t-il un tableau de bord des tests automatisés ?'],
  'AT-28': ['Les résultats de l’automatisation sont présentés à chaque public, et gardés pour voir l’évolution.', 'Les résultats sont-ils archivés et partagés ?'],
  'AT-29': ['On vérifie que les tests automatisés disent vrai : un test qui réussit alors que le logiciel est faux est pire que pas de test.', 'A-t-on déjà vérifié qu’un test automatisé échoue bien quand il le doit ?'],
  'AT-30': ['Les tests qui réussissent ou échouent au hasard sont mis de côté jusqu’à leur correction.', 'Y a-t-il des tests automatisés dont on ignore les échecs « parce qu’ils échouent souvent » ?'],
  'AT-31': ['On vérifie que l’entretien de l’automatisation coûte moins que le temps qu’elle fait gagner.', 'Compare-t-on les heures d’entretien au temps gagné ? L’onglet Automatisation le signale.'],
  'AT-32': ['L’automatisation est régulièrement nettoyée et améliorée, comme tout logiciel.', 'Quand l’automatisation a-t-elle été remaniée pour la dernière fois ?'],
  'AT-33': ['Si on utilise l’intelligence artificielle (comme ChatGPT ou Copilot) pour tester, son usage est encadré par des règles écrites.', 'Existe-t-il des règles sur l’usage de l’IA pour le test ? Si personne n’utilise l’IA, répondez Sans objet.'],
  'AT-34': ['Tout ce que produit l’IA est vérifié par une personne : elle peut se tromper avec aplomb.', 'Les tests produits par l’IA sont-ils relus avant d’être utilisés ?'],
  'AT-35': ['Aucune donnée confidentielle n’est envoyée à un outil d’IA non autorisé.', 'Des données de clients ont-elles pu être copiées dans un outil d’IA public ?'],
};
