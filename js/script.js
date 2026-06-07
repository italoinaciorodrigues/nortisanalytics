// Nortis Analytics — main script
(function(){
  'use strict';

  // Header scroll state
  var header = document.getElementById('header');
  function onScroll(){
    if (window.scrollY > 20) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  // Mobile menu
  var toggle = document.getElementById('menuToggle');
  var nav = document.getElementById('nav');
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

  // Reveal-on-scroll
  var targets = document.querySelectorAll('.section, .hero-content, .central-message .container, .cta-final .container');
  targets.forEach(function(el){ el.classList.add('reveal'); });
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold:0.12 });
    targets.forEach(function(el){ io.observe(el); });
  } else {
    targets.forEach(function(el){ el.classList.add('visible'); });
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

  // Current year (if needed later)
})();
