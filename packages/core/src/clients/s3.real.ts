import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { IS3Client, UploadModelResponse, S3Config } from './s3.interface';

/**
 * Real S3 client implementation for ML model storage
 * Supports Cloudflare R2 and other S3-compatible endpoints
 */
export class RealS3Client implements IS3Client {
  private client: S3Client;
  private bucket: string;

  constructor(config: S3Config) {
    this.bucket = config.bucket;
    
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region || 'auto', // Cloudflare R2 uses 'auto'
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async uploadModel(
    key: string,
    data: Buffer | string,
    metadata?: Record<string, string>
  ): Promise<UploadModelResponse> {
    const buffer = typeof data === 'string' ? Buffer.from(data) : data;
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      Metadata: metadata,
    });

    return await this.client.send(command);
  }

  async downloadModel(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    
    if (!response.Body) {
      throw new Error(`Model body is empty: ${key}`);
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async listModels(prefix?: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });

    const response = await this.client.send(command);
    
    if (!response.Contents) {
      return [];
    }

    return response.Contents.map((item) => item.Key || '').filter(Boolean);
  }

  async deleteModel(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async modelExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      
      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    // S3Client doesn't require explicit closing
    this.client.destroy();
  }
}
