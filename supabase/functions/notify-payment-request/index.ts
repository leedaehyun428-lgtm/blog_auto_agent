const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

type PaymentPayload = {
  record?: {
    id?: string;
    depositor_name?: string;
    amount?: number;
  };
  paymentRequestId?: string;
  depositorName?: string;
  amount?: number;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
    const webhookSecret = Deno.env.get('PAYMENT_WEBHOOK_SECRET');

    if (!botToken || !chatId) {
      return new Response(
        JSON.stringify({ error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Optional shared-secret verification for DB webhook requests.
    if (webhookSecret) {
      const incomingSecret = req.headers.get('x-webhook-secret') ?? '';
      if (incomingSecret !== webhookSecret) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const body = (await req.json().catch(() => ({}))) as PaymentPayload;

    // DB trigger payload 우선 사용, 없으면 직접 호출 payload fallback.
    const depositorName = body.record?.depositor_name ?? body.depositorName ?? '미입력';
    const amount = Number(body.record?.amount ?? body.amount ?? 0);
    const formattedAmount = Number.isFinite(amount) ? amount.toLocaleString('ko-KR') : '0';

    const message =
      `[💰 입금 신청 알림]\n` +
      `입금자: ${depositorName}\n` +
      `금액: ${formattedAmount}원`;

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });

    if (!telegramResponse.ok) {
      const detail = await telegramResponse.text();
      return new Response(JSON.stringify({ error: 'Telegram send failed', detail }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

