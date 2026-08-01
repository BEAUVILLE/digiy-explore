/* DIGIY EXPLORE — cartouche des portes publiques et professionnelles */
(function(){
  'use strict';
  if(window.__DIGIY_EXPLORE_PORTES_CARTOUCHE__) return;
  window.__DIGIY_EXPLORE_PORTES_CARTOUCHE__=true;

  var frame=document.getElementById('exploreFrame');
  if(!frame || !document.body || document.body.getAttribute('data-page')!=='index') return;

  var STORE='digiy_explore_lang_7';
  var SUPPORTED=['fr','en','es','de','it','nl','ar'];
  var mountedDoc=null;

  var COPY={
    fr:{eyebrow:'PORTES EXPLORE · SÉNÉGAL · EUROPE · MONDE',title:'Choisir directement ma porte',text:'Découvrir, proposer un lieu, ouvrir l’espace professionnel ou revenir à la maison DIGIY.',registration:'Proposer mon lieu',registrationNote:'Inscription, formule CODE 8 et activation',discoveries:'Voir les découvertes',discoveriesNote:'Lieux, sorties et expériences du terrain',pro:'Espace professionnel',proNote:'PIN sécurisé, fiche lieu et QR',site:'Site DIGIYLYFE',siteNote:'Vision, offres et présence terrain',hub:'HUB DIGIY',hubNote:'Revenir à la gare centrale'},
    en:{eyebrow:'EXPLORE DOORS · SENEGAL · EUROPE · WORLD',title:'Choose my door directly',text:'Discover, suggest a place, open the professional area or return to the DIGIY home.',registration:'Suggest my place',registrationNote:'Registration, CODE 8 plan and activation',discoveries:'View discoveries',discoveriesNote:'Local places, outings and experiences',pro:'Professional area',proNote:'Secure PIN, place profile and QR',site:'DIGIYLYFE website',siteNote:'Vision, offers and local presence',hub:'DIGIY HUB',hubNote:'Return to the central station'},
    es:{eyebrow:'PUERTAS EXPLORE · SENEGAL · EUROPA · MUNDO',title:'Elegir directamente mi puerta',text:'Descubrir, proponer un lugar, abrir el espacio profesional o volver a la casa DIGIY.',registration:'Proponer mi lugar',registrationNote:'Inscripción, fórmula CODE 8 y activación',discoveries:'Ver los descubrimientos',discoveriesNote:'Lugares, salidas y experiencias locales',pro:'Espacio profesional',proNote:'PIN seguro, ficha del lugar y QR',site:'Sitio DIGIYLYFE',siteNote:'Visión, ofertas y presencia local',hub:'HUB DIGIY',hubNote:'Volver a la estación central'},
    de:{eyebrow:'EXPLORE-ZUGÄNGE · SENEGAL · EUROPA · WELT',title:'Direkt den passenden Zugang wählen',text:'Entdecken, einen Ort vorschlagen, den Profibereich öffnen oder zum DIGIY-Haus zurückkehren.',registration:'Meinen Ort vorschlagen',registrationNote:'Registrierung, CODE-8-Paket und Aktivierung',discoveries:'Entdeckungen ansehen',discoveriesNote:'Orte, Ausflüge und lokale Erlebnisse',pro:'Profibereich',proNote:'Sicherer PIN, Ortsprofil und QR',site:'DIGIYLYFE-Website',siteNote:'Vision, Angebote und lokale Präsenz',hub:'DIGIY HUB',hubNote:'Zurück zum zentralen Bahnhof'},
    it:{eyebrow:'PORTE EXPLORE · SENEGAL · EUROPA · MONDO',title:'Scegliere direttamente la mia porta',text:'Scoprire, proporre un luogo, aprire lo spazio professionale o tornare alla casa DIGIY.',registration:'Proporre il mio luogo',registrationNote:'Iscrizione, formula CODE 8 e attivazione',discoveries:'Vedi le scoperte',discoveriesNote:'Luoghi, uscite ed esperienze locali',pro:'Spazio professionale',proNote:'PIN sicuro, scheda luogo e QR',site:'Sito DIGIYLYFE',siteNote:'Visione, offerte e presenza locale',hub:'HUB DIGIY',hubNote:'Torna alla stazione centrale'},
    nl:{eyebrow:'EXPLORE-POORTEN · SENEGAL · EUROPA · WERELD',title:'Kies rechtstreeks mijn toegang',text:'Ontdekken, een plek voorstellen, de professionele ruimte openen of terugkeren naar het DIGIY-huis.',registration:'Mijn plek voorstellen',registrationNote:'Inschrijving, CODE 8-formule en activering',discoveries:'Bekijk ontdekkingen',discoveriesNote:'Plekken, uitstappen en lokale ervaringen',pro:'Professionele ruimte',proNote:'Beveiligde PIN, plekprofiel en QR',site:'DIGIYLYFE-website',siteNote:'Visie, aanbiedingen en lokale aanwezigheid',hub:'DIGIY HUB',hubNote:'Terug naar het centrale station'},
    ar:{eyebrow:'بوابات EXPLORE · السنغال · أوروبا · العالم',title:'اختر بوابتي مباشرة',text:'اكتشف أو اقترح مكانًا أو افتح المساحة المهنية أو عد إلى بيت DIGIY.',registration:'اقتراح مكاني',registrationNote:'التسجيل وخطة CODE 8 والتفعيل',discoveries:'عرض الاكتشافات',discoveriesNote:'أماكن ونزهات وتجارب محلية',pro:'المساحة المهنية',proNote:'رمز PIN آمن وملف المكان وQR',site:'موقع DIGIYLYFE',siteNote:'الرؤية والعروض والحضور الميداني',hub:'HUB DIGIY',hubNote:'العودة إلى المحطة المركزية'}
  };

  function language(){
    var value='';
    try{value=localStorage.getItem(STORE)||'';}catch(e){}
    value=(value||document.documentElement.lang||'fr').slice(0,2).toLowerCase();
    return SUPPORTED.indexOf(value)>=0?value:'fr';
  }

  function withLang(path,lang){
    try{
      var url=new URL(path,location.href);
      url.searchParams.set('lang',lang);
      return url.href;
    }catch(e){return path;}
  }

  function addStyles(doc){
    if(doc.getElementById('digiyExploreDoorsStyle')) return;
    var style=doc.createElement('style');
    style.id='digiyExploreDoorsStyle';
    style.textContent=''+
      '.explore-doors{width:min(1180px,calc(100% - 28px));margin:4px auto 18px;padding:18px;border:1px solid rgba(220,180,90,.34);border-radius:24px;background:radial-gradient(circle at top right,rgba(220,180,90,.16),transparent 38%),linear-gradient(145deg,rgba(16,38,30,.98),rgba(7,29,22,.98));box-shadow:0 18px 48px rgba(0,0,0,.28)}'+
      '.explore-doors__eyebrow{display:inline-flex;padding:7px 11px;border-radius:999px;border:1px solid rgba(220,180,90,.40);background:rgba(220,180,90,.10);color:#f5db9a;font-size:11px;font-weight:1000;letter-spacing:.07em}'+
      '.explore-doors h2{margin:10px 0 7px;font-size:clamp(24px,5vw,34px);line-height:1.08}'+
      '.explore-doors__text{margin:0;color:rgba(247,251,248,.76);font-size:14px;line-height:1.5;font-weight:800}'+
      '.explore-doors__grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:15px}'+
      '.explore-door{min-height:116px;padding:14px;border-radius:18px;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.055);color:#fff;text-decoration:none;display:flex;flex-direction:column;justify-content:space-between;gap:10px;transition:transform .16s ease,border-color .16s ease,background .16s ease}'+
      '.explore-door:hover,.explore-door:focus-visible{transform:translateY(-2px);border-color:rgba(220,180,90,.62);background:rgba(220,180,90,.10);outline:none}'+
      '.explore-door--primary{background:linear-gradient(135deg,#dcb45a,#f2cc78);color:#062414;border:0}'+
      '.explore-door__top{display:flex;align-items:center;gap:9px;font-size:15px;font-weight:1000}'+
      '.explore-door__icon{font-size:23px;line-height:1}'+
      '.explore-door__note{font-size:12px;line-height:1.38;font-weight:800;opacity:.78}'+
      'html[dir="rtl"] .explore-door__top{flex-direction:row-reverse;justify-content:flex-end}'+
      '@media(max-width:980px){.explore-doors__grid{grid-template-columns:repeat(2,minmax(0,1fr))}}'+
      '@media(max-width:520px){.explore-doors{width:calc(100% - 18px);padding:15px}.explore-doors__grid{grid-template-columns:1fr}.explore-door{min-height:88px}}';
    doc.head.appendChild(style);
  }

  function door(doc,options){
    var link=doc.createElement('a');
    link.className='explore-door'+(options.primary?' explore-door--primary':'');
    link.href=options.href;
    link.innerHTML='<span class="explore-door__top"><span class="explore-door__icon">'+options.icon+'</span><span>'+options.title+'</span></span><span class="explore-door__note">'+options.note+'</span>';
    return link;
  }

  function mount(){
    try{
      var doc=frame.contentDocument;
      if(!doc||!doc.body) return;
      var lang=language();
      var t=COPY[lang]||COPY.fr;
      var existing=doc.getElementById('exploreDoors');
      if(existing) existing.remove();
      addStyles(doc);

      var block=doc.createElement('section');
      block.id='exploreDoors';
      block.className='explore-doors';
      block.setAttribute('aria-label',t.title);
      block.innerHTML='<span class="explore-doors__eyebrow">'+t.eyebrow+'</span><h2>'+t.title+'</h2><p class="explore-doors__text">'+t.text+'</p><div class="explore-doors__grid"></div>';
      var grid=block.querySelector('.explore-doors__grid');
      grid.append(
        door(doc,{href:withLang('./inscription-explore.html',lang),icon:'🧾',title:t.registration,note:t.registrationNote,primary:true}),
        door(doc,{href:withLang('./index.html#spots',lang),icon:'🌍',title:t.discoveries,note:t.discoveriesNote}),
        door(doc,{href:'https://pro-explore.digiylyfe.com/pin.html',icon:'🔐',title:t.pro,note:t.proNote}),
        door(doc,{href:'https://digiylyfe.com/',icon:'🏠',title:t.site,note:t.siteNote}),
        door(doc,{href:'https://digiy-hub.digiylyfe.com/',icon:'🧭',title:t.hub,note:t.hubNote})
      );

      var spots=doc.getElementById('spots');
      if(spots&&spots.parentNode) spots.parentNode.insertBefore(block,spots);
      else{
        var main=doc.querySelector('main');
        if(main) main.prepend(block);
        else doc.body.prepend(block);
      }
      mountedDoc=doc;
    }catch(e){}
  }

  frame.addEventListener('load',function(){setTimeout(mount,120);});
  document.addEventListener('click',function(event){
    if(event.target&&event.target.closest&&event.target.closest('[data-shell-lang]')) setTimeout(mount,160);
  });
  setInterval(function(){
    try{if(frame.contentDocument&&frame.contentDocument.body&&mountedDoc!==frame.contentDocument)mount();}catch(e){}
  },1200);
  setTimeout(mount,220);
})();
