import { Hono } from "hono";
import { cors } from "hono/cors";
import { Variables, Env } from "./lib/types";
import { checkSlugAvailability } from "./db/queries";
import { BuildContainer, handleContainerBuild } from "./lib/containers";

const app = new Hono<{ Variables: Variables, Bindings: Env }>();

app.use('*', cors({
  origin: ['http://localhost:3000', 'https://makethumb.com', 'https://www.makethumb.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

export { BuildContainer };

app.post("/build", async (c) => {
  try {
    const { github_repository, project_name } = await c.req.json();

    if (!github_repository) {
      return c.json({ error: "git_url is required" }, 400);
    }

    if (!project_name) {
      return c.json({ error: "slug is required" }, 400);
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project_name)) {
      return c.json({ error: "Invalid slug format. Use only lowercase letters, numbers, and hyphens." }, 400);
    }

    if (!/^(https?:\/\/)?([\w\.-]+@)?([\w\.-]+)(:\d+)?([\/\w\.-]*)(\.git)?$/.test(github_repository)) {
      return c.json({ error: "Invalid git URL format" }, 400);
    }

    const buildResult = await handleContainerBuild(github_repository, project_name, c.env);

    if (!buildResult.success) {
      return c.json({ error: buildResult.error }, 503);
    }

    const responseText = await buildResult.response!.text();
    console.log(responseText);
    return c.json({
      success: true,
      project_name,
      message: "Build started successfully",
    }, 202);
  } catch (error) {
    console.error("Error in build:", error);
    return c.json({ error: "Failed to initiate build." }, 500);
  }
});


app.get("/check-slug", async (c) => {
  try {
    const user = c.get('user') as Variables['user'];
    const slug = c.req.query('slug');

    if (!slug) {
      return c.json({ error: "Slug parameter is required" }, 400);
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return c.json({ error: "Invalid slug format. Use only lowercase letters, numbers, and hyphens.", available: false }, 400);
    }

    const result = await checkSlugAvailability(slug, user.sub, c.env);
    return c.json(result);
  } catch (error) {
    console.error("Error checking slug availability:", error);
    return c.json({ error: "Failed to check slug availability", available: false }, 500);
  }
});

export default app;
