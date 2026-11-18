/* DIGIY EXPLORE — 7 langues natives, sans fetch ni document.write */
(function(){
  'use strict';
  if(window.__DIGIY_EXPLORE_7LANG__) return;
  window.__DIGIY_EXPLORE_7LANG__=true;

  var SUPPORTED=["fr", "en", "es", "de", "it", "nl", "ar", "wo", "zh"];
  var STORE='digiy_explore_lang_7';
  var ROWS=window.DIGIY_EXPLORE_I18N_ROWS||[];
  var META={"index": {"fr": ["DIGIY EXPLORE — Découvrir les bons coins", "DIGIY EXPLORE — découvrir rapidement les lieux et expériences du terrain, contacter directement DIGIY et proposer un lieu sans engagement."], "en": ["DIGIY EXPLORE — Discover the right spots", "DIGIY EXPLORE — quickly discover local places and experiences, contact DIGIY directly and suggest a place with no commitment."], "es": ["DIGIY EXPLORE — Descubre los mejores lugares", "DIGIY EXPLORE — descubre rápidamente lugares y experiencias locales, contacta directamente con DIGIY y propone un lugar sin compromiso."], "de": ["DIGIY EXPLORE — Gute Orte entdecken", "DIGIY EXPLORE — lokale Orte und Erlebnisse schnell entdecken, DIGIY direkt kontaktieren und unverbindlich einen Ort vorschlagen."], "it": ["DIGIY EXPLORE — Scopri i posti giusti", "DIGIY EXPLORE — scopri rapidamente luoghi ed esperienze locali, contatta direttamente DIGIY e proponi un luogo senza impegno."], "nl": ["DIGIY EXPLORE — Ontdek de beste plekken", "DIGIY EXPLORE — ontdek snel lokale plekken en ervaringen, neem direct contact op met DIGIY en stel vrijblijvend een plek voor."], "ar": ["DIGIY EXPLORE — اكتشف الأماكن الجيدة", "DIGIY EXPLORE — اكتشف بسرعة الأماكن والتجارب المحلية، وتواصل مباشرة مع DIGIY واقترح مكانًا دون التزام."]}, "catalogue": {"fr": ["DIGIY EXPLORE — Lieux et expériences du terrain", "Catalogue officiel DIGIY EXPLORE : expériences actives, annonces passerelles et inspirations clairement distinguées."], "en": ["DIGIY EXPLORE — Local places and experiences", "Official DIGIY EXPLORE catalogue: active experiences, bridge listings and inspirations clearly distinguished."], "es": ["DIGIY EXPLORE — Lugares y experiencias locales", "Catálogo oficial DIGIY EXPLORE: experiencias activas, anuncios puente e inspiraciones claramente diferenciados."], "de": ["DIGIY EXPLORE — Orte und Erlebnisse vor Ort", "Offizieller DIGIY EXPLORE-Katalog: aktive Erlebnisse, Brückenanzeigen und Inspirationen klar unterschieden."], "it": ["DIGIY EXPLORE — Luoghi ed esperienze locali", "Catalogo ufficiale DIGIY EXPLORE: esperienze attive, annunci ponte e ispirazioni chiaramente distinti."], "nl": ["DIGIY EXPLORE — Lokale plekken en ervaringen", "Officiële DIGIY EXPLORE-catalogus: actieve ervaringen, brugvermeldingen en inspiraties duidelijk onderscheiden."], "ar": ["DIGIY EXPLORE — أماكن وتجارب محلية", "كتالوج DIGIY EXPLORE الرسمي: تجارب نشطة وإعلانات تمهيدية وإلهامات مميزة بوضوح."]}, "fiche": {"fr": ["Voir le lieu — DIGIY EXPLORE", "Découvrez un lieu avec son ambiance, ses photos, son repère utile, son QR public et son contact direct."], "en": ["View the place — DIGIY EXPLORE", "Discover a place with its atmosphere, photos, useful landmark, public QR and direct contact."], "es": ["Ver el lugar — DIGIY EXPLORE", "Descubre un lugar con su ambiente, fotos, referencia útil, QR público y contacto directo."], "de": ["Ort ansehen — DIGIY EXPLORE", "Entdecke einen Ort mit Atmosphäre, Fotos, Orientierungspunkt, öffentlichem QR und direktem Kontakt."], "it": ["Vedi il luogo — DIGIY EXPLORE", "Scopri un luogo con atmosfera, foto, riferimento utile, QR pubblico e contatto diretto."], "nl": ["Bekijk de plek — DIGIY EXPLORE", "Ontdek een plek met sfeer, foto’s, herkenningspunt, openbare QR en direct contact."], "ar": ["عرض المكان — DIGIY EXPLORE", "اكتشف مكانًا بأجوائه وصوره وعلامته المفيدة ورمز QR العام والتواصل المباشر."]}, "inscription": {"fr": ["Demande EXPLORE — Activation directe", "Demande DIGIY EXPLORE : coordonnées, formule de visibilité, paiement direct et preuve WhatsApp ou SMS."], "en": ["EXPLORE request — Direct activation", "DIGIY EXPLORE request: contact details, visibility plan, direct payment and WhatsApp or SMS proof."], "es": ["Solicitud EXPLORE — Activación directa", "Solicitud DIGIY EXPLORE: datos, fórmula de visibilidad, pago directo y comprobante por WhatsApp o SMS."], "de": ["EXPLORE-Anfrage — Direkte Aktivierung", "DIGIY EXPLORE-Anfrage: Kontaktdaten, Sichtbarkeitspaket, Direktzahlung und Nachweis per WhatsApp oder SMS."], "it": ["Richiesta EXPLORE — Attivazione diretta", "Richiesta DIGIY EXPLORE: dati, formula di visibilità, pagamento diretto e prova via WhatsApp o SMS."], "nl": ["EXPLORE-aanvraag — Directe activering", "DIGIY EXPLORE-aanvraag: contactgegevens, zichtbaarheidspakket, directe betaling en bewijs via WhatsApp of sms."], "ar": ["طلب EXPLORE — تفعيل مباشر", "طلب DIGIY EXPLORE: بيانات الاتصال وخطة الظهور والدفع المباشر والإثبات عبر واتساب أو SMS."]}};
  var frame=document.getElementById('exploreFrame');
  var loading=document.getElementById('exploreLoading');
  var page=(document.body.getAttribute('data-page')||'index').toLowerCase();
  var core=document.body.getAttribute('data-core')||'index-core.html';
  var current='fr';
  var ready=false;
  var applying=false;
  var textState=new WeakMap();
  var attrState=new WeakMap();
  var observer=null;
  var langIndex={fr:0,en:1,es:2,de:3,it:4,nl:5,ar:6};
  var exact={};
  var partial=[];

  function norm(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
  ROWS.forEach(function(r){
    var key=norm(r[0]);
    if(!key)return;
    exact[key]=r;
    partial.push(r);
  });
  partial.sort(function(a,b){return norm(b[0]).length-norm(a[0]).length;});

  var world10 = {
  "Découvre les bons coins.": {
    "wo": "Xam bérab yu baax yi.",
    "zh": "发现值得去的好地方。"
  },
  "Choisis une expérience.": {
    "wo": "Tànnal li nga bëgg a def.",
    "zh": "选择你的体验。"
  },
  "Parle au bon contact.": {
    "wo": "Jokkoo ak ki war.",
    "zh": "直接联系合适的人。"
  },
  "Voir les découvertes": {
    "wo": "Xool bérab yi",
    "zh": "查看推荐体验"
  },
  "Voir la fiche": {
    "wo": "Xool kart bi",
    "zh": "查看档案"
  },
  "Voir la carte": {
    "wo": "Xool kaart bi",
    "zh": "查看名片"
  },
  "Appeler": {
    "wo": "Woo",
    "zh": "拨打电话"
  },
  "À découvrir maintenant": {
    "wo": "Li nga man a gis léegi",
    "zh": "现在就去探索"
  },
  "Sortie pêche — Petite Côte": {
    "wo": "Dem napp — Petite Côte",
    "zh": "钓鱼出游 — 小海岸"
  },
  "Je suis intéressé": {
    "wo": "Bëgg naa xam ci lu gën a bari",
    "zh": "我感兴趣"
  },
  "Retour au site": {
    "wo": "Dellu ci sit bi",
    "zh": "返回网站"
  },
  "Retour": {
    "wo": "Dellu",
    "zh": "返回"
  },
  "Proposer un lieu": {
    "wo": "Joxe xalaatu bérab",
    "zh": "推荐地点"
  },
  "Proposer mon lieu": {
    "wo": "Won sama bérab",
    "zh": "推荐我的地点"
  },
  "Proposer une activité": {
    "wo": "Joxe xalaatu liggéey",
    "zh": "推荐活动"
  },
  "Proposer une expérience": {
    "wo": "Joxe xalaatu li ñu man a def",
    "zh": "推荐体验"
  },
  "Informations professionnelles": {
    "wo": "Xibaaru liggéey",
    "zh": "经营者信息"
  },
  "🔐 Accès propriétaire": {
    "wo": "🔐 Duggukaayu boroom bi",
    "zh": "🔐 经营者入口"
  },
  "Contact direct": {
    "wo": "Jokkoo jub",
    "zh": "直接联系"
  },
  "Y aller": {
    "wo": "Dem fa",
    "zh": "前往此处"
  },
  "Partager": {
    "wo": "Séddale",
    "zh": "分享"
  },
  "Images": {
    "wo": "Nataal yi",
    "zh": "图片"
  },
  "À savoir": {
    "wo": "Li nga war a xam",
    "zh": "须知"
  },
  "Infos utiles": {
    "wo": "Xibaar yu am solo",
    "zh": "实用信息"
  },
  "Ambiance en images": {
    "wo": "Melokaanu bérab bi ci nataal",
    "zh": "现场图片"
  },
  "📋 Copier": {
    "wo": "📋 Duppi",
    "zh": "📋 复制"
  },
  "🧭 Ouvrir": {
    "wo": "🧭 Ubbi",
    "zh": "🧭 打开"
  },
  "↗ Ouvrir": {
    "wo": "↗ Ubbi",
    "zh": "↗ 打开"
  },
  "Tarifs": {
    "wo": "Njëg yi",
    "zh": "价格"
  },
  "📅 Cette semaine": {
    "wo": "📅 Ayu-bés bii",
    "zh": "📅 本周"
  },
  "Disponibilité terrain sur les 7 prochains jours.": {
    "wo": "Waxtu yi féex ci juróom-ñaari fan yi di ñëw.",
    "zh": "未来七天的可用情况。"
  },
  "📅 Voir le planning et choisir un créneau": {
    "wo": "📅 Xool palaan bi te tànn waxtu",
    "zh": "📅 查看日程并选择时段"
  },
  "💬 Demander une disponibilité": {
    "wo": "💬 Laaj waxtu wu féex",
    "zh": "💬 询问可用时间"
  },
  "📅 Rendez-vous du professionnel": {
    "wo": "📅 Ndaje yi ak ki di liggéey",
    "zh": "📅 服务人员的预约"
  },
  "Vérification des disponibilités…": {
    "wo": "Ñu ngi seet waxtu yi féex…",
    "zh": "正在查询可用时间…"
  },
  "EXPLORE montre immédiatement les lieux, sorties et idées du terrain. Tu regardes, tu choisis, puis tu contactes DIGIY ou l’acteur local quand la porte est prête.": {
    "wo": "EXPLORE day wone bérab yi ak li nga man a def. Xoolal, tànnal, te jokkoo ak DIGIY walla ki di liggéey ci gox bi.",
    "zh": "EXPLORE 展示本地地点、出游和活动。浏览并选择后，可联系 DIGIY 或当地经营者。"
  },
  "Contact, adresse, ambiance et mots utiles.": {
    "wo": "Jokkoo, adrees ak melokaanu bérab bi.",
    "zh": "联系方式、地址和现场氛围。"
  },
  "Le résumé utile pour comprendre vite et décider.": {
    "wo": "Ci gàttal, li nga soxla ngir tànn.",
    "zh": "快速了解并作出选择。"
  },
  "💳 Consulter les tarifs adhérents": {
    "wo": "💳 Xool njëgu bokk",
    "zh": "💳 查看会员价格"
  }
};
  META.index.wo=['DIGIY EXPLORE — Xam bérab yu baax yi','Seetal bérab ak liggéey yu nekk ci gox bi.'];
  META.index.zh=['DIGIY EXPLORE — 探索好去处','发现当地地点与体验。'];
  META.fiche.wo=['Xool bérab bi — DIGIY EXPLORE','Xoolal bérab bi ak anam wi ngay jokkoo ak boroom bi.'];
  META.fiche.zh=['查看地点 — DIGIY EXPLORE','查看地点信息并直接联系经营者。'];
  function valid(v){
    v=String(v||'').slice(0,2).toLowerCase();
    return SUPPORTED.indexOf(v)>=0?v:'fr';
  }
  function initial(){
    var q=new URLSearchParams(location.search).get('lang');
    if(q)return valid(q);
    try{return valid(localStorage.getItem(STORE)||'fr');}catch(e){return 'fr';}
  }
  function translated(value,lang){
    var raw=String(value==null?'':value);
    if(lang==='fr')return raw;
    var clean=norm(raw);
    if(lang==='wo'||lang==='zh')return Object.hasOwn(world10,clean)?world10[clean][lang]:raw;
    var row=exact[clean];
    if(row)return row[langIndex[lang]]||raw;
    var result=clean;
    partial.forEach(function(r){
      var fr=norm(r[0]), to=r[langIndex[lang]];
      if(fr && to && result.indexOf(fr)>=0)result=result.split(fr).join(to);
    });
    return result;
  }
  function looksFrench(value){
    var clean=norm(value);
    if(exact[clean]||Object.hasOwn(world10,clean))return true;
    return partial.some(function(r){var fr=norm(r[0]);return fr.length>10&&clean.indexOf(fr)>=0;});
  }
  function rememberText(node){
    var raw=node.nodeValue||'';
    var state=textState.get(node);
    if(!state){state={original:raw,last:null};textState.set(node,state);}
    else if(state.last!==raw && (current==='fr'||looksFrench(raw)))state.original=raw;
    return state;
  }
  function translateTextNode(node,lang){
    if(!node||node.nodeType!==3)return;
    if(!norm(node.nodeValue))return;
    var p=node.parentElement;
    if(!p||p.closest('script,style,textarea,select,option'))return;
    var state=rememberText(node);
    var next=lang==='fr'?state.original:translated(state.original,lang);
    if(node.nodeValue!==next){state.last=next;node.nodeValue=next;}else state.last=next;
  }
  function attrBox(el){
    var box=attrState.get(el);
    if(!box){box={};attrState.set(el,box);}
    return box;
  }
  function translateAttr(el,attr,lang){
    if(!el||!el.getAttribute)return;
    var raw=el.getAttribute(attr);
    if(raw==null||raw==='')return;
    var box=attrBox(el), state=box[attr];
    if(!state)state=box[attr]={original:raw,last:null};
    else if(state.last!==raw && (lang==='fr'||attr==='href'||looksFrench(raw)))state.original=raw;
    var next=state.original;
    if(lang!=='fr'){
      if(attr==='href')next=localizeUrl(state.original,lang);
      else next=translated(state.original,lang);
    }
    if(raw!==next){state.last=next;el.setAttribute(attr,next);}else state.last=next;
  }
  function localizeUrl(href,lang){
    try{
      var u=new URL(href,frame.contentWindow.location.href);
      ['text','body'].forEach(function(k){
        if(u.searchParams.has(k))u.searchParams.set(k,translated(u.searchParams.get(k),lang));
      });
      return u.href;
    }catch(e){return href;}
  }
  function translateNode(root,lang){
    if(!root)return;
    if(root.nodeType===3){translateTextNode(root,lang);return;}
    if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
    if(root.nodeType===1){
      ['placeholder','aria-label','title','alt','href'].forEach(function(a){translateAttr(root,a,lang);});
    }
    var doc=root.ownerDocument||root;
    var walker=doc.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
      var p=node.parentElement;
      if(!p||p.closest('script,style,textarea,select,option'))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    var nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(function(n){translateTextNode(n,lang);});
    if(root.querySelectorAll)root.querySelectorAll('[placeholder],[aria-label],[title],[alt],a[href]').forEach(function(el){
      ['placeholder','aria-label','title','alt','href'].forEach(function(a){translateAttr(el,a,lang);});
    });
  }
  function setDirection(doc,lang){
    doc.documentElement.lang=lang;
    doc.documentElement.dir=lang==='ar'?'rtl':'ltr';
    var style=doc.getElementById('digiyExploreFrameLangStyle');
    if(!style){style=doc.createElement('style');style.id='digiyExploreFrameLangStyle';doc.head.appendChild(style);}
    var open=translated('↗ Ouvrir',lang).replace(/"/g,'\\22 ');
    style.textContent=
      '.lang-switch{display:none!important}'+
      'html[dir="rtl"] body{direction:rtl;text-align:right}'+
      'html[dir="rtl"] .topbar-inner,html[dir="rtl"] .topbar,html[dir="rtl"] .section-head,html[dir="rtl"] .footer-row{direction:rtl}'+
      '.photo::after{content:"'+open+'"!important}';
  }
  function updateShell(lang){
    current=lang;
    document.documentElement.lang=lang;
    document.documentElement.dir=lang==='ar'?'rtl':'ltr';
    var m=(META[page]||META.index)[lang]||(META[page]||META.index).fr;
    document.title=m[0];
    var d=document.querySelector('meta[name="description"]');if(d)d.content=m[1];
    document.querySelectorAll('[data-shell-lang]').forEach(function(btn){
      var on=btn.getAttribute('data-shell-lang')===lang;
      btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',on?'true':'false');
    });
    try{localStorage.setItem(STORE,lang);}catch(e){}
    if(history.replaceState){
      var u=new URL(location.href);u.searchParams.set('lang',lang);u.searchParams.delete('v');
      history.replaceState({},'',u.pathname+u.search+u.hash);
    }
  }
  function setIndexMessages(doc,lang){
    var messages={
      fr:{general:'Bonjour, je viens de DIGIY EXPLORE. Je souhaite une information sur un lieu ou proposer une visibilité sans engagement.',fishing:'Bonjour, je viens de DIGIY EXPLORE. Je suis intéressé par une sortie pêche sur la Petite Côte.',saly:'Bonjour, je viens de DIGIY EXPLORE. Je connais un lieu à Saly à faire découvrir.',exp:'Bonjour, je viens de DIGIY EXPLORE. Je veux proposer une expérience locale.'},
      en:{general:'Hello, I come from DIGIY EXPLORE. I would like information about a place or to suggest visibility with no commitment.',fishing:'Hello, I come from DIGIY EXPLORE. I am interested in a fishing trip on the Petite Côte.',saly:'Hello, I come from DIGIY EXPLORE. I know a place in Saly to showcase.',exp:'Hello, I come from DIGIY EXPLORE. I want to suggest a local experience.'},
      es:{general:'Hola, vengo de DIGIY EXPLORE. Quisiera información sobre un lugar o proponer visibilidad sin compromiso.',fishing:'Hola, vengo de DIGIY EXPLORE. Me interesa una salida de pesca en la Petite Côte.',saly:'Hola, vengo de DIGIY EXPLORE. Conozco un lugar en Saly para dar a conocer.',exp:'Hola, vengo de DIGIY EXPLORE. Quiero proponer una experiencia local.'},
      de:{general:'Hallo, ich komme von DIGIY EXPLORE. Ich möchte Informationen zu einem Ort oder unverbindlich Sichtbarkeit vorschlagen.',fishing:'Hallo, ich komme von DIGIY EXPLORE. Ich interessiere mich für einen Angelausflug an der Petite Côte.',saly:'Hallo, ich komme von DIGIY EXPLORE. Ich kenne einen Ort in Saly, der vorgestellt werden sollte.',exp:'Hallo, ich komme von DIGIY EXPLORE. Ich möchte ein lokales Erlebnis vorschlagen.'},
      it:{general:'Ciao, vengo da DIGIY EXPLORE. Vorrei informazioni su un luogo o proporre visibilità senza impegno.',fishing:'Ciao, vengo da DIGIY EXPLORE. Sono interessato a un’uscita di pesca sulla Petite Côte.',saly:'Ciao, vengo da DIGIY EXPLORE. Conosco un luogo a Saly da far scoprire.',exp:'Ciao, vengo da DIGIY EXPLORE. Voglio proporre un’esperienza locale.'},
      nl:{general:'Hallo, ik kom via DIGIY EXPLORE. Ik wil informatie over een plek of vrijblijvend zichtbaarheid voorstellen.',fishing:'Hallo, ik kom via DIGIY EXPLORE. Ik heb interesse in een visuitstap aan de Petite Côte.',saly:'Hallo, ik kom via DIGIY EXPLORE. Ik ken een plek in Saly om voor te stellen.',exp:'Hallo, ik kom via DIGIY EXPLORE. Ik wil een lokale ervaring voorstellen.'},
      ar:{general:'مرحبًا، أتيت من DIGIY EXPLORE. أود معلومات عن مكان أو اقتراح ظهور دون التزام.',fishing:'مرحبًا، أتيت من DIGIY EXPLORE. أنا مهتم برحلة صيد على الساحل الصغير.',saly:'مرحبًا، أتيت من DIGIY EXPLORE. أعرف مكانًا في سالي يستحق التعريف.',exp:'مرحبًا، أتيت من DIGIY EXPLORE. أريد اقتراح تجربة محلية.'}
      ,wo:{general:'Nanga def, DIGIY EXPLORE laa jóge. Bëgg naa ay xibaar ci bérab bi.',fishing:'Nanga def, DIGIY EXPLORE laa jóge. Bëgg naa dem napp ci Petite Côte.',saly:'Nanga def, xam naa bérab bu nekk Saly bu ma bëgg a won.',exp:'Nanga def, bëgg naa won li ñu man a def ci sama gox.'},
      zh:{general:'您好，我通过 DIGIY EXPLORE 联系您，想咨询地点信息。',fishing:'您好，我通过 DIGIY EXPLORE 联系您，想了解小海岸的钓鱼出游。',saly:'您好，我想推荐萨利的一个地点。',exp:'您好，我想推荐一项当地体验。'}
    }[lang];
    function wa(id,text){var el=doc.getElementById(id);if(el)el.href='https://wa.me/221771342889?text='+encodeURIComponent(text);}
    function sms(id,text){var el=doc.getElementById(id);if(el)el.href='sms:+221771342889?body='+encodeURIComponent(text);}
    wa('waExploreTop',messages.general);wa('waExploreInfo',messages.general);sms('smsExploreInfo',messages.general);
    wa('waFishing',messages.fishing);sms('smsFishing',messages.fishing);wa('waPlaceSaly',messages.saly);wa('waExperience',messages.exp);
  }
  function routeLinks(doc){
    doc.addEventListener('click',function(e){
      var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
      if(!a)return;
      var raw=a.getAttribute('href')||'';
      if(!raw||raw.charAt(0)==='#'||/^(tel:|sms:|mailto:|javascript:)/i.test(raw))return;
      var u;
      try{u=new URL(a.href);}catch(err){return;}
      if(!/^https?:$/.test(u.protocol))return;
      if(u.origin===location.origin){
        u.pathname=u.pathname
          .replace(/\/index-core\.html$/,'/index.html')
          .replace(/\/catalogue-core\.html$/,'/catalogue.html')
          .replace(/\/fiche-core\.html$/,'/fiche.html')
          .replace(/\/inscription-explore-core\.html$/,'/inscription-explore.html');
        u.searchParams.set('lang',current);
      }
      if(a.target==='_blank'&&u.origin!==location.origin)return;
      e.preventDefault();
      try{window.top.location.href=u.href;}catch(err){location.href=u.href;}
    },true);
  }
  function watch(doc){
    if(observer)observer.disconnect();
    observer=new MutationObserver(function(mutations){
      if(applying)return;
      applying=true;
      try{
        mutations.forEach(function(m){
          if(m.type==='characterData')translateTextNode(m.target,current);
          else if(m.type==='attributes')translateAttr(m.target,m.attributeName,current);
          else Array.prototype.forEach.call(m.addedNodes,function(n){translateNode(n,current);});
        });
      }finally{applying=false;}
    });
    observer.observe(doc.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['href','placeholder','aria-label','title','alt']});
  }
  function apply(lang){
    lang=valid(lang);updateShell(lang);
    if(!ready)return;
    var doc=frame.contentDocument;
    if(!doc)return;
    applying=true;
    try{
      setDirection(doc,lang);
      translateNode(doc.body,lang);
      if(page==='index')setIndexMessages(doc,lang);
      var m=(META[page]||META.index)[lang]||(META[page]||META.index).fr;
      doc.title=m[0];
    }finally{applying=false;}
  }
  function coreUrl(){
    var u=new URL(core,location.href);
    var src=new URLSearchParams(location.search);
    src.delete('lang');src.delete('v');
    src.forEach(function(v,k){u.searchParams.set(k,v);});
    return u.href;
  }
  function goHash(doc){
    var id=(location.hash||'').slice(1);if(!id)return;
    setTimeout(function(){var el=doc.getElementById(id);if(el)el.scrollIntoView({block:'start'});},80);
  }
  function onLoad(){
    ready=true;
    var doc=frame.contentDocument, win=frame.contentWindow;
    if(!doc||!win)return;
    try{
      if(page==='index'&&typeof win.applyLang==='function')win.applyLang('fr',false);
      var innerSwitch=doc.querySelector('.lang-switch');if(innerSwitch)innerSwitch.style.display='none';
    }catch(e){}
    routeLinks(doc);watch(doc);apply(current);goHash(doc);
    loading.classList.add('hidden');
  }
  document.querySelectorAll('[data-shell-lang]').forEach(function(btn){
    btn.addEventListener('click',function(){apply(btn.getAttribute('data-shell-lang'));});
  });
  frame.addEventListener('load',onLoad);
  current=initial();updateShell(current);frame.src=coreUrl();
})();
