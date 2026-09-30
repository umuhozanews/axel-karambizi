"""
Comprehensive Static Site Synchronization Engine for Axel Karambizi Portfolio
Created by Gacondo Labs.
Synchronizes all data from admin/content.json across:
- index.html (Home)
- projects/index.html (Projects)
- explore/index.html & blogs/index.html (Explore / Blogs)
- about/index.html (About & Timeline)
- contact/index.html (Contact)
- project-detail/index.html & blog-detail/index.html
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

        # Contact info
        email = contact.get('email', 'hello@axelkarambizi.com')
        phone = contact.get('phone', '+250 788 749 709')
        html = re.sub(r'mailto:[^"\'>\s]+', f'mailto:{email}', html)
        html = re.sub(r'>[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}<', f'>{email}<', html)
        html = re.sub(r'tel:[^"\'>\s]+', f'tel:{phone}', html)
        html = re.sub(r'>\+250\s*788\s*749\s*709<', f'>{phone}<', html)

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

        with open(exp_path, 'w', encoding='utf-8') as f:
            f.write(html_exp)
        print("Updated: explore/index.html")

        # Also sync to blogs/index.html
        blogs_path = os.path.join(base_dir, 'blogs', 'index.html')
        with open(blogs_path, 'w', encoding='utf-8') as f:
            f.write(html_exp)
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
    # 6. Update all other HTML files (subpages)
    # ==========================================
    for sub in ['project-detail', 'blog-detail', 'work', '404']:
        sub_file = os.path.join(base_dir, sub, 'index.html')
        if os.path.exists(sub_file):
            with open(sub_file, 'r', encoding='utf-8') as f:
                html_sub = f.read()
            html_sub = update_common(html_sub, is_root=False)
            with open(sub_file, 'w', encoding='utf-8') as f:
                f.write(html_sub)
            print(f"Updated: {sub}/index.html")

    print("ALL SITE PAGES SYNCHRONIZED SUCCESSFULLY!")
    return True

if __name__ == '__main__':
    sync_all()
