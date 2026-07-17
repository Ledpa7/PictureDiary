# 🚀 두들로그(DoodleLog) 프로젝트 대시보드

## 📅 최종 업데이트: 2026-07-18 (브랜딩 로고 디자인 및 헤더 UI 최적화 완료)

---

## ✨ 최근 성과: 브랜딩 로고 개편 및 헤더 UI 최적화 (2026-07-18)

### 1. 🎨 브랜딩 로고 아이콘 디자인 확정 (Concept 57)
- **[손글씨 스마일 도안]**: 사용자의 나이브(Naive)하고 귀여운 크레파스 낙서 선호 피드백을 수용하여, 십일자 형태의 wobbly 대각선 눈(`\ /`)과 입꼬리가 삐뚤한 D-smile 디자인 확정.
- **[투명 프레임 워크]**: 사각형 내부 영역은 홈페이지 기본 배경색(`hsl(0 0% 8%)` / `#141414`)으로 꽉 채우고, 캔버스 바깥 영역은 투명 처리하여 배포 시 일체감을 극대화한 RGBA PNG 렌더링.

### 2. ⚡ 아이콘 해상도 및 렌더링 극대화 (Supersampling Antialiasing)
- **[계단현상 완전 제거]**: Pillow 라이브러리의 그리기 알리아싱 문제를 보완하고자, 4배인 **2048x2048px 해상도에서 대형 그리기**를 한 뒤 고품질 **LANCZOS 필터**로 축소 다운샘플링하여 매끄럽고 쨍한 고화질 외곽선 획 확보.
- **[스케일 왜곡 원천 차단]**: 512px 원본을 24px의 좁은 헤더 영역에서 강제 압축할 때 브라우저 렌더러가 픽셀을 생략하여 깨지던 현상을 방지하기 위해, 모바일/레티나 4배수 디스플레이 최적화 규격인 **96px x 96px 로고 전용 파일(`logo.png`)**을 분리 배치.
- **[캐시 강제 우회]**: 브라우저 및 CDN이 이전 이미지를 재활용하는 것을 막기 위해 헤더 컴포넌트의 소스 경로를 `logo.png?v=3` 쿼리 형태로 갱신.

### 3. 🌐 글로벌 다국어 토글 헤더 통합
- **[헤더 이식]**: 메인페이지 좌측 하단에 단독으로 떠다니던 절대 좌표 다국어 토글 버튼(KR / EN)을 공용 컴포넌트(`Header.tsx`)로 흡수. 데스크톱/모바일 로그인 아바타 버튼 좌측으로 재배치하여 통합 글로벌 네비게이션 사용성 강화.

### 4. 💅 헤더 톤앤매너 조화
- **[솔리드 블랙 완화]**: 이질감이 다소 느껴지던 완전 블랙(`bg-black/95`) 대신, 전체 사이트 톤인 카드 배경 테마 색상(`bg-card/95`, `hsl(0 0% 4%)` 기반)에 블러 효과를 가미하여 본문 컨텐츠와 스크롤 시 고급스러운 시각적 투명성 확보.

---


## 🟢 현재 상태: 배포 정상화 및 성능 최적화 완료
- **해결 내용**: `OpenNext` 마이그레이션 성공 후, 코드 구조와 실행 속도까지 모두 업그레이드 완료.
- **결과**: 빌드 성공, 로그인 정상, 고반응성 UI 확보.

---

## ✅ 과거 해결된 문제 (배포 이슈)
... (중략) ...

1. **OpenNext → next-on-pages 전환**: 무거운 OpenNext를 제거하고 `@cloudflare/next-on-pages` + `wrangler deploy` 조합으로 전환. 빌드 속도 1분 내외로 단축.
2. **"Hello World" 버그**: 워커 기본 샘플 대신 Next.js 빌드 결과물을 로드하도록 `wrangler.jsonc` 설정 및 `touch .assetsignore` 추가.
3. **Edge Runtime 설정**: 모든 동적 라우트에 `export const runtime = 'edge'` 추가 (next-on-pages 필수 요구사항).
4. **환경 변수 충돌**: `wrangler.jsonc`의 하드코딩된 `vars`가 대시보드 설정을 덮어쓰던 문제 제거.

---

## 🔧 시도한 해결책 목록 (2026-04-30)

### 1. auth/callback/route.ts 코드 수정
| 시도 | 내용 | 결과 |
|------|------|------|
| Supabase SSR 로직 복구 | 테스트용 정적 응답을 제거하고 실제 PKCE 인증 코드 교환 로직으로 교체 | ❌ 500 유지 |
| 최소 테스트 코드 (edge) | 임포트 없이 `export const runtime = 'edge'` + 순수 `Response` 반환 | ❌ 500 유지 |
| 최소 테스트 코드 (non-edge) | `runtime = 'edge'` 제거 + `NextRequest` 사용 | ❌ 빌드 실패 (next-on-pages가 edge runtime 필수 요구) |
| edge runtime 재추가 | 다시 `export const runtime = 'edge'` 추가 | ✅ 빌드 성공, ❌ 500 유지 |

### 2. wrangler.jsonc 설정 변경
| 시도 | 내용 | 결과 |
|------|------|------|
| Workers with Assets 규격 | `main` + `assets.directory` 설정 | ❌ `npx wrangler deploy` 시 Authentication error (10000) |
| ASSETS binding 추가 | `assets.binding: "ASSETS"` 추가 | ❌ 동일한 Authentication error (10000) |
| routes + custom_domain 추가 | `routes: [{ pattern: "doodlelog.ledpa7.com", custom_domain: true }]` | ❌ 동일한 Authentication error (10000) |
| Pages 규격 전환 | `pages_build_output_dir: ".vercel/output"` 사용, `main`/`assets` 제거 | ❌ 배포는 성공(true)하나 500 유지 |
| Pages 규격 v2 | `pages_build_output_dir: ".vercel/output/static"` | ❌ 배포는 성공(true)하나 500 유지 |
| 원본 복구 | 최초 상태(중복 assets 포함)로 롤백 | ❌ 상태 변화 없음 |

### 3. 대시보드 Deploy Command 변경
| 시도 | 내용 | 결과 |
|------|------|------|
| `npx wrangler deploy` | Workers 방식 배포 | ❌ Authentication error [code: 10000] — API 토큰 권한 부족 |
| `npx wrangler pages deploy .vercel/output` | Pages 방식 배포 | ❌ Authentication error [code: 10000] |
| `npx wrangler pages deploy .vercel/output --project-name=doodlelog` | 프로젝트명 명시 | ❌ Authentication error [code: 10000] |
| 빈칸 | Deploy command 비우기 | ❌ Required 필드라 입력 불가 |
| `true` | 아무것도 안 하고 성공 반환 | ✅ 빌드+배포 Success 표시, ❌ 500 유지 |

### 5. OpenNext 마이그레이션 성공 (2026-05-01)
| 시도 | 내용 | 결과 |
|------|------|------|
| OpenNext 규격 전환 | `wrangler.jsonc`를 OpenNext 규격으로 변경 | ✅ 해결 |
| config 파일 수정 | 필수 필드(`incrementalCache` 등) 모두 포함하여 규격 준수 | ✅ 해결 |
| 런타임 설정 최적화 | 에러 유발하는 `runtime = 'edge'` 선언 제거 | ✅ 해결 |
| **최종 결과** | **배포 및 로그인 성공** | 🎉 **성공** |

---

## 🔍 핵심 미해결 이슈

### 이슈 1: API 토큰 권한 부족 (Authentication error 10000)
- `CLOUDFLARE_API_TOKEN` 환경 변수에 설정된 토큰이 **Pages 배포 권한**을 갖고 있지 않음
- 계정은 Super Administrator이지만, **API 토큰 자체의 스코프**가 배포를 허용하지 않는 것으로 추정
- **해결 방안**: Cloudflare 대시보드 > Profile > API Tokens에서 토큰의 권한에 `Cloudflare Pages: Edit` 추가 필요

### 이슈 2: Deploy command `true`로 인한 미배포
- `true`는 배포를 실제로 수행하지 않음 → 빌드 결과물(`_worker.js`)이 서버에 전달되지 않음
- 정적 페이지는 이전 배포 캐시로 정상 작동하지만, 에지 함수는 최신 코드가 반영되지 않음
- `pages_build_output_dir` 설정이 `true` 배포에서도 자동 배포를 트리거하는지 미확인

### 이슈 3: next-on-pages 자체의 한계
- `@cloudflare/next-on-pages`는 이미 **deprecated** 상태 (OpenNext 어댑터로 전환 권장)
- Next.js 15.5.15와의 호환성 문제 가능성 존재

## ✅ 최종 해결 보고서 (2026-05-01)

### 1. 에러 원인 분석 (Post-mortem)
- **증상**: 배포 성공 후에도 에지 함수(/auth/callback 등) 호출 시 500 Internal Server Error 발생.
- **근본 원인**: Next.js 15 버전이 `@cloudflare/next-on-pages` 어댑터(현재 유지보수 중단 단계)와 에셋 로딩 방식에서 충돌을 일으킴. 특히 `env.ASSETS.fetch`를 찾지 못하는 런타임 에러 발생.

### 2. 최종 해결책: OpenNext 마이그레이션
- **어댑터 교체**: 구형 어댑터를 버리고 클라우드플레어 공식 권장인 **OpenNext for Cloudflare**로 완전 전환.
- **필수 설정 준수**: `open-next.config.ts` 작성 시 빌드 도구가 요구하는 모든 객체 구조(incrementalCache, tagCache, queue 등)를 누락 없이 포함함.
- **런타임 충돌 제거**: 개별 라우트 파일에 선언되어 있던 `export const runtime = 'edge';`를 모두 제거하여 OpenNext의 빌드 최적화 로직과 충돌하지 않게 함.

### 3. 향후 유지보수 시 주의사항
- **빌드 명령어**: `npm run build && npx @opennextjs/cloudflare build`를 유지해야 함.
- **배포 명령어**: `npx wrangler deploy`를 사용하며, `wrangler.jsonc`의 `main`과 `assets` 경로를 항상 최신 빌드 폴더(`.open-next`)에 맞춰야 함.
- **환경 변수**: `NEXT_PUBLIC_` 변수가 빌드 시점에 필요할 경우, 클라우드플레어 대시보드에서 'Secret'이 아닌 일반 'Variable'로 설정되어 있는지 확인 필요.

---
**DoodleLog 배포 및 인증 이슈 종결.** 🎉

## 📝 현재 파일 상태

### wrangler.jsonc (현재)
```json
{
  "name": "doodlelog",
  "pages_build_output_dir": ".vercel/output/static",
  "compatibility_date": "2025-02-01",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true }
}
```

### auth/callback/route.ts (현재 - 최소 테스트 코드)
```typescript
export const runtime = 'edge';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    return new Response(`Route Hit (Edge)! Code: ${code ? 'Found' : 'Missing'}`, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
    });
}
```

### 대시보드 설정 (현재)
- **Build command**: `npm run build && npx @cloudflare/next-on-pages@latest && touch .vercel/output/static/.assetsignore`
- **Deploy command**: `true`
- **Build output directory**: 미확인 (확인 필요)

---

## 🚀 다음 시도 후보 (우선순위순)

1. **API 토큰 권한 수정**: Cloudflare 대시보드에서 API 토큰에 `Cloudflare Pages: Edit` 권한 추가 → Deploy command를 `npx wrangler pages deploy .vercel/output/static --project-name=doodlelog`로 변경
2. **Build output directory 확인/수정**: 대시보드에서 `.vercel/output/static`으로 설정되어 있는지 확인
3. **OpenNext 어댑터 마이그레이션**: deprecated된 `next-on-pages` 대신 `@opennextjs/cloudflare`로 전환
4. **Cloudflare Pages Git 연동 재설정**: 프로젝트를 삭제하고 새로 생성하여 깨끗한 상태에서 재배포

---
*기록자: Antigravity AI Assistant*
