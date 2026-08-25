(function () {
      const TOTAL_FRAMES = 145;
      const canvas = document.getElementById('animationCanvas');
      const ctx = canvas.getContext('2d');
      const preloader = document.getElementById('preloader');
      const navHeader = document.querySelector('header.nav-header');
      const mobImgEl = document.getElementById('mobilePortraitImg');
      const heroEl = document.getElementById('home');

      const images = new Array(TOTAL_FRAMES);
      let targetFrame = 0;
      let currentFrame = 0;
      let isLoaded = false;
      let initialFrameReady = false;

      // ── CACHED LAYOUT DIMENSIONS (Prevents Forced Synchronous Layout during scroll) ──
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

      // Pad number to 3 digits (e.g., 1 -> "001")
      function getFrameFilename(index) {
        const paddedIndex = String(index).padStart(3, '0');
        return `frames/ezgif-frame-${paddedIndex}.jpg`;
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

      // 1. Load First Critical Frame immediately for instant page display
      const firstImg = new Image();
      firstImg.src = getFrameFilename(1);
      firstImg.onload = () => {
        images[0] = firstImg;
        initInitialFrame();
        // Progressively stream remaining frames in non-blocking background batches
        loadRemainingFrames();
      };
      firstImg.onerror = () => {
        initInitialFrame();
        loadRemainingFrames();
      };

      // Fallback safeguard: Never hold preloader more than 250ms
      setTimeout(() => {
        if (!initialFrameReady) initInitialFrame();
      }, 250);

      // 2. Stream Remaining Frames Asynchronously (idle/batch loading)
      function loadRemainingFrames() {
        let currentIndex = 2;
        const BATCH_SIZE = 8;

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
              requestIdleCallback(loadNextBatch, { timeout: 60 });
            } else {
              setTimeout(loadNextBatch, 16);
            }
          }
        }

        if ('requestIdleCallback' in window) {
          requestIdleCallback(loadNextBatch, { timeout: 80 });
        } else {
          setTimeout(loadNextBatch, 20);
        }
      }

      function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x DPR to save GPU memory & fill rate
        canvas.width = cachedWinWidth * dpr;
        canvas.height = cachedWinHeight * dpr;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
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
        if (!isLoaded) return;
        
        const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameIdx)));
        const img = getBestAvailableFrame(clampedIndex);
        
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

      // Smooth interpolation render loop (lerp)
      let lastDrawnFrame = -1;
      let renderLoopRunning = false;

      function renderLoop() {
        const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        const diff = targetFrame - currentFrame;

        if (Math.abs(diff) > 0.001) {
          currentFrame += diff * 0.16; // silky smooth & responsive lerp
        } else {
          currentFrame = targetFrame;
        }

        // OFFSCREEN CANVAS CULLING:
        // Only draw canvas frames when hero is within or near viewport
        const heroVisible = currentScrollY <= cachedHeroHeight * 1.8;

        if (heroVisible) {
          const rounded = Math.round(currentFrame);
          if (rounded !== lastDrawnFrame) {
            lastDrawnFrame = rounded;
            drawFrame(currentFrame);

            // Update mobile portrait image with lerped frame
            if (mobImgEl && cachedWinWidth <= 768) {
              const currentMobImg = getBestAvailableFrame(rounded);
              if (currentMobImg && currentMobImg.complete && currentMobImg.naturalWidth > 0) {
                mobImgEl.src = currentMobImg.src;
              }
            }
          }

          // Mobile portrait smooth parallax displacement using cached height
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

      // ── SINGLE COALESCED SCROLL DISPATCHER (Zero Layout Thrashing) ──
      let scrollTicking = false;
      function handleScroll() {
        if (!scrollTicking) {
          scrollTicking = true;
          requestAnimationFrame(() => {
            const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
            
            // 1. Header scroll blur
            if (navHeader) {
              if (currentScrollY > 30) {
                navHeader.classList.add('scrolled');
              } else {
                navHeader.classList.remove('scrolled');
              }
            }

            // 2. Canvas frame update (only active when near hero)
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

      // Immediate reveal for elements currently on or near screen on load
      function revealInitialElements() {
        const threshold = cachedWinHeight * 1.4;
        document.querySelectorAll('.about-reveal, .beyond-reveal, .scroll-reveal, .academic-milestone-item, .founder-card, .proj-card, .lorven-box').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold) {
            el.classList.add('in-view');
            el.classList.add('revealed');
          }
        });
      }

      // Anticipatory IntersectionObserver (220px lookahead ensures zero scroll-lag)
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
        }, { rootMargin: '220px 0px 100px 0px', threshold: 0.001 });

        revealElements.forEach(el => {
          el.classList.add('scroll-reveal');
          revealObserver.observe(el);
        });
      } else {
        revealElements.forEach(el => el.classList.add('in-view'));
      }

      // 5. Interactive 2-Column Toolkit Dashboard Engine with REAL LOGOS!
      const REAL_LOGOS = {
        "C":                  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg",
        "Java":               "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
        "Python":             "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
        "JavaScript":         "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
        "TypeScript":         "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
        "HTML":               "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
        "CSS":                "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
        "React":              "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
        "Node.js":            "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-plain.svg",
        "Next.js":            "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
        "Linux":              "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
        "Kali Linux":         "https://cdn.simpleicons.org/kalilinux/557C94",
        "ChatGPT":            "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
        "Google Gemini":      "https://cdn.simpleicons.org/googlegemini/4285F4",
        "PyTorch":            "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg",
        "Visual Studio Code": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg",
        "AWS":                "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg",
        "Google Cloud":       "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg",
        "Kubernetes":         "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg",
        "Cloudflare":         "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cloudflare/cloudflare-original.svg",
        "Vercel":             "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vercel/vercel-original.svg",
        "MySQL":              "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
        "MongoDB":            "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg",
        "Firebase":           "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg",
        "Supabase":           "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/supabase/supabase-original.svg",
        "SQLite":             "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg",
        "SQL":                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath fill='%23ff6420' d='M16 2C8.268 2 2 5.582 2 10v12c0 4.418 6.268 8 14 8s14-3.582 14-8V10c0-4.418-6.268-8-14-8zm0 3c6.627 0 12 2.686 12 6s-5.373 6-12 6-12-2.686-12-6 5.373-6 12-6zm-12 8.356C5.98 14.887 10.742 16 16 16s10.02-1.113 12-2.644V16c0 3.314-5.373 6-12 6s-12-2.686-12-6v-2.644zM4 22c1.98 1.531 6.742 2.644 12 2.644s10.02-1.113 12-2.644V22c0 3.314-5.373 6-12 6s-12-2.686-12-6v0z'/%3E%3C/svg%3E",
        "Git":                "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
        "GitHub":             "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
        "Canva":              "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/canva/canva-original.svg",
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

      // References to Right Central Showcase elements
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
                showcaseIconBadge.innerHTML = `<img src="${logoUrl}" alt="${tech.name}">`;
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

      // Populate LEFT Vertical Tool Directory with REAL LOGOS
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
      // RIGHT-SIDE ORBITAL SYSTEM — 3D TECH CORE MODEL (60 FPS Performance Optimized)
      // ═══════════════════════════════════════════════
      (function initOrbitalSystem() {
        const viewport   = document.getElementById('orbitalShowcaseViewport');
        const nodesLayer = document.getElementById('orbitalNodesLayer');
        if (!viewport || !nodesLayer) return;

        const svgRingIds = ["orbitRing1", "orbitRing2", "orbitRing3", "orbitRing4"];
        const svgRingEls = svgRingIds.map(id => document.getElementById(id));

        // Orbital ring definitions — match the 4 SVG ellipses
        // Speeds tuned for natural, smooth, fluid orbital feel
        const RINGS = [
          { rx: 92,  ry: 62,  speed:  0.00055, dir:  1 }, // Ring 0 innermost
          { rx: 152, ry: 102, speed:  0.00042, dir: -1 }, // Ring 1
          { rx: 206, ry: 138, speed:  0.00034, dir:  1 }, // Ring 2
          { rx: 254, ry: 170, speed:  0.00026, dir: -1 }, // Ring 3 outermost
        ];

        // All 31 technologies distributed across the 4 rings
        const ORBIT_TOOLS = [
          // Ring 0 — Innermost (4 tools)
          { name: "Linux",              ring: 0 },
          { name: "C",                  ring: 0 },
          { name: "Python",             ring: 0 },
          { name: "SQL",                ring: 0 },

          // Ring 1 (8 tools)
          { name: "JavaScript",         ring: 1 },
          { name: "HTML",               ring: 1 },
          { name: "CSS",                ring: 1 },
          { name: "React",              ring: 1 },
          { name: "Node.js",            ring: 1 },
          { name: "Java",               ring: 1 },
          { name: "MySQL",              ring: 1 },
          { name: "Git",                ring: 1 },

          // Ring 2 (9 tools)
          { name: "TypeScript",         ring: 2 },
          { name: "Next.js",            ring: 2 },
          { name: "ChatGPT",            ring: 2 },
          { name: "Google Gemini",      ring: 2 },
          { name: "PyTorch",            ring: 2 },
          { name: "Visual Studio Code", ring: 2 },
          { name: "MongoDB",            ring: 2 },
          { name: "Firebase",           ring: 2 },
          { name: "GitHub",             ring: 2 },

          // Ring 3 — Outermost (10 tools)
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

        // ── Build nodes once in a DocumentFragment for batch DOM insertion ──
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
            ? `<img src="${logo}" class="node-logo-img" alt="${tool.name}"><span>${tool.name}</span>`
            : `<span style="font-size:14px;line-height:1">&#9679;</span><span>${tool.name}</span>`;

          // Direct hover on orbit nodes: subtle info update without triggering full pop-out animation
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

        // Orbit scale & easing settings
        const TARGET_SCALE  = 1.35;
        const SCALE_EASE    = 0.16;
        const SCALE_EPSILON = 0.001;
        const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // ── Viewport dimension & scale calculation ──
        let vw = viewport.clientWidth  || 540;
        let vh = viewport.clientHeight || 540;
        let scale = Math.min(vw / 540, vh / 540);
        let scaleX = scale;
        let scaleY = scale;
        let cx = vw / 2;
        let cy = vh / 2;

        // Render single frame
        function renderFrame(dt) {
          for (let i = 0; i < nodeObjects.length; i++) {
            const node = nodeObjects[i];
            const ring = RINGS[node.ring];

            if (dt > 0) {
              node.angle += ring.speed * ring.dir * dt;
            }

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

            // 3D Depth layer sorting: nodes in front of or behind central TECH CORE
            const newZ = node.isActive ? 90 : (py > 0 ? 25 : 5);
            if (node.lastZ !== newZ) {
              node.el.style.zIndex = newZ;
              node.lastZ = newZ;
            }

            // GPU-composited transform: translate3d
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

        const ro = new ResizeObserver(() => {
          updateDimensions();
        });
        ro.observe(viewport);

        // Initial render of nodes
        renderFrame(0);

        // ── High-performance animation loop management ──
        let lastTs = 0;
        let rafId = null;
        let isRunning = false;
        let sectionVisible = true;
        let docVisible = typeof document !== 'undefined' ? !document.hidden : true;

        function tick(ts) {
          if (!isRunning) return;

          if (!lastTs) lastTs = ts;
          const dt = Math.min(ts - lastTs, 32); // cap frame delta at 32ms (~30fps floor)
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

        // IntersectionObserver: completely stop loop when section is off-screen
        const io = new IntersectionObserver(entries => {
          sectionVisible = entries[0].isIntersecting;
          if (sectionVisible) {
            startLoop();
          } else {
            stopLoop();
          }
        }, { threshold: 0.02, rootMargin: '100px 0px 100px 0px' });
        io.observe(viewport);

        // Tab visibility listener: stop loop when tab is backgrounded
        document.addEventListener('visibilitychange', () => {
          docVisible = !document.hidden;
          if (docVisible && sectionVisible) {
            startLoop();
          } else {
            stopLoop();
          }
        }, { passive: true });

        // Start loop if active
        startLoop();

        // ── Highlight / reset logic ──
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
            setTimeout(() => card.classList.add('revealed'), idx * 30);
            io.unobserve(card);
          });
        }, { rootMargin: '180px 0px 80px 0px', threshold: 0.01 });

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

      // ══════════════════════════════════════════════
      // CERTIFICATES LIGHTBOX MODAL VIEWER
      // ══════════════════════════════════════════════
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

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          window.closeCertModal();
        }
      }, { passive: true });
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
        var EJS_TEMPLATE_ID     = 'template_qcy1y3b';   // Main: visitor → vardhanbillakanti125@gmail.com
        var EJS_AUTOREPLY_ID    = 'template_10tkb1a';   // Auto-reply: portfolio → visitor
        var TO_EMAIL            = 'vardhanbillakanti125@gmail.com';
        // ─────────────────────────────────────────────────────────────────

        // Initialise EmailJS SDK with the public key
        function ensureEmailJSInit() {
          if (typeof emailjs !== 'undefined' && emailjs.init) {
            try {
              emailjs.init({ publicKey: EJS_PUBLIC_KEY });
            } catch (e) {
              console.warn('[ContactForm] emailjs.init error:', e);
            }
          }
        }
        ensureEmailJSInit();

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
            console.error('[ContactForm] EmailJS SDK is not defined on window.');
            return;
          }

          // Ensure initialized before sending
          ensureEmailJSInit();

          // Enter loading state — blocks duplicate submissions
          setLoading(true);
          setNotice('Sending\u2026', '');

          var rawName    = nameEl.value.trim();
          var rawEmail   = emailEl.value.trim();
          var rawPhone   = (phoneEl && phoneEl.value.trim()) ? phoneEl.value.trim() : 'Not provided';
          var rawSubject = (subjectEl && subjectEl.value.trim()) ? subjectEl.value.trim() : 'Portfolio Contact';
          var rawMessage = messageEl.value.trim();

          // Comprehensive template params covering all possible standard template tags
          var params = {
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

          // ── STEP 1: Send visitor's message to vardhanbillakanti125@gmail.com ──
          emailjs.send(EJS_SERVICE_ID, EJS_TEMPLATE_ID, params, EJS_PUBLIC_KEY)
            .then(function (response) {
              console.log('[ContactForm] EmailJS send SUCCESS:', response);

              // ── STEP 2: Send auto-reply to visitor (non-blocking) ──
              var autoReplyParams = {
                name:       rawName,
                from_name:  rawName,
                user_name:  rawName,
                email:      rawEmail,
                user_email: rawEmail,
                to_email:   rawEmail,
                reply_to:   rawEmail
              };

              emailjs.send(EJS_SERVICE_ID, EJS_AUTOREPLY_ID, autoReplyParams, EJS_PUBLIC_KEY)
                .then(function(autoRes) {
                  console.log('[ContactForm] Auto-reply send SUCCESS:', autoRes);
                })
                .catch(function (autoReplyErr) {
                  // Non-critical: visitor's original message was already delivered.
                  console.warn('[ContactForm] Auto-reply send error (non-critical):', autoReplyErr);
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

              // Detailed diagnostic console output
              console.error('[ContactForm] EmailJS send FAILED:');
              console.error('error.status:', err && err.status);
              console.error('error.text:', err && err.text);
              console.error('Complete error object:', err);
            });
        });
      })();

      // ── Initial Hash Navigation Handler (Smooth Return from /projects -> /#projects) ──
      (function handleInitialHash() {
        if (window.location.hash) {
          const hash = window.location.hash;
          const targetEl = document.querySelector(hash);
          if (targetEl) {
            // Instantly reveal all elements in the target section so there is zero flicker
            targetEl.querySelectorAll('.proj-card, .scroll-reveal, .about-reveal, .heading-reveal').forEach(el => {
              el.classList.add('in-view', 'revealed');
            });
            setTimeout(() => {
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 80);
          }
        }
      })();

    })();