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

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Voices You Keep <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `${senderName} sent you a ${occasion} Voice Card!`,
        html: `
          <div style="font-family: sans-serif; text-align: center; padding: 2rem;">
            <h2>You received a Voices You Keep card!</h2>
            <p>${senderName} recorded a special interactive voice message just for you.</p>
            <br/>
            <a href="${cardUrl}" style="background-color: #8a2be2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Open Your Card
            </a>
          </div>
        `
      })
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: res.status });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to process email request" }), { status: 500 });
  }
}
