#!/usr/bin/env python3
"""重算 sw.js 的 RELEASE（離線快取版本）。

app-shell（sw.js 的 FILES 清單）任一位元組改變，RELEASE 就會換新，
使用者端會出現「新版已就緒」。

用法（在 repo 根目錄）：
    python3 scripts/build-release.py
    python3 scripts/build-release.py --output ~/Desktop/FengShui-GitHub-upload.zip   # 另外打包上傳用 ZIP

執行前會先檢查 FILES 清單裡的檔案是否都存在：缺任何一個，瀏覽器的
cache.addAll 會整批失敗，離線功能就裝不起來，所以缺檔時直接中止。
"""
import argparse, hashlib, pathlib, re, sys, zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SW = ROOT / 'sw.js'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--output', help='另外輸出一份網站檔案 ZIP（上傳 GitHub 用）')
    args = ap.parse_args()

    src = SW.read_text(encoding='utf-8')
    m = re.search(r"const FILES = \[(.*?)\];", src, re.S)
    if not m:
        sys.exit('找不到 sw.js 的 FILES 清單')
    files = re.findall(r"'([^']+)'", m.group(1))
    missing = [f for f in files if not (ROOT / f).is_file()]
    if missing:
        sys.exit('FILES 裡有不存在的檔案，離線安裝會整批失敗：' + '、'.join(missing))

    h = hashlib.sha256()
    for f in sorted(files):
        h.update(f.encode('utf-8') + b'\0')
        h.update((ROOT / f).read_bytes() + b'\0')
    release = h.hexdigest()[:12]

    new = re.sub(r"const RELEASE = '[0-9a-f]+';", f"const RELEASE = '{release}';", src, count=1)
    if new != src:
        SW.write_text(new, encoding='utf-8')
        print('RELEASE →', release)
    else:
        print('RELEASE 未變：', release)

    if args.output:
        out = pathlib.Path(args.output).expanduser()
        with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
            for f in sorted(set(files + ['sw.js'])):
                z.write(ROOT / f, f)
        print('已輸出', out, f'（{len(set(files + ["sw.js"]))} 個檔案）')


if __name__ == '__main__':
    main()
