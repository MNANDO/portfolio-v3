/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly AWS_REGION: string;
	readonly AWS_ACCESS_KEY_ID: string;
	readonly AWS_SECRET_ACCESS_KEY: string;
	readonly S3_BLOG_BUCKET: string;
	readonly PUBLIC_AWS_REGION: string;
	readonly PUBLIC_S3_ASSETS_BUCKET: string;
	readonly PUBLIC_COGNITO_IDENTITY_POOL_ID: string;
	readonly PUBLIC_COGNITO_AUTHORITY: string;
	readonly PUBLIC_COGNITO_CLIENT_ID: string;
	readonly PUBLIC_COGNITO_REDIRECT_URI: string;
	readonly PUBLIC_COGNITO_HOSTED_DOMAIN: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
