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

## Limites validées
- pas de gestion de réservation dans EXPLORE ;
- pas de calendrier lourd ;
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
