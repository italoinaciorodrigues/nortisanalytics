// Nortis Analytics: main script
(function(){
  'use strict';

  // Header scroll state
  var header = document.getElementById('header');
  function onScroll(){
    if (window.scrollY > 20) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  if (header){
    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
  }

  // Mobile menu
  var toggle = document.getElementById('menuToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav){
    toggle.addEventListener('click', function(){
      toggle.classList.toggle('open');
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        toggle.classList.remove('open');
        nav.classList.remove('open');
      });
    });
  }

  // Theme toggle (o tema inicial é aplicado pelo script no <head>)
  var root = document.documentElement;
  var themeToggle = document.getElementById('themeToggle');
  var themeColor = document.getElementById('metaThemeColor');
  function syncThemeUI(theme){
    var dark = theme === 'dark';
    themeToggle.setAttribute('aria-label', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
    themeToggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
    if (themeColor) themeColor.setAttribute('content', dark ? '#0B1E36' : '#FFFFFF');
  }
  if (themeToggle){
    syncThemeUI(root.getAttribute('data-theme'));
    themeToggle.addEventListener('click', function(){
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('nortis-theme', next); } catch (e) {}
      syncThemeUI(next);
    });
  }

  // FAQ single-open behavior
  var faqItems = document.querySelectorAll('.faq details');
  faqItems.forEach(function(item){
    item.addEventListener('toggle', function(){
      if (item.open){
        faqItems.forEach(function(other){
          if (other !== item) other.open = false;
        });
      }
    });
  });
})();
