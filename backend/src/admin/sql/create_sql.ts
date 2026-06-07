export default `CREATE TABLE IF NOT EXISTS users (
    nickname TEXT,
    last_login INTEGER,
    deleted_at INTEGER,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'USER',
    gender INTEGER DEFAULT 3,
    reg_time INTEGER NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    avatar BOOLEAN DEFAULT FALSE,
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT COLLATE NOCASE NOT NULL UNIQUE,
    info TEXT DEFAULT '{"ip": "", "email": "", "phone": "", "birthday": "", "bio": ""}'
);

CREATE TABLE IF NOT EXISTS users_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_info TEXT,
    token TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    login_time INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deleted_at INTEGER,
    title TEXT NOT NULL,
    desc TEXT DEFAULT '',
    user_id INTEGER NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);`;
