export function syncServicesHtml(html, services) {
  if (!Array.isArray(services) || services.length === 0) return html;
  const cardPattern = /(<div\s+class="[^"]*framer-1id3mzr[^"]*"[\s\S]*?)(?=(?:<div\s+class="[^"]*framer-1id3mzr[^"]*"|<\/section>|$))/g;
  const matches = [];
  let m;
  while ((m = cardPattern.exec(html)) !== null) {
    matches.push({ index: m.index, length: m[1].length, text: m[1] });
  }
  if (matches.length === 0) return html;

  const numServices = services.length;
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    let cardHtml = match.text;
    const svc = services[i % numServices];
    if (!svc) continue;

    // 1. Title
    if (svc.title) {
      cardHtml = cardHtml.replace(/(<h3[^>]*>)(.*?)(<\/h3>)/, `$1${svc.title}$3`);
    }

    // 2. Items
    const items = svc.items || [];
    const ofPos = cardHtml.indexOf('framer-of9a55');
    if (ofPos !== -1) {
      const divStart = cardHtml.lastIndexOf('<div', ofPos);
      const tagOpen = cardHtml.indexOf('>', divStart) + 1;
      let depth = 1;
      let idx = tagOpen;
      let divEnd = -1;
      while (idx < cardHtml.length && depth > 0) {
        const nextOpen = cardHtml.indexOf('<div', idx);
        const nextClose = cardHtml.indexOf('</div>', idx);
        if (nextClose === -1) break;
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          idx = nextOpen + 4;
        } else {
          depth--;
          if (depth === 0) {
            divEnd = nextClose;
            break;
          }
          idx = nextClose + 6;
        }
      }
      if (divEnd !== -1) {
        const bottomInner = cardHtml.slice(tagOpen, divEnd);
        const itemRegex = /(<div\s+class="framer-[a-z0-9]+-container"[^>]*>\s*<div\s+class="framer-hPZSA[\s\S]*?<\/div>\s*<\/div>)/g;
        const existingBlocks = [];
        let em;
        while ((em = itemRegex.exec(bottomInner)) !== null) {
          existingBlocks.push(em[1]);
        }
        if (existingBlocks.length > 0) {
          const sample = existingBlocks[0];
          const newBlocks = items.map((itmText, itmIdx) => {
            const base = (itmIdx < existingBlocks.length) ? existingBlocks[itmIdx] : sample;
            return base.replace(/(<div\s+class="framer-188sluc"[^>]*>\s*<p[^>]*>)(.*?)(<\/p>\s*<\/div>)/, `$1${itmText}$3`);
          });
          cardHtml = cardHtml.slice(0, tagOpen) + newBlocks.join('') + cardHtml.slice(divEnd);
        }
      }
    } else {
      const itemPattern = /(<div\s+class="framer-188sluc"[^>]*>\s*<p[^>]*>)(.*?)(<\/p>)/g;
      const cardItemMatches = [];
      let cim;
      while ((cim = itemPattern.exec(cardHtml)) !== null) {
        cardItemMatches.push(cim);
      }
      for (let j = cardItemMatches.length - 1; j >= 0; j--) {
        if (j < items.length) {
          const matched = cardItemMatches[j];
          cardHtml = cardHtml.slice(0, matched.index + matched[1].length) + items[j] + cardHtml.slice(matched.index + matched[1].length + matched[2].length);
        }
      }
    }

    html = html.slice(0, match.index) + cardHtml + html.slice(match.index + match.length);
  }
  return html;
}


/**
 * Node.js Static Site Synchronizer for Axel Karambizi Portfolio
 * Replicates admin/sync.py for cloud serverless execution.
 */

function replaceNthMatch(regex, replFunc, text) {
  const matches = [];
  let m;
  const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  while ((m = re.exec(text)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, groups: [...m] });
  }

  for (let i = matches.length - 1; i >= 0; i--) {
    const item = matches[i];
    const replacement = replFunc(i, item.groups);
    text = text.slice(0, item.start) + replacement + text.slice(item.end);
  }
  return text;
}

export function updateCommon(html, data, isRoot = true) {
  const assetPrefix = isRoot ? './assets/' : '../assets/';
  const footer = data.footer || {};
  const contact = data.contact || {};
  const gen = data.general || {};

  const copyText = footer.copyright || '© Copyright 2026. All Rights Reserved by Axel Karambizi';
  const createdBy = footer.created_by || 'Gacondo Labs';

  // Creator credit
  html = html.replace(
    /Created by<\/p><\/div><div[^>]*>.*?<\/div><div[^>]*><p[^>]*><!--\$--><a[^>]*>[^<]*<\/a><!--\/\$-->/s,
    `Created by</p></div><div class="framer-1oj5jgg"><div data-framer-background-image-wrapper="true" style="position:absolute;border-radius:inherit;top:0;right:0;bottom:0;left:0"><img alt="Creator Logo" decoding="auto" height="500" loading="eager" src="${assetPrefix}img_14.png" style="display:block;width:100%;height:100%;object-fit:contain" width="500"/></div></div><div class="framer-o6x19g" data-framer-component-type="RichTextContainer"><p class="framer-text framer-styles-preset-a6ucvx"><!--$--><a class="framer-text framer-styles-preset-14dsmp1" href="#" target="_blank">${createdBy}</a><!--/$-->`
  );
  html = html.replace(/Gacondo Labs/g, createdBy);
  html = html.replace(/[©c\?]\s*Copyright\s*2026\.\s*All\s*Rights\s*Reserved\s*by\s*[^<]+/g, copyText);

  // Contact info
  const email = contact.email || 'hello@axelkarambizi.com';
  const phone = contact.phone || '+250 788 749 709';
  const cleanTel = phone.replace(/[^\d+]/g, '');

  html = html.replace(/mailto:[^"'>\s]+/g, `mailto:${email}`);
  html = html.replace(/>[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}</g, `>${email}<`);
  html = html.replace(/href="tel:[^"]*"/g, `href="tel:${cleanTel}"`);
  html = html.replace(/>\+250\s*(?:788\s*749\s*709\s*)+</g, `>${phone}<`);

  // Social links
  const soc = footer.social || {};
  if (soc.x) html = html.replace(/href="https:\/\/x\.com\/[^"]*"/g, `href="${soc.x}"`);
  if (soc.instagram) html = html.replace(/href="https:\/\/www\.instagram\.com\/[^"]*"/g, `href="${soc.instagram}"`);
  // Permanently eliminate Behance
  html = html.replace(/<!--\$-->\s*<a[^>]*href="https:\/\/(?:www\.)?behance\.net\/?"[^>]*>[\s\S]*?<\/a>\s*<!--\/\$-->/g, '');
  html = html.replace(/<a[^>]*href="https:\/\/(?:www\.)?behance\.net\/?"[^>]*>[\s\S]*?<\/a>/g, '');
  html = html.replace(/\s*"https:\/\/(?:www\.)?behance\.net\/?",?\s*/g, '');
  if (soc.github) html = html.replace(/href="https:\/\/github\.com\/[^"]*"/g, `href="${soc.github}"`);
  if (soc.whatsapp) html = html.replace(/href="https:\/\/wa\.me\/[^"]*"/g, `href="${soc.whatsapp}"`);

  // Permanently eliminate Dribbble and convert all Dribbble slots to LinkedIn
  const linkedinUrl = soc.linkedin || 'https://www.linkedin.com/in/axel-karambizi-1633922a7/';
  html = html.replace(/href="https:\/\/dribbble\.com\/[^"]*"/g, `href="${linkedinUrl}"`);
  html = html.replace(/"https:\/\/dribbble\.com\/"/g, `"${linkedinUrl}"`);
  const linkedinPath = 'M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24ZM96,192a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0Zm-8-96a12,12,0,1,1,12-12A12,12,0,0,1,88,96Zm112,96a8,8,0,0,1-16,0V144c0-13.23-10.77-24-24-24s-24,10.77-24,24v48a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0v8.69A39.81,39.81,0,0,1,176,104c22.06,0,40,17.94,40,40Z';
  html = html.replace(/d="M93\.27,36\.86a4,4,0,0,1[^"]+75\.69,213\.25Z"/g, `d="${linkedinPath}"`);
  if (soc.linkedin) html = html.replace(/href="https:\/\/www\.linkedin\.com\/[^"]*"/g, `href="${soc.linkedin}"`);

  // Avatar
  const avatar = gen.avatar_image || './assets/avatar.jpg';
  const avatarBasename = avatar.split('/').pop();
  const cleanAvatar = `${assetPrefix}${avatarBasename}`;
  html = html.replace(/src="[^"]*(?:avatar|img_0|IUYr)[^"]*"/g, `src="${cleanAvatar}"`);

  // Remove description sentence overlay from project photos across all viewports
  html = html.replace(/<div class="framer-m8h9u9"[^>]*>[\s\S]*?<\/div>/g, '');
  html = html.replace(/<div class="framer-ldojh2"[^>]*>[\s\S]*?<\/div>/g, '');

  return html;
}

export function syncIndex(html, data) {
  html = updateCommon(html, data, true);
  const gen = data.general || {};
  const fp = data.featured_projects || [];
  const services = data.services || [];

  // Tagline
  if (gen.tagline) {
    html = html.replace(/I’m a Kigali-based founder and builder of companies[^<]*/g, gen.tagline);
  }

  // Hero Images
  if (gen.hero_front_image) {
    html = html.replace(/src="[^"]*(?:ONE90238|hero_front)[^"]*"/g, `src="${gen.hero_front_image}"`);
  }
  if (gen.hero_back_image) {
    html = html.replace(/src="[^"]*(?:ONE90240|hero_back)[^"]*"/g, `src="${gen.hero_back_image}"`);
  }

  // Featured Projects Images
  for (const p of fp) {
    const imgPath = p.image || '';
    const pId = p.id || '';
    if (pId.includes('risevana')) {
      html = html.replace(/src="[^"]*project_risevana[^"]*"/g, `src="${imgPath}"`);
    } else if (pId.includes('libblio')) {
      html = html.replace(/src="[^"]*project_libblio[^"]*"/g, `src="${imgPath}"`);
    } else if (pId.includes('youth')) {
      html = html.replace(/src="[^"]*project_youth_uplift[^"]*"/g, `src="${imgPath}"`);
    } else if (pId.includes('atomiq')) {
      html = html.replace(/src="[^"]*project_atomiq[^"]*"/g, `src="${imgPath}"`);
    }
  }

  // Services (Full dynamic sync of titles and all items)
  html = syncServicesHtml(html, services);

  // FAQ Header
  const fqh = data.faq_header || {};
  if (fqh.heading) {
    html = html.replace(/>Frequently Asked Questions</g, `>${fqh.heading}<`);
  }
  if (fqh.intro) {
    html = html.replace(/Here are answers to some of the most common questions[^<]*/g, fqh.intro);
  }

  // FAQ Items
  const faqs = data.faq || [];
  if (faqs.length > 0) {
    const numPattern = /(<div class="framer-xyut35"[^>]*>[\s\S]*?<div class="framer-118mxo5"[^>]*><h4[^>]*>)([^<]+)(<\/h4>)/g;
    html = replaceNthMatch(numPattern, (idx, groups) => {
      return groups[1] + `${idx + 1}.` + groups[3];
    }, html);

    const qPattern = /(<div class="framer-eqt2pn"[^>]*><h4[^>]*>)([^<]+)(<\/h4>)/g;
    html = replaceNthMatch(qPattern, (idx, groups) => {
      if (idx < faqs.length && faqs[idx].question) {
        return groups[1] + faqs[idx].question + groups[3];
      }
      return groups[0];
    }, html);

    const aPattern = /(<div class="framer-1l7evow"[^>]*>[\s\S]*?<p class="framer-text framer-styles-preset-17cdd8a"[^>]*>)([\s\S]*?)(<\/p>)/g;
    html = replaceNthMatch(aPattern, (idx, groups) => {
      if (idx < faqs.length && faqs[idx].answer) {
        return groups[1] + faqs[idx].answer + groups[3];
      }
      return groups[0];
    }, html);
  }

  // Enforce wrapping styles inline on answer paragraphs
  html = html.replace(
    /(<div class="framer-1l7evow"[^>]*>[\s\S]*?<p class="framer-text framer-styles-preset-17cdd8a"[^>]*)(style="[^"]*")/g,
    '$1style="--framer-text-alignment: left; --framer-text-color: var(--extracted-r6o4lv, var(--token-a9f688eb-778b-4a71-929e-ebf8a014b4cf, rgb(48, 48, 48))); line-height: 1.75; font-size: 15px; margin: 0; padding-top: 6px; padding-bottom: 8px; white-space: normal; overflow-wrap: break-word; word-break: normal; width: 100%; display: block;"'
  );

  // Remove fixed height on FAQ container
  html = html.replace(/style="height:\s*583\.594px;"/g, 'style="height: auto; min-height: auto;"');

  // My Story button links directly to about
  html = html.replace(/(<a [^>]*href=")[^"]*("[^>]*>(?:(?!<\/a>)[\s\S])*?My Story)/gi, '$1./about/$2');

  // Stories & Voices (Testimonials) synchronization
  const svH = data.stories_and_voices_header || {};
  if (svH.heading) {
    html = html.replace(/>Stories &amp; Voices</g, `>${svH.heading}<`);
  }
  if (svH.intro) {
    html = html.replace(/The missions I build for, in their own words[^<]*/g, svH.intro);
  }

  const svList = data.stories_and_voices || [];
  const gridMatch = html.match(/(<div class="framer-q6dtkm" data-framer-name="Testimonial Grid">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>)/);
  if (gridMatch && svList.length > 0) {
    const innerGrid = gridMatch[2];
    const parts = innerGrid.split('<div class="ssr-variant">');
    const existingCards = parts.slice(1).map(p => '<div class="ssr-variant">' + p);

    function updateStoryCard(cardHtml, story) {
      if (story.quote) {
        cardHtml = cardHtml.replace(/(<div [^>]*data-framer-name="Review"[^>]*>[\s\S]*?<p[^>]*>)([\s\S]*?)(<\/p><\/div>)/, `$1${story.quote}$3`);
      }
      if (story.name) {
        cardHtml = cardHtml.replace(/(<div [^>]*data-framer-name="Name"[^>]*>[\s\S]*?<p[^>]*>)([\s\S]*?)(<\/p><\/div>)/, `$1${story.name}$3`);
      }
      if (story.role) {
        cardHtml = cardHtml.replace(/(<div [^>]*data-framer-name="Title"[^>]*>[\s\S]*?<p[^>]*>)([\s\S]*?)(<\/p><\/div>)/, `$1${story.role}$3`);
      }
      if (story.image) {
        const cleanImg = story.image.replace('../', './');
        cardHtml = cardHtml.replace(/src="[^"]*"/g, `src="${cleanImg}"`);
        cardHtml = cardHtml.replace(/srcset="[^"]*"/g, `srcset="${cleanImg} 512w, ${cleanImg} 1024w"`);
      }
      return cardHtml;
    }

    const renderedSv = svList.map((story, idx) => {
      const tpl = idx < existingCards.length ? existingCards[idx] : existingCards[0];
      return updateStoryCard(tpl, story);
    });

    html = html.replace(gridMatch[0], gridMatch[1] + renderedSv.join('') + gridMatch[3]);
  }

  return html;
}

export function syncProjects(html, data) {
  html = updateCommon(html, data, false);
  const fp = data.featured_projects || [];
  const mp = data.more_projects || [];

  // 1. Featured projects h2 tags
  const h2Pattern = /(<h2 class="framer-text[^"]*"[^>]*>)(.*?)(<\/h2>)/g;
  html = replaceNthMatch(h2Pattern, (i, groups) => {
    const groupIdx = i % 9;
    if (groupIdx < 8) {
      const pIdx = Math.floor(groupIdx / 2);
      if (pIdx < fp.length && fp[pIdx].title) {
        return groups[1] + fp[pIdx].title + groups[3];
      }
    }
    return groups[0];
  }, html);

  // 2. Featured projects category badges
  const catPattern = /(data-framer-name="Category"[^>]*><p class="framer-text[^"]*"[^>]*>)(.*?)(<\/p>)/g;
  const catMatches = [];
  let cm;
  while ((cm = catPattern.exec(html)) !== null) {
    catMatches.push({ start: cm.index, end: cm.index + cm[0].length, groups: [...cm] });
  }
  for (let i = Math.min(12, catMatches.length) - 1; i >= 0; i--) {
    const item = catMatches[i];
    const pIdx = Math.floor(i / 3);
    if (pIdx < fp.length && fp[pIdx].category) {
      const rep = item.groups[1] + fp[pIdx].category + item.groups[3];
      html = html.slice(0, item.start) + rep + html.slice(item.end);
    }
  }

  // 3. Featured projects images
  for (const p of fp) {
    const imgPath = (p.image || '').replace('./', '../');
    const pId = p.id || '';
    if (pId.includes('risevana')) {
      html = html.replace(/src="[^"]*project_risevana[^"]*"/g, `src="${imgPath}"`);
    } else if (pId.includes('libblio')) {
      html = html.replace(/src="[^"]*project_libblio[^"]*"/g, `src="${imgPath}"`);
    } else if (pId.includes('youth')) {
      html = html.replace(/src="[^"]*project_youth_uplift[^"]*"/g, `src="${imgPath}"`);
    } else if (pId.includes('atomiq')) {
      html = html.replace(/src="[^"]*project_atomiq[^"]*"/g, `src="${imgPath}"`);
    }
  }

  // 4. More Projects cards dynamic synchronization (supports unlimited projects)
  const mpGridMatch = html.match(/(<div class="framer-1dajtd0">\s*<!--\$-->)([\s\S]*?)(\s*<div class="ssr-variant"><div class="framer-1hnbvt7-container"><\/div><\/div><!--\/\$-->\s*<\/div>)/);
  if (mpGridMatch && mp.length > 0) {
    const innerMp = mpGridMatch[2];
    const cardPattern = /<!--\$--><div class="ssr-variant hidden-15pqoqk hidden-1xpdcp1">[\s\S]*?<div class="ssr-variant hidden-1cl8viv hidden-1xpdcp1">[\s\S]*?<div class="ssr-variant hidden-1cl8viv hidden-15pqoqk">[\s\S]*?<\/div><\/div><!--\/\$-->/g;
    const cards = innerMp.match(cardPattern);
    const cardTemplate = cards && cards.length > 0 ? cards[0] : null;

    if (cardTemplate) {
      const renderedCards = mp.map(proj => {
        let card = cardTemplate;
        const pCat = proj.category || '';
        const pTitle = proj.title || '';
        const pDesc = proj.description || '';
        const pImg = (proj.image || '').replace('./', '../');
        const pLink = proj.link || '';

        if (pCat) {
          card = card.replace(/(<div class="framer-1qaut3e"[^>]*>[\s\S]*?<p[^>]*>)[^<]*(<\/p>)/g, `$1${pCat}$2`);
        }
        if (pTitle) {
          card = card.replace(/(<div class="framer-a27xm9"[^>]*>[\s\S]*?<h3[^>]*>)[^<]*(<\/h3>)/g, `$1${pTitle}$2`);
        }
        if (pDesc) {
          card = card.replace(/(<div class="framer-5wou89"[^>]*>[\s\S]*?<p[^>]*>)[^<]*(<\/p>)/g, `$1${pDesc}$2`);
        }
        if (pImg) {
          card = card.replace(/src="[^"]*"/g, `src="${pImg}"`);
          card = card.replace(/srcset="[^"]*"/g, `srcset="${pImg} 512w, ${pImg} 1024w, ${pImg} 1200w"`);
        }
        if (pLink) {
          card = card.replace(/href="[^"]*"/g, `href="${pLink}" target="_blank" rel="noopener noreferrer"`);
        } else {
          card = card.replace(/href="[^"]*"/g, 'href="#"');
        }
        return card;
      });

      html = html.replace(mpGridMatch[0], mpGridMatch[1] + renderedCards.join('') + mpGridMatch[3]);
    }
  }

  return html;
}

export function syncExplore(html, data) {
  html = updateCommon(html, data, false);
  const expH = data.explore_header || {};
  const exp = data.explore_stories || [];

  if (expH.heading) {
    html = html.replace(/>The World Is Too Alive to Stay in One Place</g, `>${expH.heading}<`);
  }
  if (expH.intro) {
    html = html.replace(/I travel to see how people find clarity and purpose[^<]*/g, expH.intro);
  }

  // Dates
  const datePattern = /(<div class="[^"]*" data-framer-name="Date"[^>]*><p class="[^"]*"[^>]*>)(.*?)(<\/p><\/div>)/g;
  html = replaceNthMatch(datePattern, (i, groups) => {
    const sIdx = Math.floor((i % 18) / 3);
    if (sIdx < exp.length && exp[sIdx].date) {
      return groups[1] + exp[sIdx].date + groups[3];
    }
    return groups[0];
  }, html);

  // Titles
  const titlePattern = /(<div class="[^"]*" data-framer-name="Title"[^>]*><h3 class="[^"]*"[^>]*>)(.*?)(<\/h3><\/div>)/g;
  html = replaceNthMatch(titlePattern, (i, groups) => {
    const sIdx = Math.floor((i % 18) / 3);
    if (sIdx < exp.length && exp[sIdx].title) {
      return groups[1] + exp[sIdx].title + groups[3];
    }
    return groups[0];
  }, html);

  // Descriptions
  const descPattern = /(<div class="[^"]*" data-framer-name="Description"[^>]*><p class="[^"]*"[^>]*>)(.*?)(<\/p><\/div>)/g;
  html = replaceNthMatch(descPattern, (i, groups) => {
    const sIdx = Math.floor((i % 18) / 3);
    if (sIdx < exp.length && exp[sIdx].excerpt) {
      return groups[1] + exp[sIdx].excerpt + groups[3];
    }
    return groups[0];
  }, html);

  // Images
  const imgPattern = /(<img[^>]+src=")([^"]*)("[^>]*alt="Blog Cover Image"[^>]*>)/g;
  html = replaceNthMatch(imgPattern, (i, groups) => {
    const sIdx = Math.floor((i % 18) / 3);
    if (sIdx < exp.length && exp[sIdx].image) {
      const imgPath = exp[sIdx].image.replace('./', '../');
      return groups[1] + imgPath + groups[3];
    }
    return groups[0];
  }, html);

  html = html.replace(/href="\.\/blogs\//g, 'href="../blogs/');
  return html;
}
