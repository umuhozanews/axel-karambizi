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
  html = html.replace(/Duncan Shen/g, createdBy);
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
  if (soc.behance) html = html.replace(/href="https:\/\/www\.behance\.net\/[^"]*"/g, `href="${soc.behance}"`);
  if (soc.dribbble) html = html.replace(/href="https:\/\/dribbble\.com\/[^"]*"/g, `href="${soc.dribbble}"`);

  // Avatar
  const avatar = gen.avatar_image || './assets/avatar.jpg';
  const avatarBasename = avatar.split('/').pop();
  const cleanAvatar = `${assetPrefix}${avatarBasename}`;
  html = html.replace(/src="[^"]*(?:avatar|img_0|IUYr)[^"]*"/g, `src="${cleanAvatar}"`);

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

  // Services
  if (services && services.length > 0) {
    const s1 = services[0];
    const s1Title = s1.title || '1. ui/ux design';
    const s1Items = s1.items || [];
    html = html.replace(/>1\.\s*(?:software\s*&\s*design|ui\/ux\s*design)</gi, `>${s1Title}<`);

    const oldItemDefaults = [
      'Custom software systems and digital solutions|Wireframing and prototyping',
      'EdTech and library intelligence platforms|User Interface design for web and mobile apps',
      'Design and software agency work with Atomiq|Usability testing and user feedback analysis',
      'AI-powered tools built to be useful|Interaction design and micro-interactions'
    ];
    oldItemDefaults.forEach((pat, idx) => {
      if (idx < s1Items.length) {
        html = html.replace(new RegExp(`>(${pat})<`, 'g'), `>${s1Items[idx]}<`);
      }
    });
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

  // 4. More Projects cards
  const cardPattern = /(<p class="framer-text framer-styles-preset-a6ucvx"[^>]*>)[^<]+(<\/p><\/div><\/div><div class="framer-a27xm9" data-framer-name="Title"[^>]*><h3 class="framer-text framer-styles-preset-12q7ivy"[^>]*>)[^<]+(<\/h3><\/div><div class="framer-5wou89" data-framer-name="Description"[^>]*><p class="framer-text framer-styles-preset-a6ucvx"[^>]*>)[^<]+(<\/p><\/div>)/g;
  const cardMatches = [];
  let cardM;
  while ((cardM = cardPattern.exec(html)) !== null) {
    cardMatches.push({ start: cardM.index, end: cardM.index + cardM[0].length, groups: [...cardM] });
  }

  for (let i = cardMatches.length - 1; i >= 0; i--) {
    const item = cardMatches[i];
    const projIdx = i % 4;
    if (projIdx < mp.length) {
      const proj = mp[projIdx];
      const rep = (
        item.groups[1] + (proj.category || '') +
        item.groups[2] + (proj.title || '') +
        item.groups[3] + (proj.description || '') +
        item.groups[4]
      );
      html = html.slice(0, item.start) + rep + html.slice(item.end);
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
