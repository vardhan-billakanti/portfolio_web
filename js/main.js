(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. CANVAS FRAME SCROLL ANIMATION & PRELOADER (High Performance)
  // ═══════════════════════════════════════════════════════════════════════════
  const TOTAL_FRAMES = 145;
  const canvas = document.getElementById('animationCanvas');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) || canvas.getContext('2d') : null;
  const preloader = document.getElementById('preloader');
  const mobilePortraitEl = document.getElementById('mobilePortraitImg');

  const images = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let targetFrame = 0;
  let currentFrame = 0;
  let isLoaded = false;
  let lastDrawnFrame = -1;
  let renderLoopRunning = false;
  let isMobileScreen = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;

  function getFrameFilename(index) {
    const paddedIndex = String(index).padStart(3, '0');
    return `frames/ezgif-frame-${paddedIndex}.jpg`;
  }

  // Preload frames progressively without clogging initial bandwidth
  function initFrameLoader() {
    let preloaderDismissed = false;

    function dismissPreloader() {
      if (preloaderDismissed) return;
      preloaderDismissed = true;
      if (preloader) {
        preloader.classList.add('hidden');
        setTimeout(() => {
          preloader.style.display = 'none';
        }, 500);
      }
    }

    function onImageLoaded(idx) {
      loadedCount++;
      if (idx === 0) {
        // First frame ready: draw immediately to prevent initial blank flash
        isLoaded = true;
        if (canvas && ctx) {
          resizeCanvas();
          drawFrame(0);
        }
        if (mobilePortraitEl && images[0]) {
          mobilePortraitEl.src = images[0].src;
        }
      }

      // Dismiss preloader once initial batch is ready (or all loaded)
      if (loadedCount >= Math.min(10, TOTAL_FRAMES)) {
        dismissPreloader();
      }

      if (loadedCount === TOTAL_FRAMES) {
        isLoaded = true;
        dismissPreloader();
        updateTargetFrame();
        triggerRenderLoop();
      }
    }

    // Load Frame 1 immediately
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => onImageLoaded(i);
      img.onerror = () => onImageLoaded(i);
      img.src = getFrameFilename(i + 1);
      images[i] = img;
    }
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR at 2 for performance
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
  }

  function updateTargetFrame() {
    const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return;
    const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScroll));
    targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
  }

  function drawFrame(frameIdx) {
    if (!canvas || !ctx || images.length === 0) return;
    const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameIdx)));
    const img = images[clampedIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;

    // Aspect ratio contain logic
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

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
  }

  // Smooth lerp render loop — auto sleeps when idle to preserve 0% GPU/CPU
  function renderLoop() {
    const diff = targetFrame - currentFrame;

    if (Math.abs(diff) > 0.001) {
      currentFrame += diff * 0.12;
    } else {
      currentFrame = targetFrame;
    }

    const rounded = Math.round(currentFrame);
    if (rounded !== lastDrawnFrame) {
      lastDrawnFrame = rounded;
      drawFrame(currentFrame);
    }

    if (Math.abs(targetFrame - currentFrame) > 0.001) {
      requestAnimationFrame(renderLoop);
    } else {
      renderLoopRunning = false;
    }
  }

  function triggerRenderLoop() {
    if (!renderLoopRunning && isLoaded && !isMobileScreen) {
      renderLoopRunning = true;
      requestAnimationFrame(renderLoop);
    }
  }

  // Mobile portrait image update
  let mobileLastFrame = -1;
  function updateMobilePortrait() {
    if (!mobilePortraitEl || images.length === 0) return;
    const frameIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(targetFrame)));
    if (frameIdx === mobileLastFrame) return;
    const img = images[frameIdx];
    if (img && img.complete && img.naturalWidth > 0 && img.src) {
      mobilePortraitEl.src = img.src;
      mobileLastFrame = frameIdx;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. UNIFIED SCROLL & RESIZE CONTROLLERS (Passive, RAF-Coordinated)
  // ═══════════════════════════════════════════════════════════════════════════
  const navHeader = document.querySelector('header.nav-header');
  let isScrolled = false;
  let scrollRafPending = false;

  function handleScrollTick() {
    scrollRafPending = false;
    updateTargetFrame();

    // Toggle header scrolled state efficiently
    const shouldBeScrolled = window.scrollY > 30;
    if (navHeader && shouldBeScrolled !== isScrolled) {
      isScrolled = shouldBeScrolled;
      navHeader.classList.toggle('scrolled', isScrolled);
    }

    // Trigger canvas render or mobile portrait frame update
    if (isMobileScreen) {
      updateMobilePortrait();
    } else {
      triggerRenderLoop();
    }
  }

  window.addEventListener('scroll', () => {
    if (!scrollRafPending) {
      scrollRafPending = true;
      requestAnimationFrame(handleScrollTick);
    }
  }, { passive: true });

  // Debounced resize listener
  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      isMobileScreen = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
      if (!isMobileScreen) {
        resizeCanvas();
        drawFrame(currentFrame);
      }
    }, 100);
  }, { passive: true });

  initFrameLoader();
  handleScrollTick();

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. INTERSECTION OBSERVER REVEALS (Runs once per element)
  // ═══════════════════════════════════════════════════════════════════════════
  const revealElements = document.querySelectorAll(
    '.about-reveal, .beyond-reveal, .scroll-reveal, .heading-reveal, .academic-milestone-item, .founder-card, .cert-main-title, .scale-talk-card, .price-card, .highlight-item, .contact-info-card, .contact-form-panel, .lorven-box'
  );

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    revealElements.forEach(el => {
      el.classList.add('scroll-reveal');
      revealObserver.observe(el);
    });
  } else {
    revealElements.forEach(el => el.classList.add('in-view'));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. INTERACTIVE TOOLKIT DATASET & SHOWCASE
  // ═══════════════════════════════════════════════════════════════════════════
  const REAL_LOGOS = {
    "C":                 "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg",
    "Java":              "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
    "Python":            "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
    "TypeScript":        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
    "HTML":              "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
    "CSS":               "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
    "JavaScript":        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
    "React":             "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    "Node.js":           "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-plain.svg",
    "Express.js":        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg",
    "Next.js":           "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
    "Tailwind CSS":      "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg",
    "Visual Studio Code":"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg",
    "Antigravity":       "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='15' fill='%23111' stroke='%23ff4d00' stroke-width='1.5'/%3E%3Ctext x='16' y='21' text-anchor='middle' font-family='Outfit,sans-serif' font-weight='800' font-size='11' fill='%23ff4d00'%3EAG%3C/text%3E%3C/svg%3E",
    "Git":               "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
    "GitHub":            "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
    "Postman":           "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postman/postman-original.svg",
    "Vercel":            "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vercel/vercel-original.svg",
    "Kali Linux":        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
    "Linux":             "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
    "Wireshark":         "https://cdn.simpleicons.org/wireshark/1679A3",
    "Burp Suite":        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='15' fill='%23FF6633'/%3E%3Ctext x='16' y='21' text-anchor='middle' font-family='Arial,sans-serif' font-weight='900' font-size='9' fill='%23fff'%3EBurp%3C/text%3E%3C/svg%3E",
    "Nmap":              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='15' fill='%230E1A2B' stroke='%234a90d9' stroke-width='1.5'/%3E%3Ctext x='16' y='21' text-anchor='middle' font-family='Arial,sans-serif' font-weight='700' font-size='9' fill='%234a90d9'%3ENmap%3C/text%3E%3C/svg%3E",
    "Metasploit":        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='15' fill='%231a1a2e' stroke='%23e94560' stroke-width='1.5'/%3E%3Ctext x='16' y='21' text-anchor='middle' font-family='Arial,sans-serif' font-weight='700' font-size='7.5' fill='%23e94560'%3EMETA%3C/text%3E%3C/svg%3E",
    "OWASP":             "https://cdn.simpleicons.org/owasp/000000",
    "Bash":              "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg",
    "ChatGPT":           "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    "Google Gemini":     "https://cdn.simpleicons.org/googlegemini/4285F4",
    "Claude":            "https://cdn.simpleicons.org/anthropic/D4A27F",
    "NumPy":             "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/numpy/numpy-original.svg",
    "Pandas":            "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg",
    "Jupyter":           "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jupyter/jupyter-original.svg",
    "PyTorch":           "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg",
    "TensorFlow":        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg",
    "MySQL":             "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
    "PostgreSQL":        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
    "MongoDB":           "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg",
    "Firebase":          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg",
    "AWS":               "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg",
    "Microsoft Azure":   "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg",
    "Google Cloud":      "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg",
    "Docker":            "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
    "Kubernetes":        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg",
    "Canva":             "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/canva/canva-original.svg",
    "CapCut":            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23000'/%3E%3Cpath d='M10 10h5v12h-5zM17 10h5v12h-5z' fill='%23fff'/%3E%3C/svg%3E"
  };

  const TECH_DATASET = [
    { name: "C", category: "PROGRAMMING", status: "EXPLORING" },
    { name: "Java", category: "PROGRAMMING", status: "EXPLORING" },
    { name: "Python", category: "PROGRAMMING", status: "EXPLORING" },
    { name: "TypeScript", category: "PROGRAMMING", status: "EXPLORING" },
    { name: "HTML", category: "WEB DEVELOPMENT", status: "USING" },
    { name: "CSS", category: "WEB DEVELOPMENT", status: "USING" },
    { name: "JavaScript", category: "WEB DEVELOPMENT", status: "USING" },
    { name: "React", category: "WEB DEVELOPMENT", status: "EXPLORING" },
    { name: "Node.js", category: "WEB DEVELOPMENT", status: "EXPLORING" },
    { name: "Express.js", category: "WEB DEVELOPMENT", status: "EXPLORING" },
    { name: "Next.js", category: "WEB DEVELOPMENT", status: "EXPLORING" },
    { name: "Tailwind CSS", category: "WEB DEVELOPMENT", status: "EXPLORING" },
    { name: "Kali Linux", category: "CYBER SECURITY", status: "EXPLORING" },
    { name: "Linux", category: "CYBER SECURITY", status: "USING" },
    { name: "Wireshark", category: "CYBER SECURITY", status: "EXPLORING" },
    { name: "Burp Suite", category: "CYBER SECURITY", status: "EXPLORING" },
    { name: "Nmap", category: "CYBER SECURITY", status: "EXPLORING" },
    { name: "Metasploit", category: "CYBER SECURITY", status: "EXPLORING" },
    { name: "OWASP", category: "CYBER SECURITY", status: "EXPLORING" },
    { name: "Bash", category: "CYBER SECURITY", status: "USING" },
    { name: "ChatGPT", category: "AI & DATA", status: "USING" },
    { name: "Google Gemini", category: "AI & DATA", status: "USING" },
    { name: "Claude", category: "AI & DATA", status: "USING" },
    { name: "NumPy", category: "AI & DATA", status: "EXPLORING" },
    { name: "Pandas", category: "AI & DATA", status: "EXPLORING" },
    { name: "Jupyter", category: "AI & DATA", status: "EXPLORING" },
    { name: "PyTorch", category: "AI & DATA", status: "EXPLORING" },
    { name: "TensorFlow", category: "AI & DATA", status: "EXPLORING" },
    { name: "AWS", category: "CLOUD & DEVOPS", status: "EXPLORING" },
    { name: "Microsoft Azure", category: "CLOUD & DEVOPS", status: "EXPLORING" },
    { name: "Google Cloud", category: "CLOUD & DEVOPS", status: "EXPLORING" },
    { name: "Docker", category: "CLOUD & DEVOPS", status: "EXPLORING" },
    { name: "Kubernetes", category: "CLOUD & DEVOPS", status: "EXPLORING" },
    { name: "MySQL", category: "DATABASES", status: "EXPLORING" },
    { name: "PostgreSQL", category: "DATABASES", status: "EXPLORING" },
    { name: "MongoDB", category: "DATABASES", status: "EXPLORING" },
    { name: "Firebase", category: "DATABASES", status: "EXPLORING" },
    { name: "Visual Studio Code", category: "DEVELOPMENT TOOLS", status: "USING" },
    { name: "Antigravity", category: "DEVELOPMENT TOOLS", status: "USING" },
    { name: "Git", category: "DEVELOPMENT TOOLS", status: "USING" },
    { name: "GitHub", category: "DEVELOPMENT TOOLS", status: "USING" },
    { name: "Postman", category: "DEVELOPMENT TOOLS", status: "EXPLORING" },
    { name: "Vercel", category: "DEVELOPMENT TOOLS", status: "EXPLORING" },
    { name: "Canva", category: "DESIGN & PRODUCTIVITY", status: "USING" },
    { name: "CapCut", category: "DESIGN & PRODUCTIVITY", status: "USING" }
  ];

  const techCounterPill = document.getElementById('techCounter');
  if (techCounterPill) {
    techCounterPill.textContent = `${TECH_DATASET.length} TOOLS AVAILABLE`;
  }

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

  let updateShowcaseTimer = null;
  function updateRightShowcase(tech) {
    if (!showcaseToolTitle) return;
    clearTimeout(updateShowcaseTimer);
    showcaseToolTitle.style.opacity = '0';

    updateShowcaseTimer = setTimeout(() => {
      if (!tech || tech.title === 'TECH CORE') {
        showcaseIconBadge.innerHTML = DEFAULT_SHOWCASE_STATE.symbol;
        showcaseToolTitle.textContent = DEFAULT_SHOWCASE_STATE.title;
        showcaseCatTag.textContent = DEFAULT_SHOWCASE_STATE.cat;
        showcaseStatusPill.style.display = 'none';
      } else {
        const logoUrl = REAL_LOGOS[tech.name];
        if (logoUrl) {
          showcaseIconBadge.innerHTML = `<img src="${logoUrl}" alt="${tech.name}" loading="lazy" decoding="async">`;
        } else {
          showcaseIconBadge.textContent = tech.name.substring(0, 2);
        }

        showcaseToolTitle.textContent = tech.name;
        showcaseCatTag.textContent = tech.category;
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
      showcaseToolTitle.style.opacity = '1';
    }, 100);
  }

  // Populate Toolkit Directory
  const directoryCol = document.getElementById('toolkitDirectoryCol');
  const categoriesOrder = [
    "PROGRAMMING", "WEB DEVELOPMENT", "CYBER SECURITY", "AI & DATA",
    "CLOUD & DEVOPS", "DATABASES", "DEVELOPMENT TOOLS", "DESIGN & PRODUCTIVITY"
  ];

  if (directoryCol) {
    const fragment = document.createDocumentFragment();

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
          ? `<img src="${logoUrl}" class="pill-logo-img" alt="${tech.name}" loading="lazy" decoding="async">`
          : `<span class="pill-icon">●</span>`;

        pill.innerHTML = `${logoHtml}<span>${tech.name}</span>`;

        pill.addEventListener('mouseenter', () => {
          document.querySelectorAll('.directory-tool-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          if (window._highlightOrbitNode) window._highlightOrbitNode(tech.name);
          updateRightShowcase(tech);
        });

        pill.addEventListener('mouseleave', () => {
          pill.classList.remove('active');
          if (window._resetOrbitHighlight) window._resetOrbitHighlight();
          updateRightShowcase(DEFAULT_SHOWCASE_STATE);
        });

        wrapper.appendChild(pill);
      });

      group.appendChild(wrapper);
      fragment.appendChild(group);
    });

    directoryCol.innerHTML = '';
    directoryCol.appendChild(fragment);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. ORBITAL SYSTEM (Pauses when off-screen for 0% idle CPU)
  // ═══════════════════════════════════════════════════════════════════════════
  (function initOrbitalSystem() {
    const viewport = document.getElementById('orbitalShowcaseViewport');
    const nodesLayer = document.getElementById('orbitalNodesLayer');
    const svgRings = ["orbitRing1", "orbitRing2", "orbitRing3", "orbitRing4"];
    if (!viewport || !nodesLayer) return;

    const RINGS = [
      { rx: 92,  ry: 62,  speed: 0.00062, dir:  1 },
      { rx: 152, ry: 102, speed: 0.00046, dir: -1 },
      { rx: 206, ry: 138, speed: 0.00037, dir:  1 },
      { rx: 254, ry: 170, speed: 0.00029, dir: -1 },
    ];

    const ORBIT_TOOLS = [
      { name: "Linux",             ring: 0 },
      { name: "C",                 ring: 0 },
      { name: "Python",            ring: 0 },
      { name: "MySQL",             ring: 0 },
      { name: "Node.js",           ring: 1 },
      { name: "JavaScript",        ring: 1 },
      { name: "ChatGPT",           ring: 1 },
      { name: "PostgreSQL",        ring: 1 },
      { name: "Visual Studio Code",ring: 1 },
      { name: "GitHub",            ring: 1 },
      { name: "React",             ring: 2 },
      { name: "Next.js",           ring: 2 },
      { name: "Tailwind CSS",      ring: 2 },
      { name: "Google Gemini",     ring: 2 },
      { name: "PyTorch",           ring: 2 },
      { name: "Postman",           ring: 2 },
      { name: "Kali Linux",        ring: 2 },
      { name: "TypeScript",        ring: 2 },
      { name: "AWS",               ring: 3 },
      { name: "Kubernetes",        ring: 3 },
      { name: "Google Cloud",      ring: 3 },
      { name: "Wireshark",         ring: 3 },
      { name: "Nmap",              ring: 3 },
      { name: "Metasploit",        ring: 3 },
      { name: "OWASP",             ring: 3 },
      { name: "Bash",              ring: 3 },
      { name: "Burp Suite",        ring: 3 },
    ];

    const nodeObjects = [];
    const ringCounts = [0, 0, 0, 0];
    ORBIT_TOOLS.forEach(t => { ringCounts[t.ring]++; });
    const ringIdx = [0, 0, 0, 0];

    const nodesFragment = document.createDocumentFragment();

    ORBIT_TOOLS.forEach(tool => {
      const r = tool.ring;
      const idx = ringIdx[r]++;
      const total = ringCounts[r];
      const angle = ((idx / total) * 2 * Math.PI) + (r * Math.PI * 0.45);

      const chip = document.createElement('div');
      chip.className = 'orbit-node-chip';
      chip.setAttribute('data-node-name', tool.name);

      const logo = REAL_LOGOS[tool.name];
      chip.innerHTML = logo
        ? `<img src="${logo}" class="node-logo-img" alt="${tool.name}" loading="lazy" decoding="async"><span>${tool.name}</span>`
        : `<span style="font-size:14px;line-height:1">&#9679;</span><span>${tool.name}</span>`;

      nodesFragment.appendChild(chip);

      nodeObjects.push({
        el: chip,
        name: tool.name,
        ring: r,
        angle: angle,
        scale: 1,
        targetScale: 1,
      });
    });

    nodesLayer.innerHTML = '';
    nodesLayer.appendChild(nodesFragment);

    let vw = viewport.clientWidth || 540;
    let vh = viewport.clientHeight || 540;
    let scaleX = vw / 540;
    let scaleY = vh / 540;
    let cx = vw / 2;
    let cy = vh / 2;

    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(() => {
        vw = viewport.clientWidth || 540;
        vh = viewport.clientHeight || 540;
        scaleX = vw / 540;
        scaleY = vh / 540;
        cx = vw / 2;
        cy = vh / 2;
      });
      ro.observe(viewport);
    }

    const TARGET_SCALE = 1.42;
    const SCALE_EASE = 0.13;
    const SCALE_EPSILON = 0.0003;

    let lastTs = 0;
    let rafId = null;
    let sectionVisible = false;

    function tick(ts) {
      if (!sectionVisible) {
        rafId = null;
        return; // Halt loop completely when off-screen
      }

      const dt = Math.min(ts - (lastTs || ts), 40);
      lastTs = ts;

      nodeObjects.forEach(node => {
        const ring = RINGS[node.ring];
        node.angle += ring.speed * ring.dir * dt;

        const diff = node.targetScale - node.scale;
        if (Math.abs(diff) > SCALE_EPSILON) {
          node.scale += diff * SCALE_EASE;
        } else {
          node.scale = node.targetScale;
        }

        const px = ring.rx * Math.cos(node.angle) * scaleX;
        const py = ring.ry * Math.sin(node.angle) * scaleY;

        node.el.style.transform =
          `translate3d(${cx + px}px,${cy + py}px,0) translate(-50%,-50%) scale(${node.scale.toFixed(4)})`;
      });

      rafId = requestAnimationFrame(tick);
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        sectionVisible = entries[0].isIntersecting;
        if (sectionVisible && !rafId) {
          lastTs = performance.now();
          rafId = requestAnimationFrame(tick);
        } else if (!sectionVisible && rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }, { threshold: 0.05 });
      io.observe(viewport);
    } else {
      sectionVisible = true;
      rafId = requestAnimationFrame(tick);
    }

    window._highlightOrbitNode = function (techName) {
      viewport.classList.add('is-active');
      let activeRing = -1;
      nodeObjects.forEach(n => {
        const isActive = n.name === techName;
        n.el.classList.toggle('active', isActive);
        n.targetScale = isActive ? TARGET_SCALE : 1;
        if (isActive) activeRing = n.ring;
      });
      svgRings.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('ring-active', i === activeRing);
      });
    };

    window._resetOrbitHighlight = function () {
      viewport.classList.remove('is-active');
      nodeObjects.forEach(n => {
        n.el.classList.remove('active');
        n.targetScale = 1;
      });
      svgRings.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('ring-active');
      });
    };
  })();

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. MAGNETIC BUTTONS (Desktop Fine Pointer Only)
  // ═══════════════════════════════════════════════════════════════════════════
  if (window.matchMedia('(pointer: fine)').matches) {
    const magneticBtns = document.querySelectorAll('.btn-header, .about-cta-btn, .btn-orange, .btn-price, .scale-submit-pill');
    magneticBtns.forEach(btn => {
      let mx = 0, my = 0, magPending = false;

      btn.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
        if (!magPending) {
          magPending = true;
          requestAnimationFrame(() => {
            const rect = btn.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const moveX = Math.max(-8, Math.min(8, (mx - cx) * 0.22));
            const moveY = Math.max(-8, Math.min(8, (my - cy) * 0.22));
            btn.style.transform = `translate3d(${moveX}px,${moveY}px,0) scale(1.02)`;
            magPending = false;
          });
        }
      }, { passive: true });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate3d(0,0,0) scale(1)';
      }, { passive: true });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. HERO MOUSE PARALLAX (Desktop Only, Pauses Off-Screen)
  // ═══════════════════════════════════════════════════════════════════════════
  const heroSection = document.getElementById('home');
  const heroLeft = document.querySelector('.hero-left');
  const heroRight = document.querySelector('.hero-right');
  const heroGlowLeft = document.querySelector('.glow-hero-left');
  const heroGlowRight = document.querySelector('.glow-hero-right');

  if (heroSection && window.matchMedia('(pointer: fine)').matches) {
    let heroTargetX = 0, heroTargetY = 0;
    let heroCurX = 0, heroCurY = 0;
    let heroMoved = false;
    let heroInView = true;
    let heroRafId = null;

    if ('IntersectionObserver' in window) {
      const heroIo = new IntersectionObserver(entries => {
        heroInView = entries[0].isIntersecting;
        if (heroInView) scheduleHeroParallax();
      }, { threshold: 0.05 });
      heroIo.observe(heroSection);
    }

    function animateHeroParallax() {
      heroRafId = null;
      if (!heroInView) return;
      if (!heroMoved && Math.abs(heroTargetX - heroCurX) < 0.001 && Math.abs(heroTargetY - heroCurY) < 0.001) {
        return; // Idle
      }

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

    heroSection.addEventListener('mousemove', e => {
      if (!heroInView) return;
      const rect = heroSection.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      heroTargetX = (e.clientX - centerX) / (rect.width / 2);
      heroTargetY = (e.clientY - centerY) / (rect.height / 2);
      heroMoved = true;
      scheduleHeroParallax();
    }, { passive: true });

    heroSection.addEventListener('mouseleave', () => {
      heroTargetX = 0;
      heroTargetY = 0;
      heroMoved = true;
      scheduleHeroParallax();
    }, { passive: true });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. PROJECT CARDS SPOTLIGHT (Event-throttled)
  // ═══════════════════════════════════════════════════════════════════════════
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.proj-card').forEach(card => {
      const spotlight = card.querySelector('.proj-card-spotlight');
      if (!spotlight) return;
      let spotPending = false;
      card.addEventListener('mousemove', e => {
        if (!spotPending) {
          spotPending = true;
          requestAnimationFrame(() => {
            const r = card.getBoundingClientRect();
            const mx = ((e.clientX - r.left) / r.width) * 100;
            const my = ((e.clientY - r.top) / r.height) * 100;
            spotlight.style.setProperty('--mx', `${mx.toFixed(1)}%`);
            spotlight.style.setProperty('--my', `${my.toFixed(1)}%`);
            spotPending = false;
          });
        }
      }, { passive: true });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. CINEMATIC ORB CURSOR TRACKER (Event Delegation + Self-Pausing RAF)
  // ═══════════════════════════════════════════════════════════════════════════
  if (window.matchMedia('(pointer: fine)').matches) {
    const cursorSys = document.getElementById('cinematicCursor');
    if (cursorSys) {
      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;
      let curX = mouseX, curY = mouseY;
      let cursorVisible = false;
      let cursorRafId = null;

      const CURSOR_EASE = 0.22;
      const CURSOR_EPSILON = 0.15;

      function renderCursor() {
        cursorRafId = null;
        const dx = mouseX - curX;
        const dy = mouseY - curY;
        if (Math.abs(dx) > CURSOR_EPSILON || Math.abs(dy) > CURSOR_EPSILON) {
          curX += dx * CURSOR_EASE;
          curY += dy * CURSOR_EASE;
          cursorSys.style.transform = `translate3d(${curX.toFixed(2)}px,${curY.toFixed(2)}px,0)`;
          cursorRafId = requestAnimationFrame(renderCursor);
        } else {
          curX = mouseX;
          curY = mouseY;
          cursorSys.style.transform = `translate3d(${curX}px,${curY}px,0)`;
        }
      }

      window.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!cursorVisible) {
          cursorVisible = true;
          cursorSys.style.opacity = '1';
        }
        if (!cursorRafId) cursorRafId = requestAnimationFrame(renderCursor);
      }, { passive: true });

      document.addEventListener('mouseleave', () => {
        cursorSys.style.opacity = '0';
        cursorVisible = false;
      }, { passive: true });

      window.addEventListener('mousedown', () => cursorSys.classList.add('clicking'), { passive: true });
      window.addEventListener('mouseup', () => cursorSys.classList.remove('clicking'), { passive: true });

      // Fast Event Delegation for hover targets (avoids hundreds of closures)
      const hoverSelector = 'a, button, .card-item, .price-card, .cert-card-item, .highlight-item, .exploring-chip, .about-cta-btn, .btn-header, .directory-tool-pill, .orbit-node-chip';
      document.addEventListener('mouseover', e => {
        if (e.target.closest(hoverSelector)) {
          cursorSys.classList.add('hovering');
        }
      }, { passive: true });

      document.addEventListener('mouseout', e => {
        if (e.target.closest(hoverSelector)) {
          cursorSys.classList.remove('hovering');
        }
      }, { passive: true });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. MOBILE NAVIGATION HAMBURGER
  // ═══════════════════════════════════════════════════════════════════════════
  (function initMobileNav() {
    const hamburger = document.getElementById('navHamburger');
    const overlay = document.getElementById('mobileNavOverlay');
    const closeBtn = document.getElementById('mobileNavClose');
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

    hamburger.addEventListener('click', () => {
      overlay.classList.contains('open') ? closeMenu() : openMenu();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    overlay.querySelectorAll('[data-mobile-nav]').forEach(link => {
      link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          closeMenu();
          const target = document.querySelector(href);
          if (target) {
            setTimeout(() => {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 120);
          }
        }
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    }, { passive: true });
  })();

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. LORVEN BOX CURSOR GLOW
  // ═══════════════════════════════════════════════════════════════════════════
  (function initLorvenGlow() {
    const box = document.getElementById('lorvenBox');
    const glow = document.getElementById('lorvenCursorGlow');
    if (!box || !glow || !window.matchMedia('(pointer: fine)').matches) return;

    let rafPending = false, mx = 0, my = 0;
    box.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          const rect = box.getBoundingClientRect();
          const x = mx - rect.left;
          const y = my - rect.top;
          glow.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
          rafPending = false;
        });
      }
    }, { passive: true });
  })();

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. NAVBAR CTA SMOOTH SCROLL
  // ═══════════════════════════════════════════════════════════════════════════
  (function initNavCta() {
    const btn = document.getElementById('navCtaBtn');
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.preventDefault();
      const tgt = document.getElementById('contact');
      if (tgt) tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  })();

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. CONTACT FORM & EMAILJS INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════
  (function initContactForm() {
    const EJS_PUBLIC_KEY   = 'ni0IqrRGioOb5jfTh';
    const EJS_SERVICE_ID   = 'service_q51cstr';
    const EJS_TEMPLATE_ID  = 'template_qcy1y3b';
    const EJS_AUTOREPLY_ID = 'template_10tkb1a';
    const TO_EMAIL         = 'vardhanbillakanti125@gmail.com';

    if (typeof emailjs !== 'undefined') {
      emailjs.init({ publicKey: EJS_PUBLIC_KEY });
    }

    const form = document.getElementById('contactForm');
    const btn = document.getElementById('contactSubmitBtn');
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
      notice.className = 'contact-form-notice' + (state ? ` ${state}` : '');
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

    form.addEventListener('submit', e => {
      e.preventDefault();
      setNotice('', '');

      const nameEl = form.querySelector('#cf-name');
      const emailEl = form.querySelector('#cf-email');
      const phoneEl = form.querySelector('#cf-phone');
      const subjectEl = form.querySelector('#cf-subject');
      const messageEl = form.querySelector('#cf-message');

      [nameEl, emailEl, phoneEl, messageEl].forEach(el => {
        if (el) el.classList.remove('invalid');
      });

      let valid = true;
      if (!nameEl || !nameEl.value.trim()) { if (nameEl) nameEl.classList.add('invalid'); valid = false; }
      if (!emailEl || !isValidEmail(emailEl.value)) { if (emailEl) emailEl.classList.add('invalid'); valid = false; }
      if (phoneEl && !isValidPhone(phoneEl.value)) { phoneEl.classList.add('invalid'); valid = false; }
      if (!messageEl || !messageEl.value.trim()) { if (messageEl) messageEl.classList.add('invalid'); valid = false; }

      if (!valid) {
        setNotice('Please fill in all required fields correctly.', 'state-error');
        return;
      }

      if (typeof emailjs === 'undefined') {
        setNotice(`Email service unavailable. Please email me directly at ${TO_EMAIL}`, 'state-error');
        return;
      }

      setLoading(true);
      setNotice('Sending\u2026', '');

      const params = {
        name: nameEl.value.trim(),
        email: emailEl.value.trim(),
        phone: (phoneEl && phoneEl.value.trim()) ? phoneEl.value.trim() : 'Not provided',
        subject: (subjectEl && subjectEl.value.trim()) ? subjectEl.value.trim() : 'Portfolio Contact',
        message: messageEl.value.trim()
      };

      emailjs.send(EJS_SERVICE_ID, EJS_TEMPLATE_ID, params)
        .then(() => {
          emailjs.send(EJS_SERVICE_ID, EJS_AUTOREPLY_ID, {
            name: params.name,
            email: params.email
          }).catch(autoReplyErr => {
            console.warn('[ContactForm] Auto-reply send failed (non-critical):', autoReplyErr);
          });

          setLoading(false);
          setNotice('\u2713 Message sent! I\'ll get back to you soon.', 'state-success');
          form.reset();
          setTimeout(() => { setNotice('', ''); }, 8000);
        })
        .catch(err => {
          setLoading(false);
          setNotice(`Send failed. Please retry or email me at ${TO_EMAIL}`, 'state-error');
          console.error('[ContactForm] EmailJS error:', err);
        });
    });
  })();

})();