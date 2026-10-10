'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname);
const ownerSrc=fs.readFileSync(path.join(root,'explore-resa-owner-bridge.js'),'utf8');
const publicSrc=fs.readFileSync(path.join(root,'explore-resa-public-bridge.js'),'utf8');
const page=fs.readFileSync(path.join(root,'gestion-explore-v2.html'),'utf8');
function element(tag){
 return {
  tag,children:[],hidden:true,href:'',value:'',disabled:false,textContent:'',listeners:{},attributes:{},
  append(...items){this.children.push(...items)},
  replaceChildren(){this.children=[]},
  removeAttribute(name){if(name==='href')this.href='';delete this.attributes[name]},
  setAttribute(k,v){this.attributes[k]=v},
  addEventListener(type,fn){this.listeners[type]=fn}
 };
}
function setup(){
 const names=['resaOwnerCard','resaOwnerStatus','resaOwnerBookings','resaOwnerPublicLink'];
 const el=Object.fromEntries(names.map(n=>[n,element('div')]));
 const document={getElementById:id=>el[id]||null,createElement:element};
 const window={};
 const context={window,document,URL,Date,Intl};
 vm.runInNewContext(publicSrc,context,{timeout:1000});
 vm.runInNewContext(ownerSrc,context,{timeout:1000});
 return {api:window.DIGIYExploreResaOwner,el,document,window};
}
const place={slug:'pro-explore-saly',external_links:[{type:'booking',url:'https://resa-table-resto.digiylyfe.com/planning.html?slug=pro-resa-saly'}]};
const user={id:'owner-a'};
function mockSB({profile=null,bookings=[],pilot={ok:true,enabled:false},profileError=null,bookingError=null}={}){
 const calls=[],rpcCalls=[],readStates=[];
 const sb={
  from(name){
   readStates.push(name);
   const query={
    select(cols){calls.push({kind:name,cols});return this},
    eq(){return this},not(){return this},gte(){return this},order(){return this},
    maybeSingle:async()=>({data:profile,error:profileError}),
    limit:async()=>({data:bookings,error:bookingError})
   };
   return query;
  },
  async rpc(name,args){
   rpcCalls.push({name,args});
   if(name==='digiy_resa_universal_pilot_gate_v1')return {data:pilot,error:null};
   if(name==='digiy_resa_universal_owner_manage_v2')return {data:{ok:true},error:null};
   throw Error('unexpected RPC '+name);
  }
 };
 return {sb,calls,rpcCalls,readStates};
}
test('owner controls stay hidden until magic-link+MFA+EXPLORE owner verification',async()=>{
 const {api,el,document}=setup();let called=0;
 const sb={from:()=>{called++;throw Error('unexpected')}};
 const x=await api.initialize({document,supabase:sb,siteSlug:place.slug,user,place,ownerVerified:false});
 assert.equal(x.reason,'owner_not_verified');assert.equal(el.resaOwnerCard.hidden,true);assert.equal(called,0);
 assert.match(page,/id="linksMediaCard"[^>]*hidden/);
 assert.match(page,/id="calendarCard"[^>]*hidden/);
 assert.match(page,/boot\(\)\.then\(async verified=>\{if\(verified===true\)/);
});
test('without explicit approved RÉSA URL, keep terrain calendar and no booking queries',async()=>{
 const {api,el,document}=setup();
 const {sb,readStates}=mockSB();
 const x=await api.initialize({document,supabase:sb,user,siteSlug:place.slug,ownerVerified:true,place:{slug:place.slug,external_links:[]}});
 assert.equal(x.mode,'not_linked');assert.equal(el.resaOwnerCard.hidden,false);
 assert.equal(el.resaOwnerPublicLink.hidden,true);assert.equal(readStates.length,0);
});
test('real same-owner unpublished RÉSA profile displays private dashboard with no public booking link',async()=>{
 const {api,el,document}=setup();
 const privatePlace={slug:'sortie-peche-jb-baptiste-760a00ad',auth_user_id:user.id,is_active:true,external_links:[]};
 const profile={slug:privatePlace.slug,auth_user_id:user.id,is_active:true,is_published:false};
 const {sb,readStates,rpcCalls}=mockSB({profile,pilot:{ok:true,enabled:false},bookings:[]});
 const x=await api.initialize({document,supabase:sb,user,siteSlug:privatePlace.slug,place:privatePlace,ownerVerified:true});
 assert.equal(x.mode,'ready');assert.equal(x.count,0);assert.equal(x.enabled,false);
 assert.equal(el.resaOwnerCard.hidden,false);
 assert.equal(el.resaOwnerPublicLink.hidden,true);
 assert.equal(el.resaOwnerPublicLink.href,'');
 assert.match(el.resaOwnerStatus.textContent,/Préparation privée/);
 assert.match(el.resaOwnerStatus.textContent,/Pilote RÉSA fermé/);
 assert.deepEqual(readStates,['digiy_resa_profiles','digiy_resa_bookings']);
 assert.deepEqual(rpcCalls.map(x=>x.name),['digiy_resa_universal_pilot_gate_v1']);
});
test('a foreign or missing private RÉSA account cannot reveal any bookings',async()=>{
 const {api,el,document}=setup();
 const ownerPlace={slug:'sortie-peche-jb-baptiste-760a00ad',auth_user_id:user.id,is_active:true,external_links:[]};
 for(const wrong of [null,{slug:ownerPlace.slug,auth_user_id:'owner-b',is_active:true,is_published:false}]){
  const {sb,readStates,rpcCalls}=mockSB({profile:wrong});
  const x=await api.initialize({document,supabase:sb,user,siteSlug:ownerPlace.slug,place:ownerPlace,ownerVerified:true});
  assert.equal(x.mode,'ownership_unconfirmed');
  assert.deepEqual(readStates,['digiy_resa_profiles']);
  assert.equal(rpcCalls.length,0);
  assert.equal(el.resaOwnerPublicLink.hidden,true);
 }
});
test('a counterfeit EXPLORE owner cannot use private same-slug lookups',async()=>{
 const {api,el,document}=setup();
 const {sb,readStates}=mockSB();
 const p={slug:'sortie-peche-jb-baptiste-760a00ad',auth_user_id:'owner-b',is_active:true,external_links:[]};
 const x=await api.initialize({document,supabase:sb,user,siteSlug:p.slug,place:p,ownerVerified:true});
 assert.equal(x.mode,'not_linked');assert.equal(readStates.length,0);
 assert.equal(el.resaOwnerPublicLink.hidden,true);
});
test('unpublished profile never exposes a public booking link even with approved URL',async()=>{
 const {api,el,document}=setup();
 const {sb}=mockSB({profile:{slug:'pro-resa-saly',auth_user_id:user.id,is_active:true,is_published:false}});
 const x=await api.initialize({document,supabase:sb,user,siteSlug:place.slug,place,ownerVerified:true});
 assert.equal(x.mode,'ready');assert.equal(el.resaOwnerPublicLink.hidden,true);
 assert.equal(el.resaOwnerPublicLink.href,'');
});
test('unapproved domain, token and separate slug cannot become owner management',async()=>{
 const {api}=setup();
 for(const bad of [
  'https://resto.digiylyfe.com/resa-resto/index.html?site=foo',
  'https://resa-table-resto.digiylyfe.com/planning.html?slug=pro-resa-saly&token=secret',
  'https://resa-table-resto.digiylyfe.com.evil.invalid/planning.html?slug=pro-resa-saly'
 ]){
  assert.equal(api.validateReference({external_links:[{type:'booking',url:bad}]}),null);
 }
 assert.equal(api.validateReference(place).slug,'pro-resa-saly');
});
test('RÉSA identity mismatch or RLS denial never fetches private client bookings',async()=>{
 const {api,el,document}=setup();
 const {sb,readStates,rpcCalls}=mockSB({profile:{slug:'pro-resa-saly',auth_user_id:'owner-b',is_active:true}});
 const x=await api.initialize({document,supabase:sb,user,siteSlug:place.slug,ownerVerified:true,place});
 assert.equal(x.mode,'ownership_unconfirmed');
 assert.equal(el.resaOwnerPublicLink.hidden,true);
 assert.deepEqual(readStates,['digiy_resa_profiles']);
 assert.equal(rpcCalls.length,0);
});
test('missing V9 RPC keeps the interface read-only and never creates a booking',async()=>{
 const {api,el,document}=setup();
 const {sb,readStates,rpcCalls}=mockSB({profile:{slug:'pro-resa-saly',auth_user_id:user.id,is_active:true},pilot:{ok:false,error:'not_installed'}});
 const x=await api.initialize({document,supabase:sb,user,siteSlug:place.slug,ownerVerified:true,place});
 assert.equal(x.mode,'v9_unavailable');
 assert.deepEqual(readStates,['digiy_resa_profiles']);
 assert.deepEqual(rpcCalls.map(x=>x.name),['digiy_resa_universal_pilot_gate_v1']);
 assert.equal(el.resaOwnerBookings.children.length,0);
});
test('only V9 client_request_id bookings appear, with per-owner authorized V5 actions',async()=>{
 const {api,el,document,window}=setup();
 const b={id:'real-uuid-1',client_request_id:'new-request-uuid',booking_date:'2099-10-20',
  booking_time:'10:30:00',customer_name:'Client de test',customer_phone:'000000000',
  service_name:'Atelier',status:'pending',note_text:''};
 const {sb,calls,rpcCalls}=mockSB({profile:{slug:'pro-resa-saly',auth_user_id:user.id,is_active:true,is_published:true},pilot:{ok:true,enabled:false},bookings:[b]});
 const x=await api.initialize({document,supabase:sb,user,siteSlug:place.slug,ownerVerified:true,place});
 assert.equal(x.mode,'ready');assert.equal(x.count,1);assert.equal(x.enabled,false);
 assert.equal(el.resaOwnerBookings.children.length,1);
 assert.equal(el.resaOwnerPublicLink.hidden,false);
 assert.match(el.resaOwnerStatus.textContent,/Pilote RÉSA fermé/);
 const read=calls.find(x=>x.kind==='digiy_resa_bookings');
 assert.match(read.cols,/client_request_id/);
 assert.deepEqual([...api.transitions('pending')],['confirmed','cancelled']);
 assert.deepEqual([...api.transitions('confirmed')],['done','no_show','cancelled']);
 const row=el.resaOwnerBookings.children[0];
 const buttons=row.children.find(x=>x.className==='resa-owner-actions').children;
 window.confirm=()=>false;
 await buttons[1].listeners.click();
 assert.equal(rpcCalls.filter(x=>x.name==='digiy_resa_universal_owner_manage_v2').length,0,'annulation refusée sans confirmation');
 await buttons[0].listeners.click();
 assert.deepEqual(JSON.parse(JSON.stringify(rpcCalls.filter(x=>x.name==='digiy_resa_universal_owner_manage_v2').map(x=>x.args))),
  [{p_booking_id:b.id,p_action:'confirmed',p_note_text:null}]);
 assert.doesNotMatch(ownerSrc,/digiy_resa_create_booking|\.insert\s*\(|service_role|payment_intent|carnet_movement/);
});
test('no data is displayed after forbidden profile or failed booking read',async()=>{
 const {api,el,document}=setup();
 const {sb}=mockSB({profile:{slug:'pro-resa-saly',auth_user_id:user.id,is_active:true},pilot:{ok:true,enabled:true},bookingError:{code:'DENIED'}});
 const x=await api.initialize({document,supabase:sb,user,siteSlug:place.slug,ownerVerified:true,place});
 assert.equal(x.reason,'read_failed');assert.equal(el.resaOwnerBookings.children.length,0);
});
test('Dakar local dates do not depend on the owner Mac timezone',()=>{
 const {api}=setup();
 assert.equal(api.localDateInDakar(new Date('2026-10-09T23:30:00Z')),'2026-10-09');
 assert.equal(api.localDateInDakar(new Date('2026-10-10T00:30:00Z')),'2026-10-10');
});
