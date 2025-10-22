
export type Env = {
    CLERK_JWT_KEY: string
    DB: D1Database
    R2: R2Bucket
    BuildContainer: DurableObjectNamespace
    R2_ACCESS_KEY_ID: string
    R2_SECRET_ACCESS_KEY: string
    R2_BUCKET_NAME: string
    R2_ENDPOINT: string
}

export type Variables = {
    user: {
        azp: string,
        exp: number,
        fva: [number, number],
        iat: number,
        iss: string,
        nbf: number,
        sid: string,
        sts: string,
        sub: string,
        v: number
    }
}


export interface BuildPayload {
    github_repository: string;
    project_name: string;
    install_command?: string;
    build_command?: string;
    output_dir?: string;
    env_vars?: Record<string, any>;
}

export interface BuildResult {
    success: boolean;
    response?: Response;
    error?: string;
}