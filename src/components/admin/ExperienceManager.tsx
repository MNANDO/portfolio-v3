import { useState, useEffect, useRef } from 'react';
import { fetchExperience, saveExperience, uploadMedia } from '../../lib/s3-client';
import type { ExperienceItem } from '../../lib/s3-loader';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DatePicker } from '../ui/date-picker';

interface Props {
	idToken: string;
}

const EMPTY_ITEM: ExperienceItem = {
	company_logo: '',
	title: '',
	company: '',
	date_from: '',
	date_to: undefined,
	description: undefined,
};

interface ItemFormProps {
	item: ExperienceItem;
	idToken: string;
	onSave: (item: ExperienceItem) => void;
	onCancel: () => void;
	saving: boolean;
}

function ItemForm({ item, idToken, onSave, onCancel, saving }: ItemFormProps) {
	const [form, setForm] = useState<ExperienceItem>({ ...item });
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const set = (field: keyof ExperienceItem, value: string | undefined) =>
		setForm((f) => ({ ...f, [field]: value }));

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploading(true);
		setUploadError(null);
		try {
			const url = await uploadMedia(idToken, file, `media/experience/${Date.now()}`);
			set('company_logo', url);
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
			...form,
			date_to: form.date_to || undefined,
			description: form.description || undefined,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border p-4">
			<div className="space-y-3">
				<label className="text-sm font-medium text-foreground">Company Logo</label>
				{form.company_logo && (
					<img
						src={form.company_logo}
						alt="Company logo preview"
						className="h-16 w-16 rounded-md object-contain border border-border"
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
					<Input value={form.company_logo} onChange={(e) => set('company_logo', e.target.value)} />
				</div>
			</div>
			<div className="space-y-1.5">
				<label className="text-sm font-medium text-foreground">Title</label>
				<Input value={form.title} onChange={(e) => set('title', e.target.value)} required />
			</div>
			<div className="space-y-1.5">
				<label className="text-sm font-medium text-foreground">Company</label>
				<Input value={form.company} onChange={(e) => set('company', e.target.value)} required />
			</div>
			<div className="space-y-1.5">
				<label className="text-sm font-medium text-foreground">Date From</label>
				<DatePicker value={form.date_from} onChange={(v) => set('date_from', v)} required />
			</div>
			<div className="space-y-1.5">
				<label className="text-sm font-medium text-foreground">
					Date To <span className="text-muted-foreground font-normal">(leave blank if current)</span>
				</label>
				<DatePicker value={form.date_to ?? ''} onChange={(v) => set('date_to', v || undefined)} />
			</div>
			<div className="space-y-1.5">
				<label className="text-sm font-medium text-foreground">Description</label>
				<Input
					value={form.description ?? ''}
					onChange={(e) => set('description', e.target.value || undefined)}
					placeholder="Brief description of your role"
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

export default function ExperienceManager({ idToken }: Props) {
	const [items, setItems] = useState<ExperienceItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editingIndex, setEditingIndex] = useState<number | 'new' | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		fetchExperience(idToken)
			.then(setItems)
			.catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
			.finally(() => setLoading(false));
	}, []);

	const persist = async (updated: ExperienceItem[]) => {
		setSaving(true);
		try {
			await saveExperience(idToken, updated);
			setItems(updated);
			setEditingIndex(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save');
		} finally {
			setSaving(false);
		}
	};

	const handleSave = (item: ExperienceItem) => {
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

	if (loading) return <p className="text-muted-foreground">Loading experience...</p>;
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
						<p className="text-muted-foreground">No experience items yet.</p>
					) : (
						<ul className="space-y-3">
							{items.map((item, i) => (
								<li
									key={i}
									className="flex items-center justify-between rounded-lg border border-border p-4"
								>
									<div>
										<p className="font-medium">{item.title}</p>
										<p className="text-sm text-muted-foreground">
											{item.company} &middot; {item.date_from}{item.date_to ? ` — ${item.date_to}` : ' — Present'}
										</p>
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
