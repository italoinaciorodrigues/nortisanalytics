// Nortis Analytics: main script
// JavaScript puro, sem bibliotecas. Cada bloco testa se os elementos existem,
// porque o mesmo arquivo é usado na página inicial, na 404, na política e nos termos.
(function(){
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  function onFrame(fn){
    var queued = false;
    return function(){
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function(){ queued = false; fn(); });
    };
  }

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

  // Theme toggle (o tema inicial é aplicado pelo script no <head>)
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

  // FAQ: uma pergunta aberta por vez
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

  // Topo: carrossel de demonstrações sincronizado com o título
  var carousel = document.getElementById('demoCarousel');
  if (carousel){
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.demo-slide'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('.demo-dot'));
    var caption = document.getElementById('demoCaption');
    var prevBtn = document.getElementById('demoPrev');
    var nextBtn = document.getElementById('demoNext');
    var titleItems = Array.prototype.slice.call(document.querySelectorAll('#heroRotator .rotator-item'));
    var demoIndex = 0;
    var demoRun = 0;
    var demoTimers = [];
    var waitingAdvance = false;
    var hoverPause = false;
    var focusPause = false;
    var clickPauseUntil = 0;
    var carouselVisible = !hasIO;

    function clearDemoTimers(){
      demoTimers.forEach(function(t){ clearTimeout(t); clearInterval(t); });
      demoTimers = [];
    }
    function later(fn, ms){ demoTimers.push(setTimeout(fn, ms)); }

    // Mostra cada elemento conforme a etapa (final = estado completo)
    function renderStage(slide, stage, final){
      slide.querySelectorAll('[data-from]').forEach(function(el){
        var from = +el.getAttribute('data-from');
        var until = el.hasAttribute('data-until') ? +el.getAttribute('data-until') : null;
        var on = final ? until === null : (stage >= from && (until === null || stage <= until));
        el.classList.toggle('is-on', on);
      });
      slide.querySelectorAll('[data-mark]').forEach(function(el){
        var mark = +el.getAttribute('data-mark');
        el.classList.toggle('is-marked', final || stage >= mark);
      });
      slide.querySelectorAll('[data-type]').forEach(function(el){
        var at = +el.getAttribute('data-type');
        var full = el.getAttribute('data-full') || el.textContent;
        el.setAttribute('data-full', full);
        if (final || stage > at){
          el.textContent = full;
        } else if (stage < at){
          el.textContent = '';
        } else {
          // Digita letra por letra durante a etapa
          var times = slide.getAttribute('data-times').split(',');
          var step = Math.max(40, Math.floor((+times[at] - 300) / full.length));
          var n = 0;
          el.textContent = '';
          var typer = setInterval(function(){
            n++;
            el.textContent = full.slice(0, n);
            if (n >= full.length) clearInterval(typer);
          }, step);
          demoTimers.push(typer);
        }
      });
    }

    function canAdvance(){
      return !reduceMotion && !hoverPause && !focusPause && Date.now() >= clickPauseUntil && carouselVisible && !document.hidden;
    }
    function tryAdvance(){
      if (waitingAdvance && canAdvance()){
        waitingAdvance = false;
        later(function(){
          if (canAdvance()) show((demoIndex + 1) % slides.length, false);
          else waitingAdvance = true;
        }, 2000);
      }
    }

    function setTitle(i){
      titleItems.forEach(function(item, k){
        var wasActive = item.classList.contains('is-active');
        item.classList.remove('is-leaving');
        if (k === i){
          item.classList.add('is-active');
        } else if (wasActive){
          item.classList.remove('is-active');
          if (!reduceMotion){
            item.classList.add('is-leaving');
            setTimeout(function(){ item.classList.remove('is-leaving'); }, 320);
          }
        }
      });
    }

    function show(i, restartOnly){
      demoRun++;
      clearDemoTimers();
      waitingAdvance = false;
      var run = demoRun;
      demoIndex = i;
      slides.forEach(function(slide, k){
        var current = k === i;
        slide.classList.toggle('is-current', current);
        slide.setAttribute('aria-hidden', current ? 'false' : 'true');
        // Slides fora da tela ficam no estado final: o painel mantém a altura do maior
        if (!current) renderStage(slide, 0, true);
      });
      dots.forEach(function(dot, k){
        if (k === i) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      if (caption) caption.textContent = slides[i].getAttribute('data-caption');
      if (!restartOnly) setTitle(i);

      var slide = slides[i];
      if (reduceMotion || !carouselVisible || document.hidden){
        renderStage(slide, 0, true);
        return;
      }
      var times = slide.getAttribute('data-times').split(',').map(Number);
      var stage = 0;
      function step(){
        if (run !== demoRun) return;
        renderStage(slide, stage, false);
        if (stage >= times.length){
          // Demonstração terminou: espera e passa para a próxima, se nada estiver pausando
          waitingAdvance = true;
          tryAdvance();
          return;
        }
        later(function(){ stage++; step(); }, times[stage]);
      }
      step();
    }

    function goTo(i){
      clickPauseUntil = Date.now() + 15000;
      show((i + slides.length) % slides.length, false);
      setTimeout(tryAdvance, 15050);
    }

    carousel.classList.add('is-enhanced');
    prevBtn.addEventListener('click', function(){ goTo(demoIndex - 1); });
    nextBtn.addEventListener('click', function(){ goTo(demoIndex + 1); });
    dots.forEach(function(dot, k){ dot.addEventListener('click', function(){ goTo(k); }); });

    carousel.addEventListener('mouseenter', function(){ hoverPause = true; });
    carousel.addEventListener('mouseleave', function(){ hoverPause = false; tryAdvance(); });
    carousel.addEventListener('focusin', function(){ focusPause = true; });
    carousel.addEventListener('focusout', function(e){
      if (!carousel.contains(e.relatedTarget)){ focusPause = false; tryAdvance(); }
    });

    // Só anima com o painel visível e a aba aberta; ao voltar, a demonstração recomeça
    document.addEventListener('visibilitychange', function(){
      if (!document.hidden && carouselVisible) show(demoIndex, true);
    });
    if (hasIO){
      new IntersectionObserver(function(entries){
        var was = carouselVisible;
        carouselVisible = entries[0].isIntersecting;
        if (carouselVisible && !was) show(demoIndex, true);
        if (!carouselVisible){ demoRun++; clearDemoTimers(); }
      }, { threshold:0.3 }).observe(carousel);
    }
    show(0, true);
  }

  // Barra de seções: destaque automático da seção na tela
  var sectionNav = document.getElementById('sectionNav');
  if (sectionNav){
    var track = document.getElementById('sectionNavTrack');
    var indicator = sectionNav.querySelector('.section-nav-indicator');
    var navLinks = sectionNav.querySelectorAll('a[data-nav]');
    var activeGroup = null;

    function placeIndicator(link){
      if (!link){
        indicator.classList.remove('is-visible');
        return;
      }
      indicator.style.width = link.offsetWidth + 'px';
      indicator.style.transform = 'translateX(' + link.offsetLeft + 'px)';
      indicator.classList.add('is-visible');
      if (track.scrollWidth > track.clientWidth){
        var left = link.offsetLeft - (track.clientWidth - link.offsetWidth) / 2;
        track.scrollTo({ left:left, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }
    function setActive(group){
      if (group === activeGroup) return;
      activeGroup = group;
      var activeLink = null;
      navLinks.forEach(function(link){
        if (group && link.getAttribute('data-nav') === group){
          link.setAttribute('aria-current', 'true');
          activeLink = link;
        } else {
          link.removeAttribute('aria-current');
        }
      });
      placeIndicator(activeLink);
    }

    if (hasIO){
      // Faixa estreita perto do meio da tela: a seção que passa por ela fica ativa
      var navObserver = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting) setActive(entry.target.getAttribute('data-nav-group') || '');
        });
      }, { rootMargin:'-40% 0px -55% 0px' });
      document.querySelectorAll('.hero, [data-nav-group]').forEach(function(el){
        navObserver.observe(el);
      });
    }
    window.addEventListener('resize', onFrame(function(){
      var link = sectionNav.querySelector('a[aria-current="true"]');
      if (link) placeIndicator(link);
    }));
  }

  // Dor: linha que se desenha conforme a rolagem
  var painPath = document.getElementById('painPath');
  if (painPath){
    var svg = painPath.querySelector('.pain-line');
    var trackPath = svg.querySelector('.pain-line-track');
    var fillPath = svg.querySelector('.pain-line-fill');
    var painItems = painPath.querySelectorAll('.pain-item');
    var painEnd = painPath.querySelector('.pain-end');
    var points = [];
    var total = 0;

    function buildPath(){
      var base = painPath.getBoundingClientRect();
      var mobile = window.matchMedia('(max-width: 720px)').matches;
      points = [];
      painItems.forEach(function(item){
        var r = item.querySelector('.icon-box').getBoundingClientRect();
        points.push({ x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 });
      });
      var endRect = painEnd.getBoundingClientRect();
      points.push({
        x: mobile ? points[0].x : endRect.left - base.left + endRect.width / 2,
        y: endRect.top - base.top
      });

      // Caminho com ângulos retos: desce, atravessa e desce de novo
      var d = 'M' + points[0].x + ' ' + points[0].y;
      total = 0;
      points[0].len = 0;
      for (var i = 1; i < points.length; i++){
        var p = points[i - 1], q = points[i];
        var midY = (p.y + q.y) / 2;
        d += ' V' + midY + ' H' + q.x + ' V' + q.y;
        total += Math.abs(q.y - p.y) + Math.abs(q.x - p.x);
        q.len = total;
      }
      svg.setAttribute('width', painPath.offsetWidth);
      svg.setAttribute('height', painPath.offsetHeight);
      trackPath.setAttribute('d', d);
      fillPath.setAttribute('d', d);
      fillPath.style.strokeDasharray = total;
      updatePath();
    }

    function updatePath(){
      var drawn;
      if (reduceMotion){
        drawn = total;
      } else {
        var base = painPath.getBoundingClientRect();
        var scanY = window.innerHeight * 0.65 - base.top;
        drawn = 0;
        if (scanY >= points[points.length - 1].y){
          drawn = total;
        } else {
          for (var i = 1; i < points.length; i++){
            var p = points[i - 1], q = points[i];
            if (scanY < q.y){
              if (scanY > p.y) drawn = p.len + (scanY - p.y) / (q.y - p.y) * (q.len - p.len);
              else drawn = p.len;
              break;
            }
          }
        }
      }
      fillPath.style.strokeDashoffset = total - drawn;
      painItems.forEach(function(item, i){
        item.classList.toggle('is-active', drawn >= points[i].len && drawn > 0 || reduceMotion);
      });
    }

    var scheduleUpdate = onFrame(updatePath);
    var scheduleBuild = onFrame(buildPath);
    buildPath();
    window.addEventListener('resize', scheduleBuild);
    window.addEventListener('load', scheduleBuild);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleBuild);
    if (!reduceMotion){
      if (hasIO){
        var painVisible = false;
        new IntersectionObserver(function(entries){
          painVisible = entries[0].isIntersecting;
          if (painVisible) scheduleUpdate();
        }, { rootMargin:'200px 0px' }).observe(painPath);
        window.addEventListener('scroll', function(){ if (painVisible) scheduleUpdate(); }, { passive:true });
      } else {
        window.addEventListener('scroll', scheduleUpdate, { passive:true });
      }
    }
  }

  // Serviços: seletor em abas (role="tablist")
  var services = document.getElementById('services');
  if (services){
    var tabs = Array.prototype.slice.call(services.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function(tab){ return document.getElementById(tab.getAttribute('aria-controls')); });
    var currentTab = 0;
    var swapTimer = null;

    services.classList.add('is-enhanced');
    panels.forEach(function(panel, i){ panel.hidden = i !== currentTab; });

    function finishSwap(from, to){
      panels[from].classList.remove('is-leaving');
      panels[from].hidden = true;
      panels[to].hidden = false;
      panels[to].classList.remove('is-entering');
      if (!reduceMotion){
        void panels[to].offsetWidth;
        panels[to].classList.add('is-entering');
      }
    }
    function selectTab(index, focus){
      if (index === currentTab){
        if (focus) tabs[index].focus();
        return;
      }
      var from = currentTab;
      currentTab = index;
      // Posição do indicador deslizante da barra de abas no celular
      services.style.setProperty('--tab-i', index);
      tabs.forEach(function(tab, i){
        var selected = i === index;
        tab.setAttribute('aria-selected', selected ? 'true' : 'false');
        tab.tabIndex = selected ? 0 : -1;
      });
      if (focus) tabs[index].focus();

      clearTimeout(swapTimer);
      panels.forEach(function(panel, i){
        panel.classList.remove('is-leaving', 'is-entering');
        if (i !== from) panel.hidden = true;
      });
      if (reduceMotion){
        finishSwap(from, index);
      } else {
        panels[from].classList.add('is-leaving');
        swapTimer = setTimeout(function(){ finishSwap(from, index); }, 120);
      }
    }
    tabs.forEach(function(tab, i){
      tab.addEventListener('click', function(){ selectTab(i, false); });
      tab.addEventListener('keydown', function(e){
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        if (next !== null){
          e.preventDefault();
          selectTab(next, true);
        }
      });
    });

    // Arrastar o painel para o lado troca de serviço (só gesto horizontal claro;
    // os ouvintes são passivos, então a rolagem vertical da página não é afetada)
    var panelsBox = services.querySelector('.service-panels');
    var touchX = null, touchY = null;
    panelsBox.addEventListener('touchstart', function(e){
      if (e.touches.length !== 1){ touchX = null; return; }
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
    }, { passive:true });
    panelsBox.addEventListener('touchend', function(e){
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      var dy = e.changedTouches[0].clientY - touchY;
      touchX = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5){
        if (dx < 0) selectTab((currentTab + 1) % tabs.length, false);
        else selectTab((currentTab - 1 + tabs.length) % tabs.length, false);
      }
    }, { passive:true });
  }

  // Como funciona: a linha se preenche da etapa 1 até a 5, uma vez só
  var process = document.getElementById('process');
  if (process){
    var stepsLi = process.querySelectorAll('li');
    var fillProcess = function(){
      stepsLi.forEach(function(li, i){
        if (reduceMotion){
          li.classList.add('is-active', 'is-linked');
          return;
        }
        setTimeout(function(){
          li.classList.add('is-active');
          li.classList.add('is-linked');
        }, i * 450);
      });
    };
    if (reduceMotion || !hasIO){
      fillProcess();
    } else {
      var processObserver = new IntersectionObserver(function(entries){
        if (entries[0].isIntersecting){
          processObserver.disconnect();
          fillProcess();
        }
      }, { threshold:0.4 });
      processObserver.observe(process);
    }
  }

  // Botão do WhatsApp (sempre visível) e mensagem de contato
  var bubble = document.getElementById('contactBubble');
  var waPill = document.getElementById('waPill');
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var dismissed = false;
  try { dismissed = sessionStorage.getItem('nortis-contact-collapsed') === '1'; } catch (e) {}

  if (waPill && finePointer){
    // Computador: botão e mensagem numa peça só. is-open = expandida; is-hover = texto de chamada.
    var pillText = waPill.querySelector('.wa-pill-text');
    var pillIcon = waPill.querySelector('.wa-pill-icon');
    var pillLink = waPill.querySelector('.wa-pill-link');
    var pillLeaveTimer = null;
    var fitPill = function(){
      var hover = waPill.classList.contains('is-hover');
      if (!hover && !waPill.classList.contains('is-open')){
        pillText.style.width = '';
        return;
      }
      var label = waPill.querySelector(hover ? '.wa-pill-label.is-hover' : '.wa-pill-label.is-normal');
      pillText.style.width = label.offsetWidth + 'px';
    };
    var setPill = function(name, on){
      waPill.classList.toggle(name, on);
      fitPill();
    };

    if (!dismissed){
      if (reduceMotion){
        setPill('is-open', true);
      } else {
        setTimeout(function(){ if (!dismissed) setPill('is-open', true); }, 3000);
        setTimeout(function(){ if (!dismissed) pillIcon.classList.add('is-wobble'); }, 13000);
        pillIcon.addEventListener('animationend', function(){ pillIcon.classList.remove('is-wobble'); });
      }
    }

    // Expandida: ao sair, volta na hora ao texto anterior. Recolhida: recolhe cerca de 400 ms depois.
    var enterPill = function(){
      clearTimeout(pillLeaveTimer);
      setPill('is-hover', true);
    };
    var leavePill = function(){
      clearTimeout(pillLeaveTimer);
      if (waPill.classList.contains('is-open')){
        setPill('is-hover', false);
      } else {
        pillLeaveTimer = setTimeout(function(){ setPill('is-hover', false); }, 400);
      }
    };
    waPill.addEventListener('mouseenter', enterPill);
    waPill.addEventListener('mouseleave', leavePill);
    pillLink.addEventListener('focus', enterPill);
    pillLink.addEventListener('blur', leavePill);

    document.getElementById('waPillClose').addEventListener('click', function(){
      // Recolhe para o quadrado com o ícone
      dismissed = true;
      clearTimeout(pillLeaveTimer);
      waPill.classList.remove('is-hover');
      setPill('is-open', false);
      try { sessionStorage.setItem('nortis-contact-collapsed', '1'); } catch (e) {}
    });
  } else if (bubble){
    var contactClose = document.getElementById('contactClose');

    if (dismissed){
      bubble.classList.add('is-dismissed');
    } else if (!reduceMotion){
      bubble.classList.add('is-pending');
      setTimeout(function(){ bubble.classList.remove('is-pending'); }, 3000);
      setTimeout(function(){
        if (!bubble.classList.contains('is-dismissed')) bubble.classList.add('is-wobble');
      }, 13000);
      bubble.addEventListener('animationend', function(){ bubble.classList.remove('is-wobble'); });
    }
    contactClose.addEventListener('click', function(){
      // Fecha só o balão; o botão com o ícone continua
      bubble.classList.add('is-dismissed');
      try { sessionStorage.setItem('nortis-contact-collapsed', '1'); } catch (e) {}
    });
  }

  // Aparecer ao rolar (versão leve). Sem JavaScript ou com movimento reduzido, tudo fica visível.
  if (!reduceMotion && hasIO){
    var revealEls = [];
    document.querySelectorAll('[data-reveal]').forEach(function(el){ revealEls.push(el); });
    document.querySelectorAll('[data-reveal-list]').forEach(function(list){
      Array.prototype.forEach.call(list.children, function(child, i){
        child.style.transitionDelay = (i * 80) + 'ms';
        revealEls.push(child);
      });
    });
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold:0.12, rootMargin:'0px 0px -6% 0px' });
    revealEls.forEach(function(el){
      el.classList.add('reveal');
      revealObserver.observe(el);
    });
  }
})();
