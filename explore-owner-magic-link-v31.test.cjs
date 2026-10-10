'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'acces-proprietaire-v2.html'),'utf8');
const match=source.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(match,'owner entrypoint script exists');
function run(url,{session=false}={}){
 const el=new Map(),storage=new Map(),otps=[],navigations=[];
 function node(id){if(!el.has(id))el.set(id,{href:'',value:'',disabled:false,className:'',textContent:'',onclick:null,classList:{toggle(){}}});return el.get(id)}
 const auth={
  getSession:async()=>({data:{session:session?{access_token:'opaque-test'}:null}}),
  onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
  signInWithOtp:async p=>{otps.push(p);return {error:null}}
 };
 const location={href:url,origin:new URL(url).origin,replace:u=>navigations.push(u)};
 const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))};
 const document={documentElement:{lang:'fr',dir:'ltr'},getElementById:node,querySelectorAll:()=>[]};
 const window={supabase:{createClient:()=>({auth})}};
 vm.runInNewContext(match[1],{window,document,URL,location,localStorage,setTimeout:fn=>fn()},{timeout:1000});
 return {el:node,otps,navigations,storage};
}
const slug='sortie-peche-jb-baptiste-760a00ad';
test('V31 OTP callback retains only validated public place context',async()=>{
 const ctx=run('https://explore.digiylyfe.com/acces-proprietaire-v2.html?site='+slug+'&lang=fr');
 ctx.el('email').value='owner@example.test';
 await ctx.el('send').onclick();
 assert.equal(ctx.otps.length,1);
 const args=ctx.otps[0];
 assert.equal(args.options.shouldCreateUser,false);
 const url=new URL(args.options.emailRedirectTo);
 assert.equal(url.hostname,'explore.digiylyfe.com');
 assert.equal(url.pathname,'/acces-proprietaire-v2.html');
 assert.equal(url.searchParams.get('site'),slug);
 assert.equal(url.searchParams.get('lang'),'fr');
 assert.equal(new URL(url.searchParams.get('return')).pathname,'/fiche.html');
 assert.equal(new URL(url.searchParams.get('return')).searchParams.get('slug'),slug);
 for(const k of url.searchParams.keys())assert.ok(['site','lang','return'].includes(k));
 assert.ok(!url.href.includes('access_token')&&!url.href.includes('service_role'));
});
test('V31 OTP opened on another browser can reach right owner management with no shared storage',async()=>{
 const callback='https://explore.digiylyfe.com/acces-proprietaire-v2.html?site='+slug+'&lang=fr';
 const ctx=run(callback,{session:true});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(ctx.navigations.length,1);
 const dest=new URL(ctx.navigations[0]);
 assert.equal(dest.pathname,'/gestion-explore-v2.html');
 assert.equal(dest.searchParams.get('site'),slug);
 assert.equal(dest.searchParams.get('lang'),'fr');
});
test('malformed owner slugs cannot request OTP or start owner management',async()=>{
 for(const candidate of ['../../other','evil?x=1','x','https://evil.example']){
  const ctx=run('https://explore.digiylyfe.com/acces-proprietaire-v2.html?site='+encodeURIComponent(candidate),{session:true});
  ctx.el('email').value='owner@example.test';
  await ctx.el('send').onclick();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(ctx.otps.length,0);
  assert.equal(ctx.navigations.length,0);
 }
});
