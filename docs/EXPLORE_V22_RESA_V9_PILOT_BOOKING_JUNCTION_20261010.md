# EXPLORE V22 — dernière jonction RÉSA V9, pilotée par le serveur

**10 octobre 2026.** La fiche EXPLORE ne doit pas confondre **planning consulté** et **rendez-vous créé**.

## Incident de parcours corrigé

Avant cette PR, le lien EXPLORE validé vers
`https://resa-table-resto.digiylyfe.com/planning.html?slug=...`
permettait de **lire** les disponibilités de `digiy_resa_public_week_v1`
et d'envoyer une demande directe, mais ne menait **jamais**
à la création d'un RDV sécurisé V9.

Même si V9 était ultérieurement activée, la fiche EXPLORE continuait à
présenter l'ancienne voie : la jonction métier était incomplète.

## Nouveau comportement public

Pour les **seules fiches EXPLORE réelles, actives, publiées** avec un
lien RÉSA HTTPS explicite et approuvé, `explore-resa-public-bridge.js` :

1. Interroge `digiy_resa_universal_pilot_gate_v1` à partir du slug RÉSA
   du lien **sans inférer une correspondance avec le slug EXPLORE**.
2. Si le serveur confirme `ok=true`, `enabled=true`,
   un slug strictement identique et `Africa/Dakar`, lit
   `digiy_resa_universal_public_options_v1` pour **les vrais services
   et créneaux compatibles publiés**.
3. Si de vrais créneaux sont présents, affiche un bouton
   **« Poser mon rendez-vous · Paiement sur place »** qui conduit à
   `https://resa-table-resto.digiylyfe.com/rdv-universel.html?slug=...`.
   Le bouton historique `bookingBtn` est mis à jour dans le même cas.
   **Seul le formulaire RÉSA avec confirmation serveur du `pending`
   peut ensuite afficher « RDV posé ».** La fiche ne crée jamais
   directement de réservation et n'appelle ni une écriture PAY ni une
   méthode propriétaire.
4. Si V9 est absente, refusée ou OFF, reprend
   `digiy_resa_public_week_v1`, le planning historique et la
   demande WhatsApp. Aucune activation locale de pilote par query string.
5. Si V9 est ON mais la lecture des vraies options échoue, ne revient
   pas à une voie trompeuse : annonce indisponibilité et masque le CTA.
6. Si aucun service réellement compatible n'existe, aucun CTA de
   rendez-vous n'est présenté.
7. Les anciennes fiches de services sans lien RÉSA continuent le
   contact direct déjà fusionné en V20.

## Préflight DIGIY CORE en lecture seule (10/10/2026)

- PostgreSQL **17.6**, base `postgres`, RLS réservation activée.
- **7 réservations historiques**, toutes `pending` ou `confirmed`,
  **0 chevauchement** ; politique UPDATE propriétaire conforme à
  `auth.uid()`, ancienne RPC booking présente.
- **0 profil universel**, **0 slot universel**, 8 services ; aucun
  professionnel activement publié.
- Fonction historique du déclencheur PAY présente et toujours active
  (la migration V9 l'adapte pour éviter une recette fictive).
- `btree_gist` absent, attendu : la migration V9 l'installe.
- Fonctions `digiy_resa_universal_* ` et table de pilote **absentes**.
- Archive chiffrée #78 **restaurée réellement** en privé avec LOC
  82/82, RESTO 4 sites, RLS 6/6 et ACL 0/3 sur 3 RPC propriétaires.
  La preuve du ZIP ne réalise **pas** une connexion Auth A/B RÉSA.

## Déploiement et limite

Cette PR EXPLORE ne change **aucune** table, RPC ou permission Supabase et ne
publie aucun pilote. Elle est utilisable sans la migration V9 :
l'ancien parcours est inchangé jusqu'à confirmation du serveur.

Le déploiement de
[RÉSA V9](https://github.com/BEAUVILLE/digiy-resa-table-resto/blob/main/docs/RESA_V9_PRODUCTION_RELEASE_GATE_20261010.md)
reste subordonné aux **tests A/B avec de vrais comptes Auth indépendants
autorisés**, au BAT du professionnel de Saly, au préflight et à
l'installation transactionnelle avec contrôle `enabled=false`.
Ne créer aucune identité client fictive sur la production.

**Doctrine :** direct client/pro, paiement sur place, zéro commission,
aucun logiciel de caisse imposé.
