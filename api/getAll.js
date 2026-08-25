import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // matches テーブル
    const matchesResult = await sql`
      SELECT * FROM matches ORDER BY date DESC
    `;

    // referees テーブル
    const refereesResult = await sql`
      SELECT * FROM referees ORDER BY name ASC
    `;

    // attendance テーブル
    const attendanceResult = await sql`
      SELECT * FROM attendance
    `;

    // フィールド名をキャメルケースに変換
    const events = matchesResult.map(m => ({
      id: m.id,
      date: m.date,
      type: m.type,
      title: m.title,
      location: m.location,
      time: m.time,
      category: m.category,
      fileUrl: m.fileurl,
      note: m.note
    }));

    const members = refereesResult.map(r => ({
      id: r.id,
      name: r.name,
      license: r.license,
      billing: r.billing,
      team: r.team,
      note: r.note,
      coachLicense: r.coachlicense
    }));

    const attendance = attendanceResult.map(a => ({
      eventId: a.eventid,
      memberId: a.memberid,
      status: a.status,
      comment: a.comment
    }));

    return res.status(200).json({
      events,
      members,
      attendance,
    });
  } catch (error) {
    console.error('getAll error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
