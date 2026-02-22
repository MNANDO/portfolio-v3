import { useState, useEffect, useRef } from 'react';
import { fetchHomeContent, saveHomeContent, uploadMedia } from '../../lib/s3-client';
import type { HomeContent } from '../../lib/s3-loader';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface Props {
	idToken: string;
}

const DEFAULT_CONTENT: HomeContent = {
	profileImageUrl: '',
	welcomeMessage: '',
	intro: '',
	cta1Label: '',
	cta1Link: '',
	cta2Label: '',
	cta2Link: '',
};

export default function HomeManager({ idToken }: Props) {
	const [form, setForm] = useState<HomeContent>(DEFAULT_CONTENT);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		fetchHomeContent(idToken)
			.then((data) => setForm(data ?? DEFAULT_CONTENT))
			.catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
			.finally(() => setLoading(false));
	}, []);

	const set = (field: keyof HomeContent, value: string) =>
		setForm((f) => ({ ...f, [field]: value }));

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploading(true);
		setError(null);
		try {
			const url = await uploadMedia(idToken, file);
			set('profileImageUrl', url);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Upload failed');
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setSaved(false);
		setError(null);
		try {
			await saveHomeContent(idToken, form);
			setSaved(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save');
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <p className="text-muted-foreground">Loading home content...</p>;

	return (
		<form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
			{error && <p className="text-destructive text-sm">{error}</p>}
			{saved && <p className="text-sm text-green-600 dark:text-green-400">Saved successfully.</p>}

			<div className="space-y-3">
				<label className="text-sm font-medium text-foreground">Profile Image</label>
				{form.profileImageUrl && (
					<img
						src={form.profileImageUrl}
						alt="Profile preview"
						className="h-24 w-24 rounded-full object-cover border border-border"
					/>
				)}
				<div className="flex items-center gap-2">
					<Input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						className="cursor-pointer"
						onChange={handleUpload}
						disabled={uploading}
					/>
					{uploading && <span className="text-sm text-muted-foreground shrink-0">Uploading...</span>}
				</div>
				<div className="space-y-1.5">
					<label className="text-sm text-muted-foreground">Or paste a URL</label>
					<Input
						value={form.profileImageUrl}
						onChange={(e) => set('profileImageUrl', e.target.value)}
						placeholder="https://..."
					/>
				</div>
			</div>

			<div className="space-y-1.5">
				<label className="text-sm font-medium text-foreground">Welcome Message</label>
				<Input
					value={form.welcomeMessage}
					onChange={(e) => set('welcomeMessage', e.target.value)}
					placeholder="Hi, I'm Mike."
				/>
			</div>

			<div className="space-y-1.5">
				<label className="text-sm font-medium text-foreground">Intro</label>
				<Input
					value={form.intro}
					onChange={(e) => set('intro', e.target.value)}
					placeholder="I'm a developer who builds things for the web..."
				/>
			</div>

			<fieldset className="space-y-3 rounded-lg border border-border p-4">
				<legend className="text-sm font-medium text-foreground px-1">Call to Action 1</legend>
				<div className="space-y-1.5">
					<label className="text-sm text-muted-foreground">Label</label>
					<Input
						value={form.cta1Label}
						onChange={(e) => set('cta1Label', e.target.value)}
						placeholder="Read my blog"
					/>
				</div>
				<div className="space-y-1.5">
					<label className="text-sm text-muted-foreground">Link</label>
					<Input
						value={form.cta1Link}
						onChange={(e) => set('cta1Link', e.target.value)}
						placeholder="/blog"
					/>
				</div>
			</fieldset>

			<fieldset className="space-y-3 rounded-lg border border-border p-4">
				<legend className="text-sm font-medium text-foreground px-1">Call to Action 2</legend>
				<div className="space-y-1.5">
					<label className="text-sm text-muted-foreground">Label</label>
					<Input
						value={form.cta2Label}
						onChange={(e) => set('cta2Label', e.target.value)}
						placeholder="GitHub"
					/>
				</div>
				<div className="space-y-1.5">
					<label className="text-sm text-muted-foreground">Link</label>
					<Input
						value={form.cta2Link}
						onChange={(e) => set('cta2Link', e.target.value)}
						placeholder="https://github.com/..."
					/>
				</div>
			</fieldset>

			<Button type="submit" disabled={saving}>
				{saving ? 'Saving...' : 'Save'}
			</Button>
		</form>
	);
}
