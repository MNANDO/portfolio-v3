/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly AWS_REGION: string;
  readonly AWS_ACCESS_KEY_ID: string;
  readonly AWS_SECRET_ACCESS_KEY: string;
  readonly S3_BLOG_BUCKET: string;
  readonly PUBLIC_AWS_REGION: string;
  readonly PUBLIC_AWS_ACCESS_KEY_ID: string;
  readonly PUBLIC_AWS_SECRET_ACCESS_KEY: string;
  readonly PUBLIC_S3_BLOG_BUCKET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
