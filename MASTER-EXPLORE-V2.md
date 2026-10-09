# MASTER MAÎTRE DIGIY EXPLORE — V2

## Rôle
Moule universel DIGIYLYFE pour les lieux, activités, expériences, restaurants, spots, hébergements et acteurs touristiques visibles dans EXPLORE.

EXPLORE reste une **présence locale / guide terrain direct**.  
Ce MASTER ne devient ni une OTA, ni un logiciel de réservation, ni un gestionnaire touristique, ni une caisse, ni un système de paiement DIGIYLYFE.

## Doctrine
- découverte locale puis contact direct ;
- paiement direct au professionnel ;
- 0 % commission DIGIYLYFE ;
- horaires, tarifs, disponibilités, conditions, réservations et prestations restent sous la responsabilité du professionnel ;
- DIGIYLYFE ne certifie pas les disponibilités et n’encaisse pas la prestation ;
- EXPLORE relie le besoin du visiteur au bon acteur du territoire.

## Autonomie propriétaire — magic link
Accès sans mot de passe :
1. bouton public discret **🔐 Accès propriétaire** ;
2. email du propriétaire déjà autorisé dans Supabase Auth ;
3. `signInWithOtp` avec `shouldCreateUser:false` ;
4. redirection vers `gestion-explore-v2.html` ;
5. RLS propriétaire par `auth_user_id = auth.uid()`.

Le professionnel peut modifier seulement :
- ses horaires du moment ;
- son tarif indicatif ;
- son statut de disponibilité ;
- une courte note d’actualité / disponibilité.

## Héritage automatique des anciennes fiches EXPLORE (correctif 9 octobre 2026)

**Une fiche publiée antérieurement bénéficie du modèle commun `fiche-core.html` sans devoir être recréée.** Cependant, la réservation automatique n'est pas activée par héritage : l'absence de lien `external_links` RÉSA et de créneau publiés doit rester visible honnêtement.

**Deux parcours sur la même section client :**

- **Planning RÉSA validé et publié** : afficher seulement les créneaux réels renvoyés par la RPC autorisée, puis renvoyer au planning RÉSA ; la consultation seule ne vaut pas confirmation.
- **Ancienne fiche de service réelle, active et publiée, sans planning RÉSA** : si la fiche porte son **propre contact téléphonique/WhatsApp public valide**, afficher « Demander une disponibilité » menant **directement au professionnel**. Aucune fausse heure, aucun engagement de disponibilité et aucune RPC de réservation. Exemple contrôlé en lecture seule : `sortie-peche-jb-baptiste-760a00ad`, profil publié avec téléphone réel et zéro lien RÉSA.
- **Pas de profil actif, site de démonstration, coordonnées professionnelles manquantes ou catégorie hors services/activités** : masquer ce CTA ; ne jamais basculer automatiquement vers un téléphone de secours ou un faux agenda. Les moteurs RESTO, LOC et DRIVER restent spécialisés.

Le lien direct du professionnel est construit à partir du numéro **public de sa fiche** et non d'une clé d'administration, d'une adresse propriétaire ou d'un contact DIGIYLYFE générique. Les nouveaux professionnels et les anciens partagent ainsi le même parcours sans migration des fiches ni des photos/QR.

Ce correctif est uniquement **une amélioration du parcours de prise de contact** tant que la transaction SQL RÉSA n'est pas activée. Il ne crée aucune prestation, réservation, évaluation ou disponibilité en production.

## Extension EXPLORE → RÉSA MULTI : rendez-vous visibles sans moteur concurrent

**Doctrine validée le 9 octobre 2026 :** EXPLORE est la porte de découverte, la fiche met les prestations en valeur et **un vrai planning RÉSA peut apparaître directement sur la fiche**. Le client consulte des heures réellement ouvertes, puis choisit dans le planning RÉSA. Le professionnel garde la maîtrise de ses horaires, de ses prestations et de la confirmation. EXPLORE ne gère **aucune réservation, aucun paiement, aucune note client et aucun accès propriétaire RÉSA**.

**La semaine EXPLORE existante** (`digiy_explore_public_calendar_v1`) décrit la disponibilité *terrain* et ne constitue pas un agenda de rendez-vous. **La section RÉSA supplémentaire** interroge en lecture seule `digiy_resa_public_week_v1` (profil actif et publié, créneaux réellement ouverts), avec heure et date affichées, sans inventer de disponibilités.

### Activation métier ciblée, sans lien arbitraire

- Un administrateur valide explicitement, dans les liens publics de la fiche EXPLORE (`external_links`), un lien de type `resa` ou `booking` vers `https://resa-table-resto.digiylyfe.com/planning.html?slug=SLUG_RESA`. Le slug EXPLORE et le slug RÉSA **ne sont pas supposés identiques** ; on n'invente aucune association par simple ressemblance de noms.
- Le navigateur accepte **uniquement** ce domaine HTTPS exact et ce chemin public, avec `slug` au format attendu, sans token, redirect, paramètre privé ou lien propriétaire.
- Après confirmation via la RPC **publique en lecture seule**, EXPLORE affiche seulement les horaires réellement ouverts, avec CTA « Voir le planning et choisir un créneau ». S'il n'y a pas de profil RÉSA publié, de lien administrateur ou si la RPC échoue, **pas de planning ni de CTA fictifs**.
- Un planning actif mais sans disponibilité affiche « Aucun rendez-vous disponible publié » ; le **contact direct reste présent**.
- **Attention :** `planning.html` permet aujourd'hui de choisir et contacter, **pas d'affirmer une réservation enregistrée ou confirmée**. La vraie réservation automatique universelle est encore en SQL candidat isolé ; ne jamais promettre son activation sur EXPLORE.
- **RESTO, LOC, DRIVER et autres métiers spécialisés** conservent leurs moteurs de réservation propres ; un lien de réservation métier externe éventuel n'est pas interprété comme un planning RÉSA commun.
- La fiche publique garde QR, photos, contacts, magic-link propriétaire, PWA et huit langues existantes. Aucun champ propriétaire ni secret ne doit apparaître dans l'URL publique. L'atelier reste libre de ses périodes de fermeture et d'absence.

### Valeur pour le professionnel

**« Votre fiche EXPLORE vous rend visible. Lorsque votre planning RÉSA est activé et publié, les clients peuvent voir vos disponibilités et choisir eux-mêmes un créneau, sans échanges inutiles. »**

Ce module est une **passerelle de lecture et de communication**, pas une deuxième base de rendez-vous. Avant un BAT client/pro réel et la généralisation, contrôler lien administrateur, isolation des professionnels, heures/fuseaux métiers, mobile, droits RPC, absence de faux slots et confirmation chez le professionnel.

Fichiers : `fiche-core.html`, `explore-resa-public-bridge.js` et `explore-resa-public-bridge.test.cjs`. Aucun SQL ni donnée réelle modifiés par ce portage.

## Limites validées
- pas de gestion ou de confirmation de réservation **dans EXPLORE** : uniquement consultation et lien vers le planning RÉSA spécialisé ;
- pas de calendrier **transactionnel propre à EXPLORE** : calendrier terrain conservé, planning horaire RÉSA externe en lecture seule ;
- pas de caisse ;
- pas de paiement DIGIYLYFE ;
- pas de modification propriétaire du nom, de la catégorie, de la ville, des photos, de la publication ou de la vérification ;
- aucune promesse automatique de disponibilité.

## Backend retenu
Réutilisation de `public.digiy_explore_places`.

Champs propriétaire V2 :
- `auth_user_id`
- `slug`
- `hours`
- `price_hint`
- `availability_status`
- `availability_note`
- `availability_updated_at`

Champs publics nécessaires au MASTER V2 :
- `slug`
- `public_name`
- `category_code`
- `subcategory`
- `short_description`
- `city`
- `zone`
- `address_text`
- `phone`
- `whatsapp`
- `cover_url`
- `photo_urls`
- `tags`
- `price_hint`
- `hours`
- `availability_status`
- `availability_note`
- `is_published`
- `status`
- `is_active`

Aucune nouvelle table n’est nécessaire.

## Sécurité
- clé publishable uniquement dans le navigateur ;
- aucun `service_role` ;
- RLS déjà active ;
- lecture publique filtrée par la policy existante `is_published=true AND status='published'` ;
- accès propriétaire par `auth_user_id = auth.uid()` ;
- UPDATE limité aux 5 colonnes opérationnelles du MASTER ;
- `USING` + `WITH CHECK` sur la policy UPDATE ;
- aucun droit propriétaire sur identité, slug, catégorie, publication ou statut administratif.

## Langues
FR · EN · ES · PT · IT · DE · NL · AR.  
RTL automatique pour l’arabe.

## Règle atelier
1. Le public EXPLORE actuel reste intact pendant la préparation.
2. Le MASTER V2 vit dans `atelier-master-explore-v2`.
3. `siteSlug="__MASTER__"` implique mode MASTER et `noindex,nofollow`.
4. Une instance configure seulement `siteSlug`.
5. Ne jamais inventer horaires, prix ou disponibilité.
6. Tester magic link, retour fiche, RLS, horaires, tarif indicatif, disponibilité, note, WhatsApp, mobile, 8 langues et RTL.
7. Publier seulement après validation humaine.

## Fichiers V2
- `master-v2.html`
- `gestion-explore-v2.html`
- `supabase/master-explore-v2-owner-rls.sql`
