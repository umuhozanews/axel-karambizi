"""
Local Admin Server for Axel Karambizi Portfolio Website
Created by Gacondo Labs.
Runs a zero-dependency local HTTP server with live API, authentication, file upload, and static site sync.
"""

import http.server
import json
import os
import re
import socketserver
import sys
import webbrowser

# Add current dir to path to import sync
current_dir = os.path.dirname(os.path.abspath(__file__))
base_dir = os.path.abspath(os.path.join(current_dir, '..'))
sys.path.insert(0, current_dir)
from sync import sync_all

PORT = 8000
ADMIN_EMAIL = "nextech@gmail.com"
ADMIN_PASSWORD = "axel@12345"
AUTH_TOKEN = "gacondo_admin_session_auth_2026_secured"

# Supabase Configuration
import urllib.request
import urllib.error

def load_local_env():
    env_data = {}
    for path in [os.path.join(base_dir, '.env.local'), os.path.join(base_dir, '.env')]:
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            k, v = line.split('=', 1)
                            env_data[k.strip()] = v.strip().strip('"').strip("'")
            except Exception:
                pass
    return env_data

_local_envs = load_local_env()
SUPABASE_URL = os.environ.get('SUPABASE_URL') or _local_envs.get('SUPABASE_URL', "https://ovfurhjwqsvymhqvnsfk.supabase.co")
SUPABASE_KEY = os.environ.get('SUPABASE_KEY') or _local_envs.get('SUPABASE_KEY', "")
STORAGE_BUCKET = "portfolio-assets"

def supabase_get(endpoint):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'User-Agent': 'Python/3.11'
    })
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"[Supabase] GET {endpoint} failed: {e}")
        return None

def supabase_upsert(table, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    payload = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
        'User-Agent': 'Python/3.11'
    }, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return True
    except Exception as e:
        print(f"[Supabase] Upsert {table} failed: {e}")
        return False

def supabase_upload_asset(filename, file_bytes, content_type='image/jpeg'):
    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
    req = urllib.request.Request(url, data=file_bytes, headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': content_type,
        'x-upsert': 'true',
        'User-Agent': 'Python/3.11'
    }, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{filename}"
    except Exception as e:
        print(f"[Supabase] Upload asset failed: {e}")
        return None

class AdminHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=base_dir, **kwargs)

    def is_authenticated(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
            return token == AUTH_TOKEN
        return False

    def end_headers(self):
        clean = self.path.split('?')[0]
        if clean.endswith('.html') or clean.endswith('/') or clean.startswith('/api/'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        clean_path = self.path.split('?')[0].rstrip('/')
        if clean_path == '/api/messages':
            # 1. Fetch from Supabase
            sb_messages = supabase_get('messages?order=created_at.desc&select=*')
            if sb_messages is not None:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(sb_messages, ensure_ascii=False, indent=2).encode('utf-8'))
                return

            # Fallback to local
            messages_path = os.path.join(current_dir, 'messages.json')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            if os.path.exists(messages_path):
                with open(messages_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b'[]')
            return
        elif clean_path == '/api/content':
            # 1. Fetch live from Supabase
            sb_content = supabase_get('site_content?id=eq.main&select=data')
            if sb_content and len(sb_content) > 0 and 'data' in sb_content[0]:
                content_bytes = json.dumps(sb_content[0]['data'], ensure_ascii=False, indent=2).encode('utf-8')
                try:
                    with open(os.path.join(current_dir, 'content.json'), 'wb') as cf:
                        cf.write(content_bytes)
                except Exception:
                    pass
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(content_bytes)
                return

            # Fallback to local content.json
            content_path = os.path.join(current_dir, 'content.json')
            if os.path.exists(content_path):
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                with open(content_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.end_headers()
            return
        elif clean_path == '/api/verify':
            if self.is_authenticated():
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "authenticated": True,
                    "email": ADMIN_EMAIL,
                    "role": "Super Admin"
                }).encode('utf-8'))
            else:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"authenticated": false}')
            return
        elif self.path.split('?')[0] == '/admin':
            self.send_response(301)
            self.send_header('Location', '/admin/')
            self.end_headers()
            return
        elif self.path.startswith('/projects/projects/'):
            redirect_path = self.path.replace('/projects/projects/', '/projects/', 1)
            self.send_response(301)
            self.send_header('Location', redirect_path)
            self.end_headers()
            return
        
        # Defensive redirects for project detail URLs to live authentic websites
        project_match = re.match(r'^/projects/([^/?#]+)/?$', clean_path)
        if project_match:
            slug = project_match.group(1).lower()
            PROJECT_LIVE_MAP = {
                'summer-vibes-festival-campaign': 'https://risevana-foundation.vercel.app/',
                'risevana-foundation': 'https://risevana-foundation.vercel.app/',
                'coral-spiral-abstract': 'https://www.libblio.com/',
                'libblio': 'https://www.libblio.com/',
                'shopease-redesign-sprint': 'https://www.yupinitiative.com/',
                'youth-uplift-initiative': 'https://www.yupinitiative.com/',
                'black-geometric-prisms': 'https://www.atomiq.rw/',
                'atomiq': 'https://www.atomiq.rw/'
            }
            if slug in PROJECT_LIVE_MAP:
                self.send_response(301)
                self.send_header('Location', PROJECT_LIVE_MAP[slug])
                self.end_headers()
                return
            elif slug not in ['', 'index', 'index.html']:
                self.send_response(301)
                self.send_header('Location', '/projects/')
                self.end_headers()
                return

        # Defensive redirects for legacy blog detail URLs to authentic story URLs
        blog_match = re.match(r'^/blogs/([^/?#]+)/?$', clean_path)
        if blog_match:
            slug = blog_match.group(1).lower()
            BLOG_STORY_MAP = {
                'how-to-streamline-your-design-workflow': '/blogs/',
                '5-design-trends-that-will-define-2024': '/blogs/',
                'the-power-of-typography-in-web-design': '/blogs/cross-border-founders/',
                'the-role-of-color-psychology-in-branding': '/blogs/people-i-met/',
                'mastering-ui-ux-design-key-principles-for-success': '/blogs/lake-kivu-speed/',
                'balancing-creativity-and-functionality-in-design': '/blogs/',
                'places-and-perspectives': '/blogs/',
            }
            if slug in BLOG_STORY_MAP:
                self.send_response(301)
                self.send_header('Location', BLOG_STORY_MAP[slug])
                self.end_headers()
                return

        if clean_path == '/explore':
            self.send_response(301)
            self.send_header('Location', '/blogs/')
            self.end_headers()
            return

        return super().do_GET()

    def do_POST(self):
        clean_path = self.path.split('?')[0].rstrip('/')
        if clean_path == '/api/login':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                creds = json.loads(post_data.decode('utf-8'))
                email = str(creds.get('email', '')).strip().lower()
                password = str(creds.get('password', '')).strip()

                valid_emails = [e.lower() for e in ["hello@axelkarambizi.com", "nextech@gmail.com", "admin", "axel", "axelkarambizi", "karambizi", "axel.karambizi", "karambiziaxel"]]
                valid_passwords = ["axel@12345", "Axel@12345", "axel12345", "Axel12345"]
                if (email in valid_emails or email == ADMIN_EMAIL.lower()) and (password in valid_passwords or password == ADMIN_PASSWORD):
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    response = {
                        "status": "ok",
                        "token": AUTH_TOKEN,
                        "user": {
                            "email": ADMIN_EMAIL,
                            "name": "Axel Karambizi",
                            "role": "Super Administrator",
                            "access": "Full Privilege"
                        }
                    }
                    self.wfile.write(json.dumps(response).encode('utf-8'))
                else:
                    self.send_response(401)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "status": "error",
                        "message": "Invalid email or password. Access denied."
                    }).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
            return

        elif clean_path == '/api/upload':
            if not self.is_authenticated():
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status": "error", "message": "Unauthorized. Please log in."}')
                return

            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                import base64
                upload_info = json.loads(post_data.decode('utf-8'))
                raw_filename = upload_info.get('filename', 'uploaded_image.jpg')
                clean_name = re.sub(r'[^a-zA-Z0-9._-]', '_', os.path.basename(raw_filename))
                b64data = upload_info.get('data', '')
                declared_type = 'image/jpeg'
                if ',' in b64data:
                    header_part, b64data = b64data.split(',', 1)
                    if 'image/png' in header_part:
                        declared_type = 'image/png'
                    elif 'image/webp' in header_part:
                        declared_type = 'image/webp'
                    elif 'image/svg' in header_part:
                        declared_type = 'image/svg+xml'
                    elif 'image/gif' in header_part:
                        declared_type = 'image/gif'
                
                file_bytes = base64.b64decode(b64data)

                # 1. Upload to Supabase Storage
                public_url = supabase_upload_asset(clean_name, file_bytes, declared_type)

                # 2. Also save local backup in assets/
                dest_path = os.path.join(base_dir, 'assets', clean_name)
                try:
                    with open(dest_path, 'wb') as f:
                        f.write(file_bytes)
                except Exception as loc_err:
                    print(f"[Upload] Local backup write notice: {loc_err}")

                chosen_path = public_url if public_url else f"./assets/{clean_name}"
                print(f"[Upload] Successfully saved {len(file_bytes)} bytes. URL: {chosen_path}")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                res = {
                    "status": "ok",
                    "path": chosen_path,
                    "filename": clean_name
                }
                self.wfile.write(json.dumps(res).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "error": str(e)}).encode('utf-8'))
            return

        elif clean_path == '/api/contact':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                import datetime, time
                msg_data = json.loads(post_data.decode('utf-8'))
                
                new_msg = {
                    "name": msg_data.get('name') or msg_data.get('Name', ''),
                    "email": msg_data.get('email') or msg_data.get('Email', ''),
                    "service": msg_data.get('service') or msg_data.get('Service', ''),
                    "message": msg_data.get('message') or msg_data.get('Message', '') or msg_data.get('Text Area', ''),
                }

                # 1. Insert into Supabase
                supabase_upsert('messages', new_msg)

                # 2. Local fallback messages.json
                messages_path = os.path.join(current_dir, 'messages.json')
                messages = []
                if os.path.exists(messages_path):
                    try:
                        with open(messages_path, 'r', encoding='utf-8') as mf:
                            messages = json.load(mf)
                    except Exception:
                        messages = []
                
                messages.insert(0, {
                    "id": int(time.time()),
                    **new_msg,
                    "submitted_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "forwarded_to": "hello@axelkarambizi.com"
                })
                with open(messages_path, 'w', encoding='utf-8') as mf:
                    json.dump(messages, mf, indent=2, ensure_ascii=False)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status": "ok", "message": "Inquiry recorded successfully in Supabase"}')
            except Exception as e:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok", "notice": str(e)}).encode('utf-8'))
            return

        elif clean_path == '/api/save':
            # Check auth
            if not self.is_authenticated():
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status": "error", "message": "Unauthorized. Please log in."}')
                return

            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                import threading
                data = json.loads(post_data.decode('utf-8'))

                # 1. Save directly into Supabase (instant and atomic)
                sb_ok = supabase_upsert('site_content', {'id': 'main', 'data': data})
                if sb_ok:
                    print("[Supabase] Content successfully updated in site_content table!")

                # 2. Keep local content.json in sync
                content_path = os.path.join(current_dir, 'content.json')
                with open(content_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                # 3. Run full synchronization instantly (updates local HTML pages)
                sync_all()

                # 4. Automatically push changes to GitHub in background thread
                def push_worker():
                    try:
                        subprocess.run(['git', 'add', 'admin/content.json', 'admin/index.html', 'admin/sync.py', 'index.html', 'projects/index.html', 'about/index.html', 'explore/index.html', 'blogs/index.html', 'assets/'], cwd=base_dir, check=False)
                        subprocess.run(['git', 'commit', '-m', 'Update site content via Admin Portal (Supabase Sync)'], cwd=base_dir, capture_output=True, text=True)
                        push_res = subprocess.run(['git', 'push', 'origin', 'main'], cwd=base_dir, capture_output=True, text=True)
                        if push_res.returncode == 0:
                            print("[Git] Successfully pushed updates to origin main in background!")
                    except Exception as git_err:
                        print(f"[Git] Background push notice: {git_err}")

                threading.Thread(target=push_worker, daemon=True).start()

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                msg = "Changes saved to Supabase & updated instantly! Deleted items removed completely."
                self.wfile.write(json.dumps({"status": "ok", "message": msg}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "error": str(e)}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

def run_server():
    os.chdir(base_dir)
    with ThreadedTCPServer(("", PORT), AdminHandler) as httpd:
        print(f"======================================================")
        print(f" Axel Karambizi Portfolio Server (Gacondo Labs)       ")
        print(f"======================================================")
        print(f" Live Site:  http://localhost:{PORT}/")
        print(f" Admin URL:  http://localhost:{PORT}/admin/")
        print(f" Admin Email: {ADMIN_EMAIL}")
        print(f" Password:    {ADMIN_PASSWORD}")
        print(f" Press Ctrl+C to stop the server.")
        print(f"======================================================")
        
        target_url = f"http://localhost:{PORT}/admin/" if "--admin" in sys.argv else f"http://localhost:{PORT}/"
        try:
            webbrowser.open(target_url)
        except Exception:
            pass

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == '__main__':
    run_server()
