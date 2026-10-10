'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname);
const script=fs.readFileSync(path.join(root,'explore-owner-v24.js'),'utf8');
const manage=fs.readFileSync(path.join(root,'gestion-explore-v2.html'),'utf8');
const publicPage=fs.readFileSync(path.join(root,'fiche-core.html'),'utf8');
function setup(){
  const ctx={window:{}};
  vm.runInNewContext(script,ctx,{timeout:1000});
  return ctx.window.DIGIYExploreOwnerV24;
}
const place={slug:'sortie-peche-jb-baptiste-760a00ad',auth_user_id:'owner-a',is_active:true};
const profile={slug:place.slug,auth_user_id:'owner-a',is_active:true,is_published:true};
test('les statuts enregistrés correspondent exactement au CHECK PostgreSQL',()=>{
  const v=setup();
  assert.deepEqual(Array.from(v.STATUS),['available','limited','unavailable','to_confirm']);
  for(const value of v.STATUS)assert.equal(v.normalizeAvailability(value),value);
  assert.equal(v.normalizeAvailability('reservation'),'limited');
  assert.equal(v.normalizeAvailability('full'),'unavailable');
  assert.equal(v.normalizeAvailability('closed'),'unavailable');
  assert.equal(v.normalizeAvailability('booboo'),'');
  assert.equal(v.normalizeAvailability(''),'');
  assert.match(manage,/availability_status:window\.DIGIYExploreOwnerV24\.normalizeAvailability/);
});
test('le propriétaire et RÉSA doivent être le même compte réel et le profil publié',()=>{
  const v=setup();
  assert.equal(v.profileAllowsLink({place,profile,user:{id:'owner-a'}}),true);
  assert.equal(v.profileAllowsLink({place,profile,user:{id:'owner-b'}}),false);
  assert.equal(v.profileAllowsLink({place,profile:{...profile,auth_user_id:'owner-b'},user:{id:'owner-a'}}),false);
  assert.equal(v.profileAllowsLink({place,profile:{...profile,slug:'other-restaurant'},user:{id:'owner-a'}}),false);
  assert.equal(v.profileAllowsLink({place,profile:{...profile,is_published:false},user:{id:'owner-a'}}),false);
  assert.equal(v.profileAllowsLink({place:{...place,is_active:false},profile,user:{id:'owner-a'}}),false);
  assert.equal(v.profileAllowsLink({place,profile:null,user:{id:'owner-a'}}),false);
});
test('lien RÉSA seulement via slug canonique, sans token ni paramètres propriétaire',()=>{
 const v=setup();
 assert.equal(v.approvedBookingUrl(place.slug),
   'https://resa-table-resto.digiylyfe.com/planning.html?slug=sortie-peche-jb-baptiste-760a00ad');
 for(const slug of ['https://evil.invalid','x','../../etc/passwd','shop?token=1','',null])
  assert.equal(v.approvedBookingUrl(slug),null);
});
test('ne jamais écraser des liens métier existants inconnus',()=>{
 const v=setup();
 assert.equal(v.unmanagedLinks({external_links:[{type:'website',url:'https://digiylyfe.com'},{type:'maps',url:'https://maps.google.com'},{type:'booking',url:'https://resa-table-resto.digiylyfe.com'}]}).length,0);
 assert.equal(v.unmanagedLinks({external_links:[{type:'resa',url:'https://example.org'},{type:'menu',url:'https://digiylyfe.com'},{type:'driver'}]}).length,3);
 assert.equal(v.unmanagedLinks({}).length,0);
 assert.match(manage,/const unmanaged=window\.DIGIYExploreOwnerV24\.unmanagedLinks\(ownerPlace\)/);
});
test('aucune écriture ni authentification fictive dans le nouveau helper',()=>{
 assert.doesNotMatch(script,/\.update\s*\(|\.insert\s*\(|service_role|SUPABASE_DB_URL|\.rpc\s*\(/);
 assert.match(manage,/DIGIY_OWNER_PHONE_MFA\.guard/);
 assert.match(manage,/\.eq\("auth_user_id",cu\.id\)/);
 assert.match(manage,/is_active,is_published/);
 assert.match(manage,/discoverResaOwnerLink\(data,cu\)/);
 assert.match(manage,/Relier mon planning RÉSA vérifié/);
 assert.match(manage,/Aucun créneau ni réservation ne sera créé/);
});
test('DIGIY TRUST EXPLORE affiche zéro faux avis et uniquement sur les fiches publiques',()=>{
 assert.match(publicPage,/id="digiyTrustExploreStatus"/);
 assert.match(publicPage,/Aucune note vérifiée disponible/);
 assert.match(publicPage,/Le rapport qualité-prix est une catégorie distincte/);
 assert.match(publicPage,/vérifié indépendamment/);
 assert.match(publicPage,/sans commentaire public/);
 assert.match(manage,/id="trustOwnerCard"[^>]*hidden/);
 assert.match(manage,/\$\("trustOwnerCard"\)\.hidden=false/);
 assert.match(manage,/réservation RÉSA confirmée ou marquée/);
 assert.match(manage,/vérification indépendante du client/);
 assert.match(manage,/rapport qualité-prix<\/strong>/);
 assert.doesNotMatch(manage,/id="trustSubmit"|id="trustReviewForm"|digiy_trust_public_write/);
 assert.match(publicPage,/place\?\.is_active===true && place\?\.is_published===true/);
 assert.doesNotMatch(publicPage,/digiy_trust_public_write|trust_submitted/);
});
