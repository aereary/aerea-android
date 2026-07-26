export type AereaRuntimeEnv = {
  DB: D1Database;
  BUCKET: R2Bucket;
};

export function getRuntimeEnv(): AereaRuntimeEnv {
  const runtime = (
    globalThis as typeof globalThis & {
      __AEREA_ENV__?: AereaRuntimeEnv;
    }
  ).__AEREA_ENV__;

  if (!runtime?.DB || !runtime?.BUCKET) {
    throw new Error("aérea cloud storage bindings are unavailable");
  }

  return runtime;
}
