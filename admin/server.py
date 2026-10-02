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

class AdminHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=base_dir, **kwargs)

    def is_authenticated(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
            return token == AUTH_TOKEN
        return False

    def do_GET(self):
        clean_path = self.path.split('?')[0].rstrip('/')
        if clean_path == '/api/content':
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
        elif clean_path == '/admin' or self.path == '/admin':
            self.send_response(301)
            self.send_header('Location', '/admin/')
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

                if email == ADMIN_EMAIL.lower() and password == ADMIN_PASSWORD:
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
                if ',' in b64data:
                    b64data = b64data.split(',', 1)[1]
                
                file_bytes = base64.b64decode(b64data)
                dest_path = os.path.join(base_dir, 'assets', clean_name)
                with open(dest_path, 'wb') as f:
                    f.write(file_bytes)
                
                print(f"[Upload] Successfully saved {len(file_bytes)} bytes to assets/{clean_name}")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                res = {
                    "status": "ok",
                    "path": f"./assets/{clean_name}",
                    "filename": clean_name
                }
                self.wfile.write(json.dumps(res).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "error": str(e)}).encode('utf-8'))
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
                data = json.loads(post_data.decode('utf-8'))
                content_path = os.path.join(current_dir, 'content.json')
                with open(content_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                # Run full synchronization
                sync_all()

                # Also automatically push changes to GitHub origin main to deploy to production
                pushed_to_prod = False
                try:
                    import subprocess
                    subprocess.run(['git', 'add', 'admin/content.json', 'index.html', 'projects/index.html', 'about/index.html', 'explore/index.html'], cwd=base_dir, check=False)
                    res = subprocess.run(['git', 'commit', '-m', 'Update site content via Admin Portal'], cwd=base_dir, capture_output=True, text=True)
                    push_res = subprocess.run(['git', 'push', 'origin', 'main'], cwd=base_dir, capture_output=True, text=True)
                    if push_res.returncode == 0:
                        pushed_to_prod = True
                        print("[Git] Successfully pushed updates to origin main!")
                except Exception as git_err:
                    print(f"[Git] Auto-push notice: {git_err}")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                msg = "Changes saved and published to production (https://axelkarambizi.com/)!" if pushed_to_prod else "Changes saved and synchronized locally!"
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

def run_server():
    os.chdir(base_dir)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), AdminHandler) as httpd:
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
