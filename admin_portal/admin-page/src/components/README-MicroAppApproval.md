# Micro‑App Approval Guide

Purpose

- Provide a safe, repeatable checklist for admins to review micro‑app ZIPs without extracting to disk.
- Mitigates unrestricted file upload, RCE, path traversal, and data exfiltration risks.

Applies to

- All micro‑app ZIP submissions prior to approval/publication.

Quick decision checklist

1. Source verified: developer identity and change reference.
2. Integrity: SHA‑256 recorded; signature verified if provided.
3. Archive safety: valid ZIP, no Zip Slip paths, no nested archives, no zip bombs.
4. Manifest: name, version, appId, description, bridge permissions, allowed origins, integrity hash present.
5. Network posture: HTTPS only; external domains on an allowlist.
6. Code patterns: no eval/new Function/document.write/atob obfuscation; no dynamic script injection.
7. Malware scan (optional but recommended): clean.
8. Least privilege: requested bridge APIs are necessary and minimal.

Commands (no extraction to disk)

Validate ZIP magic and list entries

- Expect magic 50 4B 03 04 (PK..)
- xxd -l 4 -p app.zip | grep -qi '^504b03' && echo "ZIP magic OK" || echo "WARN: magic mismatch"
- unzip -l app.zip

Compute size and hash

- shasum -a 256 app.zip
- stat -f "%z bytes" app.zip

Estimate uncompressed size (zip‑bomb check)

- unzip -l app.zip | awk 'NR>3 && $0 !~ /----|^Archive:/ {sum+=$1} END{print "Total uncompressed:",sum,"bytes"}'

Path traversal and nested archives (reject on traversal)

- unzip -Z1 app.zip | grep -E '(^/|(\.\./))' && echo "FAIL: path traversal"
- unzip -Z1 app.zip | grep -Ei '\.(zip|7z|rar|gz|tar)$' && echo "WARN: nested archives"

Allowed extensions only (warn on others)

- unzip -Z1 app.zip | grep -Ev '\.(html?|js|mjs|css|json|png|jpe?g|gif|svg|webp|woff2?|ttf|eot|txt)$' | grep -vE '/$' || true

Manifest review (stream only)

- unzip -p app.zip manifest.json | jq .
- Verify fields: name, version, appId, description
- Verify: bridge.allowedOrigins[], bridge.permissions[], integrity.sha256

Scan for risky patterns (stream only)

- for f in $(unzip -Z1 app.zip | grep -Ei '\.(js|mjs|html)$'); do
  echo "== $f ==";
  unzip -p app.zip "$f" | grep -nE 'eval\(|new Function\(|document\.write\(|atob\(|innerHTML\s\*=' || true;
  unzip -p app.zip "$f" | grep -nE 'fetch\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon' || true;
  done

Only HTTPS and allowlisted domains

- ALLOW='(yourdomain\.gov|api\.trusted\.example)'
- for f in $(unzip -Z1 app.zip | grep -Ei '\.(js|mjs|json|html)$'); do
  unzip -p app.zip "$f" | grep -Eo 'https?://[A-Za-z0-9\.\-_:\/]+' | sort -u | 
  grep -Ev "$ALLOW" && echo "WARN: non‑allowlisted URL in $f" || true;
  done

Optional malware scan (stream)

- freshclam # update signatures
- 7z l app.zip >/dev/null
- while read -r p; do 7z x -so app.zip "$p" | clamscan --stdout - 2>/dev/null; done < <(7z l -slt app.zip | awk -F'= ' '/Path = /{print $2}')

Approval workflow

1. Intake
   - Record submitter, ticket/ref, and received SHA‑256.
2. Static review (commands above)
   - Document any warnings/findings with file paths/line numbers.
3. Policy check
   - Confirm only HTTPS endpoints and allowlisted domains.
   - Confirm bridge.allowedOrigins restrict to the micro‑app’s local files (e.g., file:///.../micro-app/\*).
   - Confirm bridge.permissions is minimal and justified.
4. Decision
   - Approve: record decision, SHA‑256, reviewer, date, notes.
   - Reject: return findings to developer; require a new build with a new hash.
5. Publish
   - Store the approved SHA‑256 and metadata alongside the uploaded artifact.
   - Optionally, enforce checksum/signature verification at load time.

Template for recording decisions

- App: `<name>` (`<appId>`) version <x.y.z>
- ZIP SHA‑256: `<hash>`
- Manifest: ok/needs changes (list)
- Bridge: allowedOrigins=<...>; permissions=<...>
- External URLs: `<list>` (all HTTPS, allowlisted? yes/no)
- Risky patterns: `<none or list with justification>`
- Malware scan: <clean/notes>
- Reviewer/date: `<name>`/<YYYY‑MM‑DD>
- Decision: <approved/rejected> + notes

Automation helper (optional)

- A convenience script is included to run most checks without extraction.
- Path: admin_portal/admin-page/scripts/review-microapp.sh
- Usage:
  - bash admin_portal/admin-page/scripts/review-microapp.sh ~/Downloads/app.zip '(yourdomain\.gov|trusted\.example)'
- The script prints inventory, size, traversal warnings, extension allowlist, manifest fields, risky patterns, and URL allowlist findings.

Future hardening (recommended)

- Require developer signatures; verify app.zip.sig before review.
- Enforce server‑side checksum/signature validation before load.
- Gate uploads with server‑side MIME/magic checks and max uncompressed size/file count.
- Maintain an allowlist of permitted bridge APIs
