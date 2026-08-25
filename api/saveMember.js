import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const sql = neon(process.env.DATABASE_URL);
  const { id, name, license, billing, team, note, coachLicense } = req.body;

  // パラメータ検証
  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter: name',
    });
  }

  // ライセンスの検証
  const validLicenses = ['1級', '2級', '3級', '4級', '女子1級', '女子2級', ''];
  if (license && !validLicenses.includes(license)) {
    return res.status(400).json({
      success: false,
      error: `Invalid license. Must be one of: ${validLicenses.join(', ')}`,
    });
  }

  // チームの検証
  const validTeams = ['A', 'B', ''];
  if (team && !validTeams.includes(team)) {
    return res.status(400).json({
      success: false,
      error: `Invalid team. Must be one of: ${validTeams.join(', ')}`,
    });
  }

  // コーチライセンスの検証
  const validCoachLicenses = ['S級', 'A級', 'B級', 'C級', 'D級', 'キッズリーダー', ''];
  if (coachLicense && !validCoachLicenses.includes(coachLicense)) {
    return res.status(400).json({
      success: false,
      error: `Invalid coachLicense. Must be one of: ${validCoachLicenses.join(', ')}`,
    });
  }

  try {
    let result;

    if (id) {
      // UPSERT: 存在すればUPDATE、なければINSERT
      result = await sql`
        INSERT INTO referees (id, name, license, billing, team, note, coachLicense)
        VALUES (${id}, ${name}, ${license || null}, ${billing || false}, ${team || null}, ${note || null}, ${coachLicense || null})
        ON CONFLICT (id) DO UPDATE SET
          name = ${name},
          license = ${license || null},
          billing = ${billing || false},
          team = ${team || null},
          note = ${note || null},
          coachLicense = ${coachLicense || null},
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
    } else {
      // 新規作成（IDなし）
      result = await sql`
        INSERT INTO referees (name, license, billing, team, note, coachLicense)
        VALUES (${name}, ${license || null}, ${billing || false}, ${team || null}, ${note || null}, ${coachLicense || null})
        RETURNING *
      `;
    }

    return res.status(200).json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error('saveMember error:', error);

    // ユニーク制約違反
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: `Member with name "${name}" already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
