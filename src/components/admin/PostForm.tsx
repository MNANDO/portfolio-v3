import { useState, useEffect } from "react";
import { uploadPost, fetchPost } from "../../lib/s3-client";
import type { S3PostData } from "../../lib/s3-loader";

interface Props {
  slug: string | null;
  onSave: () => void;
}

export default function PostForm({ slug, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [postSlug, setPostSlug] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [draft, setDraft] = useState(false);
  const [html, setHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!slug) {
      setPostSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  }, [title, slug]);

  useEffect(() => {
    if (slug) {
      fetchPost(slug).then((post) => {
        if (post) {
          setTitle(post.title);
          setPostSlug(post.slug);
          setDescription(post.description);
          setTags(post.tags.join(", "));
          setDraft(post.draft);
          setHtml(post.html);
        }
      });
    }
  }, [slug]);

  const handleSave = async () => {
    setSaving(true);
    const post: S3PostData = {
      slug: postSlug,
      title,
      description,
      date: new Date().toISOString(),
      draft,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      html,
    };
    await uploadPost(post);
    setSaving(false);
    onSave();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm text-muted-foreground mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg bg-card border border-input px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Slug</label>
        <input
          type="text"
          value={postSlug}
          onChange={(e) => setPostSlug(e.target.value)}
          required
          className="w-full rounded-lg bg-card border border-input px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full rounded-lg bg-card border border-input px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="react, typescript, web"
          className="w-full rounded-lg bg-card border border-input px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="draft"
          checked={draft}
          onChange={(e) => setDraft(e.target.checked)}
          className="rounded border-input"
        />
        <label htmlFor="draft" className="text-sm text-muted-foreground">
          Draft
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm text-muted-foreground">Content (HTML)</label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
        </div>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={20}
          className="w-full rounded-lg bg-card border border-input p-3 font-mono text-sm text-foreground focus:border-ring focus:outline-none"
        />
      </div>

      {showPreview && (
        <div>
          <h3 className="text-sm text-muted-foreground mb-2">Preview</h3>
          <div
            className="prose prose-invert max-w-none rounded-lg border border-border p-6"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save to S3"}
      </button>
    </form>
  );
}
