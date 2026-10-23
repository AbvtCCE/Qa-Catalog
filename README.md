# Catalogue de tests

Outil web de la QA pour préparer et organiser les tests : test cases, test suites, test plans, projets (campagnes), anomalies, test environments, test data, testeurs et rapports.

Ce document permet à une autre personne de reprendre l'outil et sert de base à sa validation par l'informatique (hébergement, accès, données).

- Application : https://abvtcce.github.io/Qa-Catalog/
- Code (public) : https://github.com/AbvtCCE/Qa-Catalog
- Données (privé) : https://github.com/AbvtCCE/Qa-Catalog-Data

## Architecture

L'application est un site statique : HTML, CSS et JavaScript, sans framework, sans dépendance externe, sans étape de build et sans serveur applicatif.

| Élément | Où | Rôle |
|---|---|---|
| Code | dépôt public `Qa-Catalog`, publié par GitHub Pages depuis `main` | Pages `login.html`, `index.html` (application), `admin.html` (utilisateurs) |
| Données | dépôt privé `Qa-Catalog-Data`, fichier `data.json` | Comptes et contenu du catalogue |
| Copie locale | navigateur de chaque utilisateur (IndexedDB et localStorage) | Travail hors ligne, modifications en attente, jeton GitHub, session |

Le navigateur lit et écrit `data.json` directement par l'API GitHub, avec le jeton personnel de l'utilisateur. Chaque enregistrement crée un commit dans le dépôt des données.

### Fichiers

| Fichier | Contenu |
|---|---|
| `assets/js/config.js` | Dépôt des données (owner, repo, branch, chemin), clés de stockage local |
| `assets/js/github-api.js` | Lecture et écriture de `data.json` par l'API GitHub, cache hors ligne |
| `assets/js/session.js` | Session, garde d'accès des pages (session + jeton requis) |
| `assets/js/permissions.js` | Rôles et droits (affichage) |
| `assets/js/crypto-utils.js` | Empreinte des mots de passe |
| `assets/js/app/data-model.js` | Listes de référence (types, sévérités, états) et état de l'application |
| `assets/js/app/helpers.js` | Fonctions utilitaires |
| `assets/js/app/persistence.js` | Chargement, sauvegarde locale, synchronisation et fusion avec GitHub, migrations de données |
| `assets/js/app/renderers.js` | Tous les écrans |
| `assets/js/app/reports-export.js` | Exports, checklist testeur, spec imprimable |
| `assets/js/app/free-report.js` | Générateur de rapports |
| `assets/js/app/maturity-data.js` | Les 112 points de la check-list QA d’après l’ISTQB (généré à partir de la page de la check-list, ne pas modifier à la main) |
| `assets/js/app/maturity.js` | Onglet Maturité : profil (criticité, taille), questionnaire, scores, niveau indicatif d’après TMMi, plan d’amélioration par étapes, réévaluations |
| `assets/js/app/measure.js` | Onglet Mesurer : méthode (D4), calculateur des économies et des coûts évités, cumul mensuel, avant et après des 9 indicateurs, rapport mensuel pour la direction ; résumé sur le tableau de bord |
| `assets/js/app/automation.js` | Onglet Automatisation : objectifs, répartition, inventaire (exécutions, durée à la main, maintenance, signal d’alarme, décision), candidats et grille, règles de maintenance |
| `assets/js/app/test-env-data.js` | Journal d’indisponibilité des test environments, fiche copiable, circuit des test data requests, catalogue des test data sets |
| `assets/js/app/risks.js` | Onglet Risques : product risk analysis (likelihood × impact), priorité des test cases dérivée du risque, sélection des regression tests par le risque |
| `assets/js/app/weekly-report.js` | Weekly test progress report d'un projet (calcul, aperçu, copie pour Confluence, .md) |
| `assets/js/app/completion-report.js` | Dans chaque test plan : référence du changement, livraisons et entry criteria, exit criteria (et leurs adaptations), test completion report figé pour le CAB |
| `assets/js/app/ui-nav.js`, `main.js` | Navigation, fenêtres, démarrage |

L'ordre des `<script>` dans `index.html` compte : les fichiers partagent des variables globales.

## Accès et sécurité

La vraie protection des données est le **dépôt privé** : sans jeton GitHub ayant accès à `Qa-Catalog-Data`, aucune donnée n'est lisible.

Pour donner accès à quelqu'un :

1. L'inviter sur `Qa-Catalog-Data` : Settings > Collaborators. Sur un dépôt de compte personnel, un collaborateur a toujours le droit d'écriture.
2. La personne crée un jeton *fine-grained* : Repository access > Only select repositories > `Qa-Catalog-Data`, permission *Contents : Read and write*. Un jeton *classic* avec le scope `repo` fonctionne aussi.
3. Créer son compte dans l'application : Administration > Créer un utilisateur, avec un rôle.
4. À la première connexion, elle saisit identifiant, mot de passe et jeton. Le jeton reste enregistré dans son navigateur.

Retirer l'accès : retirer la personne des collaborateurs du dépôt privé (le jeton devient inutile), puis supprimer son compte dans l'Administration.

Limites, à connaître :

- Les **rôles** (QA Manager, Fonctionnel, Testeur) ne font que masquer des boutons dans le navigateur. Toute personne qui a un jeton en écriture peut techniquement modifier n'importe quelle donnée.
- Les **mots de passe** de l'application identifient l'utilisateur ; ils ne protègent pas les données. Leur empreinte (SHA-256 avec un sel fixe) est stockée dans `data.json`.
- Le jeton est stocké en clair dans le localStorage du navigateur. Sur un poste partagé, l'effacer : Administration > Effacer (QA Manager), ou effacer les données du site dans le navigateur.

## Adapter à son entreprise

L'outil n'impose aucun outil tiers. Dans l'onglet Environnements, la carte « Outils reliés » configure, pour chaque usage, le nom de l'outil et un modèle de lien où `{ref}` est remplacé par la référence :

| Usage | Exemples |
|---|---|
| Exigences et tickets (liés aux test cases) | Jira, Azure DevOps, Redmine, GitLab |
| Changements (CAB), liés aux test plans et aux defects | ServiceNow, Jira Service Management, GLPI, iTop |
| Defects, si ceux qui corrigent travaillent dans un autre outil | Jira, Azure DevOps, Mantis |
| Automatisation des tests | Tosca, Playwright, Cypress, Robot Framework |

Sans configuration, les références restent du texte et les libellés sont neutres (« Tickets », « Référence du changement »).

## Synchronisation

- **Lecture** : au chargement, la version GitHub fait foi, sauf s'il reste des modifications locales non envoyées ; celles-ci priment toujours.
- **Écriture** : chaque modification est enregistrée localement, puis envoyée à GitHub après 1,5 s.
- **Écritures concurrentes** : si quelqu'un d'autre a écrit depuis la dernière synchronisation, l'application fusionne au lieu d'écraser. La fusion compare la dernière version commune, la version locale et la version GitHub, entité par entité (test case, anomalie, plan…) :
  - modifiée d'un seul côté : ce côté gagne, suppression comprise ;
  - modifiée des deux côtés : la version locale gagne, et un message signale le conflit ;
  - modifiée d'un côté et supprimée de l'autre : la modification gagne.
- **Hors ligne** : l'application repart de la copie locale ; les modifications partent à la reconnexion.

## Modèle de données

`data.json` contient :

```
{
  schemaVersion, updatedAt, updatedBy,
  users: [ { username, role, passwordHash, createdAt, mustChangePassword } ],
  state: { … }
}
```

| Collection de `state` | Champs principaux |
|---|---|
| `testCases` | id, title, steps[{type, action, expected, requiresScreenshot, blockId}], environmentIds, divisionIds, types, crud, minLevelId, estimatedTime, ready, automationStatus (manual, candidate, automated, flaky, retired ; automated et toAutomate en sont dérivés), automationRef, automationGrid, automationDecision, automationReviewedAt, automationExecsPerMonth, manualReason, maintenanceLog[{id, date, minutes, note, by}], isInterface, jiraTickets[{key, summary}], linkedCaseIds, screenshots, sortOrder |
| `testSuites` | id, title, testCaseIds, divisionIds |
| `testPlans` | id, title, items[{type: suite ou case, id}], testCaseIds, divisionIds, changeNumber (ServiceNow), riskLevel (low, medium, high), kind (change, smoke, targeted, full), deliveries[{id, version, receivedAt, checks{6 entry criteria}, decision (accepted, accepted_with_reserve, refused), lostDays, note}], exitAdaptations{criterion : {text, reason}}, completionReports[{id, reportDate, deliveryId, regressionRunId, priorityConfirmed, manualStatus, untestedReason, decisions{anomalyId : texte}, risks, recommendation, recommendationText, uatName, uatDate, evidenceLinks, frozenAt, frozenBy, snapshot{html, markdown, changeNumber, riskLevel, recommendation, criteria}}] |
| `projects` | id, name, startDate, endDate, planIds, weeklyNotes{lundi AAAA-MM-JJ : {status, reason, blockers, lostDays, risks, next}} |
| `anomalies` | defect management (modèle du plan, S4) : id, title, state (new, triaged, in_fix, ready_for_retest, reopened, deferred, closed, rejected ; transitions dans `ANOMALY_TRANSITIONS`), severity (Blocker, Major, Minor, Cosmetic), priority (p1 à p4, fixée au triage), type, assignee, detectedAt ; defect report : environmentId, testedVersion, changeRef, externalRef, stepsToReproduce, expectedResult, testOracle, actualResult, evidence, testDataUsed ; fixVersion, deferredBy, deferredUntil, deferredReason, rejectReason, reopenReason, rootCause, rootCauseNote, confirmationTested, targetedRegressionDone ; history[{at, by, from, to, reason}], fixedAt, resolvedAt, legacyClosure, foundIn (test ou production, pour le DDP) ; testCaseIds, workaround, solution, peopleInvolved, jiraTickets, screenshots, description, createdAt |
| `environments` | id, title, address ; fiche : role, owner, systems, interfaces, lastRefresh, refreshFrequency, prodGaps, usageRules ; outages[{id, date, hours, cause, blockedTests, lostDays}] |
| `testDataRequests` | id, number (TDR-001…), status (requested, in_progress, delivered, refused), projectId, planId, forWhat, environmentId, objects, neededBy, usageDuration, consumed, confidentialityOk, requester, provider, requestedAt, deliveredAt, note |
| `testDataSets` | id, process, objects, howToGet, provider, leadTime |
| `dataTables` | id, name, columns[{id, name}], rows ; utilisées dans les steps par `{{table.colonne}}` |
| `stepBlocks` | id, name, steps (blocs de steps réutilisables) |
| `testers`, `testerLevels` | testeurs (name, levelId, divisionIds, notes) et niveaux (name, order, divisionId) |
| `businessDivisions` | id, name, parentId (un niveau de sous-division) |
| `testRuns` | exécutions importées des checklists : id (= sessionId de la checklist), sourceType (plan ou suite), sourceId, projectId, tester, assignedDate, exportedAt, importedAt, importedBy, results[{caseId, outcome (passed, failed, blocked, not_run), blockedReason, remarks, stepRemarks, stepsDone, stepsTotal, startedAt, finishedAt, durationMin, durationEdited}] |
| `productRisks` | id, code (R-01…), divisionId, domain, title (ce qui pourrait mal tourner), likelihood (1 à 3), impact (1 à 3), testCaseIds, technique, notes ; risk level = likelihood × impact : élevé 6 ou 9 (P1), moyen 3 ou 4 (P2), faible 1 ou 2 (P3) |
| `maturity` | profile{criticality (safety, business, standard, low), size (solo, small, multi, large), company, standard}, assessments[{id, date, label, answers{pointId : {v : yes, partial, no ou na ; note}}, createdAt, by}], currentId |
| `measure` | method{rate, currency, referenceFrom, referenceTo, validatedBy, validatedAt, qaPeople}, baseline{K1..K9 : {a, b} ou {v}}, months[{month, calc{taux, duree, nbreg, maint, analyse, execs, anom, cout}, kpi{K1..K9}, report{brief, risks, next, tmmi}, savedAt, savedBy}] |
| `settings` | automation{goal, scope, staysManual, toolsEnvs, stakeholders, rules} ; testData{usualDelayDays, sendTo} ; riskAnalysis{participants, date, review} ; tools{requirements, changes, defects, automation : {name, urlTemplate avec {ref}}} ; jiraBaseUrl (ancien réglage, repris dans tools.requirements) |

Les listes de référence (types de test, types, sévérités et états d'anomalie, CRUD) sont dans `data-model.js`. Les migrations de données sont dans `load()` de `persistence.js` ; elles sont idempotentes.

## Déployer une modification du code

1. Modifier le code et pousser sur `main` de `Qa-Catalog`. GitHub Pages publie en quelques minutes.
2. Changer le numéro de version `?v=AAAA.MM.JJ.N` dans `index.html`, `login.html` et `admin.html`, ainsi que l'indicateur affiché en bas à gauche de `index.html`. Sans ce changement, les navigateurs peuvent garder les anciens fichiers en cache.

Ne jamais remettre `data.json` dans le dépôt public : il est dans le `.gitignore`.

## Sauvegarde et restauration

- Chaque enregistrement est un commit du dépôt privé : l'historique de `Qa-Catalog-Data` est la sauvegarde.
- Restaurer une version : dans `Qa-Catalog-Data`, ouvrir l'historique de `data.json`, récupérer la version voulue et la recommiter. Les utilisateurs la reçoivent au prochain chargement (bouton « Recharger »).
- L'application propose aussi un export et un import JSON complets (onglet Export / Import).

## Limites connues

- Les captures d'écran sont stockées dans `data.json` (en base64) : le fichier grossit vite. La lecture fonctionne au-delà de 1 Mo, mais il faudra sortir les captures du fichier.
- Les résultats de la checklist testeur reviennent dans le catalogue par un fichier : le testeur clique « Exporter les résultats (.json) », la QA l'importe (onglet Export / Import). Les captures n'y sont pas : elles restent dans le rapport PDF de la checklist.
- Pas de tests automatisés de l'outil lui-même.
