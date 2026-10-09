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
// Rétrocompatibilité : un vrai service EXPLORE sans agenda RÉSA activé
// peut proposer le contact direct, mais jamais de créneau fabriqué.
function eligibleLegacyService(place){
 if(!place||place.is_published!==true||place.is_active!==true||place.__demo===true)return false;
 const kind=String(place.category_code||'').toLowerCase().trim();
 if(!['service','services','activity','activite','activité','experience','expérience'].includes(kind))return false;
 const specialty=String(place.subcategory||place.category_label||'').toLowerCase();
 return !/(restaurant|resto|h[oô]tel|h[eé]bergement|logement|location|driver|chauffeur|taxi|vtc)/.test(specialty);
}
function legacyDirectContact(place){
 if(!eligibleLegacyService(place))return null;
 const raw=String(place.whatsapp||place.phone||place.public_phone||'').trim();
 const phone=raw.replace(/[^0-9]/g,'');
 // Ne jamais utiliser le numéro générique de secours : seul un vrai numéro
 // public de cette fiche peut servir au CTA de prise de contact.
 if(!/^[0-9]{7,18}$/.test(phone))return null;
 const name=String(place.public_name||place.title||'ce professionnel').slice(0,120);
 const msg='Bonjour, je viens de votre fiche DIGIY EXPLORE. Je souhaite connaître vos disponibilités pour '+name+'.';
 return 'https://wa.me/'+phone+'?text='+encodeURIComponent(msg);
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
 const intro=document.getElementById('resaAppointmentsIntro');
 if(!section||!status||!container||!go)return {shown:false,reason:'missing_dom'};
 const myGeneration=++generation;
 section.hidden=true;go.hidden=true;go.removeAttribute?.('href');container.replaceChildren();
 if(!place||place.is_published!==true||place.is_active!==true||place.__demo===true)
   return {shown:false,reason:'not_published'};
 const ref=parseApprovedResaLink(place);
 if(!ref){
  const contact=legacyDirectContact(place);
  if(!contact)return {shown:false,reason:'no_bookable_agenda_or_direct_contact'};
  section.hidden=false;
  if(intro)intro.textContent='Ce professionnel n’a pas encore publié de planning de rendez-vous. La demande se fait directement auprès de lui.';
  status.textContent='Aucun créneau horaire RÉSA publié pour cette activité. Contactez le professionnel pour convenir d’une disponibilité.';
  go.href=contact;
  go.target='_blank';go.rel='noopener noreferrer';go.hidden=false;
  go.textContent='💬 Demander une disponibilité';
  return {shown:true,mode:'direct_contact',available:0};
 }
 if(!db||typeof db.rpc!=='function')return {shown:false,reason:'no_public_calendar_reader'};
 if(intro)intro.textContent='Choisissez parmi ses vraies disponibilités publiées. Le professionnel conserve ses règles de réservation.';
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
root.DIGIYExploreResa=Object.freeze({parseApprovedResaLink,parsePublishedSlots,eligibleLegacyService,legacyDirectContact,localDay,mount});
})(typeof window!=='undefined'?window:globalThis);
