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
