import { useState } from 'react';
import { AuthProvider, useAuth } from 'react-oidc-context';
import PostForm from './PostForm';
import PostList from './PostList';
import PortfolioManager from './PortfolioManager';
import ExperienceManager from './ExperienceManager';
import HomeManager from './HomeManager';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

const cognitoAuthConfig = {
	authority: import.meta.env.PUBLIC_COGNITO_AUTHORITY,
	client_id: import.meta.env.PUBLIC_COGNITO_CLIENT_ID,
	redirect_uri: import.meta.env.PUBLIC_COGNITO_REDIRECT_URI,
	response_type: 'code',
	scope: 'openid email phone',
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
				<Button onClick={() => auth.signinRedirect()}>Try Again</Button>
			</div>
		);
	}

	if (!auth.isAuthenticated) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 py-20">
				<p className="text-muted-foreground">
					Sign in to access the admin panel.
				</p>
				<Button onClick={() => auth.signinRedirect()}>Sign In</Button>
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

	const idToken = auth.user?.id_token ?? '';

	return <AdminDashboard onSignOut={signOut} idToken={idToken} />;
}

export default function AdminApp() {
	return (
		<AuthProvider {...cognitoAuthConfig}>
			<AdminContent />
		</AuthProvider>
	);
}

function BlogSection({ idToken }: { idToken: string }) {
	const [view, setView] = useState<'list' | 'editor'>('list');
	const [editingSlug, setEditingSlug] = useState<string | null>(null);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-end">
				{view === 'list' ? (
					<Button
						onClick={() => {
							setView('editor');
							setEditingSlug(null);
						}}
					>
						New Post
					</Button>
				) : (
					<Button variant="outline" onClick={() => setView('list')}>
						&larr; Back to posts
					</Button>
				)}
			</div>
			{view === 'list' ? (
				<PostList
					idToken={idToken}
					onEdit={(slug) => {
						setEditingSlug(slug);
						setView('editor');
					}}
				/>
			) : (
				<PostForm
					idToken={idToken}
					slug={editingSlug}
					onSave={() => setView('list')}
				/>
			)}
		</div>
	);
}

function AdminDashboard({
	onSignOut,
	idToken,
}: {
	onSignOut: () => void;
	idToken: string;
}) {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Admin</h1>
				<Button variant="outline" onClick={onSignOut}>
					Sign Out
				</Button>
			</div>

			<Tabs defaultValue="home">
				<TabsList>
					<TabsTrigger value="home">Home</TabsTrigger>
					<TabsTrigger value="blog">Blog</TabsTrigger>
					<TabsTrigger value="portfolio">Portfolio</TabsTrigger>
					<TabsTrigger value="experience">Experience</TabsTrigger>
				</TabsList>
				<TabsContent value="home" className="mt-4">
					<HomeManager idToken={idToken} />
				</TabsContent>
				<TabsContent value="blog" className="mt-4">
					<BlogSection idToken={idToken} />
				</TabsContent>
				<TabsContent value="portfolio" className="mt-4">
					<PortfolioManager idToken={idToken} />
				</TabsContent>
				<TabsContent value="experience" className="mt-4">
					<ExperienceManager idToken={idToken} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
