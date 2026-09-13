/**
 * Billakanti Jaya Vardhan — Portfolio Core Controller
 * Fully Modular, Fault-Isolated, CDN-Independent & Highly Resilient
 */

(function () {
  'use strict';

  // ── SAFE MODULE EXECUTION WRAPPER ──────────────────────────────────────────
  // Guarantees that an error in any one feature can NEVER prevent other sections from initializing.
  function safeExec(moduleName, fn) {
    try {
      fn();
    } catch (err) {
      console.warn('[Portfolio Controller] Warning in ' + moduleName + ':', err);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 1: PRELOADER & HERO CANVAS BACKGROUND ANIMATION CONTROLLER
  // ═══════════════════════════════════════════════════════════════════════════
  safeExec('Canvas & Preloader Engine', function () {
    const TOTAL_FRAMES = 145;
    const canvas = document.getElementById('animationCanvas');
    const preloader = document.getElementById('preloader');
    const mobImgEl = document.getElementById('mobilePortraitImg');
    const heroEl = document.getElementById('home');
    const navHeader = document.querySelector('header.nav-header');

    if (!canvas) return;

    let ctx = null;
    try {
      ctx = canvas.getContext('2d', { alpha: true });
    } catch (e) {
      console.warn('[Canvas] 2D Context initialization error:', e);
    }

    const images = new Array(TOTAL_FRAMES);
    let targetFrame = 0;
    let currentFrame = 0;
    let isLoaded = false;
    let initialFrameReady = false;

    // ── CACHED LAYOUT DIMENSIONS ──────────────────────────────────────────────
    let cachedWinHeight = window.innerHeight || 800;
    let cachedWinWidth = window.innerWidth || 1200;
    let cachedDocHeight = document.documentElement.scrollHeight || 4000;
    let cachedMaxScroll = Math.max(1, cachedDocHeight - cachedWinHeight);
    let cachedHeroHeight = heroEl ? (heroEl.offsetHeight || 650) : 650;

    function updateDimensions() {
      cachedWinHeight = window.innerHeight || 800;
      cachedWinWidth = window.innerWidth || 1200;
      cachedDocHeight = document.documentElement.scrollHeight || 4000;
      cachedMaxScroll = Math.max(1, cachedDocHeight - cachedWinHeight);
      if (heroEl) {
        cachedHeroHeight = heroEl.offsetHeight || 650;
      }
      resizeCanvas();
    }

    function getFrameFilename(index) {
      const paddedIndex = String(index).padStart(3, '0');
      return `frames/ezgif-frame-${paddedIndex}.jpg`;
    }

    function resizeCanvas() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = cachedWinWidth * dpr;
      canvas.height = cachedWinHeight * dpr;
      try {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
      } catch (e) {}
    }

    function initInitialFrame() {
      if (initialFrameReady) return;
      initialFrameReady = true;
      isLoaded = true;

      if (preloader) {
        preloader.classList.add('hidden');
      }

      updateDimensions();

      if (mobImgEl && images[0] && images[0].complete) {
        mobImgEl.src = images[0].src;
      }

      drawFrame(0);
      triggerRenderLoop();
      revealInitialElements();
    }

    // 1. Load First Critical Frame immediately
    const firstImg = new Image();
    firstImg.src = getFrameFilename(1);
    firstImg.onload = () => {
      images[0] = firstImg;
      initInitialFrame();
      scheduleBackgroundFrameStreaming();
    };
    firstImg.onerror = () => {
      initInitialFrame();
      scheduleBackgroundFrameStreaming();
    };

    // Failsafe safeguard: Never hold preloader more than 200ms
    setTimeout(() => {
      if (!initialFrameReady) initInitialFrame();
    }, 200);

    // 2. Stream Remaining Frames Non-Blockingly During Idle
    function scheduleBackgroundFrameStreaming() {
      // Delay frame batch streaming until after page load so critical assets have 100% bandwidth
      if (document.readyState === 'complete') {
        loadRemainingFrames();
      } else {
        window.addEventListener('load', loadRemainingFrames, { once: true });
        setTimeout(loadRemainingFrames, 1200); // Fallback trigger
      }
    }

    let framesStreamingStarted = false;
    function loadRemainingFrames() {
      if (framesStreamingStarted) return;
      framesStreamingStarted = true;

      let currentIndex = 2;
      const BATCH_SIZE = 6;

      function loadNextBatch() {
        if (currentIndex > TOTAL_FRAMES) return;
        const end = Math.min(currentIndex + BATCH_SIZE, TOTAL_FRAMES + 1);

        for (let i = currentIndex; i < end; i++) {
          const idx = i - 1;
          const img = new Image();
          img.src = getFrameFilename(i);
          img.onload = () => { images[idx] = img; };
          img.onerror = () => { images[idx] = null; };
        }
        currentIndex = end;

        if (currentIndex <= TOTAL_FRAMES) {
          if ('requestIdleCallback' in window) {
            requestIdleCallback(loadNextBatch, { timeout: 100 });
          } else {
            setTimeout(loadNextBatch, 30);
          }
        }
      }

      if ('requestIdleCallback' in window) {
        requestIdleCallback(loadNextBatch, { timeout: 120 });
      } else {
        setTimeout(loadNextBatch, 40);
      }
    }

    function updateTargetFrame(scrollTop) {
      if (cachedMaxScroll <= 0) return;

      if (cachedWinWidth <= 768) {
        const heroRange = Math.max(700, cachedHeroHeight * 1.6);
        const mobileFraction = Math.max(0, Math.min(1, scrollTop / heroRange));
        targetFrame = mobileFraction * (TOTAL_FRAMES - 1);
      } else {
        const scrollFraction = Math.max(0, Math.min(1, scrollTop / cachedMaxScroll));
        targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
      }
    }

    function getBestAvailableFrame(idx) {
      if (images[idx] && images[idx].complete && images[idx].naturalWidth > 0) {
        return images[idx];
      }
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        if (idx - offset >= 0 && images[idx - offset] && images[idx - offset].complete && images[idx - offset].naturalWidth > 0) {
          return images[idx - offset];
        }
        if (idx + offset < TOTAL_FRAMES && images[idx + offset] && images[idx + offset].complete && images[idx + offset].naturalWidth > 0) {
          return images[idx + offset];
        }
      }
      return images[0] || null;
    }

    function drawFrame(frameIdx) {
      if (!isLoaded || !ctx || !canvas) return;

      const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameIdx)));
      const img = getBestAvailableFrame(clampedIndex);

      if (!img || !img.complete || img.naturalWidth === 0) return;

      const cw = canvas.width;
      const ch = canvas.height;

      ctx.clearRect(0, 0, cw, ch);

      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = cw / ch;

      let drawWidth, drawHeight, x, y;

      if (canvasAspect > imgAspect) {
        drawHeight = ch;
        drawWidth = ch * imgAspect;
        x = (cw - drawWidth) / 2;
        y = 0;
      } else {
        drawWidth = cw;
        drawHeight = cw / imgAspect;
        x = 0;
        y = (ch - drawHeight) / 2;
      }

      ctx.drawImage(img, x, y, drawWidth, drawHeight);
    }

    let lastDrawnFrame = -1;
    let renderLoopRunning = false;

    function renderLoop() {
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const diff = targetFrame - currentFrame;

      if (Math.abs(diff) > 0.001) {
        currentFrame += diff * 0.16;
      } else {
        currentFrame = targetFrame;
      }

      const heroVisible = currentScrollY <= cachedHeroHeight * 1.8;

      if (heroVisible) {
        const rounded = Math.round(currentFrame);
        if (rounded !== lastDrawnFrame) {
          lastDrawnFrame = rounded;
          drawFrame(currentFrame);

          if (mobImgEl && cachedWinWidth <= 768) {
            const currentMobImg = getBestAvailableFrame(rounded);
            if (currentMobImg && currentMobImg.complete && currentMobImg.naturalWidth > 0) {
              mobImgEl.src = currentMobImg.src;
            }
          }
        }

        if (mobImgEl && cachedWinWidth <= 768 && currentScrollY <= cachedHeroHeight * 1.6) {
          const parallaxY = currentScrollY * 0.22;
          mobImgEl.style.transform = `translate3d(0, ${parallaxY.toFixed(1)}px, 0) scale(1.06)`;
        }
      }

      if (Math.abs(targetFrame - currentFrame) > 0.001 && heroVisible) {
        requestAnimationFrame(renderLoop);
      } else {
        renderLoopRunning = false;
      }
    }

    function triggerRenderLoop() {
      if (!renderLoopRunning && isLoaded) {
        renderLoopRunning = true;
        requestAnimationFrame(renderLoop);
      }
    }

    let scrollTicking = false;
    function handleScroll() {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(() => {
          const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

          if (navHeader) {
            if (currentScrollY > 30) {
              navHeader.classList.add('scrolled');
            } else {
              navHeader.classList.remove('scrolled');
            }
          }

          if (currentScrollY <= cachedHeroHeight * 1.8) {
            updateTargetFrame(currentScrollY);
            triggerRenderLoop();
          }

          scrollTicking = false;
        });
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', () => {
      updateDimensions();
      drawFrame(currentFrame);
    }, { passive: true });
  });


  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 2: SCROLL REVEAL & PROGRESSIVE VISIBILITY ENGINE
  // ═══════════════════════════════════════════════════════════════════════════
  function revealInitialElements() {
    try {
      const threshold = (window.innerHeight || 800) * 1.4;
      document.querySelectorAll('.about-reveal, .beyond-reveal, .scroll-reveal, .heading-reveal, .academic-milestone-item, .founder-card, .proj-card, .lorven-box').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= threshold) {
          el.classList.add('in-view', 'revealed');
        }
      });
    } catch (e) {}
  }

  safeExec('Scroll Reveal Engine', function () {
    const revealElements = document.querySelectorAll(
      '.about-reveal, .beyond-reveal, .scroll-reveal, .heading-reveal, .academic-milestone-item, .founder-card, .proj-card, .cert-main-title, .scale-talk-card, .price-card, .highlight-item, .contact-info-card, .contact-form-panel, .lorven-box'
    );

    if ('IntersectionObserver' in window) {
      try {
        const revealObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view', 'revealed');
              observer.unobserve(entry.target);
            }
          });
        }, { rootMargin: '220px 0px 100px 0px', threshold: 0.001 });

        revealElements.forEach(el => {
          el.classList.add('scroll-reveal');
          revealObserver.observe(el);
        });
      } catch (e) {
        revealElements.forEach(el => el.classList.add('in-view', 'revealed'));
      }
    } else {
      revealElements.forEach(el => el.classList.add('in-view', 'revealed'));
    }

    // Safety fallback: reveal above-fold elements quickly
    revealInitialElements();
    setTimeout(revealInitialElements, 300);

    // Guaranteed failsafe: ensure nothing remains hidden permanently
    setTimeout(() => {
      document.querySelectorAll('.scroll-reveal, .about-reveal, .beyond-reveal, .heading-reveal, .proj-card').forEach(el => {
        el.classList.add('in-view', 'revealed');
      });
    }, 750);
  });


  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 3: INTERACTIVE 2-COLUMN TOOLKIT DASHBOARD & 3D ORBITAL SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  safeExec('Toolkit & 3D Orbital Constellation', function () {
    // 100% Locally Hosted & Self-Contained SVG Icon Definitions (Zero External CDN Dependency)
    const REAL_LOGOS = {
      "C":                  "images/icons/c.svg",
      "Java":               "images/icons/java.svg",
      "Python":             "images/icons/python.svg",
      "JavaScript":         "images/icons/javascript.svg",
      "TypeScript":         "images/icons/typescript.svg",
      "HTML":               "images/icons/html.svg",
      "CSS":                "images/icons/css.svg",
      "React":              "images/icons/react.svg",
      "Node.js":            "images/icons/nodejs.svg",
      "Next.js":            "images/icons/nextjs.svg",
      "Linux":              "images/icons/linux.svg",
      "Kali Linux":         "images/icons/kalilinux.svg",
      "ChatGPT":            "images/icons/chatgpt.svg",
      "Google Gemini":      "images/icons/gemini.svg",
      "PyTorch":            "images/icons/pytorch.svg",
      "Visual Studio Code": "images/icons/vscode.svg",
      "AWS":                "images/icons/aws.svg",
      "Google Cloud":       "images/icons/gcp.svg",
      "Kubernetes":         "images/icons/kubernetes.svg",
      "Cloudflare":         "images/icons/cloudflare.svg",
      "Vercel":             "images/icons/vercel.svg",
      "MySQL":              "images/icons/mysql.svg",
      "MongoDB":            "images/icons/mongodb.svg",
      "Firebase":           "images/icons/firebase.svg",
      "Supabase":           "images/icons/supabase.svg",
      "SQLite":             "images/icons/sqlite.svg",
      "SQL":                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath fill='%23ff6420' d='M16 2C8.268 2 2 5.582 2 10v12c0 4.418 6.268 8 14 8s14-3.582 14-8V10c0-4.418-6.268-8-14-8zm0 3c6.627 0 12 2.686 12 6s-5.373 6-12 6-12-2.686-12-6 5.373-6 12-6zm-12 8.356C5.98 14.887 10.742 16 16 16s10.02-1.113 12-2.644V16c0 3.314-5.373 6-12 6s-12-2.686-12-6v-2.644zM4 22c1.98 1.531 6.742 2.644 12 2.644s10.02-1.113 12-2.644V22c0 3.314-5.373 6-12 6s-12-2.686-12-6v0z'/%3E%3C/svg%3E",
      "Git":                "images/icons/git.svg",
      "GitHub":             "images/icons/github.svg",
      "Canva":              "images/icons/canva.svg",
      "CapCut":             "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23000'/%3E%3Cpath d='M10 10h5v12h-5zM17 10h5v12h-5z' fill='%23fff'/%3E%3C/svg%3E"
    };

    const TECH_DATASET = [
      // PROGRAMMING (5)
      { name: "C", category: "PROGRAMMING", status: "EXPLORING" },
      { name: "Java", category: "PROGRAMMING", status: "EXPLORING" },
      { name: "Python", category: "PROGRAMMING", status: "EXPLORING" },
      { name: "JavaScript", category: "PROGRAMMING", status: "USING" },
      { name: "TypeScript", category: "PROGRAMMING", status: "EXPLORING" },

      // WEB DEVELOPMENT (5)
      { name: "HTML", category: "WEB DEVELOPMENT", status: "USING" },
      { name: "CSS", category: "WEB DEVELOPMENT", status: "USING" },
      { name: "React", category: "WEB DEVELOPMENT", status: "EXPLORING" },
      { name: "Node.js", category: "WEB DEVELOPMENT", status: "EXPLORING" },
      { name: "Next.js", category: "WEB DEVELOPMENT", status: "EXPLORING" },

      // SYSTEMS & SECURITY (2)
      { name: "Linux", category: "SYSTEMS & SECURITY", status: "USING" },
      { name: "Kali Linux", category: "SYSTEMS & SECURITY", status: "EXPLORING" },

      // AI & DEVELOPMENT (4)
      { name: "ChatGPT", category: "AI & DEVELOPMENT", status: "USING" },
      { name: "Google Gemini", category: "AI & DEVELOPMENT", status: "USING" },
      { name: "PyTorch", category: "AI & DEVELOPMENT", status: "EXPLORING" },
      { name: "Visual Studio Code", category: "AI & DEVELOPMENT", status: "USING" },

      // CLOUD & INFRASTRUCTURE (5)
      { name: "AWS", category: "CLOUD & INFRASTRUCTURE", status: "EXPLORING" },
      { name: "Google Cloud", category: "CLOUD & INFRASTRUCTURE", status: "EXPLORING" },
      { name: "Kubernetes", category: "CLOUD & INFRASTRUCTURE", status: "EXPLORING" },
      { name: "Cloudflare", category: "CLOUD & INFRASTRUCTURE", status: "EXPLORING" },
      { name: "Vercel", category: "CLOUD & INFRASTRUCTURE", status: "EXPLORING" },

      // DATABASES & BACKEND (6)
      { name: "MySQL", category: "DATABASES & BACKEND", status: "EXPLORING" },
      { name: "MongoDB", category: "DATABASES & BACKEND", status: "EXPLORING" },
      { name: "Firebase", category: "DATABASES & BACKEND", status: "EXPLORING" },
      { name: "Supabase", category: "DATABASES & BACKEND", status: "EXPLORING" },
      { name: "SQLite", category: "DATABASES & BACKEND", status: "EXPLORING" },
      { name: "SQL", category: "DATABASES & BACKEND", status: "USING" },

      // DEVELOPMENT & VERSION CONTROL (2)
      { name: "Git", category: "DEVELOPMENT & VERSION CONTROL", status: "USING" },
      { name: "GitHub", category: "DEVELOPMENT & VERSION CONTROL", status: "USING" },

      // CREATIVE (2)
      { name: "Canva", category: "CREATIVE", status: "USING" },
      { name: "CapCut", category: "CREATIVE", status: "USING" }
    ];

    const showcaseIconBadge = document.getElementById('showcaseIconBadge');
    const showcaseToolTitle = document.getElementById('showcaseToolTitle');
    const showcaseCatTag = document.getElementById('showcaseCatTag');
    const showcaseStatusPill = document.getElementById('showcaseStatusPill');

    const DEFAULT_SHOWCASE_STATE = {
      symbol: "</>",
      title: "TECH CORE",
      cat: "SELECT A TECHNOLOGY",
      status: null
    };

    function updateRightShowcase(tech) {
      if (!showcaseToolTitle) return;

      showcaseToolTitle.style.opacity = '0';

      setTimeout(() => {
        if (!tech || tech.title === 'TECH CORE') {
          if (showcaseIconBadge) showcaseIconBadge.innerHTML = DEFAULT_SHOWCASE_STATE.symbol;
          showcaseToolTitle.textContent = DEFAULT_SHOWCASE_STATE.title;
          if (showcaseCatTag) showcaseCatTag.textContent = DEFAULT_SHOWCASE_STATE.cat;
          if (showcaseStatusPill) showcaseStatusPill.style.display = 'none';
        } else {
          const logoUrl = REAL_LOGOS[tech.name];
          if (showcaseIconBadge) {
            if (logoUrl) {
              showcaseIconBadge.innerHTML = `<img src="${logoUrl}" alt="${tech.name}" onerror="this.onerror=null; this.parentElement.textContent='${tech.name.substring(0, 2)}';">`;
            } else {
              showcaseIconBadge.textContent = tech.name.substring(0, 2);
            }
          }

          showcaseToolTitle.textContent = tech.name;
          if (showcaseCatTag) showcaseCatTag.textContent = tech.category;
          if (showcaseStatusPill) {
            showcaseStatusPill.textContent = tech.status;
            showcaseStatusPill.style.display = 'inline-block';

            if (tech.status === 'USING') {
              showcaseStatusPill.style.background = 'rgba(0, 230, 150, 0.15)';
              showcaseStatusPill.style.color = '#00e696';
              showcaseStatusPill.style.borderColor = 'rgba(0, 230, 150, 0.4)';
            } else {
              showcaseStatusPill.style.background = 'rgba(255, 77, 0, 0.15)';
              showcaseStatusPill.style.color = 'var(--accent-orange)';
              showcaseStatusPill.style.borderColor = 'rgba(255, 77, 0, 0.4)';
            }
          }
        }

        showcaseToolTitle.style.opacity = '1';
      }, 120);
    }

    // Populate LEFT Vertical Tool Directory
    const directoryCol = document.getElementById('toolkitDirectoryCol');
    const categoriesOrder = [
      "PROGRAMMING",
      "WEB DEVELOPMENT",
      "SYSTEMS & SECURITY",
      "AI & DEVELOPMENT",
      "CLOUD & INFRASTRUCTURE",
      "DATABASES & BACKEND",
      "DEVELOPMENT & VERSION CONTROL",
      "CREATIVE"
    ];

    if (directoryCol) {
      directoryCol.innerHTML = '';

      categoriesOrder.forEach(cat => {
        const catTechs = TECH_DATASET.filter(t => t.category === cat);
        if (catTechs.length === 0) return;

        const group = document.createElement('div');
        group.className = 'dir-category-group';

        const title = document.createElement('div');
        title.className = 'dir-category-title';
        title.textContent = cat;
        group.appendChild(title);

        const wrapper = document.createElement('div');
        wrapper.className = 'dir-tools-wrapper';

        catTechs.forEach(tech => {
          const pill = document.createElement('div');
          pill.className = 'directory-tool-pill';
          pill.setAttribute('data-tech-name', tech.name);

          const logoUrl = REAL_LOGOS[tech.name];
          const logoHtml = logoUrl
            ? `<img src="${logoUrl}" class="pill-logo-img" alt="${tech.name}" onerror="this.onerror=null; this.outerHTML='<span class=\\'pill-icon\\'>●</span>';">`
            : `<span class="pill-icon">●</span>`;

          pill.innerHTML = `${logoHtml}<span>${tech.name}</span>`;

          pill.addEventListener('mouseenter', () => {
            document.querySelectorAll('.directory-tool-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            highlightOrbitNode(tech.name);
            updateRightShowcase(tech);
          });

          pill.addEventListener('mouseleave', () => {
            pill.classList.remove('active');
            resetOrbitHighlight();
            updateRightShowcase(DEFAULT_SHOWCASE_STATE);
          });

          wrapper.appendChild(pill);
        });

        group.appendChild(wrapper);
        directoryCol.appendChild(group);
      });
    }

    // RIGHT-SIDE ORBITAL SYSTEM
    (function initOrbitalSystem() {
      const viewport = document.getElementById('orbitalShowcaseViewport');
      const nodesLayer = document.getElementById('orbitalNodesLayer');
      if (!viewport || !nodesLayer) return;

      const svgRingIds = ["orbitRing1", "orbitRing2", "orbitRing3", "orbitRing4"];
      const svgRingEls = svgRingIds.map(id => document.getElementById(id));

      const RINGS = [
        { rx: 92,  ry: 62,  speed:  0.00055, dir:  1 },
        { rx: 152, ry: 102, speed:  0.00042, dir: -1 },
        { rx: 206, ry: 138, speed:  0.00034, dir:  1 },
        { rx: 254, ry: 170, speed:  0.00026, dir: -1 },
      ];

      const ORBIT_TOOLS = [
        { name: "Linux",              ring: 0 },
        { name: "C",                  ring: 0 },
        { name: "Python",             ring: 0 },
        { name: "SQL",                ring: 0 },

        { name: "JavaScript",         ring: 1 },
        { name: "HTML",               ring: 1 },
        { name: "CSS",                ring: 1 },
        { name: "React",              ring: 1 },
        { name: "Node.js",            ring: 1 },
        { name: "Java",               ring: 1 },
        { name: "MySQL",              ring: 1 },
        { name: "Git",                ring: 1 },

        { name: "TypeScript",         ring: 2 },
        { name: "Next.js",            ring: 2 },
        { name: "ChatGPT",            ring: 2 },
        { name: "Google Gemini",      ring: 2 },
        { name: "PyTorch",            ring: 2 },
        { name: "Visual Studio Code", ring: 2 },
        { name: "MongoDB",            ring: 2 },
        { name: "Firebase",           ring: 2 },
        { name: "GitHub",             ring: 2 },

        { name: "Kali Linux",         ring: 3 },
        { name: "AWS",                ring: 3 },
        { name: "Google Cloud",       ring: 3 },
        { name: "Kubernetes",         ring: 3 },
        { name: "Cloudflare",         ring: 3 },
        { name: "Vercel",             ring: 3 },
        { name: "Supabase",           ring: 3 },
        { name: "SQLite",             ring: 3 },
        { name: "Canva",              ring: 3 },
        { name: "CapCut",             ring: 3 },
      ];

      nodesLayer.innerHTML = '';
      const fragment = document.createDocumentFragment();
      const nodeObjects = [];
      const ringCounts  = [0, 0, 0, 0];
      ORBIT_TOOLS.forEach(t => { ringCounts[t.ring]++; });
      const ringIdx = [0, 0, 0, 0];

      ORBIT_TOOLS.forEach(tool => {
        const r     = tool.ring;
        const idx   = ringIdx[r]++;
        const total = ringCounts[r];
        const angle = ((idx / total) * 2 * Math.PI) + (r * Math.PI * 0.45);

        const chip = document.createElement('div');
        chip.className = 'orbit-node-chip';
        chip.setAttribute('data-node-name', tool.name);

        const logo = REAL_LOGOS[tool.name];
        chip.innerHTML = logo
          ? `<img src="${logo}" class="node-logo-img" alt="${tool.name}" onerror="this.onerror=null; this.outerHTML='<span style=\\'font-size:14px;line-height:1\\'>●</span>';"><span>${tool.name}</span>`
          : `<span style="font-size:14px;line-height:1">&#9679;</span><span>${tool.name}</span>`;

        chip.addEventListener('mouseenter', () => {
          const techObj = TECH_DATASET.find(t => t.name === tool.name);
          if (techObj) updateRightShowcase(techObj);
        }, { passive: true });

        chip.addEventListener('mouseleave', () => {
          updateRightShowcase(DEFAULT_SHOWCASE_STATE);
        }, { passive: true });

        fragment.appendChild(chip);

        nodeObjects.push({
          el:          chip,
          name:        tool.name,
          ring:        r,
          angle:       angle,
          scale:       1,
          targetScale: 1,
          isActive:    false,
          lastZ:       0
        });
      });

      nodesLayer.appendChild(fragment);

      const TARGET_SCALE  = 1.35;
      const SCALE_EASE    = 0.16;
      const SCALE_EPSILON = 0.001;
      const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      let vw = viewport.clientWidth  || 540;
      let vh = viewport.clientHeight || 540;
      let scale = Math.min(vw / 540, vh / 540);
      let scaleX = scale;
      let scaleY = scale;
      let cx = vw / 2;
      let cy = vh / 2;

      function renderFrame(dt) {
        for (let i = 0; i < nodeObjects.length; i++) {
          const node = nodeObjects[i];
          const ring = RINGS[node.ring];

          if (dt > 0) {
            node.angle += ring.speed * ring.dir * dt;
          }

          const diff = node.targetScale - node.scale;
          if (Math.abs(diff) > SCALE_EPSILON) {
            node.scale += diff * SCALE_EASE;
          } else {
            node.scale = node.targetScale;
          }

          const px = ring.rx * Math.cos(node.angle) * scaleX;
          const py = ring.ry * Math.sin(node.angle) * scaleY;

          const newZ = node.isActive ? 90 : (py > 0 ? 25 : 5);
          if (node.lastZ !== newZ) {
            node.el.style.zIndex = newZ;
            node.lastZ = newZ;
          }

          node.el.style.transform =
            `translate3d(${(cx + px).toFixed(1)}px,${(cy + py).toFixed(1)}px,0) translate(-50%,-50%) scale(${node.scale.toFixed(3)})`;
        }
      }

      function updateDimensions() {
        vw = viewport.clientWidth  || 540;
        vh = viewport.clientHeight || 540;
        const s = Math.min(vw / 540, vh / 540);
        scaleX = s;
        scaleY = s;
        cx = vw / 2;
        cy = vh / 2;
        renderFrame(0);
      }
      updateDimensions();

      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
          updateDimensions();
        });
        ro.observe(viewport);
      }

      renderFrame(0);

      let lastTs = 0;
      let rafId = null;
      let isRunning = false;
      let sectionVisible = true;
      let docVisible = typeof document !== 'undefined' ? !document.hidden : true;

      function tick(ts) {
        if (!isRunning) return;

        if (!lastTs) lastTs = ts;
        const dt = Math.min(ts - lastTs, 32);
        lastTs = ts;

        renderFrame(dt);
        rafId = requestAnimationFrame(tick);
      }

      function startLoop() {
        if (isRunning || prefersReducedMotion) return;
        if (sectionVisible && docVisible) {
          isRunning = true;
          lastTs = 0;
          rafId = requestAnimationFrame(tick);
        }
      }

      function stopLoop() {
        if (!isRunning) return;
        isRunning = false;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        lastTs = 0;
      }

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => {
          sectionVisible = entries[0].isIntersecting;
          if (sectionVisible) {
            startLoop();
          } else {
            stopLoop();
          }
        }, { threshold: 0.02, rootMargin: '100px 0px 100px 0px' });
        io.observe(viewport);
      }

      document.addEventListener('visibilitychange', () => {
        docVisible = !document.hidden;
        if (docVisible && sectionVisible) {
          startLoop();
        } else {
          stopLoop();
        }
      }, { passive: true });

      startLoop();

      function _highlightNode(techName) {
        viewport.classList.add('is-active');
        let activeRing = -1;
        for (let i = 0; i < nodeObjects.length; i++) {
          const n = nodeObjects[i];
          const isActive = n.name === techName;
          n.isActive = isActive;
          n.el.classList.toggle('active', isActive);
          n.targetScale = isActive ? TARGET_SCALE : 1;
          if (isActive) activeRing = n.ring;
        }
        for (let i = 0; i < svgRingEls.length; i++) {
          const el = svgRingEls[i];
          if (el) el.classList.toggle('ring-active', i === activeRing);
        }
      }

      function _resetHighlight() {
        viewport.classList.remove('is-active');
        for (let i = 0; i < nodeObjects.length; i++) {
          const n = nodeObjects[i];
          n.isActive = false;
          n.el.classList.remove('active');
          n.targetScale = 1;
        }
        for (let i = 0; i < svgRingEls.length; i++) {
          const el = svgRingEls[i];
          if (el) el.classList.remove('ring-active');
        }
      }

      window._highlightOrbitNode  = _highlightNode;
      window._resetOrbitHighlight = _resetHighlight;
    })();

    function highlightOrbitNode(name) { if (window._highlightOrbitNode)  window._highlightOrbitNode(name); }
    function resetOrbitHighlight()    { if (window._resetOrbitHighlight) window._resetOrbitHighlight(); }
  });


  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 4: PROJECTS SECTION REVEAL & RADIAL SPOTLIGHTS
  // ═══════════════════════════════════════════════════════════════════════════
  safeExec('Projects Section Controller', function () {
    const cards = document.querySelectorAll('.proj-card');
    if (!cards.length) return;

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const card = entry.target;
          const idx  = parseInt(card.dataset.projIndex, 10) || 0;
          setTimeout(() => card.classList.add('revealed', 'in-view'), idx * 30);
          io.unobserve(card);
        });
      }, { rootMargin: '180px 0px 80px 0px', threshold: 0.01 });

      cards.forEach(c => io.observe(c));
    } else {
      cards.forEach(c => c.classList.add('revealed', 'in-view'));
    }

    if (matchMedia && matchMedia('(pointer: fine)').matches) {
      cards.forEach(card => {
        const spotlight = card.querySelector('.proj-card-spotlight');
        if (!spotlight) return;
        card.addEventListener('mousemove', (e) => {
          const r  = card.getBoundingClientRect();
          const mx = ((e.clientX - r.left) / r.width)  * 100;
          const my = ((e.clientY - r.top)  / r.height) * 100;
          spotlight.style.setProperty('--mx', mx + '%');
          spotlight.style.setProperty('--my', my + '%');
        }, { passive: true });
      });
    }

    const projectCards = document.querySelectorAll('.card-item');
    projectCards.forEach(card => {
      const img = card.querySelector('.card-img');
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const moveX = (x - centerX) * -0.015;
        const moveY = (y - centerY) * -0.015;

        if (img) img.style.transform = `scale(1.06) translate3d(${moveX}px, ${moveY}px, 0)`;
      });

      card.addEventListener('mouseleave', () => {
        if (img) img.style.transform = 'scale(1) translate3d(0, 0, 0)';
      });
    });
  });


  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 5: HERO PARALLAX & MAGNETIC CURSOR SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  safeExec('Hero Parallax & Cursor System', function () {
    const isFinePointer = matchMedia && matchMedia('(pointer: fine)').matches;

    if (isFinePointer) {
      // 1. Magnetic Buttons
      const magneticBtns = document.querySelectorAll('.btn-header, .about-cta-btn, .btn-orange, .btn-price, .scale-submit-pill');
      magneticBtns.forEach(function(btn) {
        let mx = 0, my = 0, magRafPending = false;
        btn.addEventListener('mousemove', function(e) {
          mx = e.clientX; my = e.clientY;
          if (!magRafPending) {
            magRafPending = true;
            requestAnimationFrame(function() {
              const rect = btn.getBoundingClientRect();
              const cx   = rect.left + rect.width  / 2;
              const cy   = rect.top  + rect.height / 2;
              const moveX = Math.max(-8, Math.min(8, (mx - cx) * 0.22));
              const moveY = Math.max(-8, Math.min(8, (my - cy) * 0.22));
              btn.style.transform = 'translate3d(' + moveX + 'px,' + moveY + 'px,0) scale(1.02)';
              magRafPending = false;
            });
          }
        }, { passive: true });
        btn.addEventListener('mouseleave', function() {
          btn.style.transform = 'translate3d(0,0,0) scale(1)';
        }, { passive: true });
      });

      // 2. Hero Mouse Parallax
      const heroSection = document.getElementById('home');
      const heroLeft = document.querySelector('.hero-left');
      const heroRight = document.querySelector('.hero-right');
      const heroGlowLeft = document.querySelector('.glow-hero-left');
      const heroGlowRight = document.querySelector('.glow-hero-right');

      if (heroSection) {
        let heroTargetX = 0, heroTargetY = 0;
        let heroCurX = 0, heroCurY = 0;
        let heroMoved = false;
        let heroInView = true;

        if ('IntersectionObserver' in window) {
          const heroIo = new IntersectionObserver((entries) => {
            heroInView = entries[0].isIntersecting;
            if (heroInView) scheduleHeroParallax();
          }, { threshold: 0.05 });
          heroIo.observe(heroSection);
        }

        heroSection.addEventListener('mousemove', (e) => {
          if (!heroInView) return;
          const rect = heroSection.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          heroTargetX = (e.clientX - centerX) / (rect.width / 2);
          heroTargetY = (e.clientY - centerY) / (rect.height / 2);
          heroMoved = true;
        }, { passive: true });

        heroSection.addEventListener('mouseleave', () => {
          heroTargetX = 0;
          heroTargetY = 0;
          heroMoved = true;
        }, { passive: true });

        let heroRafId = null;
        function animateHeroParallax() {
          heroRafId = null;
          if (!heroInView) return;
          if (!heroMoved &&
              Math.abs(heroTargetX - heroCurX) < 0.001 &&
              Math.abs(heroTargetY - heroCurY) < 0.001) return;

          heroMoved = false;
          heroCurX += (heroTargetX - heroCurX) * 0.06;
          heroCurY += (heroTargetY - heroCurY) * 0.06;

          if (heroLeft)      heroLeft.style.transform      = `translate3d(${heroCurX * 3}px, ${heroCurY * 3}px, 0)`;
          if (heroRight)     heroRight.style.transform     = `translate3d(${heroCurX * -2}px, ${heroCurY * 2}px, 0)`;
          if (heroGlowLeft)  heroGlowLeft.style.transform  = `translate3d(${heroCurX * 6}px, ${heroCurY * 6}px, 0)`;
          if (heroGlowRight) heroGlowRight.style.transform = `translate3d(${heroCurX * -6}px, ${heroCurY * 6}px, 0)`;

          heroRafId = requestAnimationFrame(animateHeroParallax);
        }

        function scheduleHeroParallax() {
          if (!heroRafId) heroRafId = requestAnimationFrame(animateHeroParallax);
        }
        heroSection.addEventListener('mousemove', () => scheduleHeroParallax(), { passive: true });
        scheduleHeroParallax();
      }

      // 3. Cinematic Orb Custom Cursor Tracker
      const cursorSys = document.getElementById('cinematicCursor');
      if (cursorSys) {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let curX = mouseX, curY = mouseY;
        let cursorVisible = false;
        let cursorRafId = null;

        window.addEventListener('mousemove', function(e) {
          mouseX = e.clientX;
          mouseY = e.clientY;
          if (!cursorVisible) {
            cursorVisible = true;
            cursorSys.style.opacity = '1';
          }
          if (!cursorRafId) cursorRafId = requestAnimationFrame(renderCursor);
        }, { passive: true });

        document.addEventListener('mouseleave', function() {
          cursorSys.style.opacity = '0';
          cursorVisible = false;
        }, { passive: true });

        window.addEventListener('mousedown', function() {
          cursorSys.classList.add('clicking');
        }, { passive: true });

        window.addEventListener('mouseup', function() {
          cursorSys.classList.remove('clicking');
        }, { passive: true });

        document.querySelectorAll('a, button, .card-item, .price-card, .cert-card-item, .highlight-item, .exploring-chip, .about-cta-btn, .btn-header').forEach(function(el) {
          el.addEventListener('mouseenter', function() { cursorSys.classList.add('hovering'); }, { passive: true });
          el.addEventListener('mouseleave', function() { cursorSys.classList.remove('hovering'); }, { passive: true });
        });

        const CURSOR_EASE = 0.22;
        const CURSOR_EPSILON = 0.15;
        function renderCursor() {
          cursorRafId = null;
          const dx = mouseX - curX;
          const dy = mouseY - curY;
          if (Math.abs(dx) > CURSOR_EPSILON || Math.abs(dy) > CURSOR_EPSILON) {
            curX += dx * CURSOR_EASE;
            curY += dy * CURSOR_EASE;
            cursorSys.style.transform = 'translate3d(' + curX.toFixed(2) + 'px,' + curY.toFixed(2) + 'px,0)';
            cursorRafId = requestAnimationFrame(renderCursor);
          } else {
            curX = mouseX;
            curY = mouseY;
            cursorSys.style.transform = 'translate3d(' + curX + 'px,' + curY + 'px,0)';
          }
        }
      }
    }
  });


  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 6: CERTIFICATES LIGHTBOX MODAL VIEWER
  // ═══════════════════════════════════════════════════════════════════════════
  window.openCertModal = function(imgSrc, caption) {
    const modal = document.getElementById('certModal');
    const modalImg = document.getElementById('certModalImg');
    const modalCaption = document.getElementById('certModalCaption');
    if (!modal || !modalImg) return;

    modalImg.src = imgSrc;
    if (modalCaption) modalCaption.textContent = caption || '';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  window.closeCertModal = function() {
    const modal = document.getElementById('certModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  safeExec('Certificates Lightbox Controller', function () {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        window.closeCertModal();
      }
    }, { passive: true });
  });


  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 6B: MOBILE CERTIFICATIONS CAROUSEL CONTROLLER (Mobile ONLY < 768px)
  // ═══════════════════════════════════════════════════════════════════════════
  safeExec('Mobile Certifications Carousel Controller', function () {
    const wrapper = document.querySelector('.cert-stack-wrapper');
    const stage = document.getElementById('certStackStage');
    if (!wrapper || !stage) return;

    const cards = Array.from(stage.querySelectorAll('.cert-fan-card'));
    if (!cards.length) return;

    // Symmetrical middle certificate index (for 10 cards: index 4, the 5th card)
    const middleIndex = Math.floor((cards.length - 1) / 2);
    let userHasInteracted = false;
    let scrollRaf = null;

    function isMobile() {
      return window.innerWidth < 768;
    }

    function getTargetScroll(targetCard) {
      if (!targetCard) return 0;
      const wrapperRect = wrapper.getBoundingClientRect();
      const cardRect = targetCard.getBoundingClientRect();
      if (wrapperRect.width > 0 && cardRect.width > 0) {
        const cardCenter = cardRect.left + cardRect.width / 2;
        const wrapperCenter = wrapperRect.left + wrapperRect.width / 2;
        return Math.max(0, wrapper.scrollLeft + (cardCenter - wrapperCenter));
      }
      return Math.max(0, targetCard.offsetLeft - (wrapper.clientWidth - targetCard.clientWidth) / 2);
    }

    function updateActiveCard() {
      if (!isMobile()) return;
      const wrapperRect = wrapper.getBoundingClientRect();
      const wrapperCenter = wrapperRect.left + wrapperRect.width / 2;

      let closestIndex = -1;
      let minDistance = Infinity;

      for (let i = 0; i < cards.length; i++) {
        const cardRect = cards[i].getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const dist = Math.abs(cardCenter - wrapperCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = i;
        }
      }

      for (let i = 0; i < cards.length; i++) {
        if (i === closestIndex) {
          cards[i].classList.add('is-centered');
        } else {
          cards[i].classList.remove('is-centered');
        }
      }
    }

    function centerMiddleCard(force) {
      if (!isMobile()) return;
      if (userHasInteracted && !force) return;

      const targetCard = cards[middleIndex];
      if (!targetCard) return;

      const targetScroll = getTargetScroll(targetCard);
      wrapper.scrollLeft = Math.round(targetScroll);
      updateActiveCard();
    }

    function markUserInteracted() {
      if (!isMobile()) return;
      userHasInteracted = true;
    }

    wrapper.addEventListener('touchstart', markUserInteracted, { passive: true });
    wrapper.addEventListener('pointerdown', function (e) {
      if (!isMobile()) return;
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        userHasInteracted = true;
      }
    }, { passive: true });

    wrapper.addEventListener('scroll', function () {
      if (!isMobile()) return;
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(updateActiveCard);
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      const certSection = document.getElementById('certifications');
      if (certSection) {
        const observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !userHasInteracted && isMobile()) {
              centerMiddleCard(false);
            }
          });
        }, { threshold: 0.05, rootMargin: '100px 0px' });
        observer.observe(certSection);
      }
    }

    if (isMobile()) {
      centerMiddleCard(false);
      requestAnimationFrame(function () {
        centerMiddleCard(false);
      });
      setTimeout(function () {
        centerMiddleCard(false);
      }, 100);
      setTimeout(function () {
        centerMiddleCard(false);
      }, 350);
    }

    window.addEventListener('load', function () {
      if (isMobile() && !userHasInteracted) {
        centerMiddleCard(false);
      }
    });

    let resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (isMobile()) {
          if (!userHasInteracted) {
            centerMiddleCard(false);
          } else {
            updateActiveCard();
          }
        } else {
          cards.forEach(function (c) {
            c.classList.remove('is-centered');
          });
        }
      }, 150);
    });
  });


  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 7: LORVEN GLOW & NAVBAR CTA
  // ═══════════════════════════════════════════════════════════════════════════
  safeExec('Lorven Glow & Navbar CTA', function () {
    const box  = document.getElementById('lorvenBox');
    const glow = document.getElementById('lorvenCursorGlow');
    if (box && glow) {
      let rafPending = false, mx = 0, my = 0;
      box.addEventListener('mousemove', function(e) {
        mx = e.clientX; my = e.clientY;
        if (!rafPending) {
          rafPending = true;
          requestAnimationFrame(function() {
            const rect = box.getBoundingClientRect();
            const x = mx - rect.left;
            const y = my - rect.top;
            glow.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%)';
            rafPending = false;
          });
        }
      }, { passive: true });
    }

    const btn = document.getElementById('navCtaBtn');
    if (btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const tgt = document.getElementById('contact');
        if (tgt) tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  });


  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 8: MOBILE NAVIGATION HAMBURGER DRAWER
  // ═══════════════════════════════════════════════════════════════════════════
  safeExec('Mobile Navigation Controller', function () {
    const hamburger = document.getElementById('navHamburger');
    const overlay   = document.getElementById('mobileNavOverlay');
    const closeBtn  = document.getElementById('mobileNavClose');
    if (!hamburger || !overlay) return;

    function openMenu() {
      overlay.classList.add('open');
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
      overlay.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', function() {
      overlay.classList.contains('open') ? closeMenu() : openMenu();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    overlay.querySelectorAll('[data-mobile-nav]').forEach(function(link) {
      link.addEventListener('click', function(e) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          closeMenu();
          const target = document.querySelector(href);
          if (target) {
            setTimeout(function() {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 120);
          }
        }
      });
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeMenu();
    }, { passive: true });
  });


  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 9: CONTACT FORM (ISOLATED EMAILJS CLIENT WITH FALLBACK)
  // ═══════════════════════════════════════════════════════════════════════════
  safeExec('Contact Form Controller', function () {
    const EJS_PUBLIC_KEY      = 'ni0IqrRGioOb5jfTh';
    const EJS_SERVICE_ID      = 'service_q51cstr';
    const EJS_TEMPLATE_ID     = 'template_qcy1y3b';
    const EJS_AUTOREPLY_ID    = 'template_10tkb1a';
    const TO_EMAIL            = 'vardhanbillakanti125@gmail.com';

    function ensureEmailJSInit() {
      if (typeof emailjs !== 'undefined' && emailjs.init) {
        try {
          emailjs.init({ publicKey: EJS_PUBLIC_KEY });
        } catch (e) {
          console.warn('[ContactForm] emailjs.init warning:', e);
        }
      }
    }
    ensureEmailJSInit();

    const form   = document.getElementById('contactForm');
    const btn    = document.getElementById('contactSubmitBtn');
    const notice = document.getElementById('contactFormNotice');
    if (!form) return;

    function isValidEmail(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    }
    function isValidPhone(v) {
      if (!v.trim()) return true;
      return /^[\+]?[\d\s\-\(\)]{7,15}$/.test(v.trim());
    }

    function setNotice(msg, state) {
      if (!notice) return;
      notice.textContent = msg;
      notice.className   = 'contact-form-notice' + (state ? ' ' + state : '');
    }

    function setLoading(on) {
      if (!btn) return;
      if (on) {
        btn.classList.add('is-loading');
        btn.disabled = true;
      } else {
        btn.classList.remove('is-loading');
        btn.disabled = false;
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setNotice('', '');

      const nameEl    = form.querySelector('#cf-name');
      const emailEl   = form.querySelector('#cf-email');
      const phoneEl   = form.querySelector('#cf-phone');
      const subjectEl = form.querySelector('#cf-subject');
      const messageEl = form.querySelector('#cf-message');

      [nameEl, emailEl, phoneEl, messageEl].forEach(function (el) {
        if (el) el.classList.remove('invalid');
      });

      let valid = true;
      if (!nameEl    || !nameEl.value.trim())        { if (nameEl)    nameEl.classList.add('invalid');    valid = false; }
      if (!emailEl   || !isValidEmail(emailEl.value)){ if (emailEl)   emailEl.classList.add('invalid');   valid = false; }
      if (phoneEl    && !isValidPhone(phoneEl.value)) {                phoneEl.classList.add('invalid');   valid = false; }
      if (!messageEl || !messageEl.value.trim())     { if (messageEl) messageEl.classList.add('invalid'); valid = false; }

      if (!valid) {
        setNotice('Please fill in all required fields correctly.', 'state-error');
        return;
      }

      if (typeof emailjs === 'undefined') {
        setNotice('Email service unavailable. Please email me directly at ' + TO_EMAIL, 'state-error');
        console.warn('[ContactForm] EmailJS SDK is not defined on window.');
        return;
      }

      ensureEmailJSInit();
      setLoading(true);
      setNotice('Sending\u2026', '');

      const rawName    = nameEl.value.trim();
      const rawEmail   = emailEl.value.trim();
      const rawPhone   = (phoneEl && phoneEl.value.trim()) ? phoneEl.value.trim() : 'Not provided';
      const rawSubject = (subjectEl && subjectEl.value.trim()) ? subjectEl.value.trim() : 'Portfolio Contact';
      const rawMessage = messageEl.value.trim();

      const params = {
        name:       rawName,
        from_name:  rawName,
        user_name:  rawName,
        email:      rawEmail,
        from_email: rawEmail,
        user_email: rawEmail,
        reply_to:   rawEmail,
        phone:      rawPhone,
        user_phone: rawPhone,
        title:      rawSubject,
        subject:    rawSubject,
        message:    rawMessage
      };

      emailjs.send(EJS_SERVICE_ID, EJS_TEMPLATE_ID, params, EJS_PUBLIC_KEY)
        .then(function (response) {
          const autoReplyParams = {
            name:       rawName,
            from_name:  rawName,
            user_name:  rawName,
            email:      rawEmail,
            user_email: rawEmail,
            to_email:   rawEmail,
            reply_to:   rawEmail
          };

          emailjs.send(EJS_SERVICE_ID, EJS_AUTOREPLY_ID, autoReplyParams, EJS_PUBLIC_KEY)
            .catch(function (autoReplyErr) {
              console.warn('[ContactForm] Auto-reply send error (non-critical):', autoReplyErr);
            });

          setLoading(false);
          setNotice('\u2713 Message sent! I\'ll get back to you soon.', 'state-success');
          form.reset();
          setTimeout(function () { setNotice('', ''); }, 8000);
        })
        .catch(function (err) {
          setLoading(false);
          setNotice('Send failed. Please retry or email me directly at ' + TO_EMAIL, 'state-error');
          console.error('[ContactForm] EmailJS send error:', err);
        });
    });
  });


  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 10: INITIAL HASH NAVIGATION HANDLER
  // ═══════════════════════════════════════════════════════════════════════════
  safeExec('Initial Hash Navigation', function () {
    if (window.location.hash) {
      const hash = window.location.hash;
      const targetEl = document.querySelector(hash);
      if (targetEl) {
        targetEl.querySelectorAll('.proj-card, .scroll-reveal, .about-reveal, .heading-reveal').forEach(el => {
          el.classList.add('in-view', 'revealed');
        });
        setTimeout(() => {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    }
  });

})();