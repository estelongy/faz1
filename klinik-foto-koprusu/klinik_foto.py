# -*- coding: utf-8 -*-
r"""
Klinik Foto Köprüsü
===================
Klinik bilgisayarında çalışan küçük yerel sunucu. Hasta fotoğrafları
buluta değil, bu bilgisayarın diskine kaydedilir.

Klasör düzeni:
    <KÖK>\Hastalar\<Ad Soyad>\islem-oncesi-2026-08-12.jpg
                              \islem-sonrasi-2026-08-12.jpg
                              \kontrol-2026-08-26.jpg

Aynı gün + aynı etiketten birden fazla varsa sonuna -2, -3 eklenir.

Uç noktalar (yalnızca yerel ağ):
    GET  /ping                      → köprü var mı
    POST /upload                    → foto yükle (multipart: file, patient, stage, note)
    GET  /list?patient=Ad%20Soyad   → hastanın fotoğraf listesi
    GET  /file?path=...             → fotoğrafı servis et
    POST /delete                    → foto sil (json: path)
"""

import os
import sys
import json
import socket
import threading
import webbrowser
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs, unquote

APP_NAME = "Klinik Foto Köprüsü"
PORT = 47821
CONFIG_PATH = os.path.join(os.path.expanduser("~"), ".klinik-foto-koprusu.json")

STAGE_LABELS = {
    "oncesi": "once",
    "sonrasi": "sonra",
    "kontrol": "kontrol",
    "genel": "foto",
}

TR_MAP = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosuCGIOSU")


def slug(text: str) -> str:
    """Dosya adı için güvenli hale getir (Türkçe harfleri sadeleştir)."""
    text = (text or "").translate(TR_MAP)
    keep = []
    for ch in text:
        if ch.isalnum() or ch in " -_":
            keep.append(ch)
        else:
            keep.append("-")
    return " ".join("".join(keep).split()).strip(" -_") or "isimsiz"


def safe_folder(text: str) -> str:
    """Klasör adı — hasta adı okunur kalsın, sadece yasak karakterler temizlensin."""
    bad = '<>:"/\\|?*'
    out = "".join("-" if ch in bad else ch for ch in (text or "").strip())
    out = " ".join(out.split())
    return out or "Isimsiz Hasta"


def load_config() -> dict:
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_config(cfg: dict) -> None:
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(cfg, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


def pick_root() -> str:
    """Kök klasörü seç: kayıtlı varsa onu kullan, yoksa kullanıcıya sor."""
    cfg = load_config()
    root = cfg.get("root")
    if root and os.path.isdir(root):
        return root

    chosen = None
    try:
        import tkinter as tk
        from tkinter import filedialog, messagebox

        r = tk.Tk()
        r.withdraw()
        messagebox.showinfo(
            APP_NAME,
            "Hasta fotoğraflarının kaydedileceği klasörü seçin.\n\n"
            "Örn: D:\\KlinikFoto\n"
            "İçinde otomatik olarak 'Hastalar' klasörü oluşturulur.",
        )
        chosen = filedialog.askdirectory(title="Fotoğraf klasörünü seçin")
        r.destroy()
    except Exception:
        pass

    if not chosen:
        # GUI yoksa varsayılan
        chosen = os.path.join(os.path.expanduser("~"), "KlinikFoto")

    os.makedirs(os.path.join(chosen, "Hastalar"), exist_ok=True)
    cfg["root"] = chosen
    save_config(cfg)
    return chosen


ROOT = ""  # main'de doldurulur


def patients_dir() -> str:
    d = os.path.join(ROOT, "Hastalar")
    os.makedirs(d, exist_ok=True)
    return d


def next_free_name(folder: str, base: str, ext: str) -> str:
    """islem-oncesi-2026-08-12.jpg → varsa -2, -3 ..."""
    cand = f"{base}{ext}"
    if not os.path.exists(os.path.join(folder, cand)):
        return cand
    i = 2
    while True:
        cand = f"{base}-{i}{ext}"
        if not os.path.exists(os.path.join(folder, cand)):
            return cand
        i += 1


def save_photo(patient: str, stage: str, note: str, data: bytes, ext: str = ".jpg") -> str:
    """Dosya adı: Ad_Soyad_once_120826_205643.jpg"""
    folder = os.path.join(patients_dir(), safe_folder(patient))
    os.makedirs(folder, exist_ok=True)

    who = slug(patient).replace(" ", "_") or "Hasta"
    label = STAGE_LABELS.get(stage, STAGE_LABELS["genel"])
    if note:
        label = f"{label}_{slug(note).replace(' ', '_')}"
    stamp = datetime.now().strftime("%d%m%y_%H%M%S")
    base = f"{who}_{label}_{stamp}"
    name = next_free_name(folder, base, ext)
    path = os.path.join(folder, name)
    with open(path, "wb") as f:
        f.write(data)
    return path


def list_photos(patient: str):
    folder = os.path.join(patients_dir(), safe_folder(patient))
    if not os.path.isdir(folder):
        return []
    out = []
    for name in sorted(os.listdir(folder), reverse=True):
        full = os.path.join(folder, name)
        if not os.path.isfile(full):
            continue
        if os.path.splitext(name)[1].lower() not in (".jpg", ".jpeg", ".png", ".webp"):
            continue
        st = os.stat(full)
        out.append({
            "name": name,
            "path": os.path.relpath(full, patients_dir()).replace("\\", "/"),
            "size": st.st_size,
            "modified": datetime.fromtimestamp(st.st_mtime).isoformat(),
        })
    return out


def parse_multipart(body: bytes, boundary: bytes):
    """Basit multipart ayrıştırıcı: alan adı → (değer|dosya baytları)."""
    parts = body.split(b"--" + boundary)
    fields, files = {}, {}
    for part in parts:
        if not part or part in (b"--\r\n", b"--"):
            continue
        if b"\r\n\r\n" not in part:
            continue
        head, content = part.split(b"\r\n\r\n", 1)
        content = content.rstrip(b"\r\n")
        head_txt = head.decode("utf-8", "replace")
        name = None
        filename = None
        for line in head_txt.split("\r\n"):
            if "content-disposition" in line.lower():
                for chunk in line.split(";"):
                    chunk = chunk.strip()
                    if chunk.startswith("name="):
                        name = chunk[5:].strip('"')
                    elif chunk.startswith("filename="):
                        filename = chunk[9:].strip('"')
        if not name:
            continue
        if filename is not None:
            files[name] = (filename, content)
        else:
            fields[name] = content.decode("utf-8", "replace")
    return fields, files


class Handler(BaseHTTPRequestHandler):
    server_version = "KlinikFotoKoprusu/1.0"

    def log_message(self, *args):
        pass  # sessiz

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        u = urlparse(self.path)
        q = parse_qs(u.query)

        if u.path == "/ping":
            return self._json({"ok": True, "app": APP_NAME, "root": ROOT})

        if u.path == "/list":
            patient = unquote(q.get("patient", [""])[0])
            if not patient:
                return self._json({"ok": False, "error": "patient gerekli"}, 400)
            return self._json({"ok": True, "photos": list_photos(patient)})

        if u.path == "/file":
            rel = unquote(q.get("path", [""])[0])
            full = os.path.normpath(os.path.join(patients_dir(), rel))
            if not full.startswith(os.path.normpath(patients_dir())) or not os.path.isfile(full):
                return self._json({"ok": False, "error": "bulunamadı"}, 404)
            ext = os.path.splitext(full)[1].lower()
            ctype = {".png": "image/png", ".webp": "image/webp"}.get(ext, "image/jpeg")
            with open(full, "rb") as f:
                data = f.read()
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "public, max-age=3600")
            self._cors()
            self.end_headers()
            self.wfile.write(data)
            return

        return self._json({"ok": False, "error": "bilinmeyen uç"}, 404)

    def do_POST(self):
        u = urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else b""

        if u.path == "/upload":
            ctype = self.headers.get("Content-Type", "")
            if "boundary=" not in ctype:
                return self._json({"ok": False, "error": "multipart gerekli"}, 400)
            boundary = ctype.split("boundary=")[1].strip().strip('"').encode()
            fields, files = parse_multipart(body, boundary)
            if "file" not in files:
                return self._json({"ok": False, "error": "dosya yok"}, 400)
            filename, data = files["file"]
            ext = os.path.splitext(filename)[1].lower() or ".jpg"
            if ext not in (".jpg", ".jpeg", ".png", ".webp"):
                ext = ".jpg"
            path = save_photo(
                fields.get("patient", ""), fields.get("stage", "genel"),
                fields.get("note", ""), data, ext,
            )
            rel = os.path.relpath(path, patients_dir()).replace("\\", "/")
            return self._json({"ok": True, "path": rel, "name": os.path.basename(path)})

        if u.path == "/delete":
            try:
                payload = json.loads(body.decode("utf-8"))
            except Exception:
                return self._json({"ok": False, "error": "geçersiz istek"}, 400)
            rel = payload.get("path", "")
            full = os.path.normpath(os.path.join(patients_dir(), rel))
            if not full.startswith(os.path.normpath(patients_dir())) or not os.path.isfile(full):
                return self._json({"ok": False, "error": "bulunamadı"}, 404)
            os.remove(full)
            return self._json({"ok": True})

        return self._json({"ok": False, "error": "bilinmeyen uç"}, 404)


def local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def run_server():
    srv = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    srv.serve_forever()


def main():
    global ROOT
    ROOT = pick_root()
    os.makedirs(patients_dir(), exist_ok=True)

    t = threading.Thread(target=run_server, daemon=True)
    t.start()

    ip = local_ip()
    info = (
        f"{APP_NAME} çalışıyor.\n\n"
        f"Fotoğraf klasörü:\n{os.path.join(ROOT, 'Hastalar')}\n\n"
        f"Bu bilgisayarın ağ adresi:\n{ip}:{PORT}\n\n"
        f"Telefondan bağlanmak için Klinik Yönetim ekranında\n"
        f"'Yerel foto köprüsü' alanına bu adresi girin.\n\n"
        f"Bu pencereyi kapatırsanız köprü durur."
    )

    try:
        import tkinter as tk
        from tkinter import messagebox

        root = tk.Tk()
        root.title(APP_NAME)
        root.geometry("460x340")
        root.configure(bg="#0f172a")

        tk.Label(root, text="✅ " + APP_NAME, font=("Segoe UI", 13, "bold"),
                 fg="#a78bfa", bg="#0f172a").pack(pady=(16, 6))
        tk.Label(root, text=info, font=("Segoe UI", 9), fg="#cbd5e1", bg="#0f172a",
                 justify="left", wraplength=420).pack(padx=18, pady=6)

        btns = tk.Frame(root, bg="#0f172a")
        btns.pack(pady=10)
        tk.Button(btns, text="Klasörü Aç", font=("Segoe UI", 9, "bold"),
                  command=lambda: os.startfile(patients_dir())).pack(side="left", padx=6)
        tk.Button(btns, text="Adresi Kopyala", font=("Segoe UI", 9),
                  command=lambda: (root.clipboard_clear(), root.clipboard_append(f"{ip}:{PORT}"))).pack(side="left", padx=6)
        tk.Button(btns, text="Klasörü Değiştir", font=("Segoe UI", 9),
                  command=lambda: (save_config({}), messagebox.showinfo(APP_NAME, "Program yeniden başlatılınca klasör sorulacak."))).pack(side="left", padx=6)

        tk.Label(root, text="Pencereyi kapatmayın — köprü çalışırken fotoğraflar bu bilgisayara kaydedilir.",
                 font=("Segoe UI", 8), fg="#64748b", bg="#0f172a", wraplength=420).pack(pady=(4, 12))

        root.mainloop()
    except Exception:
        print(info)
        try:
            while True:
                threading.Event().wait(3600)
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
