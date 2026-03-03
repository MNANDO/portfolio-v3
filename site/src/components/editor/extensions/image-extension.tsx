'use client';

import type { JSX } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils';
import type { LexicalCommand, LexicalEditor } from 'lexical';
import {
	$createParagraphNode,
	$insertNodes,
	$isRootOrShadowRoot,
	COMMAND_PRIORITY_EDITOR,
	configExtension,
	createCommand,
	defineExtension,
} from 'lexical';
import type {
	ChangeEvent,
	DragEvent as ReactDragEvent,
	SubmitEvent,
} from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
	$createImageNode,
	ImageNode,
	type ImagePayload,
} from '../nodes/image-node';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { ReactExtension } from '@lexical/react/ReactExtension';

export type InsertImagePayload = Readonly<ImagePayload>;

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
	createCommand('INSERT_IMAGE_COMMAND');

export const OPEN_INSERT_IMAGE_DIALOG_COMMAND: LexicalCommand<void> =
	createCommand('OPEN_INSERT_IMAGE_DIALOG');

interface ImageDecoratorProps {
	onUploadImage?: (file: File) => Promise<string>;
}

function ImageDecorator({
	onUploadImage,
}: ImageDecoratorProps = {}): JSX.Element | null {
	const [editor] = useLexicalComposerContext();
	const [showDialog, setShowDialog] = useState(false);

	useEffect(() => {
		if (!editor.hasNodes([ImageNode])) {
			throw new Error(
				'ImageDecorator: ImageNode not registered on editor',
			);
		}

		return mergeRegister(
			editor.registerCommand<InsertImagePayload>(
				INSERT_IMAGE_COMMAND,
				(payload) => {
					const imageNode = $createImageNode(payload);
					$insertNodes([imageNode]);
					if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
						$wrapNodeInElement(
							imageNode,
							$createParagraphNode,
						).selectEnd();
					}
					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),
			editor.registerCommand(
				OPEN_INSERT_IMAGE_DIALOG_COMMAND,
				() => {
					setShowDialog(true);
					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),
		);
	}, [editor]);

	return (
		<InsertImageDialog
			editor={editor}
			open={showDialog}
			onOpenChange={setShowDialog}
			onUploadImage={onUploadImage}
		/>
	);
}

function useFileDrop(onFile: (file: File) => void) {
	const [isDragging, setIsDragging] = useState(false);

	function handleDrop(e: ReactDragEvent) {
		e.preventDefault();
		setIsDragging(false);
		const f = e.dataTransfer.files[0];
		if (f?.type.startsWith('image/')) onFile(f);
	}

	function handleDragOver(e: ReactDragEvent) {
		e.preventDefault();
		setIsDragging(true);
	}

	function handleDragLeave(e: ReactDragEvent) {
		e.preventDefault();
		setIsDragging(false);
	}

	function resetDragging() {
		setIsDragging(false);
	}

	return {
		isDragging,
		handleDrop,
		handleDragOver,
		handleDragLeave,
		resetDragging,
	};
}

interface InsertImageDialogProps {
	editor: LexicalEditor;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUploadImage?: (file: File) => Promise<string>;
}

export function InsertImageDialog({
	editor,
	open,
	onOpenChange,
	onUploadImage,
}: InsertImageDialogProps) {
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [altText, setAltText] = useState('');
	const [isUploading, setIsUploading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	function handleFile(f: File) {
		setFile(f);
		setPreview(URL.createObjectURL(f));
	}

	const {
		isDragging,
		handleDrop,
		handleDragOver,
		handleDragLeave,
		resetDragging,
	} = useFileDrop(handleFile);

	const reset = useCallback(() => {
		setFile(null);
		setPreview(null);
		setAltText('');
		setIsUploading(false);
		resetDragging();
	}, [resetDragging]);

	function handleOpenChange(next: boolean) {
		if (!next) reset();
		onOpenChange(next);
	}

	function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0];
		if (f) handleFile(f);
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (!file || !onUploadImage) return;

		setIsUploading(true);
		try {
			const src = await onUploadImage(file);
			editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
				src,
				altText: altText.trim(),
			});
			handleOpenChange(false);
		} finally {
			setIsUploading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Upload Image</DialogTitle>
					<DialogDescription>
						Drag and drop an image or click to browse.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<input
						ref={inputRef}
						type="file"
						accept="image/*"
						onChange={handleFileChange}
						className="hidden"
					/>
					{preview ? (
						<button
							type="button"
							onClick={() => inputRef.current?.click()}
							className="relative overflow-hidden rounded-md border"
						>
							<img
								src={preview}
								alt="Preview"
								className="max-h-48 w-full object-contain"
							/>
						</button>
					) : (
						<button
							type="button"
							onClick={() => inputRef.current?.click()}
							onDrop={handleDrop}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							className={`flex h-32 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-sm transition-colors ${
								isDragging
									? 'border-primary bg-primary/5'
									: 'border-muted-foreground/25 hover:border-muted-foreground/50'
							}`}
						>
							<span className="text-muted-foreground">
								Drop an image here, or click to browse
							</span>
						</button>
					)}
					<Input
						placeholder="Alt text (optional)"
						value={altText}
						onChange={(e) => setAltText(e.target.value)}
					/>
					<DialogFooter>
						<Button type="submit" disabled={!file || isUploading}>
							{isUploading ? 'Uploading...' : 'Upload'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export const ImageExtension = (
	onImageUpload?: (file: File) => Promise<string>,
) =>
	defineExtension({
		name: '@inkcn/image',
		dependencies: [
			configExtension(ReactExtension, {
				decorators: [
					<ImageDecorator
						key="image"
						onUploadImage={onImageUpload}
					/>,
				],
			}),
		],
	});
