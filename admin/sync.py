"""
Comprehensive Static Site Synchronization Engine for Axel Karambizi Portfolio
Created by Gacondo Labs.
Synchronizes all data from admin/content.json across:
- index.html (Home & FAQ)
- projects/index.html (Projects)
- explore/index.html & blogs/index.html (Explore / Blogs)
- about/index.html (About & Timeline & Process Steps)
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
    services = data.get('services', [])

    # Authentic project destination links
    proj_url_map = [
        (r'href="(?:\.\./)?(?:/)?projects/summer-vibes-festival-campaign/?"', 'href="https://risevana-foundation.vercel.app/" target="_blank" rel="noopener noreferrer"'),
        (r'href="(?:\.\./)?(?:/)?projects/coral-spiral-abstract/?"', 'href="https://www.libblio.com/" target="_blank" rel="noopener noreferrer"'),
        (r'href="(?:\.\./)?(?:/)?projects/shopease-redesign-sprint/?"', 'href="https://www.yupinitiative.com/" target="_blank" rel="noopener noreferrer"'),
        (r'href="(?:\.\./)?(?:/)?projects/black-geometric-prisms/?"', 'href="https://www.atomiq.rw/" target="_blank" rel="noopener noreferrer"'),
    ]

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

        # Status Badge & Button
        status_badge = nav.get('status_badge', 'Available for work')
        html = re.sub(r'>(?:Available for work|Looking for work|Open to work)<', f'>{status_badge}<', html)

        btn = nav.get('button', {})
        btn_lbl = btn.get('label', 'Contact')
        btn_url = btn.get('url', '#contact')
        html = re.sub(r'href="[^"]*#contact[^"]*"', f'href="{btn_url}"', html)

        # Favicon
        fav = gen.get('favicon_image', './assets/favicon.png')
        clean_fav = asset_prefix + os.path.basename(fav)
        html = re.sub(r'href="[^"]*favicon\.[^"]*"', f'href="{clean_fav}"', html)

        # Social links (matches all variants with or without trailing slash)
        soc = footer.get('social', {})
        if soc.get('x'):
            html = re.sub(r'href="https://(?:www\.)?(?:x|twitter)\.com(?:/[^"]*)?"', f'href="{soc.get("x")}"', html)
        if soc.get('instagram'):
            html = re.sub(r'href="https://(?:www\.)?instagram\.com(?:/[^"]*)?"', f'href="{soc.get("instagram")}"', html)
        if soc.get('behance'):
            html = re.sub(r'href="https://(?:www\.)?behance\.net(?:/[^"]*)?"', f'href="{soc.get("behance")}"', html)
        if soc.get('github'):
            html = re.sub(r'href="https://(?:www\.)?github\.com(?:/[^"]*)?"', f'href="{soc.get("github")}"', html)
        if soc.get('whatsapp'):
            html = re.sub(r'href="https://wa\.me/[^"]*"', f'href="{soc.get("whatsapp")}"', html)

        # Permanently eliminate Dribbble and convert all Dribbble slots to LinkedIn
        linkedin_url = soc.get('linkedin', 'https://www.linkedin.com/in/axel-karambizi-1633922a7/')
        html = re.sub(r'href="https://(?:www\.)?dribbble\.com(?:/[^"]*)?"', f'href="{linkedin_url}"', html)
        html = html.replace('"https://dribbble.com/"', f'"{linkedin_url}"')
        linkedin_path = 'M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24ZM96,192a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0Zm-8-96a12,12,0,1,1,12-12A12,12,0,0,1,88,96Zm112,96a8,8,0,0,1-16,0V144c0-13.23-10.77-24-24-24s-24,10.77-24,24v48a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0v8.69A39.81,39.81,0,0,1,176,104c22.06,0,40,17.94,40,40Z'
        html = re.sub(r'd="M93\.27,36\.86a4,4,0,0,1[^"]+75\.69,213\.25Z"', f'd="{linkedin_path}"', html)
        if soc.get('linkedin'):
            html = re.sub(r'href="https://(?:www\.)?linkedin\.com(?:/[^"]*)?"', f'href="{soc.get("linkedin")}"', html)

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
        clean_front = './assets/' + os.path.basename(front_img)
        clean_back = './assets/' + os.path.basename(back_img)
        html = re.sub(r'src="[^"]*(?:hero_front_hd|2o9r)[^"]*"', f'src="{clean_front}"', html)
        html = re.sub(r'src="[^"]*(?:hero_back_hd|9v8E)[^"]*"', f'src="{clean_back}"', html)

        # Counters
        if len(counters) >= 3:
            html = re.sub(r'>1,200\+<', f'>{counters[0].get("number", "1,200+")}<', html)
            html = re.sub(r'>Children Reached<', f'>{counters[0].get("label", "Children Reached")}<', html)
            html = re.sub(r'>20\+<', f'>{counters[1].get("number", "20+")}<', html)
            html = re.sub(r'>Products Deployed<', f'>{counters[1].get("label", "Products Deployed")}<', html)
            html = re.sub(r'>1,000\+<', f'>{counters[2].get("number", "1,000+")}<', html)
            html = re.sub(r'>Trees Planted<', f'>{counters[2].get("label", "Trees Planted")}<', html)

        # Services Section
        if len(services) > 0:
            s1 = services[0]
            s1_title = s1.get('title', '1. ui/ux design')
            s1_items = s1.get('items', [])
            html = re.sub(r'>1\.\s*(?:software\s*&\s*design|ui/ux\s*design)<', f'>{s1_title}<', html, flags=re.IGNORECASE)
            
            old_item_defaults = [
                r'Custom software systems and digital solutions|Wireframing and prototyping',
                r'EdTech and library intelligence platforms|User Interface design for web and mobile apps',
                r'Design and software agency work with Atomiq|Usability testing and user feedback analysis',
                r'AI-powered tools built to be useful|Interaction design and micro-interactions'
            ]
            for idx, pat in enumerate(old_item_defaults):
                if idx < len(s1_items):
                    html = re.sub(f'>({pat})<', f'>{s1_items[idx]}<', html)

        # Featured Projects Header
        fph = data.get('featured_projects_header', {})
        fp_heading = fph.get('heading', 'Featured Projects')
        fp_intro = fph.get('intro', '')
        if fp_heading:
            html = re.sub(r'>Featured Projects<', f'>{fp_heading}<', html)
        if fp_intro:
            html = re.sub(r'These selected projects reflect how I learn[^\<]*', fp_intro, html)

        # Services Header
        svh = data.get('services_header', {})
        sv_heading = svh.get('heading', 'what I can do for you')
        sv_intro = svh.get('intro', '')
        if sv_heading:
            html = re.sub(r'>what I can do for you<', f'>{sv_heading}<', html)
        if sv_intro:
            html = re.sub(r'I don’t have one box\. I build companies[^\<]*', sv_intro, html)

        # FAQ Header
        fqh = data.get('faq_header', {})
        fq_heading = fqh.get('heading', 'Frequently Asked Questions')
        fq_intro = fqh.get('intro', '')
        if fq_heading:
            html = re.sub(r'>Frequently Asked Questions<', f'>{fq_heading}<', html)
        if fq_intro:
            html = re.sub(r'Here are answers to some of the most common questions[^\<]*', fq_intro, html)

        for pat, repl in proj_url_map:
            html = re.sub(pat, repl, html)

        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(html)
        print("Updated: index.html")

    # ==========================================
    # 2. Update explore/index.html & blogs/index.html
    # ==========================================
    for target_rel in ['explore/index.html', 'blogs/index.html']:
        target_path = os.path.join(base_dir, *target_rel.split('/'))
        if not os.path.exists(target_path):
            continue

        with open(target_path, 'r', encoding='utf-8') as f:
            html_page = f.read()

        html_page = update_common(html_page, is_root=False)

        # Header Title & Subtitle
        h_title = exp_h.get('heading', 'The World Is Too Alive to Stay in One Place')
        h_intro = exp_h.get('intro', 'I travel to see how people find clarity and purpose...')
        html_page = re.sub(r'>The World Is Too Alive to Stay in One Place<', f'>{h_title}<', html_page)
        html_page = re.sub(r'I travel to see how people find clarity and purpose[^<]*', h_intro, html_page)

        # Dates
        modulo = max(1, len(exp) * 3) if len(exp) > 0 else 15
        date_pattern = r'(<div[^>]*data-framer-name="Date"[^>]*><p[^>]*>)(.*?)(</p></div>)'
        def date_repl(i, m):
            s_idx = (i % modulo) // 3
            if s_idx < len(exp):
                return m.group(1) + exp[s_idx].get('date', '') + m.group(3)
            return m.group(0)
        html_page = replace_nth_match(date_pattern, date_repl, html_page)

        # Titles
        title_pattern = r'(<div[^>]*data-framer-name="Title"[^>]*><h3[^>]*>)(.*?)(</h3></div>)'
        def title_repl(i, m):
            s_idx = (i % modulo) // 3
            if s_idx < len(exp):
                return m.group(1) + exp[s_idx].get('title', '') + m.group(3)
            return m.group(0)
        html_page = replace_nth_match(title_pattern, title_repl, html_page)

        # Descriptions
        desc_pattern = r'(<div[^>]*data-framer-name="Description"[^>]*><p[^>]*>)(.*?)(</p></div>)'
        def desc_repl(i, m):
            s_idx = (i % modulo) // 3
            if s_idx < len(exp):
                return m.group(1) + exp[s_idx].get('excerpt', '') + m.group(3)
            return m.group(0)
        html_page = replace_nth_match(desc_pattern, desc_repl, html_page)

        # Images & srcset removal/override
        for s in exp:
            if s.get('image'):
                img_path = s['image'].replace('./', '../')
                s_id = s.get('id', '')
                if s_id:
                    html_page = re.sub(rf'src="[^"]*{re.escape(os.path.basename(img_path))}[^"]*"', f'src="{img_path}"', html_page)

        # Strip any Framer bundle module script to prevent template hydration
        html_page = re.sub(r'<script[^>]*data-framer-bundle="main"[^>]*>.*?</script>', '', html_page)
        html_page = html_page.replace('>Insights<', '>Field Notes<')

        with open(target_path, 'w', encoding='utf-8') as f:
            f.write(html_page)
        print(f"Updated: {target_rel}")

    # ==========================================
    # 3. Update projects/index.html
    # ==========================================
    proj_path = os.path.join(base_dir, 'projects', 'index.html')
    if os.path.exists(proj_path):
        with open(proj_path, 'r', encoding='utf-8') as f:
            html_proj = f.read()

        html_proj = update_common(html_proj, is_root=False)

        # Featured projects: Update titles, categories, descriptions, images and srcset
        for idx, p in enumerate(fp):
            f_name = f'Featured Project - {idx+1}'
            img_path = p.get('image', '').replace('./', '../')
            p_title = p.get('title', '')
            p_cat = p.get('category', '')
            p_desc = p.get('description', '')
            p_link = p.get('link', '')

            # Match cards with data-framer-name="Featured Project - {idx+1}"
            # Replace img src and srcset
            if img_path:
                # Replace src & srcset on cards for this featured project
                pattern = rf'(data-framer-name="{f_name}".*?<img[^>]+src=")([^"]*)(")([^>]*>)'
                def img_card_repl(m):
                    tag = m.group(0)
                    tag = re.sub(r'src="[^"]*"', f'src="{img_path}"', tag)
                    tag = re.sub(r'srcset="[^"]*"', f'srcset="{img_path} 512w, {img_path} 1024w"', tag)
                    return tag
                html_proj = re.sub(rf'data-framer-name="{f_name}".*?</div></div></div>', img_card_repl, html_proj, flags=re.DOTALL)

        # More Projects cards synchronization (12 matches: 4 cards x 3 viewports)
        card_pattern = r'(<p class="framer-text framer-styles-preset-a6ucvx"[^>]*>)[^<]+(</p></div></div><div class="framer-a27xm9" data-framer-name="Title"[^>]*><h3 class="framer-text framer-styles-preset-12q7ivy"[^>]*>)[^<]+(</h3></div><div class="framer-5wou89" data-framer-name="Description"[^>]*><p class="framer-text framer-styles-preset-a6ucvx"[^>]*>)[^<]+(</p></div>)'
        card_matches = list(re.finditer(card_pattern, html_proj))
        for i in reversed(range(len(card_matches))):
            m = card_matches[i]
            proj_idx = (i // 3) % len(mp) if len(mp) > 0 else 0
            if proj_idx < len(mp):
                proj = mp[proj_idx]
                rep = (
                    m.group(1) + proj.get('category', '') +
                    m.group(2) + proj.get('title', '') +
                    m.group(3) + proj.get('description', '') +
                    m.group(4)
                )
                html_proj = html_proj[:m.start()] + rep + html_proj[m.end():]

        # Section Headers for Projects
        fph = data.get('featured_projects_header', {})
        fp_heading = fph.get('heading', 'Featured Projects')
        fp_intro = fph.get('intro', '')
        if fp_heading:
            html_proj = re.sub(r'>Featured Projects<', f'>{fp_heading}<', html_proj)
        if fp_intro:
            html_proj = re.sub(r'These selected projects reflect how I learn[^\<]*', fp_intro, html_proj)

        mph = data.get('more_projects_header', {})
        mp_heading = mph.get('heading', 'More Projects')
        if mp_heading:
            html_proj = re.sub(r'>More Projects<', f'>{mp_heading}<', html_proj)

        for pat, repl in proj_url_map:
            html_proj = re.sub(pat, repl, html_proj)

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

        # Header Titles
        ab_badge = about.get('badge', 'About me')
        ab_name = about.get('name', 'Axel Karambizi')
        if ab_badge:
            html_about = re.sub(r'>About me<', f'>{ab_badge}<', html_about)
        if ab_name:
            html_about = re.sub(r'>Axel Karambizi<', f'>{ab_name}<', html_about)

        # Bio Paragraphs
        p1 = about.get('paragraph_1', '')
        p2 = about.get('paragraph_2', '')
        if p1:
            html_about = re.sub(r'I’m a founder and builder from Kigali, Rwanda[^\<]*', p1, html_about)
        if p2:
            html_about = re.sub(r'I grew up believing opportunity could be on the other side[^\<]*', p2, html_about)

        # Portrait Image & srcset override (clears ONE90235.jpg.jpeg)
        portrait = about.get('portrait_image', './assets/contact_portrait.jpg').replace('./', '../')
        html_about = re.sub(r'src="[^"]*(?:ONE90235|contact_portrait)[^"]*"', f'src="{portrait}"', html_about)
        html_about = re.sub(r'srcset="[^"]*ONE90235[^"]*"', f'srcset="{portrait} 620w"', html_about)

        # Process & Philosophy Section ("Building with Purpose and Curiosity")
        proc_h = about.get('process_header', {})
        proc_steps = about.get('process_steps', [])
        if proc_h.get('heading'):
            html_about = re.sub(r'Building with Purpose and Curiosity', proc_h['heading'], html_about)
        if proc_h.get('intro'):
            html_about = re.sub(r'My process starts with a real barrier and ends with something people can use, built alongside the people it is for\.', proc_h['intro'], html_about)

        default_titles = [
            'Find the Barrier',
            'Mobilize the Community',
            'Build Where Roads End',
            'Explore and Learn',
            'Become Useful'
        ]
        default_descs = [
            r'I like problems that don[’\']t have obvious answers\. It starts with spotting what stands between people and opportunity\.',
            r'Building anything that lasts means bringing people together and earning human trust\.',
            r'From classrooms to software, I ship systems that work where access is hardest\.',
            r'I travel and talk to founders to see how people find clarity, speed and purpose\.',
            r'I keep learning AI, business and storytelling so the next thing I build reaches further\.'
        ]

        for i, (old_t, old_d) in enumerate(zip(default_titles, default_descs)):
            if i < len(proc_steps):
                s = proc_steps[i]
                new_step = s.get('step', f'0{i+1}.')
                new_title = s.get('title', '')
                new_desc = s.get('description', '')
                old_num = f'0{i+1}.'
                html_about = re.sub(rf'(<h2 class="framer-text[^"]*"[^>]*>){re.escape(old_num)}(</h2>)', rf'\g<1>{new_step}\g<2>', html_about)
                html_about = re.sub(rf'(<h3 class="framer-text[^"]*"[^>]*>){re.escape(old_t)}(</h3>)', rf'\g<1>{new_title}\g<2>', html_about)
                html_about = re.sub(old_d, new_desc, html_about)

        # Journey & Learning Headings
        j_heading = about.get('journey_heading', 'Discover My Journey')
        j_intro = about.get('journey_intro', '')
        if j_heading:
            html_about = re.sub(r'>Discover My Journey<', f'>{j_heading}<', html_about)
        if j_intro:
            html_about = re.sub(r'From a river crossing in rural Rwanda to software running in 20\+ institutions[^\<]*', j_intro, html_about)

        l_heading = about.get('learning_heading', 'What I’m Becoming')
        if l_heading:
            html_about = re.sub(r'>What I’m Becoming<', f'>{l_heading}<', html_about)

        intro = about.get('learning_stack_intro', '')
        if intro:
            html_about = re.sub(r'I learn by doing\. Here is what I’m actively mastering[^\<]*', intro, html_about)

        # External Live Journey Links
        html_about = re.sub(r'>Risevana Foundation(?: ↗)?</h3>', '><a href="https://risevana-foundation.vercel.app/" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none;display:inline-block">Risevana Foundation ↗</a></h3>', html_about)
        html_about = re.sub(r'>Libblio(?: ↗)?</h3>', '><a href="https://www.libblio.com/" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none;display:inline-block">Libblio ↗</a></h3>', html_about)
        html_about = re.sub(r'>Atomiq(?: ↗)?</h3>', '><a href="https://www.atomiq.rw/" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none;display:inline-block">Atomiq ↗</a></h3>', html_about)
        html_about = re.sub(r'>Youth Uplift Initiative(?: ↗)?</h3>', '><a href="https://www.yupinitiative.com/" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none;display:inline-block">Youth Uplift Initiative ↗</a></h3>', html_about)

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
        dirs[:] = [d for d in dirs if d not in ['.git', '.vercel', '.wrangler', 'node_modules', 'admin', '.deploy', 'scratch']]
        for file in files:
            if file.endswith('.html') and 'admin' not in root:
                file_path = os.path.join(root, file)
                rel_p = os.path.relpath(file_path, base_dir)
                if rel_p in ['index.html', 'about/index.html', 'projects/index.html', 'explore/index.html', 'blogs/index.html']:
                    continue
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                        content = f.read()
                    is_root = (os.path.dirname(rel_p) == '')
                    content = update_common(content, is_root=is_root)
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                except Exception as e:
                    print(f"Skipping {rel_p}: {e}")

    print("ALL SITE PAGES SYNCHRONIZED SUCCESSFULLY!")
    return True

if __name__ == '__main__':
    sync_all()
