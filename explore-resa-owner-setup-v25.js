/* DIGIY EXPLORE V25 × RÉSA V10 — real owner catalogue.
 * Magic-link + phone guard run BEFORE initialize; RLS/MFA remain the server
 * authority on every write. No fake pricing, slots or publication switch.
 */
(function(root){
'use strict';
const PROFILE='digiy_resa_profiles',SERVICES='digiy_resa_services',SLOTS='digiy_resa_slots';
const HOUR=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
const DAY=/^\d{4}-\d{2}-\d{2}$/;
const SLUG=/^[a-z0-9][a-z0-9_-]{1,149}$/;
function dayDakar(now=new Date()){
 const a=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Dakar',
  year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const x={};for(const p of a)if(p.type!=='literal')x[p.type]=p.value;
 return x.year+'-'+x.month+'-'+x.day;
}
function addDays(day,n){
 const t=new Date(day+'T12:00:00Z');
 t.setUTCDate(t.getUTCDate()+n);
 return t.toISOString().slice(0,10);
}
function validService(name,minutes,price){
 const n=String(name||'').trim();
 const m=Number(minutes);
 if(n.length<2||n.length>120||!Number.isInteger(m)||m<5||m>480)return null;
 const p=String(price??'').trim();
 if(p&&!/^\d+$/.test(p))return null;
 const v=p===''?null:Number(p);
 if(v!==null&&(!Number.isSafeInteger(v)||v<0||v>5000000))return null;
 return {service_name:n,duration_minutes:m,price_fcfa:v};
}
function validSlot(day,start,end,now=new Date()){
 if(!DAY.test(String(day||''))||!HOUR.test(String(start||''))||!HOUR.test(String(end||'')))return false;
 if(!Number.isFinite(Date.parse(day+'T12:00:00Z'))||addDays(day,0)!==day)return false;
 const today=dayDakar(now);
 if(day<today||day>addDays(today,56)||end<=start)return false;
 if(day===today&&start<=new Intl.DateTimeFormat('en-GB',{
  timeZone:'Africa/Dakar',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
 }).format(now))return false;
 const [h1,m1]=start.split(':').map(Number),[h2,m2]=end.split(':').map(Number);
 return h2*60+m2-(h1*60+m1)<=480;
}
// Accept a suggested slot only when BOTH real times are explicit in the owner's note.
function explicitDepartureReturn(note){
 const normalized=String(note||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 const pick=keyword=>{
  const pattern=new RegExp('\\b'+keyword+'\\s+(\\d{1,2})(?:(?:\\s*H\\s*|\\s*:\\s*)(\\d{0,2}))?(?!\\d)');
  const match=normalized.match(pattern);
  if(!match)return null;
  const h=Number(match[1]),m=match[2]?Number(match[2]):0;
  if(h>23||m>59)return null;
  return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
 };
 const start=pick('DEPART'),end=pick('RETOUR');
 if(!start||!end||end<=start)return null;
 return {start,end};
}
function actualOwner(profile,place,user,siteSlug){
 return Boolean(profile?.slug&&SLUG.test(profile.slug)&&profile.slug===siteSlug
  &&place?.slug===siteSlug&&place?.is_active===true&&profile.is_active===true
  &&user?.id&&profile.auth_user_id===user.id&&place.auth_user_id===user.id);
}
function make(doc,tag,content,cls){
 const el=doc.createElement(tag);
 el.textContent=String(content??'');
 if(cls)el.className=cls;
 return el;
}
function friendly(error){
 if(String(error?.code)==='23P01'||String(error?.code)==='23505')
  return 'Ce créneau chevauche un autre horaire ou existe déjà.';
 return 'Action refusée. Vérifiez vos droits, votre téléphone et les champs saisis.';
}
async function initialize({document:doc,supabase:sb,user,place,siteSlug,ownerVerified}={}){
 const by=id=>doc?.getElementById(id);
 const card=by('resaSetupCard'),message=by('resaSetupStatus'),servicesList=by('resaSetupServices'),
  slotsList=by('resaSetupSlots');
 if(!card||!message||!servicesList||!slotsList)return {ok:false,reason:'missing_dom'};
 card.hidden=true;servicesList.replaceChildren();slotsList.replaceChildren();
 if(!ownerVerified||!user?.id||!sb||!place||place.slug!==siteSlug||place.auth_user_id!==user.id)
  return {ok:false,reason:'owner_not_verified'};
 let profile;
 try{
  const r=await sb.from(PROFILE).select('slug,auth_user_id,is_active,is_published,time_zone')
   .eq('slug',siteSlug).eq('auth_user_id',user.id).eq('is_active',true).maybeSingle();
  if(r.error||!actualOwner(r.data,place,user,siteSlug))return {ok:false,reason:'profile_not_ready'};
  profile=r.data;
 }catch(_){return {ok:false,reason:'profile_unavailable'}}
 card.hidden=false;
 const fields={
  name:by('resaServiceName'),duration:by('resaServiceDuration'),price:by('resaServicePrice'),
  serviceSave:by('resaServiceSave'),serviceCancel:by('resaServiceCancel'),
  day:by('resaSlotDay'),start:by('resaSlotStart'),end:by('resaSlotEnd'),
  slotSave:by('resaSlotSave'),setupHint:by('resaSetupHint')
 };
 if(Object.values(fields).some(v=>!v)){card.hidden=true;return {ok:false,reason:'missing_fields'}}
 let services=[],slots=[],editing=null,busy=false;
 const status=s=>{message.textContent=s};
 const setBusy=v=>{busy=v;fields.serviceSave.disabled=v;fields.slotSave.disabled=v};
 const ownedQuery=(table)=>sb.from(table);
 const clearEdit=()=>{
  editing=null;fields.name.value='';fields.duration.value='30';fields.price.value='';
  fields.serviceSave.textContent='Ajouter cette prestation';fields.serviceCancel.hidden=true;
 };
 const load=async()=>{
  servicesList.replaceChildren();slotsList.replaceChildren();
  const today=dayDakar();
  let sv,sl;
  try{
   [sv,sl]=await Promise.all([
    ownedQuery(SERVICES).select('id,slug,service_name,duration_minutes,price_fcfa,is_active')
     .eq('slug',siteSlug).order('service_name',{ascending:true}).limit(80),
    ownedQuery(SLOTS).select('id,slug,slot_date,start_time,end_time,status,capacity')
     .eq('slug',siteSlug).gte('slot_date',today).lte('slot_date',addDays(today,56))
     .order('slot_date',{ascending:true}).order('start_time',{ascending:true}).limit(250)
   ]);
  }catch(_){status('Catalogue indisponible. Aucune modification effectuée.');return false}
  if(sv.error||sl.error||!Array.isArray(sv.data)||!Array.isArray(sl.data)){
   status('Lecture du catalogue refusée : contrôlez la connexion propriétaire et les droits V10.');
   return false;
  }
  services=sv.data.filter(x=>x.slug===siteSlug);
  slots=sl.data.filter(x=>x.slug===siteSlug);
  const readGate=await sb.rpc('digiy_resa_universal_pilot_gate_v1',{p_slug:siteSlug})
    .catch(()=>({data:null,error:true}));
  const enabled=readGate.data?.ok===true&&readGate.data.enabled===true
   &&readGate.data.slug===siteSlug;
  fields.setupHint.textContent=enabled
   ? 'Pilote RÉSA ouvert par le serveur. Les disponibilités réelles sont seules réservables.'
   : profile.is_published
     ? 'Fiche RÉSA publiée ; le pilote de réservation reste fermé tant que l’atelier DIGIYLYFE ne l’active pas.'
     : 'Préparation privée : fiche RÉSA non publiée. Vos prestations restent en brouillon. Aucun client ne peut poser de rendez-vous.';
  status(services.length+' prestation(s) · '+slots.length+' créneau(x) saisi(s). Contact et paiement directs · 0 % commission.');
  for(const svc of services){
   const article=make(doc,'article','','resa-owner-booking');
   const price=svc.price_fcfa===null?'Tarif sur demande':Number(svc.price_fcfa).toLocaleString('fr-FR')+' FCFA';
   article.append(make(doc,'strong',svc.service_name));
   article.append(make(doc,'p',svc.duration_minutes+' min · '+price+' · '+(svc.is_active?'Active':'Brouillon')));
   const buttons=make(doc,'div','','resa-owner-actions');
   const edit=make(doc,'button','Modifier');edit.type='button';edit.className='btn';
   edit.addEventListener('click',()=>{
    if(busy)return;
    editing=svc.id;fields.name.value=svc.service_name;fields.duration.value=String(svc.duration_minutes);
    fields.price.value=svc.price_fcfa===null?'':String(svc.price_fcfa);
    fields.serviceSave.textContent='Enregistrer la prestation';fields.serviceCancel.hidden=false;
   });
   buttons.append(edit);
   const flip=make(doc,'button',svc.is_active?'Désactiver':'Activer');
   flip.type='button';flip.className='btn';
   if(!profile.is_published&&!svc.is_active){flip.disabled=true;flip.title='La publication RÉSA est contrôlée par DIGIYLYFE';}
   flip.addEventListener('click',async()=>{
    if(busy||(!profile.is_published&&!svc.is_active))return;
    if(svc.is_active&&typeof root.confirm==='function'&&
       !root.confirm('Désactiver cette prestation pour les prochaines demandes ?'))return;
    setBusy(true);
    try{
     const q=await ownedQuery(SERVICES).update({is_active:!svc.is_active})
      .eq('slug',siteSlug).eq('id',svc.id).select('id').maybeSingle();
     if(q.error||!q.data?.id)throw q.error||Error('denied');
     await load();
    }catch(e){status(friendly(e))}finally{setBusy(false)}
   });
   buttons.append(flip);article.append(buttons);servicesList.append(article);
  }
  if(!services.length)servicesList.append(make(doc,'p','Aucune prestation saisie. Ajoutez uniquement une activité et une durée réelles.','hint'));
  for(const slot of slots){
   const article=make(doc,'article','','resa-owner-booking');
   article.append(make(doc,'strong',slot.slot_date+' · '+String(slot.start_time).slice(0,5)+'–'+String(slot.end_time||'').slice(0,5)));
   article.append(make(doc,'p',slot.status==='open'?'Créneau proposé (non réservable avant activation serveur)':'Créneau fermé'));
   const action=make(doc,'button',slot.status==='open'?'Fermer ce créneau':'Rouvrir');
   action.type='button';action.className='btn';
   action.addEventListener('click',async()=>{
    if(busy)return;
    if(slot.status==='open'&&typeof root.confirm==='function'&&!root.confirm('Fermer ce créneau ? Les rendez-vous déjà confirmés ne sont pas annulés.'))return;
    setBusy(true);
    try{
     const q=await ownedQuery(SLOTS).update({status:slot.status==='open'?'closed':'open'})
       .eq('slug',siteSlug).eq('id',slot.id).select('id').maybeSingle();
     if(q.error||!q.data?.id)throw q.error||Error('denied');
     await load();
    }catch(e){status(friendly(e))}finally{setBusy(false)}
   });
   article.append(action);slotsList.append(article);
  }
  if(!slots.length)slotsList.append(make(doc,'p','Aucun créneau saisi. Le calendrier terrain EXPLORE ne réserve pas automatiquement.','hint'));
  return true;
 };
 const exploreDates=by('resaSetupExploreDates');
 async function loadExploreDates(){
  if(!exploreDates)return;
  exploreDates.replaceChildren();
  exploreDates.append(make(doc,'p','Journées déjà disponibles dans EXPLORE : reprenez seulement la date. Les heures et les prestations doivent être saisies dans RÉSA.','hint'));
  let result;
  try{
   result=await sb.rpc('digiy_explore_owner_calendar_v1',{
    p_slug:siteSlug,p_from:dayDakar(),p_days:14
   });
  }catch(_){
   exploreDates.append(make(doc,'p','Calendrier EXPLORE indisponible. Vous pouvez saisir la date manuellement.','hint'));
   return;
  }
  if(result.error||!Array.isArray(result.data)){
   exploreDates.append(make(doc,'p','Impossible de charger les dates EXPLORE. La saisie manuelle reste possible.','hint'));
   return;
  }
  const today=dayDakar(),limit=addDays(today,13);
  const available=result.data.filter(r=>r&&r.status==='available'&&DAY.test(String(r.day||''))
    &&r.day>=today&&r.day<=limit);
  for(const row of available.slice(0,14)){
   const parsed=explicitDepartureReturn(row.note);
   const usable=parsed&&validSlot(row.day,parsed.start,parsed.end)?parsed:null;
   const textDate=row.day+(usable?' · '+usable.start+'–'+usable.end:'')+
     (row.note?' · '+String(row.note).slice(0,100):'');
   const button=make(doc,'button',textDate);
   button.type='button';button.className='btn';
   button.addEventListener('click',()=>{
    fields.day.value=row.day;
    // Reset stale hours when the next chosen day does not have explicit valid times.
    fields.start.value=usable?usable.start:'';
    fields.end.value=usable?usable.end:'';
    status(usable
     ?'Date et horaires notés dans EXPLORE préremplis ('+usable.start+'–'+usable.end+'). Vérifiez votre prestation, puis enregistrez ce créneau.'
     :'Journée EXPLORE reprise : '+row.day+'. Saisissez vos heures réelles avant tout enregistrement.');
   });
   exploreDates.append(button);
  }
  if(!available.length)exploreDates.append(make(doc,'p','Aucune journée déclarée disponible pour les 14 prochains jours.','hint'));
 }
 fields.serviceCancel.onclick=clearEdit;
 fields.serviceSave.onclick=async()=>{
  if(busy)return;
  const v=validService(fields.name.value,fields.duration.value,fields.price.value);
  if(!v){status('Indiquez une prestation réelle (2–120 caractères), une durée de 5–480 min et un tarif facultatif valide.');return}
  setBusy(true);
  try{
   const q=editing
    ?await ownedQuery(SERVICES).update(v).eq('id',editing).eq('slug',siteSlug).select('id').maybeSingle()
    :await ownedQuery(SERVICES).insert({...v,slug:siteSlug,is_active:false}).select('id').maybeSingle();
   if(q.error||!q.data?.id)throw q.error||Error('denied');
   clearEdit();await load();
  }catch(e){status(friendly(e))}finally{setBusy(false)}
 };
 fields.slotSave.onclick=async()=>{
  if(busy)return;
  const day=fields.day.value,start=fields.start.value,end=fields.end.value;
  if(!validSlot(day,start,end)){status('Créneau invalide : choisissez une date réelle dans les 56 prochains jours, avec début futur et fin après début (8 h maximum).');return}
  const minutes=(Number(end.slice(0,2))*60+Number(end.slice(3,5)))-
    (Number(start.slice(0,2))*60+Number(start.slice(3,5)));
  if(!services.some(s=>s.duration_minutes<=minutes)){
   status('Enregistrez d’abord une prestation réelle dont la durée tient dans ce créneau.');return
  }
  setBusy(true);
  try{
   const q=await ownedQuery(SLOTS).insert({
    slug:siteSlug,slot_date:day,start_time:start,end_time:end,status:'open',capacity:1
   }).select('id').maybeSingle();
   if(q.error||!q.data?.id)throw q.error||Error('denied');
   fields.start.value='';fields.end.value='';await load();
  }catch(e){status(friendly(e))}finally{setBusy(false)}
 };
 fields.day.min=dayDakar();
 fields.day.max=addDays(fields.day.min,56);
 clearEdit();
 const loaded=await load();
 if(loaded)await loadExploreDates();
 return {ok:loaded,mode:loaded?'owner_setup':'read_failed',published:profile.is_published};
}
root.DIGIYExploreResaSetup=Object.freeze({dayDakar,addDays,validService,validSlot,explicitDepartureReturn,actualOwner,initialize});
})(typeof window!=='undefined'?window:globalThis);
