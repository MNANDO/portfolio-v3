import { useState, useEffect } from "react";
import { listPosts } from "../../lib/s3-client";

interface Props {
  idToken: string;
  onEdit: (slug: string) => void;
}

export default function PostList({ idToken, onEdit }: Props) {
  const [posts, setPosts] = useState<
    Array<{ slug: string; title: string; date: string; draft: boolean }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPosts(idToken)
      .then((p) => {
        setPosts(p);
      })
      .catch((err) => {
        console.error("Failed to load posts:", err);
        setError(err instanceof Error ? err.message : "Failed to load posts");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-muted-foreground">Loading posts...</p>;
  }

  if (error) {
    return <p className="text-destructive">Error: {error}</p>;
  }

  if (posts.length === 0) {
    return <p className="text-muted-foreground">No posts yet. Create your first one.</p>;
  }

  return (
    <ul className="space-y-3">
      {posts.map((post) => (
        <li
          key={post.slug}
          className="flex items-center justify-between rounded-lg border border-border p-4"
        >
          <div>
            <span className="font-medium">{post.title}</span>
            {post.draft && (
              <span className="ml-2 text-xs text-yellow-500">(draft)</span>
            )}
          </div>
          <button
            onClick={() => onEdit(post.slug)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Edit
          </button>
        </li>
      ))}
    </ul>
  );
}
