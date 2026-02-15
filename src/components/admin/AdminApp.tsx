import { useState } from "react";
import PostForm from "./PostForm";
import PostList from "./PostList";

export default function AdminApp() {
  const [view, setView] = useState<"list" | "editor">("list");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blog Admin</h1>
        {view === "list" ? (
          <button
            onClick={() => {
              setView("editor");
              setEditingSlug(null);
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            New Post
          </button>
        ) : (
          <button
            onClick={() => setView("list")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to posts
          </button>
        )}
      </div>

      {view === "list" ? (
        <PostList
          onEdit={(slug) => {
            setEditingSlug(slug);
            setView("editor");
          }}
        />
      ) : (
        <PostForm slug={editingSlug} onSave={() => setView("list")} />
      )}
    </div>
  );
}
