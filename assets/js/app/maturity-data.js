/* Catalogue de tests — module « maturity-data.js ».
   Fait partie de l'application principale (index.html). L'ordre de chargement
   des <script> compte : voir index.html. Ne pas ouvrir isolément. */
/* Les 112 points de la « Check-list QA d'après l'ISTQB » (docs/checklist-qa-istqb.html),
   repris tels quels : id, t (le point), d (la preuve attendue), r (sections des syllabus),
   first (point « D'abord » de la check-list, proposé pour un QA seul). Fichier généré à partir
   de la page de la check-list : ne pas le modifier à la main, le régénérer. */
const MATURITY_CHECKLIST = [
 {
  "id": "audit",
  "title": "Auditer le système QA",
  "groups": [
   {
    "title": "Politique, stratégie, organisation",
    "items": [
     {
      "id": "AU-01",
      "t": "Une politique de test écrite dit pourquoi l’entreprise teste et ce qu’elle attend du test.",
      "d": "Premier domaine du niveau 2 de TMMi. Preuve : un document validé par la direction et connu des équipes.",
      "r": [
       "CTAL-TM 1.1.1",
       "TMMi niveau 2"
      ],
      "first": false
     },
     {
      "id": "AU-02",
      "t": "Une stratégie de test d’organisation fixe les niveaux, les types, les techniques et les critères par défaut.",
      "d": "Chaque projet l’adapte ensuite à son contexte. Preuve : un document à jour, réellement utilisé dans les derniers projets.",
      "r": [
       "CTAL-TM 1.4.1",
       "CTAL-TM 1.4.2",
       "CT-ATLaS 4.1.2"
      ],
      "first": false
     },
     {
      "id": "AU-03",
      "t": "Les rôles de test sont répartis : qui teste quoi, à quel niveau.",
      "d": "Approche d’équipe intégrée : les développeurs testent les composants, le métier l’acceptation ; le QA organise, outille et teste le système. Preuve : une matrice des responsabilités par niveau de test.",
      "r": [
       "CTFL 1.4.5",
       "CTFL 1.5.2",
       "CT-ATLaS 1.1"
      ],
      "first": true
     },
     {
      "id": "AU-04",
      "t": "Les parties prenantes du test sont identifiées, avec leurs attentes et ce qu’elles savent du test.",
      "d": "Direction, chefs de projet, métier, développeurs, exploitation, fournisseurs. Preuve : une liste tenue à jour, utilisée pour les rapports.",
      "r": [
       "CTAL-TM 1.2.1",
       "CTAL-TM 1.2.2"
      ],
      "first": false
     },
     {
      "id": "AU-05",
      "t": "Le niveau d’indépendance du test est choisi selon le risque.",
      "d": "Plus le risque est élevé, plus un regard extérieur compte : autre équipe, métier, prestataire. Preuve : la règle appliquée aux composants critiques.",
      "r": [
       "CTFL 1.5.3"
      ],
      "first": false
     },
     {
      "id": "AU-06",
      "t": "Une matrice de compétences couvre tous ceux qui testent, avec un plan pour combler les manques.",
      "d": "Le syllabus Test Manager classe les compétences en quatre domaines. Quand le QA est seul, la matrice inclut les développeurs et les utilisateurs clés qui testent.",
      "r": [
       "CTAL-TM 3.1.1",
       "CTAL-TM 3.1.3",
       "CTAL-TM 3.1.4",
       "CT-TAS 5.3.2"
      ],
      "first": false
     }
    ]
   },
   {
    "title": "Processus de test",
    "items": [
     {
      "id": "AU-07",
      "t": "Chaque release ou projet a un plan de test : périmètre, objectifs, approche, critères d’entrée et de sortie, risques, planning.",
      "d": "Contenu type du plan de test d’après le syllabus Foundation et la norme ISO/IEC/IEEE 29119-3. Preuve : les plans des deux dernières releases.",
      "r": [
       "CTFL 5.1.1",
       "CTAL-TM 1.1.1"
      ],
      "first": true
     },
     {
      "id": "AU-08",
      "t": "Les objectifs de test sont S.M.A.R.T. : spécifiques, mesurables, atteignables, pertinents, datés.",
      "d": "Un objectif qu’on ne peut pas mesurer ne peut pas servir à décider.",
      "r": [
       "CTAL-TM 1.4.3"
      ],
      "first": false
     },
     {
      "id": "AU-09",
      "t": "L’avancement est suivi avec des métriques, et des décisions de pilotage en découlent.",
      "d": "Un suivi sans décision n’est que du reporting. Preuve : une action corrective prise après un écart.",
      "r": [
       "CTFL 5.3",
       "CTAL-TM 1.1.2",
       "CTAL-TM 2.1.2"
      ],
      "first": false
     },
     {
      "id": "AU-10",
      "t": "La clôture produit un rapport, des leçons apprises et un testware archivé, réutilisable.",
      "d": "Preuve : le rapport de clôture de la dernière release et l’endroit où le testware est rangé.",
      "r": [
       "CTFL 1.4.1",
       "CTAL-TM 1.1.3"
      ],
      "first": false
     },
     {
      "id": "AU-11",
      "t": "La traçabilité relie exigences, conditions de test, cas de test, résultats et anomalies.",
      "d": "Elle mesure la couverture et l’impact d’un changement. Preuve : pour une exigence prise au hasard, retrouver ses tests et leurs derniers résultats.",
      "r": [
       "CTFL 1.4.4",
       "CT-QDO 3.1.2"
      ],
      "first": true
     },
     {
      "id": "AU-12",
      "t": "Le testware est versionné et rangé à un seul endroit, la source unique de vérité.",
      "d": "Cas, scripts, données et description des environnements. Preuve : un dépôt ou un outil de gestion des tests, pas des fichiers dispersés.",
      "r": [
       "CTFL 1.4.3",
       "CTFL 5.4",
       "CT-QDO 3.1.1"
      ],
      "first": false
     }
    ]
   },
   {
    "title": "Test statique",
    "items": [
     {
      "id": "AU-13",
      "t": "Les exigences et les user stories sont revues avant le développement.",
      "d": "C’est le moyen le moins cher de trouver des défauts. Preuve : des comptes rendus de revue et les défauts trouvés.",
      "r": [
       "CTFL 3.1.2",
       "CTFL 3.2.2",
       "TMMi niveau 3"
      ],
      "first": true
     },
     {
      "id": "AU-14",
      "t": "Les revues suivent un processus et des rôles définis, avec un type de revue adapté à l’enjeu.",
      "d": "Planification, lancement, revue individuelle, communication et analyse, correction et rapport ; revue informelle, relecture, revue technique ou inspection.",
      "r": [
       "CTFL 3.2.2",
       "CTFL 3.2.3",
       "CTFL 3.2.4",
       "CTFL 3.2.5"
      ],
      "first": false
     },
     {
      "id": "AU-15",
      "t": "L’analyse statique du code tourne automatiquement, et ses alertes sont traitées.",
      "d": "Preuve : le rapport d’analyse du dernier build et le traitement des alertes bloquantes.",
      "r": [
       "CTFL 3.1",
       "CTAL-TTA 3.2"
      ],
      "first": false
     }
    ]
   },
   {
    "title": "Anomalies",
    "items": [
     {
      "id": "AU-16",
      "t": "Le cycle de vie des anomalies est défini : états, transitions, responsables, délais.",
      "d": "Preuve : le flux configuré dans l’outil, et des anomalies qui le suivent réellement.",
      "r": [
       "CTAL-TM 2.3.1"
      ],
      "first": true
     },
     {
      "id": "AU-17",
      "t": "Un rapport d’anomalie contient de quoi reproduire, comprendre et décider.",
      "d": "Identifiant, titre, contexte et version, étapes, résultat attendu et obtenu, gravité, priorité, état, références.",
      "r": [
       "CTFL 5.5",
       "CTAL-TM 2.3.5"
      ],
      "first": false
     },
     {
      "id": "AU-18",
      "t": "Les anomalies sont gérées avec les autres fonctions : métier, exploitation, fournisseurs.",
      "d": "Une même règle de priorité et un même outil, ou au moins une passerelle entre les outils.",
      "r": [
       "CTAL-TM 2.3.2"
      ],
      "first": false
     },
     {
      "id": "AU-19",
      "t": "Les anomalies sont classées et analysées pour trouver les causes racines et améliorer le processus.",
      "d": "Regroupements, diagramme d’Ishikawa, actions de prévention suivies.",
      "r": [
       "CTAL-TM 2.3.6",
       "CTAL-TM 1.5.3",
       "CTAL-TA 5.3.2"
      ],
      "first": false
     }
    ]
   },
   {
    "title": "Environnements, données, configuration",
    "items": [
     {
      "id": "AU-20",
      "t": "Chaque environnement de test est décrit : rôle, responsable, période d’utilisation, fidélité à la production.",
      "d": "Domaine « environnement de test » du niveau 2 de TMMi. Preuve : une fiche par environnement.",
      "r": [
       "CTAL-TA 1.3.3",
       "CTAL-TTA 4.2.2",
       "TMMi niveau 2"
      ],
      "first": true
     },
     {
      "id": "AU-21",
      "t": "Les données de test sont maîtrisées : représentatives, anonymisées ou pseudonymisées, rafraîchies.",
      "d": "Des données personnelles de production ne doivent jamais se trouver en clair dans un environnement de test.",
      "r": [
       "CTAL-TA 1.3.5",
       "CTAL-TTA 4.2.5",
       "CT-QDO 3.1.4"
      ],
      "first": true
     },
     {
      "id": "AU-22",
      "t": "La version de l’objet testé et du testware est toujours identifiable.",
      "d": "Sans elle, les anomalies ne sont pas reproductibles et les résultats ne valent rien.",
      "r": [
       "CTFL 5.4"
      ],
      "first": false
     }
    ]
   },
   {
    "title": "Mesure et valeur",
    "items": [
     {
      "id": "AU-23",
      "t": "Chaque métrique répond à une question utile, d’après la démarche but, question, métrique (GQM).",
      "d": "Mesurer l’efficacité, l’efficience et la prévisibilité du test, pas l’activité.",
      "r": [
       "CTAL-TM 1.5.3",
       "CTAL-TM 2.1.1"
      ],
      "first": false
     },
     {
      "id": "AU-24",
      "t": "Les rapports sont adaptés à chaque public : direction, projet, technique.",
      "d": "Preuve : deux rapports de la même période, l’un pour la direction, l’autre pour l’équipe.",
      "r": [
       "CTFL 5.3.2",
       "CTFL 5.3.3",
       "CTAL-TM 2.1.3"
      ],
      "first": false
     },
     {
      "id": "AU-25",
      "t": "Le coût de la qualité est estimé : prévention, évaluation, défaillances internes et externes.",
      "d": "C’est la base d’un argumentaire chiffré pour le test.",
      "r": [
       "CTAL-TM 3.2.1",
       "CTAL-TM 3.2.2"
      ],
      "first": false
     },
     {
      "id": "AU-26",
      "t": "Les métriques de livraison sont suivies, dont le taux d’échec des changements.",
      "d": "Métriques DORA : fréquence de déploiement, délai de mise en production, taux d’échec des changements, temps de rétablissement. Elles relient le test à la gestion des changements.",
      "r": [
       "CT-QDO 1.1.3",
       "CT-ATLaS 5.1.3"
      ],
      "first": false
     }
    ]
   },
   {
    "title": "Outils",
    "items": [
     {
      "id": "AU-27",
      "t": "Les outils de test sont inventoriés : usage, propriétaire, licences, coûts, intégrations.",
      "d": "Preuve : une liste à jour, avec un propriétaire nommé pour chaque outil.",
      "r": [
       "CTAL-TM 1.6.2",
       "CTAL-TM 1.6.4",
       "CT-TAS 5.3.1"
      ],
      "first": false
     },
     {
      "id": "AU-28",
      "t": "Chaque outil a démontré un retour sur investissement ou un bénéfice mesuré.",
      "d": "Coûts ponctuels et récurrents comparés aux gains.",
      "r": [
       "CTAL-TM 1.6.3",
       "CTAL-TM 1.6.5"
      ],
      "first": false
     }
    ]
   },
   {
    "title": "Amélioration",
    "items": [
     {
      "id": "AU-29",
      "t": "L’amélioration suit une démarche : initier, diagnostiquer, établir, agir, apprendre (IDEAL).",
      "d": "Cette check-list sert au diagnostic ; le plan d’action prépare l’étape « établir ».",
      "r": [
       "CTAL-TM 1.5.1"
      ],
      "first": true
     },
     {
      "id": "AU-30",
      "t": "La maturité est évaluée avec un modèle reconnu, TMMi ou TPI NEXT, puis réévaluée.",
      "d": "TMMi niveau 2 : politique et stratégie de test, planification, suivi et contrôle, conception et exécution, environnement de test.",
      "r": [
       "CTAL-TM 1.5.2",
       "CT-ATLaS 4.1.3"
      ],
      "first": false
     },
     {
      "id": "AU-31",
      "t": "Des rétrospectives ont lieu et leurs actions sont suivies jusqu’au bout.",
      "d": "Planifier, faire, vérifier, agir (PDCA) : chaque amélioration est une expérience.",
      "r": [
       "CTFL 2.1.6",
       "CTAL-TM 1.5.4",
       "CT-ATLaS 3.1.1"
      ],
      "first": false
     },
     {
      "id": "AU-32",
      "t": "Le flux de livraison est cartographié pour repérer les attentes et les gaspillages autour du test.",
      "d": "Cartographie de la chaîne de valeur : délais, attentes d’environnement, retours en arrière.",
      "r": [
       "CT-ATLaS 2.1.2",
       "CT-ATLaS 2.2.2"
      ],
      "first": false
     }
    ]
   }
  ]
 },
 {
  "id": "strategie",
  "title": "Décider la stratégie et les cas de test",
  "groups": [
   {
    "title": "Approche",
    "items": [
     {
      "id": "ST-01",
      "t": "L’approche de test est choisie d’après le contexte : domaine, objectifs, risques, cycle de développement, contraintes.",
      "d": "Principe du syllabus Foundation : le test dépend du contexte.",
      "r": [
       "CTFL 1.3",
       "CTAL-TM 1.4.1",
       "CTAL-TM 1.4.2"
      ],
      "first": false
     },
     {
      "id": "ST-02",
      "t": "Les risques qualité sont identifiés avec les parties prenantes.",
      "d": "Ateliers, entretiens, incidents de production passés, listes de contrôle.",
      "r": [
       "CTFL 5.2.3",
       "CTAL-TM 1.3.2",
       "CTAL-TA 2.1"
      ],
      "first": true
     },
     {
      "id": "ST-03",
      "t": "Chaque risque a un niveau : probabilité et impact, sur une échelle simple.",
      "d": "Hors systèmes critiques pour la sécurité, une technique légère suffit, comme PRAM ou PRISMA.",
      "r": [
       "CTFL 5.2.1",
       "CTAL-TM 1.3.3",
       "CTAL-TM 1.3.5"
      ],
      "first": false
     },
     {
      "id": "ST-04",
      "t": "L’effort, les techniques et la profondeur de test suivent le niveau de risque.",
      "d": "Preuve : les zones à risque élevé ont plus de cas, des techniques plus fortes et des revues.",
      "r": [
       "CTFL 5.2.4",
       "CTAL-TM 1.3.4",
       "CTAL-TA 3.5.1"
      ],
      "first": true
     },
     {
      "id": "ST-05",
      "t": "Les risques projet sont suivis : fournisseurs, retards, environnements, personnes.",
      "d": "Le syllabus Test Manager les compte parmi les facteurs de probabilité des risques qualité.",
      "r": [
       "CTFL 5.2.2",
       "CTAL-TM 1.3.3"
      ],
      "first": false
     },
     {
      "id": "ST-06",
      "t": "Les niveaux de test sont définis avec leur objet, leur base, leurs responsables et leurs environnements.",
      "d": "Composant, intégration de composants, système, intégration de systèmes, acceptation.",
      "r": [
       "CTFL 2.2.1",
       "CTAL-TM 1.2.5"
      ],
      "first": false
     },
     {
      "id": "ST-07",
      "t": "Les types de test sont choisis : fonctionnels, non fonctionnels, boîte noire, boîte blanche.",
      "d": "Caractéristiques de qualité d’après la norme ISO/IEC 25010.",
      "r": [
       "CTFL 2.2.2",
       "CTAL-TM 1.2.6"
      ],
      "first": false
     },
     {
      "id": "ST-08",
      "t": "Les caractéristiques non fonctionnelles critiques ont un plan : performance, sécurité, fiabilité, compatibilité, utilisabilité.",
      "d": "Pour chacune : qui teste, avec quoi, sur quel environnement, avec quels critères.",
      "r": [
       "CTAL-TTA 4.3",
       "CTAL-TTA 4.4",
       "CTAL-TTA 4.5",
       "CTAL-TA 4.2"
      ],
      "first": false
     },
     {
      "id": "ST-09",
      "t": "Le test commence tôt : revue des exigences, critères d’acceptation, tests écrits avant le code.",
      "d": "Décalage à gauche (shift-left), ATDD, BDD.",
      "r": [
       "CTFL 2.1.5",
       "CTFL 4.5.3"
      ],
      "first": false
     },
     {
      "id": "ST-10",
      "t": "Les mises à jour d’éditeur, les correctifs et les migrations déclenchent un test de maintenance avec analyse d’impact.",
      "d": "L’analyse d’impact choisit la régression à rejouer.",
      "r": [
       "CTFL 2.3",
       "CTAL-TA 2.2"
      ],
      "first": false
     }
    ]
   },
   {
    "title": "Piloter",
    "items": [
     {
      "id": "ST-11",
      "t": "Les critères d’entrée et de sortie sont écrits, mesurables et appliqués.",
      "d": "Les critères de sortie et le rapport de test alimentent la décision de mise en production, par exemple au CAB.",
      "r": [
       "CTFL 5.1.3",
       "CTAL-TM 1.4.3"
      ],
      "first": true
     },
     {
      "id": "ST-12",
      "t": "L’effort de test est estimé avec une technique explicite, et l’estimation est revue.",
      "d": "Ratios, extrapolation, Wideband Delphi, estimation à trois points.",
      "r": [
       "CTFL 5.1.4",
       "CTAL-TM 2.2.2",
       "CTAL-TM 2.2.3"
      ],
      "first": false
     },
     {
      "id": "ST-13",
      "t": "Les cas de test sont priorisés : par risque, par couverture ou par exigences.",
      "d": "Le plus important passe en premier si le temps manque.",
      "r": [
       "CTFL 5.1.5"
      ],
      "first": false
     },
     {
      "id": "ST-14",
      "t": "La répartition visée des tests est explicite : pyramide de tests et quadrants.",
      "d": "Beaucoup de tests rapides en bas, peu de tests lents de bout en bout.",
      "r": [
       "CTFL 5.1.6",
       "CTFL 5.1.7",
       "CT-TAS 3.1.1"
      ],
      "first": false
     },
     {
      "id": "ST-15",
      "t": "La régression est choisie par analyse d’impact, par risque, par historique ou par couverture.",
      "d": "Le test de confirmation suit chaque correction ; la régression vérifie le reste.",
      "r": [
       "CTFL 2.2.3",
       "CTAL-TA 2.2"
      ],
      "first": true
     },
     {
      "id": "ST-16",
      "t": "Les tests sont répartis : composants par les développeurs, acceptation par le métier, système et coordination par le QA.",
      "d": "Assistance qualité : outiller et accompagner les autres plutôt que tout tester soi-même.",
      "r": [
       "CTFL 1.5.2",
       "CT-ATLaS 1.1",
       "CT-ATLaS 1.2"
      ],
      "first": true
     }
    ]
   },
   {
    "title": "Concevoir les cas de test",
    "items": [
     {
      "id": "ST-17",
      "t": "Les techniques boîte noire sont appliquées selon la règle à tester : partitions, valeurs limites, tables de décisions, transitions d’état.",
      "d": "Une technique par type de règle, choisie selon le risque.",
      "r": [
       "CTFL 4.2",
       "CTAL-TA 3.5.1"
      ],
      "first": true
     },
     {
      "id": "ST-18",
      "t": "Pour les zones critiques, des techniques avancées complètent : test de domaine, combinatoire par paires, CRUD, scénarios, test métamorphique.",
      "d": "Le test métamorphique sert quand aucun oracle n’existe.",
      "r": [
       "CTAL-TA 3.1",
       "CTAL-TA 3.2",
       "CTAL-TA 3.3"
      ],
      "first": false
     },
     {
      "id": "ST-19",
      "t": "Le test exploratoire est organisé en sessions avec des chartes, et complété par des listes de contrôle.",
      "d": "Il trouve ce que les scripts ne cherchent pas.",
      "r": [
       "CTFL 4.4.2",
       "CTFL 4.4.3",
       "CTAL-TA 3.4.1",
       "CTAL-TA 3.4.2"
      ],
      "first": true
     },
     {
      "id": "ST-20",
      "t": "La couverture du code développé en interne est mesurée : instructions et branches.",
      "d": "La couverture des branches inclut celle des instructions.",
      "r": [
       "CTFL 4.3",
       "CTAL-TTA 2.2",
       "CTAL-TTA 2.3"
      ],
      "first": false
     },
     {
      "id": "ST-21",
      "t": "Les user stories ont des critères d’acceptation écrits avec le métier.",
      "d": "Écriture collaborative des stories, puis critères vérifiables.",
      "r": [
       "CTFL 4.5.1",
       "CTFL 4.5.2"
      ],
      "first": false
     },
     {
      "id": "ST-22",
      "t": "Le niveau de détail des cas est choisi : cas de haut niveau ou de bas niveau selon le contexte.",
      "d": "Haut niveau : les conditions couvertes ; bas niveau : données, préconditions et résultats concrets.",
      "r": [
       "CTAL-TA 1.3.1"
      ],
      "first": false
     },
     {
      "id": "ST-23",
      "t": "Les cas de test respectent des critères de qualité : corrects, faisables, nécessaires, compréhensibles, traçables, cohérents, précis, complets, concis.",
      "d": "À vérifier en revue sur un échantillon.",
      "r": [
       "CTAL-TA 1.3.2"
      ],
      "first": false
     },
     {
      "id": "ST-24",
      "t": "Chaque cas a un oracle : on sait d’où vient le résultat attendu.",
      "d": "Exigence, système existant, calcul indépendant, expert métier.",
      "r": [
       "CTAL-TA 1.3.4"
      ],
      "first": false
     },
     {
      "id": "ST-25",
      "t": "Les données de test sont définies avec les cas, y compris leurs dépendances et leur durée de validité.",
      "d": "Une donnée qui expire fait échouer un test sans défaut.",
      "r": [
       "CTAL-TA 1.3.5"
      ],
      "first": false
     },
     {
      "id": "ST-26",
      "t": "Les procédures de test gèrent les préconditions, l’ordre, les dépendances et la remise en état.",
      "d": "Mise en place, vérification, remise à zéro.",
      "r": [
       "CTAL-TA 1.2.3"
      ],
      "first": false
     }
    ]
   },
   {
    "title": "Exécuter et rendre compte",
    "items": [
     {
      "id": "ST-27",
      "t": "Chaque correction est confirmée, puis la régression ciblée est rejouée.",
      "d": "Une correction peut casser autre chose.",
      "r": [
       "CTFL 2.2.3"
      ],
      "first": false
     },
     {
      "id": "ST-28",
      "t": "Les rapports permettent de décider : avancement, couverture, risques restants, anomalies ouvertes.",
      "d": "Le risque restant compte plus que le nombre de tests passés.",
      "r": [
       "CTFL 5.3.1",
       "CTFL 5.3.2",
       "CTAL-TM 2.1.3"
      ],
      "first": false
     }
    ]
   }
  ]
 },
 {
  "id": "architecture",
  "title": "Décider l’architecture du test",
  "groups": [
   {
    "title": "Système et testabilité",
    "items": [
     {
      "id": "AR-01",
      "t": "Le système sous test et ses interfaces sont cartographiés ; la carte fixe les points d’intégration à tester.",
      "d": "Applications, flux, fournisseurs, traitements de nuit.",
      "r": [
       "CTFL 2.2.1",
       "CT-TAS 3.1.2"
      ],
      "first": false
     },
     {
      "id": "AR-02",
      "t": "La testabilité est un critère des revues d’architecture : accès aux interfaces, journaux, données, isolement des composants.",
      "d": "Une liste de contrôle orientée test sert à ces revues.",
      "r": [
       "CT-TAS 1.1.2",
       "CTAL-TTA 5.2.1"
      ],
      "first": false
     }
    ]
   },
   {
    "title": "Environnements et données",
    "items": [
     {
      "id": "AR-03",
      "t": "La chaîne d’environnements est définie : quel niveau de test dans quel environnement, avec quelle fidélité à la production.",
      "d": "Chaque environnement a un rôle, pas seulement un nom.",
      "r": [
       "CTAL-TA 1.3.3",
       "CTAL-TTA 4.2.2"
      ],
      "first": true
     },
     {
      "id": "AR-04",
      "t": "Les environnements sont standardisés, gérés et, si possible, créés automatiquement (infrastructure as code).",
      "d": "Un environnement recréable à l’identique supprime une grande part des faux échecs.",
      "r": [
       "CT-QDO 3.1.6",
       "CT-QDO 4.2.3"
      ],
      "first": false
     },
     {
      "id": "AR-05",
      "t": "Les environnements partagés ont un planning d’occupation et un responsable.",
      "d": "Personne ne casse le travail d’une autre équipe sans prévenir.",
      "r": [
       "CT-TAS 5.3.1"
      ],
      "first": false
     },
     {
      "id": "AR-06",
      "t": "Les dépendances indisponibles sont remplacées par des doublures : bouchons, simulateurs, virtualisation de services.",
      "d": "On teste plus tôt, sans attendre le système d’un fournisseur.",
      "r": [
       "CT-TAS 3.1.3",
       "CTAL-TAE 3.1.2",
       "CTAL-TA 1.3.5"
      ],
      "first": false
     },
     {
      "id": "AR-07",
      "t": "Les interfaces entre systèmes sont vérifiées par des tests de contrat ou d’API.",
      "d": "Les défauts d’interface sont trouvés avant le test de bout en bout.",
      "r": [
       "CT-TAS 3.1.3",
       "CT-TAS 4.3.3",
       "CTAL-TAE 5.1.3",
       "CT-QDO 3.2.2"
      ],
      "first": false
     },
     {
      "id": "AR-08",
      "t": "Les données de test sont fournies par un processus : génération, sous-ensembles, masquage, rafraîchissement.",
      "d": "Automatiser la gestion des données de test accélère les cycles et protège la vie privée.",
      "r": [
       "CT-QDO 3.1.4",
       "CTAL-TA 1.3.5"
      ],
      "first": true
     },
     {
      "id": "AR-09",
      "t": "La sécurité et la protection des données s’appliquent aussi aux environnements de test.",
      "d": "Accès, comptes, journaux, copies de données.",
      "r": [
       "CTAL-TTA 4.2.5"
      ],
      "first": false
     }
    ]
   },
   {
    "title": "Livraison continue",
    "items": [
     {
      "id": "AR-10",
      "t": "Chaque étape de la chaîne de livraison a ses tests et sa porte qualité : commit, acceptation, après déploiement.",
      "d": "Une porte qualité arrête la livraison quand un seuil n’est pas atteint.",
      "r": [
       "CT-QDO 2.2.2",
       "CT-QDO 2.2.3",
       "CT-QDO 2.2.6",
       "CT-TAS 4.1.1"
      ],
      "first": true
     },
     {
      "id": "AR-11",
      "t": "Les demandes de fusion (pull requests) sont revues et vérifiées avant l’intégration.",
      "d": "Avec une stratégie de branches connue de tous.",
      "r": [
       "CT-QDO 2.1.4",
       "CT-QDO 4.2.5"
      ],
      "first": false
     },
     {
      "id": "AR-12",
      "t": "La mise en production prévoit le retour arrière : blue/green, canary, activation progressive des fonctionnalités.",
      "d": "Le test continue après le déploiement, sur une partie des utilisateurs.",
      "r": [
       "CT-QDO 4.2.2",
       "CT-QDO 4.2.4"
      ],
      "first": false
     },
     {
      "id": "AR-13",
      "t": "La production est observée : supervision, télémétrie, tests de surveillance.",
      "d": "Décalage à droite (shift-right) : des tests automatisés réutilisés pour surveiller.",
      "r": [
       "CT-QDO 4.2.7",
       "CT-TAS 3.1.3",
       "CT-TAS 4.1.3"
      ],
      "first": false
     },
     {
      "id": "AR-14",
      "t": "Les profils d’utilisation réels servent aux tests de performance et de fiabilité.",
      "d": "Profils opérationnels : qui fait quoi, combien de fois, à quelle heure.",
      "r": [
       "CTAL-TTA 4.9",
       "CTAL-TTA 4.5.7"
      ],
      "first": false
     }
    ]
   },
   {
    "title": "Outillage et configuration",
    "items": [
     {
      "id": "AR-15",
      "t": "Le testware, les scripts et la configuration des environnements sont sous gestion de configuration, alignés sur les versions du système.",
      "d": "Une version du système, une version des tests.",
      "r": [
       "CTFL 5.4",
       "CTAL-TAE 5.1.2"
      ],
      "first": true
     },
     {
      "id": "AR-16",
      "t": "Les outils sont reliés : exigences, tests, anomalies et chaîne de livraison partagent les mêmes références.",
      "d": "Moins de ressaisie, une traçabilité automatique.",
      "r": [
       "CTAL-TM 1.6.2",
       "CT-QDO 4.1.2",
       "CT-TAS 2.1.3"
      ],
      "first": false
     },
     {
      "id": "AR-17",
      "t": "Le nombre d’outils reste limité à ce que l’organisation peut maintenir.",
      "d": "Chaque outil a un coût de licence, de formation et de maintenance.",
      "r": [
       "CTAL-TM 1.6.3"
      ],
      "first": false
     }
    ]
   }
  ]
 },
 {
  "id": "automatisation",
  "title": "Décider l’automatisation",
  "groups": [
   {
    "title": "Faut-il automatiser ?",
    "items": [
     {
      "id": "AT-01",
      "t": "Les objectifs de l’automatisation sont écrits : but, risques, périmètre, parties prenantes, outils, architecture, environnements.",
      "d": "Par exemple : régression plus rapide, tests plus fréquents, couverture plus large.",
      "r": [
       "CT-TAS 1.1.1"
      ],
      "first": true
     },
     {
      "id": "AT-02",
      "t": "Les facteurs de succès sont vérifiés avant de commencer : testabilité, stratégie, architecture, framework.",
      "d": "Rarement tous réunis : connaître ceux qui manquent.",
      "r": [
       "CT-TAS 1.1.2"
      ],
      "first": false
     },
     {
      "id": "AT-03",
      "t": "Les critères d’investissement sont posés : coût d’introduction, moment du projet, durée de vie, maintenance.",
      "d": "Plus l’automatisation commence tôt, plus elle rapporte.",
      "r": [
       "CT-TAS 1.1.3"
      ],
      "first": false
     },
     {
      "id": "AT-04",
      "t": "Le retour sur investissement est calculé : économies divisées par investissement, avec le moment où l’automatisation devient rentable.",
      "d": "Si le projet se termine avant ce moment, le test manuel coûte moins cher.",
      "r": [
       "CT-TAS 5.1.1"
      ],
      "first": true
     },
     {
      "id": "AT-05",
      "t": "Les bénéfices et les risques sont connus de tous : attentes irréalistes, maintenance sous-estimée, dépendance à l’outil.",
      "d": "Ils se présentent à la direction avant de lancer.",
      "r": [
       "CTFL 6.2",
       "CTAL-TAE 1.1.1"
      ],
      "first": false
     },
     {
      "id": "AT-06",
      "t": "Le mode de réalisation est choisi : en interne, avec une solution d’éditeur ou en sous-traitance, coût de possession et licences compris.",
      "d": "Open source, licence par utilisateur, licence flottante ou à l’exécution.",
      "r": [
       "CT-TAS 2.1.1",
       "CT-TAS 2.1.2"
      ],
      "first": false
     },
     {
      "id": "AT-07",
      "t": "L’automatisation ne dépend pas d’une seule personne : documentation, conventions, relecture par un développeur.",
      "d": "Quand le QA est seul, son absence ne doit pas arrêter l’automatisation : c’est un risque de personnel.",
      "r": [
       "CT-TAS 2.2.1",
       "CT-TAS 4.2.2"
      ],
      "first": true
     },
     {
      "id": "AT-08",
      "t": "La direction et les équipes ont validé un plan avec des jalons, des bénéfices et des risques.",
      "d": "Sans adhésion des parties prenantes, l’automatisation s’arrête au premier retard.",
      "r": [
       "CT-TAS 5.3.2"
      ],
      "first": false
     }
    ]
   },
   {
    "title": "Quoi automatiser",
    "items": [
     {
      "id": "AT-09",
      "t": "La répartition actuelle des tests automatisés est dessinée, avec la forme visée.",
      "d": "Cornet de glace, sablier ou parapluie aujourd’hui ; pyramide comme cible réaliste, par étapes.",
      "r": [
       "CT-TAS 3.1.1",
       "CT-TAS 3.1.2",
       "CTFL 5.1.6"
      ],
      "first": true
     },
     {
      "id": "AT-10",
      "t": "Chaque test candidat passe une grille : faisable, rentable, exécuté souvent, répétable, maintenable, sur un flux métier fréquent.",
      "d": "Les autres restent manuels, et c’est une décision.",
      "r": [
       "CT-TAS 3.3.1"
      ],
      "first": true
     },
     {
      "id": "AT-11",
      "t": "On automatise d’abord ce que seule l’automatisation peut faire : volumes, combinaisons, synchronisation, charge.",
      "d": "Par exemple : de nombreuses configurations, de gros journaux à analyser, un timing précis.",
      "r": [
       "CT-TAS 3.3.2"
      ],
      "first": false
     },
     {
      "id": "AT-12",
      "t": "Ce qui reste manuel est assumé : jugement visuel, interactions humaines, longues temporisations, exploration.",
      "d": "Le temps gagné par l’automatisation va au test exploratoire.",
      "r": [
       "CT-TAS 3.3.3",
       "CT-QDO 3.3.1"
      ],
      "first": false
     },
     {
      "id": "AT-13",
      "t": "La transition commence par la régression, avec des tests manuels vérifiés avant d’être automatisés.",
      "d": "Automatiser un test manuel faux donne un test automatique faux.",
      "r": [
       "CT-TAS 6.1.1"
      ],
      "first": true
     },
     {
      "id": "AT-14",
      "t": "Les tests de confirmation des anomalies corrigées rejoignent la régression automatisée.",
      "d": "Un défaut corrigé peut revenir.",
      "r": [
       "CT-TAS 4.1.2"
      ],
      "first": false
     }
    ]
   },
   {
    "title": "Comment automatiser",
    "items": [
     {
      "id": "AT-15",
      "t": "L’outil est choisi après analyse du système sous test et une évaluation documentée, avec preuve de concept.",
      "d": "Comparer plusieurs outils sur les mêmes critères.",
      "r": [
       "CTAL-TAE 1.2.2",
       "CTAL-TAE 2.2.1",
       "CTAL-TAE 2.2.2",
       "CTAL-TM 1.6.3"
      ],
      "first": false
     },
     {
      "id": "AT-16",
      "t": "L’architecture d’automatisation couvre les capacités de l’architecture générique : génération (facultative), définition, exécution, adaptation.",
      "d": "L’adaptation isole les tests des interfaces du système.",
      "r": [
       "CTAL-TAE 3.1.1",
       "CTAL-TAE 3.1.2"
      ],
      "first": false
     },
     {
      "id": "AT-17",
      "t": "Le framework a peu de couches : scripts de test, logique métier, bibliothèques de base.",
      "d": "Les scripts appellent la logique métier, jamais directement les bibliothèques de base.",
      "r": [
       "CTAL-TAE 3.1.3"
      ],
      "first": false
     },
     {
      "id": "AT-18",
      "t": "L’approche d’écriture est choisie : scripts structurés, pilotés par les données, par mots-clés ou BDD.",
      "d": "La capture et rejeu ne tient pas sur la durée.",
      "r": [
       "CTAL-TAE 3.1.4"
      ],
      "first": false
     },
     {
      "id": "AT-19",
      "t": "Le code de test suit des patrons : objets de page, modèle de flux, façade, principes SOLID.",
      "d": "Un changement d’écran ne se corrige qu’à un seul endroit.",
      "r": [
       "CTAL-TAE 3.1.5"
      ],
      "first": false
     },
     {
      "id": "AT-20",
      "t": "Un projet pilote précède la généralisation.",
      "d": "Il valide l’outil, l’architecture et le coût de maintenance réel.",
      "r": [
       "CTAL-TAE 4.1.1",
       "CT-TAS 1.1.2"
      ],
      "first": true
     },
     {
      "id": "AT-21",
      "t": "Les risques de déploiement sont traités : infrastructure, réseau, empaquetage, journalisation, mises à jour.",
      "d": "Un premier déploiement et chaque mise à jour se préparent.",
      "r": [
       "CTAL-TAE 4.2.1",
       "CT-TAS 4.2.2",
       "CT-TAS 4.2.3"
      ],
      "first": false
     },
     {
      "id": "AT-22",
      "t": "Les scripts sont paramétrés par environnement : adresses, comptes, données.",
      "d": "Le même script tourne en test et en préproduction.",
      "r": [
       "CT-TAS 4.2.1"
      ],
      "first": false
     },
     {
      "id": "AT-23",
      "t": "Les données et les préconditions sont créées par l’automatisation, sans dépendre de données figées.",
      "d": "Des scripts de mise en place créent ce dont le test a besoin.",
      "r": [
       "CT-TAS 4.2.1",
       "CT-TAS 6.1.1"
      ],
      "first": false
     },
     {
      "id": "AT-24",
      "t": "Le code d’automatisation est relu et analysé statiquement, comme le code de production.",
      "d": "L’automatisation est un logiciel : elle a ses défauts.",
      "r": [
       "CTAL-TAE 4.3.1",
       "CTAL-TAE 7.1.4"
      ],
      "first": false
     }
    ]
   },
   {
    "title": "Exploiter et améliorer",
    "items": [
     {
      "id": "AT-25",
      "t": "Les tests rapides tournent à chaque changement ; une suite de fumée protège la chaîne, la régression complète tourne à part.",
      "d": "Si les tests font attendre la chaîne de livraison, réduire à l’essentiel.",
      "r": [
       "CT-TAS 3.2.3",
       "CT-TAS 6.2.1",
       "CTAL-TAE 5.1.1",
       "CT-QDO 3.2.1"
      ],
      "first": false
     },
     {
      "id": "AT-26",
      "t": "Les journaux permettent d’analyser un échec : horodatage, statut, captures, corrélation avec les journaux du système.",
      "d": "Distinguer un défaut du système, de l’automatisation ou de l’environnement.",
      "r": [
       "CTAL-TAE 6.1.1",
       "CTAL-TAE 6.1.2"
      ],
      "first": false
     },
     {
      "id": "AT-27",
      "t": "Les métriques d’automatisation sont suivies : réussites et échecs, échecs par anomalie, durée d’exécution, couverture fonctionnelle et du code.",
      "d": "Le nombre de tests automatisés seul ne dit rien de la couverture.",
      "r": [
       "CT-TAS 5.2.1"
      ],
      "first": false
     },
     {
      "id": "AT-28",
      "t": "Les rapports d’automatisation sont adaptés aux publics et conservés pour suivre les tendances.",
      "d": "Direction, exploitation, technique.",
      "r": [
       "CTAL-TAE 6.1.3",
       "CT-TAS 5.4.1"
      ],
      "first": false
     },
     {
      "id": "AT-29",
      "t": "La solution d’automatisation est elle-même testée : environnement, comportement attendu des scripts, faux résultats.",
      "d": "Un test qui passe à tort est pire qu’un test absent.",
      "r": [
       "CTAL-TAE 7.1.1",
       "CTAL-TAE 7.1.2",
       "CTAL-TAE 7.1.3"
      ],
      "first": true
     },
     {
      "id": "AT-30",
      "t": "Les tests instables sortent de la suite active jusqu’à leur correction.",
      "d": "Sinon plus personne ne croit aux résultats.",
      "r": [
       "CTAL-TAE 7.1.2"
      ],
      "first": true
     },
     {
      "id": "AT-31",
      "t": "Un signal d’alarme est suivi : si la maintenance coûte plus que le test manuel économisé, la solution est revue.",
      "d": "Mesurer les heures de développement, de réparation et le temps gagné.",
      "r": [
       "CT-TAS 6.2.1"
      ],
      "first": true
     },
     {
      "id": "AT-32",
      "t": "L’automatisation est améliorée en continu : remaniement après les évolutions du système, nouvelles opportunités.",
      "d": "Comme tout logiciel, elle se remanie.",
      "r": [
       "CTAL-TAE 8.1",
       "CT-TAS 6.2.1"
      ],
      "first": false
     }
    ]
   },
   {
    "title": "IA générative, si elle est utilisée",
    "items": [
     {
      "id": "AT-33",
      "t": "L’usage de l’IA générative dans le test est cadré : analyse, conception, régression, rapports.",
      "d": "Une stratégie écrite : outils approuvés, cas d’usage, responsabilités.",
      "r": [
       "CT-GenAI 2.2",
       "CT-GenAI 5.1.2"
      ],
      "first": false
     },
     {
      "id": "AT-34",
      "t": "Tout résultat produit par l’IA est vérifié par une personne : hallucinations, erreurs de raisonnement, résultats non déterministes.",
      "d": "Un cas de test plausible n’est pas forcément correct.",
      "r": [
       "CT-GenAI 3.1"
      ],
      "first": false
     },
     {
      "id": "AT-35",
      "t": "Aucune donnée sensible ne part vers un outil d’IA non approuvé.",
      "d": "Pas d’IA fantôme : les outils utilisés sont connus et autorisés.",
      "r": [
       "CT-GenAI 3.2",
       "CT-GenAI 5.1.1"
      ],
      "first": false
     }
    ]
   }
  ]
 }
];

const MATURITY_SOURCES = [["CTFL", "Certified Tester Foundation Level", "v4.0", null], ["CTAL-TM", "Advanced Level Test Management", "v3.0", null], ["CTAL-TA", "Advanced Level Test Analyst", "v4.0", "https://www.istqb.org/wp-content/uploads/sdm-uploads/ISTQB-CTAL-TA-Syllabus-v4.0-EN-4.pdf"], ["CTAL-TTA", "Advanced Level Technical Test Analyst", "v4.0", "https://www.istqb.org/wp-content/uploads/2024/11/ISTQB-CTAL-TTA_Syllabus_v4.0.pdf"], ["CTAL-TAE", "Advanced Level Test Automation Engineering", "v2.0", "https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTAL-TAE_Syllabus_v2.0.pdf"], ["CT-TAS", "Specialist Test Automation Strategy", "v1.0", null], ["CT-QDO", "Specialist Quality in DevOps", "v1.0", "https://istqb.org/certifications/certified-tester-quality-in-devops-ct-qdo/"], ["CT-ATLaS", "Specialist Agile Test Leadership at Scale", "v2.0", "https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CT-ATLaS_Syllabus_v2.0.pdf"], ["CT-GenAI", "Specialist Testing with Generative AI", "v1.1", "https://cftl.fr/wp-content/uploads/2026/06/CT-GenAI-Syllabus-v1.1-FR.pdf"], ["TMMi", "Test Maturity Model integration, modèle cité par le syllabus Test Manager (1.5.2)", "", null]];
