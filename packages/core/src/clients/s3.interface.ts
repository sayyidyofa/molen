/**
 * S3-compatible storage client interface for ML model storage
 * Supports Cloudflare R2 and other S3-compatible endpoints
 */

export interface UploadModelResponse {
  ETag?: string;
  VersionId?: string;
}

export interface IS3Client {
  /**
   * Upload a model file to storage
   * @param key - The object key (path) in the bucket
   * @param data - The file data as Buffer or string
   * @param metadata - Optional metadata to attach to the object
   * @returns Promise with upload result
   */
  uploadModel(key: string, data: Buffer | string, metadata?: Record<string, string>): Promise<UploadModelResponse>;

  /**
   * Download a model file from storage
   * @param key - The object key (path) in the bucket
   * @returns Promise with file data as Buffer
   */
  downloadModel(key: string): Promise<Buffer>;

  /**
   * List models in storage
   * @param prefix - Optional prefix to filter models
   * @returns Promise with list of model keys
   */
  listModels(prefix?: string): Promise<string[]>;

  /**
   * Delete a model from storage
   * @param key - The object key (path) to delete
   * @returns Promise with deletion result
   */
  deleteModel(key: string): Promise<void>;

  /**
   * Check if a model exists in storage
   * @param key - The object key (path) to check
   * @returns Promise with boolean indicating existence
   */
  modelExists(key: string): Promise<boolean>;

  /**
   * Close the client connection
   */
  close(): Promise<void>;
}
