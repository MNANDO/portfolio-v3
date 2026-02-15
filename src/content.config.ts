import { defineCollection, z } from "astro:content";
import { s3BlogLoader } from "./lib/s3-loader";

const blog = defineCollection({
  loader: s3BlogLoader(),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
