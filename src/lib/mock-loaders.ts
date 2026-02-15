import blogPosts from "@/data/mock-blog-posts.json";
import experience from "@/data/mock-experience.json";
import portfolioItems from "@/data/mock-portfolio.json";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  draft: boolean;
  tags: string[];
}

export interface ExperienceItem {
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description: string;
  logo: string;
}

export interface PortfolioItem {
  title: string;
  description: string;
  date: string;
  slug: string;
  image: string;
  tags: string[];
}

export function getLatestBlogPost(): BlogPost | null {
  const published = (blogPosts as BlogPost[])
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return published[0] ?? null;
}

export function getExperience(): ExperienceItem[] {
  return (experience as ExperienceItem[]).sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
}

export function getLatestPortfolioItem(): PortfolioItem | null {
  const sorted = (portfolioItems as PortfolioItem[]).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return sorted[0] ?? null;
}

export function getAllBlogPosts(): BlogPost[] {
  return (blogPosts as BlogPost[])
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllPortfolioItems(): PortfolioItem[] {
  return (portfolioItems as PortfolioItem[]).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
