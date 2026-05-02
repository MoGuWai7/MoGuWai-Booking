# moguwai-booking

> 작은 가게를 위한 가장 가벼운 예약 도구. 5분이면 충분합니다.

업종 불문 예약 · 고객 관리 SaaS. 헤어샵, 카페, 네일샵, 스튜디오 등
시간 단위 예약이 필요한 모든 가게가 한 링크로 예약을 받을 수 있게 해줍니다.

---

## 미리보기

| 화면 | 설명 |
| :--- | :--- |
| `/` | 랜딩 — 작은 가게를 위한 예약 도구 소개 |
| `/auth/signup`, `/auth/login` | 사장님 가입 / 로그인 |
| `/onboarding` | 4단계(업종 → 정보 → 운영시간 → 담당자) 온보딩 |
| `/dashboard` | 사장님 콘솔 — 오늘 통계 + 최근 예약 |
| `/dashboard/reservations` | 예약 관리 — 어제/오늘/내일/전체 필터 |
| `/dashboard/customers` | 고객 명부 (3회 이상 VIP 자동 표시) |
| `/dashboard/settings` | 정보 · 담당자 · 휴무일 |
| `/[slug]` | 손님 예약 페이지 — 회원가입 없이 4단계로 예약 |
| `/[slug]/confirm` | 예약 완료 + 예약번호 |
| `/reservation/check` | 예약번호 + 연락처로 본인 조회 / 취소 |
| `/visitor-log` | 비공개 운영 페이지 — 사이트 방문 통계 |

---

## 기술 스택

| 분류 | 기술 |
| :--- | :--- |
| Framework | Next.js **16.2.4** (App Router · Turbopack · `proxy.ts`) |
| Language | TypeScript 5 |
| UI | React 19 · Tailwind CSS v4 · Pretendard + Instrument Serif |
| Backend | Supabase (PostgreSQL + RLS + Auth) |
| AI 챗봇 | Google Gemini (2.5 Flash 우선, 폴백 체인 포함) |
| Rate limit | Upstash Redis (서버리스 · sliding window) |
| 검증 | zod |
| 배포 | Vercel (Edge runtime + GeoIP) |

> Next.js 16 변경점: `middleware.ts` → `proxy.ts` (함수명도 `proxy`), `searchParams` 가 `Promise<...>` 등.

---

## 주요 기능

### 사장님 (Owner)
- 이메일/비밀번호 회원가입 → 4단계 온보딩으로 가게 등록
- 대시보드 — 오늘 통계 4종, 최근 예약 8건
- 예약 관리 — 상태 변경 (대기 → 확정 → 완료, 취소)
- 고객 명부 — 예약 시 자동 적재, 3회 이상 VIP 자동 표시
- 가게 설정 — 정보 / 담당자 / 휴무일 캘린더 (탭)

### 손님 (Guest)
- 회원가입 없이 예약 (`/[slug]`)
- 캘린더 + 시간 슬롯 + 담당자 + 정보 입력 4단계
- 예약번호 + 연락처로 본인 예약 조회·취소
- AI 챗봇 — 영업시간/빈 시간/위치 자연어 응대 (오늘 가능 시간 실시간 주입)

### AI 챗봇 (`/api/chat`)
- Google Gemini REST API 직접 호출 (deprecated SDK 미사용)
- 모델 폴백 체인: `gemini-2.5-flash` → `2.5-flash-lite` → `flash-latest`
- 가게 정보 + 직원 + 오늘 빈 시간을 시스템 프롬프트에 주입 (단순 RAG)
- **IP 기준 rate limit** — Upstash Redis sliding window 분당 10건. 차단 시 `429 + Retry-After` (`src/lib/rate-limit.ts`)
- 키 미설정 / 호출 실패 / Upstash 미설정 시 friendly degradation (운영 키 없어도 앱은 동작)
- 동작 원리 학습 자료: [`docs/study/01-ai-chatbot.md`](./docs/study/01-ai-chatbot.md)

### 운영
- `/visitor-log?secret=…` — 비공개 방문자 통계 페이지 (밝은 페이퍼 톤, 대시보드 layout 과 무관한 독립 페이지)
- `mbk_visitor_logs` — proxy 가 fire-and-forget INSERT (자기 자신 미기록)

### 자동 처리
- 동시 예약 충돌 방지 — PL/pgSQL RPC `create_reservation` 트랜잭션
- 고객 upsert — `(business_id, phone)` 유니크 + visit_count 누적
- 멀티테넌트 격리 — RLS + `mbk_users` 헬퍼 (`is_mbk_user()`)

---

## 디자인 시스템

비개발자(가게 사장님 + 손님)가 보고도 거부감 없도록, **다크 테마 없이** 페이퍼 톤으로 통일.

| 토큰 | 값 (요약) | 용도 |
| :--- | :--- | :--- |
| `--paper`, `--surface` | 따뜻한 베이지 톤 | 페이지 배경 / 카드 |
| `--ink`, `--ink-2`, `--ink-3` | 잉크 블랙 ~ 그레이 | 본문 / 보조 텍스트 |
| `--accent` | 인디고 `#4F46E5` | 버튼 / 강조 / 캘린더 선택 / 챗봇 |
| `Instrument Serif` / `Pretendard` | — | 디스플레이 / 본문 |

원칙:

- 검정 바탕 + 흰 글자 조합 금지 (CTA / 버튼 / 캘린더 / 챗봇 모두 인디고 그라디언트)
- 캘린더 선택일 · 오늘 표시 · 시간 슬롯 선택 → 반투명 인디고 (`rgba(99, 102, 241, *)`)
- 화려한 그라디언트 / 네온 / 글래스모피즘 남발 금지

토큰 정의: [`src/app/globals.css`](./src/app/globals.css)

---

## 사용자 격리 (중요)

본 프로젝트는 같은 Supabase 인스턴스를 다른 앱과 공유하더라도 **완전히 분리되도록** 설계되어 있습니다.

- 모든 애플리케이션 테이블은 `mbk_` prefix를 사용합니다.
- `auth.users` 는 인스턴스 공용이지만, 본 앱은 `mbk_users` 라는 앱 전용 사용자 프로필 테이블을 둡니다.
- 회원가입 시 `mbk_users` 에 row 가 INSERT 되고, 로그인 시 `mbk_users` 존재 여부를 확인합니다.
- RLS 의 모든 owner 정책은 `is_mbk_user() AND owner_id = auth.uid()` 형태로 작성되어, mbk_users 에 row 가 없는 외부 앱 사용자는 본 앱 데이터에 절대 접근할 수 없습니다.

자세한 설계: [`docs/handover/05-database.md`](./docs/handover/05-database.md), [`docs/handover/07-auth-permission.md`](./docs/handover/07-auth-permission.md)

---

## 로컬 실행

```bash
git clone https://github.com/MoGuWai7/moguwai-booking.git
cd moguwai-booking
npm install
cp .env.example .env.local
# .env.local 에 Supabase + Gemini 키 입력
npm run dev
```

상세 절차: [`docs/handover/02-setup.md`](./docs/handover/02-setup.md)

### Supabase 초기화

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. SQL Editor에서 [`supabase/schema.sql`](./supabase/schema.sql) 실행
3. (선택) 시드 데이터: `npx tsx scripts/seed.ts`

---

## 환경변수

`.env.local` 에 정의 (저장소에는 절대 커밋하지 마세요).

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # 서버 전용 — 클라이언트 노출 금지
GEMINI_API_KEY=               # 선택 — 미설정 시 챗봇만 비활성화
LOG_SECRET_KEY=               # /visitor-log?secret=... 일치 필수
UPSTASH_REDIS_REST_URL=       # 운영 권장 — 미설정 시 /api/chat rate limit 비활성
UPSTASH_REDIS_REST_TOKEN=     # 위와 함께
```

각 변수 의미: [`docs/handover/04-env.md`](./docs/handover/04-env.md)

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` 는 RLS 를 우회하는 슈퍼 권한 키입니다. 클라이언트 컴포넌트에서 import 금지.
> ⚠️ `LOG_SECRET_KEY` 는 운영 환경에서 충분히 길고 추측 어려운 랜덤 문자열로 설정하세요.
> ⚠️ Upstash 키 미설정 시 챗봇은 정상 동작하지만 **rate limit 자체가 비활성화**됩니다. 운영에서는 반드시 등록.

---

## 배포

기본 권장 — **Vercel + Supabase**.

1. Vercel 에서 GitHub 저장소 import (Framework: Next.js, 기본 설정 그대로)
2. Vercel Environment Variables 에 위 7개 등록 (Production / Preview / Development 모두)
   - Upstash 두 변수는 https://console.upstash.com 에서 무료 가입 → Regional DB 생성 → REST API 탭에서 복사
3. Supabase Auth → URL Configuration 의 Site URL 을 Vercel 배포 도메인으로 설정

상세 절차 및 배포 후 체크리스트: [`docs/handover/09-deployment.md`](./docs/handover/09-deployment.md)

---

## 폴더 구조 (요약)

```
.
├── src/
│   ├── app/              ← Next.js App Router 라우트
│   ├── components/       ← 재사용 컴포넌트 (booking / dashboard / chatbot / ui)
│   ├── lib/              ← supabase 클라이언트 팩토리, 유틸, rate-limit (Upstash)
│   ├── types/database.ts ← DB 모델 타입
│   └── proxy.ts          ← Next.js 16 proxy (구 middleware) — 세션 갱신 + 방문자 로그
├── supabase/
│   ├── schema.sql        ← 테이블/RPC/RLS 정의 (mbk_* + mbk_users)
│   └── seed.sql
├── scripts/seed.ts       ← TS 시드 (사용자/가게/예약 자동 생성)
├── docs/                 ← user-manual + handover 인수인계 문서
└── public/
```

자세한 구조 설명: [`docs/handover/03-project-structure.md`](./docs/handover/03-project-structure.md)

---

## 테스트 / 검증

자동화된 단위/E2E 테스트는 아직 없습니다. **수동 회귀 테스트 체크리스트**: [`docs/handover/12-test-checklist.md`](./docs/handover/12-test-checklist.md)

```bash
npm run lint
npm run build
```

---

## 문서

```
docs/
├── README.md            ← 문서 인덱스
├── user-manual/         ← 실 사용자 매뉴얼 (사장님 / 손님)
├── handover/            ← 개발자 인수인계 (01~13)
└── study/               ← 학습 자료 (구조 / 원리 해설)
```

- **인수받는 개발자**: [`docs/handover/01-handover-overview.md`](./docs/handover/01-handover-overview.md) 부터 순서대로
- **AI 챗봇 동작 원리 학습**: [`docs/study/01-ai-chatbot.md`](./docs/study/01-ai-chatbot.md)

---

## 라이선스

본 저장소의 라이선스는 별도 명시 전까지 **All rights reserved** 로 간주합니다.
저장소 사용/공개 시 명시적 라이선스(LICENSE) 추가가 필요합니다.
