'use client';

import type {
	AnyLexicalExtension,
	EditorThemeClasses,
	InitialEditorStateType,
	Klass,
	LexicalNode,
} from 'lexical';
import { useState } from 'react';
import { Editor } from '@/lib/Editor';

export interface UseCreateEditorOptions {
	name?: string;
	theme?: EditorThemeClasses;
	nodes?: Array<Klass<LexicalNode>>;
	extensions?: AnyLexicalExtension[];
	initialEditorState?: InitialEditorStateType;
	onImageUpload?: (file: File) => Promise<string>;
}

export const useCreateEditor = (options: UseCreateEditorOptions = {}) => {
	const [editor] = useState(() => new Editor(options));

	return editor;
};
