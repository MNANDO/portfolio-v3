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
  tags: string[];
  html: string;
  editorState?: string;
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
