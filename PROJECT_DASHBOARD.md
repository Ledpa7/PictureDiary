# 🚀 두들로그(DoodleLog) 배포 정상화 대시보드

## 📅 최종 업데이트: 2026-04-30

---

## 🔴 현재 상태: 로그인 시 500 Internal Server Error (미해결)

- **증상**: `doodlelog.ledpa7.com/auth/callback?code=...` 접속 시 `Internal Server Error` 출력
- **범위**: `/auth/callback` 뿐만 아니라 **모든 에지 함수 라우트**(`/api/generate-image`, `/api/cron/daily-diary`)에서 동일 증상 확인
- **정적 페이지**(`/`, `/gallery`, `/admin`, `/privacy` 등)는 정상 작동
- **결론**: 에지 함수(Edge Function)가 서버에서 실행되지 않고 있음

---

## ✅ 과거 해결된 문제

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

### 4. Build Command 변경
| 시도 | 내용 | 결과 |
|------|------|------|
| `@cloudflare/next-on-pages@1` (구버전) | 기존 빌드 명령어 | ✅ 빌드 성공 |
| `@cloudflare/next-on-pages@latest` (최신) | 최신 버전으로 업데이트 | ✅ 빌드 성공 (실제로는 동일한 v1.13.16 설치됨) |

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

---

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
