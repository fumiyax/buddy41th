import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const sql = neon(process.env.DATABASE_URL);
  const { eventId, memberId, status, comment } = req.body;

  // パラメータ検証
  if (!eventId || !memberId || !status) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: eventId, memberId, status',
    });
  }

  const validStatuses = ['ok', 'ng', 'pnd'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  try {
    // 既存レコードを確認
    const existingResult = await sql`
      SELECT * FROM attendance
      WHERE eventId = ${eventId} AND memberId = ${memberId}
    `;

    let result;

    if (existingResult.length > 0) {
      // 更新
      result = await sql`
        UPDATE attendance
        SET
          status = ${status},
          comment = ${comment || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE eventId = ${eventId} AND memberId = ${memberId}
        RETURNING *
      `;
    } else {
      // 新規作成
      result = await sql`
        INSERT INTO attendance (eventId, memberId, status, comment)
        VALUES (${eventId}, ${memberId}, ${status}, ${comment || null})
        RETURNING *
      `;
    }

    return res.status(200).json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error('setAttendance error:', error);

    // 外部キー制約違反
    if (error.code === '23503') {
      return res.status(409).json({
        success: false,
        error: 'Invalid eventId or memberId',
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
