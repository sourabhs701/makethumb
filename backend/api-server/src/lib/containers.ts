import { Container } from "@cloudflare/containers";
import { Env, BuildResult } from "./types";

export class BuildContainer extends Container<Env> {
    defaultPort = 3000;
    envVars = {
        R2_ENDPOINT: this.env.R2_ENDPOINT as string,
        R2_ACCESS_KEY_ID: this.env.R2_ACCESS_KEY_ID as string,
        R2_SECRET_ACCESS_KEY: this.env.R2_SECRET_ACCESS_KEY as string,
        R2_BUCKET_NAME: this.env.R2_BUCKET_NAME as string,
    };
    override onStart() { console.log("Container started"); }
    override onStop() { console.log("Container stopped"); }
    override onError(error: unknown) { console.error("Container error:", error); }
}



export async function handleContainerBuild(
    github_repository: string,
    project_name: string,
    env: Env,
): Promise<BuildResult> {
    try {
        const { getRandom } = await import("@cloudflare/containers");
        const container = await getRandom(env.BuildContainer as any, 3);
        const response = await container.fetch(new Request("http://localhost:3000/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                github_repository: github_repository,
                project_name: project_name,
            }),
        }));
        return { success: true, response };
    } catch (error) {
        console.error("Build failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}