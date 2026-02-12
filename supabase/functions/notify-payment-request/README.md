# notify-payment-request

`payment_requests` 테이블 INSERT 이벤트를 받아 텔레그램으로 관리자 알림을 전송하는 Edge Function입니다.

## Required secrets

```bash
npx supabase secrets set TELEGRAM_BOT_TOKEN=xxxxx
npx supabase secrets set TELEGRAM_CHAT_ID=xxxxx
npx supabase secrets set PAYMENT_WEBHOOK_SECRET=xxxxx
```

## Deploy

```bash
npx supabase functions deploy notify-payment-request
```

## DB Trigger

`sql/payment_request_telegram_trigger.sql`을 SQL Editor에서 실행하세요.
플레이스홀더(`PROJECT_REF`, `SUPABASE_ANON_KEY`, `PAYMENT_WEBHOOK_SECRET`)를 실제 값으로 먼저 바꿔야 합니다.
