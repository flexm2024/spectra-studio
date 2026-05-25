# Spectra Studio 배포 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spectra Studio를 GitHub → Cloudflare Pages 파이프라인으로 `spectra.flexmstudio.com`에 배포한다.

**Architecture:** 로컬 코드에 COOP/COEP 헤더 파일과 vite base 설정을 추가한 뒤 GitHub에 push하고, Cloudflare Pages가 자동 빌드·서빙하도록 연결한다. 이후 git push만으로 재배포된다.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Cloudflare Pages, GitHub CLI (`gh`)

---

## 파일 변경 목록

| 파일 | 작업 | 이유 |
|------|------|------|
| `public/_headers` | 신규 생성 | Cloudflare Pages COOP/COEP 헤더 적용 |
| `vite.config.ts` | `base: '/'` 추가 | 루트 도메인 배포 명시 |

---

## Task 1: COOP/COEP 헤더 파일 추가

**Files:**
- Create: `public/_headers`

Cloudflare Pages는 빌드 출력(`dist/`) 루트의 `_headers` 파일을 읽어 HTTP 헤더를 서빙한다.
Vite는 `public/` 디렉토리를 `dist/`에 그대로 복사하므로 `public/_headers` → `dist/_headers`로 자동 포함된다.

WebCodecs(`VideoEncoder`, `OffscreenCanvas`)와 mp4-muxer가 `crossOriginIsolated` 환경을 요구하는 경우를 대비해 COOP/COEP를 미리 설정한다.

- [ ] **Step 1: `public/_headers` 파일 생성**

```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

(파일 끝에 빈 줄 없음. 들여쓰기는 스페이스 2개.)

- [ ] **Step 2: 빌드하여 파일이 dist/에 복사되는지 확인**

```bash
npm run build
```

예상 출력:
```
✓ built in Xs
```

```bash
ls dist/_headers
```

`dist/_headers` 파일이 존재하면 성공.

- [ ] **Step 3: 커밋**

```bash
git add public/_headers
git commit -m "feat: Cloudflare Pages COOP/COEP 헤더 추가"
```

---

## Task 2: vite.config.ts base 설정 명시

**Files:**
- Modify: `vite.config.ts`

루트 도메인(`spectra.flexmstudio.com`) 배포이므로 `base: '/'`는 기본값과 동일하지만 명시적으로 선언하여 서브경로 배포와 혼동을 방지한다.

- [ ] **Step 1: `vite.config.ts` 수정**

현재 파일:
```ts
// Vite 설정 — React + Vitest 통합
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
    exclude: ['**/node_modules/**', '**/.worktrees/**'],
  },
})
```

수정 후:
```ts
// Vite 설정 — React + Vitest 통합
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
    exclude: ['**/node_modules/**', '**/.worktrees/**'],
  },
})
```

- [ ] **Step 2: 테스트 통과 확인**

```bash
npm test
```

예상 출력: `94 passed`  
실패 테스트가 있으면 커밋하지 말고 원인 파악 후 수정.

- [ ] **Step 3: 빌드 확인**

```bash
npm run build
```

예상 출력: `✓ built in Xs` (에러 없음)

- [ ] **Step 4: 커밋**

```bash
git add vite.config.ts
git commit -m "feat: vite base 경로 명시 (루트 도메인 배포)"
```

---

## Task 3: GitHub 저장소 생성 및 push

**Prerequisites:** GitHub CLI(`gh`) 설치 및 로그인 상태여야 함.  
확인: `gh auth status` → `Logged in to github.com as necc1321` 출력되어야 함.

- [ ] **Step 1: GitHub 로그인 상태 확인**

```bash
gh auth status
```

미로그인 상태면 `! gh auth login`을 프롬프트에서 실행한다.

- [ ] **Step 2: GitHub 저장소 생성**

```bash
gh repo create necc1321/spectra-studio --public --description "Playlist video creator — React + Vite + TypeScript"
```

예상 출력:
```
✓ Created repository necc1321/spectra-studio on GitHub
```

- [ ] **Step 3: 원격 저장소 연결**

```bash
git remote add origin https://github.com/necc1321/spectra-studio.git
```

이미 origin이 있으면: `git remote set-url origin https://github.com/necc1321/spectra-studio.git`

- [ ] **Step 4: master 브랜치 push**

```bash
git push -u origin master
```

예상 출력:
```
Branch 'master' set up to track remote branch 'master' from 'origin'.
```

- [ ] **Step 5: GitHub에서 확인**

브라우저에서 `https://github.com/necc1321/spectra-studio` 접속하여 코드가 올라갔는지 확인.

---

## Task 4: Cloudflare Pages 프로젝트 생성 (브라우저 수동 작업)

**이 Task는 Cloudflare 대시보드에서 직접 수행해야 한다. CLI 자동화 불가.**

- [ ] **Step 1: Cloudflare 대시보드 접속**

`https://dash.cloudflare.com` → 로그인 → 좌측 메뉴에서 **Pages** 클릭.

- [ ] **Step 2: 새 프로젝트 생성**

**Create a project** → **Connect to Git** 클릭.

- [ ] **Step 3: GitHub 연결**

GitHub 계정 `necc1321` 연결 → `spectra-studio` 저장소 선택 → **Begin setup** 클릭.

- [ ] **Step 4: 빌드 설정 입력**

| 항목 | 값 |
|------|-----|
| Project name | `spectra-studio` |
| Production branch | `master` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | (비워둠) |

**Environment variables (선택사항):**  
없음 — 빈 칸으로 두면 됨.

- [ ] **Step 5: Node.js 버전 설정**

Environment variables에 아래 항목 추가:

| Variable name | Value |
|--------------|-------|
| `NODE_VERSION` | `20` |

- [ ] **Step 6: Save and Deploy 클릭**

첫 번째 빌드가 자동으로 시작된다. 빌드 로그에서 `✓ Build succeeded` 확인.

빌드 실패 시:
- `npm run build` 오류면 로컬에서 재현 후 수정
- `NODE_VERSION` 설정 문제면 18로 낮춰볼 것

---

## Task 5: 커스텀 도메인 연결 (브라우저 수동 작업)

**이 Task도 Cloudflare 대시보드에서 수행한다. flexmstudio.com이 Cloudflare DNS 하에 있으므로 CNAME 레코드가 자동 생성된다.**

- [ ] **Step 1: CF Pages 프로젝트로 이동**

`https://dash.cloudflare.com` → Pages → `spectra-studio` 프로젝트 클릭.

- [ ] **Step 2: Custom Domains 탭 클릭**

상단 탭에서 **Custom domains** 선택 → **Set up a custom domain** 클릭.

- [ ] **Step 3: 도메인 입력**

```
spectra.flexmstudio.com
```

입력 후 **Continue** 클릭.

- [ ] **Step 4: DNS 레코드 확인**

flexmstudio.com이 Cloudflare DNS 하에 있으면 아래 메시지가 표시된다:

> "We found that flexmstudio.com is on Cloudflare. We'll automatically add the DNS record."

**Activate domain** 클릭.

flexmstudio.com이 다른 DNS 공급자에 있는 경우 수동으로 CNAME을 추가해야 한다:
- CNAME `spectra` → `spectra-studio.pages.dev`

- [ ] **Step 5: SSL 인증서 대기**

도메인 활성화 후 SSL 인증서 발급까지 최대 5분 소요. 상태가 **Active** 로 바뀌면 완료.

---

## Task 6: 배포 검증

- [ ] **Step 1: 앱 접속 확인**

브라우저에서 `https://spectra.flexmstudio.com` 접속.

체크리스트:
- [ ] 앱 UI 로딩됨 (흰 화면, 404, CORS 오류 없음)
- [ ] Step1 화면 표시됨

- [ ] **Step 2: 핵심 기능 확인**

- [ ] Step1: 오디오 파일 업로드 → 트랙 목록 표시됨
- [ ] Step2: 비주얼라이저 타입 변경 → 스테이지에 즉시 반영됨
- [ ] Step3: MP4 렌더링 버튼 클릭 → 진행률 표시 후 파일 다운로드됨

MP4 렌더링 실패 시 브라우저 콘솔에서 오류 확인:
- `crossOriginIsolated: false` 오류면 `_headers` 파일이 `dist/`에 없는 것 → Task 1 재확인
- `VideoEncoder is not defined` 오류면 Chrome이 아닌 브라우저 → Chrome 94+ 사용 필요

- [ ] **Step 3: 자동 재배포 확인**

```bash
# 임의 공백 변경 후 push하여 자동 배포 트리거 테스트
git commit --allow-empty -m "test: 자동 배포 트리거 확인"
git push
```

Cloudflare Pages 대시보드 → Deployments 탭에서 새 배포가 시작되는지 확인.  
배포 완료 후 사이트 재접속하여 정상 동작 확인.

- [ ] **Step 4: 빈 커밋 리버트**

```bash
git revert HEAD --no-edit
git push
```

---

## 완료 기준

- `https://spectra.flexmstudio.com` 에서 앱 정상 로딩
- Step3 MP4 렌더링 성공
- `git push` 시 CF Pages 자동 재배포 동작
