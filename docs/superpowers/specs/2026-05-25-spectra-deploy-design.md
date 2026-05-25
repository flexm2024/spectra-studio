# Spectra Studio 배포 설계 — GitHub → Cloudflare Pages

**날짜:** 2026-05-25  
**대상:** `spectra.flexmstudio.com`  
**플랫폼:** GitHub + Cloudflare Pages

---

## 목표

Spectra Studio(React+Vite+TS)를 `spectra.flexmstudio.com`에 배포한다.  
이후 `git push`만으로 자동 재배포가 되어야 한다.

---

## 아키텍처

```
로컬 master 브랜치
  → GitHub (necc1321/spectra-studio)
    → Cloudflare Pages 자동 빌드 (npm run build)
      → dist/ 정적 파일 CDN 서빙
        → spectra.flexmstudio.com (CNAME)
```

---

## 구현 단계

### 1. GitHub 저장소 생성 및 push

- `gh repo create necc1321/spectra-studio --public`
- `git remote add origin https://github.com/necc1321/spectra-studio.git`
- `git push -u origin master`

### 2. Vite 빌드 설정

`vite.config.ts`에 `base: '/'` 명시 (루트 도메인 배포 — 기본값과 동일하나 명시적으로 선언).

### 3. COOP/COEP 헤더 파일 추가

WebCodecs(`VideoEncoder`, `OffscreenCanvas`)의 `crossOriginIsolated` 요구사항을 충족하기 위해 `public/_headers` 추가.

```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

- Cloudflare Pages는 `public/_headers` 파일을 빌드 출력(`dist/`)에 포함시켜 헤더를 자동 적용한다.
- 이 헤더 없이 배포하면 Chrome에서 MP4 렌더링 시 `crossOriginIsolated` 조건 미충족으로 실패할 수 있다.

### 4. Cloudflare Pages 프로젝트 생성

CF Pages 대시보드에서 GitHub 저장소 연결:

| 항목 | 값 |
|------|-----|
| 빌드 커맨드 | `npm run build` |
| 출력 디렉토리 | `dist` |
| Node.js 버전 | `20` |
| 환경 변수 | 없음 |

### 5. 커스텀 도메인 설정

CF Pages 프로젝트 → Custom Domains → `spectra.flexmstudio.com` 추가.  
flexmstudio.com이 Cloudflare DNS 하에 있으므로 CNAME 레코드가 자동 생성된다.

---

## 파일 변경 목록

| 파일 | 변경 내용 |
|------|-----------|
| `vite.config.ts` | `base: '/'` 추가 |
| `public/_headers` | COOP/COEP 헤더 신규 생성 |

---

## 성공 기준

- `https://spectra.flexmstudio.com` 접속 시 앱 로딩 확인
- Step1 파일 업로드, Step2 비주얼라이저, Step3 MP4 렌더링 정상 동작
- `git push` 후 CF Pages 자동 재배포 트리거 확인

---

## 수동 작업 (브라우저 필요)

Cloudflare Pages 대시보드 설정(저장소 연결, 커스텀 도메인 추가)은 UI에서만 가능하다.  
나머지(GitHub 저장소 생성, 코드 변경, push)는 CLI로 자동화한다.
