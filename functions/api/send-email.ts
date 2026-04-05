// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { type, recipientEmail, cardId, senderName, occasion, userName, userEmail } = body;

    if (!env.RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured." }), { status: 500 });
    }

    // Validate recipient
    const targetEmail = type === 'welcome' ? userEmail : recipientEmail;
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email address." }), { status: 400 });
    }

    const FROM_ADDRESS = "Voices You Keep <noreply@voicesyoukeep.com>";
    const baseUrl = new URL(request.url).origin;

    // ── WELCOME EMAIL ──────────────────────────────────────────────────────────
    if (type === 'welcome') {
      const welcomeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Voices You Keep!</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Inter',system-ui,sans-serif;color:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <tr>
            <td align="center" style="background:linear-gradient(135deg,#e8527a,#ff6eb4,#c084fc);border-radius:16px 16px 0 0;padding:40px 32px 32px;">
              <div style="font-size:3.5rem;margin-bottom:12px;">💐</div>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.02em;">
                Welcome to Voices You Keep!
              </h1>
              <p style="margin:12px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">
                Hi ${userName || 'there'} — your account is ready. 🎉
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#1e293b;border-radius:0 0 16px 16px;padding:36px 32px;">
              <p style="font-size:16px;line-height:1.7;color:#cbd5e1;margin:0 0 20px;">
                You just unlocked the ability to send voice cards that people will treasure forever.
                Real voice. Real emotion. A gift no physical card can replicate.
              </p>

              <div style="background:rgba(232,82,122,0.1);border:1px solid rgba(232,82,122,0.25);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#ff6eb4;">🌸 Mother's Day is May 10th</p>
                <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.6;">
                  You have <strong style="color:#f8fafc;">35 days</strong> to create something Mom will replay forever.
                  Your free account lets you start right now — no credit card needed.
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${baseUrl}/create"
                       style="display:inline-block;background:linear-gradient(135deg,#e8527a,#ff6eb4);color:#fff;text-decoration:none;
                              padding:16px 40px;border-radius:9999px;font-weight:700;font-size:17px;
                              box-shadow:0 4px 20px rgba(0,0,0,0.3);">
                      🎙️ Create Your First Voice Card
                    </a>
                  </td>
                </tr>
              </table>

              <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;">
                <p style="margin:0 0 12px;font-size:14px;color:#94a3b8;font-weight:600;">What you can do for free:</p>
                <p style="margin:0 0 6px;font-size:13px;color:#cbd5e1;">✓ Record your voice message (up to 60 seconds)</p>
                <p style="margin:0 0 6px;font-size:13px;color:#cbd5e1;">✓ Create beautiful animated envelope cards</p>
                <p style="margin:0 0 6px;font-size:13px;color:#cbd5e1;">✓ Share the card link with anyone</p>
                <p style="margin:0 0 24px;font-size:13px;color:#94a3b8;">Upgrade to Plus to send directly by email, or Pro for unlimited storage and the Voice Vault.</p>
              </div>

              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0 0 20px;" />
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:700;">
                      <span style="color:#e8527a;">Voices</span><span style="color:#40e0d0;">YouKeep</span>™
                    </p>
                    <p style="margin:0;font-size:11px;color:#334155;">Privacy First · We never sell or train on your voice data.</p>
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
          from: FROM_ADDRESS,
          to: [targetEmail],
          subject: `💐 Welcome to Voices You Keep, ${userName || 'friend'}!`,
          html: welcomeHtml
        })
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), { status: res.status });
    }

    // ── CARD DELIVERY EMAIL ────────────────────────────────────────────────────
    if (!cardId || !senderName || !occasion) {
      return new Response(JSON.stringify({ error: "Missing required fields for delivery email." }), { status: 400 });
    }

    const cardUrl = `${baseUrl}/card/${cardId}`;
    const isMothersDay = occasion?.toLowerCase().includes("mother");
    const isFathersDay = occasion?.toLowerCase().includes("father");
    const isBirthday = occasion?.toLowerCase().includes("birthday");
    const isChristmas = occasion?.toLowerCase().includes("christmas");
    const isGraduation = occasion?.toLowerCase().includes("graduation");

    const occasionLabel = isMothersDay ? "Mother's Day"
      : isFathersDay ? "Father's Day"
      : isBirthday ? "Birthday"
      : isChristmas ? "Christmas"
      : isGraduation ? "Graduation"
      : occasion ? occasion.charAt(0).toUpperCase() + occasion.slice(1)
      : "Special";

    const accentColor = isMothersDay ? "#e8527a"
      : isFathersDay ? "#1d4ed8"
      : isBirthday ? "#f59e0b"
      : "#8a2be2";

    const headerEmoji = isMothersDay ? "💐"
      : isFathersDay ? "🏆"
      : isBirthday ? "🎂"
      : isChristmas ? "🎄"
      : isGraduation ? "🎓"
      : "🎉";

    const gradient = isMothersDay ? "linear-gradient(135deg,#e8527a,#ff6eb4)"
      : isFathersDay ? "linear-gradient(135deg,#1d4ed8,#3b82f6)"
      : isBirthday ? "linear-gradient(135deg,#f59e0b,#fbbf24)"
      : isChristmas ? "linear-gradient(135deg,#16a34a,#4ade80)"
      : isGraduation ? "linear-gradient(135deg,#7c3aed,#a78bfa)"
      : "linear-gradient(135deg,#8a2be2,#40e0d0)";

    const deliveryHtml = `<!DOCTYPE html>
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

          <tr>
            <td align="center" style="background:${gradient};border-radius:16px 16px 0 0;padding:40px 32px 32px;">
              <div style="font-size:3.5rem;margin-bottom:12px;">${headerEmoji}</div>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.02em;">
                You have a ${occasionLabel} Voice Card!
              </h1>
              <p style="margin:12px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">
                <strong>${senderName}</strong> recorded something special just for you.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#1e293b;border-radius:0 0 16px 16px;padding:36px 32px;">
              <p style="font-size:16px;line-height:1.7;color:#cbd5e1;margin:0 0 28px;">
                Someone who cares about you recorded a real voice message and turned it into
                a beautiful interactive card — just for you. Tap the button below to open it.
              </p>

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

              <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
                          border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.6;">
                  <strong style="color:#f8fafc;">How to open it:</strong> Tap the button above,
                  then tap the envelope to open it. Confetti bursts out and
                  <strong style="color:#f8fafc;">${senderName}'s voice message plays automatically</strong> —
                  a card you can open again and again.
                </p>
              </div>

              <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
                          border-radius:12px;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;">Or copy this link:</p>
                <p style="margin:0;font-size:13px;color:#60a5fa;word-break:break-all;">${cardUrl}</p>
              </div>

              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0 0 24px;" />
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:700;">
                      <span style="color:${accentColor};">Voices</span><span style="color:#40e0d0;">YouKeep</span>™
                    </p>
                    <p style="margin:0;font-size:12px;color:#475569;">Create your own voice card at voicesyoukeep.com</p>
                    <p style="margin:8px 0 0;font-size:11px;color:#334155;">Privacy First · We never sell or train on your voice data.</p>
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
        from: FROM_ADDRESS,
        to: [targetEmail],
        subject: `${headerEmoji} ${senderName} sent you a ${occasionLabel} Voice Card!`,
        html: deliveryHtml
      })
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: res.status });

  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: "Failed to send email. Please try again." }), { status: 500 });
  }
}
