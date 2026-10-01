"""
Comprehensive Static Site Synchronization Engine for Axel Karambizi Portfolio
Created by Gacondo Labs.
Synchronizes all data from admin/content.json across:
- index.html (Home & FAQ)
- projects/index.html (Projects)
- explore/index.html & blogs/index.html (Explore / Blogs)
- about/index.html (About & Timeline)
- contact/index.html (Contact)
- all project-detail and blog-detail pages
"""

import json
import os
import re

def sync_all():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    content_file = os.path.join(base_dir, 'admin', 'content.json')

    if not os.path.exists(content_file):
        print(f"Error: {content_file} not found.")
        return False

    with open(content_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    gen = data.get('general', {})
    nav = data.get('navigation', {})
    counters = data.get('counters', [])
    fp = data.get('featured_projects', [])
    mp = data.get('more_projects', [])
    exp = data.get('explore_stories', [])
    exp_h = data.get('explore_header', {})
    about = data.get('about', {})
    contact = data.get('contact', {})
    footer = data.get('footer', {})
    faqs = data.get('faq', [])

    def replace_nth_match(pattern, repl_func, text):
        matches = list(re.finditer(pattern, text))
        for i in reversed(range(len(matches))):
            m = matches[i]
            replacement = repl_func(i, m)
            text = text[:m.start()] + replacement + text[m.end():]
        return text

    def update_common(html, is_root=True):
        prefix = './' if is_root else '../'
        asset_prefix = './assets/' if is_root else '../assets/'

        # Suppress creator avatar & Available for work badge
        avatar_pattern = r'<div class="framer-brfihp" data-framer-name="Avatar &(?:amp;)? Button Wrap".*?</div></div></div></div></div>'
        html = re.sub(avatar_pattern, '', html, flags=re.DOTALL)
        if '.framer-brfihp' not in html:
            html = html.replace('</head>', '<style>.framer-brfihp, [data-framer-name*="Avatar & Button Wrap"] { display: none !important; }</style>\n</head>')

        # Copyright & Creator
        copy_text = footer.get('copyright', '© Copyright 2026. All Rights Reserved by Axel Karambizi')
        created_by = footer.get('created_by', 'Gacondo Labs')

        # Replace creator credit
        html = re.sub(r'Created by</p></div><div[^>]*>.*?</div><div[^>]*><p[^>]*><!--\$--><a[^>]*>[^<]*</a><!--/\$-->',
                      f'Created by</p></div><div class="framer-1oj5jgg"><div data-framer-background-image-wrapper="true" style="position:absolute;border-radius:inherit;top:0;right:0;bottom:0;left:0"><img alt="Creator Logo" decoding="auto" height="500" loading="eager" src="{asset_prefix}img_14.png" style="display:block;width:100%;height:100%;object-fit:contain" width="500"/></div></div><div class="framer-o6x19g" data-framer-component-type="RichTextContainer"><p class="framer-text framer-styles-preset-a6ucvx"><!--$--><a class="framer-text framer-styles-preset-14dsmp1" href="#" target="_blank">{created_by}</a><!--/$-->',
                      html, flags=re.DOTALL)
        html = html.replace('Duncan Shen', created_by)
        html = re.sub(r'[©c\?]\s*Copyright\s*2026\.\s*All\s*Rights\s*Reserved\s*by\s*[^<]+', copy_text, html)

        # Contact info & clean tel: links
        email = contact.get('email', 'hello@axelkarambizi.com')
        phone = contact.get('phone', '+250 788 749 709')
        clean_tel = re.sub(r'[^\d+]', '', phone)
        html = re.sub(r'mailto:[^"\'>\s]+', f'mailto:{email}', html)
        html = re.sub(r'>[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}<', f'>{email}<', html)
        html = re.sub(r'href="tel:[^"]*"', f'href="tel:{clean_tel}"', html)
        html = re.sub(r'>\+250\s*(?:788\s*749\s*709\s*)+<', f'>{phone}<', html)

        # Social links
        soc = footer.get('social', {})
        if soc.get('x'): html = re.sub(r'href="https://x\.com/[^"]*"', f'href="{soc.get("x")}"', html)
        if soc.get('instagram'): html = re.sub(r'href="https://www\.instagram\.com/[^"]*"', f'href="{soc.get("instagram")}"', html)
        if soc.get('behance'): html = re.sub(r'href="https://www\.behance\.net/[^"]*"', f'href="{soc.get("behance")}"', html)
        if soc.get('dribbble'): html = re.sub(r'href="https://dribbble\.com/[^"]*"', f'href="{soc.get("dribbble")}"', html)

        # Avatar
        avatar = gen.get('avatar_image', './assets/avatar.jpg')
        clean_avatar = asset_prefix + os.path.basename(avatar)
        html = re.sub(r'src="[^"]*(?:avatar|img_0|IUYr)[^"]*"', f'src="{clean_avatar}"', html)

        return html

    # ==========================================
    # 1. Update index.html
    # ==========================================
    index_path = os.path.join(base_dir, 'index.html')
    if os.path.exists(index_path):
        with open(index_path, 'r', encoding='utf-8') as f:
            html = f.read()

        html = update_common(html, is_root=True)

        # Hero Tagline
        tagline = gen.get('tagline', 'I’m a Kigali-based founder and builder of companies, communities and technology')
        html = re.sub(r'I’m a Kigali-based founder and builder of companies[^\<]*', tagline, html)

        # Hero Images
        front_img = gen.get('hero_front_image', './assets/hero_front_hd.jpg')
        back_img = gen.get('hero_back_image', './assets/hero_back_hd.jpg')
        html = re.sub(r'src="[^"]*(?:ONE90238|hero_front)[^"]*"', f'src="{front_img}"', html)
        html = re.sub(r'src="[^"]*(?:ONE90240|hero_back)[^"]*"', f'src="{back_img}"', html)

        # Counters
        if len(counters) >= 3:
            cnt_pattern = r'(<h2 class="framer-text[^"]*" data-styles-preset="TTqvVnbYq"[^>]*>)(.*?)(</h2>)'
            def cnt_repl(i, m):
                c_idx = i % 3
                if c_idx < len(counters):
                    return m.group(1) + counters[c_idx].get('number', '') + m.group(3)
                return m.group(0)
            html = replace_nth_match(cnt_pattern, cnt_repl, html)

        # Featured Projects Images
        for p in fp:
            img_path = p.get('image', '')
            p_id = p.get('id', '')
            if 'risevana' in p_id:
                html = re.sub(r'src="[^"]*project_risevana[^"]*"', f'src="{img_path}"', html)
            elif 'libblio' in p_id:
                html = re.sub(r'src="[^"]*project_libblio[^"]*"', f'src="{img_path}"', html)
            elif 'youth' in p_id:
                html = re.sub(r'src="[^"]*project_youth_uplift[^"]*"', f'src="{img_path}"', html)
            elif 'atomiq' in p_id:
                html = re.sub(r'src="[^"]*project_atomiq[^"]*"', f'src="{img_path}"', html)

        # FAQ Synchronization
        if faqs:
            faq_items_html = []
            for i, faq in enumerate(faqs):
                num = f"{i+1}."
                q = faq.get('question', '')
                a = faq.get('answer', '')
                is_first = (i == 0)
                active_class = "faq-active" if is_first else ""
                chevron_rot = "rotate(0deg)" if is_first else "rotate(180deg)"
                ans_style = "opacity: 1; max-height: 500px; padding: 12px 0 20px 36px;" if is_first else "opacity: 0; max-height: 0px; padding: 0 0 0 36px; overflow: hidden;"

                item = f"""<div class="framer-1demp92-container faq-item {active_class}" style="opacity: 1; width: 100%;">
  <div class="framer-2k6sY framer-vamxU framer-m8D3R framer-1d8qfhh framer-v-1d8qfhh" data-border="true" data-framer-name="Desktop / Closed" style="--border-bottom-width: 1px; --border-color: var(--token-a228d207-519c-4c30-ace3-fe8c17413ec0, rgb(218, 218, 218)); --border-left-width: 0px; --border-right-width: 0px; --border-style: solid; --border-top-width: 0px; width: 100%; opacity: 1;">
    <div class="framer-xyut35 faq-trigger" data-framer-name="Top" data-highlight="true" style="opacity: 1; cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding: 22px 0;" tabindex="0" role="button" aria-expanded="{'true' if is_first else 'false'}">
      <div class="framer-e6shww" data-framer-name="Text Wrap" style="opacity: 1; display: flex; align-items: baseline; gap: 16px;">
        <div class="framer-118mxo5" data-framer-component-type="RichTextContainer" style="--extracted-1eung3n: var(--token-a9f688eb-778b-4a71-929e-ebf8a014b4cf, rgb(48, 48, 48)); min-width: 24px;">
          <h4 class="framer-text framer-styles-preset-usoyrg" data-styles-preset="ilUlJnLkH" style="--framer-text-color:var(--extracted-1eung3n, var(--token-a9f688eb-778b-4a71-929e-ebf8a014b4cf, rgb(48, 48, 48)));">{num}</h4>
        </div>
        <div class="framer-eqt2pn" data-framer-component-type="RichTextContainer" style="--extracted-1eung3n: var(--token-a9f688eb-778b-4a71-929e-ebf8a014b4cf, rgb(48, 48, 48));">
          <h4 class="framer-text framer-styles-preset-usoyrg" data-styles-preset="ilUlJnLkH" style="--framer-text-color:var(--extracted-1eung3n, var(--token-a9f688eb-778b-4a71-929e-ebf8a014b4cf, rgb(48, 48, 48)));">{q}</h4>
        </div>
      </div>
      <div class="framer-1e2gxyp-container faq-chevron" style="transform: {chevron_rot}; opacity: 1; transition: transform 0.3s ease; flex-shrink: 0; margin-left: 16px;">
        <div style="display:contents">
          <svg color="var(--token-a9f688eb-778b-4a71-929e-ebf8a014b4cf, rgb(48, 48, 48))" fill="none" height="1.5em" stroke-width="1.5" style="width: 100%; height: 100%;" viewBox="0 0 24 24" width="100%" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </div>
      </div>
    </div>
    <div class="framer-1l7evow faq-answer" data-framer-name="Bottom" style="{ans_style}">
      <p class="framer-text framer-styles-preset-17cdd8a" data-styles-preset="UezruUh9E" style="--framer-text-alignment:left; --framer-text-color:var(--token-8b92a8, #8e8d88); line-height: 1.65; font-size: 15px; margin: 0;">{a}</p>
    </div>
  </div>
</div>"""
                faq_items_html.append(item)

            faq_rendered_str = "\n".join(faq_items_html)
            new_faq_block = f"""<div class="ssr-variant faq-responsive-wrap" style="display: block !important; width: 100%;">
  <div class="framer-1wntvpv-container" style="height: auto !important; min-height: auto; width: 100%;">
    <div class="framer-FNjt9 framer-149pei4 framer-v-149pei4" data-framer-name="Desktop" style="width: 100%; opacity: 1; height: auto !important;">
      <div class="framer-sicluc-container" style="transform: translateX(-50%); opacity: 1;"><!--$--><div></div><!--/$--></div>
      {faq_rendered_str}
    </div>
  </div>
</div>"""
            html = re.sub(r'<div class="ssr-variant faq-responsive-wrap".*?</div>\s*</div>\s*</div>\s*</div>',
                          new_faq_block, html, flags=re.DOTALL)

        if 'assets/faq-accordion.js' not in html:
            html = html.replace('</body>', '<script src="./assets/faq-accordion.js" defer></script>\n</body>')

        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(html)
        print("Updated: index.html")

    # ==========================================
    # 2. Update explore/index.html & blogs/index.html
    # ==========================================
    exp_path = os.path.join(base_dir, 'explore', 'index.html')
    if os.path.exists(exp_path):
        with open(exp_path, 'r', encoding='utf-8') as f:
            html_exp = f.read()

        html_exp = update_common(html_exp, is_root=False)

        # Header Title & Subtitle
        h_title = exp_h.get('heading', 'The World Is Too Alive to Stay in One Place')
        h_intro = exp_h.get('intro', 'I travel to see how people find clarity and purpose...')
        html_exp = re.sub(r'>The World Is Too Alive to Stay in One Place<', f'>{h_title}<', html_exp)
        html_exp = re.sub(r'I travel to see how people find clarity and purpose[^<]*', h_intro, html_exp)

        # Dates (54 matches, (i % 18) // 3)
        date_pattern = r'(<div class="[^"]*" data-framer-name="Date"[^>]*><p class="[^"]*"[^>]*>)(.*?)(</p></div>)'
        def date_repl(i, m):
            s_idx = (i % 18) // 3
            if s_idx < len(exp):
                return m.group(1) + exp[s_idx].get('date', '') + m.group(3)
            return m.group(0)
        html_exp = replace_nth_match(date_pattern, date_repl, html_exp)

        # Titles (54 matches)
        title_pattern = r'(<div class="[^"]*" data-framer-name="Title"[^>]*><h3 class="[^"]*"[^>]*>)(.*?)(</h3></div>)'
        def title_repl(i, m):
            s_idx = (i % 18) // 3
            if s_idx < len(exp):
                return m.group(1) + exp[s_idx].get('title', '') + m.group(3)
            return m.group(0)
        html_exp = replace_nth_match(title_pattern, title_repl, html_exp)

        # Descriptions (54 matches)
        desc_pattern = r'(<div class="[^"]*" data-framer-name="Description"[^>]*><p class="[^"]*"[^>]*>)(.*?)(</p></div>)'
        def desc_repl(i, m):
            s_idx = (i % 18) // 3
            if s_idx < len(exp):
                return m.group(1) + exp[s_idx].get('excerpt', '') + m.group(3)
            return m.group(0)
        html_exp = replace_nth_match(desc_pattern, desc_repl, html_exp)

        # Images (27 matches)
        img_pattern = r'(<img[^>]+src=")([^"]*)("[^>]*alt="Blog Cover Image"[^>]*>)'
        def img_repl(i, m):
            s_idx = (i % 18) // 3
            if s_idx < len(exp):
                img_path = exp[s_idx].get('image', '').replace('./', '../')
                return m.group(1) + img_path + m.group(3)
            return m.group(0)
        html_exp = replace_nth_match(img_pattern, img_repl, html_exp)

        # Fix relative links in explore
        html_exp = html_exp.replace('href="./blogs/', 'href="../blogs/')

        with open(exp_path, 'w', encoding='utf-8') as f:
            f.write(html_exp)
        print("Updated: explore/index.html")

        # Also sync to blogs/index.html
        blogs_path = os.path.join(base_dir, 'blogs', 'index.html')
        html_blogs = html_exp.replace('href="../blogs/', 'href="./')
        with open(blogs_path, 'w', encoding='utf-8') as f:
            f.write(html_blogs)
        print("Updated: blogs/index.html")

    # ==========================================
    # 3. Update projects/index.html
    # ==========================================
    proj_path = os.path.join(base_dir, 'projects', 'index.html')
    if os.path.exists(proj_path):
        with open(proj_path, 'r', encoding='utf-8') as f:
            html_proj = f.read()

        html_proj = update_common(html_proj, is_root=False)

        # Featured projects h2 tags (27 matches)
        h2_pattern = r'(<h2 class="framer-text[^"]*"[^>]*>)(.*?)(</h2>)'
        def h2_repl(i, m):
            group_idx = i % 9
            if group_idx < 8:
                p_idx = group_idx // 2
                if p_idx < len(fp):
                    return m.group(1) + fp[p_idx].get('title', '') + m.group(3)
            return m.group(0)
        html_proj = replace_nth_match(h2_pattern, h2_repl, html_proj)

        # Featured projects images
        for p in fp:
            img_path = p.get('image', '').replace('./', '../')
            p_id = p.get('id', '')
            if 'risevana' in p_id:
                html_proj = re.sub(r'src="[^"]*project_risevana[^"]*"', f'src="{img_path}"', html_proj)
            elif 'libblio' in p_id:
                html_proj = re.sub(r'src="[^"]*project_libblio[^"]*"', f'src="{img_path}"', html_proj)
            elif 'youth' in p_id:
                html_proj = re.sub(r'src="[^"]*project_youth_uplift[^"]*"', f'src="{img_path}"', html_proj)
            elif 'atomiq' in p_id:
                html_proj = re.sub(r'src="[^"]*project_atomiq[^"]*"', f'src="{img_path}"', html_proj)

        with open(proj_path, 'w', encoding='utf-8') as f:
            f.write(html_proj)
        print("Updated: projects/index.html")

    # ==========================================
    # 4. Update about/index.html
    # ==========================================
    about_path = os.path.join(base_dir, 'about', 'index.html')
    if os.path.exists(about_path):
        with open(about_path, 'r', encoding='utf-8') as f:
            html_about = f.read()

        html_about = update_common(html_about, is_root=False)

        # Bio Paragraphs
        p1 = about.get('paragraph_1', '')
        p2 = about.get('paragraph_2', '')
        if p1:
            html_about = re.sub(r'I’m a founder and builder from Kigali, Rwanda[^\<]*', p1, html_about)
        if p2:
            html_about = re.sub(r'I grew up believing opportunity could be on the other side[^\<]*', p2, html_about)

        # Learning Stack Intro
        intro = about.get('learning_stack_intro', '')
        if intro:
            html_about = re.sub(r'I learn by doing\. Here is what I’m actively mastering[^\<]*', intro, html_about)

        # Portrait Image
        portrait = about.get('portrait_image', './assets/contact_portrait.jpg').replace('./', '../')
        html_about = re.sub(r'src="[^"]*(?:ONE90235|contact_portrait)[^"]*"', f'src="{portrait}"', html_about)

        with open(about_path, 'w', encoding='utf-8') as f:
            f.write(html_about)
        print("Updated: about/index.html")

    # ==========================================
    # 5. Update contact/index.html
    # ==========================================
    contact_path = os.path.join(base_dir, 'contact', 'index.html')
    if os.path.exists(contact_path):
        with open(contact_path, 'r', encoding='utf-8') as f:
            html_contact = f.read()

        html_contact = update_common(html_contact, is_root=False)

        # Heading & Intro
        c_heading = contact.get('heading', 'Let’s build something.')
        c_intro = contact.get('intro', '')
        if c_heading:
            html_contact = re.sub(r'>Let’s build something\.<', f'>{c_heading}<', html_contact)
        if c_intro:
            html_contact = re.sub(r'Have a project in mind[^\<]*', c_intro, html_contact)

        portrait = contact.get('portrait_image', './assets/contact_portrait.jpg').replace('./', '../')
        html_contact = re.sub(r'src="[^"]*(?:ONE90235|contact_portrait)[^"]*"', f'src="{portrait}"', html_contact)

        with open(contact_path, 'w', encoding='utf-8') as f:
            f.write(html_contact)
        print("Updated: contact/index.html")

    # ==========================================
    # 6. Update all other HTML files (blogs & project details)
    # ==========================================
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.html') and 'admin' not in root:
                file_path = os.path.join(root, file)
                rel_p = os.path.relpath(file_path, base_dir)
                if rel_p in ['index.html', 'about/index.html', 'projects/index.html', 'explore/index.html', 'blogs/index.html']:
                    continue
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                content = update_common(content, is_root=False)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)

    print("ALL SITE PAGES SYNCHRONIZED SUCCESSFULLY!")
    return True

if __name__ == '__main__':
    sync_all()
