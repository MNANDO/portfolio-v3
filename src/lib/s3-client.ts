import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import type { PostManifestEntry, S3PostData, PortfolioItem, ExperienceItem, HomeContent } from './s3-loader';

const REGION = import.meta.env.PUBLIC_AWS_REGION ?? 'us-east-1';
const BUCKET = import.meta.env.PUBLIC_S3_ASSETS_BUCKET;
const IDENTITY_POOL_ID = import.meta.env.PUBLIC_COGNITO_IDENTITY_POOL_ID;
const USER_POOL_AUTHORITY = import.meta.env.PUBLIC_COGNITO_AUTHORITY;

const MANIFEST_KEY = 'posts/manifest.json';

function createClient(idToken: string): S3Client {
	return new S3Client({
		region: REGION,
		credentials: fromCognitoIdentityPool({
			clientConfig: { region: REGION },
			identityPoolId: IDENTITY_POOL_ID,
			logins: {
				[USER_POOL_AUTHORITY.replace('https://', '')]: idToken,
			},
		}),
	});
}

async function fetchManifest(
	client: S3Client,
): Promise<PostManifestEntry[]> {
	try {
		const result = await client.send(
			new GetObjectCommand({ Bucket: BUCKET, Key: MANIFEST_KEY }),
		);
		const body = await result.Body!.transformToString();
		return JSON.parse(body) as PostManifestEntry[];
	} catch {
		return [];
	}
}

async function saveManifest(
	client: S3Client,
	entries: PostManifestEntry[],
): Promise<void> {
	await client.send(
		new PutObjectCommand({
			Bucket: BUCKET,
			Key: MANIFEST_KEY,
			Body: JSON.stringify(entries),
			ContentType: 'application/json',
		}),
	);
}

export async function uploadPost(
	idToken: string,
	post: S3PostData,
): Promise<void> {
	const client = createClient(idToken);

	await client.send(
		new PutObjectCommand({
			Bucket: BUCKET,
			Key: `posts/${post.slug}.json`,
			Body: JSON.stringify(post),
			ContentType: 'application/json',
		}),
	);

	const manifest = await fetchManifest(client);
	const entry: PostManifestEntry = {
		slug: post.slug,
		title: post.title,
		description: post.description,
		tags: post.tags,
		date: post.date,
	};
	const idx = manifest.findIndex((e) => e.slug === post.slug);
	if (idx >= 0) {
		manifest[idx] = entry;
	} else {
		manifest.push(entry);
	}
	await saveManifest(client, manifest);
}

export async function fetchPost(
	idToken: string,
	slug: string,
): Promise<S3PostData | null> {
	const client = createClient(idToken);
	try {
		const result = await client.send(
			new GetObjectCommand({
				Bucket: BUCKET,
				Key: `posts/${slug}.json`,
			}),
		);
		const body = await result.Body!.transformToString();
		return JSON.parse(body);
	} catch {
		return null;
	}
}

export async function listPosts(
	idToken: string,
): Promise<PostManifestEntry[]> {
	const client = createClient(idToken);
	return fetchManifest(client);
}

export async function deletePost(
	idToken: string,
	slug: string,
): Promise<void> {
	const client = createClient(idToken);

	await client.send(
		new DeleteObjectCommand({
			Bucket: BUCKET,
			Key: `posts/${slug}.json`,
		}),
	);

	const manifest = await fetchManifest(client);
	await saveManifest(client, manifest.filter((e) => e.slug !== slug));
}

export async function fetchPortfolio(idToken: string): Promise<PortfolioItem[]> {
	const client = createClient(idToken);
	try {
		const result = await client.send(
			new GetObjectCommand({ Bucket: BUCKET, Key: 'portfolio/portfolio.json' }),
		);
		const body = await result.Body!.transformToString();
		return JSON.parse(body) as PortfolioItem[];
	} catch {
		return [];
	}
}

export async function savePortfolio(idToken: string, items: PortfolioItem[]): Promise<void> {
	const client = createClient(idToken);
	await client.send(
		new PutObjectCommand({
			Bucket: BUCKET,
			Key: 'portfolio/portfolio.json',
			Body: JSON.stringify(items),
			ContentType: 'application/json',
		}),
	);
}

export async function fetchExperience(idToken: string): Promise<ExperienceItem[]> {
	const client = createClient(idToken);
	try {
		const result = await client.send(
			new GetObjectCommand({ Bucket: BUCKET, Key: 'experience/experience.json' }),
		);
		const body = await result.Body!.transformToString();
		return JSON.parse(body) as ExperienceItem[];
	} catch {
		return [];
	}
}

export async function saveExperience(idToken: string, items: ExperienceItem[]): Promise<void> {
	const client = createClient(idToken);
	await client.send(
		new PutObjectCommand({
			Bucket: BUCKET,
			Key: 'experience/experience.json',
			Body: JSON.stringify(items),
			ContentType: 'application/json',
		}),
	);
}

export async function uploadMedia(idToken: string, file: File): Promise<string> {
	const client = createClient(idToken);
	const ext = file.name.split('.').pop() ?? 'jpg';
	const key = `media/profile.${ext}`;

	const buffer = await file.arrayBuffer();
	await client.send(
		new PutObjectCommand({
			Bucket: BUCKET,
			Key: key,
			Body: new Uint8Array(buffer),
			ContentType: file.type,
		}),
	);

	const cloudfrontUrl = import.meta.env.PUBLIC_CLOUDFRONT_URL;
	return `${cloudfrontUrl}/${key}`;
}

export async function fetchHomeContent(idToken: string): Promise<HomeContent | null> {
	const client = createClient(idToken);
	try {
		const result = await client.send(
			new GetObjectCommand({ Bucket: BUCKET, Key: 'home/home.json' }),
		);
		const body = await result.Body!.transformToString();
		return JSON.parse(body) as HomeContent;
	} catch {
		return null;
	}
}

export async function saveHomeContent(idToken: string, content: HomeContent): Promise<void> {
	const client = createClient(idToken);
	await client.send(
		new PutObjectCommand({
			Bucket: BUCKET,
			Key: 'home/home.json',
			Body: JSON.stringify(content),
			ContentType: 'application/json',
		}),
	);
}
