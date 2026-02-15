import { useState } from "react";
import { AuthProvider, useAuth } from "react-oidc-context";
import PostForm from "./PostForm";
import PostList from "./PostList";

const cognitoAuthConfig = {
  authority: import.meta.env.PUBLIC_COGNITO_AUTHORITY,
  client_id: import.meta.env.PUBLIC_COGNITO_CLIENT_ID,
  redirect_uri: import.meta.env.PUBLIC_COGNITO_REDIRECT_URI,
  response_type: "code",
  scope: "openid email phone",
};

function AdminContent() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-destructive">Error: {auth.error.message}</p>
        <button
          onClick={() => auth.signinRedirect()}
          className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-muted-foreground">Sign in to access the admin panel.</p>
        <button
          onClick={() => auth.signinRedirect()}
          className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign In
        </button>
      </div>
    );
  }

  const signOut = () => {
    const clientId = import.meta.env.PUBLIC_COGNITO_CLIENT_ID;
    const logoutUri = import.meta.env.PUBLIC_COGNITO_REDIRECT_URI;
    const cognitoDomain = import.meta.env.PUBLIC_COGNITO_HOSTED_DOMAIN;
    auth.removeUser();
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  const idToken = auth.user?.id_token ?? "";

  return <AdminDashboard onSignOut={signOut} idToken={idToken} />;
}

export default function AdminApp() {
  return (
    <AuthProvider {...cognitoAuthConfig}>
      <AdminContent />
    </AuthProvider>
  );
}

function AdminDashboard({ onSignOut, idToken }: { onSignOut: () => void; idToken: string }) {
  const [view, setView] = useState<"list" | "editor">("list");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blog Admin</h1>
        <div className="flex items-center gap-3">
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
          <button
            onClick={onSignOut}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign Out
          </button>
        </div>
      </div>

      {view === "list" ? (
        <PostList
          idToken={idToken}
          onEdit={(slug) => {
            setEditingSlug(slug);
            setView("editor");
          }}
        />
      ) : (
        <PostForm idToken={idToken} slug={editingSlug} onSave={() => setView("list")} />
      )}
    </div>
  );
}
