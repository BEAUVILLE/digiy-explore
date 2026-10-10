/* EXPLORE V24 — contrat propriétaire côté navigateur.
 * Le serveur reste l'autorité pour le compte, les disponibilités et les RDV.
 * Aucune écriture n'est déclenchée automatiquement par ces helpers.
 */
(function(root){
 'use strict';
 const STATUS=Object.freeze(['available','limited','unavailable','to_confirm']);
 const LEGACY=Object.freeze({reservation:'limited',full:'unavailable',closed:'unavailable'});
 const URL_BASE='https://resa-table-resto.digiylyfe.com/planning.html?slug=';
 const SLUG=/^[a-z0-9][a-z0-9_-]{1,149}$/;
 const KNOWN_LINK_TYPES=Object.freeze(['website','maps','booking']);
 function normalizeAvailability(input){
  const raw=String(input??'').trim().toLowerCase();
  if(!raw)return '';
  const v=LEGACY[raw]||raw;
  return STATUS.includes(v)?v:'';
 }
 function profileAllowsLink({place,profile,user}={}){
  if(!place||!profile||!user?.id)return false;
  if(place.auth_user_id!==user.id||profile.auth_user_id!==user.id)return false;
  if(place.slug!==profile.slug||!SLUG.test(String(profile.slug||'')))return false;
  return place.is_active===true && profile.is_active===true;
 }
 function approvedBookingUrl(slug){
  if(!SLUG.test(String(slug||'')))return null;
  return URL_BASE+encodeURIComponent(slug);
 }
 function unmanagedLinks(place){
  const a=Array.isArray(place?.external_links)?place.external_links:[];
  return a.filter(x=>!x||typeof x!=='object'||!KNOWN_LINK_TYPES.includes(String(x.type||'').toLowerCase()));
 }
 root.DIGIYExploreOwnerV24=Object.freeze({STATUS,normalizeAvailability,profileAllowsLink,approvedBookingUrl,unmanagedLinks});
})(typeof window!=='undefined'?window:globalThis);
