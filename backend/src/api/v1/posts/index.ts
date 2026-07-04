import { Hono } from "hono";
import { createError, createSuccess, ReasonPhrases } from "@/utils/respond";
import { requireAuth, getCurrentUser } from "@/utils/session";
import {
    attachTagsToPost,
    createComment,
    createPost,
    deleteComment,
    getAllTags,
    getCommentById,
    getCommentsByPostId,
    getPostBySlug,
    getPosts,
    getTagsByPostId,
    incrementViewCount,
    updatePost,
} from "@/utils/sql";

const posts = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/v1/posts → List posts
posts.get("/", async (c) => {
    const { status, limit, offset, author } = c.req.query();

    const options: Parameters<typeof getPosts>[1] = {};
    if (status === "draft" || status === "published" || status === "archived") {
        options.status = status;
    }
    if (limit) {
        const parsed = parseInt(limit, 10);
        if (!isNaN(parsed)) options.limit = Math.min(parsed, 100);
    }
    if (offset) {
        const parsed = parseInt(offset, 10);
        if (!isNaN(parsed)) options.offset = parsed;
    }
    if (author) {
        const authorId = parseInt(author, 10);
        if (!isNaN(authorId)) options.author_id = authorId;
    }

    const results = await getPosts(c.env.D1, options);

    const withTags = await Promise.all(
        results.map(async (post) => ({
            ...post,
            tags: await getTagsByPostId(c.env.D1, post.id),
        })),
    );

    return c.json(createSuccess({ posts: withTags }));
});

// GET /api/v1/posts/tags/all → List all tags
posts.get("/tags/all", async (c) => {
    const tags = await getAllTags(c.env.D1);
    return c.json(createSuccess({ tags }));
});

// GET /api/v1/posts/:slug → Get single post
posts.get("/:slug", async (c) => {
    const slug = c.req.param("slug");
    const post = await getPostBySlug(c.env.D1, slug);

    if (!post) {
        return c.json(
            createError(ReasonPhrases.NOT_FOUND, "Post not found"),
            404,
        );
    }

    await incrementViewCount(c.env.D1, post.id);
    const tags = await getTagsByPostId(c.env.D1, post.id);

    return c.json(createSuccess({ post: { ...post, tags } }));
});

// POST /api/v1/posts → Create post
posts.post("/", requireAuth, async (c) => {
    const user = getCurrentUser(c);

    let body: {
        slug: string;
        title: string;
        content: string;
        summary?: string;
        status?: "draft" | "published";
        tags?: string[];
        published_at?: string;
    };
    try {
        body = await c.req.json();
    } catch {
        return c.json(
            createError(ReasonPhrases.BAD_REQUEST, "Invalid JSON body"),
            400,
        );
    }

    if (!body.slug || !body.title || !body.content) {
        return c.json(
            createError(
                ReasonPhrases.BAD_REQUEST,
                "slug, title and content are required",
            ),
            400,
        );
    }

    const existing = await getPostBySlug(c.env.D1, body.slug);
    if (existing) {
        return c.json(
            createError(
                ReasonPhrases.CONFLICT,
                "Post with this slug already exists",
                { slug: body.slug },
            ),
            409,
        );
    }

    await createPost(c.env.D1, {
        author_id: user.id,
        slug: body.slug,
        title: body.title,
        content: body.content,
        summary: body.summary,
        status: body.status,
        published_at: body.published_at,
    });

    const post = await getPostBySlug(c.env.D1, body.slug);

    if (body.tags && body.tags.length > 0 && post) {
        await attachTagsToPost(c.env.D1, post.id, body.tags);
    }

    const tags = post ? await getTagsByPostId(c.env.D1, post.id) : [];

    return c.json(
        createSuccess({
            message: "Post created successfully",
            post: post ? { ...post, tags } : null,
        }),
        201,
    );
});

// PUT /api/v1/posts/:slug → Update post
posts.put("/:slug", requireAuth, async (c) => {
    const user = getCurrentUser(c);
    const slug = c.req.param("slug");

    const post = await getPostBySlug(c.env.D1, slug);
    if (!post) {
        return c.json(
            createError(ReasonPhrases.NOT_FOUND, "Post not found"),
            404,
        );
    }

    if (post.author_id !== user.id && user.role !== "admin") {
        return c.json(
            createError(
                ReasonPhrases.FORBIDDEN,
                "You can only update your own posts",
            ),
            403,
        );
    }

    let body: {
        title?: string;
        content?: string;
        summary?: string;
        status?: "draft" | "published" | "archived";
        is_pinned?: boolean;
        tags?: string[];
    };
    try {
        body = await c.req.json();
    } catch {
        return c.json(
            createError(ReasonPhrases.BAD_REQUEST, "Invalid JSON body"),
            400,
        );
    }

    await updatePost(c.env.D1, post.id, {
        title: body.title,
        content: body.content,
        summary: body.summary,
        status: body.status,
        is_pinned: body.is_pinned === undefined ? undefined : (body.is_pinned ? 1 : 0),
    });

    if (body.tags) {
        await c.env.D1.prepare("DELETE FROM post_tags WHERE post_id = ?")
            .bind(post.id)
            .run();
        if (body.tags.length > 0) {
            await attachTagsToPost(c.env.D1, post.id, body.tags);
        }
    }

    const updated = await getPostBySlug(c.env.D1, slug);
    const tags = updated ? await getTagsByPostId(c.env.D1, updated.id) : [];

    return c.json(
        createSuccess({
            message: "Post updated successfully",
            post: updated ? { ...updated, tags } : null,
        }),
    );
});

// DELETE /api/v1/posts/:slug → Delete post
posts.delete("/:slug", requireAuth, async (c) => {
    const user = getCurrentUser(c);
    const slug = c.req.param("slug");

    const post = await getPostBySlug(c.env.D1, slug);
    if (!post) {
        return c.json(
            createError(ReasonPhrases.NOT_FOUND, "Post not found"),
            404,
        );
    }

    if (post.author_id !== user.id && user.role !== "admin") {
        return c.json(
            createError(
                ReasonPhrases.FORBIDDEN,
                "You can only delete your own posts",
            ),
            403,
        );
    }

    await c.env.D1.prepare("DELETE FROM posts WHERE id = ?")
        .bind(post.id)
        .run();

    return c.json(
        createSuccess({ message: "Post deleted successfully" }),
    );
});

// GET /api/v1/posts/:slug/comments → List comments for a post
posts.get("/:slug/comments", async (c) => {
    const slug = c.req.param("slug");
    const post = await getPostBySlug(c.env.D1, slug);
    if (!post) {
        return c.json(
            createError(ReasonPhrases.NOT_FOUND, "Post not found"),
            404,
        );
    }
    const comments = await getCommentsByPostId(c.env.D1, post.id);
    return c.json(createSuccess({ comments }));
});

// POST /api/v1/posts/:slug/comments → Create a comment
posts.post("/:slug/comments", requireAuth, async (c) => {
    const user = getCurrentUser(c);
    const slug = c.req.param("slug");
    const post = await getPostBySlug(c.env.D1, slug);
    if (!post) {
        return c.json(
            createError(ReasonPhrases.NOT_FOUND, "Post not found"),
            404,
        );
    }

    let body: { content: string; parent_id?: number };
    try {
        body = await c.req.json();
    } catch {
        return c.json(
            createError(ReasonPhrases.BAD_REQUEST, "Invalid JSON body"),
            400,
        );
    }

    if (!body.content || !body.content.trim()) {
        return c.json(
            createError(ReasonPhrases.BAD_REQUEST, "content is required"),
            400,
        );
    }

    await createComment(c.env.D1, {
        post_id: post.id,
        user_id: user.id,
        content: body.content.trim(),
        parent_id: body.parent_id,
    });

    const comments = await getCommentsByPostId(c.env.D1, post.id);
    return c.json(
        createSuccess({
            message: "Comment created successfully",
            comments,
        }),
        201,
    );
});

// DELETE /api/v1/posts/comments/:id → Delete a comment (owner or admin)
posts.delete("/comments/:id", requireAuth, async (c) => {
    const user = getCurrentUser(c);
    const id = parseInt(c.req.param("id"), 10);
    if (isNaN(id)) {
        return c.json(
            createError(ReasonPhrases.BAD_REQUEST, "Invalid comment id"),
            400,
        );
    }

    const comment = await getCommentById(c.env.D1, id);
    if (!comment) {
        return c.json(
            createError(ReasonPhrases.NOT_FOUND, "Comment not found"),
            404,
        );
    }

    if (comment.user_id !== user.id && user.role !== "admin") {
        return c.json(
            createError(
                ReasonPhrases.FORBIDDEN,
                "You can only delete your own comments",
            ),
            403,
        );
    }

    await deleteComment(c.env.D1, id);
    return c.json(
        createSuccess({ message: "Comment deleted successfully" }),
    );
});

export default posts;
