'use client';

import type { NodeKey } from 'lexical';
import type { JSX } from 'react';

import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	$createParagraphNode,
	$createTextNode,
	$getNearestNodeFromDOMNode,
	$getNodeByKey,
	$isParagraphNode,
	$isTextNode,
} from 'lexical';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical, Plus } from 'lucide-react';

import { BlockPickerOption } from '@/lib/BlockPickerOption';
import { BlockPickerMenu } from './block-picker-menu';

const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu';

type PickerState = {
	paragraphKey: NodeKey;
};

type BlockControlPluginProps = {
	anchorElem?: HTMLElement;
	options?: BlockPickerOption[];
};

function isOnMenu(element: HTMLElement): boolean {
	return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

export default function EditorBlockControlPlugin({
	anchorElem = document.body,
	options = [],
}: BlockControlPluginProps): JSX.Element {
	const [editor] = useLexicalComposerContext();
	const menuRef = useRef<HTMLDivElement>(null);
	const pickerRef = useRef<HTMLDivElement>(null);
	const targetLineRef = useRef<HTMLDivElement>(null);
	const [draggableElement, setDraggableElement] =
		useState<HTMLElement | null>(null);
	const [pickerState, setPickerState] = useState<PickerState | null>(null);
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [queryString, setQueryString] = useState('');
	const [highlightedIndex, setHighlightedIndex] = useState(0);
	const [pickerPosition, setPickerPosition] = useState<{
		left: number;
		top: number;
		anchor: 'top' | 'bottom';
	} | null>(null);

	const filteredOptions = useMemo(() => {
		if (!queryString) return options;
		const regex = new RegExp(queryString, 'i');
		return options.filter(
			(option) =>
				regex.test(option.title) ||
				option.keywords.some((keyword) => regex.test(keyword)),
		);
	}, [options, queryString]);

	const clampedIndex =
		filteredOptions.length > 0
			? Math.min(highlightedIndex, filteredOptions.length - 1)
			: 0;

	// Close on click outside
	useEffect(() => {
		if (!isPickerOpen) return;
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node | null;
			if (
				(pickerRef.current && pickerRef.current.contains(target)) ||
				(menuRef.current && menuRef.current.contains(target))
			) {
				return;
			}
			setIsPickerOpen(false);
			setPickerState(null);
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isPickerOpen]);

	const selectOption = useCallback(
		(option: BlockPickerOption) => {
			if (!pickerState) {
				setIsPickerOpen(false);
				return;
			}
			setIsPickerOpen(false);
			setPickerState(null);
			editor.update(() => {
				const node = $getNodeByKey(pickerState.paragraphKey);
				if (!node || !$isParagraphNode(node)) return;

				// Select into the existing paragraph so the insert replaces it
				const firstChild = node.getFirstChild();
				if ($isTextNode(firstChild)) {
					firstChild.select();
				}

				option.insert({ editor, queryString });

				// Clean up empty placeholder if the insert didn't use it
				const latest = node.getLatest();
				if ($isParagraphNode(latest)) {
					const onlyChild = latest.getFirstChild();
					if (
						$isTextNode(onlyChild) &&
						onlyChild.getTextContent().length === 0 &&
						latest.getChildrenSize() === 1
					) {
						latest.remove();
					}
				}
			});
		},
		[editor, pickerState, queryString],
	);

	// Keyboard navigation
	useEffect(() => {
		if (!isPickerOpen) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!filteredOptions.length) return;
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				setHighlightedIndex((i) =>
					i + 1 >= filteredOptions.length ? 0 : i + 1,
				);
			} else if (event.key === 'ArrowUp') {
				event.preventDefault();
				setHighlightedIndex((i) =>
					i - 1 < 0 ? filteredOptions.length - 1 : i - 1,
				);
			} else if (event.key === 'Enter') {
				event.preventDefault();
				const option = filteredOptions[clampedIndex];
				if (option) selectOption(option);
			} else if (event.key === 'Escape') {
				event.preventDefault();
				setIsPickerOpen(false);
				setPickerState(null);
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [clampedIndex, isPickerOpen, filteredOptions, selectOption]);

	function openPicker() {
		if (!draggableElement || !editor) return;

		let paragraphKey: NodeKey | null = null;

		editor.update(() => {
			const node = $getNearestNodeFromDOMNode(draggableElement);
			if (!node) return;

			const paragraph = $createParagraphNode();
			const textNode = $createTextNode('');
			paragraph.append(textNode);
			node.insertAfter(paragraph);
			textNode.select();
			paragraphKey = paragraph.getKey();
		});

		if (!paragraphKey) return;

		// Wait for DOM to update, then position picker at the new paragraph
		requestAnimationFrame(() => {
			const paragraphDom = editor.getElementByKey(paragraphKey!);
			if (!paragraphDom) return;

			const rect = paragraphDom.getBoundingClientRect();
			const PICKER_HEIGHT = 300;
			const spaceBelow = window.innerHeight - rect.bottom;
			const showAbove =
				spaceBelow < PICKER_HEIGHT && rect.top > PICKER_HEIGHT;

			setPickerPosition({
				left: rect.left,
				top: showAbove ? rect.top : rect.bottom + 4,
				anchor: showAbove ? 'bottom' : 'top',
			});
			setPickerState({ paragraphKey: paragraphKey! });
			setQueryString('');
			setHighlightedIndex(0);
			setIsPickerOpen(true);
		});
	}

	return (
		<>
			{isPickerOpen && pickerPosition
				? createPortal(
						<div
							ref={pickerRef}
							className="fixed z-50"
							style={{
								left: pickerPosition.left,
								...(pickerPosition.anchor === 'bottom'
									? {
											bottom:
												window.innerHeight -
												pickerPosition.top,
										}
									: { top: pickerPosition.top }),
							}}
						>
							<BlockPickerMenu
								options={filteredOptions}
								selectedIndex={clampedIndex}
								onSelectOption={(option) => {
									selectOption(option);
								}}
								onSetHighlightedIndex={setHighlightedIndex}
								queryString={queryString}
								onQueryChange={(q) => {
									setQueryString(q);
									setHighlightedIndex(0);
								}}
							/>
						</div>,
						document.body,
					)
				: null}
			<DraggableBlockPlugin_EXPERIMENTAL
				anchorElem={anchorElem}
				menuRef={menuRef}
				targetLineRef={targetLineRef}
				menuComponent={
					<div
						ref={menuRef}
						className={`${DRAGGABLE_BLOCK_MENU_CLASSNAME} group flex items-center gap-0.5 rounded p-0.5 px-px opacity-0 absolute left-0 top-0 will-change-transform`}
					>
						<button
							type="button"
							title="Click to add below, hold Alt/Ctrl to add above"
							className="flex items-center justify-center w-6 h-6 p-0 border-none bg-transparent cursor-pointer opacity-30 rounded text-foreground group-hover:opacity-60 hover:opacity-100! hover:bg-accent"
							aria-label="Add block"
							onClick={openPicker}
						>
							<Plus size={18} />
						</button>
						<div className="flex items-center justify-center w-6 h-6 opacity-30 cursor-grab active:cursor-grabbing rounded text-foreground group-hover:opacity-60 hover:opacity-100! hover:bg-accent">
							<GripVertical size={18} />
						</div>
					</div>
				}
				targetLineComponent={
					<div
						ref={targetLineRef}
						className="pointer-events-none bg-ring h-1 absolute left-0 top-0 opacity-0 will-change-transform"
					/>
				}
				isOnMenu={isOnMenu}
				onElementChanged={setDraggableElement}
			/>
		</>
	);
}
