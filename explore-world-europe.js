/* DIGIY EXPLORE — ouverture Europe et monde, sans changer la logique EUR */
(function(){
  'use strict';
  if(window.__DIGIY_EXPLORE_WORLD_EUROPE__) return;
  window.__DIGIY_EXPLORE_WORLD_EUROPE__=true;

  var frame=document.getElementById('exploreFrame');
  if(!frame) return;

  var observedDoc=null;
  var observer=null;
  var applying=false;

  var replacements=[
    ['🇫🇷 France','🇪🇺 Europe'],
    ['🇫🇷 Francia','🇪🇺 Europa'],
    ['🇫🇷 Frankreich','🇪🇺 Europa'],
    ['🇫🇷 Frankrijk','🇪🇺 Europa'],
    ['🇫🇷 فرنسا','🇪🇺 أوروبا'],
    ['Sendwave France','Sendwave Europe'],
    ['Sendwave Francia','Sendwave Europa'],
    ['Sendwave Frankreich','Sendwave Europa'],
    ['Sendwave Frankrijk','Sendwave Europa'],
    ['Sendwave فرنسا','Sendwave أوروبا'],
    ['France → Wave Sénégal','Europe → Wave Sénégal'],
    ['Francia → Wave Sénégal','Europa → Wave Sénégal'],
    ['Frankreich → Wave Sénégal','Europa → Wave Sénégal'],
    ['Frankrijk → Wave Sénégal','Europa → Wave Sénégal'],
    ['فرنسا → Wave Sénégal','أوروبا → Wave Sénégal'],
    ['France :','Europe :'],
    ['France :','Europe :'],
    ['Francia:','Europa:'],
    ['Francia :','Europa :'],
    ['Frankreich:','Europa:'],
    ['Frankreich :','Europa :'],
    ['Frankrijk:','Europa:'],
    ['Frankrijk :','Europa :'],
    ['فرنسا:','أوروبا:'],
    ['فرنسا :','أوروبا :'],
    ['France','Europe'],
    ['Francia','Europa'],
    ['Frankreich','Europa'],
    ['Frankrijk','Europa'],
    ['فرنسا','أوروبا'],
    ['🇫🇷','🇪🇺']
  ];

  function replaceText(value){
    var result=String(value==null?'':value);
    replacements.forEach(function(pair){
      if(result.indexOf(pair[0])>=0) result=result.split(pair[0]).join(pair[1]);
    });
    return result;
  }

  function patchUrl(value,doc){
    var original=String(value||'');
    if(!original||original.charAt(0)==='#'||/^javascript:/i.test(original)) return original;
    try{
      var url=new URL(original,doc.baseURI||location.href);
      var changed=false;
      ['text','body','subject'].forEach(function(key){
        if(!url.searchParams.has(key)) return;
        var current=url.searchParams.get(key);
        var next=replaceText(current);
        if(next!==current){url.searchParams.set(key,next);changed=true;}
      });
      return changed?url.href:original;
    }catch(e){
      var direct=replaceText(original);
      return direct!==original?direct:original;
    }
  }

  function patchNode(root,doc){
    if(!root) return;
    var walker=doc.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
      var parent=node.parentElement;
      if(!parent||parent.closest('script,style,textarea')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    var nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(node){
      var next=replaceText(node.nodeValue);
      if(next!==node.nodeValue) node.nodeValue=next;
    });

    if(root.querySelectorAll){
      root.querySelectorAll('[aria-label],[title],[placeholder],a[href]').forEach(function(el){
        ['aria-label','title','placeholder'].forEach(function(attr){
          var value=el.getAttribute(attr);
          if(value!=null){var next=replaceText(value);if(next!==value)el.setAttribute(attr,next);}
        });
        if(el.hasAttribute('href')){
          var href=el.getAttribute('href')||'';
          var nextHref=patchUrl(href,doc);
          if(nextHref!==href) el.setAttribute('href',nextHref);
        }
      });
    }

    var europeButton=doc.querySelector('[data-country="france"]');
    if(europeButton){
      europeButton.setAttribute('data-digiy-market','europe');
      var strong=europeButton.querySelector('strong');
      if(strong) strong.textContent='🇪🇺 '+replaceText(strong.textContent).replace(/^🇪🇺\s*/,'');
    }
  }

  function apply(){
    if(applying) return;
    try{
      var doc=frame.contentDocument;
      if(!doc||!doc.body) return;
      applying=true;
      patchNode(doc.body,doc);
      if(observedDoc!==doc){
        observedDoc=doc;
        if(observer) observer.disconnect();
        observer=new MutationObserver(function(mutations){
          if(applying) return;
          setTimeout(function(){
            try{
              applying=true;
              mutations.forEach(function(m){
                if(m.type==='characterData') patchNode(m.target.parentNode||doc.body,doc);
                Array.prototype.forEach.call(m.addedNodes||[],function(node){patchNode(node,doc);});
              });
              patchNode(doc.body,doc);
            }finally{applying=false;}
          },35);
        });
        observer.observe(doc.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['href','title','aria-label','placeholder']});
      }
    }catch(e){}
    finally{applying=false;}
  }

  frame.addEventListener('load',function(){setTimeout(apply,120);});
  document.addEventListener('click',function(event){
    if(event.target&&event.target.closest&&event.target.closest('[data-shell-lang]')) setTimeout(apply,160);
  });
  setInterval(apply,1300);
  setTimeout(apply,220);
})();
