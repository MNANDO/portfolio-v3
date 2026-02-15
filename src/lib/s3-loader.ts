import type { Loader } from "astro/loaders";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

export interface S3PostData {
  slug: string;
  title: string;
  description: string;
  date: string;
  draft: boolean;
  tags: string[];
  html: string;
}

export function s3BlogLoader(): Loader {
  return {
    name: "s3-blog-loader",
    load: async (context) => {
      const { store, logger, parseData } = context;

      const client = new S3Client({
        region: import.meta.env.AWS_REGION ?? "us-east-1",
        credentials: {
          accessKeyId: import.meta.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: import.meta.env.AWS_SECRET_ACCESS_KEY,
        },
      });

      const bucket = import.meta.env.S3_BLOG_BUCKET;

      if (!import.meta.env.AWS_ACCESS_KEY_ID || !bucket) {
        logger.warn(
          "S3 credentials or bucket not configured — skipping blog post fetch"
        );
        return;
      }

      logger.info("Fetching blog posts from S3...");
      store.clear();

      const listResult = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: "posts/",
        })
      );

      const keys = (listResult.Contents ?? [])
        .map((obj) => obj.Key!)
        .filter((key) => key.endsWith(".json"));

      logger.info(`Found ${keys.length} posts in S3`);

      for (const key of keys) {
        const getResult = await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: key })
        );

        const body = await getResult.Body!.transformToString();
        const post: S3PostData = JSON.parse(body);

        const data = await parseData({
          id: post.slug,
          data: {
            title: post.title,
            description: post.description,
            date: post.date,
            draft: post.draft,
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
