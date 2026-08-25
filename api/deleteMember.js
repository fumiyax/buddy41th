import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const sql = neon(process.env.DATABASE_URL);
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter: id',
    });
  }

  try {
    const result = await sql`
      DELETE FROM referees
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Member with id ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error('deleteMember error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
