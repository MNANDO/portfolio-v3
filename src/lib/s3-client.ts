import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import type { S3PostData } from './s3-loader';

const REGION = import.meta.env.PUBLIC_AWS_REGION ?? 'us-east-1';
const BUCKET = import.meta.env.PUBLIC_S3_ASSETS_BUCKET;
const IDENTITY_POOL_ID = import.meta.env.PUBLIC_COGNITO_IDENTITY_POOL_ID;
const USER_POOL_AUTHORITY = import.meta.env.PUBLIC_COGNITO_AUTHORITY;

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
): Promise<
	Array<{ slug: string; title: string; date: string }>
> {
	const client = createClient(idToken);
	const result = await client.send(
		new ListObjectsV2Command({
			Bucket: BUCKET,
			Prefix: 'posts/',
		}),
	);

	const keys = (result.Contents ?? [])
		.map((obj) => obj.Key!)
		.filter((key) => key.endsWith('.json'));

	const posts = await Promise.all(
		keys.map(async (key) => {
			const slug = key.replace('posts/', '').replace('.json', '');
			const data = await fetchPost(idToken, slug);
			return data
				? {
						slug: data.slug,
						title: data.title,
						date: data.date,
					}
				: null;
		}),
	);

	return posts.filter(
		(
			p,
		): p is { slug: string; title: string; date: string } =>
			p !== null,
	);
}
