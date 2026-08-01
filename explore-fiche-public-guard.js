/* DIGIY EXPLORE — garde légère de la fiche publique */
(function(){
  'use strict';
  if(window.__DIGIY_EXPLORE_FICHE_PUBLIC_GUARD__) return;
  window.__DIGIY_EXPLORE_FICHE_PUBLIC_GUARD__=true;

  var frame=document.getElementById('exploreFrame');
  if(!frame || !document.body || document.body.getAttribute('data-page')!=='fiche') return;

  function cleanSlug(value){
    return String(value||'')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9-]+/g,'-')
      .replace(/-+/g,'-')
      .replace(/^-|-$/g,'');
  }

  function fixCanonical(){
    try{
      var pageUrl=new URL(location.href);
      var slug=cleanSlug(pageUrl.searchParams.get('slug'));
      var canonical=document.querySelector('link[rel="canonical"]');
      var robots=document.querySelector('meta[name="robots"]');
      var target=new URL(location.pathname,location.origin);

      if(slug){
        target.searchParams.set('slug',slug);
        if(robots) robots.content='index,follow';
      }else if(robots){
        robots.content='noindex,follow';
      }

      if(canonical) canonical.href=target.toString();
    }catch(e){}
  }

  function protectPublicFrame(){
    try{
      var doc=frame.contentDocument;
      if(!doc || !doc.body) return;
      var links=doc.querySelectorAll(
        'a[href*="pro-explore.digiylyfe.com/cockpit"],'+
        'a[href*="pro-explore.digiylyfe.com/pin"]'
      );

      links.forEach(function(link){
        link.setAttribute('href','./inscription-explore.html');
        link.textContent='Demande EXPLORE';
        link.setAttribute('aria-label','Demande EXPLORE');
        link.removeAttribute('target');
        link.removeAttribute('rel');
      });
    }catch(e){}
  }

  fixCanonical();
  frame.addEventListener('load',function(){setTimeout(protectPublicFrame,80);});
  document.addEventListener('click',function(event){
    if(event.target&&event.target.closest&&event.target.closest('[data-shell-lang]')){
      setTimeout(protectPublicFrame,120);
    }
  });
  setInterval(protectPublicFrame,1500);
  setTimeout(protectPublicFrame,180);
})();
