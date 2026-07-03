import type { Comment, Post, Session, Tag, User } from "@/types/sql";
import bcrypt from "bcryptjs";

// ==========================================
// SQL Schemas
// ==========================================

export const CREATE_TABLE_SQL = `
-- 1. 开启外键约束
PRAGMA foreign_keys = ON;

-- ==========================================
-- Table: users (用户表)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Github 信息
    github_id TEXT NOT NULL UNIQUE,
    github_login TEXT NOT NULL UNIQUE, -- Github 用户名，作为密码登录的账号名，必须唯一
    
    -- 个人信息
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    
    -- 密码 (用户设置后才有值，默认为 NULL)
    password_hash TEXT,
    
    -- 系统字段
    role TEXT DEFAULT 'reader',
    created_at TEXT DEFAULT (datetime('now')),
    last_login_at TEXT
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_users_github_login ON users(github_login); -- 加速用户名密码登录查询

-- ==========================================
-- Table: sessions (会话表)
-- ==========================================
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ==========================================
-- Table: posts (文章表)
-- ==========================================
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    cover_image_url TEXT,
    status TEXT DEFAULT 'draft',
    is_pinned BOOLEAN DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    published_at TEXT,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);

-- ==========================================
-- Table: tags (标签表)
-- ==========================================
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE
);

-- ==========================================
-- Table: post_tags (文章-标签关联表)
-- ==========================================
CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- ==========================================
-- Table: comments (评论表)
-- ==========================================
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER DEFAULT NULL,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
`;

export const DROP_TABLE_SQL = `
DROP TABLE IF EXISTS post_tags;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;
`;

// ==========================================
// Password Utilities
// ==========================================

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

export async function verifyPassword(
    password: string,
    hash: string,
): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

// ==========================================
// Base Operations
// ==========================================

export async function execSQL(D1: D1Database, sql: string) {
    return await D1.exec(sql);
}

export async function initTables(D1: D1Database) {
    return await execSQL(D1, CREATE_TABLE_SQL);
}

export async function dropTables(D1: D1Database) {
    return await execSQL(D1, DROP_TABLE_SQL);
}

// ==========================================
// Auth Operations (认证逻辑)
// ==========================================

/**
 * 1. OAuth: 根据 Github ID 查找用户
 */
export async function getUserByGithubId(
    D1: D1Database,
    githubId: string,
): Promise<User | null> {
    const result = await D1.prepare("SELECT * FROM users WHERE github_id = ?")
        .bind(githubId)
        .first<User>();
    return result || null;
}

/**
 * 2. OAuth: 创建或更新用户
 * 首次登录时创建，之后登录更新头像/最后登录时间
 * 注意：不更新 password_hash，防止用户设置密码后被覆盖
 */
export async function upsertUserFromGithub(
    D1: D1Database,
    userData: {
        github_id: string;
        github_login: string;
        avatar_url: string;
        bio?: string;
        email?: string;
    },
): Promise<User> {
    const query = `
    INSERT INTO users (github_id, github_login, display_name, avatar_url, bio, email, last_login_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(github_id) DO UPDATE SET
      avatar_url = excluded.avatar_url,
      display_name = excluded.github_login,
      email = COALESCE(excluded.email, users.email),
      last_login_at = datetime('now')
      -- 注意：这里故意没有更新 password_hash
    RETURNING *
  `;
    const result = await D1.prepare(query)
        .bind(
            userData.github_id,
            userData.github_login,
            userData.github_login,
            userData.avatar_url,
            userData.bio || "",
            userData.email || null,
        )
        .first<User>();

    if (!result) throw new Error("Failed to upsert user");
    return result;
}

/**
 * 3. Password: 根据 Github 用户名查找用户
 * 用于密码登录的第一步
 */
export async function getUserByGithubLogin(
    D1: D1Database,
    githubLogin: string,
): Promise<User | null> {
    // Github 用户名通常不区分大小写，建议存小写或统一查询
    // 这里假设存储的是原样，查询时也原样，或者你可以统一转小写
    return await D1.prepare("SELECT * FROM users WHERE github_login = ?")
        .bind(githubLogin)
        .first<User>() || null;
}

/**
 * 4. Password: 为已存在的用户设置密码 (功能)
 * 用户在个人中心调用此函数设置或修改密码
 */
export async function setUserPassword(
    D1: D1Database,
    userId: number,
    password: string,
): Promise<void> {
    const passwordHash = await hashPassword(password);
    await D1.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
        .bind(passwordHash, userId)
        .run();
}

/**
 * 5. Password: 用户名 + 密码 登录
 * 用于双机制登录中的非 OAuth 方式
 */
export async function loginUserWithUsernameAndPassword(
    D1: D1Database,
    username: string, // 这里对应 github_login
    password: string,
): Promise<User | null> {
    const user = await getUserByGithubLogin(D1, username);

    if (!user) {
        return null; // 用户名不存在
    }

    if (!user.password_hash) {
        return null; // 用户存在，但从未设置过密码，无法通过密码登录
    }

    const isValid = await verifyPassword(password, user.password_hash);

    if (isValid) {
        // 登录成功，更新最后登录时间
        await D1.prepare(
            "UPDATE users SET last_login_at = datetime('now') WHERE id = ?",
        )
            .bind(user.id)
            .run();
        return user;
    }

    return null; // 密码错误
}

export async function getUserById(
    D1: D1Database,
    id: number,
): Promise<User | null> {
    return await D1.prepare("SELECT * FROM users WHERE id = ?")
        .bind(id)
        .first<User>() || null;
}

// ==========================================
// Session Operations (会话管理)
// ==========================================

export async function createSession(
    D1: D1Database,
    sessionData: {
        id: string;
        user_id: number;
        expires_at: string;
        ip_address?: string;
        user_agent?: string;
    },
): Promise<void> {
    await D1.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
            sessionData.id,
            sessionData.user_id,
            sessionData.expires_at,
            sessionData.ip_address || null,
            sessionData.user_agent || null,
        ).run();
}

export async function getSession(
    D1: D1Database,
    sessionId: string,
): Promise<Session | null> {
    const result = await D1.prepare(
        "SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')",
    )
        .bind(sessionId)
        .first<Session>();
    return result || null;
}

export async function deleteSession(
    D1: D1Database,
    sessionId: string,
): Promise<void> {
    await D1.prepare("DELETE FROM sessions WHERE id = ?")
        .bind(sessionId)
        .run();
}

export async function deleteExpiredSessions(D1: D1Database): Promise<void> {
    await D1.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')")
        .run();
}

// ==========================================
// Post Operations
// ==========================================

export async function getPosts(D1: D1Database, options: {
    status?: "draft" | "published" | "archived";
    limit?: number;
    offset?: number;
}): Promise<Post[]> {
    const { status = "published", limit = 10, offset = 0 } = options;
    return await D1.prepare(`
    SELECT * FROM posts 
    WHERE status = ? 
    ORDER BY is_pinned DESC, published_at DESC 
    LIMIT ? OFFSET ?
  `).bind(status, limit, offset).all<Post>().then((r) => r.results);
}

export async function getPostBySlug(
    D1: D1Database,
    slug: string,
): Promise<Post | null> {
    return await D1.prepare("SELECT * FROM posts WHERE slug = ?")
        .bind(slug)
        .first<Post>() || null;
}

export async function getPostById(
    D1: D1Database,
    id: number,
): Promise<Post | null> {
    return await D1.prepare("SELECT * FROM posts WHERE id = ?")
        .bind(id)
        .first<Post>() || null;
}

export async function createPost(D1: D1Database, postData: {
    author_id: number;
    slug: string;
    title: string;
    content: string;
    summary?: string;
    status?: "draft" | "published";
    published_at?: string;
}): Promise<void> {
    const now = new Date().toISOString();
    await D1.prepare(`
    INSERT INTO posts (author_id, slug, title, content, summary, status, published_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
            postData.author_id,
            postData.slug,
            postData.title,
            postData.content,
            postData.summary || null,
            postData.status || "draft",
            postData.published_at || null,
            now,
            now,
        ).run();
}

export async function updatePost(
    D1: D1Database,
    id: number,
    updates: Partial<
        Pick<Post, "title" | "content" | "summary" | "status" | "is_pinned">
    >,
): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    if (updates.title !== undefined) {
        fields.push("title = ?");
        values.push(updates.title);
    }
    if (updates.content !== undefined) {
        fields.push("content = ?");
        values.push(updates.content);
    }
    if (updates.summary !== undefined) {
        fields.push("summary = ?");
        values.push(updates.summary);
    }
    if (updates.status !== undefined) {
        fields.push("status = ?");
        values.push(updates.status);
    }
    if (updates.is_pinned !== undefined) {
        fields.push("is_pinned = ?");
        values.push(updates.is_pinned);
    }
    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await D1.prepare(`UPDATE posts SET ${fields.join(", ")} WHERE id = ?`)
        .bind(...values)
        .run();
}

export async function incrementViewCount(
    D1: D1Database,
    postId: number,
): Promise<void> {
    await D1.prepare(
        "UPDATE posts SET view_count = view_count + 1 WHERE id = ?",
    )
        .bind(postId)
        .run();
}

// ==========================================
// Tag Operations
// ==========================================

export async function getAllTags(D1: D1Database): Promise<Tag[]> {
    return await D1.prepare("SELECT * FROM tags")
        .all<Tag>()
        .then((r) => r.results);
}

export async function getTagsByPostId(
    D1: D1Database,
    postId: number,
): Promise<Tag[]> {
    return await D1.prepare(`
    SELECT t.* FROM tags t
    JOIN post_tags pt ON t.id = pt.tag_id
    WHERE pt.post_id = ?
  `).bind(postId).all<Tag>().then((r) => r.results);
}

export async function attachTagsToPost(
    D1: D1Database,
    postId: number,
    tagNames: string[],
): Promise<void> {
    const tagIds: number[] = [];
    for (const name of tagNames) {
        let tag = await D1.prepare("SELECT id FROM tags WHERE name = ?")
            .bind(name)
            .first<{ id: number }>();
        if (!tag) {
            const slug = name.toLowerCase().replace(/\s+/g, "-");
            const result = await D1.prepare(
                "INSERT INTO tags (name, slug) VALUES (?, ?)",
            )
                .bind(name, slug)
                .run();
            if (result.meta.last_row_id) {
                tag = { id: result.meta.last_row_id };
            }
        }
        if (tag) tagIds.push(tag.id);
    }
    const stmts = tagIds.map((tagId) =>
        D1.prepare(
            "INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)",
        )
            .bind(postId, tagId)
    );
    await D1.batch(stmts);
}

// ==========================================
// Comment Operations
// ==========================================

export async function getCommentsByPostId(
    D1: D1Database,
    postId: number,
): Promise<
    (Comment & {
        user: Pick<User, "github_login" | "avatar_url" | "display_name">;
    })[]
> {
    const { results } = await D1.prepare(`
    SELECT 
      c.*, 
      u.github_login, 
      u.avatar_url, 
      u.display_name 
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).bind(postId).all();

    return results.map((row: any) => ({
        id: row.id,
        post_id: row.post_id,
        user_id: row.user_id,
        parent_id: row.parent_id,
        content: row.content,
        is_approved: row.is_approved,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: {
            github_login: row.github_login,
            avatar_url: row.avatar_url,
            display_name: row.display_name,
        },
    }));
}

export async function createComment(
    D1: D1Database,
    commentData: {
        post_id: number;
        user_id: number;
        content: string;
        parent_id?: number;
    },
): Promise<void> {
    await D1.prepare(`
    INSERT INTO comments (post_id, user_id, content, parent_id)
    VALUES (?, ?, ?, ?)
  `).bind(
            commentData.post_id,
            commentData.user_id,
            commentData.content,
            commentData.parent_id || null,
        ).run();
}
