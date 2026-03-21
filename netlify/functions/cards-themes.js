const { getSupabaseAdmin, handleOptions, jsonResponse } = require('./utils/supabase');

// Hardcoded fallback themes in case Supabase is not yet configured
const FALLBACK_THEMES = [
  { id: 'birthday', name: 'Happy Birthday', description: 'Celebrate another year of joy', emoji: '🎂', colors: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accent: '#F59E0B' }, tierRequired: 'FREE' },
  { id: 'love', name: 'With Love', description: 'Express your deepest feelings', emoji: '❤️', colors: { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', accent: '#FF6B6B' }, tierRequired: 'FREE' },
  { id: 'thank-you', name: 'Thank You', description: 'Show your gratitude', emoji: '🙏', colors: { background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', accent: '#00D4FF' }, tierRequired: 'FREE' },
  { id: 'congratulations', name: 'Congratulations', description: 'Celebrate achievements big and small', emoji: '🎉', colors: { background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', accent: '#43E97B' }, tierRequired: 'FREE' },
  { id: 'anniversary', name: 'Anniversary', description: 'Mark another year together', emoji: '💍', colors: { background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', accent: '#FA709A' }, tierRequired: 'KEEPER' },
  { id: 'graduation', name: 'Graduation', description: 'Cap, gown, and a voice full of pride', emoji: '🎓', colors: { background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', accent: '#A18CD1' }, tierRequired: 'KEEPER' },
  { id: 'holiday', name: 'Holiday Cheer', description: 'Warm wishes for the season', emoji: '🎄', colors: { background: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)', accent: '#FF4444' }, tierRequired: 'KEEPER' },
  { id: 'get-well', name: 'Get Well Soon', description: 'Send healing vibes and comfort', emoji: '🌻', colors: { background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', accent: '#F6D365' }, tierRequired: 'KEEPER' },
  { id: 'baby', name: 'New Baby', description: 'Welcome the newest family member', emoji: '👶', colors: { background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', accent: '#FCB69F' }, tierRequired: 'KEEPER' },
  { id: 'memorial', name: 'In Memory', description: 'Honor and remember those who meant everything', emoji: '🕯️', colors: { background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', accent: '#E8D5B7' }, tierRequired: 'KEEPER' },
  { id: 'encouragement', name: 'You Got This', description: 'Uplift someone who needs strength', emoji: '💪', colors: { background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', accent: '#FF9A9E' }, tierRequired: 'KEEPER' },
  { id: 'miss-you', name: 'Miss You', description: 'Bridge the distance with your voice', emoji: '💜', colors: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accent: '#764BA2' }, tierRequired: 'KEEPER' },
];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Try to fetch from Supabase
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      const { data: themes, error } = await supabaseAdmin
        .from('card_themes')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && themes && themes.length > 0) {
        const formatted = themes.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          emoji: t.emoji,
          colors: {
            background: t.bg_color,
            accent: t.accent_color,
          },
          tierRequired: t.tier_required,
        }));
        return jsonResponse(200, { themes: formatted });
      }
    }

    // Fallback to hardcoded themes
    return jsonResponse(200, { themes: FALLBACK_THEMES });
  } catch (err) {
    console.error('Themes error:', err);
    // Always return themes even on error
    return jsonResponse(200, { themes: FALLBACK_THEMES });
  }
};
