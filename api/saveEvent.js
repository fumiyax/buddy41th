import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const sql = neon(process.env.DATABASE_URL);
  const { id, date, type, title, location, time, category, fileUrl, note } = req.body;

  // パラメータ検証
  if (!date || !type || !title) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: date, type, title',
    });
  }

  if (!['official', 'friendly'].includes(type)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid type. Must be "official" or "friendly"',
    });
  }

  try {
    let result;

    if (id) {
      // UPSERT: 存在すればUPDATE、なければINSERT
      result = await sql`
        INSERT INTO matches (id, date, type, title, location, time, category, fileUrl, note)
        VALUES (${id}, ${date}, ${type}, ${title}, ${location || null}, ${time || null}, ${category || null}, ${fileUrl || null}, ${note || null})
        ON CONFLICT (id) DO UPDATE SET
          date = ${date},
          type = ${type},
          title = ${title},
          location = ${location || null},
          time = ${time || null},
          category = ${category || null},
          fileUrl = ${fileUrl || null},
          note = ${note || null},
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
    } else {
      // 新規作成（IDなし）
      result = await sql`
        INSERT INTO matches (date, type, title, location, time, category, fileUrl, note)
        VALUES (${date}, ${type}, ${title}, ${location || null}, ${time || null}, ${category || null}, ${fileUrl || null}, ${note || null})
        RETURNING *
      `;
    }

    return res.status(200).json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error('saveEvent error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
