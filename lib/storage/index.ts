import { del, get, put } from "@vercel/blob";
import { env } from "@/lib/server/env";

export type StoredObject = { key: string; url: string };

export interface ObjectStore {
  /** Writes an object. Public stores return a public URL, private stores a non-fetchable URL. */
  put(key: string, body: Uint8Array, contentType: string): Promise<StoredObject>;
  /** Reads an object by key (server-side only). */
  read(key: string): Promise<{ body: ReadableStream<Uint8Array>; contentType: string } | null>;
  remove(key: string): Promise<void>;
}

function token(visibility: "public" | "private"): string {
  const t =
    visibility === "public"
      ? env().BLOB_PUBLIC_READ_WRITE_TOKEN
      : env().BLOB_PRIVATE_READ_WRITE_TOKEN;
  if (!t) throw new Error(`Object storage (${visibility}) is not configured`);
  return t;
}

function blobStore(visibility: "public" | "private"): ObjectStore {
  return {
    async put(key, body, contentType) {
      const res = await put(key, Buffer.from(body), {
        access: visibility,
        token: token(visibility),
        contentType,
        addRandomSuffix: false,
        allowOverwrite: false,
      });
      return { key: res.pathname, url: res.url };
    },
    async read(key) {
      const res = await get(key, { access: visibility, token: token(visibility) });
      if (!res || res.statusCode !== 200) return null;
      return { body: res.stream, contentType: res.blob.contentType };
    },
    async remove(key) {
      await del(key, { token: token(visibility) });
    },
  };
}

/** Tests inject an in-memory store; production always uses Vercel Blob. */
let override: { public?: ObjectStore; private?: ObjectStore } = {};

export function setStoreOverridesForTests(o: { public?: ObjectStore; private?: ObjectStore }) {
  override = o;
}

export function publicStore(): ObjectStore {
  return override.public ?? blobStore("public");
}

export function privateStore(): ObjectStore {
  return override.private ?? blobStore("private");
}
