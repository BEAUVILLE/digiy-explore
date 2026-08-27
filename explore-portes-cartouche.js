/* DIGIY EXPLORE — cartouche des portes publiques et adhésion actuelle */
(function(){
  'use strict';
  if(window.__DIGIY_EXPLORE_PORTES_CARTOUCHE__) return;
  window.__DIGIY_EXPLORE_PORTES_CARTOUCHE__=true;

  var frame=document.getElementById('exploreFrame');
  if(!frame || !document.body || document.body.getAttribute('data-page')!=='index') return;

  var STORE='digiy_explore_lang_7';
  var SUPPORTED=['fr','en','es','pt','de','it','nl','ar'];
  var mountedDoc=null;

  var COPY={
    fr:{eyebrow:'PORTES EXPLORE · SÉNÉGAL · EUROPE · MONDE',title:'Choisir directement ma porte',text:'Découvrir ou donner à mon lieu, mon activité ou mon expérience une place visible dans EXPLORE. Le contact reste direct.',join:'PRENDRE MA PLACE',joinNote:'Adhésion 19 900 FCFA / 45 € · QR personnel partageable · contact direct · 0 % commission',discoveries:'Voir les découvertes',discoveriesNote:'Lieux, sorties et expériences du terrain',site:'Site DIGIYLYFE',siteNote:'Votre identité, vos données, votre relation directe',hub:'HUB DIGIY',hubNote:'Revenir à la gare centrale'},
    en:{eyebrow:'EXPLORE DOORS · SENEGAL · EUROPE · WORLD',title:'Choose my door directly',text:'Discover or give my place, activity or experience a visible place in EXPLORE. Contact stays direct.',join:'CLAIM MY PLACE',joinNote:'Membership 19,900 FCFA / €45 · personal shareable QR · direct contact · 0% commission',discoveries:'View discoveries',discoveriesNote:'Local places, outings and experiences',site:'DIGIYLYFE website',siteNote:'Your identity, your data, your direct relationship',hub:'DIGIY HUB',hubNote:'Return to the central hub'},
    es:{eyebrow:'PUERTAS EXPLORE · SENEGAL · EUROPA · MUNDO',title:'Elegir directamente mi puerta',text:'Descubrir o dar a mi lugar, actividad o experiencia un espacio visible en EXPLORE. El contacto sigue siendo directo.',join:'OCUPAR MI LUGAR',joinNote:'Adhesión 19 900 FCFA / 45 € · QR personal compartible · contacto directo · 0 % comisión',discoveries:'Ver los descubrimientos',discoveriesNote:'Lugares, salidas y experiencias locales',site:'Sitio DIGIYLYFE',siteNote:'Su identidad, sus datos, su relación directa',hub:'HUB DIGIY',hubNote:'Volver al hub central'},
    pt:{eyebrow:'PORTAS EXPLORE · SENEGAL · EUROPA · MUNDO',title:'Escolher diretamente a minha porta',text:'Descobrir ou dar ao meu lugar, atividade ou experiência um espaço visível no EXPLORE. O contacto continua direto.',join:'OCUPAR O MEU LUGAR',joinNote:'Adesão 19 900 FCFA / 45 € · QR pessoal partilhável · contacto direto · 0% comissão',discoveries:'Ver descobertas',discoveriesNote:'Lugares, passeios e experiências locais',site:'Site DIGIYLYFE',siteNote:'A sua identidade, os seus dados, a sua relação direta',hub:'HUB DIGIY',hubNote:'Voltar ao hub central'},
    de:{eyebrow:'EXPLORE-ZUGÄNGE · SENEGAL · EUROPA · WELT',title:'Direkt den passenden Zugang wählen',text:'Entdecken oder meinem Ort, meiner Aktivität oder meinem Erlebnis einen sichtbaren Platz in EXPLORE geben. Der Kontakt bleibt direkt.',join:'MEINEN PLATZ EINNEHMEN',joinNote:'Mitgliedschaft 19.900 FCFA / 45 € · persönlicher teilbarer QR · Direktkontakt · 0 % Provision',discoveries:'Entdeckungen ansehen',discoveriesNote:'Orte, Ausflüge und lokale Erlebnisse',site:'DIGIYLYFE-Website',siteNote:'Ihre Identität, Ihre Daten, Ihre direkte Beziehung',hub:'DIGIY HUB',hubNote:'Zurück zum zentralen Hub'},
    it:{eyebrow:'PORTE EXPLORE · SENEGAL · EUROPA · MONDO',title:'Scegliere direttamente la mia porta',text:'Scoprire o dare al mio luogo, attività o esperienza uno spazio visibile in EXPLORE. Il contatto resta diretto.',join:'PRENDERE IL MIO POSTO',joinNote:'Adesione 19.900 FCFA / 45 € · QR personale condivisibile · contatto diretto · 0% commissioni',discoveries:'Vedi le scoperte',discoveriesNote:'Luoghi, uscite ed esperienze locali',site:'Sito DIGIYLYFE',siteNote:'La vostra identità, i vostri dati, la relazione diretta',hub:'HUB DIGIY',hubNote:'Torna all’hub centrale'},
    nl:{eyebrow:'EXPLORE-POORTEN · SENEGAL · EUROPA · WERELD',title:'Kies rechtstreeks mijn toegang',text:'Ontdek of geef mijn plek, activiteit of ervaring een zichtbare plaats in EXPLORE. Het contact blijft direct.',join:'MIJN PLEK INNEMEN',joinNote:'Lidmaatschap 19.900 FCFA / €45 · persoonlijke deelbare QR · direct contact · 0% commissie',discoveries:'Bekijk ontdekkingen',discoveriesNote:'Plekken, uitstappen en lokale ervaringen',site:'DIGIYLYFE-website',siteNote:'Uw identiteit, uw gegevens, uw directe relatie',hub:'DIGIY HUB',hubNote:'Terug naar de centrale hub'},
    ar:{eyebrow:'بوابات EXPLORE · السنغال · أوروبا · العالم',title:'اختر بوابتي مباشرة',text:'اكتشف أو امنح مكاني أو نشاطي أو تجربتي حضورًا واضحًا في EXPLORE. يبقى التواصل مباشرًا.',join:'آخذ مكاني',joinNote:'عضوية 19 900 FCFA / 45 € · QR شخصي قابل للمشاركة · تواصل مباشر · عمولة 0٪',discoveries:'عرض الاكتشافات',discoveriesNote:'أماكن ونزهات وتجارب محلية',site:'موقع DIGIYLYFE',siteNote:'هويتك وبياناتك وعلاقتك المباشرة',hub:'HUB DIGIY',hubNote:'العودة إلى المحور المركزي'}
  };

  function language(){
    var value='';
    try{
      value=(new URLSearchParams(location.search).get('lang')||'').slice(0,2).toLowerCase();
      if(SUPPORTED.indexOf(value)>=0) return value;
      value=(localStorage.getItem(STORE)||'').slice(0,2).toLowerCase();
      if(SUPPORTED.indexOf(value)>=0) return value;
      value=(localStorage.getItem('digiy-lang')||'').slice(0,2).toLowerCase();
    }catch(e){}
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
      '.explore-doors__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:15px}'+
      '.explore-door{min-height:116px;padding:14px;border-radius:18px;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.055);color:#fff;text-decoration:none;display:flex;flex-direction:column;justify-content:space-between;gap:10px;transition:transform .16s ease,border-color .16s ease,background .16s ease}'+
      '.explore-door:hover,.explore-door:focus-visible{transform:translateY(-2px);border-color:rgba(220,180,90,.62);background:rgba(220,180,90,.10);outline:none}'+
      '.explore-door--primary{background:linear-gradient(135deg,#dcb45a,#f2cc78);color:#062414;border:0}'+
      '.explore-door__top{display:flex;align-items:center;gap:9px;font-size:15px;font-weight:1000}'+
      '.explore-door__icon{font-size:23px;line-height:1}'+
      '.explore-door__note{font-size:12px;line-height:1.38;font-weight:800;opacity:.82}'+
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
        door(doc,{href:withLang('https://digiylyfe.com/tarifs-adherents-1.html',lang),icon:'🔳',title:t.join,note:t.joinNote,primary:true}),
        door(doc,{href:withLang('./index.html#spots',lang),icon:'🌍',title:t.discoveries,note:t.discoveriesNote}),
        door(doc,{href:withLang('https://digiylyfe.com/',lang),icon:'🏠',title:t.site,note:t.siteNote}),
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
