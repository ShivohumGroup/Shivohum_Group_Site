/* ============================================================
   Shivohum Group — GSAP Animation Engine
   Architecture motion · loader · typography
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     REDUCED MOTION CHECK
     ============================================================ */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     SITE READY GATE — hero waits for loader
     ============================================================ */
  let siteReady = false;
  const readyFns = [];

  function onSiteReady(fn) {
    if (siteReady) fn();
    else readyFns.push(fn);
  }

  function markSiteReady() {
    if (siteReady) return;
    siteReady = true;
    document.body.classList.remove('is-loading');
    document.body.classList.add('is-ready');
    const loader = document.getElementById('page-loader');
    if (loader) loader.classList.add('is-done');
    readyFns.splice(0).forEach(fn => {
      try { fn(); } catch (e) { /* no-op */ }
    });
    if (typeof ScrollTrigger !== 'undefined') {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  }

  /* ============================================================
     PAGE LOADER — only on first visit this browser session
     ============================================================ */
  const LOADER_KEY = 'shivohum_seen_loader';

  function hasSeenLoader() {
    try {
      return sessionStorage.getItem(LOADER_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function markLoaderSeen() {
    try {
      sessionStorage.setItem(LOADER_KEY, '1');
    } catch (e) { /* private mode */ }
  }

  function runPageLoader() {
    const loader = document.getElementById('page-loader');

    // Return visits / inner navigations — skip instantly
    if (!loader || hasSeenLoader() || document.documentElement.classList.contains('loader-skip')) {
      if (loader) {
        loader.classList.add('is-done');
        loader.setAttribute('aria-hidden', 'true');
      }
      document.body.classList.remove('is-loading');
      markSiteReady();
      return;
    }

    const progressEl = loader.querySelector('.page-loader__progress');
    const pctEl = loader.querySelector('[data-loader-pct]');
    const brand = loader.querySelector('.page-loader__brand');
    const tag = loader.querySelector('.page-loader__tag');
    const eyebrow = loader.querySelector('.page-loader__eyebrow');
    const corners = loader.querySelectorAll('.page-loader__corner');
    const minMs = prefersReducedMotion ? 180 : 900;
    const started = performance.now();
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      markLoaderSeen();
      const wait = Math.max(0, minMs - (performance.now() - started));
      setTimeout(() => {
        if (typeof gsap !== 'undefined' && !prefersReducedMotion) {
          gsap.to(loader, {
            autoAlpha: 0,
            duration: 0.45,
            ease: 'power2.inOut',
            onComplete: markSiteReady,
          });
        } else {
          markSiteReady();
        }
      }, wait);
    };

    if (typeof gsap !== 'undefined' && !prefersReducedMotion) {
      const state = { pct: 0 };
      gsap.set([brand, tag, eyebrow].filter(Boolean), { autoAlpha: 0, y: 14 });
      gsap.set(corners, { autoAlpha: 0, scale: 0.6 });
      if (progressEl) gsap.set(progressEl, { width: '0%' });

      gsap.timeline()
        .to(corners, { autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }, 0)
        .to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.35 }, 0.08)
        .to(brand, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.15)
        .to(tag, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.28);

      gsap.to(state, {
        pct: 100,
        duration: 0.85,
        ease: 'power1.inOut',
        onUpdate: () => {
          const v = Math.round(state.pct);
          if (progressEl) progressEl.style.width = v + '%';
          if (pctEl) pctEl.textContent = String(v);
        },
        onComplete: finish,
      });
    } else {
      if (progressEl) progressEl.style.width = '100%';
      if (pctEl) pctEl.textContent = '100';
      finish();
    }

    window.addEventListener('load', finish, { once: true });
    setTimeout(finish, prefersReducedMotion ? 350 : 2200);
  }

  runPageLoader();

  /* ============================================================
     COUNTER HELPERS (works with or without GSAP)
     ============================================================ */
  function setCounterValue(el, value) {
    const target = parseFloat(el.dataset.target || '0');
    const suffix = el.dataset.suffix || '';
    el.textContent = (Number.isInteger(target)
      ? Math.round(value)
      : value.toFixed(1)) + suffix;
  }

  function fillCountersInstant() {
    document.querySelectorAll('.counter').forEach(el => {
      const target = parseFloat(el.dataset.target || '0');
      setCounterValue(el, target);
    });
  }

  function wrapTitleWords(element) {
    if (!element || element.dataset.wordsWrapped === '1') return;
    const nodes = Array.from(element.childNodes);
    nodes.forEach(node => {
      if (node.nodeType === 3) {
        const text = node.nodeValue;
        const words = text.split(/(\s+)/);
        const fragment = document.createDocumentFragment();
        words.forEach(word => {
          if (word.trim().length === 0) {
            fragment.appendChild(document.createTextNode(word));
          } else {
            const wrap = document.createElement('span');
            wrap.className = 'title-word';
            const inner = document.createElement('span');
            inner.textContent = word;
            wrap.appendChild(inner);
            fragment.appendChild(wrap);
          }
        });
        node.parentNode.replaceChild(fragment, node);
      } else if (node.nodeType === 1 && node.tagName.toLowerCase() !== 'br') {
        wrapTitleWords(node);
      }
    });
    element.dataset.wordsWrapped = '1';
  }

  /* ============================================================
     GSAP REGISTRATION
     ============================================================ */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ============================================================
     GSAP CONTEXT — scoped cleanup
     ============================================================ */
  let ctx;
  if (typeof gsap !== 'undefined' && !prefersReducedMotion) {
    ctx = gsap.context(() => {

      /* --- GSAP Defaults --- */
      gsap.defaults({
        ease: 'power3.out',
        duration: 0.9,
      });

      /* ========================================================
         HERO ENTRANCE TIMELINE (plays after loader)
         ======================================================== */
      const heroLabel = document.querySelector('.hero__label');
      const heroTitle = document.querySelector('.hero__title');
      const heroSub = document.querySelector('.hero__subtitle');
      const heroActions = document.querySelector('.hero__actions');
      const heroScroll = document.querySelector('.hero__scroll');
      const heroImg = document.querySelector('.hero__img');
      const heroOrbit = document.querySelector('.hero__orbit');
      const orbitStage = document.querySelector('.orbit-stage--hero');

      if (heroTitle) {
        const heroTl = gsap.timeline({ paused: true });

        if (heroImg) {
          gsap.set(heroImg, { scale: 1.08 });
          heroTl.to(heroImg, {
            scale: 1,
            duration: 1.8,
            ease: 'power2.out',
          }, 0);
        }

        if (heroOrbit && orbitStage) {
          const rings = orbitStage.querySelectorAll('.orbit-ring, .orbit-glow');
          const hub = orbitStage.querySelector('.orbit-hub');
          const badgeEls = orbitStage.querySelectorAll('.orbit-badge');

          gsap.set(heroOrbit, { autoAlpha: 0 });
          gsap.set(rings, { autoAlpha: 0 });
          gsap.set(hub, { autoAlpha: 0, scale: 0.85 });
          gsap.set(badgeEls, { autoAlpha: 0 });

          heroTl.to(heroOrbit, {
            autoAlpha: 1,
            duration: 0.85,
            ease: 'power3.out',
          }, 0.12);

          heroTl.to(rings, {
            autoAlpha: 1,
            duration: 0.8,
            stagger: 0.08,
            ease: 'power2.out',
          }, 0.28);

          heroTl.to(hub, {
            autoAlpha: 1,
            scale: 1,
            duration: 0.75,
            ease: 'back.out(1.4)',
            clearProps: 'transform',
          }, 0.4);

          heroTl.to(badgeEls, {
            autoAlpha: 1,
            duration: 0.5,
            stagger: 0.05,
            ease: 'power2.out',
          }, 0.55);
        } else if (heroOrbit) {
          heroTl.from(heroOrbit, {
            autoAlpha: 0,
            duration: 1,
            ease: 'power3.out',
          }, 0.15);
        }

        if (heroLabel) {
          const heroLabelText = heroLabel.querySelector('.hero__label-text') || heroLabel;
          const heroLabelLine = heroLabel.querySelector('.hero__label-line');
          if (heroLabelLine) {
            heroTl.from(heroLabelLine, { scaleX: 0, transformOrigin: 'left', duration: 0.55 }, 0.08);
          }
          heroTl.fromTo(
            heroLabelText,
            { y: 12, autoAlpha: 0, letterSpacing: '0.48em' },
            { y: 0, autoAlpha: 1, letterSpacing: '0.15em', duration: 0.8, ease: 'power2.out' },
            0.12
          );
        }

        function wrapTextNodes(element) {
          const nodes = Array.from(element.childNodes);
          nodes.forEach(node => {
            if (node.nodeType === 3) {
              const text = node.nodeValue;
              const words = text.split(/(\s+)/);
              const fragment = document.createDocumentFragment();
              words.forEach(word => {
                if (word.trim().length === 0) {
                  fragment.appendChild(document.createTextNode(word));
                } else {
                  const wordSpan = document.createElement('span');
                  wordSpan.className = 'hero-word';
                  wordSpan.style.display = 'inline-block';
                  wordSpan.style.overflow = 'hidden';

                  const innerSpan = document.createElement('span');
                  innerSpan.style.display = 'inline-block';
                  innerSpan.textContent = word;

                  wordSpan.appendChild(innerSpan);
                  fragment.appendChild(wordSpan);
                }
              });
              node.parentNode.replaceChild(fragment, node);
            } else if (node.nodeType === 1) {
              if (node.tagName.toLowerCase() !== 'br') {
                wrapTextNodes(node);
              }
            }
          });
        }

        wrapTextNodes(heroTitle);

        const wordSpans = heroTitle.querySelectorAll('.hero-word > span');
        if (wordSpans.length > 0) {
          heroTl.from(wordSpans, {
            y: '110%',
            rotate: 4,
            opacity: 0,
            duration: 0.85,
            stagger: 0.055,
            ease: 'power3.out',
          }, 0.25);
        } else {
          heroTl.from(heroTitle, {
            y: 30,
            opacity: 0,
            duration: 0.8,
          }, 0.25);
        }

        if (heroSub) {
          heroTl.from(heroSub, {
            y: 20,
            opacity: 0,
            duration: 0.7,
            clearProps: 'opacity,transform',
          }, 0.65);
        }

        if (heroActions) {
          heroTl.from(heroActions.children, {
            y: 16,
            opacity: 0,
            duration: 0.55,
            stagger: 0.08,
            ease: 'power3.out',
            clearProps: 'opacity,transform,visibility',
          }, 0.85);
        }

        if (heroScroll) {
          heroTl.from(heroScroll, {
            opacity: 0,
            duration: 0.5,
            clearProps: 'opacity',
          }, 1.0);
        }

        onSiteReady(() => heroTl.play(0));
      }

      /* ========================================================
         INTERACTIVE ORBIT SPIRAL (GSAP spin + upright labels)
         ======================================================== */
      if (orbitStage) {
        const hub = orbitStage.querySelector('.orbit-hub');
        const hubTitle = orbitStage.querySelector('[data-hub-title]');
        const hubSub = orbitStage.querySelector('[data-hub-sub]');
        const nodesWrap = orbitStage.querySelector('.orbit-nodes');
        const nodes = orbitStage.querySelectorAll('.orbit-node');
        const defaultTitle = hubTitle ? hubTitle.innerHTML : '';
        const defaultSub = hubSub ? hubSub.textContent : '';
        let hubSwapTimer = null;
        let pinnedNode = null;

        orbitStage.classList.add('orbit-stage--gsap');

        const spinDuration = 48;
        const badgeTweens = [];

        if (nodesWrap) {
          gsap.set(nodesWrap, { rotation: 0, transformOrigin: '50% 50%' });

          nodes.forEach(node => {
            const badge = node.querySelector('.orbit-badge');
            if (!badge) return;
            const angle = parseFloat(String(node.style.getPropertyValue('--a')).replace('deg', '')) || 0;
            // Counter-rotate so icon + label stay horizontally upright
            gsap.set(badge, {
              xPercent: -50,
              yPercent: -50,
              rotation: -angle,
              transformOrigin: '50% 50%',
            });
            badgeTweens.push(
              gsap.to(badge, {
                rotation: -angle - 360,
                duration: spinDuration,
                ease: 'none',
                repeat: -1,
              })
            );
          });

          const nodesTween = gsap.to(nodesWrap, {
            rotation: 360,
            duration: spinDuration,
            ease: 'none',
            repeat: -1,
          });

          const pauseOrbit = () => {
            nodesTween.pause();
            badgeTweens.forEach(t => t.pause());
            orbitStage.classList.add('is-paused');
          };

          const resumeOrbit = () => {
            if (pinnedNode) return;
            nodesTween.resume();
            badgeTweens.forEach(t => t.resume());
            orbitStage.classList.remove('is-paused');
          };

          const setHubCopy = (titleHtml, subText) => {
            if (!hubTitle || !hubSub || !hub) return;
            hub.classList.add('is-swapping');
            clearTimeout(hubSwapTimer);
            hubSwapTimer = setTimeout(() => {
              hubTitle.innerHTML = titleHtml;
              hubSub.textContent = subText;
              hub.classList.remove('is-swapping');
            }, 160);
          };

          const activateNode = (node) => {
            nodes.forEach(n => n.classList.remove('is-active'));
            if (!node) {
              resumeOrbit();
              setHubCopy(defaultTitle, defaultSub);
              return;
            }
            node.classList.add('is-active');
            pauseOrbit();
            setHubCopy(node.dataset.stage || '', node.dataset.stageSub || '');
          };

          nodes.forEach(node => {
            node.addEventListener('pointerenter', () => {
              if (pinnedNode) return;
              activateNode(node);
            });

            node.addEventListener('pointerleave', () => {
              if (pinnedNode) return;
              activateNode(null);
            });

            node.addEventListener('focus', () => activateNode(node));
            node.addEventListener('blur', () => {
              if (pinnedNode === node) return;
              activateNode(pinnedNode);
            });

            node.addEventListener('click', (e) => {
              e.preventDefault();
              if (pinnedNode === node) {
                pinnedNode = null;
                activateNode(null);
              } else {
                pinnedNode = node;
                activateNode(node);
              }
            });
          });
        }

        // Soft pointer tilt on desktop — rotateX/Y only (no opacity/scale)
        const canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (canTilt) {
          const tiltX = gsap.quickTo(orbitStage, 'rotateX', { duration: 0.55, ease: 'power2.out' });
          const tiltY = gsap.quickTo(orbitStage, 'rotateY', { duration: 0.55, ease: 'power2.out' });

          orbitStage.addEventListener('pointermove', (e) => {
            const rect = orbitStage.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            tiltY(x * 12);
            tiltX(-y * 8);
          });

          orbitStage.addEventListener('pointerleave', () => {
            tiltX(0);
            tiltY(0);
          });
        }

        // Scroll: only subtle Y on a clone-free wrapper — NEVER opacity
        // (opacity scrub was capturing entrance's 0 and freezing orbit invisible on scroll-back)
        if (heroOrbit) {
          gsap.fromTo(heroOrbit,
            { y: 0 },
            {
              y: 28,
              ease: 'none',
              scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
                invalidateOnRefresh: true,
              },
            }
          );
        }
      }

      /* ========================================================
         PAGE HERO ENTRANCE (inner pages)
         ======================================================== */
      const pageHeroTitle = document.querySelector('.page-hero__title');
      const pageHeroDesc = document.querySelector('.page-hero__desc');
      const pageHeroLabel = document.querySelector('.page-hero .text-label');
      const pageHeroImg = document.querySelector('.page-hero .hero__img');

      if (pageHeroTitle && !heroTitle) {
        const pageTl = gsap.timeline({ paused: true });

        if (pageHeroImg) {
          gsap.set(pageHeroImg, { scale: 1.06 });
          pageTl.to(pageHeroImg, {
            scale: 1,
            duration: 1.6,
            ease: 'power2.out',
          }, 0);
        }

        if (pageHeroLabel) {
          pageTl.from(pageHeroLabel, {
            y: 12,
            autoAlpha: 0,
            letterSpacing: '0.42em',
            duration: 0.7,
          }, 0.1);
        }

        wrapTitleWords(pageHeroTitle);
        const pageWords = pageHeroTitle.querySelectorAll('.title-word > span');
        if (pageWords.length) {
          pageTl.from(pageWords, {
            y: '110%',
            opacity: 0,
            duration: 0.75,
            stagger: 0.05,
            ease: 'power3.out',
          }, 0.2);
        } else {
          pageTl.from(pageHeroTitle, {
            y: 30,
            opacity: 0,
            duration: 0.8,
          }, 0.2);
        }

        if (pageHeroDesc) {
          pageTl.from(pageHeroDesc, {
            y: 20,
            opacity: 0,
            duration: 0.7,
          }, 0.5);
        }

        onSiteReady(() => pageTl.play(0));
      } else if (!heroTitle) {
        // No hero animation on this page — still unlock after loader
        onSiteReady(() => {});
      }

      /* ========================================================
         TYPOGRAPHY — labels + title word reveals (reliable)
         ======================================================== */
      const typographyLabels = gsap.utils.toArray(
        '.text-label, .section-header__label, .hero__label-text, .page-hero .text-label'
      );
      typographyLabels.forEach(label => {
        if (label.closest('.hero__label')) return; // hero timeline owns this
        if (label.closest('.page-hero')) return; // page hero timeline owns this
        const trigger = label.closest('.section-header') || label.closest('section') || label;
        gsap.fromTo(
          label,
          { autoAlpha: 0, y: 12, letterSpacing: '0.42em' },
          {
            autoAlpha: 1,
            y: 0,
            letterSpacing: '0.18em',
            duration: 0.85,
            ease: 'power2.out',
            scrollTrigger: {
              trigger,
              start: 'top 88%',
              once: true,
              toggleActions: 'play none none none',
            },
          }
        );
      });

      const typographyTitles = gsap.utils.toArray(
        '.section-header__title, .split__content > h2'
      );
      typographyTitles.forEach(title => {
        if (title.classList.contains('hero__title')) return;
        wrapTitleWords(title);
        const words = title.querySelectorAll('.title-word > span');
        const trigger = title.closest('.section-header') || title.closest('section') || title;

        if (!words.length) {
          gsap.from(title, {
            y: 28,
            autoAlpha: 0,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: { trigger, start: 'top 88%', once: true },
          });
          return;
        }

        gsap.set(words, { yPercent: 115, opacity: 0 });
        ScrollTrigger.create({
          trigger,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            gsap.to(words, {
              yPercent: 0,
              opacity: 1,
              duration: 0.8,
              stagger: 0.055,
              ease: 'power3.out',
              overwrite: 'auto',
            });
          },
        });
      });

      /* ========================================================
         HERO SCROLL PARALLAX
         ======================================================== */
      const heroMedia = document.querySelector('.hero__img');
      if (heroMedia) {
        gsap.to(heroMedia, {
          y: '15%',
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      /* Inner page hero parallax */
      const pageHeroMedia = document.querySelector('.page-hero .hero__img');
      if (pageHeroMedia && pageHeroMedia !== heroMedia) {
        gsap.to(pageHeroMedia, {
          y: '12%',
          ease: 'none',
          scrollTrigger: {
            trigger: '.page-hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      /* ========================================================
         SCROLL ANIMATIONS — Batch for efficiency
         ======================================================== */

      /* Fade-up elements — skip section headers (typography owns those) */
      const fadeUpEls = gsap.utils.toArray('[data-animate="fade-up"]').filter(
        el => !el.classList.contains('section-header')
      );
      if (fadeUpEls.length) {
        gsap.set(fadeUpEls, { y: 40, opacity: 0 });
        ScrollTrigger.batch(fadeUpEls, {
          onEnter: (batch) => {
            gsap.to(batch, {
              y: 0,
              opacity: 1,
              duration: 0.8,
              stagger: 0.12,
              ease: 'power3.out',
              overwrite: 'auto',
            });
          },
          start: 'top 88%',
          once: true,
        });
      }

      /* Fade-in elements (no Y offset) */
      const fadeInEls = gsap.utils.toArray('[data-animate="fade-in"]');
      if (fadeInEls.length) {
        gsap.set(fadeInEls, { opacity: 0 });
        ScrollTrigger.batch(fadeInEls, {
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              duration: 0.8,
              stagger: 0.1,
            });
          },
          start: 'top 88%',
          once: true,
        });
      }

      /* Slide-in from left */
      const slideLeftEls = gsap.utils.toArray('[data-animate="slide-left"]');
      if (slideLeftEls.length) {
        const slideOffset = window.matchMedia('(max-width: 767px)').matches ? 24 : 50;
        slideLeftEls.forEach(el => {
          gsap.set(el, { x: -slideOffset, opacity: 0 });
          ScrollTrigger.create({
            trigger: el,
            start: 'top 85%',
            once: true,
            onEnter: () => {
              gsap.to(el, { x: 0, opacity: 1, duration: 0.9 });
            },
          });
        });
      }

      /* Slide-in from right */
      const slideRightEls = gsap.utils.toArray('[data-animate="slide-right"]');
      if (slideRightEls.length) {
        const slideOffset = window.matchMedia('(max-width: 767px)').matches ? 24 : 50;
        slideRightEls.forEach(el => {
          gsap.set(el, { x: slideOffset, opacity: 0 });
          ScrollTrigger.create({
            trigger: el,
            start: 'top 85%',
            once: true,
            onEnter: () => {
              gsap.to(el, { x: 0, opacity: 1, duration: 0.9 });
            },
          });
        });
      }

      /* Image reveal with clip-path */
      const revealImgs = gsap.utils.toArray('[data-animate="reveal-img"]');
      if (revealImgs.length) {
        revealImgs.forEach(el => {
          const img = el.querySelector('img');
          gsap.set(el, { clipPath: 'inset(0 100% 0 0)' });
          if (img) gsap.set(img, { scale: 1.15 });

          ScrollTrigger.create({
            trigger: el,
            start: 'top 82%',
            once: true,
            onEnter: () => {
              const tl = gsap.timeline();
              tl.to(el, {
                clipPath: 'inset(0 0% 0 0)',
                duration: 1,
                ease: 'power3.inOut',
              });
              if (img) {
                tl.to(img, {
                  scale: 1,
                  duration: 1.2,
                  ease: 'power2.out',
                }, 0.15);
              }
            },
          });
        });
      }

      /* ========================================================
         BLUEPRINT REVEALS — architecture wipe (cards / projects)
         ======================================================== */
      const blueprintEls = gsap.utils.toArray('[data-animate="blueprint"]');
      if (blueprintEls.length) {
        blueprintEls.forEach((el, i) => {
          const media = el.querySelector('.card__media, .project__img-wrap, img');
          const body = el.querySelector('.card__body, .project__overlay');

          gsap.set(el, {
            clipPath: 'inset(0 0 100% 0)',
            autoAlpha: 1,
          });
          if (media) gsap.set(media, { y: 24, scale: 1.06 });
          if (body) gsap.set(body, { autoAlpha: 0, y: 16 });

          ScrollTrigger.create({
            trigger: el,
            start: 'top 88%',
            once: true,
            onEnter: () => {
              const tl = gsap.timeline({ delay: (i % 3) * 0.08 });
              tl.to(el, {
                clipPath: 'inset(0 0 0% 0)',
                duration: 1.05,
                ease: 'power3.inOut',
              });
              if (media) {
                tl.to(media, {
                  y: 0,
                  scale: 1,
                  duration: 1.15,
                  ease: 'power2.out',
                  clearProps: 'transform',
                }, 0.1);
              }
              if (body) {
                tl.to(body, {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.55,
                  ease: 'power2.out',
                }, 0.45);
              }
            },
          });
        });
      }

      /* ========================================================
         SPLIT LAYOUT — parallax + content polish
         ======================================================== */
      const splitMedias = gsap.utils.toArray('.split__media img');
      splitMedias.forEach(img => {
        gsap.fromTo(img,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: 'none',
            scrollTrigger: {
              trigger: img.closest('.split') || img,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      });

      /* ========================================================
         ANIMATED COUNTERS (GSAP)
         ======================================================== */
      const counters = gsap.utils.toArray('.counter');
      counters.forEach(el => {
        const target = parseFloat(el.dataset.target || '0');
        const obj = { val: 0 };

        ScrollTrigger.create({
          trigger: el.closest('.stats') || el,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            gsap.to(obj, {
              val: target,
              duration: 1.8,
              ease: 'power2.out',
              snap: { val: Number.isInteger(target) ? 1 : 0.1 },
              onUpdate: () => setCounterValue(el, obj.val),
            });
          },
        });
      });

      /* ========================================================
         SECTION HEADER REVEALS (lines + desc — titles via typography)
         ======================================================== */
      const sectionHeaders = gsap.utils.toArray('.section-header');
      sectionHeaders.forEach(header => {
        const desc = header.querySelector('.section-header__desc');
        const line = header.querySelector('.section-header__line');
        if (!desc && !line) return;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: header,
            start: 'top 85%',
            once: true,
          },
        });

        if (desc) tl.from(desc, { y: 15, opacity: 0, duration: 0.6 }, 0.25);
        if (line) tl.from(line, { scaleX: 0, transformOrigin: header.classList.contains('section-header--center') ? 'center' : 'left', duration: 0.65 }, 0.35);
      });

      /* ========================================================
         CAPABILITIES IMAGES — Layered reveal
         ======================================================== */
      const capImgs = gsap.utils.toArray('.capabilities__img');
      if (capImgs.length) {
        capImgs.forEach((img, i) => {
          gsap.set(img, { y: 40, opacity: 0 });
          ScrollTrigger.create({
            trigger: '.capabilities__images',
            start: 'top 80%',
            once: true,
            onEnter: () => {
              gsap.to(img, {
                y: 0,
                opacity: 1,
                duration: 1,
                delay: i * 0.2,
                ease: 'power3.out',
              });
            },
          });
        });
      }

      /* ========================================================
         CARDS / PROJECTS — hover lift via GSAP
         ======================================================== */
      const hoverCards = gsap.utils.toArray('.card--media, .project');
      hoverCards.forEach(card => {
        const media = card.querySelector('.card__media img, .project__img');
        if (!media) return;

        card.addEventListener('pointerenter', () => {
          gsap.to(media, {
            scale: 1.06,
            duration: 0.7,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        });
        card.addEventListener('pointerleave', () => {
          gsap.to(media, {
            scale: 1,
            duration: 0.7,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        });
      });

      /* ========================================================
         TESTIMONIAL — quote + avatar pop (reliable ST timeline)
         ======================================================== */
      const testimonialInner = document.querySelector('[data-animate="testimonial"]');
      if (testimonialInner) {
        const mark = testimonialInner.querySelector('.testimonial__mark');
        const quote = testimonialInner.querySelector('.testimonial__quote');
        const divider = testimonialInner.querySelector('.testimonial__divider');
        const person = testimonialInner.querySelector('.testimonial__person');
        const avatar = testimonialInner.querySelector('.testimonial__avatar-wrap');
        const meta = testimonialInner.querySelector('.testimonial__meta');

        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: {
            trigger: testimonialInner,
            start: 'top 88%',
            toggleActions: 'play none none none',
            once: true,
          },
        });

        if (mark) {
          tl.from(mark, { autoAlpha: 0, y: 16, scale: 0.7, duration: 0.55 }, 0);
        }
        if (quote) {
          tl.from(quote, { autoAlpha: 0, y: 24, duration: 0.7 }, 0.1);
        }
        if (divider) {
          tl.from(divider, { autoAlpha: 0, scaleX: 0, duration: 0.45 }, 0.35);
        }
        if (person) {
          tl.from(person, { autoAlpha: 0, y: 20, duration: 0.5 }, 0.45);
        }
        if (avatar) {
          tl.from(avatar, {
            scale: 0.35,
            rotation: -12,
            duration: 0.75,
            ease: 'back.out(2.2)',
          }, 0.5);
        }
        if (meta) {
          tl.from(meta, { autoAlpha: 0, x: -10, duration: 0.5 }, 0.65);
        }
      }

      /* ========================================================
         CTA BAND — subtle scale-in
         ======================================================== */
      const ctaInner = document.querySelector('.cta__inner');
      if (ctaInner && !ctaInner.hasAttribute('data-animate')) {
        gsap.from(ctaInner, {
          y: 30,
          opacity: 0,
          duration: 0.9,
          scrollTrigger: {
            trigger: ctaInner,
            start: 'top 88%',
            once: true,
          },
        });
      }

      /* ========================================================
         RESPONSIVE ANIMATIONS — matchMedia
         ======================================================== */
      gsap.matchMedia().add('(max-width: 767px)', () => {
        ScrollTrigger.config({ limitCallbacks: true });
      });

      // Fix hash / deep-link (#stats) and late layout
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
      window.addEventListener('load', () => ScrollTrigger.refresh());
      window.addEventListener('hashchange', () => {
        ScrollTrigger.refresh();
      });

    }); // end gsap.context
  } else {
    // No GSAP or reduced motion — show final counter values
    fillCountersInstant();
  }

  /* ============================================================
     HEADER SCROLL BEHAVIOR (vanilla JS — lightweight)
     ============================================================ */
  const header = document.getElementById('site-header');
  const backToTopBtn = document.getElementById('back-to-top');

  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle('site-header--scrolled', y > 30);
    }
    if (backToTopBtn) {
      backToTopBtn.classList.toggle('fab--top--visible', y > 500);
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  // Initial check
  onScroll();

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     MOBILE MENU
     ============================================================ */
  const menuBtn = document.getElementById('menu-btn');
  const menuClose = document.getElementById('menu-close');
  const mobileMenu = document.getElementById('mobile-menu');

  function openMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('mobile-menu--open');
    document.body.style.overflow = 'hidden';
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');

    if (typeof gsap !== 'undefined' && !prefersReducedMotion) {
      const links = mobileMenu.querySelectorAll('.mobile-menu__link');
      gsap.from(links, {
        y: 30,
        opacity: 0,
        stagger: 0.06,
        duration: 0.5,
        ease: 'power3.out',
        delay: 0.15,
      });
    }
  }

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('mobile-menu--open');
    document.body.style.overflow = '';
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }

  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);

  if (mobileMenu) {
    mobileMenu.querySelectorAll('.mobile-menu__link').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu?.classList.contains('mobile-menu--open')) {
      closeMenu();
    }
  });

  /* ============================================================
     CONTACT FORM
     ============================================================ */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const statusEl = document.getElementById('form-status');
    const sendBtn = document.getElementById('send-btn');

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name')?.value.trim() || '';
      const email = document.getElementById('email')?.value.trim() || '';
      const phone = document.getElementById('phone')?.value.trim() || '';
      const message = document.getElementById('message')?.value.trim() || '';

      if (statusEl) {
        statusEl.className = 'form-status';
        statusEl.textContent = 'Sending your message…';
        statusEl.style.display = 'block';
      }
      if (sendBtn) sendBtn.disabled = true;

      try {
        const res = await fetch('https://formsubmit.co/ajax/shivohumgrp@gmail.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            name, email, phone, message,
            _subject: 'Enquiry from Shivohum Group website — ' + name,
            _template: 'table',
            _captcha: 'false',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Unable to send message.');
        contactForm.reset();
        if (statusEl) {
          statusEl.className = 'form-status form-status--success';
          statusEl.textContent = 'Thank you! Your message has been sent. We will get back to you soon.';
        }
      } catch (err) {
        if (statusEl) {
          statusEl.className = 'form-status form-status--error';
          statusEl.textContent = 'Could not send right now. Please try again, or email shivohumgrp@gmail.com directly.';
        }
      } finally {
        if (sendBtn) sendBtn.disabled = false;
      }
    });
  }

  /* ============================================================
     CURRENT YEAR
     ============================================================ */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  /* ============================================================
     CLEANUP on page unload
     ============================================================ */
  window.addEventListener('beforeunload', () => {
    if (ctx) ctx.revert();
  });

})();
