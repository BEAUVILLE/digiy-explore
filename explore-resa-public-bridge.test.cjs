'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname);
const script=fs.readFileSync(path.join(root,'explore-resa-public-bridge.js'),'utf8');
const page=fs.readFileSync(path.join(root,'fiche-core.html'),'utf8');
class El{
 constructor(){this.hidden=true;this.href='';this.textContent='';this.children=[];}
 replaceChildren(...nodes){this.children=nodes}
 append(node){this.children.push(node)}
 removeAttribute(key){if(key==='href')this.href=''}
}
function setup(){
 const elIds=['resaAppointmentsSection','resaAppointmentsStatus','resaAppointmentsSlots','resaAppointmentsGo','resaAppointmentsIntro','bookingBtn'];
 const elements=Object.fromEntries(elIds.map(x=>[x,new El()]));
 const win={};const doc={getElementById(id){return elements[id]},createElement(tag){const n=new El();n.tag=tag;return n}};
 vm.runInNewContext(script,{window:win,document:doc,URL,Date,console},{timeout:2000});
 return {api:win.DIGIYExploreResa,elements};
}
const link=(slug='actif-pro-saly')=>({is_active:true,is_published:true,category_code:'service',external_links:[{type:'resa',url:'https://resa-table-resto.digiylyfe.com/planning.html?slug='+slug}]});
const week=(slug,day)=>({ok:true,slug,slots:[{date:day,time:'09:00',available:true},{date:day,time:'10:30',available:true},{date:day,time:'12:00',available:false}]});

test('source EXPlORE: pont sans écriture, transaction ou création d un rendez-vous',()=>{
 assert.doesNotThrow(()=>new vm.Script(script));
 assert.doesNotMatch(script,/digiy_resa_create_booking|digiy_resa_universal_request_v0|digiy_resa_resto_public_book_v1|\.insert\s*\(/);
 assert.match(script,/digiy_resa_public_week_v1/);
 assert.match(page,/DIGIYExploreResa\.mount\(place, slug, supabase\)/);
 assert.match(page,/<section class="panel" id="resaAppointmentsSection"/);
 assert.match(page,/#resaAppointmentsSection\[hidden\]/);
 assert.ok(page.indexOf('id="publicCalendar"')<page.indexOf('id="resaAppointmentsSection"'));
 assert.match(page,/consultation du planning ne confirme pas à elle seule une réservation/i);
});
test('aucune URL non approuvée, y compris RESTO/LOC/DRIVER ou URL avec token, ne permet un faux planning RÉSA',()=>{
 const {api}=setup();
 const bad=[
  {external_links:[]},
  {external_links:[{type:'booking',url:'https://resto.digiylyfe.com/resa-resto/index.html?site=pro'}]},
  {external_links:[{type:'resa',url:'https://resa-table-resto.digiylyfe.com.evil.test/planning.html?slug=pro'}]},
  {external_links:[{type:'resa',url:'https://resa-table-resto.digiylyfe.com/planning.html?slug=pro&owner_token=secret'}]},
  {external_links:[{type:'resa',url:'https://resa-table-resto.digiylyfe.com/gestion.html?slug=pro'}]},
  {external_links:[{type:'resa',url:'http://resa-table-resto.digiylyfe.com/planning.html?slug=pro'}]},
  {external_links:[{type:'resa',url:'https://resa-table-resto.digiylyfe.com/planning.html?slug=../../admin'}]}
 ];
 for(const place of bad)assert.equal(api.parseApprovedResaLink(place),null);
 assert.equal(api.parseApprovedResaLink(link()).slug,'actif-pro-saly');
});
test('sans lien explicite : pas de requête ni d affichage calendrier inventé',async()=>{
 const {api,elements}=setup();let calls=0;
 const s=await api.mount({slug:'sans-resa'},'sans-resa',{rpc:()=>{calls++;throw Error('should not call')}});
 assert.equal(s.shown,false);assert.equal(calls,0);
 assert.equal(elements.resaAppointmentsSection.hidden,true);
 assert.equal(elements.resaAppointmentsGo.hidden,true);
});
test('seuls les créneaux réellement disponibles de la semaine sont présentés et lien sûr vers RÉSA',async()=>{
 const {api,elements}=setup();const day=api.localDay(new Date());
 const site=link('actif-pro-saly');
 elements.bookingBtn.href='https://resa-table-resto.digiylyfe.com/planning.html?slug=actif-pro-saly';
 const db={rpc:async(name,args)=>{
  assert.equal(name,'digiy_resa_public_week_v1');
  assert.equal(args.p_slug,'actif-pro-saly');assert.equal(args.p_start_date,day);
  return {data:week('actif-pro-saly',day),error:null};
 }};
 const s=await api.mount(site,'explore-different-slug',db);
 assert.equal(s.shown,true);assert.equal(s.available,2);
 assert.equal(elements.resaAppointmentsSection.hidden,false);
 assert.equal(elements.resaAppointmentsGo.hidden,false);
 assert.equal(elements.resaAppointmentsGo.href,'https://resa-table-resto.digiylyfe.com/planning.html?slug=actif-pro-saly');
 assert.equal(elements.resaAppointmentsSlots.children.length,2);
 assert.equal(elements.bookingBtn.textContent,'📅 Voir les créneaux');
 assert.match(elements.resaAppointmentsStatus.textContent,/confirmation/);
});
test('RÉSA non publiée, erreur serveur et absence de créneaux ne créent pas un faux CTA',async()=>{
 const {api,elements}=setup();const day=api.localDay(new Date()),p=link();
 const absent=await api.mount(p,'my-place',{rpc:async()=>({data:{ok:false,error:'not_published'},error:null})});
 assert.equal(absent.shown,false);assert.equal(elements.resaAppointmentsSection.hidden,true);
 const failed=await api.mount(p,'my-place',{rpc:async()=>({error:{message:'no service'}})});
 assert.equal(failed.shown,false);assert.equal(elements.resaAppointmentsSection.hidden,true);
 const noSlots=await api.mount(p,'my-place',{rpc:async()=>({data:{ok:true,slug:'actif-pro-saly',slots:[{date:day,time:'09:00',available:false}]}})});
 assert.equal(noSlots.shown,true);assert.equal(noSlots.available,0);
 assert.equal(elements.resaAppointmentsGo.hidden,true);
 assert.match(elements.resaAppointmentsStatus.textContent,/Aucun rendez-vous disponible/);
});
test('slots hors 7 jours, données incorrectes et nom pro inconnu sont exclus',()=>{
 const {api}=setup();const day=api.localDay(new Date());const invalid=api.parsePublishedSlots({ok:true,slug:'z',slots:[{date:day,time:'25:99',available:true}]},'z',day);
 assert.equal(invalid.length,0);
 assert.equal(api.parsePublishedSlots({ok:true,slug:'y',slots:[]},'z',day),null);
 const out=api.parsePublishedSlots({ok:true,slug:'z',slots:[{date:'1999-01-01',time:'09:00',available:true},{date:day,time:'09:00',available:true}]},'z',day);
 assert.equal(out.length,1);
});

test('ancienne fiche pêche : héritage automatique de la demande directe sans agenda RÉSA',async()=>{
 const {api,elements}=setup();
 const oldPublicPlace={
  slug:'sortie-peche-jb-baptiste-760a00ad',
  public_name:'Sortie pêche JB Baptiste',
  category_code:'service',
  is_active:true,is_published:true,
  phone:'+221 77 123 45 67',external_links:[]
 };
 let queries=0;
 const res=await api.mount(oldPublicPlace,oldPublicPlace.slug,{rpc:()=>{queries++;throw Error('RPC interdite sans lien')}}); 
 assert.equal(res.shown,true);
 assert.equal(res.mode,'direct_contact');
 assert.equal(res.available,0);
 assert.equal(queries,0);
 assert.equal(elements.resaAppointmentsSection.hidden,false);
 assert.equal(elements.resaAppointmentsGo.hidden,false);
 assert.match(elements.resaAppointmentsGo.href,/^https:\/\/wa\.me\/221771234567\?text=/);
 assert.match(decodeURIComponent(elements.resaAppointmentsGo.href),/disponibilités/);
 assert.match(elements.resaAppointmentsGo.textContent,/Demander une disponibilité/);
 assert.match(elements.resaAppointmentsStatus.textContent,/Aucun créneau horaire RÉSA publié/);
 assert.match(elements.resaAppointmentsIntro.textContent,/directement/);
 assert.equal(elements.resaAppointmentsSlots.children.length,0);
 assert.match(page,/id="resaAppointmentsIntro"/);
});

test('aucune fausse demande si fiche test/non publiée ou contact manquant; métiers spécialisés préservés',async()=>{
 const {api,elements}=setup();
 const base={is_active:true,is_published:true,category_code:'service',public_name:'Service',external_links:[]};
 for(const p of [
  {...base,is_published:false,phone:'221771234567'},
  {...base,is_active:false,phone:'221771234567'},
  {...base,__demo:true,phone:'221771234567'},
  {...base,phone:''},
  {...base,phone:'123'},
  {...base,subcategory:'chauffeur VTC',phone:'221771234567'},
  {...base,subcategory:'restaurant',phone:'221771234567'},
  {...base,category_code:'lieu',phone:'221771234567'}
 ]){
  const r=await api.mount(p,'identifiant-pro',{rpc:async()=>{throw Error('no RPC')}});
  assert.equal(r.shown,false,JSON.stringify(p));
  assert.equal(elements.resaAppointmentsSection.hidden,true);
  assert.equal(elements.resaAppointmentsGo.hidden,true);
  assert.equal(elements.resaAppointmentsGo.href,'');
 }
});

test('V9 server gate ON: only real published options lead to the secure appointment form',async()=>{
 const {api,elements}=setup(),day=api.dakarDay(new Date());
 const calls=[];
 const db={rpc:async(name,args)=>{
  calls.push(name);
  if(name==='digiy_resa_universal_pilot_gate_v1'){
   assert.equal(args.p_slug,'pilot-saly');
   return {data:{ok:true,enabled:true,slug:'pilot-saly',time_zone:'Africa/Dakar'}};
  }
  if(name==='digiy_resa_universal_public_options_v1'){
   assert.equal(args.p_start_date,day);
   return {data:{ok:true,slug:'pilot-saly',time_zone:'Africa/Dakar',
    services:[{service_id:'service-real-1',name:'Prestation réelle'}],
    slots:[
      {date:day,time:'09:00',available:true,service_ids:['service-real-1']},
      {date:day,time:'10:00',available:false,service_ids:['service-real-1']},
      {date:day,time:'11:00',available:true,service_ids:['not-a-published-service']},
      {date:day,time:'12:00',available:true,service_ids:['service-real-1']}
    ]}};
  }
  throw Error('historical RPC must not run when V9 is enabled');
 }};
 elements.bookingBtn.href='https://resa-table-resto.digiylyfe.com/planning.html?slug=pilot-saly';
 const result=await api.mount(link('pilot-saly'),'unrelated-explore-slug',db);
 assert.equal(result.shown,true);
 assert.equal(result.mode,'pilot');
 assert.equal(result.available,2);
 assert.deepEqual(calls,['digiy_resa_universal_pilot_gate_v1','digiy_resa_universal_public_options_v1']);
 assert.equal(elements.resaAppointmentsGo.href,
  'https://resa-table-resto.digiylyfe.com/rdv-universel.html?slug=pilot-saly');
 assert.equal(elements.bookingBtn.href,elements.resaAppointmentsGo.href);
 assert.equal(elements.bookingBtn.hidden,false);
 assert.match(elements.resaAppointmentsGo.textContent,/Poser mon rendez-vous/);
 assert.match(elements.resaAppointmentsStatus.textContent,/ne réserve rien/);
 assert.equal(elements.resaAppointmentsSlots.children.length,2);
});
test('V9 gate OFF or unavailable: never advertise a recorded RDV, keep historical planning',async()=>{
 const {api,elements}=setup(),day=api.localDay(new Date());
 for(const response of [
  {data:{ok:true,enabled:false}},
  {error:{message:'RPC unavailable'}},
  {data:{ok:true,enabled:true,slug:'different-slug',time_zone:'Africa/Dakar'}},
  {data:{ok:true,enabled:true,slug:'actif-pro-saly',time_zone:'Europe/Paris'}}
 ]){
  const calls=[];
  const db={rpc:async(name)=>{
   calls.push(name);
   if(name==='digiy_resa_universal_pilot_gate_v1')return response;
   if(name==='digiy_resa_public_week_v1')return {data:week('actif-pro-saly',day)};
   throw Error('pilot public options must not be called');
  }};
  const r=await api.mount(link(),'different',db);
  assert.equal(r.shown,true);assert.equal(r.available,2);
  assert.equal(elements.resaAppointmentsGo.href,
   'https://resa-table-resto.digiylyfe.com/planning.html?slug=actif-pro-saly');
  assert.doesNotMatch(elements.resaAppointmentsGo.textContent,/Poser mon rendez-vous/);
  assert.deepEqual(calls,['digiy_resa_universal_pilot_gate_v1','digiy_resa_public_week_v1']);
 }
});
test('V9 gate ON but V2 fails or lists no real service: no booking CTA',async()=>{
 const {api,elements}=setup(),day=api.dakarDay(new Date());
 const base={ok:true,slug:'pilot-saly',time_zone:'Africa/Dakar',services:[],
  slots:[{date:day,time:'09:00',available:true,service_ids:['orphan-service']}]};
 for(const options of [
  {error:{message:'unavailable'}},
  {data:{...base}},
  {data:{...base,services:[{service_id:'real'}],slots:[{date:day,time:'09:00',available:false,service_ids:['real']}]}},
  {data:{...base,slug:'some-other-pilot'}}
 ]){
  const db={rpc:async name=>{
   if(name==='digiy_resa_universal_pilot_gate_v1')
    return {data:{ok:true,enabled:true,slug:'pilot-saly',time_zone:'Africa/Dakar'}};
   if(name==='digiy_resa_universal_public_options_v1')return options;
   throw Error('legacy must not run after successful gate');
  }};
  // The original booking link is present on existing public fiche pages.
  elements.bookingBtn.href='https://resa-table-resto.digiylyfe.com/planning.html?slug=pilot-saly';
  elements.bookingBtn.hidden=false;
  const result=await api.mount(link('pilot-saly'),'explore',db);
  assert.equal(result.shown,true);
  assert.equal(result.available,0);
  assert.equal(elements.resaAppointmentsGo.hidden,true);
  assert.equal(elements.resaAppointmentsGo.href,'');
  assert.equal(elements.bookingBtn.hidden,true,'no misleading legacy booking button while V9 is ON');
 }
});
test('V9 booking URL has no token or owner secret, never calls reserve or PAY',()=>{
 const {api}=setup();
 const ref=api.parseApprovedResaLink(link('pilot-saly'));
 assert.ok(ref);
 assert.doesNotMatch(script,/digiy_resa_universal_request_v1|digiy_resa_universal_owner_manage_v2|\.insert\s*\(|pay_movements|supabase_service_role/);
 assert.match(script,/digiy_resa_universal_pilot_gate_v1/);
 assert.match(script,/digiy_resa_universal_public_options_v1/);
 assert.match(script,/rdv-universel\.html/);
 assert.equal(api.dakarDay(new Date('2026-10-09T23:40:00Z')),'2026-10-09');
});
