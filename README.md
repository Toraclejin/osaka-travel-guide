# 오사카 친구 가이드

오사카·교토 자유여행 가이드 — 구역별 **관광지·맛집·카페** + **교토 당일 원정**.

- 구역별 인터랙티브 지도(장소 핀) + 각 장소 구글맵 링크
- 카테고리 / ★추천 / 🇰🇷한국인 필수 필터
- 교토 가는 법 4가지 + 구글맵 길찾기 버튼
- 모바일 우선, 단일 HTML 파일

## 사용법

`index.html` 을 브라우저로 열면 됩니다. (지도 표시에는 인터넷 필요, 나머지는 오프라인에서도 동작)

접속 비밀번호가 걸려 있습니다. 힌트는 화면에 나옵니다.

## 장소 추가·수정

`index.html` 안의 `GUIDE_DATA` (시내 구역) 또는 `EXCURSIONS` (원정) 객체를 고칩니다.
별도의 데이터 파일은 **없습니다** — 이 파일 하나가 정본입니다.

```js
{"name_ko":"오사카성","name_en":"Osaka Castle","feature":"천수각 + 해자 + 공원. 최소 2시간",
 "recommended":true,"essential":true,"lat":34.6873,"lng":135.5259,
 "maps_url":"https://www.google.com/maps/search/?api=1&query=Osaka%20Castle"}
```

한 줄에 한 장소를 씁니다. 좌표를 넣은 뒤에는 **반드시 지도에서 핀 위치를 눈으로 확인**하세요.

## 로컬 서버

```bash
npx --yes serve -l 8767 .
```

## ⚠ 현재 상태 (v0.1)

이식 직후라 데이터가 미완성입니다.

- 좌표 24곳 — **미검증**
- 맛집·카페 — **0곳**
- 숙소 정보 · 구역 접근 시간 — **미입력**

자세한 내용은 [`CLAUDE.md`](CLAUDE.md) § 13.

## 문서

| 문서 | 내용 |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | 운영 정본 — 데이터 모델 · 보안 · 함수 위치 · 오류 방지 룰 · 자가 점검 |
| [`PRD.md`](PRD.md) | 제품 요구사항 · 범위 밖 · 버전 히스토리 |
| [`CONCEPT.md`](CONCEPT.md) | 여행 사실 · 동행 · 톤 |
| [`OSAKA_TRANSPLANT_GUIDE.md`](OSAKA_TRANSPLANT_GUIDE.md) | 도쿄 → 오사카 이식 명세 |
