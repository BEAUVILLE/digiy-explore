/* DIGIY EXPLORE × RÉSA V9 — propriétaire uniquement.
 * Aucune réservation fabriquée, aucun encaissement/PAY, aucune clé serveur.
 * Le contrôle réel est l'auth.uid() + RLS + RPC V5 côté DIGIY CORE.
 */
(function(root){
'use strict';
const ACTIONS=Object.freeze({
 pending:['confirmed','cancelled'],
 confirmed:['done','no_show','cancelled']
});
const LABELS=Object.freeze({
 pending:'À confirmer', confirmed:'Confirmé',
 cancelled:'Annulé',done:'Terminé',no_show:'Absent'
});
function transitions(status){return (ACTIONS[String(status||'')]||[]).slice()}
function validateReference(place){
 if(!root.DIGIYExploreResa || typeof root.DIGIYExploreResa.parseApprovedResaLink!=='function')return null;
 return root.DIGIYExploreResa.parseApprovedResaLink(place);
}
function localDateInDakar(now){
 const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Dakar',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now||new Date());
 const x={};p.forEach(a=>{if(a.type!=='literal')x[a.type]=a.value});
 return x.year+'-'+x.month+'-'+x.day;
}
function txt(tag,value,cls){
 const n=document.createElement(tag);
 n.textContent=String(value==null?'':value);
 if(cls)n.className=cls;
 return n;
}
function errorCode(e){return String(e?.code||e?.message||'unavailable')}
async function initialize(args){
 const doc=args?.document||document;
 const section=doc.getElementById('resaOwnerCard');
 const status=doc.getElementById('resaOwnerStatus');
 const list=doc.getElementById('resaOwnerBookings');
 const link=doc.getElementById('resaOwnerPublicLink');
 if(!section||!status||!list||!link)return {ok:false,reason:'missing_dom'};
 section.hidden=true;list.replaceChildren();link.hidden=true;link.removeAttribute('href');
 const sb=args?.supabase,user=args?.user,place=args?.place;
 if(!args?.ownerVerified||!user?.id||!sb||!place||String(place.slug)!==String(args.siteSlug))
  return {ok:false,reason:'owner_not_verified'};
 section.hidden=false;
 const reference=validateReference(place);
 if(!reference){
  status.textContent='Aucun planning RÉSA relié à cette fiche. Votre calendrier terrain EXPLORE reste disponible ; il ne réserve pas de créneau automatiquement.';
  return {ok:true,mode:'not_linked'};
 }
 status.textContent='Vérification de votre accès au planning RÉSA…';
 const {data:profile,error:pe}=await sb.from('digiy_resa_profiles')
  .select('slug,auth_user_id,is_active,is_published,display_name')
  .eq('slug',reference.slug).eq('auth_user_id',user.id).eq('is_active',true).maybeSingle();
 if(pe||!profile||profile.auth_user_id!==user.id||profile.slug!==reference.slug){
  status.textContent='Ce planning RÉSA n’est pas encore rattaché à votre compte propriétaire. Aucun rendez-vous privé n’est affiché. Contactez l’équipe DIGIYLYFE pour valider le lien.';
  return {ok:true,mode:'ownership_unconfirmed'};
 }
 // Link remains a public *view* only, not an owner's secret or a claim token.
 link.href=reference.href;link.hidden=false;link.rel='noopener noreferrer';link.target='_blank';
 link.textContent='📅 Voir le planning RÉSA public';
 const gate=await sb.rpc('digiy_resa_universal_pilot_gate_v1',{p_slug:reference.slug});
 if(gate.error || gate.data?.ok!==true){
  status.textContent='RÉSA V9 n’est pas encore installé pour les rendez-vous sécurisés. Le calendrier EXPLORE ne crée aucune réservation.';
  return {ok:true,mode:'v9_unavailable'};
 }
 // Never show a "pilot enabled" status unless it came from the server.
 const enabled=gate.data.enabled===true;
 const day=localDateInDakar();
 const refresh=async()=>{
  list.replaceChildren();
  const res=await sb.from('digiy_resa_bookings')
   .select('id,booking_date,booking_time,customer_name,customer_phone,service_name,status,note_text,client_request_id')
   .eq('slug',reference.slug).not('client_request_id','is',null)
   .gte('booking_date',day)
   .order('booking_date',{ascending:true}).order('booking_time',{ascending:true}).limit(50);
  if(res.error){
   status.textContent='Lecture du planning indisponible : aucun rendez-vous n’a été modifié.';
   return {ok:false,reason:'read_failed'};
  }
  const rows=Array.isArray(res.data)?res.data:[];
  status.textContent=(enabled?'Pilote RÉSA activé. ':'Pilote RÉSA fermé. ')
    +(rows.length?rows.length+' rendez-vous sécurisé(s) à suivre.':'Aucun nouveau rendez-vous sécurisé à suivre.')
    +' Paiement direct au professionnel, jamais enregistré automatiquement.';
  for(const row of rows){
   if(!row?.id||!row.client_request_id)continue;
   const item=txt('article','','resa-owner-booking');
   item.append(txt('strong',String(row.booking_date||'')+' · '+String(row.booking_time||'').slice(0,5)+' · '+String(row.service_name||'Prestation')));
   item.append(txt('p',String(row.customer_name||'Client')+' · '+String(row.customer_phone||'')+' · '+(LABELS[row.status]||String(row.status||''))));
   const buttons=txt('div','','resa-owner-actions');
   for(const action of transitions(row.status)){
    const b=txt('button',LABELS[action]||action);
    b.type='button';b.className='btn';
    b.addEventListener('click',async()=>{
     if(b.disabled)return;
     if(['cancelled','done','no_show'].includes(action) && typeof root.confirm==='function' &&
        !root.confirm('Confirmer le changement de statut ? Cette action sera enregistrée auprès du serveur.'))return;
     b.disabled=true;
     status.textContent='Enregistrement auprès du serveur…';
     try{
      const result=await sb.rpc('digiy_resa_universal_owner_manage_v2',{
       p_booking_id:row.id,p_action:action,p_note_text:null
      });
      if(result.error||result.data?.ok!==true)throw Error(errorCode(result.error||result.data));
      await refresh();
     }catch(_){
      status.textContent='Modification refusée ou indisponible. Aucun statut confirmé sans réponse du serveur.';
      b.disabled=false;
     }
    });
    buttons.append(b);
   }
   item.append(buttons);
   const note=doc.createElement('textarea');
   note.maxLength=1000;note.rows=2;note.placeholder='Note privée du professionnel';
   note.setAttribute('aria-label','Note privée');
   note.value=String(row.note_text||'').slice(0,1000);
   const save=txt('button','Enregistrer la note');
   save.type='button';save.className='btn';
   save.addEventListener('click',async()=>{
    if(save.disabled)return;
    save.disabled=true;
    try{
     const result=await sb.rpc('digiy_resa_universal_owner_manage_v2',{
      p_booking_id:row.id,p_action:'note',p_note_text:note.value
     });
     if(result.error||result.data?.ok!==true)throw Error('refused');
     await refresh();
    }catch(_){
     status.textContent='Note non enregistrée. Vérifiez votre accès propriétaire.';
     save.disabled=false;
    }
   });
   item.append(note);item.append(save);list.append(item);
  }
  return {ok:true,mode:'ready',count:rows.length,enabled};
 };
 return refresh();
}
root.DIGIYExploreResaOwner=Object.freeze({transitions,validateReference,localDateInDakar,initialize});
})(typeof window!=='undefined'?window:globalThis);
