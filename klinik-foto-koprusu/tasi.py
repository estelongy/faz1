# -*- coding: utf-8 -*-
r"""
Supabase'deki hasta fotoğraflarını yerel klasöre taşır.

Kullanım:
    python tasi.py "D:\KlinikFoto"

Sonuç:
    D:\KlinikFoto\Hastalar\Deniz hanim\islem-oncesi-2026-08-12.jpg
                                       \islem-oncesi-2026-08-12-2.jpg
"""
import json
import os
import sys
import urllib.request
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from klinik_foto import safe_folder, slug, next_free_name  # noqa: E402

ENV_PATH = r"C:\Users\Orjin\estelongy-faz1\.env.local"


def read_env():
    env = {}
    with open(ENV_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def api(url, key, method, path, body=None):
    req = urllib.request.Request(
        url + path, method=method,
        headers={"Authorization": f"Bearer {key}", "apikey": key,
                 "Content-Type": "application/json"},
        data=json.dumps(body).encode() if body else None,
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read() or b"null")


def label_from_note(note: str) -> str:
    n = (note or "").lower()
    if "öncesi" in n or "oncesi" in n:
        return "islem-oncesi"
    if "sonrası" in n or "sonrasi" in n:
        return "islem-sonrasi"
    if "kontrol" in n:
        return "kontrol"
    return "foto"


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.expanduser("~"), "KlinikFoto")
    hastalar = os.path.join(root, "Hastalar")
    os.makedirs(hastalar, exist_ok=True)

    env = read_env()
    url = env["NEXT_PUBLIC_SUPABASE_URL"]
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env["SUPABASE_SERVICE_KEY"]

    rows = api(url, key, "GET",
               "/rest/v1/internal_patient_photo?select=id,storage_path,note,created_at,patient_id")
    patients = api(url, key, "GET", "/rest/v1/internal_patient?select=id,name")
    name_of = {p["id"]: p["name"] for p in patients}

    print(f"{len(rows)} fotoğraf bulundu. Hedef: {hastalar}\n")
    ok = 0
    for r in rows:
        pname = name_of.get(r["patient_id"], "Isimsiz Hasta")
        folder = os.path.join(hastalar, safe_folder(pname))
        os.makedirs(folder, exist_ok=True)

        # imzalı URL al
        signed = api(url, key, "POST",
                     f"/storage/v1/object/sign/klinik-foto/{r['storage_path']}",
                     {"expiresIn": 600})
        signed_url = url + "/storage/v1" + signed["signedURL"]

        date = datetime.fromisoformat(r["created_at"].replace("Z", "+00:00")).strftime("%Y-%m-%d")
        base = f"{label_from_note(r.get('note'))}-{date}"
        ext = os.path.splitext(r["storage_path"])[1] or ".jpg"
        name = next_free_name(folder, base, ext)

        with urllib.request.urlopen(signed_url) as resp, open(os.path.join(folder, name), "wb") as out:
            out.write(resp.read())
        print(f"  OK  {pname} -> {name}")
        ok += 1

    print(f"\n{ok} fotoğraf taşındı.")


if __name__ == "__main__":
    main()
