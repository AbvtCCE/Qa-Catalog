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
| `assets/js/app/weekly-report.js` | Weekly test progress report d'un projet (calcul, aperçu, copie pour Confluence, .md) |
| `assets/js/app/completion-report.js` | Test completion report par changement : exit criteria par risk level, recommandation, rapport figé pour le CAB |
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
| `testCases` | id, title, steps[{type, action, expected, requiresScreenshot, blockId}], environmentIds, divisionIds, types, crud, minLevelId, estimatedTime, ready, automated, toAutomate, isInterface, jiraTickets[{key, summary}], linkedCaseIds, screenshots, sortOrder |
| `testSuites` | id, title, testCaseIds, divisionIds |
| `testPlans` | id, title, items[{type: suite ou case, id}], testCaseIds, divisionIds |
| `projects` | id, name, startDate, endDate, planIds, weeklyNotes{lundi AAAA-MM-JJ : {status, reason, blockers, lostDays, risks, next}}, completionReports[{id, changeNumber, deliveryVersion, reportDate, riskLevel, planIds, regressionRunId, regressionKind, untestedReason, decisions{anomalyId : texte}, risks, recommendation, recommendationText, uatName, uatDate, evidenceLinks, frozenAt, frozenBy, snapshot{html, markdown, recommendation, criteria}}] |
| `anomalies` | id, title, description, type, severity, state, testCaseIds, workaround, solution, peopleInvolved, screenshots, createdAt, resolvedAt |
| `environments` | id, title, address |
| `dataTables` | id, name, columns[{id, name}], rows ; utilisées dans les steps par `{{table.colonne}}` |
| `stepBlocks` | id, name, steps (blocs de steps réutilisables) |
| `testers`, `testerLevels` | testeurs (name, levelId, divisionIds, notes) et niveaux (name, order, divisionId) |
| `businessDivisions` | id, name, parentId (un niveau de sous-division) |
| `testRuns` | exécutions importées des checklists : id (= sessionId de la checklist), sourceType (plan ou suite), sourceId, projectId, tester, assignedDate, exportedAt, importedAt, importedBy, results[{caseId, outcome (passed, failed, blocked, not_run), blockedReason, remarks, stepRemarks, stepsDone, stepsTotal, startedAt, finishedAt, durationMin, durationEdited}] |
| `settings` | jiraBaseUrl |

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
