"""One-command deploy: bump sw.js CACHE_VERSION, commit, and push.

Usage:
  python deploy.py "pesan commit singkat"

If you don't pass a message, it will ask for one. Run this instead of
manually running git add/commit/push + remembering to bump CACHE_VERSION —
that's the whole point of this script.
"""
import re
import subprocess
import sys

SW_PATH = "sw.js"


def run(cmd):
    result = subprocess.run(cmd, shell=True, text=True, capture_output=True, encoding="utf-8", errors="replace")
    return result.returncode, result.stdout.strip(), result.stderr.strip()


def has_pending_changes():
    code, out, _ = run("git status --porcelain")
    return bool(out.strip())


def bump_cache_version():
    with open(SW_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    match = re.search(r'CACHE_VERSION\s*=\s*"v(\d+)"', content)
    if not match:
        print(f"Tidak ketemu CACHE_VERSION di {SW_PATH}, lewati langkah ini.")
        return None
    old_num = int(match.group(1))
    new_num = old_num + 1
    new_content = content[: match.start()] + f'CACHE_VERSION = "v{new_num}"' + content[match.end() :]
    with open(SW_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"sw.js: CACHE_VERSION v{old_num} -> v{new_num}")
    return new_num


def main():
    if not has_pending_changes():
        print("Tidak ada perubahan untuk di-deploy. Selesai.")
        return

    bump_cache_version()

    message = " ".join(sys.argv[1:]).strip()
    if not message:
        message = input("Pesan commit (contoh: 'Tambah 5 cerita baru'): ").strip()
    if not message:
        message = "Update"

    code, out, err = run("git add -A")
    if code != 0:
        print("Gagal git add:", err)
        sys.exit(1)

    code, out, err = run(f'git commit -m "{message}"')
    print(out)
    if code != 0:
        print("Gagal commit (mungkin tidak ada yang berubah setelah bump versi):", err)
        sys.exit(1)

    code, out, err = run("git push")
    print(out, err)
    if code != 0:
        print("Gagal push:", err)
        sys.exit(1)

    print("\nSelesai. GitHub Pages biasanya update dalam 1-2 menit.")
    print("Cek: https://fashioneternalmanufacturer-code.github.io/feed-belajar/")


if __name__ == "__main__":
    main()
