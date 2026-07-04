import { Hono } from "hono";
import { createError, createSuccess, ReasonPhrases } from "@/utils/respond";
import { requireAuth, getCurrentUser } from "@/utils/session";
import { deleteGuestbookMessage, getGuestbookById } from "@/utils/sql";

const guestbook = new Hono<{ Bindings: CloudflareBindings }>();

// DELETE /api/v1/guestbook/:id → Delete a guestbook message
// Allowed for: message author, profile owner, or admin
guestbook.delete("/:id", requireAuth, async (c) => {
    const user = getCurrentUser(c);
    const id = parseInt(c.req.param("id"), 10);
    if (isNaN(id)) {
        return c.json(
            createError(ReasonPhrases.BAD_REQUEST, "Invalid message id"),
            400,
        );
    }

    const message = await getGuestbookById(c.env.D1, id);
    if (!message) {
        return c.json(
            createError(ReasonPhrases.NOT_FOUND, "Message not found"),
            404,
        );
    }

    const isAuthor = message.author_id === user.id;
    const isOwner = message.owner_id === user.id;
    const isAdmin = user.role === "admin";
    if (!isAuthor && !isOwner && !isAdmin) {
        return c.json(
            createError(
                ReasonPhrases.FORBIDDEN,
                "You can only delete your own messages or messages on your profile",
            ),
            403,
        );
    }

    await deleteGuestbookMessage(c.env.D1, id);
    return c.json(
        createSuccess({ message: "Message deleted successfully" }),
    );
});

export default guestbook;
