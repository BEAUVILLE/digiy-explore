# EXPLORE × RÉSA × DIGIY TRUST — verrou de recette V32

Date : 10 octobre 2026. Pilote initial : `sortie-peche-jb-baptiste-760a00ad` (Saly). Cette PR est **une étape de préparation et de visibilité**, pas une activation d'avis.

## État vérifié de DIGIY CORE
- Le professionnel pilote possède une prestation « Sortie pêche » de 240 minutes, tarif sur demande, actuellement en brouillon.
- Trois créneaux ont été enregistrés pour les 10, 11 et 12 octobre 2026, de 09 h à 13 h. Le contrôle serveur RÉSA reste `enabled=false`, le profil RÉSA `is_published=false`; zéro réservation.
- Aucune note TRUST vérifiée liée à ce pilote n'a été établie. L'UI ne doit jamais inférer une évaluation ou une moyenne de ces créneaux.
- Les tables historiques `public.digiy_reviews` et `public.listing_reviews` existent et sont vides au contrôle du 10/10. Elles ne sont **pas** le contrat DIGIY TRUST et ne doivent pas être réutilisées sans audit de sécurité, anti-doublon et provenance.

## Chaîne d'attestation obligatoire avant tout avis
1. RÉSA enregistre un rendez-vous **client réel** avec une identité de demande vérifiable ; `pending` et `confirmed` ne prouvent rien sur la réalisation.
2. Le professionnel peut marquer `done`, mais cet état **seul n'est pas une attestation indépendante** ; aucun déclencheur SQL ne doit créer une note, une preuve ou un revenu.
3. Le client doit être authentifié indépendamment (OTP ou autre méthode validée). Interdire propriétaire évaluant sa propre prestation et demandes en doublon.
4. Une preuve de prestation réellement effectuée doit être validée côté serveur par une politique indépendante et spécifique au métier RÉSA/EXPLORE. Cette vérification n'est pas fournie par un simple QR, lien, statut `done`, paiement déclaré ou clic.
5. Un serveur habilité délivre, uniquement après attestations, une invitation unique, expirante, consommée atomiquement. Aucune clé de gestion ni preuve privée ne transite par les pages publiques.
6. Le client pourra attribuer **1 à 5 étoiles** sur des critères métier applicables, dont **rapport qualité-prix obligatoire et distinct** : valeur perçue de la prestation, pas classement du prix le plus bas. Axes selon métier : ponctualité, qualité, accueil, disponibilité, proximité, suivi/fidélité.
7. Pas de commentaire public. Modération non discriminatoire, droit de contestation, consentement applicable, protection des données, limitation de conservation et anti-abus.
8. Seules des notes autorisées, de prestations réellement attestées, alimenteront moyenne globale et détail par critère. Zéro note = message neutre, jamais étoiles ou avis de démonstration.

## Verrous de déploiement
- La filière TRUST LOC a des contrats et tests séparés dans `BEAUVILLE/digiy-loc/trust`. Ne pas la généraliser à EXPLORE avant validation de LOC.
- Le rôle serveur V26 TRUST a été bloqué par les autorisations PUBLIC héritées; audit V27/V28 nécessaire. Ne pas élargir RLS ni contourner le préflight pour une démonstration.
- Cette PR ne crée ni RPC, ni droits, ni formulaire d'avis, ni invitation, ni taux d'étoiles fictifs.
- Tout bouton « Donner mon avis » et toute moyenne sont interdits avant pipeline complet : preuves indépendantes, stockage privé, RLS, revue des droits, anti-abus, consentement, tests A/B et déploiement autorisé.
- L'encart public sans notes et l'encart propriétaire de préparation peuvent être publiés **sans** ouvrir le processus de collecte.

## Recette terrain
- Propriétaire authentifié par magic-link + téléphone : consulter le catalogue et l'état TRUST « préparation ».
- Visiteur public : aucun lien de soumission d'avis, aucune étoile fabriquée, texte clair sur le rapport qualité-prix.
- Essai RÉSA : garde `enabled=false`, profil `is_published=false`, `bookings=0`.
- Ne passer à l'étape suivante qu'après validation de l'attestation indépendante de sortie pêche et de la sécurité TRUST de bout en bout.
