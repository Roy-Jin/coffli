import { Hono } from "hono";
import { createError, createSuccess, ErrorCodes } from "../../../utils/json_resp";
import searchData from "../../../utils/search_data";

const search = new Hono();

// GET /api/v1/search           ?keyword=%s&page=%d&size=%d     → 搜索
// GET /api/v1/search/users     ?keyword=%s&page=%d&size=%d     → 用户搜索
// GET /api/v1/search/posts     ?keyword=%s&page=%d&size=%d     → 博客搜索

search.get("/", async (c) => {
    const queries = c.req.query();
    if (!queries.keyword) {
        return c.json(
            createError(ErrorCodes.MISSING_PARAM, "missing keyword parameter"),
            400,
        );
    }
    const { data, meta } = await searchData(c, ["users", "posts"], queries);
    return c.json(
        createSuccess(data, meta),
    );
});

search.get("/users", async (c) => {
    const queries = c.req.query();
    if (!queries.keyword) {
        return c.json(
            createError(ErrorCodes.MISSING_PARAM, "missing keyword parameter"),
            400,
        );
    }
    const { data, meta } = await searchData(c, ["users"], queries);
    return c.json(
        createSuccess(data, meta),
    );
});

search.get("/posts", async (c) => {
    const queries = c.req.query();
    if (!queries.keyword) {
        return c.json(
            createError(ErrorCodes.MISSING_PARAM, "missing keyword parameter"),
            400,
        );
    }
    const { data, meta } = await searchData(c, ["posts"], queries);
    return c.json(
        createSuccess(data, meta),
    );
});

export default search;
