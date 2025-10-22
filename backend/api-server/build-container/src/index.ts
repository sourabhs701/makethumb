import Fastify from "fastify";
import path from "path";
import { execa } from "execa";
import { existsSync } from "fs";
import { R2client } from "./r2.js";
import { config } from "dotenv";
config();

const fastify = Fastify({ logger: true });

fastify.post("/", async (request, reply) => {
    const data = request.body as {
        github_repository?: string;
        project_name?: string;
        install_command?: string;
        build_command?: string;
        output_dir?: string;
    };

    if (!data?.github_repository || !data?.project_name) {
        return reply.status(400).send({
            error: "github_repository and project_name required",
        });
    }

    const outDir = "/home/app/output";

    console.log("Cloning repository...");
   
    try {
        await execa("rm", ["-rf", outDir]);
        await execa("git", ["clone", data.github_repository, outDir]);
    } catch (err: any) {
        return reply.status(500).send({
            error: "clone failed",
            details: err.stderr || err.message,
        });
    }

    const run = async (cmd: string, errorMsg: string) => {
        try {
            await execa("bash", ["-lc", cmd], { cwd: outDir, stdio: "inherit" });
        } catch (err: any) {
            await reply.status(500).send({
                error: errorMsg,
                code: err.exitCode || 1,
                stdout: err.stdout,
                stderr: err.stderr,
            });
            return true;
        }
        return false;
    };

    console.log("Installing dependencies...");
    const installError = await run(data.install_command || "npm install", "install failed");
    if (installError) return;

    console.log("Building...");
    const buildError = await run(data.build_command || "npm run build", "build failed");
    if (buildError) return;

    const distFolderPath = path.join(outDir, data.output_dir || "dist");
    console.log(`Looking for dist folder at ${distFolderPath}`);

    if (!existsSync(distFolderPath)) {
        return reply.status(500).send({
            error: "build output directory not found",
            path: distFolderPath,
        });
    }

    try {
        const r2 = new R2client(
            process.env.R2_ENDPOINT!,
            process.env.R2_ACCESS_KEY_ID!,
            process.env.R2_SECRET_ACCESS_KEY!,
            process.env.R2_BUCKET_NAME!
        );
        await r2.uploadFolder(distFolderPath, `deployments/${data.project_name}`);
    } catch (err: any) {
        return reply.status(500).send({
            error: "upload failed",
            details: err.message,
        });
    }

    return reply.send({
        success: true,
        url: `https://cdn.makethumb.com/deployments/${data.project_name}`,
    });
});

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: "0.0.0.0" });
        console.log("🚀 Server running at http://localhost:3000");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
