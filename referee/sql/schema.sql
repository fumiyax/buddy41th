-- matches テーブル
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('official', 'friendly')),
  title TEXT NOT NULL,
  location TEXT,
  time TEXT,
  category TEXT,
  fileUrl TEXT,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- referees テーブル
CREATE TABLE IF NOT EXISTS referees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  license TEXT CHECK (license IN ('1級', '2級', '3級', '4級', '女子1級', '女子2級', '')),
  billing BOOLEAN DEFAULT FALSE,
  team TEXT CHECK (team IN ('A', 'B', '')),
  note TEXT,
  coachLicense TEXT CHECK (coachLicense IN ('S級', 'A級', 'B級', 'C級', 'D級', 'キッズリーダー', '')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- attendance テーブル
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  eventId INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  memberId INTEGER NOT NULL REFERENCES referees(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('ok', 'ng', 'pnd')),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(eventId, memberId)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
CREATE INDEX IF NOT EXISTS idx_matches_type ON matches(type);
CREATE INDEX IF NOT EXISTS idx_attendance_eventId ON attendance(eventId);
CREATE INDEX IF NOT EXISTS idx_attendance_memberId ON attendance(memberId);
