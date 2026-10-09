/* DIGIY EXPLORE × RÉSA MULTI — lecture seule des VRAIS créneaux du professionnel.
   Activation seulement après lien EXPLORE explicite, validé par l'administrateur,
   vers le planning public RÉSA. Aucun booking/avis/paiement créé ici.
 */
(function(root){
'use strict';
const ALLOWED_HOST='resa-table-resto.digiylyfe.com';
const ALLOWED_PATH='/planning.html';
const SLUG=/^[a-z0-9][a-z0-9_-]{1,149}$/;
function links(place){
 let raw=place?.external_links??place?.links??place?.public_links??[];
 if(typeof raw==='string'){try{raw=JSON.parse(raw)}catch(_){return []}}
 return Array.isArray(raw)?raw:[];
}
function parseApprovedResaLink(place){
 // Do not infer equivalence between EXPLORE slug and RÉSA slug. Opt-in explicit.
 for(const item of links(place)){
  if(!item||typeof item!=='object'||!['resa','booking'].includes(String(item.type||'').toLowerCase()))continue;
  const raw=String(item.url||'').trim();
  try{
   const url=new URL(raw);
   if(url.protocol!=='https:'||url.hostname!==ALLOWED_HOST||url.port||url.username||url.password
      ||url.pathname!==ALLOWED_PATH||url.hash)continue;
   // Reject URLs smuggling owner credentials or redirects.
   if([...url.searchParams.keys()].some(k=>k!=='slug'))continue;
   const slug=url.searchParams.get('slug')||'';
   if(!SLUG.test(slug))continue;
   return {slug,href:'https://'+ALLOWED_HOST+ALLOWED_PATH+'?slug='+encodeURIComponent(slug)};
  }catch(_){}
 }
 return null;
}
function parsePublishedSlots(data,expectedSlug,day0){
 if(!data||data.ok!==true||data.slug!==expectedSlug||!Array.isArray(data.slots))return null;
 const dayEnd=new Date(day0+'T12:00:00');
 if(!Number.isFinite(dayEnd.getTime()))return null;
 dayEnd.setDate(dayEnd.getDate()+6);
 const end=localDay(dayEnd);
 const out=[];
 for(const item of data.slots){
  if(item?.available!==true||!/^\d{4}-\d{2}-\d{2}$/.test(String(item.date||''))||
     !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(item.time||'')))continue;
  if(item.date<day0||item.date>end)continue;
  out.push({date:item.date,time:item.time});
 }
 out.sort((a,b)=>(a.date+'T'+a.time).localeCompare(b.date+'T'+b.time));
 return out.slice(0,8);
}
function localDay(d){
 return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function text(tag,content,cls){
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 e.textContent=content;
 return e;
}
let generation=0;
async function mount(place,exploreSlug,db){
 const section=document.getElementById('resaAppointmentsSection');
 const status=document.getElementById('resaAppointmentsStatus');
 const container=document.getElementById('resaAppointmentsSlots');
 const go=document.getElementById('resaAppointmentsGo');
 if(!section||!status||!container||!go)return {shown:false,reason:'missing_dom'};
 const myGeneration=++generation;
 section.hidden=true;go.hidden=true;container.replaceChildren();
 const ref=parseApprovedResaLink(place);
 if(!ref||!db||typeof db.rpc!=='function')return {shown:false,reason:'not_authorized_or_unavailable'};
 // EXPLORE uses only published place data, but must never create an EXTERNAL booking
 // link from demo-place examples or arbitrary client-supplied query params.
 if(place?.__demo===true)return {shown:false,reason:'demo'};
 const from=localDay(new Date());
 let response;
 try{response=await db.rpc('digiy_resa_public_week_v1',{p_slug:ref.slug,p_start_date:from})}
 catch(_){return {shown:false,reason:'rpc_error'}}
 if(myGeneration!==generation)return {shown:false,reason:'stale_response'};
 if(response?.error)return {shown:false,reason:'rpc_error'};
 const slots=parsePublishedSlots(response?.data,ref.slug,from);
 if(slots===null)return {shown:false,reason:'not_published'};
 section.hidden=false;
 go.href=ref.href;
 if(!slots.length){
  status.textContent='Aucun rendez-vous disponible publié pour les 7 prochains jours. Vous pouvez contacter directement le professionnel.';
  return {shown:true,available:0};
 }
 status.textContent='Créneaux publiés par le professionnel (heure locale de son planning). La sélection et la confirmation s’effectuent sur son agenda.';
 for(const slot of slots){
  const chip=text('span',slot.date+' · '+slot.time,'chip');
  container.append(chip);
 }
 go.hidden=false;
 go.textContent='📅 Voir le planning et choisir un créneau';
 // A dedicated booking link may exist in EXPLORE already. We adjust only its
 // wording after the authoritative publication/slot check succeeds.
 const old=document.getElementById('bookingBtn');
 if(old&&old.href===ref.href){old.textContent='📅 Voir les créneaux'}
 return {shown:true,available:slots.length};
}
root.DIGIYExploreResa=Object.freeze({parseApprovedResaLink,parsePublishedSlots,localDay,mount});
})(typeof window!=='undefined'?window:globalThis);
