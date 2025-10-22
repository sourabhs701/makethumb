import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import mime from "mime";
import { readdirSync, existsSync, statSync, createReadStream } from "fs";
import { join } from "path";

export class R2client {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    client: S3Client;

    constructor(endpoint: string, accessKeyId: string, secretAccessKey: string, bucket: string) {
        this.endpoint = endpoint;
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this.bucket = bucket;
        this.client = new S3Client({
            region: "auto",
            endpoint: this.endpoint,
            credentials: { accessKeyId: this.accessKeyId, secretAccessKey: this.secretAccessKey },
        });
    }

    async uploadFile(key: string, filePath: string) {
        if (!existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const fileStream = createReadStream(filePath);
        const contentType = mime.getType(filePath) || "application/octet-stream";

        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: fileStream,
                ContentType: contentType,
            })
        );
        console.log(`Uploaded file ${key}`);
    }

    async uploadFolder(folderPath: string, prefix: string = "") {
        if (!existsSync(folderPath)) {
            throw new Error(`Folder not found: ${folderPath}`);
        }

        const files = readdirSync(folderPath);

        await Promise.all(
            files.map(async (file) => {
                const filePath = join(folderPath, file);
                const key = prefix ? `${prefix}/${file}` : file;

                if (statSync(filePath).isDirectory()) {
                    await this.uploadFolder(filePath, key);
                } else {
                    await this.uploadFile(key, filePath);
                }
            })
        );
        console.log(`Uploaded folder ${folderPath}`);
    }
}