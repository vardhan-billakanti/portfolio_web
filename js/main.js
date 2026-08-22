(function () {
      const TOTAL_FRAMES = 145;
      const canvas = document.getElementById('animationCanvas');
      const ctx = canvas.getContext('2d');
      const preloader = document.getElementById('preloader');

      const images = [];
      let loadedCount = 0;
      let targetFrame = 0;
      let currentFrame = 0;
      let isLoaded = false;

      // Pad number to 3 digits (e.g., 1 -> "001")
      function getFrameFilename(index) {
        const paddedIndex = String(index).padStart(3, '0');
        return `frames/ezgif-frame-${paddedIndex}.jpg`;
      }

      // Preload all 145 images
      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = getFrameFilename(i);
        img.onload = () => {
          loadedCount++;
          if (loadedCount === TOTAL_FRAMES) {
            onAllImagesLoaded();
          }
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === TOTAL_FRAMES) {
            onAllImagesLoaded();
          }
        };
        images.push(img);
      }

      function onAllImagesLoaded() {
        isLoaded = true;
        preloader.classList.add('hidden');
        resizeCanvas();
        updateTargetFrame();
        requestAnimationFrame(renderLoop);
      }

      function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium'; // 'high' is significantly more expensive
      }

      function updateTargetFrame() {
        const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        
        if (maxScroll <= 0) return;
        
        const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScroll));
        targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
      }

      function drawFrame(frameIdx) {
        if (!isLoaded || images.length === 0) return;
        
        const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameIdx)));
        const img = images[clampedIndex];
        
        if (!img || !img.complete || img.naturalWidth === 0) return;

        const cw = canvas.width;
        const ch = canvas.height;

        ctx.clearRect(0, 0, cw, ch);

        // Aspect ratio object-fit contain logic
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

      // Smooth interpolation render loop (lerp) — skip draw when idle or unchanged
      let lastDrawnFrame = -1;
      let renderLoopRunning = false;

      function renderLoop() {
        const diff = targetFrame - currentFrame;

        if (Math.abs(diff) > 0.001) {
          currentFrame += diff * 0.12; // silky smooth lerp
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
        if (!renderLoopRunning && isLoaded) {
          renderLoopRunning = true;
          requestAnimationFrame(renderLoop);
        }
      }

      window.addEventListener('scroll', () => {
        updateTargetFrame();
        triggerRenderLoop();
      }, { passive: true });
      window.addEventListener('resize', () => {
        resizeCanvas();
        drawFrame(currentFrame);
      }, { passive: true });

      // Header Scroll Blur/Background Handler
      const navHeader = document.querySelector('header.nav-header');
      function handleHeaderScroll() {
        if (!navHeader) return;
        if (window.scrollY > 30) {
          navHeader.classList.add('scrolled');
        } else {
          navHeader.classList.remove('scrolled');
        }
      }
      window.addEventListener('scroll', handleHeaderScroll, { passive: true });
      handleHeaderScroll();

      // IntersectionObserver for all reveal animations (covers all sections & cards — runs ONCE only)
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
        }, { threshold: 0.10 });

        revealElements.forEach(el => {
          el.classList.add('scroll-reveal');
          revealObserver.observe(el);
        });
      } else {
        revealElements.forEach(el => el.classList.add('in-view'));
      }

      // 5. Interactive 2-Column Toolkit Dashboard Engine with REAL LOGOS!
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
        // Antigravity is a proprietary AI IDE — no official icon; use a styled placeholder SVG
        "Antigravity":       "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='15' fill='%23111' stroke='%23ff4d00' stroke-width='1.5'/%3E%3Ctext x='16' y='21' text-anchor='middle' font-family='Outfit,sans-serif' font-weight='800' font-size='11' fill='%23ff4d00'%3EAG%3C/text%3E%3C/svg%3E",
        "Git":               "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
        "GitHub":            "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
        "Postman":           "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postman/postman-original.svg",
        "Vercel":            "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vercel/vercel-original.svg",
        "Kali Linux":        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
        "Linux":             "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
        "Wireshark":         "https://cdn.simpleicons.org/wireshark/1679A3",
        // Burp Suite (PortSwigger) — no devicon entry; use official color badge
        "Burp Suite":        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='15' fill='%23FF6633'/%3E%3Ctext x='16' y='21' text-anchor='middle' font-family='Arial,sans-serif' font-weight='900' font-size='9' fill='%23fff'%3EBurp%3C/text%3E%3C/svg%3E",
        // Nmap — no devicon; use branded badge
        "Nmap":              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='15' fill='%230E1A2B' stroke='%234a90d9' stroke-width='1.5'/%3E%3Ctext x='16' y='21' text-anchor='middle' font-family='Arial,sans-serif' font-weight='700' font-size='9' fill='%234a90d9'%3ENmap%3C/text%3E%3C/svg%3E",
        // Metasploit — use branded badge
        "Metasploit":        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='15' fill='%231a1a2e' stroke='%23e94560' stroke-width='1.5'/%3E%3Ctext x='16' y='21' text-anchor='middle' font-family='Arial,sans-serif' font-weight='700' font-size='7.5' fill='%23e94560'%3EMETA%3C/text%3E%3C/svg%3E",
        // OWASP — use simpleicons
        "OWASP":             "https://cdn.simpleicons.org/owasp/000000",
        "Bash":              "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg",
        "ChatGPT":           "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
        // Google Gemini — use correct Gemini icon from simpleicons
        "Google Gemini":     "https://cdn.simpleicons.org/googlegemini/4285F4",
        // Claude (Anthropic) — use simpleicons
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
        // CapCut — simpleicons entry unavailable; using branded data URI
        "CapCut":            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23000'/%3E%3Cpath d='M10 10h5v12h-5zM17 10h5v12h-5z' fill='%23fff'/%3E%3C/svg%3E"
      };

      const TECH_DATASET = [
        // PROGRAMMING (4)
        { name: "C", category: "PROGRAMMING", status: "EXPLORING" },
        { name: "Java", category: "PROGRAMMING", status: "EXPLORING" },
        { name: "Python", category: "PROGRAMMING", status: "EXPLORING" },
        { name: "TypeScript", category: "PROGRAMMING", status: "EXPLORING" },

        // WEB DEVELOPMENT (8)
        { name: "HTML", category: "WEB DEVELOPMENT", status: "USING" },
        { name: "CSS", category: "WEB DEVELOPMENT", status: "USING" },
        { name: "JavaScript", category: "WEB DEVELOPMENT", status: "USING" },
        { name: "React", category: "WEB DEVELOPMENT", status: "EXPLORING" },
        { name: "Node.js", category: "WEB DEVELOPMENT", status: "EXPLORING" },
        { name: "Express.js", category: "WEB DEVELOPMENT", status: "EXPLORING" },
        { name: "Next.js", category: "WEB DEVELOPMENT", status: "EXPLORING" },
        { name: "Tailwind CSS", category: "WEB DEVELOPMENT", status: "EXPLORING" },

        // CYBER SECURITY (8)
        { name: "Kali Linux", category: "CYBER SECURITY", status: "EXPLORING" },
        { name: "Linux", category: "CYBER SECURITY", status: "USING" },
        { name: "Wireshark", category: "CYBER SECURITY", status: "EXPLORING" },
        { name: "Burp Suite", category: "CYBER SECURITY", status: "EXPLORING" },
        { name: "Nmap", category: "CYBER SECURITY", status: "EXPLORING" },
        { name: "Metasploit", category: "CYBER SECURITY", status: "EXPLORING" },
        { name: "OWASP", category: "CYBER SECURITY", status: "EXPLORING" },
        { name: "Bash", category: "CYBER SECURITY", status: "USING" },

        // AI & DATA (8)
        { name: "ChatGPT", category: "AI & DATA", status: "USING" },
        { name: "Google Gemini", category: "AI & DATA", status: "USING" },
        { name: "Claude", category: "AI & DATA", status: "USING" },
        { name: "NumPy", category: "AI & DATA", status: "EXPLORING" },
        { name: "Pandas", category: "AI & DATA", status: "EXPLORING" },
        { name: "Jupyter", category: "AI & DATA", status: "EXPLORING" },
        { name: "PyTorch", category: "AI & DATA", status: "EXPLORING" },
        { name: "TensorFlow", category: "AI & DATA", status: "EXPLORING" },

        // CLOUD & DEVOPS (5)
        { name: "AWS", category: "CLOUD & DEVOPS", status: "EXPLORING" },
        { name: "Microsoft Azure", category: "CLOUD & DEVOPS", status: "EXPLORING" },
        { name: "Google Cloud", category: "CLOUD & DEVOPS", status: "EXPLORING" },
        { name: "Docker", category: "CLOUD & DEVOPS", status: "EXPLORING" },
        { name: "Kubernetes", category: "CLOUD & DEVOPS", status: "EXPLORING" },

        // DATABASES (4)
        { name: "MySQL", category: "DATABASES", status: "EXPLORING" },
        { name: "PostgreSQL", category: "DATABASES", status: "EXPLORING" },
        { name: "MongoDB", category: "DATABASES", status: "EXPLORING" },
        { name: "Firebase", category: "DATABASES", status: "EXPLORING" },

        // DEVELOPMENT TOOLS (6)
        { name: "Visual Studio Code", category: "DEVELOPMENT TOOLS", status: "USING" },
        { name: "Antigravity", category: "DEVELOPMENT TOOLS", status: "USING" },
        { name: "Git", category: "DEVELOPMENT TOOLS", status: "USING" },
        { name: "GitHub", category: "DEVELOPMENT TOOLS", status: "USING" },
        { name: "Postman", category: "DEVELOPMENT TOOLS", status: "EXPLORING" },
        { name: "Vercel", category: "DEVELOPMENT TOOLS", status: "EXPLORING" },

        // DESIGN & PRODUCTIVITY (2)
        { name: "Canva", category: "DESIGN & PRODUCTIVITY", status: "USING" },
        { name: "CapCut", category: "DESIGN & PRODUCTIVITY", status: "USING" }
      ];

      // Dynamic Counter Pill
      const techCounterPill = document.getElementById('techCounter');
      if (techCounterPill) {
        techCounterPill.textContent = `${TECH_DATASET.length} TOOLS AVAILABLE`;
      }

      // References to Right Central Showcase elements
      const showcaseIconBadge = document.getElementById('showcaseIconBadge');
      const showcaseToolTitle = document.getElementById('showcaseToolTitle');
      const showcaseCatTag = document.getElementById('showcaseCatTag');
      const showcaseStatusPill = document.getElementById('showcaseStatusPill');
      const orbitalShowcaseViewport = document.getElementById('orbitalShowcaseViewport');

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
            showcaseIconBadge.innerHTML = DEFAULT_SHOWCASE_STATE.symbol;
            showcaseToolTitle.textContent = DEFAULT_SHOWCASE_STATE.title;
            showcaseCatTag.textContent = DEFAULT_SHOWCASE_STATE.cat;
            showcaseStatusPill.style.display = 'none';
          } else {
            const logoUrl = REAL_LOGOS[tech.name];
            if (logoUrl) {
              showcaseIconBadge.innerHTML = `<img src="${logoUrl}" alt="${tech.name}">`;
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
        }, 120);
      }

      // Populate LEFT Vertical Tool Directory with REAL LOGOS
      const directoryCol = document.getElementById('toolkitDirectoryCol');
      const categoriesOrder = [
        "PROGRAMMING", "WEB DEVELOPMENT", "CYBER SECURITY", "AI & DATA",
        "CLOUD & DEVOPS", "DATABASES", "DEVELOPMENT TOOLS", "DESIGN & PRODUCTIVITY"
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
            const logoHtml = logoUrl ? `<img src="${logoUrl}" class="pill-logo-img" alt="${tech.name}">` : `<span class="pill-icon">●</span>`;

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

      // ═══════════════════════════════════════════════
      // RIGHT-SIDE ORBITAL SYSTEM — Full Rebuild
      // ═══════════════════════════════════════════════
      (function initOrbitalSystem() {
        const viewport   = document.getElementById('orbitalShowcaseViewport');
        const nodesLayer = document.getElementById('orbitalNodesLayer');
        const svgRings   = ["orbitRing1","orbitRing2","orbitRing3","orbitRing4"];
        if (!viewport || !nodesLayer) return;

        // Orbital ring definitions — match the 4 SVG ellipses
        // Speeds ~2.2× faster than original; ratio preserved for natural orbital feel
        const RINGS = [
          { rx: 92,  ry: 62,  speed:  0.00062, dir:  1 }, // Ring 1 innermost (fastest)
          { rx: 152, ry: 102, speed:  0.00046, dir: -1 }, // Ring 2
          { rx: 206, ry: 138, speed:  0.00037, dir:  1 }, // Ring 3
          { rx: 254, ry: 170, speed:  0.00029, dir: -1 }, // Ring 4 outermost (slowest)
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

        // ── Build nodes ──
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
            ? `<img src="${logo}" class="node-logo-img" alt="${tool.name}"><span>${tool.name}</span>`
            : `<span style="font-size:14px;line-height:1">&#9679;</span><span>${tool.name}</span>`;

          nodesLayer.appendChild(chip);

          nodeObjects.push({
            el:          chip,
            name:        tool.name,
            ring:        r,
            angle:       angle,
            scale:       1,
            targetScale: 1,
          });
        });

        // ── Viewport dimension cache (re-read only on resize) ──
        let vw = viewport.clientWidth  || 540;
        let vh = viewport.clientHeight || 540;
        let scaleX = vw / 540;
        let scaleY = vh / 540;
        let cx = vw / 2;
        let cy = vh / 2;

        const ro = new ResizeObserver(() => {
          vw = viewport.clientWidth  || 540;
          vh = viewport.clientHeight || 540;
          scaleX = vw / 540;
          scaleY = vh / 540;
          cx = vw / 2;
          cy = vh / 2;
        });
        ro.observe(viewport);

        // IntersectionObserver: skip work when section is off-screen
        let sectionVisible = true;
        const io = new IntersectionObserver(entries => {
          sectionVisible = entries[0].isIntersecting;
        }, { threshold: 0.05 });
        io.observe(viewport);

        // Orbit NEVER pauses — no hover listeners on the viewport
        const TARGET_SCALE  = 1.42;
        const SCALE_EASE    = 0.13;
        const SCALE_EPSILON = 0.0003;

        // ── High-performance animation loop ──
        let lastTs = 0;
        let rafId;

        function tick(ts) {
          rafId = requestAnimationFrame(tick);

          // Completely skip rendering when section is off-screen
          if (!sectionVisible) { lastTs = ts; return; }

          const dt = Math.min(ts - lastTs, 40); // cap spike frames at 40ms
          lastTs = ts;

          nodeObjects.forEach(node => {
            const ring = RINGS[node.ring];

            // Orbit ALWAYS advances — no pause, ever
            node.angle += ring.speed * ring.dir * dt;

            // Lerp scale toward target smoothly
            const diff = node.targetScale - node.scale;
            if (Math.abs(diff) > SCALE_EPSILON) {
              node.scale += diff * SCALE_EASE;
            } else {
              node.scale = node.targetScale;
            }

            // Parametric ellipse in CSS pixel space
            const px = ring.rx * Math.cos(node.angle) * scaleX;
            const py = ring.ry * Math.sin(node.angle) * scaleY;

            // GPU-composited transform: translate3d (no integer rounding = no jitter)
            node.el.style.transform =
              `translate3d(${cx + px}px,${cy + py}px,0) translate(-50%,-50%) scale(${node.scale.toFixed(4)})`;
          });
        }

        rafId = requestAnimationFrame(tick);

        // ── Highlight / reset logic ──
        function _highlightNode(techName) {
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
        }

        function _resetHighlight() {
          viewport.classList.remove('is-active');
          nodeObjects.forEach(n => {
            n.el.classList.remove('active');
            n.targetScale = 1;
          });
          svgRings.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('ring-active');
          });
        }

        // Expose to outer scope for left-pill hover calls
        window._highlightOrbitNode  = _highlightNode;
        window._resetOrbitHighlight = _resetHighlight;
      })();

      // Wire left-pill hovers to orbital system
      function highlightOrbitNode(name) { if (window._highlightOrbitNode)  window._highlightOrbitNode(name); }
      function resetOrbitHighlight()    { if (window._resetOrbitHighlight) window._resetOrbitHighlight(); }

      function highlightLeftPill(techName) {
        document.querySelectorAll('.directory-tool-pill').forEach(pill => {
          if (pill.getAttribute('data-tech-name') === techName) {
            pill.classList.add('active');
            pill.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
            pill.classList.remove('active');
          }
        });
      }

      function resetLeftPills() {
        document.querySelectorAll('.directory-tool-pill').forEach(pill => pill.classList.remove('active'));
      }

      // 1. Cursor Magnetic Button Effect (Desktop Fine Pointer Only)
      // Uses RAF-batched getBoundingClientRect to avoid forced layout thrashing
      var magneticBtns = document.querySelectorAll('.btn-header, .about-cta-btn, .btn-orange, .btn-price, .scale-submit-pill');
      if (matchMedia('(pointer: fine)').matches) {
        magneticBtns.forEach(function(btn) {
          var mx = 0, my = 0, magRafPending = false;
          btn.addEventListener('mousemove', function(e) {
            mx = e.clientX; my = e.clientY;
            if (!magRafPending) {
              magRafPending = true;
              requestAnimationFrame(function() {
                var rect = btn.getBoundingClientRect();
                var cx   = rect.left + rect.width  / 2;
                var cy   = rect.top  + rect.height / 2;
                var moveX = Math.max(-8, Math.min(8, (mx - cx) * 0.22));
                var moveY = Math.max(-8, Math.min(8, (my - cy) * 0.22));
                btn.style.transform = 'translate3d(' + moveX + 'px,' + moveY + 'px,0) scale(1.02)';
                magRafPending = false;
              });
            }
          }, { passive: true });
          btn.addEventListener('mouseleave', function() {
            btn.style.transform = 'translate3d(0,0,0) scale(1)';
          }, { passive: true });
        });
      }

      // 2. Hero Subtle Mouse Parallax (Portrait Canvas Remains 100% Untouched!)
      const heroSection = document.getElementById('home');
      const heroLeft = document.querySelector('.hero-left');
      const heroRight = document.querySelector('.hero-right');
      const heroGlowLeft = document.querySelector('.glow-hero-left');
      const heroGlowRight = document.querySelector('.glow-hero-right');

      if (heroSection && matchMedia('(pointer: fine)').matches) {
        let heroTargetX = 0;
        let heroTargetY = 0;
        let heroCurX = 0;
        let heroCurY = 0;
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

        // Self-pausing rAF: truly stops when hero is off-screen
        let heroRafId = null;
        function animateHeroParallax() {
          heroRafId = null; // cleared before rescheduling
          if (!heroInView) return; // stop loop entirely
          if (!heroMoved &&
              Math.abs(heroTargetX - heroCurX) < 0.001 &&
              Math.abs(heroTargetY - heroCurY) < 0.001) return; // idle

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
        // Schedule the first frame on mousemove (already scheduled above via the listener)
        heroSection.addEventListener('mousemove', () => scheduleHeroParallax(), { passive: true });
        scheduleHeroParallax();
      }

      // 3a. Projects Section — Scroll Reveal (staggered, IntersectionObserver)
      (function initProjectsReveal() {
        const cards = document.querySelectorAll('.proj-card');
        if (!cards.length) return;

        const io = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const card = entry.target;
            const idx  = parseInt(card.dataset.projIndex, 10) || 0;
            setTimeout(() => card.classList.add('revealed'), idx * 95);
            io.unobserve(card);
          });
        }, { threshold: 0.12 });

        cards.forEach(c => io.observe(c));
      })();

      // 3b. Projects Section — Per-card cursor radial highlight (non-global)
      if (matchMedia('(pointer: fine)').matches) {
        document.querySelectorAll('.proj-card').forEach(card => {
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

      // 3. Project Card Depth Interaction (legacy .card-item)
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

      // 4. Unified Cinematic Orb Custom Cursor Tracker
      if (matchMedia('(pointer: fine)').matches) {
        var cursorSys = document.getElementById('cinematicCursor');
        if (cursorSys) {
          var mouseX = window.innerWidth / 2;
          var mouseY = window.innerHeight / 2;
          var curX = mouseX, curY = mouseY;
          var cursorVisible = false;
          var cursorRafId = null;
          // Track if cursor actually moved since last frame
          var cursorDirty = false;

          window.addEventListener('mousemove', function(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDirty = true;
            if (!cursorVisible) {
              cursorVisible = true;
              cursorSys.style.opacity = '1';
            }
            // Schedule a frame if not already scheduled
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

          // Hover target detection
          document.querySelectorAll('a, button, .card-item, .price-card, .cert-card-item, .highlight-item, .exploring-chip, .about-cta-btn, .btn-header').forEach(function(el) {
            el.addEventListener('mouseenter', function() { cursorSys.classList.add('hovering'); }, { passive: true });
            el.addEventListener('mouseleave', function() { cursorSys.classList.remove('hovering'); }, { passive: true });
          });

          // Self-scheduling RAF: only runs while cursor is moving/lerping
          // Stops completely when cursor is stationary — zero CPU at rest
          var CURSOR_EASE = 0.22;
          var CURSOR_EPSILON = 0.15; // px — stop lerping below this delta
          function renderCursor() {
            cursorRafId = null;
            var dx = mouseX - curX;
            var dy = mouseY - curY;
            if (Math.abs(dx) > CURSOR_EPSILON || Math.abs(dy) > CURSOR_EPSILON) {
              curX += dx * CURSOR_EASE;
              curY += dy * CURSOR_EASE;
              cursorSys.style.transform = 'translate3d(' + curX.toFixed(2) + 'px,' + curY.toFixed(2) + 'px,0)';
              cursorRafId = requestAnimationFrame(renderCursor);
            } else {
              // Snap to final position and stop — no more CPU usage until next mousemove
              curX = mouseX;
              curY = mouseY;
              cursorSys.style.transform = 'translate3d(' + curX + 'px,' + curY + 'px,0)';
            }
          }
        }
      }

      // ── Contact Form — client-side validation + safe submission state ──
      
      // == Mobile Navigation Hamburger ==
      (function() {
        var hamburger = document.getElementById('navHamburger');
        var overlay   = document.getElementById('mobileNavOverlay');
        var closeBtn  = document.getElementById('mobileNavClose');
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

        // Close when a link is clicked
        overlay.querySelectorAll('[data-mobile-nav]').forEach(function(link) {
          link.addEventListener('click', function(e) {
            var href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
              e.preventDefault();
              closeMenu();
              var target = document.querySelector(href);
              if (target) {
                setTimeout(function() {
                  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 120);
              }
            }
          });
        });

        // Close on Escape key
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') closeMenu();
        }, { passive: true });
      })();
// == Lorven Box: GPU-optimised cursor-following glow ==
      (function() {
        var box  = document.getElementById('lorvenBox');
        var glow = document.getElementById('lorvenCursorGlow');
        if (!box || !glow) return;
        var rafPending = false, mx = 0, my = 0;
        box.addEventListener('mousemove', function(e) {
          mx = e.clientX; my = e.clientY;
          if (!rafPending) {
            rafPending = true;
            requestAnimationFrame(function() {
              var rect = box.getBoundingClientRect();
              var x = mx - rect.left;
              var y = my - rect.top;
              glow.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%)';
              rafPending = false;
            });
          }
        }, { passive: true });
      })();

      // == Navbar CTA smooth-scroll to #contact ==
      (function() {
        var btn = document.getElementById('navCtaBtn');
        if (!btn) return;
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          var tgt = document.getElementById('contact');
          if (tgt) tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      })();

      (function initContactForm() {
        // ── EmailJS credentials ──────────────────────────────────────────
        var EJS_PUBLIC_KEY      = 'ni0IqrRGioOb5jfTh';
        var EJS_SERVICE_ID      = 'service_q51cstr';
        var EJS_TEMPLATE_ID     = 'template_qcy1y3b';   // Original: visitor → my inbox
        var EJS_AUTOREPLY_ID    = 'template_10tkb1a';   // Auto-reply: portfolio → visitor
        var TO_EMAIL            = 'vardhanbillakanti125@gmail.com';
        // ─────────────────────────────────────────────────────────────────

        // Initialise EmailJS SDK with the public key
        if (typeof emailjs !== 'undefined') {
          emailjs.init({ publicKey: EJS_PUBLIC_KEY });
        }

        var form   = document.getElementById('contactForm');
        var btn    = document.getElementById('contactSubmitBtn');
        var notice = document.getElementById('contactFormNotice');
        if (!form) return;

        function isValidEmail(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
        }
        function isValidPhone(v) {
          if (!v.trim()) return true; // optional — blank is accepted
          return /^[\+]?[\d\s\-\(\)]{7,15}$/.test(v.trim());
        }

        function setNotice(msg, state) {
          notice.textContent = msg;
          notice.className   = 'contact-form-notice' + (state ? ' ' + state : '');
        }

        function setLoading(on) {
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

          // Grab all fields
          var nameEl    = form.querySelector('#cf-name');
          var emailEl   = form.querySelector('#cf-email');
          var phoneEl   = form.querySelector('#cf-phone');
          var subjectEl = form.querySelector('#cf-subject');
          var messageEl = form.querySelector('#cf-message');

          // Clear previous invalid states
          [nameEl, emailEl, phoneEl, messageEl].forEach(function (el) {
            if (el) el.classList.remove('invalid');
          });

          // Validate required fields
          var valid = true;
          if (!nameEl    || !nameEl.value.trim())        { if (nameEl)    nameEl.classList.add('invalid');    valid = false; }
          if (!emailEl   || !isValidEmail(emailEl.value)){ if (emailEl)   emailEl.classList.add('invalid');   valid = false; }
          if (phoneEl    && !isValidPhone(phoneEl.value)) {                phoneEl.classList.add('invalid');   valid = false; }
          if (!messageEl || !messageEl.value.trim())     { if (messageEl) messageEl.classList.add('invalid'); valid = false; }

          if (!valid) {
            setNotice('Please fill in all required fields correctly.', 'state-error');
            return;
          }

          // Guard: EmailJS SDK must be loaded (CDN block, offline, etc.)
          if (typeof emailjs === 'undefined') {
            setNotice('Email service unavailable. Please email me directly at ' + TO_EMAIL, 'state-error');
            return;
          }

          // Enter loading state — blocks duplicate submissions
          setLoading(true);
          setNotice('Sending\u2026', '');

          // Template params — variable names match your EmailJS template exactly:
          // {{name}}  {{email}}  {{phone}}  {{subject}}  {{message}}
          var params = {
            name:    nameEl.value.trim(),
            email:   emailEl.value.trim(),
            phone:   (phoneEl && phoneEl.value.trim()) ? phoneEl.value.trim() : 'Not provided',
            subject: (subjectEl && subjectEl.value.trim()) ? subjectEl.value.trim() : 'Portfolio Contact',
            message: messageEl.value.trim()
          };

          // ── STEP 1: Send visitor's message to vardhanbillakanti125@gmail.com ──
          emailjs.send(EJS_SERVICE_ID, EJS_TEMPLATE_ID, params)
            .then(function () {
              // ── STEP 2: Original send succeeded → send auto-reply to visitor ──
              // Uses a separate template (template_10tkb1a).
              // Recipient is {{email}} (the visitor's address), NOT vardhanbillakanti125@gmail.com.
              emailjs.send(EJS_SERVICE_ID, EJS_AUTOREPLY_ID, {
                name:  params.name,
                email: params.email
              }).catch(function (autoReplyErr) {
                // Non-critical: visitor's original message was already delivered.
                // Log silently without affecting the user-facing success state.
                console.warn('[ContactForm] Auto-reply send failed (non-critical):', autoReplyErr);
              });

              // SUCCESS — clear form only after confirmed delivery of the original message
              setLoading(false);
              setNotice('\u2713 Message sent! I\'ll get back to you soon.', 'state-success');
              form.reset();
              setTimeout(function () { setNotice('', ''); }, 8000);
            })
            .catch(function (err) {
              // FAILURE — keep data intact so the user can retry
              setLoading(false);
              setNotice('Send failed. Please retry or email me at ' + TO_EMAIL, 'state-error');
              console.error('[ContactForm] EmailJS error:', err);
            });
        });
      })();

    })();