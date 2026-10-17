/**
 * Universal Dynamic Content Synchronizer
 * Connects the live website directly to Supabase / Content API.
 * Ensures that every line, section header, text, card, link, and image is 100% dynamic and editable in real-time.
 */
(function() {
  'use strict';

  function resolvePath(url) {
    if (!url || typeof url !== 'string') return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const isRoot = window.location.pathname === '/' || (window.location.pathname.endsWith('/index.html') && !window.location.pathname.includes('/', 1));
    const clean = url.replace(/^\.\//, '');
    return (isRoot ? './' : '../') + clean;
  }

  function setSafeImage(img, src) {
    if (!img || !src) return;
    const resolved = resolvePath(src);
    img.src = resolved;
    img.removeAttribute('srcset');
    img.srcset = resolved + ' 1x';
  }

  async function loadAndApplyContent() {
    try {
      const res = await fetch('/api/content?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data || typeof data !== 'object') return;
      window.__SITE_DATA = data;
      applyDynamicContent(data);
    } catch (e) {
      console.warn('[SiteSync] Offline or content fetch notice:', e);
    }
  }

  function applyDynamicContent(data) {
    // 1. Navigation & Brand
    if (data.navigation) {
      if (data.navigation.status_badge) {
        document.querySelectorAll('.framer-8o415l p, [data-framer-name*="Badge"] p').forEach(el => {
          if (el.textContent.includes('Available') || el.textContent.includes('work') || el.dataset.sync === 'badge') {
            el.textContent = data.navigation.status_badge;
            el.dataset.sync = 'badge';
          }
        });
      }
      if (data.navigation.button) {
        if (data.navigation.button.label) {
          document.querySelectorAll('.framer-gBieo p, [data-framer-name="Contact Button"] p').forEach(el => {
            el.textContent = data.navigation.button.label;
          });
        }
        if (data.navigation.button.url) {
          document.querySelectorAll('.framer-gBieo a, [data-framer-name="Contact Button"] a').forEach(a => {
            a.href = data.navigation.button.url;
          });
        }
      }
    }

    // 2. General, Hero & Favicon
    if (data.general) {
      const g = data.general;
      if (g.name) {
        document.querySelectorAll('.framer-r8sngb p, [data-framer-name="Name"] p, .brand-name').forEach(el => {
          el.textContent = g.name;
        });
      }
      if (g.badge) {
        document.querySelectorAll('.framer-1txd3hn p, [data-framer-name="Greeting"] p').forEach(el => {
          el.textContent = g.badge;
        });
      }
      if (g.headline_1) {
        document.querySelectorAll('.framer-bmwyn h1, [data-framer-name="Headline 1"] h1').forEach(el => {
          el.textContent = g.headline_1;
        });
      }
      if (g.headline_2) {
        document.querySelectorAll('.framer-h6ciaq h1, [data-framer-name="Headline 2"] h1').forEach(el => {
          el.textContent = g.headline_2;
        });
      }
      if (g.tagline) {
        document.querySelectorAll('.framer-q5jzto p, [data-framer-name="Bio"] p').forEach(el => {
          el.textContent = g.tagline;
        });
      }
      if (g.avatar_image) {
        document.querySelectorAll('.framer-GmZel img, [data-framer-name="Avatar"] img').forEach(img => {
          setSafeImage(img, g.avatar_image);
        });
      }
      if (g.favicon_image) {
        const favUrl = resolvePath(g.favicon_image);
        document.querySelectorAll('link[rel*="icon"]').forEach(link => {
          link.href = favUrl;
        });
      }
      if (g.hero_front_image) {
        document.querySelectorAll('.framer-174865s img, img[alt*="Hero Front"], img[alt*="Axel Karambizi"]').forEach(img => {
          setSafeImage(img, g.hero_front_image);
        });
      }
      if (g.hero_back_image) {
        document.querySelectorAll('.framer-1y3f9q6 img, img[alt*="Hero Back"]').forEach(img => {
          setSafeImage(img, g.hero_back_image);
        });
      }
    }

    // 3. Metric Counters
    if (Array.isArray(data.counters) && data.counters.length > 0) {
      const numEls = document.querySelectorAll('.framer-bsCWJ h3, [data-framer-name="Count"] h3');
      const lblEls = document.querySelectorAll('.framer-nnrta1 p, [data-framer-name="Label"] p');
      data.counters.forEach((cnt, idx) => {
        if (numEls[idx] && cnt.number) numEls[idx].textContent = cnt.number;
        if (lblEls[idx] && cnt.label) lblEls[idx].textContent = cnt.label;
      });
    }

    // 4. Featured Projects Header & Cards (Home & Projects Page)
    if (data.featured_projects_header) {
      const fph = data.featured_projects_header;
      if (fph.heading) {
        document.querySelectorAll('.framer-vosmgd h2, .framer-h8of8r h1, [data-framer-name="Projects Heading"] h2, h1, h2').forEach(el => {
          if (el.textContent.trim().toLowerCase() === 'featured projects' || el.dataset.sync === 'fp-heading') {
            el.textContent = fph.heading;
            el.dataset.sync = 'fp-heading';
          }
        });
      }
      if (fph.intro) {
        document.querySelectorAll('.framer-xwj3q5 p, .framer-12ja9n8 p, [data-framer-name="Projects Intro"] p').forEach(el => {
          el.textContent = fph.intro;
        });
      }
    }

    if (Array.isArray(data.featured_projects)) {
      // Home page cards
      const projCards = document.querySelectorAll('.framer-1763177, .framer-ensd48-container, [data-framer-name="Featured Project Card"]');
      if (projCards.length > 0) {
        const activeProjects = data.featured_projects;
        projCards.forEach((card, idx) => {
          if (idx < activeProjects.length) {
            card.style.display = '';
            const p = activeProjects[idx];
            
            // Category
            const cat = card.querySelector('.framer-1rmvwl7 p, [data-framer-name="Category"] p');
            if (cat && p.category) cat.textContent = p.category;

            // Title
            const t = card.querySelector('.framer-qhutoj h2, .framer-qhutoj h3, [data-framer-name="Title"] h2, [data-framer-name="Title"] h3');
            if (t && p.title) t.textContent = p.title;

            // Description
            const d = card.querySelector('.framer-m8h9u9 p, .framer-ldojh2 p, [data-framer-name="Description"] p');
            if (d && p.description) d.textContent = p.description;

            // Image
            const img = card.querySelector('img');
            if (img && p.image) setSafeImage(img, p.image);

            // Direct Link handling
            if (p.link) {
              const aTag = card.querySelector('a') || (card.tagName === 'A' ? card : null);
              if (aTag) {
                aTag.href = p.link;
                aTag.target = "_blank";
                aTag.rel = "noopener noreferrer";
              }
              card.style.cursor = 'pointer';
              card.onclick = (e) => {
                if (e.target.tagName !== 'A') {
                  window.open(p.link, '_blank');
                }
              };
            }
          } else {
            card.style.display = 'none';
          }
        });
      }

      // Projects page cards (data-framer-name="Featured Project - 1", "Featured Project - 2", etc.)
      data.featured_projects.forEach((p, idx) => {
        const fCards = document.querySelectorAll(`[data-framer-name="Featured Project - ${idx + 1}"]`);
        fCards.forEach(card => {
          const t = card.querySelector('h2, h3');
          if (t && p.title) t.textContent = p.title;
          const paras = card.querySelectorAll('p');
          if (paras.length > 0 && p.category) paras[0].textContent = p.category;
          if (paras.length > 1 && p.description) paras[1].textContent = p.description;
          card.querySelectorAll('img').forEach(img => {
            if (p.image) setSafeImage(img, p.image);
          });
          if (p.link) {
            card.querySelectorAll('a').forEach(a => {
              a.href = p.link;
              a.target = "_blank";
              a.rel = "noopener noreferrer";
            });
            card.style.cursor = 'pointer';
            card.onclick = (e) => {
              if (e.target.tagName !== 'A') {
                window.open(p.link, '_blank');
              }
            };
          }
        });
      });
    }

    // 5. More Projects Header & Cards (Home & Projects Page)
    if (data.more_projects_header) {
      const mph = data.more_projects_header;
      if (mph.heading) {
        document.querySelectorAll('.framer-1dv323k h2, [data-framer-name="More Projects Heading"] h2, h2').forEach(el => {
          if (el.textContent.trim().toLowerCase() === 'more projects' || el.dataset.sync === 'mp-heading') {
            el.textContent = mph.heading;
            el.dataset.sync = 'mp-heading';
          }
        });
      }
    }

    if (Array.isArray(data.more_projects)) {
      // Home page cards
      const mpCards = document.querySelectorAll('.framer-1a6sfx9-container, [data-framer-name="Project Row"]');
      mpCards.forEach((card, idx) => {
        if (idx < data.more_projects.length) {
          card.style.display = '';
          const p = data.more_projects[idx];
          const t = card.querySelector('.framer-a27xm9 h3, h3');
          if (t && p.title) t.textContent = p.title;
          const c = card.querySelector('.framer-1qaut3e p, p');
          if (c && p.category) c.textContent = p.category;
          const d = card.querySelector('.framer-5wou89 p');
          if (d && p.description) d.textContent = p.description;
          const img = card.querySelector('img');
          if (img && p.image) setSafeImage(img, p.image);

          if (p.link) {
            const a = card.querySelector('a') || (card.tagName === 'A' ? card : null);
            if (a) {
              a.href = p.link;
              a.target = "_blank";
              a.rel = "noopener noreferrer";
            }
            card.style.cursor = 'pointer';
            card.onclick = (e) => {
              if (e.target.tagName !== 'A') {
                window.open(p.link, '_blank');
              }
            };
          }
        } else {
          card.style.display = 'none';
        }
      });

      // Projects page cards (.framer-1ef39wh-container)
      const projPageCards = document.querySelectorAll('.framer-1ef39wh-container');
      if (projPageCards.length > 0) {
        projPageCards.forEach((card, idx) => {
          const pIdx = Math.floor(idx / 3);
          if (pIdx < data.more_projects.length) {
            card.style.display = '';
            const p = data.more_projects[pIdx];
            const t = card.querySelector('h3');
            if (t && p.title) t.textContent = p.title;
            const paras = card.querySelectorAll('p');
            if (paras.length > 0 && p.category) paras[0].textContent = p.category;
            if (paras.length > 1 && p.description) paras[1].textContent = p.description;
            const img = card.querySelector('img');
            if (img && p.image) setSafeImage(img, p.image);

            if (p.link) {
              const a = card.querySelector('a') || (card.tagName === 'A' ? card : null);
              if (a) {
                a.href = p.link;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
              }
              card.style.cursor = 'pointer';
              card.onclick = (e) => {
                if (e.target.tagName !== 'A') {
                  window.open(p.link, '_blank');
                }
              };
            }
          } else {
            card.style.display = 'none';
          }
        });
      }
    }

    // 6. Services Header & Items
    if (data.services_header) {
      const svh = data.services_header;
      if (svh.heading) {
        document.querySelectorAll('h2').forEach(h2 => {
          if (h2.textContent.toLowerCase().includes('what i can do') || h2.dataset.sync === 'svc-heading') {
            h2.textContent = svh.heading;
            h2.dataset.sync = 'svc-heading';
          }
        });
      }
      if (svh.intro) {
        document.querySelectorAll('.framer-dhjg6f p, .framer-mh8pgw p').forEach(p => {
          p.textContent = svh.intro;
        });
      }
    }

    if (Array.isArray(data.services) && data.services.length > 0) {
      const titles = document.querySelectorAll('.framer-12x9h0a h3, [data-framer-name="Service Title"] h3');
      data.services.forEach((svc, sIdx) => {
        if (titles[sIdx] && svc.title) titles[sIdx].textContent = svc.title;
      });
    }

    // 7. FAQ Header & Items
    if (data.faq_header) {
      const fqh = data.faq_header;
      if (fqh.heading) {
        document.querySelectorAll('h2').forEach(h2 => {
          if (h2.textContent.toLowerCase().includes('frequently asked') || h2.dataset.sync === 'faq-heading') {
            h2.textContent = fqh.heading;
            h2.dataset.sync = 'faq-heading';
          }
        });
      }
      if (fqh.intro) {
        document.querySelectorAll('.framer-9bmrrp p').forEach(p => {
          p.textContent = fqh.intro;
        });
      }
    }

    if (Array.isArray(data.faq)) {
      const faqCards = document.querySelectorAll('.framer-2k6sY, [data-framer-name="FAQ Item"]');
      faqCards.forEach((card, idx) => {
        if (idx < data.faq.length) {
          card.style.display = '';
          const f = data.faq[idx];
          const q = card.querySelector('.framer-eqt2pn h4, h4');
          if (q && f.question) q.textContent = f.question;
          const a = card.querySelector('.framer-1l7evow p, [data-framer-name="Bottom"] p, .framer-118mxo5 p, p');
          if (a && f.answer) {
            a.textContent = f.answer;
            a.style.whiteSpace = 'normal';
            a.style.lineHeight = '1.75';
            a.style.overflow = 'visible';
            a.style.height = 'auto';
            a.style.wordBreak = 'normal';
          }
        } else {
          card.style.display = 'none';
        }
      });
    }

    // Ensure "My Story" button always links to /blogs/
    document.querySelectorAll('a').forEach(a => {
      if (a.textContent.trim().toLowerCase() === 'my story') {
        const isRoot = window.location.pathname === '/' || (window.location.pathname.endsWith('/index.html') && !window.location.pathname.includes('/', 1));
        const target = isRoot ? './blogs/' : '../blogs/';
        a.href = target;
        a.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = target;
        };
      }
    });

    // 8. Explore Stories / Blogs
    if (data.explore_header) {
      const eh = data.explore_header;
      document.querySelectorAll('.framer-1m0m5yq h2, [data-framer-name="Explore Heading"] h2, h2').forEach(el => {
        if (el.textContent.includes('The World Is Too Alive') || el.dataset.sync === 'exp-heading') {
          if (eh.heading) el.textContent = eh.heading;
          el.dataset.sync = 'exp-heading';
        }
      });
      document.querySelectorAll('.framer-8y2g0o p, [data-framer-name="Explore Intro"] p').forEach(el => {
        if (eh.intro) el.textContent = eh.intro;
      });
    }

    if (Array.isArray(data.explore_stories)) {
      // Home page cards
      const storyCards = document.querySelectorAll('.framer-1k3u20b, [data-framer-name="Story Card"], .framer-1x5y3c2-container');
      storyCards.forEach((card, idx) => {
        if (idx < data.explore_stories.length) {
          card.style.display = '';
          const s = data.explore_stories[idx];
          const t = card.querySelector('.framer-1i9yuzm h3, h3');
          if (t && s.title) t.textContent = s.title;
          const cat = card.querySelector('.framer-8i7wx2 p');
          if (cat && s.category) cat.textContent = s.category;
          const dt = card.querySelector('.framer-1y1o6q6 p');
          if (dt && s.date) dt.textContent = s.date;
          const exc = card.querySelector('.framer-1igatmi p, .framer-15p09p2 p');
          if (exc && s.excerpt) exc.textContent = s.excerpt;
          const img = card.querySelector('img');
          if (img && s.image) setSafeImage(img, s.image);

          if (s.link) {
            const aTag = card.querySelector('a') || (card.tagName === 'A' ? card : null);
            if (aTag) {
              aTag.href = s.link;
            }
            card.style.cursor = 'pointer';
            card.onclick = (e) => {
              if (e.target.tagName !== 'A') {
                window.location.href = s.link;
              }
            };
          }
        } else {
          card.style.display = 'none';
        }
      });

      // Blogs page (/blogs/) cards
      const blogKeys = ['lake-kivu-stillness', 'dubai-opportunity', 'cross-border-founders', 'people-i-met', 'lake-kivu-speed'];
      blogKeys.forEach((key, idx) => {
        if (idx < data.explore_stories.length) {
          const s = data.explore_stories[idx];
          document.querySelectorAll(`a[href*="${key}"]`).forEach(a => {
            const h3 = a.querySelector('h3');
            if (h3 && s.title) h3.textContent = s.title;
            const img = a.querySelector('img');
            if (img && s.image) setSafeImage(img, s.image);
            const paras = a.querySelectorAll('p');
            if (paras.length > 0 && s.category) paras[0].textContent = s.category;
            if (paras.length > 1 && s.date) paras[1].textContent = s.date;
            if (paras.length > 2 && s.excerpt) paras[2].textContent = s.excerpt;
          });
        }
      });
    }

    // 9. About Page & Process Steps
    if (data.about) {
      const ab = data.about;
      if (ab.badge) {
        document.querySelectorAll('.framer-monjet, h1.framer-text').forEach(h1 => {
          if (h1.textContent.toLowerCase().includes('about') || h1.dataset.sync === 'about-badge') {
            h1.textContent = ab.badge;
            h1.dataset.sync = 'about-badge';
          }
        });
      }
      if (ab.name) {
        document.querySelectorAll('.framer-d5arnx h3').forEach(h3 => {
          h3.textContent = ab.name;
        });
      }
      if (ab.paragraph_1) {
        document.querySelectorAll('.framer-k1r16h p, [data-framer-name="Paragraph 1"] p').forEach(el => {
          el.textContent = ab.paragraph_1;
        });
      }
      if (ab.paragraph_2) {
        document.querySelectorAll('.framer-1137aoi p, [data-framer-name="Paragraph 2"] p').forEach(el => {
          el.textContent = ab.paragraph_2;
        });
      }
      if (ab.portrait_image) {
        document.querySelectorAll('.framer-zm9lgs img, img[alt*="About Portrait"], img[alt*="Portrait of portfolio creator"]').forEach(img => {
          setSafeImage(img, ab.portrait_image);
        });
      }
      if (ab.journey_heading) {
        document.querySelectorAll('h2').forEach(h2 => {
          if (h2.textContent.toLowerCase().includes('journey') || h2.dataset.sync === 'journey-heading') {
            h2.textContent = ab.journey_heading;
            h2.dataset.sync = 'journey-heading';
          }
        });
      }
      if (ab.journey_intro) {
        document.querySelectorAll('.framer-7n26aa p').forEach(p => {
          p.textContent = ab.journey_intro;
        });
      }
      if (ab.learning_heading) {
        document.querySelectorAll('h2').forEach(h2 => {
          if (h2.textContent.toLowerCase().includes('becoming') || h2.dataset.sync === 'learn-heading') {
            h2.textContent = ab.learning_heading;
            h2.dataset.sync = 'learn-heading';
          }
        });
      }
      if (ab.learning_stack_intro) {
        document.querySelectorAll('.framer-19x9sd8 p, [data-framer-name="Learning Intro"] p').forEach(el => {
          el.textContent = ab.learning_stack_intro;
        });
      }

      // Process & Philosophy ("Building with Purpose and Curiosity")
      if (ab.process_header) {
        const ph = ab.process_header;
        if (ph.heading) {
          document.querySelectorAll('h2').forEach(h2 => {
            if (h2.textContent.includes('Building with Purpose') || h2.dataset.sync === 'proc-heading') {
              h2.textContent = ph.heading;
              h2.dataset.sync = 'proc-heading';
            }
          });
        }
        if (ph.intro) {
          document.querySelectorAll('.framer-kwmpg0 p').forEach(p => {
            p.textContent = ph.intro;
          });
        }
      }

      if (Array.isArray(ab.process_steps) && ab.process_steps.length > 0) {
        document.querySelectorAll('.framer-1u93412').forEach(grid => {
          const stepCards = grid.querySelectorAll('div[data-framer-name="Desktop"], div[data-framer-name="Tablet & Phone"]');
          const stepMap = { '01.': 0, '02.': 1, '03.': 2, '04.': 3, '05.': 4 };
          stepCards.forEach(card => {
            const h2 = card.querySelector('h2');
            if (!h2) return;
            const originalNum = h2.dataset.origNum || h2.textContent.trim();
            if (!h2.dataset.origNum) h2.dataset.origNum = originalNum;
            const stepIdx = stepMap[originalNum];
            if (typeof stepIdx === 'number') {
              if (stepIdx < ab.process_steps.length) {
                card.style.display = '';
                const stepData = ab.process_steps[stepIdx];
                if (stepData.step) h2.textContent = stepData.step;
                const h3 = card.querySelector('h3');
                if (h3 && stepData.title) h3.textContent = stepData.title;
                const p = card.querySelector('p');
                if (p && stepData.description) p.textContent = stepData.description;
              } else {
                card.style.display = 'none';
              }
            }
          });
        });
      }

      // Journey items
      if (Array.isArray(ab.journey)) {
        const jRows = document.querySelectorAll('.framer-journey-row, [data-framer-name="Journey Item"]');
        jRows.forEach((row, idx) => {
          if (idx < ab.journey.length) {
            row.style.display = '';
            const j = ab.journey[idx];
            const t = row.querySelector('.j-title, h4, h3');
            if (t && j.title) t.textContent = j.title;
            const c = row.querySelector('.j-comp, p');
            if (c && j.company) c.textContent = j.company;
            const y = row.querySelector('.j-years, span');
            if (y && j.years) y.textContent = j.years;
          } else {
            row.style.display = 'none';
          }
        });
      }
    }

    // 10. Contact & Footer
    if (data.contact) {
      const ct = data.contact;
      if (ct.heading) {
        document.querySelectorAll('.framer-1i7iup8 h2, [data-framer-name="Contact Heading"] h2').forEach(el => {
          el.textContent = ct.heading;
        });
      }
      if (ct.intro) {
        document.querySelectorAll('.framer-13dqa49 p, .framer-bvfcdv p').forEach(el => {
          el.textContent = ct.intro;
        });
      }
      if (ct.email) {
        document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
          a.href = 'mailto:' + ct.email;
          if (a.textContent.includes('@')) a.textContent = ct.email;
        });
      }
      if (ct.phone) {
        const cleanPhone = ct.phone.replace(/[^\d+]/g, '');
        document.querySelectorAll('a[href^="tel:"]').forEach(a => {
          a.href = 'tel:' + cleanPhone;
          if (a.textContent.includes('+')) a.textContent = ct.phone;
        });
      }
      if (ct.whatsapp) {
        document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
          a.href = ct.whatsapp;
        });
      }
      if (ct.form_action) {
        document.querySelectorAll('form[action*="formsubmit.co"]').forEach(form => {
          form.action = ct.form_action;
        });
      }
      if (ct.portrait_image) {
        document.querySelectorAll('.framer-1mflr40 img, img[alt*="Contact Portrait"]').forEach(img => {
          setSafeImage(img, ct.portrait_image);
        });
      }

      // Enhanced Contact Quick-Connect Actions Injection (WhatsApp, Email Copy, Call)
      injectEnhancedContactBar(ct);
    }

    if (data.footer) {
      const ft = data.footer;
      if (ft.copyright) {
        document.querySelectorAll('.framer-ppwbyj p, [data-framer-name="Copyright"] p').forEach(el => {
          el.textContent = ft.copyright;
        });
      }
      if (ft.created_by) {
        document.querySelectorAll('.framer-o6x19g a').forEach(a => {
          a.textContent = ft.created_by;
          if (ft.created_by_url) a.href = ft.created_by_url;
        });
      }
      if (ft.social) {
        const s = ft.social;
        if (s.x) document.querySelectorAll('.framer-16ft3t1, a[href*="x.com"], a[href*="twitter.com"]').forEach(a => a.href = s.x);
        if (s.instagram) document.querySelectorAll('.framer-5grdll, a[href*="instagram.com"]').forEach(a => a.href = s.instagram);
        if (s.behance) document.querySelectorAll('.framer-1yo788g, a[href*="behance.net"]').forEach(a => a.href = s.behance);
        if (s.github) document.querySelectorAll('a[href*="github.com"]').forEach(a => a.href = s.github);
        if (s.whatsapp) document.querySelectorAll('a[href*="wa.me"]').forEach(a => a.href = s.whatsapp);

        // Permanently transform or remove any Dribbble elements to LinkedIn
        const linkedinUrl = s.linkedin || (data.contact && data.contact.linkedin) || "https://www.linkedin.com/in/axel-karambizi-1633922a7/";
        document.querySelectorAll('.framer-15j1vxj, .framer-1gzurvg, .framer-1e8f6cw, a[href*="dribbble.com"]').forEach(a => {
          if (linkedinUrl) {
            a.href = linkedinUrl;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.setAttribute('aria-label', 'LinkedIn');
            a.title = 'Connect on LinkedIn';
            const svg = a.querySelector('svg');
            if (svg) {
              svg.innerHTML = '<g weight="fill"><path d="M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24ZM96,192a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0Zm-8-96a12,12,0,1,1,12-12A12,12,0,0,1,88,96Zm112,96a8,8,0,0,1-16,0V144c0-13.23-10.77-24-24-24s-24,10.77-24,24v48a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0v8.69A39.81,39.81,0,0,1,176,104c22.06,0,40,17.94,40,40Z"></path></g>';
            }
          } else {
            a.remove();
          }
        });
        if (s.linkedin) {
          document.querySelectorAll('a[href*="linkedin.com"]').forEach(a => a.href = s.linkedin);
        }
      }
    }

    // Ensure floating quick admin badge is present
    injectAdminQuickBadge();
  }

  function injectEnhancedContactBar(ct) {
    if (document.getElementById('enhanced-contact-bar')) return;
    const contactSection = document.getElementById('contact');
    if (!contactSection) return;

    const email = ct.email || 'hello@axelkarambizi.com';
    const phone = ct.phone || '+250 788 749 709';
    const whatsapp = ct.whatsapp || 'https://wa.me/250788749709';
    const location = ct.location || 'Kigali, Rwanda';

    const bar = document.createElement('div');
    bar.id = 'enhanced-contact-bar';
    bar.style.cssText = 'margin-top:24px; padding:18px 22px; background:rgba(21, 23, 34, 0.75); border:1px solid rgba(255, 255, 255, 0.1); border-radius:14px; backdrop-filter:blur(16px); display:flex; flex-wrap:wrap; gap:14px; align-items:center; justify-content:space-between; z-index:10;';

    bar.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <span style="display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:#27d974; background:rgba(39, 217, 116, 0.12); padding:4px 10px; border-radius:20px; border:1px solid rgba(39, 217, 116, 0.25);">
          <span style="width:7px; height:7px; border-radius:50%; background:#27d974; display:inline-block; box-shadow:0 0 6px #27d974;"></span>
          Available for new projects
        </span>
        <span style="font-size:12.5px; color:#8b92a8; display:inline-flex; align-items:center; gap:4px;">
          📍 ${location} · GMT+2
        </span>
      </div>
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <a href="${whatsapp}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; display:inline-flex; align-items:center; gap:7px; background:#25d366; color:#0c0d12; font-weight:700; font-size:12.5px; padding:8px 16px; border-radius:8px; transition:transform 0.2s, box-shadow 0.2s; box-shadow:0 4px 14px rgba(37, 211, 102, 0.3);">
          <svg style="width:16px; height:16px; fill:currentColor;" viewBox="0 0 256 256"><path d="M207.2,48.8A111.4,111.4,0,0,0,128,16,112,112,0,0,0,31,169.5L16,224l55.8-14.6A111.9,111.9,0,0,0,128,240h0a112,112,0,0,0,79.2-191.2ZM128,224a95.8,95.8,0,0,1-48.9-13.4l-3.5-2.1-36.4,9.5,9.7-35.4-2.3-3.7A96,96,0,1,1,128,224Zm52.6-70.1c-2.9-1.4-17-8.4-19.6-9.3s-4.5-1.4-6.4,1.4-7.4,9.3-9.1,11.2-3.4,2.1-6.3.7a79.5,79.5,0,0,1-23.4-14.4,87.6,87.6,0,0,1-16.2-20.2c-1.7-2.9-.2-4.5,1.3-5.9s2.9-3.4,4.3-5.1a19.4,19.4,0,0,0,2.9-4.8,5.4,5.4,0,0,0-.3-5.1c-.7-1.4-6.4-15.4-8.8-21.1s-4.7-4.8-6.4-4.9-3.6-.1-5.5-.1a10.6,10.6,0,0,0-7.7,3.6,32.4,32.4,0,0,0-10.1,24.1c0,14.2,10.3,27.9,11.8,29.9s20.3,31,49.2,43.5c6.9,3,12.2,4.8,16.4,6.1a39.4,39.4,0,0,0,18.1,1.1c5.5-.8,17-6.9,19.4-13.6s2.4-12.4,1.7-13.6C184,156,182.1,155.3,180.6,153.9Z"></path></svg>
          Chat on WhatsApp
        </a>
        <button type="button" id="btn-copy-email" onclick="copyContactEmail('${email}')" style="cursor:pointer; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#fff; font-size:12.5px; font-weight:600; padding:8px 14px; border-radius:8px; display:inline-flex; align-items:center; gap:6px; transition:all 0.2s;">
          ✉️ Copy Email
        </button>
        <a href="tel:${phone.replace(/[^\d+]/g, '')}" style="text-decoration:none; background:rgba(106, 113, 223, 0.15); border:1px solid rgba(106, 113, 223, 0.4); color:#fff; font-size:12.5px; font-weight:600; padding:8px 14px; border-radius:8px; display:inline-flex; align-items:center; gap:6px;">
          📞 Call
        </a>
      </div>
    `;

    const contactCol = contactSection.querySelector('.framer-3nw2d6, [data-framer-name="Contact Column"]') || contactSection;
    contactCol.appendChild(bar);
  }

  window.copyContactEmail = function(email) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email).then(() => {
        const btn = document.getElementById('btn-copy-email');
        if (btn) {
          const old = btn.innerHTML;
          btn.innerHTML = '✓ Copied!';
          btn.style.borderColor = '#27d974';
          btn.style.color = '#27d974';
          setTimeout(() => { btn.innerHTML = old; btn.style.borderColor = ''; btn.style.color = ''; }, 2500);
        }
      });
    } else {
      prompt('Axel Karambizi verified email:', email);
    }
  };

  function injectAdminQuickBadge() {
    if (document.getElementById('floating-admin-badge')) return;
    const badge = document.createElement('a');
    badge.id = 'floating-admin-badge';
    badge.href = '/admin/';
    badge.title = 'Open Admin CMS & Universal Content Editor';
    badge.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:99999; background:rgba(12, 13, 18, 0.88); border:1px solid rgba(106, 113, 223, 0.45); color:#fff; padding:7px 14px; border-radius:30px; font-size:12px; font-family:-apple-system, sans-serif; display:flex; align-items:center; gap:6px; text-decoration:none; box-shadow:0 8px 24px rgba(0,0,0,0.6); backdrop-filter:blur(12px); transition:transform 0.2s, border-color 0.2s; opacity:0.85;';
    badge.onmouseenter = () => { badge.style.opacity = '1'; badge.style.transform = 'translateY(-2px)'; badge.style.borderColor = '#27d974'; };
    badge.onmouseleave = () => { badge.style.opacity = '0.85'; badge.style.transform = 'translateY(0)'; badge.style.borderColor = 'rgba(106, 113, 223, 0.45)'; };
    badge.innerHTML = '<span style="color:#27d974; font-size:14px;">⚡</span> <strong style="font-weight:600;">Edit Site</strong>';
    document.body.appendChild(badge);
  }

  // Run on initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndApplyContent);
  } else {
    loadAndApplyContent();
  }

  // Re-apply after Framer finish hydration (500ms and 1500ms) to ensure nothing is reverted
  setTimeout(loadAndApplyContent, 500);
  setTimeout(loadAndApplyContent, 1500);

  // Expose global for instant sync from admin or console
  window.refreshSiteContent = loadAndApplyContent;
})();
