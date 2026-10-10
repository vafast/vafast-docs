#!/usr/bin/env bash
# Submit this site's sitemap URLs to IndexNow (Bing, Yandex, Seznam, Naver...).
# Usage: bash scripts/indexnow.sh <host>      e.g. bash scripts/indexnow.sh tools.okayok.ai
# Runs in CI after each successful production deploy (see .github/workflows/).
# Never fails: IndexNow problems are logged, exit code is always 0.
# Multi-site copy: infra/okayok-shared/indexnow.sh (no args = all 7 sites).
HOST=${1:?usage: indexnow.sh <host>}
KEY=${INDEXNOW_KEY:-6271a9fdcdb943b9b716b38b4615eb83}   # public by design: served at https://<host>/<KEY>.txt

# Wait (up to ~2 min) for the key file on the freshly deployed site.
ok=""
for i in $(seq 1 12); do
  body=$(curl -fsS --max-time 20 "https://$HOST/$KEY.txt?ts=$(date +%s)" 2>/dev/null | tr -d '\r\n ')
  if [ "$body" = "$KEY" ]; then ok=1; break; fi
  echo "key file not live yet on $HOST (try $i/12), waiting 10s..."; sleep 10
done
if [ -z "$ok" ]; then echo "IndexNow: key file https://$HOST/$KEY.txt not live - skipped"; exit 0; fi

HOST="$HOST" KEY="$KEY" python3 - <<'PY' || echo "IndexNow: submission script error (ignored)"
import os, re, json, time, urllib.request, urllib.error
host, key = os.environ["HOST"], os.environ["KEY"]
def fetch(u):
    req = urllib.request.Request(u, headers={"User-Agent": "okayok-indexnow/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r: return r.read().decode("utf-8", "replace")
seen, urls, queue = set(), [], [f"https://{host}/sitemap.xml?ts={int(time.time())}"]
while queue:
    sm = queue.pop(0)
    if sm in seen: continue
    seen.add(sm)
    try: xml = fetch(sm)
    except Exception as e: print(f"{host}: cannot read {sm}: {e}"); continue
    locs = [l.strip().replace("&amp;", "&") for l in re.findall(r"<loc>\s*([^<]+?)\s*</loc>", xml)]
    if "<sitemapindex" in xml: queue += locs
    else: urls += locs
urls = list(dict.fromkeys(u for u in urls if re.match(rf"https?://{re.escape(host)}(/|$)", u)))
if not urls: print(f"{host}: sitemap has no URLs for this host - nothing submitted"); raise SystemExit
for i in range(0, len(urls), 10000):
    batch = urls[i:i+10000]
    body = json.dumps({"host": host, "key": key, "keyLocation": f"https://{host}/{key}.txt", "urlList": batch}).encode()
    for attempt in range(3):
        req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body, method="POST",
                                     headers={"Content-Type": "application/json; charset=utf-8"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r: code, msg = r.status, r.read()[:200].decode("utf-8", "replace")
        except urllib.error.HTTPError as e: code, msg = e.code, e.read()[:200].decode("utf-8", "replace")
        except Exception as e: code, msg = "error", str(e)
        if code in (200, 202) or attempt == 2: break
        time.sleep(15)
    print(f"IndexNow {host}: {len(batch)} URLs (batch {i//10000+1}) -> HTTP {code} {msg}".rstrip())
PY
exit 0
