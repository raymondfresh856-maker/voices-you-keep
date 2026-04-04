// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    const { recipientEmail, cardId, senderName, occasion } = await request.json();

    if (!env.RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY in Cloudflare environment" }), { status: 500 });
    }

    const baseUrl = new URL(request.url).origin;
    const cardUrl = `${baseUrl}/card/${cardId}`;

    const isMothersDay = occasion?.toLowerCase().includes("mother");
    const isFathersDay = occasion?.toLowerCase().includes("father");

    const occasionLabel = isMothersDay
      ? "Mother's Day"
      : isFathersDay
      ? "Father's Day"
      : occasion
          ? occasion.charAt(0).toUpperCase() + occasion.slice(1)
          : "Special";

    const accentColor = isMothersDay ? "#e8527a" : isFathersDay ? "#1d4ed8" : "#8a2be2";
    const headerEmoji = isMothersDay ? "💐" : isFathersDay ? "🏆" : "🎉";
    const gradient = isMothersDay
      ? "linear-gradient(135deg, #e8527a, #ff6eb4)"
      : isFathersDay
      ? "linear-gradient(135deg, #1d4ed8, #3b82f6)"
      : "linear-gradient(135deg, #8a2be2, #40e0d0)";

    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${senderName} sent you a Voice Card!</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Inter',system-ui,sans-serif;color:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="background:${gradient};border-radius:16px 16px 0 0;padding:40px 32px 32px;">
              <div style="font-size:3.5rem;margin-bottom:12px;">${headerEmoji}</div>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.02em;">
                You have a ${occasionLabel} Voice Card!
              </h1>
              <p style="margin:12px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">
                ${senderName} recorded something special just for you.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#1e293b;border-radius:0 0 16px 16px;padding:36px 32px;">

              <p style="font-size:16px;line-height:1.7;color:#cbd5e1;margin:0 0 28px;">
                Someone who cares about you took the time to record a real voice message
                and turned it into a beautiful interactive card — just for you.
                Tap the button below to open it.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${cardUrl}"
                       style="display:inline-block;background:${gradient};color:#fff;text-decoration:none;
                              padding:16px 40px;border-radius:9999px;font-weight:700;font-size:17px;
                              box-shadow:0 4px 20px rgba(0,0,0,0.3);letter-spacing:0.01em;">
                      ${headerEmoji} Open Your ${occasionLabel} Card
                    </a>
                  </td>
                </tr>
              </table>

              <!-- How it works hint -->
              <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
                          border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.6;">
                  <strong style="color:#f8fafc;">How it works:</strong> Tap the button above,
                  then tap the envelope to open it. Confetti bursts and
                  <strong style="color:#f8fafc;">${senderName}'s voice message plays automatically</strong> —
                  a card you can open again and again.
                </p>
              </div>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0 0 24px;" />

              <!-- Footer brand -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:700;">
                      <span style="color:${accentColor};">Voices</span>
                      <span style="color:#40e0d0;">YouKeep</span>™
                    </p>
                    <p style="margin:0;font-size:12px;color:#475569;">
                      Create your own voice card at voicesyoukeep.com
                    </p>
                    <p style="margin:8px 0 0;font-size:11px;color:#334155;">
                      Privacy First · We never sell or train on your voice data.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Voices You Keep <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `${headerEmoji} ${senderName} sent you a ${occasionLabel} Voice Card!`,
        html: emailHtml
      })
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: res.status });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to process email request" }), { status: 500 });
  }
}
