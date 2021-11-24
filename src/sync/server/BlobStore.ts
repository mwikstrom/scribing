export interface BlobStore {
    read(key: string): Promise<BlobReadResult | null>;
    write(key: string, blob: Blob, conditions?: BlobConditions): Promise<BlobWriteResult | null>;
}

export interface BlobReadResult {
    blob: Blob;
    etag: string;
}

export interface BlobWriteResult {
    etag: string;
}

export interface BlobConditions {
    ifMatch?: string;
    ifNoneMatch?: string;
}