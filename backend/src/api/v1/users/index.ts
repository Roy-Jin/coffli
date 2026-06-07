import { Hono } from "hono";
import uGet from "./get";
import uUpdate from "./update";
import uDel from "./delete";

const users = new Hono();

users.route("/", uGet);
users.route("/", uUpdate);
users.route("/", uDel);

export default users;
