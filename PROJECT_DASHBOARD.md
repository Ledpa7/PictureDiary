# 🚀 두들로그(DoodleLog) 배포 정상화 대시보드

## 📅 최종 업데이트: 2026-04-29

### ✅ 해결된 문제 (Solved)
1. **배포 방식 최적화**: 
   - 무거운 오픈넥스트(OpenNext)를 제거하고, 클라우드플레어 공식 `next-on-pages` + `wrangler deploy` 조합으로 전환.
   - **결과**: 빌드 및 배포 속도가 1분 내외로 대폭 단축됨.
2. **"Hello World" 버그 해결**:
   - 워커 기본 샘플이 아닌 Next.js 빌드 결과물을 강제 로드하도록 `wrangler.jsonc` 설정 및 `touch .assetsignore` 명령어 추가.
3. **런타임 에러 수정**:
   - `next-on-pages` 빌드 요구 사항에 맞춰 모든 동적 루트(`/api/*`, `/auth/*`, `/gallery/[userId]`)에 `export const runtime = 'edge'` 설정 완료.
4. **도메인 연결 유지**:
   - 배포 시 도메인이 해제되지 않도록 `wrangler.jsonc`에 `routes` 설정 명시.
5. **로그인 500 에러 해결**:
   - `wrangler.jsonc`에 하드코딩된 구형 환경 변수(`vars`)가 클라우드플레어 대시보드 설정을 덮어씌우던 문제를 해결.
   - 코드 내 모든 하드코딩된 Supabase 폴백 값을 제거하여 환경 변수 무결성 확보.

### 🛠 현재 진행 중 (In Progress)
- **전체 기능 테스트**: 로그인 후 갤러리 및 이미지 생성 기능 정상 작동 여부 확인 중.

### 📝 핵심 설정 정보
- **Build Command**: `npm run build && npx @cloudflare/next-on-pages@1 && touch .vercel/output/static/.assetsignore`
- **Deploy Command**: `npx wrangler deploy`
- **Target Environment**: Cloudflare Workers with Assets (Unified list)

---
*기록자: Antigravity AI Assistant*
