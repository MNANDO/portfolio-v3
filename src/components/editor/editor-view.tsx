'use client';

import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import type { EditorState, LexicalEditor } from 'lexical';
import { useState } from 'react';
import EditorToolbarPlugin from './editor-toolbar-plugin';
import EditorBlockControlPlugin from './editor-block-control-plugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { Editor } from '@/lib/Editor';
import ReadOnlyPlugin from './readonly-plugin';

interface EditorViewProps {
	editor: Editor;
	className?: string;
	placeholder?: string;
	showBlockHandle?: boolean;
	showToolbar?: boolean;
	readOnly?: boolean;
	onChange?: (
		editorState: EditorState,
		editor: LexicalEditor,
		tags: Set<string>,
	) => void;
	children?: React.ReactNode;
}

export function EditorView({
	editor,
	className,
	placeholder,
	showBlockHandle = true,
	showToolbar = true,
	readOnly = false,
	onChange,
	children,
}: EditorViewProps) {
	const [floatingAnchorElem, setFloatingAnchorElem] =
		useState<HTMLDivElement | null>(null);

	const onRef = (_floatingAnchorElem: HTMLDivElement) => {
		if (_floatingAnchorElem !== null) {
			setFloatingAnchorElem(_floatingAnchorElem);
		}
	};

	const editorPlaceholder =
		placeholder ?? "Enter some text or type '/' for commands";

	return (
		<LexicalExtensionComposer
			extension={editor.lexicalExtension}
			contentEditable={null}
		>
			<div
				className={`relative font-normal leading-[1.7] text-foreground ${className ?? ''}`}
			>
				<div className="relative block bg-background">
					<RichTextPlugin
						contentEditable={
							<div className="relative z-0 flex min-h-37.5 max-w-full resize-y border-0 outline-none">
								<div
									ref={onRef}
									className="relative z-0 max-w-full flex-auto resize-y"
								>
									<ContentEditable
										className={`relative min-h-37.5 resize-none px-2.5 py-3.75 text-[15px] caret-foreground outline-none [tab-size:1] ${showBlockHandle ? 'ml-12' : ''}`}
										aria-placeholder={editorPlaceholder}
										placeholder={
											<div
												className={`pointer-events-none absolute top-3.75 inline-block select-none overflow-hidden text-ellipsis text-[15px] text-muted-foreground ${showBlockHandle ? 'left-14.5' : 'left-2.5'}`}
											>
												{editorPlaceholder}
											</div>
										}
									/>
								</div>
							</div>
						}
						ErrorBoundary={LexicalErrorBoundary}
					/>
					{readOnly && <ReadOnlyPlugin />}
					{floatingAnchorElem && showToolbar && !readOnly && (
						<EditorToolbarPlugin
							anchorElem={floatingAnchorElem}
							options={editor.blockPickerOptions}
						/>
					)}
					{floatingAnchorElem && showBlockHandle && !readOnly && (
						<EditorBlockControlPlugin
							anchorElem={floatingAnchorElem}
							options={editor.blockPickerOptions}
						/>
					)}
					{children}
					{onChange && <OnChangePlugin onChange={onChange} />}
				</div>
			</div>
		</LexicalExtensionComposer>
	);
}
