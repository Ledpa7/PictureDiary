---
description: Deploy the Doodle Log application to Vercel
---

# Deploying Doodle Log

이 워크플로우는 Doodle Log 애플리케이션을 Vercel에 배포하는 방법을 안내합니다.

## 1. 사전 준비 (Prerequisites)

- [Vercel 계정](https://vercel.com/)이 필요합니다.
- [Vercel CLI](https://vercel.com/docs/cli)를 설치하거나, GitHub에 코드를 Push하여 연동해야 합니다.

## 2. 환경 변수 준비 (Environment Variables)

배포 시 다음 환경 변수들을 Vercel 프로젝트 설정에 반드시 추가해야 합니다.

| 변수명 (Key) | 설명 | 값 얻는 곳 |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | Supabase Dashboard > Settings > API |
| `GOOGLE_PROJECT_ID` | Google Cloud 프로젝트 ID | Google Cloud Console |
| `GOOGLE_CREDENTIALS_JSON` | 서비스 계정 키 JSON 내용 | `service-account-key.json` 파일의 **전체 내용을 복사하여 붙여넣기** (여는 중괄호 `{` 부터 닫는 중괄호 `}` 까지, 줄바꿈 무관) |
| `STABILITY_API_KEY` | Stability AI API Key | DreamStudio 계정 |

> **주의:** `GOOGLE_CREDENTIALS_JSON`은 파일 경로가 아니라, JSON 텍스트 자체를 값으로 넣어야 합니다.

## 3. 배포 실행 (Deployment)

### 방법 A: Vercel CLI 사용 (추천)

터미널에서 다음 명령어를 실행합니다:

```bash
npx vercel
```

- 첫 실행 시 로그인을 요청할 수 있습니다.
- 프로젝트 설정을 묻는 질문에는 대부분 기본값(Enter)을 선택하면 됩니다.
- 환경 변수 설정 단계가 나오면 "No"를 선택하고, 나중에 Vercel 대시보드에서 설정하는 것이 편할 수 있습니다. (또는 `.env.local`을 업로드할 수도 있습니다)

### 방법 B: GitHub 연동

1. 이 프로젝트를 GitHub 리포지토리에 Push합니다.
2. Vercel 대시보드에서 'New Project'를 클릭하고 GitHub 리포지토리를 가져옵니다.
3. 'Environment Variables' 섹션에 위의 변수들을 입력합니다.
4. 'Deploy'를 클릭합니다.

## 4. Supabase 설정 (필수)

배포 후 정상 작동하려면 Supabase Table과 RLS Policy가 설정되어 있어야 합니다.
아직 설정하지 않았다면 SQL Editor에서 테이블 생성 쿼리를 실행하세요. (필요 시 별도 워크플로우 참조)
