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
        const avUrl = resolvePath(g.avatar_image);
        document.querySelectorAll('.framer-GmZel img, [data-framer-name="Avatar"] img').forEach(img => {
          img.src = avUrl;
        });
      }
      if (g.favicon_image) {
        const favUrl = resolvePath(g.favicon_image);
        document.querySelectorAll('link[rel*="icon"]').forEach(link => {
          link.href = favUrl;
        });
      }
      if (g.hero_front_image) {
        const hfUrl = resolvePath(g.hero_front_image);
        document.querySelectorAll('.framer-174865s img, img[alt*="Hero Front"], img[alt*="Axel Karambizi"]').forEach(img => {
          img.src = hfUrl;
        });
      }
      if (g.hero_back_image) {
        const hbUrl = resolvePath(g.hero_back_image);
        document.querySelectorAll('.framer-1y3f9q6 img, img[alt*="Hero Back"]').forEach(img => {
          img.src = hbUrl;
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

    // 4. Featured Projects Header & Cards
    if (data.featured_projects_header) {
      const fph = data.featured_projects_header;
      if (fph.heading) {
        document.querySelectorAll('.framer-vosmgd h2, .framer-h8of8r h1, [data-framer-name="Projects Heading"] h2').forEach(el => {
          el.textContent = fph.heading;
        });
      }
      if (fph.intro) {
        document.querySelectorAll('.framer-xwj3q5 p, .framer-12ja9n8 p, [data-framer-name="Projects Intro"] p').forEach(el => {
          el.textContent = fph.intro;
        });
      }
    }

    if (Array.isArray(data.featured_projects)) {
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
            if (img && p.image) img.src = resolvePath(p.image);

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
            // Delete removed cards from DOM
            card.style.display = 'none';
          }
        });
      }
    }

    // 5. More Projects Header & Cards
    if (data.more_projects_header) {
      const mph = data.more_projects_header;
      if (mph.heading) {
        document.querySelectorAll('.framer-1dv323k h2, [data-framer-name="More Projects Heading"] h2').forEach(el => {
          el.textContent = mph.heading;
        });
      }
    }

    if (Array.isArray(data.more_projects)) {
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
        document.querySelectorAll('.framer-dhjg6f p').forEach(p => {
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
          const a = card.querySelector('.framer-118mxo5 p, [data-framer-name="Bottom"] p, p');
          if (a && f.answer) a.textContent = f.answer;
        } else {
          card.style.display = 'none';
        }
      });
    }

    // 8. Explore Stories / Blogs
    if (data.explore_header) {
      const eh = data.explore_header;
      document.querySelectorAll('.framer-1m0m5yq h2, [data-framer-name="Explore Heading"] h2').forEach(el => {
        if (eh.heading) el.textContent = eh.heading;
      });
      document.querySelectorAll('.framer-8y2g0o p, [data-framer-name="Explore Intro"] p').forEach(el => {
        if (eh.intro) el.textContent = eh.intro;
      });
    }

    if (Array.isArray(data.explore_stories)) {
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
          if (img && s.image) img.src = resolvePath(s.image);

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
    }

    // 9. About Page & Timeline
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
        const pUrl = resolvePath(ab.portrait_image);
        document.querySelectorAll('.framer-zm9lgs img, img[alt*="About Portrait"]').forEach(img => {
          img.src = pUrl;
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
      if (ct.portrait_image) {
        const cpUrl = resolvePath(ct.portrait_image);
        document.querySelectorAll('.framer-1mflr40 img, img[alt*="Contact Portrait"]').forEach(img => {
          img.src = cpUrl;
        });
      }
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
        if (s.x) document.querySelectorAll('.framer-16ft3t1, a[href*="x.com"]').forEach(a => a.href = s.x);
        if (s.instagram) document.querySelectorAll('.framer-5grdll, a[href*="instagram.com"]').forEach(a => a.href = s.instagram);
        if (s.behance) document.querySelectorAll('.framer-1yo788g, a[href*="behance.net"]').forEach(a => a.href = s.behance);
        if (s.dribbble) document.querySelectorAll('.framer-15j1vxj, a[href*="dribbble.com"]').forEach(a => a.href = s.dribbble);
        if (s.linkedin) document.querySelectorAll('a[href*="linkedin.com"]').forEach(a => a.href = s.linkedin);
        if (s.github) document.querySelectorAll('a[href*="github.com"]').forEach(a => a.href = s.github);
      }
    }
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
