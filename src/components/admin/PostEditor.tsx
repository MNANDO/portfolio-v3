'use client';

import type { EditorState, InitialEditorStateType, LexicalEditor } from 'lexical';
import { useCreateEditor } from '@/hooks/use-create-editor';
import { EditorView } from '@/components/editor/editor-view';
import { ImageExtension } from '@/components/editor/extensions/image-extension';
import { uploadMedia } from '@/lib/s3-client';

interface PostEditorProps {
	idToken: string;
	initialEditorState?: InitialEditorStateType;
	onChange?: (editorState: EditorState, editor: LexicalEditor) => void;
	placeholder?: string;
}

export function PostEditor({
	idToken,
	initialEditorState,
	onChange,
	placeholder,
}: PostEditorProps) {
	const editor = useCreateEditor({
		initialEditorState,
		extensions: [
			ImageExtension(async (file: File) => {
				return uploadMedia(idToken, file, `media/posts/${Date.now()}`);
			}),
		],
	});

	return (
		<EditorView
			editor={editor}
			onChange={onChange}
			placeholder={placeholder}
		/>
	);
}
