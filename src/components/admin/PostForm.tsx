import { useState, useEffect } from 'react';
import { uploadPost, fetchPost } from '../../lib/s3-client';
import type { S3PostData } from '../../lib/s3-loader';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { EditorView } from '../editor/editor-view';
import { useCreateEditor } from '../../hooks/use-create-editor';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes } from 'lexical';
import type { EditorState, LexicalEditor } from 'lexical';

interface Props {
	idToken: string;
	slug: string | null;
	onSave: () => void;
}

interface PostFormInnerProps extends Props {
	initialData: S3PostData | null;
}

function PostFormInner({ idToken, slug, onSave, initialData }: PostFormInnerProps) {
	const [title, setTitle] = useState(initialData?.title ?? '');
	const [postSlug, setPostSlug] = useState(initialData?.slug ?? '');
	const [description, setDescription] = useState(initialData?.description ?? '');
	const [tags, setTags] = useState(initialData?.tags.join(', ') ?? '');
	const [html, setHtml] = useState(initialData?.html ?? '');
	const [editorState, setEditorState] = useState(initialData?.editorState ?? '');
	const [saving, setSaving] = useState(false);

	const editor = useCreateEditor({
		initialEditorState: initialData?.editorState
			? initialData.editorState
			: initialData?.html
				? (lexicalEditor: LexicalEditor) => {
						const parser = new DOMParser();
						const dom = parser.parseFromString(initialData.html, 'text/html');
						const nodes = $generateNodesFromDOM(lexicalEditor, dom);
						$getRoot().clear();
						$getRoot().select();
						$insertNodes(nodes);
					}
				: undefined,
	});

	useEffect(() => {
		if (!slug) {
			setPostSlug(
				title
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, '-')
					.replace(/(^-|-$)/g, ''),
			);
		}
	}, [title, slug]);

	const handleEditorChange = (
		editorState: EditorState,
		lexicalEditor: LexicalEditor,
	) => {
		editorState.read(() => {
			setHtml($generateHtmlFromNodes(lexicalEditor));
			setEditorState(JSON.stringify(editorState.toJSON()));
		});
	};

	const handleSave = async () => {
		setSaving(true);
		const post: S3PostData = {
			slug: postSlug,
			title,
			description,
			date: new Date().toISOString(),
			tags: tags
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean),
			html,
			editorState,
		};
		await uploadPost(idToken, post);
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
			<div className="space-y-1.5">
				<label
					htmlFor="title"
					className="text-sm font-medium text-foreground"
				>
					Title
				</label>
				<Input
					id="title"
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					required
				/>
			</div>

			<div className="space-y-1.5">
				<label
					htmlFor="post-slug"
					className="text-sm font-medium text-foreground"
				>
					Slug
				</label>
				<Input
					id="post-slug"
					type="text"
					value={postSlug}
					onChange={(e) => setPostSlug(e.target.value)}
					required
				/>
			</div>

			<div className="space-y-1.5">
				<label
					htmlFor="description"
					className="text-sm font-medium text-foreground"
				>
					Description
				</label>
				<Input
					id="description"
					type="text"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					required
				/>
			</div>

			<div className="space-y-1.5">
				<label
					htmlFor="tags"
					className="text-sm font-medium text-foreground"
				>
					Tags (comma-separated)
				</label>
				<Input
					id="tags"
					type="text"
					value={tags}
					onChange={(e) => setTags(e.target.value)}
					placeholder="react, typescript, web"
				/>
			</div>

			<div className="space-y-1.5">
				<label className="text-sm font-medium text-foreground">
					Content
				</label>
				<div className="rounded-md border border-input bg-background">
					<EditorView
						editor={editor}
						onChange={handleEditorChange}
						placeholder="Start writing your post..."
					/>
				</div>
			</div>

			<Button type="submit" disabled={saving}>
				{saving ? 'Saving...' : 'Save to S3'}
			</Button>
		</form>
	);
}

export default function PostForm({ idToken, slug, onSave }: Props) {
	const [initialData, setInitialData] = useState<S3PostData | null>(null);
	const [loading, setLoading] = useState(!!slug);

	useEffect(() => {
		if (slug) {
			fetchPost(idToken, slug).then((post) => {
				setInitialData(post);
				setLoading(false);
			});
		}
	}, [slug, idToken]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
				Loading...
			</div>
		);
	}

	return (
		<PostFormInner
			key={slug ?? 'new'}
			idToken={idToken}
			slug={slug}
			onSave={onSave}
			initialData={initialData}
		/>
	);
}
