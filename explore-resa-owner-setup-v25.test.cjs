'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'explore-resa-owner-setup-v25.js'),'utf8');
const page=fs.readFileSync(path.join(__dirname,'gestion-explore-v2.html'),'utf8');
function setup(){
 const window={confirm:()=>true},doc={};
 const names=['resaSetupCard','resaSetupStatus','resaSetupServices','resaSetupSlots','resaServiceName','resaServiceDuration',
 'resaServicePrice','resaServiceSave','resaServiceCancel','resaSetupExploreDates','resaSetupCalendarWarnings','resaSlotDay','resaSlotStart','resaSlotEnd','resaSlotSave','resaSetupHint'];
 const el=Object.fromEntries(names.map(id=>[id,{id,hidden:true,value:'',disabled:false,children:[],replaceChildren(){this.children=[]},append(...a){this.children.push(...a)}}]));
 doc.getElementById=id=>el[id]||null;
 doc.createElement=tag=>({tag,children:[],textContent:'',disabled:false,hidden:false,append(...a){this.children.push(...a)},addEventListener(type,fn){(this.listeners||(this.listeners={}))[type]=fn}});
 vm.runInNewContext(script,{window,document:doc,Date,Intl,Number,String,Boolean,RegExp,Promise},{timeout:1000});
 return {api:window.DIGIYExploreResaSetup,doc,el,window};
}
const user={id:'user-owner-a'};
const place={slug:'sortie-peche-jb-baptiste-760a00ad',auth_user_id:user.id,is_active:true};
const profile={slug:place.slug,auth_user_id:user.id,is_active:true,is_published:false};
function fakeDb({ownerProfile=profile,services=[],slots=[],calendarDays=[],error=null}={}){
 const calls=[];
 return {calls,
  from(table){
   const q={table,mode:'read',payload:null,
    select(){return this},eq(){return this},gte(){return this},lte(){return this},order(){return this},
    insert(v){this.mode='insert';this.payload=v;calls.push({table,action:'insert',payload:v});return this},
    update(v){this.mode='update';this.payload=v;calls.push({table,action:'update',payload:v});return this},
    async maybeSingle(){return this.mode==='read'?{data:ownerProfile,error}: {data:{id:'saved-id'},error}},
    async limit(){calls.push({table,action:'read'});return {data:table==='digiy_resa_services'?services:slots,error}}
   };return q;
  },
  async rpc(name,args){
   calls.push({action:'rpc',name,args});
   if(name==='digiy_explore_owner_calendar_v1')return {data:calendarDays,error:null};
   return {data:{ok:true,enabled:false},error:null};
  }
 };
}
test('real input validation rejects fake/invalid services, pricing and times',()=>{
 const a=setup().api;
 assert.deepEqual(JSON.parse(JSON.stringify(a.validService(' Sortie pêche ',90,''))),
  {service_name:'Sortie pêche',duration_minutes:90,price_fcfa:null});
 assert.deepEqual(JSON.parse(JSON.stringify(a.validService('Photographie',45,'20000'))),
  {service_name:'Photographie',duration_minutes:45,price_fcfa:20000});
 for(const row of [['',30,''],['Pêche',481,''],['Pêche',0,''],['Pêche',30,'abc'],['Pêche',30,'5000001']])
  assert.equal(a.validService(...row),null);
 const today=new Date('2026-10-10T04:00:00Z');
 assert.equal(a.validSlot('2026-10-11','08:00','09:30',today),true);
 for(const [d,t,u] of [['2026-10-10','03:00','04:00'],['2026-10-11','09:00','08:00'],
  ['2026-10-11','08:00','19:00'],['2026-10-11','07:xx','08:00'],
  ['2026-02-31','09:00','10:00'],['2027-05-20','09:00','10:00']])
   assert.equal(a.validSlot(d,t,u,today),false,d+' '+t+' '+u);
 assert.equal(a.dayDakar(today),'2026-10-10');
});
test('without owner magic-link / MFA verified there is no query or owner setup UI',async()=>{
 const {api,doc,el}=setup();const sb=fakeDb();
 const x=await api.initialize({document:doc,supabase:sb,user,place,siteSlug:place.slug,ownerVerified:false});
 assert.equal(x.reason,'owner_not_verified');assert.equal(el.resaSetupCard.hidden,true);
 assert.equal(sb.calls.length,0);
});
test('an unpublished profile belonging to another owner cannot mount the setup',async()=>{
 const {api,doc,el}=setup();const sb=fakeDb({ownerProfile:{...profile,auth_user_id:'owner-b'}});
 const x=await api.initialize({document:doc,supabase:sb,user,place,siteSlug:place.slug,ownerVerified:true});
 assert.equal(x.reason,'profile_not_ready');assert.equal(el.resaSetupCard.hidden,true);
 assert.equal(sb.calls.filter(x=>x.table==='digiy_resa_services').length,0);
});
test('unpublished real owner can privately save only a draft, never book or publish',async()=>{
 const {api,doc,el}=setup();const sb=fakeDb();
 const x=await api.initialize({document:doc,supabase:sb,user,place,siteSlug:place.slug,ownerVerified:true});
 assert.equal(x.ok,true);assert.equal(x.published,false);assert.equal(el.resaSetupCard.hidden,false);
 assert.match(el.resaSetupHint.textContent,/Préparation privée/);
 el.resaServiceName.value='Cours de pêche';
 el.resaServiceDuration.value='90';
 el.resaServicePrice.value='';
 await el.resaServiceSave.onclick();
 const write=sb.calls.find(x=>x.action==='insert');
 assert.equal(write.table,'digiy_resa_services');
 assert.deepEqual(JSON.parse(JSON.stringify(write.payload)),{
   slug:place.slug,service_name:'Cours de pêche',duration_minutes:90,price_fcfa:null,is_active:false});
 assert.equal(sb.calls.filter(x=>x.action==='rpc'&&/request|booking|create/.test(x.name)).length,0);
});
test('owner can publish only real future 1-place slots of a saved service',async()=>{
 const {api,doc,el}=setup();
 const sb=fakeDb({services:[{id:'svc-real',slug:place.slug,service_name:'Cours de pêche',duration_minutes:90,price_fcfa:null,is_active:false}]});
 const x=await api.initialize({document:doc,supabase:sb,user,place,siteSlug:place.slug,ownerVerified:true});
 assert.equal(x.ok,true);
 el.resaSlotDay.value=api.addDays(api.dayDakar(),1);
 el.resaSlotStart.value='09:00';el.resaSlotEnd.value='11:00';
 await el.resaSlotSave.onclick();
 const write=sb.calls.find(x=>x.action==='insert');
 assert.equal(write.table,'digiy_resa_slots');
 assert.deepEqual(JSON.parse(JSON.stringify(write.payload)),{
  slug:place.slug,slot_date:api.addDays(api.dayDakar(),1),start_time:'09:00',end_time:'11:00',status:'open',capacity:1
 });
});
test('available EXPLORE dates fill only a RÉSA date, never create a booking',async()=>{
 const {api,doc,el}=setup();
 const today=api.dayDakar(),tomorrow=api.addDays(today,1),next=api.addDays(today,2);
 const sb=fakeDb({calendarDays:[
  {day:tomorrow,status:'available',note:'Départ réel à définir'},
  {day:next,status:'closed',note:'Fermeture'},
  {day:api.addDays(today,-1),status:'available',note:'Passé'}
 ]});
 const x=await api.initialize({document:doc,supabase:sb,user,place,siteSlug:place.slug,ownerVerified:true});
 assert.equal(x.ok,true);
 const shortcuts=el.resaSetupExploreDates.children.filter(x=>x.tag==='button');
 assert.equal(shortcuts.length,1);
 assert.match(shortcuts[0].textContent,/Départ réel à définir/);
 assert.equal(el.resaSlotDay.value,'');
 shortcuts[0].listeners.click();
 assert.equal(el.resaSlotDay.value,tomorrow);
 assert.equal(el.resaSlotStart.value,'');
 assert.equal(el.resaSlotEnd.value,'');
 assert.equal(sb.calls.filter(x=>x.action==='insert'||x.action==='update').length,0);
 assert.equal(sb.calls.filter(x=>x.action==='rpc'&&x.name==='digiy_explore_owner_calendar_v1').length,1);
});
test('V27 parses only exact written departure and return hours',()=>{
 const p=setup().api.explicitDepartureReturn;
 assert.deepEqual(JSON.parse(JSON.stringify(p('DEPART 09H RETOUR 13H'))),{start:'09:00',end:'13:00'});
 assert.deepEqual(JSON.parse(JSON.stringify(p('Départ 09 H retour 13H beau temps'))),{start:'09:00',end:'13:00'});
 assert.deepEqual(JSON.parse(JSON.stringify(p('DEPART 09H30 RETOUR 13:15'))),{start:'09:30',end:'13:15'});
 for(const note of ['DEPART 09H','RETOUR 13H','BEAU TEMPS','DEPART 25H RETOUR 13H',
  'DEPART 13H RETOUR 09H','DEPART 09H RETOUR 26H','']){
  assert.equal(p(note),null,note);
 }
});
test('V27 owner click prefills valid written hours only, never saves a slot',async()=>{
 const {api,doc,el}=setup();
 const today=api.dayDakar(),day1=api.addDays(today,1),day2=api.addDays(today,2);
 const sb=fakeDb({calendarDays:[
  {day:day1,status:'available',note:'DEPART 09 H RETOUR 13H BEAU TEMPS'},
  {day:day2,status:'available',note:'BEAU TEMPS'},
  {day:api.addDays(today,3),status:'closed',note:'DEPART 09H RETOUR 13H'}
 ]});
 const x=await api.initialize({document:doc,supabase:sb,user,place,siteSlug:place.slug,ownerVerified:true});
 assert.equal(x.ok,true);
 const shortcuts=el.resaSetupExploreDates.children.filter(x=>x.tag==='button');
 assert.equal(shortcuts.length,2);
 shortcuts[0].listeners.click();
 assert.equal(el.resaSlotDay.value,day1);
 assert.equal(el.resaSlotStart.value,'09:00');
 assert.equal(el.resaSlotEnd.value,'13:00');
 shortcuts[1].listeners.click();
 assert.equal(el.resaSlotDay.value,day2);
 assert.equal(el.resaSlotStart.value,'');
 assert.equal(el.resaSlotEnd.value,'');
 assert.equal(sb.calls.filter(x=>x.action==='insert'||x.action==='update').length,0);
});
test('V29 catches only future real schedule differences and does not create reservations',async()=>{
 const {api,doc,el}=setup();
 const day1=api.addDays(api.dayDakar(),1),day2=api.addDays(api.dayDakar(),2);
 const matchingDay=api.addDays(api.dayDakar(),3),missingDay=api.addDays(api.dayDakar(),4);
 const slots=[
  {slug:place.slug,slot_date:day1,start_time:'09:00:00',end_time:'13:00:00',status:'open'},
  {slug:place.slug,slot_date:day2,start_time:'10:00:00',end_time:'13:00:00',status:'open'},
  {slug:place.slug,slot_date:matchingDay,start_time:'09:00:00',end_time:'13:00:00',status:'open'},
  {slug:place.slug,slot_date:missingDay,start_time:'09:00:00',end_time:'13:00:00',status:'open'}
 ];
 const calendarDays=[
  {day:day1,status:'closed',note:'Fermé'},
  {day:day2,status:'available',note:'DEPART 09H RETOUR 13H'},
  {day:matchingDay,status:'available',note:'DEPART 09H RETOUR 13H'}
 ];
 const issues=api.calendarConflicts(calendarDays,slots);
 assert.equal(issues.length,2);
 assert.equal(issues[0].kind,'availability');
 assert.equal(issues[1].kind,'hours');
 const db=fakeDb({calendarDays,slots});
 const opened=await api.initialize({document:doc,supabase:db,user,place,siteSlug:place.slug,ownerVerified:true});
 assert.equal(opened.ok,true);
 assert.match(el.resaSetupCalendarWarnings.children[0].textContent,/2 écart/);
 assert.match(el.resaSetupCalendarWarnings.children[1].textContent,/reste ouvert/);
 assert.match(el.resaSetupCalendarWarnings.children[2].textContent,/diffère/);
 assert.equal(db.calls.filter(x=>x.action==='insert'||x.action==='update').length,0);
});
test('V29 reports no discrepancy when the real calendars agree',async()=>{
 const {api,doc,el}=setup();
 const day=api.addDays(api.dayDakar(),1);
 const calendarDays=[{day,status:'available',note:'DEPART 09H RETOUR 13H'}];
 const slots=[{slug:place.slug,slot_date:day,start_time:'09:00:00',end_time:'13:00:00',status:'open'}];
 const sb=fakeDb({calendarDays,slots});
 const result=await api.initialize({document:doc,supabase:sb,user,place,siteSlug:place.slug,ownerVerified:true});
 assert.equal(result.ok,true);
 assert.match(el.resaSetupCalendarWarnings.children[0].textContent,/Aucun écart détecté/);
});
test('page wires setup only after MFA and real owner profile; no fake record on load',()=>{
 assert.match(page,/DIGIY_OWNER_PHONE_MFA\.guard/);
 assert.match(page,/DIGIYExploreResaSetup\.initialize/);
 assert.match(page,/explore-resa-owner-setup-v25\.js/);
 assert.match(page,/id="resaSetupCard"[^>]*hidden/);
 assert.match(page,/id="resaSlotSave"/);
 assert.match(page,/id="resaSetupExploreDates"/);
 assert.match(page,/id="resaSetupCalendarWarnings"/);
 assert.doesNotMatch(script,/service_role|\.delete\s*\(|client_request_id|digiy_resa_create_booking/);
 assert.doesNotMatch(script,/innerHTML\s*=/);
 assert.match(script,/is_active:false/);
});
