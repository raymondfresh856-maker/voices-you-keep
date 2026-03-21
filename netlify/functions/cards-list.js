const { getSupabaseAdmin, handleOptions, jsonResponse, authenticateRequest } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const auth = authenticateRequest(event);
  if (auth.error) return auth.error;

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: cards, error } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('List cards error:', error);
      return jsonResponse(500, { error: 'Failed to fetch cards' });
    }

    const formatted = (cards || []).map((c) => ({
      id: c.id,
      themeId: c.theme_id,
      title: c.title,
      message: c.message,
      senderName: c.sender_name,
      recipientName: c.recipient_name,
      recipientEmail: c.recipient_email,
      status: c.status,
      shareToken: c.share_token,
      audioUrl: c.audio_url,
      audioDuration: c.audio_duration,
      openCount: c.open_count,
      sentAt: c.sent_at,
      createdAt: c.created_at,
    }));

    return jsonResponse(200, { cards: formatted });
  } catch (err) {
    console.error('List cards error:', err);
    return jsonResponse(500, { error: 'Internal server error' });
  }
};
