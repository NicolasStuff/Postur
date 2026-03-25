# Runbook d'exécution — HDS, RGPD santé, IA clinique, Factur-X et PDP pour Postur

## Objectif

Exécuter de manière réaliste la trajectoire de conformité de Postur sur les sujets qui ne peuvent pas être résolus par du code seul :

- qualification `données de santé`
- `HDS`
- gouvernance `RGPD santé`
- encadrement des fournisseurs IA
- trajectoire `Factur-X / réforme e-invoicing / PDP`

Ce document répond à deux questions :

1. `quoi faire`
2. `comment l'exécuter`

Il est volontairement orienté opération, avec un ordre de passage, des livrables attendus et des critères de sortie.

Base documentaire :

- ce runbook s'appuie sur la recherche préalable effectuée sur `CNIL`, `RGPD`, `Code de la santé publique`, `ANS/HDS`, `impots.gouv.fr`, `FNFE-MPE` et `Légifrance`
- il reprend les dates et principes vérifiés au `24 mars 2026`
- il complète l'état réel du code de Postur tel qu'il existe aujourd'hui

---

## 1. Ce que la recherche implique pour Postur

## 1.1 Qualification des données

Pour Postur, la qualification prudente est la suivante :

- le produit gère un vrai dossier patient ostéopathique
- les notes, motifs, éléments cliniques, historiques et contenus de consultation doivent être traités comme des `données de santé`
- certaines données purement administratives ne sont pas des données de santé par nature, mais elles peuvent le devenir par contexte si elles révèlent la prise en charge

Conclusion pratique :

- Postur doit être gouverné comme un `SaaS santé`

## 1.2 HDS

La recherche menée en amont donne la règle pratique suivante :

- `HDS` est requis dès lors que des données de santé sont hébergées `pour le compte d'un tiers`
- pour un SaaS cloud opérant la plateforme, la base, les sauvegardes et potentiellement l'administration/exploitation, il faut partir du principe que le périmètre est `HDS`

Conclusion pratique :

- si Postur reste un SaaS en ligne pour ostéopathes, la trajectoire cible doit être `hébergement HDS`

## 1.3 Factur-X

La recherche menée en amont donne la règle suivante :

- `Factur-X` n'est pas l'obligation en soi
- l'obligation est la facturation électronique structurée via plateforme agréée / PDP selon le calendrier de la réforme
- pour les `PME/micro`, l'émission devient la vraie échéance à partir du `1er septembre 2027`
- un simple PDF ne suffit pas
- un produit sérieux doit viser `BASIC` ou `EN16931`, pas `MINIMUM`

Conclusion pratique :

- Postur peut préparer dès maintenant la structure facture
- mais ne doit pas promettre une conformité complète tant qu'il n'y a pas `PDP + validation + PDF/A-3 + XML embarqué`

## 1.4 IA clinique

La recherche et l'état du code impliquent :

- les fonctions IA actuelles manipulent des données de consultation
- elles ne doivent pas être traitées comme une simple feature “productivité”
- elles exigent un cadrage fournisseur, transfert, rétention, contractualisation et information utilisateur

Conclusion pratique :

- l'IA doit rester `bêta encadrée` tant que le cadre contractuel n'est pas verrouillé

---

## 2. Ce qui est déjà fait dans le code

À la date de ce runbook, le repo implémente déjà :

- un début d'isolation entre surfaces marketing et surfaces santé
- un audit applicatif minimal
- un garde `IA bêta`
- une minimisation des coordonnées patient sur facture
- des fondations de structuration facture pour préparer Factur-X

Cela veut dire :

- la base technique commence à être alignée
- le blocage principal est désormais `infra + juridique + gouvernance + fournisseurs`

---

## 3. Ordre d'exécution recommandé

Exécuter les chantiers dans cet ordre :

1. `geler les promesses commerciales excessives`
2. `cartographier les traitements et les flux`
3. `statuer sur le périmètre HDS`
4. `sortir une AIPD/DPIA`
5. `verrouiller les fournisseurs IA`
6. `choisir une stratégie PDP / Factur-X`
7. `mettre en production conforme par étapes`

Pourquoi cet ordre :

- il évite de lancer des engagements commerciaux ou fournisseurs sur une base floue
- il sécurise d'abord le périmètre santé
- il limite le risque de “faire du code dans le vide”

---

## 4. Chantier A — Geler les promesses commerciales excessives

## Objectif

Ne pas publier de message commercial juridiquement trop fort par rapport à l'état réel du produit et de l'hébergement.

## Ce qui doit être vrai avant de dire “oui”

### Pour `HDS`

Ne dire `HDS` dans le marketing que si :

- le ou les prestataires pertinents sont effectivement certifiés
- le périmètre certifié couvre ce que Postur opère réellement
- l'environnement de production concerné est bien dans ce périmètre

### Pour `Factur-X conforme`

Ne dire `Factur-X conforme` que si :

- le document est bien généré en `PDF/A-3`
- le XML `CII` est bien embarqué
- le profil cible est validé
- la chaîne de validation est opérationnelle
- la stratégie `PDP` est définie si tu revendiques plus qu'un simple export préparatoire

## Exécution

1. lister toutes les pages, écrans, emails et decks commerciaux
2. repérer chaque mention :
   - HDS
   - conformité RGPD santé
   - Factur-X
   - réforme 2026/2027
3. classer chaque mention :
   - `vrai aujourd'hui`
   - `vrai sous conditions`
   - `trop fort / à corriger`
4. corriger en priorité les surfaces publiques

## Livrable

- un tableau de claims marketing avec colonne :
  - `claim`
  - `surface`
  - `statut`
  - `correction`

## Critère de sortie

- plus aucune promesse publique supérieure au niveau réel de conformité

---

## 5. Chantier B — Cartographier les traitements et les flux

## Objectif

Produire la base factuelle nécessaire pour l'AIPD, le HDS, les contrats et les décisions produit.

## Exécution détaillée

### 5.1 Construire l'inventaire des données

Créer un tableau “champ / usage / destination / niveau de sensibilité”.

Colonnes minimales :

- `zone produit`
- `donnée`
- `exemple`
- `catégorie`
- `donnée de santé ?`
- `base / table / fichier`
- `qui y accède`
- `fournisseur tiers impliqué`
- `durée de conservation`

Lignes minimales à couvrir :

- compte praticien
- agenda
- fiche patient
- consultation
- body chart
- historique consultation
- audio de consultation
- transcript
- SOAP draft
- compte-rendu patient IA
- facture
- paiement Stripe
- logs d'audit
- logs techniques

### 5.2 Cartographier les flux

Créer ensuite un schéma simple :

- navigateur → app
- app → base
- app → Stripe
- app → OpenAI
- app → Deepgram
- app → hébergement / sauvegarde / logs

Pour chaque flèche :

- type de données
- finalité
- localisation estimée
- rôle : responsable / sous-traitant

### 5.3 Cartographier les accès humains

Lister :

- admins produit
- support
- développeurs
- prestataires infra

Pour chacun :

- accès réel
- accès théorique
- justification métier

## Livrables

- `registre flux & données`
- `schéma d'architecture données`
- `matrice des accès`

## Critère de sortie

- toute donnée sensible a un propriétaire, une finalité, un lieu, un fournisseur et une durée

---

## 6. Chantier C — Décision HDS et trajectoire d'hébergement

## Objectif

Décider clairement si Postur reste un SaaS santé cloud et, si oui, basculer vers une trajectoire HDS.

## Décision à prendre

Question de gouvernance :

- `Postur reste-t-il un SaaS santé complet hébergé pour compte de praticiens ?`

Si `oui` :

- l'objectif cible doit être `HDS`

## Exécution détaillée

### 6.1 Inventorier l'infra actuelle

Lister noir sur blanc :

- hébergeur app
- hébergeur base
- sauvegardes
- monitoring
- stockage fichiers
- environnements dev / staging / prod
- accès shell / console / base

### 6.2 Identifier le périmètre à certifier

Demande à poser pour chaque prestataire :

- êtes-vous certifié `HDS` ?
- quel est le périmètre exact du certificat ?
- l'exploitation / administration / sauvegarde sont-elles couvertes ?
- quels services exacts sont couverts ?
- dans quelle région / pays sont hébergées les données ?

### 6.3 Construire la cible

La cible minimale doit couvrir :

- application
- base de données
- sauvegardes
- logs contenant potentiellement des données perso
- accès d'administration si ceux-ci permettent l'accès aux données

### 6.4 Politique environnement

Décision stricte à formaliser :

- pas de données réelles en `dev`
- pas de données réelles en `staging` hors périmètre validé
- usage de données anonymisées ou synthétiques pour les tests

## Livrables

- tableau des prestataires avec colonne `HDS oui/non/périmètre`
- décision d'architecture cible
- plan de migration infra

## Critère de sortie

- chaque composant hébergeant des données de santé a un statut clair

## Points de vigilance

- “hébergé en France” ne veut pas dire `HDS`
- “le cloud sous-jacent est certifié” ne suffit pas à lui seul si Postur opère d'autres briques hors périmètre

---

## 7. Chantier D — AIPD / DPIA et gouvernance RGPD santé

## Objectif

Passer d'un produit techniquement prometteur à un traitement gouverné.

## Exécution détaillée

### 7.1 Ouvrir une AIPD

L'AIPD doit couvrir au minimum :

- données patients
- notes cliniques
- audio / transcription
- IA clinique
- abonnements / facturation
- analytics / acquisition

### 7.2 Structure minimale de l'AIPD

Inclure :

- description du traitement
- finalités
- acteurs
- catégories de données
- base juridique à confirmer
- nécessité / proportionnalité
- risques pour les personnes
- mesures de réduction
- décision finale et risques résiduels

### 7.3 Registre des traitements

Créer une fiche par traitement :

- gestion compte praticien
- agenda / rendez-vous
- dossier patient
- consultation clinique
- facturation
- abonnement Stripe
- IA clinique
- mesure d'audience / Google Ads

### 7.4 Politique de conservation

Créer une matrice avec :

- `type de donnée`
- `durée`
- `justification`
- `suppression / anonymisation`

Minimum à décider :

- comptes inactifs
- logs techniques
- logs d'audit
- audio
- transcripts
- brouillons IA
- factures
- consultation clinique

### 7.5 Procédures

Rédiger au minimum :

- procédure d'exercice des droits
- procédure de violation de données
- procédure de revue des accès
- procédure de suppression / purge
- procédure d'ouverture de ticket support avec données sensibles

## Livrables

- `AIPD v1`
- `registre des traitements`
- `politique de conservation`
- `procédure incident`
- `procédure droits`

## Critère de sortie

- l'organisation peut expliquer, défendre et opérer les traitements, pas seulement les coder

---

## 8. Chantier E — Fournisseurs IA

## Objectif

Vérifier si `OpenAI` et `Deepgram` sont acceptables pour l'usage santé envisagé.

## Exécution détaillée

### 8.1 Construire la fiche fournisseur

Pour chaque fournisseur :

- service utilisé
- données envoyées
- finalité
- pays / régions de traitement
- durée de conservation
- réutilisation éventuelle
- garanties contractuelles
- DPA disponible ?

### 8.2 Questions obligatoires

Pour `OpenAI` et `Deepgram`, vérifier :

- rôle exact du fournisseur
- type de contrat disponible
- si les données sont réutilisées ou non
- la rétention
- le lieu de traitement
- les transferts hors UE
- les mesures de sécurité documentées

### 8.3 Décision d'usage

Décision recommandée tant que le cadre n'est pas signé :

- conserver l'IA en `bêta encadrée`
- ne pas la présenter comme fonctionnalité standard de conformité santé

### 8.4 Mesures temporaires

À maintenir tant que tout n'est pas validé :

- opt-in pro explicite
- minimisation des données envoyées
- audit des appels
- feature flag de coupure rapide

## Livrables

- une fiche de validation fournisseur par service IA
- une décision `go / no-go / beta only`

## Critère de sortie

- chaque fournisseur IA a un statut formel, pas implicite

---

## 9. Chantier F — Factur-X et PDP

## Objectif

Décider la cible produit réelle et exécuter la trajectoire réglementaire sans promesse excessive.

## Point de départ

La recherche préalable donne les repères suivants :

- réception e-invoicing : `1er septembre 2026`
- émission pour PME/micro : `1er septembre 2027`
- Factur-X est un des formats du socle
- une `PDP` est nécessaire dans la chaîne réglementaire

## Décision produit à prendre

Choisir entre :

- `Option A` : Postur fournit une facture structurée et un export préparatoire
- `Option B` : Postur fournit la chaîne complète de facturation électronique réglementaire

Recommandation réaliste :

- commencer par `Option A`
- préparer `Option B` après choix d'une PDP

## Exécution détaillée

### 9.1 Définir le niveau cible

Décider noir sur blanc :

- `BASIC` au minimum
- viser `EN16931` dès que le modèle B2B est suffisamment mature

### 9.2 Choisir une PDP

Demander à chaque PDP shortlistée :

- formats supportés
- profil Factur-X recommandé
- APIs disponibles
- gestion annuaire
- e-reporting
- sandbox et validation
- coûts
- SLA

### 9.3 Définir le périmètre fonctionnel

Questions à trancher :

- Postur émet-il pour les seuls indépendants B2C ?
- ou vise-t-il aussi les cas B2B ?
- faut-il traiter les acheteurs entreprises dès maintenant ?
- faut-il générer un fichier hybride téléchargeable avant intégration PDP ?

### 9.4 Préparer la validation

Avant toute promesse “conforme” :

- validation XSD
- validation Schematron
- vérification règles FR
- génération `PDF/A-3`
- embarquement XML dans PDF
- tests avec la PDP / sandbox

### 9.5 Archivage

Définir :

- quoi archiver
- où
- combien de temps
- avec quelles preuves

## Livrables

- décision produit `export préparatoire` vs `chaîne complète`
- shortlist PDP
- grille de comparaison PDP
- cahier de validation Factur-X

## Critère de sortie

- la roadmap Factur-X n'est plus un slogan, c'est une cible fonctionnelle signée

---

## 10. Plan d'exécution sur 30 jours

## Semaine 1

- geler les claims
- finir l'inventaire des données
- cartographier les flux
- ouvrir l'AIPD
- demander les documents fournisseurs IA
- ouvrir la shortlist PDP

## Semaine 2

- statuer sur le périmètre HDS cible
- qualifier les environnements
- rédiger registre des traitements
- rédiger politique de conservation
- obtenir les premiers retours PDP

## Semaine 3

- décider la stratégie infra cible
- décider le statut de l'IA : beta only ou go encadré
- décider la cible Factur-X : export ou chaîne complète
- finaliser procédures incidents / droits / accès

## Semaine 4

- formaliser le plan de migration HDS
- choisir la PDP
- figer la backlog conformité produit
- mettre à jour les textes commerciaux et contractuels

---

## 11. Checklist de pilotage

- [ ] inventaire des données terminé
- [ ] cartographie des flux terminée
- [ ] matrice d'accès terminée
- [ ] AIPD ouverte
- [ ] registre des traitements créé
- [ ] politique de conservation définie
- [ ] procédure incident définie
- [ ] périmètre HDS cible décidé
- [ ] prestataires HDS identifiés
- [ ] statut OpenAI validé ou restreint
- [ ] statut Deepgram validé ou restreint
- [ ] shortlist PDP établie
- [ ] niveau Factur-X cible décidé
- [ ] wording commercial aligné

---

## 12. Références officielles

- CNIL — Qu'est-ce qu'une donnée de santé :  
  [https://www.cnil.fr/fr/quest-ce-ce-quune-donnee-de-sante](https://www.cnil.fr/fr/quest-ce-ce-quune-donnee-de-sante)

- CNIL — Formalités pour les traitements de données de santé :  
  [https://www.cnil.fr/fr/quelles-formalites-pour-les-traitements-de-donnees-de-sante](https://www.cnil.fr/fr/quelles-formalites-pour-les-traitements-de-donnees-de-sante)

- RGPD — définition des données concernant la santé, article 4(15) et considérant 35 :  
  [https://eur-lex.europa.eu/eli/reg/2016/679/2016-05-04](https://eur-lex.europa.eu/eli/reg/2016/679/2016-05-04)

- Code de la santé publique — article L1111-8 :  
  [https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049577902](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049577902)

- Code de la santé publique — article R1111-9 :  
  [https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036658481](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036658481)

- ANS — HDS :  
  [https://esante.gouv.fr/produits-services/hds](https://esante.gouv.fr/produits-services/hds)

- impots.gouv.fr — réforme facturation électronique :  
  [https://www.impots.gouv.fr/professionnel/je-passe-la-facturation-electronique](https://www.impots.gouv.fr/professionnel/je-passe-la-facturation-electronique)

- impots.gouv.fr — calendrier 2026/2027 :  
  [https://www.impots.gouv.fr/professionnel/questions/partir-de-quand-suis-je-concerne-par-la-reforme-de-la-facturation](https://www.impots.gouv.fr/professionnel/questions/partir-de-quand-suis-je-concerne-par-la-reforme-de-la-facturation)

- impots.gouv.fr — spécifications externes B2B :  
  [https://www.impots.gouv.fr/specifications-externes-b2b](https://www.impots.gouv.fr/specifications-externes-b2b)

- FNFE-MPE — Factur-X :  
  [https://fnfe-mpe.org/factur-x/](https://fnfe-mpe.org/factur-x/)

- FNFE-MPE — implémenter Factur-X :  
  [https://fnfe-mpe.org/factur-x/implementer-factur-x/](https://fnfe-mpe.org/factur-x/implementer-factur-x/)

---

## 13. Notes Postur

Ce runbook part de l'hypothèse produit suivante :

- Postur n'est pas un simple site vitrine
- Postur opère un vrai SaaS métier
- les données consultation / historique / IA impliquent une trajectoire santé

Si tu réduis le produit à un simple agenda + facturation administrative sans dossier clinique :

- le niveau d'exigence HDS peut changer
- mais il faut alors le décider explicitement et simplifier le produit en conséquence
