import { Context } from "hono";

async function searchData(
    c: Context,
    types: Array<"users" | "posts">,
    queries: Record<string, string>, // keyword, page, size
): Promise<
    { data: any; meta: { keyword: string; page: number; size: number } }
> {
    const D1 = c.env.D1;

    let { keyword: _keyword, page: _page, size: _size } = queries;
    const keyword = `%${_keyword}%`;
    const page = parseInt(_page) || 1;
    const size = parseInt(_size) > 50 ? 50 : parseInt(_size) || 10;

    let results: {
        users: Array<any>;
        posts: Array<any>;
    } = { users: [], posts: [] };

    if (_keyword && _keyword.trim() === "") {
        if (types.length === 1) {
            return { data: [], meta: { keyword: _keyword, page, size } };
        } else {
            return {
                data: results,
                meta: { keyword: _keyword, page, size },
            };
        }
    }

    for (const type of types) {
        if (type === "users") {
            const { results: users } = await D1.prepare(
                `SELECT
                    username, nickname, avatar, info, gender, role, last_login
                    FROM users WHERE
                    active = TRUE AND (username LIKE ? OR nickname LIKE ?)
                    LIMIT ?
                    OFFSET ?`,
            ).bind(keyword, keyword, size, (page - 1) * size).run();

            results["users"].push(...users);
        } else if (type === "posts") {
            const { results: posts } = await D1.prepare(
                `SELECT
                    title, desc, user_id, updated_at, created_at
                    FROM users_posts WHERE
                    active = TRUE AND (title LIKE ? OR desc LIKE ?)
                    LIMIT ?
                    OFFSET ?`,
            ).bind(keyword, keyword, size, (page - 1) * size).run();
            results["posts"].push(...posts);
        }
    }

    if (types.length === 1) {
        return {
            data: results[types[0]],
            meta: { keyword: _keyword, page, size },
        };
    }

    return { data: results, meta: { keyword: _keyword, page, size } };
}

export default searchData;
