#!/usr/bin/env node
/* overview.html 생성기 — index.html 의 GUIDE_DATA 에서 일행 공유용 계획표를 만든다.
 *
 * 왜 생성기인가: overview.html 을 손으로 유지하면 GUIDE_DATA 와 어긋난다.
 *   그게 R-D1 이 박제한 "정본 행세하는 두 번째 사본" 이다 (learning.md § 1).
 *   여기서는 데이터를 한 곳(index.html)에서만 읽어 파생물을 찍어낸다.
 *
 * ⚠ 이건 앱의 빌드 단계가 아니다. index.html 은 여전히 더블클릭으로 열린다 (PRD § 5).
 *   이 스크립트는 개발자가 데이터를 고친 뒤 한 번 돌리는 도구일 뿐이다.
 *
 * 사용:  node tools/build-overview.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

/* GUIDE_DATA 추출 — 괄호 매칭. 포맷(한 줄/여러 줄)에 의존하지 않는다 (learning.md § 13) */
function extractGuideData(html) {
  const key = 'const GUIDE_DATA = ';
  const at = html.indexOf(key);
  if (at < 0) throw new Error('GUIDE_DATA 를 찾지 못했습니다');
  let i = html.indexOf('{', at), depth = 0, inStr = false, esc = false;
  for (let j = i; j < html.length; j++) {
    const c = html[j];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; continue; }
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') { depth--; if (depth === 0) return JSON.parse(html.slice(i, j + 1)); }
  }
  throw new Error('괄호가 맞지 않습니다');
}

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/* feature 의 **강조** 만 <b> 로. 이스케이프 뒤에 적용하므로 주입 위험 없음 */
const md = s => esc(s).replace(/\*\*([^*]+?)\*\*/g, '<b>$1</b>');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const D = extractGuideData(html);
const build = (html.match(/BUILD_VERSION = '([^']+)'/) || [, '?'])[1];

let total = 0;
D.zones.forEach(z => z.sections.forEach(s => { total += s.places.length; }));

/* 선착장 ↔ 숙소 이동 블록 — 도착은 맨 위, 복귀는 맨 아래 */
function transferHtml(kind) {
  const T = D.transfer && D.transfer[kind];
  if (!T) return '';
  const steps = (T.steps || []).map(s => `
      <div class="tr-row"><div class="tr-t">${esc(s.t)}</div><div>
        <div class="tr-w">${esc(s.w)}</div>${s.d ? `<div class="tr-d">${esc(s.d)}</div>` : ''}
      </div></div>`).join('');
  const need = (T.need || []).map(n => `<li>${esc(n)}</li>`).join('');
  return `
  <section class="transfer">
    <div class="tr-head"><span class="tr-tag">${esc(T.tag)}</span><h2>${esc(T.title)}</h2>
      <span class="tr-date">${esc(T.date || '')}</span></div>
    ${T.lede ? `<p class="tr-lede">${esc(T.lede)}</p>` : ''}
    ${T.warn ? `<div class="tr-warn">${md(T.warn)}</div>` : ''}
    ${steps}
    ${need ? `<div class="tr-need"><div class="tr-need-h">챙길 것</div><ul>${need}</ul></div>` : ''}
    ${T.tip ? `<p class="tr-tip">${esc(T.tip)}</p>` : ''}
  </section>`;
}

const zoneHtml = D.zones.map(z => {
  const places = [];
  z.sections.forEach(s => s.places.forEach(p => places.push(p)));
  const sched = (z.schedule || []).map(s => `
      <div class="zs-row"><div class="zs-t">${esc(s.t)}</div><div>
        <div class="zs-w">${esc(s.w)}</div>${s.n ? `<div class="zs-n">${esc(s.n)}</div>` : ''}
      </div></div>`).join('');
  const list = places.map((p, i) => `
      <li><div class="pn"><span class="num">${i + 1}</span>${esc(p.name_ko)}${
        p.recommended ? '<span class="badge b-star">★</span>' : ''}${
        p.essential ? '<span class="badge b-ess">🇰🇷</span>' : ''}</div>
        <div class="pf">${md(p.feature)}</div>
        <a class="pg" href="${esc(p.maps_url)}" target="_blank" rel="noopener noreferrer">구글맵 열기 →</a></li>`).join('');
  return `
  <section class="zone">
    <div class="zone-top"><span class="tag">${esc(z.tag || ('AREA ' + String(z.id).padStart(2, '0')))}</span>
      <h2>${esc(z.name)}</h2><span class="cnt">${places.length}곳</span></div>
    <p class="access">${esc(z.access || '')}</p>
    ${sched ? `<div class="sched"><div class="zs-head">이 날의 흐름 · ${z.schedule.length}단계</div>${sched}</div>` : ''}
    <ul class="places">${list}</ul>
  </section>`;
}).join('');

const out = `<!doctype html>
<!-- 자동 생성 파일 — 직접 고치지 마십시오.
     정본: index.html 의 GUIDE_DATA / 생성: node tools/build-overview.js -->
<html lang="ko"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
<meta name="robots" content="noindex, nofollow">
<title>오사카 여행 계획표 · 8/24~26</title>
<style>
html{font-size:clamp(17px,16px + 0.35vw,20.5px);-webkit-text-size-adjust:100%}
:root{--frame:#1a1b4b;--page:#f5f3ee;--page-tint:#ebe7df;--page-warm:#efece4;--white:#fff;
--ink:#2a2d3a;--ink-soft:#5a5d6a;--ink-faint:#8a8d99;--osaka-red:#D8452E;--gold:#d4af37;--essential:#C0455E;
--line:#d9d6cf;--line-faint:#e7e4dd;--r:12px;--pad-x:clamp(18px,5vw,56px);
--sans:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Malgun Gothic","Noto Sans KR","Segoe UI",Roboto,system-ui,sans-serif;
--serif:Georgia,"Times New Roman","Apple SD Gothic Neo",serif;}
*{box-sizing:border-box}
body{margin:0;background:var(--page);color:var(--ink);font-family:var(--sans);line-height:1.6;word-break:keep-all;-webkit-text-size-adjust:100%}
.wrap{max-width:900px;margin:0 auto}
.pn,.pf,.zs-w,.tr-w,.lede{overflow-wrap:break-word}
@media(min-width:700px){.zs-row,.tr-row{grid-template-columns:74px 1fr}}
@media(max-width:359px){:root{--pad-x:14px}.zs-row,.tr-row{grid-template-columns:52px 1fr;gap:8px}}
.mast{background:var(--frame);color:var(--page);padding:32px var(--pad-x) 26px}
.kicker{font-family:var(--serif);font-size:0.7188rem;letter-spacing:.18em;text-transform:uppercase;color:var(--osaka-red);font-weight:700;margin:0 0 9px}
.mast h1{font-family:var(--serif);font-size:clamp(34px,10vw,58px);line-height:.95;margin:0 0 10px;letter-spacing:-.02em}
.mast h1 span{color:var(--osaka-red)}
.lede{margin:0;font-size:0.875rem;color:#cfcede;max-width:52ch}
.pills{display:flex;flex-wrap:wrap;gap:7px;margin-top:16px}
.pill{border:1px solid rgba(245,243,238,.28);border-radius:999px;padding:5px 11px;font-size:0.7188rem;color:#e6e4ef}
.pill b{color:var(--page)}
main{padding:0 var(--pad-x) 56px}
.zone{margin-top:34px}
.zone-top{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;border-bottom:2px solid var(--frame);padding-bottom:8px}
.tag{background:var(--osaka-red);color:#fff;font-size:0.75rem;font-weight:800;letter-spacing:.06em;padding:4px 9px;border-radius:5px;flex:none}
.zone-top h2{font-size:1.1875rem;margin:0;letter-spacing:-.01em}
.cnt{margin-left:auto;font-size:0.7188rem;color:var(--ink-faint);flex:none}
.access{font-size:0.7813rem;color:var(--ink-soft);margin:9px 0 0;padding:7px 10px;background:var(--page-tint);border-radius:7px}
.sched{margin-top:13px;background:var(--page-warm);border:1px solid var(--line-faint);border-radius:var(--r);overflow:hidden}
.zs-head{background:var(--frame);color:var(--page);font-size:0.7813rem;font-weight:700;padding:8px 13px}
.zs-row{display:grid;grid-template-columns:56px 1fr;gap:11px;padding:9px 13px;border-top:1px solid var(--line-faint)}
.zs-t{font-size:0.8125rem;font-weight:800;color:var(--osaka-red);font-variant-numeric:tabular-nums}
.zs-w{font-size:0.875rem}
.zs-n{font-size:0.7813rem;color:var(--ink-soft);margin-top:2px}
ul.places{list-style:none;margin:14px 0 0;padding:0}
ul.places li{padding:11px 0;border-top:1px solid var(--line-faint)}
.pn{font-size:0.9375rem;font-weight:600;display:flex;align-items:baseline;gap:7px;flex-wrap:wrap}
.num{background:var(--frame);color:#fff;font-size:0.75rem;font-weight:800;min-width:19px;height:19px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex:none}
.badge{font-size:0.7188rem;line-height:1;padding:3px 5px;border-radius:4px;font-weight:700;color:#fff}
.b-star{background:var(--gold)}.b-ess{background:var(--essential)}
.pf{font-size:0.8125rem;color:var(--ink-soft);margin-top:4px}
.pg{display:inline-block;margin-top:6px;font-size:0.7813rem;color:var(--osaka-red);text-decoration:none;font-weight:600}
.pg:hover{text-decoration:underline}
.transfer{margin:30px 0;background:var(--frame);color:var(--page);border-radius:var(--r);padding:18px 17px 16px}
.tr-head{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}
.tr-tag{background:var(--osaka-red);color:#fff;font-size:0.7188rem;font-weight:800;letter-spacing:.1em;padding:4px 8px;border-radius:4px;flex:none}
.tr-head h2{font-size:1.0625rem;margin:0}
.tr-date{margin-left:auto;font-size:0.75rem;color:#b9b7c8;flex:none}
.tr-lede{margin:10px 0 0;font-size:0.8438rem;color:#cfcede}
.tr-warn{margin-top:13px;padding:11px 12px;border-radius:8px;background:rgba(216,69,46,.16);border:1px solid rgba(216,69,46,.5);font-size:0.8125rem;color:#f0eef7;line-height:1.55}
.tr-warn b{color:#fff}
.tr-row{display:grid;grid-template-columns:58px 1fr;gap:11px;padding:9px 0;border-top:1px solid rgba(245,243,238,.14)}
.tr-t{font-size:0.7813rem;font-weight:800;color:var(--osaka-red);font-variant-numeric:tabular-nums}
.tr-w{font-size:0.875rem}
.tr-d{font-size:0.7813rem;color:#b9b7c8;margin-top:2px;line-height:1.5}
.tr-need{margin-top:15px;padding:12px 13px;background:rgba(245,243,238,.08);border-radius:8px}
.tr-need-h{font-size:0.7188rem;font-weight:700;letter-spacing:.08em;color:var(--osaka-red);margin-bottom:6px}
.tr-need ul{margin:0;padding-left:17px;font-size:0.8125rem;color:#dedcea}
.tr-need li{margin:3px 0}
.tr-tip{margin:13px 0 0;font-size:0.7813rem;color:#b9b7c8;font-style:italic}
footer{background:var(--frame);color:#a9a7bb;font-size:0.7188rem;padding:20px var(--pad-x) 26px;text-align:center}
footer b{color:var(--page)}
</style></head><body><div class="wrap">
<header class="mast">
  <p class="kicker">A Travel Guide · Itinerary</p>
  <h1>OSAKA<span>.</span></h1>
  <p class="lede">8/24(월) 입항 ~ 8/26(수) 출항 · 2박 3일 · 남자 4명. 날짜별 흐름과 갈 곳을 한 장으로. 시각은 참고용이고, 못 박은 건 시설 마감과 배 시간뿐이다 — 늦으면 뒤로 밀면 된다.</p>
  <div class="pills"><span class="pill">2박 3일</span><span class="pill">총 <b>${total}곳</b></span><span class="pill">교토 <b>제외</b></span><span class="pill">숙소 <b>미정</b></span></div>
</header>
<main>${transferHtml('arrival')}${zoneHtml}${transferHtml('departure')}</main>
<footer><b>오사카 여행 계획표</b> · ${esc(build)}<br>
자동 생성 — 정본은 <b>index.html</b> 의 GUIDE_DATA. 지도·동선은 실제 가이드에서 볼 수 있다.</footer>
</div></body></html>
`;
fs.writeFileSync(path.join(ROOT, 'overview.html'), out);
console.log('overview.html 생성 완료 · 구역 ' + D.zones.length + ' · 장소 ' + total + ' · ' + build);
