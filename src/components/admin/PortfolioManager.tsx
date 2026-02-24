import { useState, useEffect, useRef } from 'react';
import { fetchPortfolio, savePortfolio, uploadMedia } from '../../lib/s3-client';
import type { PortfolioItem } from '../../lib/s3-loader';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DatePicker } from '../ui/date-picker';

interface Props {
	idToken: string;
}

const EMPTY_ITEM: PortfolioItem = {
	title: '',
	thumbnail: '',
	date: '',
	link: '',
	tags: [],
	description: '',
};

interface ItemFormProps {
	item: PortfolioItem;
	idToken: string;
	onSave: (item: PortfolioItem) => void;
	onCancel: () => void;
	saving: boolean;
}

function ItemForm({ item, idToken, onSave, onCancel, saving }: ItemFormProps) {
	const [form, setForm] = useState<PortfolioItem & { tagsRaw: string }>({
		...item,
		tagsRaw: item.tags.join(', '),
	});
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const set = (field: string, value: string) =>
		setForm((f) => ({ ...f, [field]: value }));

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploading(true);
		setUploadError(null);
		try {
			const url = await uploadMedia(idToken, file, `media/portfolio/${Date.now()}`);
			set('thumbnail', url);
		} catch (err) {
			setUploadError(err instanceof Error ? err.message : 'Upload failed');
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSave({
			title: form.title,
			thumbnail: form.thumbnail,
			date: form.date,
			link: form.link,
			description: form.description,
			tags: form.tagsRaw
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean),
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border p-4">
			<div className="space-y-1.5">
				<label className="text-sm font-medium text-foreground">Title</label>
				<Input value={form.title} onChange={(e) => set('title', e.target.value)} required />
			</div>
			<div className="space-y-3">
				<label className="text-sm font-medium text-foreground">Thumbnail</label>
				{form.thumbnail && (
					<img
						src={form.thumbnail}
						alt="Thumbnail preview"
						className="h-24 w-24 rounded-md object-cover border border-border"
					/>
				)}
				{uploadError && <p className="text-destructive text-sm">{uploadError}</p>}
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
					<Input value={form.thumbnail} onChange={(e) => set('thumbnail', e.target.value)} />
				</div>
			</div>
			<div className="space-y-1.5">
				<label className="text-sm font-medium text-foreground">Date</label>
				<DatePicker value={form.date} onChange={(v) => set('date', v)} required />
			</div>
			<div className="space-y-1.5">
				<label className="text-sm font-medium text-foreground">Link</label>
				<Input type="url" value={form.link} onChange={(e) => set('link', e.target.value)} required />
			</div>
			<div className="space-y-1.5">
				<label className="text-sm font-medium text-foreground">Description</label>
				<Input value={form.description} onChange={(e) => set('description', e.target.value)} required />
			</div>
			<div className="space-y-1.5">
				<label className="text-sm font-medium text-foreground">Tags (comma-separated)</label>
				<Input
					value={form.tagsRaw}
					onChange={(e) => set('tagsRaw', e.target.value)}
					placeholder="react, typescript"
				/>
			</div>
			<div className="flex gap-2">
				<Button type="submit" disabled={saving}>
					{saving ? 'Saving...' : 'Save'}
				</Button>
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
			</div>
		</form>
	);
}

export default function PortfolioManager({ idToken }: Props) {
	const [items, setItems] = useState<PortfolioItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editingIndex, setEditingIndex] = useState<number | 'new' | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		fetchPortfolio(idToken)
			.then(setItems)
			.catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
			.finally(() => setLoading(false));
	}, []);

	const persist = async (updated: PortfolioItem[]) => {
		setSaving(true);
		try {
			await savePortfolio(idToken, updated);
			setItems(updated);
			setEditingIndex(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save');
		} finally {
			setSaving(false);
		}
	};

	const handleSave = (item: PortfolioItem) => {
		if (editingIndex === 'new') {
			persist([...items, item]);
		} else if (editingIndex !== null) {
			const updated = items.map((it, i) => (i === editingIndex ? item : it));
			persist(updated);
		}
	};

	const handleDelete = (index: number) => {
		persist(items.filter((_, i) => i !== index));
	};

	if (loading) return <p className="text-muted-foreground">Loading portfolio...</p>;
	if (error) return <p className="text-destructive">Error: {error}</p>;

	return (
		<div className="space-y-4">
			{editingIndex !== null ? (
				<ItemForm
					item={editingIndex === 'new' ? EMPTY_ITEM : items[editingIndex]}
					idToken={idToken}
					onSave={handleSave}
					onCancel={() => setEditingIndex(null)}
					saving={saving}
				/>
			) : (
				<>
					<Button onClick={() => setEditingIndex('new')}>Add Item</Button>
					{items.length === 0 ? (
						<p className="text-muted-foreground">No portfolio items yet.</p>
					) : (
						<ul className="space-y-3">
							{items.map((item, i) => (
								<li
									key={i}
									className="flex items-center justify-between rounded-lg border border-border p-4"
								>
									<div className="min-w-0">
										<p className="font-medium truncate">{item.title}</p>
										<p className="text-sm text-muted-foreground truncate">{item.description}</p>
									</div>
									<div className="flex gap-2 shrink-0">
										<Button variant="ghost" size="sm" onClick={() => setEditingIndex(i)}>
											Edit
										</Button>
										<Button
											variant="ghost"
											size="sm"
											className="text-destructive hover:text-destructive"
											onClick={() => handleDelete(i)}
										>
											Delete
										</Button>
									</div>
								</li>
							))}
						</ul>
					)}
				</>
			)}
		</div>
	);
}
