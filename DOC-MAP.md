# Osaka Travel Guide · DOC-MAP

_마스터 인덱스 · 정본 규칙 · 영향 매트릭스_ · **v1.0** (2026-08-09)

> **새 세션에서 가장 먼저 읽는다.** 무엇이 무엇의 정본인지, 무엇을 만지면 어디까지 파급되는지 여기서 끝낸다.
> 새 문서를 만들면 **§ 2 표에 등록**한다. 등록 안 하면 고아다 — § 7 명령이 잡는다.

---

## 1. 위계

```
CONCEPT (왜·누구·무슨 여행)  →  PRD (무엇을)
        ↓
design.md (어떻게 보이나)  ⇄  CLAUDE.md (어떻게 운영하나)     ← R-D11 sync
        ↓
index.html (실행)
        ↓
learning.md (무엇을 배웠나)   ·   OSAKA_TRANSPLANT_GUIDE.md (어디서 왔나)
```

**변경은 위에서 시작하고, 학습은 아래로 쌓인다.**

---

## 2. 문서 일람 — 무엇의 정본인가

> **한 사실은 정확히 한 문서가 정본.** 나머지는 요약 + 링크만 둔다.

| L | 문서 | 정본 영역 (여기만 고친다) | 변경 빈도 |
|---|---|---|---|
| 0 | [`CONCEPT.md`](CONCEPT.md) | 여행 사실(날짜·숙소·동행) · 페르소나 · 톤 원칙 · 시리즈 내 위치 | 낮음 |
| 0 | [`PRD.md`](PRD.md) | 기능 F1~F7 · 비기능 · **범위 밖** · 데이터 목표치 · 버전 히스토리 | 중간 |
| 1 | [`design.md`](design.md) ★ | **디자인 토큰 값** · 컴포넌트 인벤토리 · 레이아웃 · 보이스 실행규칙 | 중간 |
| 1 | [`CLAUDE.md`](CLAUDE.md) | 데이터 모델 · 보안 · 함수 위치 · **R-D 룰** · 자가점검 · 스모크 · 백로그 | 높음 |
| 1 | [`OSAKA_TRANSPLANT_GUIDE.md`](OSAKA_TRANSPLANT_GUIDE.md) | 도쿄→오사카 이식 내역 · Vol.IV 제작 순서 · 포트 규칙 | 매우 낮음 |
| 2 | `index.html` | **실행 코드 + 장소 데이터**(`GUIDE_DATA`/`EXCURSIONS`) | 매우 높음 |
| 3 | [`learning.md`](learning.md) | 회귀·함정·결정의 서사 (R-D 룰이 생긴 이유) | 큰 변경마다 |
| ✕ | [`DOC-MAP.md`](DOC-MAP.md) | 위계 · 정본 규칙 · 영향 매트릭스 | 낮음 |
| ✕ | [`README.md`](README.md) | 사용자용 실행법 · 현재 상태 | 릴리스마다 |
| ✕ | `overview.html` | **일행 공유용 계획표** — DAY별 흐름 + 장소 + 구글맵 링크 | 자동 생성 |
| ✕ | `tools/build-overview.js` | ↑ **생성기.** `GUIDE_DATA` → `overview.html` | 스키마 변경 시 |
| ✕ | `hotel.html` | **숙소 안내** — 일행 공유용 한 장 (비용·시설·객실) | 예약 변경 시 |

> ⚠ `hotel.html` 은 **손으로 유지하는 파일이다** (`overview.html` 과 달리 자동 생성이 아니다).
> 2026-08-10 부킹닷컴 예약 화면의 값을 옮겨 적었으므로 **예약을 바꾸면 이 파일도 같이 고친다.**
> 숙소가 확정되면 `GUIDE_DATA.base_hotel` 과 값이 어긋나지 않는지 확인할 것.

> ⚠ `overview.html`은 **자동 생성물이다. 직접 고치지 말 것.** 고치면 다음 생성 때 날아간다.
> 데이터를 바꾼 뒤 **`node tools/build-overview.js`** 를 돌린다. 손으로 유지하던 시절엔 R-D1이 경고한 "정본 행세하는 두 번째 사본"이 될 위험이 있었고, 생성기로 그 위험을 구조적으로 없앴다.
> 앱이 아니므로 **비번 게이트가 없다** — 공개 위치에 올릴 때 주의 (§ 6).
> 생성기는 앱의 빌드 단계가 **아니다.** `index.html`은 여전히 더블클릭으로 열린다 (`PRD.md § 5`).

### 2.1 의도적으로 안 만드는 문서

| 안 만듦 | 이유 | 대신 |
|---|---|---|
| `todo.md` | 백로그 10줄 미만 | `CLAUDE.md § 13` |
| `VERIFICATION.md` | 검증이 bash 5 + 스모크 12줄 | `CLAUDE.md § 9·10` |
| `POSTMORTEM-*.md` | Critical 회귀 아직 없음 | 발생 시 신설 → 이 표에 등록 |
| 사이드카 `*.json` | **R-D1 금지** (CSP상 읽히지도 않으면서 정본 행세) | `index.html` 임베드 |

**신설 조건**: 해당 섹션이 부모 문서의 30%를 넘거나, 사람이 단독으로 열어볼 일이 생길 때. 신설 시 § 2 표 + 양쪽 참조 섹션을 같은 커밋에서 갱신.

---

## 3. 정본 규칙

### 3.1 사실 → 정본

| 쓰려는 것 | 정본 | 다른 곳에서는 |
|---|---|---|
| `#D8452E` 같은 **색 값** | `design.md § 1` | 토큰명만 (`--osaka-red`) + 링크 |
| 날짜 · 숙소 · 동행 | `CONCEPT.md § 1·2` | 참조만. **추측 금지** |
| "이건 안 만든다" | `PRD.md § 7` | 링크만 |
| 장소 데이터 (좌표·`feature`) | `index.html` | 문서에 장소 목록 복사 금지 |
| 함수 이름·위치 | `CLAUDE.md § 7` | 링크만 |
| "왜 이 룰이 생겼나" | `learning.md` | `CLAUDE.md`는 룰 한 줄 |
| "도쿄에선 어땠나" | `OSAKA_TRANSPLANT_GUIDE.md` | 링크만 |

### 3.2 삼각 sync (R-D11)

디자인은 세 곳에 흔적이 남아 가장 잘 깨진다. **순서 고정**:

```
design.md 갱신 → index.html :root 갱신 → CLAUDE.md § 5 요약 → BUILD_VERSION
```

하나만 고치면 다음 세션이 stale 값을 읽는다. **충돌 시 `design.md`가 이긴다.**

### 3.3 참조 섹션 의무

L0~L3 전 문서는 끝에 **참조**를 둔다 — **위**(출처) / **옆**(같은 L) / **아래**(코드·회고) / **인덱스**(이 문서).
한 방향 링크만 있으면 되돌아올 길이 없어 고아가 된다.

---

## 4. 영향 매트릭스

> 코드 만지기 전 확인. **케이스가 없으면 행을 추가하는 것이 첫 작업.**

### 4.1 장소 데이터

| 만지는 것 | 같이 볼 것 |
|---|---|
| 장소 1곳 추가 | `CLAUDE.md § 4` 절차 → **R-D3** 좌표 land-check → **R-D4** category 문자열 → `PRD.md § 6` 현황 → `BUILD_VERSION` |
| 맛집·카페 추가 | 위 전부 + **R-D10** 정기휴무(영업시간 X) → `design.md § 4.2` feature 톤 → `PRD.md § 6` 표 |
| 구역 신설·장소 이동 | **R-D8** 반경 2km(§ 7 bash) → 1곳 구역 되면 **R-D9** `setView` → `ZONE_ACCENTS` 6색 초과 → `access` 역 기준 재작성 |
| 원정 추가 (USJ·나라·고베) | `CONCEPT.md § 1` 확정 먼저 → `EXCURSIONS[]` push만(**R-D6** 전용 렌더러 금지) → `ZONE_ACCENTS` → `PRD.md § 6` |
| `base_hotel` 확정 | `CONCEPT.md § 1` → `excursionOrigin()` 자동 → `access`에 도보 시간 → 구역 순서 재배치 → 교토 추천 경로 확정 |

### 4.2 디자인

| 만지는 것 | 같이 볼 것 |
|---|---|
| 색 토큰 값 | **R-D11 순서** (§ 3.2) |
| 포인트 색 `--osaka-red` | `design.md § 1.2` → `CONCEPT.md § 5` · **`--frame`/`--page`/`--ink`는 불가** |
| 새 CSS 클래스 | `design.md § 2` 인벤토리 행 추가 → 필터 대상이면 `.catsec` 구조 유지 (`applyFilter` 의존) |
| 카테고리 색 `--cat-*` | `design.md § 1.3` → `CAT` 딕셔너리 → **R-D4** 키 일치 |
| ★ / 🇰🇷 뱃지 | `design.md § 1.4` — `--gold`/`--essential`은 **전용**, 일반 강조 금지 |

### 4.3 엔진

| 만지는 것 | 같이 볼 것 |
|---|---|
| 지도 fitBounds | **R-D5** 픽셀 padding + **R-D9** 단일 좌표 → 스모크 7·8 |
| 동선(폴리라인) | `places` **배열 순서가 곧 동선** → 순서 바꾸면 번호·범례도 같이 바뀜 → `noRoute` 대상인지 확인 → **CSP에 `connect-src` 추가 금지**(OSRM 불가, `PRD.md` F3) |
| 원정을 zone처럼 재조립하는 자리 | `buildZoneMap({name, sections, noRoute})` — **지도가 읽는 필드를 늘리면 이 줄도 늘린다** (`learning.md § 12`) |
| `base_hotel`에 좌표 추가 | R-D3 land-check → 숙소 핀 + loop 동선이 자동 생성 → `CLAUDE.md § 3.1` |
| 필터 로직 | `.catsec` 구조 → `.zone` 통째 숨김 vs `.excursion` 장소만 숨김 **비대칭 유지** → 스모크 5·6 |
| 스크롤스파이 | **R-D7** 세로 스크롤 금지 → 스모크 4 |
| 새 DOM 생성 | `E()` 헬퍼만. `innerHTML`은 정적 SVG 상수 전용 (`CLAUDE.md § 6`) |

### 4.4 보안 · 문서

| 만지는 것 | 같이 볼 것 |
|---|---|
| 비번 변경 | `CLAUDE.md § 6` → `AUTH_KEY` **v bump** → `.auth-q-text` 힌트 → **R-D2** → § 9 점검 3 |
| 외부 의존 추가 | `PRD.md § 5` 2개 상한 → CSP **완화 금지** |
| 새 데이터 파일 | **R-D1 위반.** 만들지 않는다 |
| 장소·구역 데이터 변경 | **`overview.html` 같이 갱신** (파생 산출물 — § 2 하단 경고) |
| `transfer` (선착장 이동) 편집 | 셔틀·수속 시각은 **시즌마다 바뀐다** → `warn`에 재확인 문구 유지 → `CLAUDE.md § 7 buildTransfer` → **`node tools/build-overview.js` 재실행** |
| `zone.schedule` (시간표) 편집 | `PRD.md § 2` 의 선을 넘는지 확인 — **시설 마감·배 시각만 못 박는다** → `CLAUDE.md § 7 buildSchedule` |
| 데이터 **포맷**(들여쓰기·줄바꿈) 변경 | ⚠ `CLAUDE.md § 8·§ 9` 의 bash 추출기가 **포맷 앵커가 아니라 괄호 매칭**인지 확인. 앵커식이면 조용히 깨진다 (`learning.md § 13`) |
| 새 문서 신설 | § 2 등록 → 참조 섹션 → § 7 통과 |
| 새 R-D 룰 | `CLAUDE.md § 8` 본문 → 가능하면 § 9 자동 점검 → `learning.md` 서사 → 이 표에 행 |

---

## 5. index.html 영역 매핑

> **줄 번호를 박지 않는다.** grep 키워드로 찾는다.

| 영역 | 키워드 | 문서 |
|---|---|---|
| CSP · 게이트 FOUC | `Content-Security-Policy`, `auth-gate` | `CLAUDE.md § 6` |
| 디자인 토큰 | `:root {` | **`design.md § 1`** |
| 컴포넌트 CSS | `.zone`, `.place`, `.catsec`, `.excursion` | `design.md § 2` |
| 빌드 스탬프 | `BUILD_VERSION` | `CLAUDE.md § 4` |
| 구역 데이터 | `const GUIDE_DATA` | `CLAUDE.md § 3.1` |
| 장소 스키마 | `name_ko`, `essential`, `offzone` | `CLAUDE.md § 3.2` |
| 원정 데이터 | `const EXCURSIONS` | `CLAUDE.md § 3.3` |
| 카테고리·액센트 | `CAT`, `ZONE_ACCENTS` | `design.md § 1.3·1.6` |
| DOM 헬퍼 | `function E(`, `icon(` | `CLAUDE.md § 6·7` |
| 렌더 엔진 | `renderMast`, `renderNav`, `buildCatSection`, `buildCard` | `CLAUDE.md § 7` |
| 지도 | `buildZoneMap`, `initLeafletMap`, `fitBounds` | `CLAUDE.md § 7` · R-D5·R-D9 |
| 길찾기 | `excursionOrigin`, `excursionDirUrl` | `CLAUDE.md § 7` |
| 필터·스파이 | `applyFilter`, `setupScrollSpy` | `CLAUDE.md § 7` · R-D7 |
| 게이트 로직 | `AUTH_HASH`, `AUTH_KEY` | `CLAUDE.md § 6` |

---

## 6. 세션 진입 가이드

| 세션 | 순서 |
|---|---|
| **짧음** (장소 추가·문구) | § 4.1 → `CLAUDE.md § 3·4` → 편집 → `CLAUDE.md § 9` 점검 5개 |
| **중간** (화면·엔진) | 이 문서 → `PRD.md § 7` 범위 밖 위반 확인 **먼저** → `design.md` 또는 `CLAUDE.md § 7` → `§ 8` R-D 훑기 → § 9 점검 → § 10 스모크 → `learning.md` 1줄 |
| **큼** (여행 사실·위계) | `CONCEPT.md § 1·2` 채우기(**사용자 확인 필수, 추측 금지**) → § 4로 파급 산출 → 전 문서 갱신 → 코드 → `PRD.md § 9` + `learning.md` |

**권한 경계** (2026-08-09 갱신)
- ✅ WRITE: 이 폴더만 · ✅ READ: 이 폴더 + 부모 워크스페이스(도쿄·오키나와 포함)
- ❌ 다른 매거진 폴더 WRITE. 수정 요청이 오면 먼저 보고
- 읽어온 패턴은 **반드시 오사카 컨텍스트로 변형.** 그대로 복붙 금지 — 계보가 다르다 (§ 8)

---

## 7. 위험 신호 → 진단 · 고아 점검

| 신호 | 원인 | 진입점 |
|---|---|---|
| "탭했더니 엉뚱한 데가 떠" | 좌표 미검증 / 추측 `place_id` | **R-D3** · `CLAUDE.md § 13` |
| "이 구역을 어떻게 걸어다녀" | 구역 반경 초과 | **R-D8** |
| "지도가 골목 한 칸만 보여" | 1곳 구역 `fitBounds` 최대줌 | **R-D9** |
| "핀이 잘려" | 픽셀 padding 누락 | **R-D5** |
| "필터 눌렀더니 원정 설명이 사라져" | `.excursion` 통째 숨김 | § 4.3 비대칭 규약 |
| "칩 눌렀더니 페이지가 위로 튀어" | `scrollIntoView` 사용 | **R-D7** |
| "휴무일에 가서 헛걸음" | `feature`에 정기휴무 누락 | **R-D10** |
| "문서마다 색이 다르게 적혀 있어" | 삼각 sync 깨짐 | **R-D11** |
| "이 문서 왜 있는지 모르겠어" | 위계 미등록 | § 2 등록부터 |

```bash
# 고아 검출 — 모든 .md 가 DOC-MAP 에 등록됐고 양방향 링크가 있는지
for f in *.md; do
  reg=$(grep -c "]($f)" DOC-MAP.md); [ "$f" = "DOC-MAP.md" ] && reg=1
  inb=$(grep -l "]($f)" *.md 2>/dev/null | grep -vx "$f" | wc -l | tr -d ' ')
  out=$(grep -oE '\]\([A-Za-z_.-]+\.md\)' "$f" | sort -u | wc -l | tr -d ' ')
  s="OK "; [ "$reg" -eq 0 ] && s="!!미등록 "; [ "$inb" -eq 0 ] && s="$s!!인바운드0 "; [ "$out" -eq 0 ] && s="$s!!막다른길 "
  echo "$s$f (등록:$reg 인:$inb 아웃:$out)"
done
```

```bash
# stale 후보 — index.html 보다 오래된 문서
ls -t index.html *.md | sed -n '/index.html/,$p' | tail -n +2 | sed 's/^/stale? /'
```

---

## 8. 부모 워크스페이스와의 관계 ⚠

이 폴더는 `일본 여행 매거진/` 의 Vol. III인데, **부모 문서는 다른 계보를 전제로 쓰여 있다.**

| | 저널 계보 (Vol.I 오키나와 · Vol.II 도쿄 메인) | **가이드 계보 (도쿄 `guide/` · 오사카)** |
|---|---|---|
| 사용자 입력 | 있음 (사진·별점·Export/Import) | **없음** |
| 저장 | localStorage state + IndexedDB | **인증 토큰 3키만** |
| 외부 의존 | 웹폰트 · CDN · Unsplash | **Leaflet + CARTO 2개** |
| 규모 | 12,000~20,000줄 | ~1,350줄 |
| 배포 | GitHub Pages 공개 | 비번 게이트 |

**부모 `../README.md`에서 따르지 않을 항목** — 읽되 적용 금지:

- § 2-1 "오키나와 폴더 복사" → 오사카는 도쿄 `guide/` 계보
- § 2-5 "보안 코드 5종(`sanitizeImportedState` 등) 그대로 옮길 것" → **import 경로 자체가 없다**
- § 4 릴리스 체크리스트의 import 페이로드 테스트 → 해당 없음
- § 0 외부 의존 목록 → `PRD.md § 5`가 더 엄격 (2개 상한)

**반대로 오사카가 앞선 것** (시리즈 공통으로 올릴 가치):
**R-D10** (부모 § 2-6은 "영업시간 확인"이지만 오사카는 영업시간을 쓰지 않고 정기휴무만 쓴다) · **R-D1** · **R-D8/R-D9**

> 부모 문서 갱신은 **WRITE 경계 밖**. 필요하면 사용자에게 보고하고 허락을 받는다.
> 읽기 전용 참고: `../README.md` · `../MAP_AND_RATINGS_SPEC.md` · `../UI_TRANSPLANT_TO_TOKYO.md`

---

## 9. 참조

- **위(L0)** — [`CONCEPT.md`](CONCEPT.md) · [`PRD.md`](PRD.md)
- **옆(L1)** — [`CLAUDE.md`](CLAUDE.md) · [`design.md`](design.md) · [`OSAKA_TRANSPLANT_GUIDE.md`](OSAKA_TRANSPLANT_GUIDE.md)
- **아래** — `index.html` · [`learning.md`](learning.md)
- **사용자용** — [`README.md`](README.md)

이 문서를 가리키는 곳: 전 문서의 참조 섹션.
