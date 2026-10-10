# EXPLORE → RÉSA V9 · Espace rendez-vous propriétaire gardé

**10 octobre 2026.** Une seule expérience professionnelle, sans confondre le calendrier terrain EXPLORE et une réservation RÉSA confirmée.

## Contrôles réalisés directement sur DIGIY CORE

- RÉSA V9 PR [#34](https://github.com/BEAUVILLE/digiy-resa-table-resto/pull/34) fusionnée ; tests PG17 isolés réussis.
- Au dernier pointage du 10/10, fonctions `digiy_resa_universal_request_v0`, `public_options_v1`, `owner_manage_v2`, `request_v1` et table launch-controls **absentes de la production**.
- 7 réservations historiques RÉSA ; 0 profil universel / 0 créneau / 8 services ; déclencheur historique PAY toujours actif.
- Sauvegarde chiffrée #78 restaurée avec LOC 82/82 et RESTO 4 sites et droits propriétaires `anon=0/3`. **Cette preuve ne porte pas à elle seule sur l'authentification de deux propriétaires RÉSA distincts**.
- RPC `digiy_resa_public_week_v1(text,date)` déjà exposée en lecture à `anon`. EXPLORE PR #19/#20 déjà fusionnées ; les vrais créneaux apparaissent uniquement avec lien RÉSA publié explicitement ; anciens services = contact direct sans créneau inventé.
- EXPLORE dispose du calendrier terrain propriétaire (`digiy_explore_owner_calendar_v1`) mais ce calendrier n'est **pas** une réservation RÉSA. On ne le synchronise pas de manière automatique.

## Ce que livre cette PR, sans déploiement SQL

**Fichier :** `explore-resa-owner-bridge.js`, chargé uniquement depuis `gestion-explore-v2.html`.

1. L'accès au nouveau panneau « Mes rendez-vous RÉSA » n'est autorisé qu'après **magic-link Auth + verrou téléphone MFA existant + lecture propriétaire réelle du lieu EXPLORE**. Les autres panneaux de gestion EXPLORE ne chargent plus leurs calendriers avant cette validation.
2. Le slug EXPLORE n'est jamais considéré égal au slug RÉSA. Un lien `booking`/`resa` doit pointer vers le chemin HTTPS exact du planning RÉSA public ; query `slug` unique sans token, redirection ni paramètre secret.
3. La lecture des clients attend un profil RÉSA actif avec **`auth_user_id` identique au compte de la session**. Le serveur applique toujours RLS `auth.uid()` en plus de cette vérification UI.
4. Tant que les RPC V9 sont absentes ou que le rapprochement propriétaire n'est pas confirmé, le panneau annonce la limite et **n'interroge pas les réservations privées**.
5. Une fois le serveur V9 réellement en place, seules les nouvelles réservations identifiées par `client_request_id IS NOT NULL` peuvent être listées via `digiy_resa_bookings` sous RLS, dans la limite des 50 prochains rendez-vous. Les anciennes réservations ne sont pas modifiées.
6. Les changements de statut (`pending→confirmed/cancelled`, `confirmed→done/no_show/cancelled`) et notes privées empruntent **uniquement la RPC V5** `digiy_resa_universal_owner_manage_v2`. Aucun INSERT client, aucune recette automatique, aucune clé serveur.
7. Lien externe public RÉSA affiché uniquement après validation de l'identité RÉSA propriétaire ; il ne transmet aucun jeton ni paramètre propriétaire.
8. L'écran reste utilisable en l'absence de planning RÉSA : calendrier terrain EXPLORE conservé, pas de fausse disponibilité ni commande.

Tests CI Node 22 : identité absente, absence de lien, URL frauduleuse, propriétaire B refusé, RPC V9 absente, liste et transitions V5, refus de lecture privée, fuseau Africa/Dakar et préservation de la fiche publique historique.

## Porte V9 — ce qui reste à faire

La [migration SQL V9](https://github.com/BEAUVILLE/digiy-resa-table-resto/blob/main/sql/production/20261010_resa_universal_v0_v2_v5_v8_GATED.sql) **n'a pas été installée sur DIGIY CORE** par cette PR. Son runbook exige avant toute installation :

- un test **Auth A/B réel** de deux comptes distincts dans un environnement autorisé, pas une simulation par `set_config` ;
- validation BAT propriétaire du premier professionnel réel et cohérence de son compte Auth ;
- préflight des 7 dossiers historiques / droits / déclencheur PAY ;
- approbation séparée de l'opération de migration ;
- après installation, activation OFF et tests avant tout RDV public ;
- France hors du pilote RÉSA universel tant que les fuseaux/DST ne sont pas couverts.

**État attendu après fusion de cette PR :** propriétaire EXPLORE dispose d'une interface prête pour RÉSA V9, mais tant que V9 est absente, il lit « RÉSA V9 n'est pas encore installé » ou « Aucun planning relié ». Aucun faux RDV et aucune recette ne sont générés.

**Doctrine :** contact humain direct, paiement au professionnel, zéro commission, CARNET PRO facultatif, sans logiciel de caisse.
