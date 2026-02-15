import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import type { S3PostData } from "./s3-loader";

const client = new S3Client({
  region: import.meta.env.PUBLIC_AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: import.meta.env.PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.PUBLIC_AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = import.meta.env.PUBLIC_S3_BLOG_BUCKET;

export async function uploadPost(post: S3PostData): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `posts/${post.slug}.json`,
      Body: JSON.stringify(post),
      ContentType: "application/json",
    })
  );
}

export async function fetchPost(slug: string): Promise<S3PostData | null> {
  try {
    const result = await client.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: `posts/${slug}.json`,
      })
    );
    const body = await result.Body!.transformToString();
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export async function listPosts(): Promise<
  Array<{ slug: string; title: string; date: string; draft: boolean }>
> {
  const result = await client.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: "posts/",
    })
  );

  const keys = (result.Contents ?? [])
    .map((obj) => obj.Key!)
    .filter((key) => key.endsWith(".json"));

  const posts = await Promise.all(
    keys.map(async (key) => {
      const slug = key.replace("posts/", "").replace(".json", "");
      const data = await fetchPost(slug);
      return data
        ? { slug: data.slug, title: data.title, date: data.date, draft: data.draft }
        : null;
    })
  );

  return posts.filter(
    (p): p is { slug: string; title: string; date: string; draft: boolean } =>
      p !== null
  );
}
