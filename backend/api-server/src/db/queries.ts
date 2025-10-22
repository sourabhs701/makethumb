import { eq } from "drizzle-orm";
import { projects } from "./schema";
import { getDB } from "./index";
import { Env } from "../lib/types";

export async function checkSlugAvailability(slug: string, user_id: string, env: Env) {
    const db = getDB(env);

    const existingProject = await db
        .select()
        .from(projects)
        .where(eq(projects.slug, slug));

    if (existingProject.length === 0) {
        return { available: true, slug };
    }

    if (existingProject[0].user_id === user_id) {
        return { available: true, slug };
    }

    return { available: false, slug };
}

export async function createProject(
    projectData: {
        slug: string;
        userId: string;
        gitUrl: string;
        status: string;
        envVars?: Record<string, string>;
    },
    env: Env
) {
    const db = getDB(env);

    const projectId = crypto.randomUUID();

    const newProject = {
        id: projectId,
        user_id: projectData.userId,
        slug: projectData.slug,
        git_url: projectData.gitUrl,
        status: projectData.status,
        env: projectData.envVars ? JSON.stringify(projectData.envVars) : null,
        is_public: false,
    };

    await db.insert(projects).values(newProject);

    return {
        id: projectId,
        slug: projectData.slug,
        status: projectData.status,
    };
}

export async function updateProjectStatus(
    projectId: string,
    status: string,
    env: Env
) {
    const db = getDB(env);

    await db
        .update(projects)
        .set({ status })
        .where(eq(projects.id, projectId));

    return { id: projectId, status };
}
