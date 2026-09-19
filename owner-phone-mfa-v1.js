(()=>{
"use strict";
function addStyle(){
  if(document.getElementById("digiyOwnerMfaStyle")) return;
  const s=document.createElement("style");s.id="digiyOwnerMfaStyle";
  s.textContent=`
  .digiyOwnerMfa{margin:12px 0;padding:12px;border-radius:14px;border:1px solid rgba(212,175,55,.35);background:rgba(212,175,55,.08);font:700 12px/1.45 system-ui,-apple-system,Segoe UI,sans-serif}
  .digiyOwnerMfa strong{display:block;margin-bottom:5px}.digiyOwnerMfa small{display:block;opacity:.78;margin-top:5px}
  .digiyOwnerMfaRow{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.digiyOwnerMfa button,.digiyOwnerMfa input{min-height:42px;border-radius:999px;padding:9px 12px;font:800 12px system-ui}
  .digiyOwnerMfa button{border:0;background:#073f32;color:#fff;cursor:pointer}.digiyOwnerMfa input{flex:1;min-width:160px;border:1px solid rgba(127,127,127,.3);background:#fff;color:#173b31}
  .digiyOwnerMfa.ok{border-color:rgba(34,197,94,.35);background:rgba(34,197,94,.09)}
  .digiyOwnerMfa.bad{border-color:rgba(239,68,68,.35);background:rgba(239,68,68,.09)}
  `;
  document.head.appendChild(s);
}
function boxBefore(beforeId){
  addStyle();
  let b=document.getElementById("digiyOwnerMfaBox");
  if(b) return b;
  b=document.createElement("div");b.id="digiyOwnerMfaBox";b.className="digiyOwnerMfa";
  const before=document.getElementById(beforeId);
  if(before?.parentNode) before.parentNode.insertBefore(b,before); else document.body.prepend(b);
  return b;
}
function mask(v){return String(v||"").replace(/^(.*)(\d{4})$/,"•••• $2")}
async function aal(sb){
  const {data,error}=await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if(error) throw error;
  return data;
}
async function factors(sb){
  const {data,error}=await sb.auth.mfa.listFactors();
  if(error) throw error;
  return data?.phone||[];
}
function waitCode(box,title,masked){
  return new Promise(resolve=>{
    box.className="digiyOwnerMfa";
    box.innerHTML=`<strong>${title}</strong><div>Code envoyé au téléphone ${masked}.</div><div class="digiyOwnerMfaRow"><input id="digiyMfaCode" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="Code reçu"><button id="digiyMfaVerify" type="button">Vérifier</button></div>`;
    const input=box.querySelector("#digiyMfaCode"),btn=box.querySelector("#digiyMfaVerify");
    const done=()=>resolve(String(input.value||"").trim());
    btn.onclick=done;input.addEventListener("keydown",e=>{if(e.key==="Enter")done()});input.focus();
  });
}
async function challengeAndVerify(sb,factorId,box,masked){
  const {data:ch,error:ce}=await sb.auth.mfa.challenge({factorId});
  if(ce) throw ce;
  const code=await waitCode(box,"Double sécurité téléphone",masked);
  if(!code) throw new Error("Code requis");
  const {error:ve}=await sb.auth.mfa.verify({factorId,challengeId:ch.id,code});
  if(ve) throw ve;
  const level=await aal(sb);
  if(level.currentLevel!=="aal2") throw new Error("La session n’a pas atteint le niveau de sécurité AAL2.");
}
async function enrollAndActivate(sb,ctx,box){
  box.className="digiyOwnerMfa";box.innerHTML="<strong>Activation de la double sécurité…</strong><div>Préparation du téléphone enregistré.</div>";
  let list=await factors(sb);
  let factor=list.find(f=>f.phone===ctx.phone);
  if(!factor){
    const {data,error}=await sb.auth.mfa.enroll({factorType:"phone",phone:ctx.phone,friendlyName:"DIGIY propriétaire"});
    if(error) throw error;
    factor=data;
  }
  await challengeAndVerify(sb,factor.id,box,ctx.masked_phone||mask(ctx.phone));
  const {error}=await sb.rpc("digiy_owner_mfa_activate");
  if(error) throw error;
  box.className="digiyOwnerMfa ok";box.innerHTML="<strong>✅ Double sécurité activée</strong><div>Les prochaines connexions exigeront aussi le téléphone enregistré.</div>";
  setTimeout(()=>location.reload(),700);
}
async function guard({supabase:sb,beforeId="editor"}){
  const {data:ctx,error}=await sb.rpc("digiy_owner_mfa_context");
  if(error) throw error;
  if(!ctx?.ok) return true;
  const box=boxBefore(beforeId);
  const level=await aal(sb);
  const list=await factors(sb);
  const matching=list.find(f=>f.phone===ctx.phone && f.status==="verified");

  if(ctx.required){
    if(level.currentLevel==="aal2" && ctx.matching_phone_factor_verified){
      box.className="digiyOwnerMfa ok";box.innerHTML="<strong>🔐 Téléphone vérifié</strong><div>Session propriétaire sécurisée.</div>";
      return true;
    }
    if(!matching){
      box.className="digiyOwnerMfa bad";box.innerHTML="<strong>🔒 Accès bloqué</strong><div>Le téléphone de sécurité enregistré n’est pas encore enrôlé. Contactez l’atelier DIGIYLYFE.</div>";
      return false;
    }
    try{
      await challengeAndVerify(sb,matching.id,box,ctx.masked_phone||mask(ctx.phone));
      box.className="digiyOwnerMfa ok";box.innerHTML="<strong>✅ Téléphone vérifié</strong><div>Accès propriétaire ouvert.</div>";
      return true;
    }catch(e){
      box.className="digiyOwnerMfa bad";box.innerHTML="<strong>Échec de vérification</strong><div>"+String(e?.message||e)+"</div>";
      return false;
    }
  }

  box.className="digiyOwnerMfa";
  box.innerHTML=`<strong>🔐 Double sécurité téléphone prête</strong><div>Numéro sécurité : ${ctx.masked_phone||mask(ctx.phone)}</div><small>L’activation rendra le téléphone obligatoire après le magic link email.</small><div class="digiyOwnerMfaRow"><button id="digiyMfaActivate" type="button">Activer le téléphone</button></div>`;
  box.querySelector("#digiyMfaActivate").onclick=async()=>{
    try{await enrollAndActivate(sb,ctx,box)}
    catch(e){box.className="digiyOwnerMfa bad";box.innerHTML="<strong>Activation impossible</strong><div>"+String(e?.message||e)+"</div>"}
  };
  return true;
}
window.DIGIY_OWNER_PHONE_MFA={guard};
})();