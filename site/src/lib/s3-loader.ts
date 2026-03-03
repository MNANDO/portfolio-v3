import type { Loader } from "astro/loaders";
import {
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

export interface PostManifestEntry {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
}

export interface S3PostData extends PostManifestEntry {
  html: string;
  editorState?: string;
}

export interface PortfolioItem {
  title: string;
  thumbnail: string;
  date: string;
  link: string;
  tags: string[];
  description: string;
}

export interface ExperienceItem {
  company_logo: string;
  title: string;
  company: string;
  date_from: string;
  date_to?: string;
  description?: string;
}

export interface HomeContent {
  profileImageUrl: string;
  welcomeMessage: string;
  intro: string;
  cta1Label: string;
  cta1Link: string;
  cta2Label: string;
  cta2Link: string;
}

export function s3BlogLoader(): Loader {
  return {
    name: "s3-blog-loader",
    load: async (context) => {
      const { store, logger, parseData } = context;

      const bucket = import.meta.env.PUBLIC_S3_ASSETS_BUCKET;

      if (!bucket) {
        logger.warn(
          "PUBLIC_S3_ASSETS_BUCKET not configured — skipping blog post fetch"
        );
        return;
      }

      const client = new S3Client({
        region: import.meta.env.PUBLIC_AWS_REGION ?? "us-east-1",
      });

      logger.info("Fetching blog posts from S3...");
      store.clear();

      let manifest: PostManifestEntry[] = [];
      try {
        const manifestResult = await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: "posts/manifest.json" })
        );
        const manifestBody = await manifestResult.Body!.transformToString();
        manifest = JSON.parse(manifestBody) as PostManifestEntry[];
      } catch {
        logger.warn("No manifest found at posts/manifest.json — skipping");
        return;
      }

      logger.info(`Found ${manifest.length} posts in manifest`);

      for (const entry of manifest) {
        const getResult = await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: `posts/${entry.slug}.json` })
        );

        const body = await getResult.Body!.transformToString();
        const post: S3PostData = JSON.parse(body);

        const data = await parseData({
          id: post.slug,
          data: {
            title: post.title,
            description: post.description,
            date: post.date,
            tags: post.tags,
          },
        });

        store.set({
          id: post.slug,
          data,
          body: post.html,
        });
      }

      logger.info("S3 blog posts loaded successfully");
    },
  };
}

export async function loadPosts(): Promise<PostManifestEntry[]> {
  const bucket = import.meta.env.PUBLIC_S3_ASSETS_BUCKET;
  if (!bucket) return [];

  const client = new S3Client({
    region: import.meta.env.PUBLIC_AWS_REGION ?? "us-east-1",
  });

  try {
    const result = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: "posts/manifest.json" })
    );
    const body = await result.Body!.transformToString();
    const entries = JSON.parse(body) as PostManifestEntry[];
    return entries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch {
    return [];
  }
}

export async function loadLatestPost(): Promise<PostManifestEntry | null> {
  const posts = await loadPosts();
  return posts[0] ?? null;
}

export async function loadPortfolio(): Promise<PortfolioItem[]> {
  const bucket = import.meta.env.PUBLIC_S3_ASSETS_BUCKET;
  if (!bucket) return [];

  const client = new S3Client({
    region: import.meta.env.PUBLIC_AWS_REGION ?? "us-east-1",
  });

  try {
    const result = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: "portfolio/portfolio.json" })
    );
    const body = await result.Body!.transformToString();
    const items = JSON.parse(body) as PortfolioItem[];
    return items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch {
    return [];
  }
}

export async function loadHomeContent(): Promise<HomeContent | null> {
  const bucket = import.meta.env.PUBLIC_S3_ASSETS_BUCKET;
  if (!bucket) return null;

  const client = new S3Client({
    region: import.meta.env.PUBLIC_AWS_REGION ?? "us-east-1",
  });

  try {
    const result = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: "home/home.json" })
    );
    const body = await result.Body!.transformToString();
    return JSON.parse(body) as HomeContent;
  } catch {
    return null;
  }
}

export async function loadExperience(): Promise<ExperienceItem[]> {
  const bucket = import.meta.env.PUBLIC_S3_ASSETS_BUCKET;
  if (!bucket) return [];

  const client = new S3Client({
    region: import.meta.env.PUBLIC_AWS_REGION ?? "us-east-1",
  });

  try {
    const result = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: "experience/experience.json" })
    );
    const body = await result.Body!.transformToString();
    const items = JSON.parse(body) as ExperienceItem[];
    return items.sort(
      (a, b) => new Date(b.date_from).getTime() - new Date(a.date_from).getTime()
    );
  } catch {
    return [];
  }
}
