'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import {
	$getSelection,
	$isRangeSelection,
	type LexicalEditor,
	$isParagraphNode,
	$isTextNode,
	ElementNode,
	getDOMSelection,
	type RangeSelection,
	TextNode,
	SELECTION_CHANGE_COMMAND,
	COMMAND_PRIORITY_LOW,
	type TextFormatType,
	FORMAT_TEXT_COMMAND,
} from 'lexical';
import {
	type JSX,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { createPortal } from 'react-dom';

import {
	Bold,
	Italic,
	Underline,
	Strikethrough,
	ChevronDown,
	Baseline,
} from 'lucide-react';

import {
	TEXT_COLORS,
	BACKGROUND_COLORS,
	type ColorOption,
} from '@/lib/color-options';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { BlockCategory, BlockPickerOption } from '@/lib/BlockPickerOption';
import { $patchStyleText } from '@lexical/selection';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $isListNode, ListNode } from '@lexical/list';
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import {
	$getSelectionStyleValueForProperty,
	$isAtNodeEnd,
} from '@lexical/selection';

export interface TextFormatState {
	isBold: boolean;
	isItalic: boolean;
	isUnderline: boolean;
	isStrikethrough: boolean;
}

interface UseTextFormatToggleResult {
	handleValueChange: (values: string[]) => void;
	currentValues: string[];
}

const FORMATS: TextFormatType[] = [
	'bold',
	'italic',
	'underline',
	'strikethrough',
];

function useTextFormatToggle(
	editor: LexicalEditor,
	formatState: TextFormatState,
): UseTextFormatToggleResult {
	const { isBold, isItalic, isUnderline, isStrikethrough } = formatState;

	const currentValues = useMemo(
		() => [
			...(isBold ? ['bold'] : []),
			...(isItalic ? ['italic'] : []),
			...(isUnderline ? ['underline'] : []),
			...(isStrikethrough ? ['strikethrough'] : []),
		],
		[isBold, isItalic, isUnderline, isStrikethrough],
	);

	const handleValueChange = useCallback(
		(values: string[]) => {
			FORMATS.forEach((format) => {
				const isActive =
					format === 'bold'
						? isBold
						: format === 'italic'
							? isItalic
							: format === 'underline'
								? isUnderline
								: isStrikethrough;
				const shouldBeActive = values.includes(format);
				if (isActive !== shouldBeActive) {
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
				}
			});
		},
		[editor, isBold, isItalic, isUnderline, isStrikethrough],
	);

	return { handleValueChange, currentValues };
}

const VERTICAL_GAP = 10;
const HORIZONTAL_OFFSET = 5;

interface UseFloatingToolbarPositionOptions {
	editor: LexicalEditor;
	anchorElem: HTMLElement;
}

interface UseFloatingToolbarPositionResult {
	setPopupRef: (elem: HTMLDivElement | null) => void;
}

function getDOMRangeRect(
	nativeSelection: Selection,
	rootElement: HTMLElement,
): DOMRect {
	const domRange = nativeSelection.getRangeAt(0);

	let rect;

	if (nativeSelection.anchorNode === rootElement) {
		let inner = rootElement;
		while (inner.firstElementChild != null) {
			inner = inner.firstElementChild as HTMLElement;
		}
		rect = inner.getBoundingClientRect();
	} else {
		rect = domRange.getBoundingClientRect();
	}

	return rect;
}

function setFloatingElemPosition(
	targetRect: DOMRect | null,
	floatingElem: HTMLElement,
	anchorElem: HTMLElement,
	isLink: boolean = false,
	verticalGap: number = VERTICAL_GAP,
	horizontalOffset: number = HORIZONTAL_OFFSET,
): void {
	const scrollerElem = anchorElem.parentElement;

	if (targetRect === null || !scrollerElem) {
		floatingElem.style.opacity = '0';
		floatingElem.style.top = '-10000px';
		floatingElem.style.left = '-10000px';
		return;
	}

	const floatingElemRect = floatingElem.getBoundingClientRect();
	const anchorElementRect = anchorElem.getBoundingClientRect();
	const editorScrollerRect = scrollerElem.getBoundingClientRect();

	let top = targetRect.top - floatingElemRect.height - verticalGap;
	let left = targetRect.left - horizontalOffset;

	const selection = window.getSelection();
	if (selection && selection.rangeCount > 0) {
		const range = selection.getRangeAt(0);
		const textNode = range.startContainer;
		if (textNode.nodeType === Node.ELEMENT_NODE || textNode.parentElement) {
			const textElement =
				textNode.nodeType === Node.ELEMENT_NODE
					? (textNode as Element)
					: (textNode.parentElement as Element);
			const textAlign = window.getComputedStyle(textElement).textAlign;

			if (textAlign === 'right' || textAlign === 'end') {
				left =
					targetRect.right -
					floatingElemRect.width +
					horizontalOffset;
			}
		}
	}

	if (top < editorScrollerRect.top) {
		top +=
			floatingElemRect.height +
			targetRect.height +
			verticalGap * (isLink ? 9 : 2);
	}

	if (left + floatingElemRect.width > editorScrollerRect.right) {
		left =
			editorScrollerRect.right -
			floatingElemRect.width -
			horizontalOffset;
	}

	if (left < editorScrollerRect.left) {
		left = editorScrollerRect.left + horizontalOffset;
	}

	top -= anchorElementRect.top;
	left -= anchorElementRect.left;

	floatingElem.style.opacity = '1';
	floatingElem.style.top = `${top}px`;
	floatingElem.style.left = `${left}px`;
}

function useFloatingToolbarPosition({
	editor,
	anchorElem,
}: UseFloatingToolbarPositionOptions): UseFloatingToolbarPositionResult {
	const popupRef = useRef<HTMLDivElement | null>(null);

	const updatePosition = useCallback(() => {
		const popupElem = popupRef.current;
		const nativeSelection = getDOMSelection(editor._window);

		if (popupElem === null) return;

		const rootElement = editor.getRootElement();
		const selection = $getSelection();

		if (
			selection !== null &&
			nativeSelection !== null &&
			!nativeSelection.isCollapsed &&
			rootElement !== null &&
			rootElement.contains(nativeSelection.anchorNode)
		) {
			const rangeRect = getDOMRangeRect(nativeSelection, rootElement);
			setFloatingElemPosition(rangeRect, popupElem, anchorElem, false);
		}
	}, [editor, anchorElem]);

	const setPopupRef = useCallback(
		(elem: HTMLDivElement | null) => {
			popupRef.current = elem;
			if (elem) {
				editor.getEditorState().read(() => {
					updatePosition();
				});
			}
		},
		[editor, updatePosition],
	);

	// Mouse event handlers for pointer events during drag
	useEffect(() => {
		function mouseMoveListener(e: MouseEvent) {
			if (popupRef.current && (e.buttons === 1 || e.buttons === 2)) {
				if (popupRef.current.style.pointerEvents !== 'none') {
					const elementUnderMouse = document.elementFromPoint(
						e.clientX,
						e.clientY,
					);
					if (
						elementUnderMouse &&
						!popupRef.current.contains(elementUnderMouse)
					) {
						popupRef.current.style.pointerEvents = 'none';
					}
				}
			}
		}

		function mouseUpListener() {
			if (!popupRef.current) return;
			if (popupRef.current.style.pointerEvents !== 'auto') {
				popupRef.current.style.pointerEvents = 'auto';
			}
		}

		document.addEventListener('mousemove', mouseMoveListener);
		document.addEventListener('mouseup', mouseUpListener);

		return () => {
			document.removeEventListener('mousemove', mouseMoveListener);
			document.removeEventListener('mouseup', mouseUpListener);
		};
	}, []);

	// Scroll and resize listeners
	useEffect(() => {
		const scrollerElem = anchorElem.parentElement;

		const update = () => {
			editor.getEditorState().read(() => {
				updatePosition();
			});
		};

		window.addEventListener('resize', update);
		scrollerElem?.addEventListener('scroll', update);

		return () => {
			window.removeEventListener('resize', update);
			scrollerElem?.removeEventListener('scroll', update);
		};
	}, [editor, updatePosition, anchorElem]);

	// Editor state and selection listeners
	useEffect(() => {
		editor.getEditorState().read(() => {
			updatePosition();
		});

		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					updatePosition();
				});
			}),
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					updatePosition();
					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
		);
	}, [editor, updatePosition]);

	return { setPopupRef };
}

type EditorToolbarState = {
	isVisible: boolean;
	isBold: boolean;
	isItalic: boolean;
	isUnderline: boolean;
	isUppercase: boolean;
	isLowercase: boolean;
	isCapitalize: boolean;
	isStrikethrough: boolean;
	isSubscript: boolean;
	isSuperscript: boolean;
	blockType: string;
	fontColor: string;
	bgColor: string;
};

const DEFAULT_STATE: EditorToolbarState = {
	isVisible: false,
	isBold: false,
	isItalic: false,
	isUnderline: false,
	isUppercase: false,
	isLowercase: false,
	isCapitalize: false,
	isStrikethrough: false,
	isSubscript: false,
	isSuperscript: false,
	blockType: 'paragraph',
	fontColor: '',
	bgColor: '',
};

function getSelectedNode(selection: RangeSelection): TextNode | ElementNode {
	const anchor = selection.anchor;
	const focus = selection.focus;
	const anchorNode = selection.anchor.getNode();
	const focusNode = selection.focus.getNode();
	if (anchorNode === focusNode) {
		return anchorNode;
	}
	const isBackward = selection.isBackward();
	if (isBackward) {
		return $isAtNodeEnd(focus) ? anchorNode : focusNode;
	} else {
		return $isAtNodeEnd(anchor) ? anchorNode : focusNode;
	}
}

function $getBlockType(
	editor: LexicalEditor,
	selection: ReturnType<typeof $getSelection>,
): string {
	if (!$isRangeSelection(selection)) return 'paragraph';

	const anchorNode = selection.anchor.getNode();
	const element =
		anchorNode.getKey() === 'root'
			? anchorNode
			: anchorNode.getTopLevelElementOrThrow();

	const elementDOM = editor.getElementByKey(element.getKey());
	if (elementDOM === null) return 'paragraph';

	if ($isListNode(element)) {
		const parentList = $getNearestNodeOfType<ListNode>(
			anchorNode,
			ListNode,
		);
		const type = parentList
			? parentList.getListType()
			: element.getListType();
		if (type === 'number') return 'ordered-list';
		if (type === 'check') return 'check-list';
		return 'unordered-list';
	}

	if ($isHeadingNode(element)) {
		const tag = element.getTag();
		return `heading-${tag.replace('h', '')}`;
	}

	if ($isQuoteNode(element)) return 'quote';

	return 'paragraph';
}

function useEditorToolbar(editor: LexicalEditor): EditorToolbarState {
	const [toolbarState, setEditorToolbarState] =
		useState<EditorToolbarState>(DEFAULT_STATE);
	const isMouseDownRef = useRef(false);

	const update = useCallback(
		(forceShow = false) => {
			editor.getEditorState().read(() => {
				if (editor.isComposing()) return;

				if (isMouseDownRef.current && !forceShow) {
					return;
				}

				const selection = $getSelection();
				const nativeSelection = getDOMSelection(editor._window);
				const rootElement = editor.getRootElement();

				if (
					nativeSelection !== null &&
					(!$isRangeSelection(selection) ||
						rootElement === null ||
						!rootElement.contains(nativeSelection.anchorNode))
				) {
					setEditorToolbarState(DEFAULT_STATE);
					return;
				}

				if (!$isRangeSelection(selection)) return;

				const node = getSelectedNode(selection);

				const hasText = selection.getTextContent() !== '';
				const isText =
					hasText && ($isTextNode(node) || $isParagraphNode(node));

				const rawTextContent = selection
					.getTextContent()
					.replace(/\n/g, '');
				const isCollapsedWhitespaceSelection =
					!selection.isCollapsed() && rawTextContent === '';

				if (!isText || isCollapsedWhitespaceSelection) {
					setEditorToolbarState(DEFAULT_STATE);
					return;
				}

				setEditorToolbarState({
					isVisible: true,
					isBold: selection.hasFormat('bold'),
					isItalic: selection.hasFormat('italic'),
					isUnderline: selection.hasFormat('underline'),
					isUppercase: selection.hasFormat('uppercase'),
					isLowercase: selection.hasFormat('lowercase'),
					isCapitalize: selection.hasFormat('capitalize'),
					isStrikethrough: selection.hasFormat('strikethrough'),
					isSubscript: selection.hasFormat('subscript'),
					isSuperscript: selection.hasFormat('superscript'),
					blockType: $getBlockType(editor, selection),
					fontColor: $getSelectionStyleValueForProperty(
						selection,
						'color',
						'',
					),
					bgColor: $getSelectionStyleValueForProperty(
						selection,
						'background-color',
						'',
					),
				});
			});
		},
		[editor],
	);

	useEffect(() => {
		const rootElement = editor.getRootElement();
		if (!rootElement) return;

		const handleMouseDown = () => {
			isMouseDownRef.current = true;
			setEditorToolbarState(DEFAULT_STATE);
		};

		const handleMouseUp = () => {
			isMouseDownRef.current = false;
			update(true);
		};

		rootElement.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('mouseup', handleMouseUp);

		return () => {
			rootElement.removeEventListener('mousedown', handleMouseDown);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [editor, update]);

	useEffect(() => {
		document.addEventListener('selectionchange', () => update());
		return () =>
			document.removeEventListener('selectionchange', () => update());
	}, [update]);

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(() => update()),
			editor.registerRootListener(() => {
				if (editor.getRootElement() === null) {
					setEditorToolbarState(DEFAULT_STATE);
				}
			}),
		);
	}, [editor, update]);

	return toolbarState;
}

function useColorFormat(editor: LexicalEditor) {
	const applyFontColor = useCallback(
		(color: string | null) => {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					$patchStyleText(selection, { color });
				}
			});
		},
		[editor],
	);

	const applyBgColor = useCallback(
		(color: string | null) => {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					$patchStyleText(selection, { 'background-color': color });
				}
			});
		},
		[editor],
	);

	return { applyFontColor, applyBgColor };
}

const TOOLBAR_BLOCK_CATEGORIES: BlockCategory[] = [
	'basic',
	'headings',
	'lists',
	'quotes',
];

function filterBlockOptions(options: BlockPickerOption[]): BlockPickerOption[] {
	return options.filter((opt) =>
		TOOLBAR_BLOCK_CATEGORIES.includes(opt.category),
	);
}

interface EditorToolbarProps {
	editor: LexicalEditor;
	anchorElem: HTMLElement;
	options: BlockPickerOption[];
}

function EditorToolbar({
	editor,
	anchorElem,
	options,
}: EditorToolbarProps): JSX.Element | null {
	const state = useEditorToolbar(editor);
	const { setPopupRef } = useFloatingToolbarPosition({ editor, anchorElem });
	const { handleValueChange: onTextStyleToggle, currentValues } =
		useTextFormatToggle(editor, state);
	const { applyFontColor, applyBgColor } = useColorFormat(editor);

	if (!state.isVisible) return null;

	const currentBlock = options.find((opt) => opt.key === state.blockType);
	const blockOptions = filterBlockOptions(options);

	return createPortal(
		<div
			ref={setPopupRef}
			className="absolute z-50 flex items-center gap-0.5 rounded-md border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-150"
			onMouseDown={(e) => e.preventDefault()}
		>
			{/* Block picker dropdown */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost">
						{currentBlock?.icon}
						<span>{currentBlock?.title ?? 'Paragraph'}</span>
						<ChevronDown className="h-3 w-3" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					{blockOptions.map((option) => (
						<DropdownMenuItem
							key={option.key}
							onSelect={() => {
								option.insert({ editor, queryString: '' });
								editor.update(() => {
									const selection = $getSelection();
									if ($isRangeSelection(selection)) {
										selection.focus.set(
											selection.anchor.key,
											selection.anchor.offset,
											selection.anchor.type,
										);
									}
								});
							}}
							className={
								state.blockType === option.key
									? 'bg-accent'
									: ''
							}
						>
							<span className="mr-2 h-4 w-4">{option.icon}</span>
							{option.title}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Text format toggles */}
			<ToggleGroup
				type="multiple"
				spacing={1}
				value={currentValues}
				onValueChange={onTextStyleToggle}
			>
				<ToggleGroupItem
					value="bold"
					title="Bold"
					aria-label="Format text as bold"
				>
					<Bold className="h-2 w-2" />
				</ToggleGroupItem>

				<ToggleGroupItem
					value="italic"
					title="Italic"
					aria-label="Format text as italics"
				>
					<Italic className="h-2 w-2" />
				</ToggleGroupItem>

				<ToggleGroupItem
					value="underline"
					title="Underline"
					aria-label="Format text to underlined"
				>
					<Underline className="h-2 w-2" />
				</ToggleGroupItem>

				<ToggleGroupItem
					value="strikethrough"
					title="Strikethrough"
					aria-label="Format text with a strikethrough"
				>
					<Strikethrough className="h-2 w-2" />
				</ToggleGroupItem>
			</ToggleGroup>

			{/* Color picker dropdown */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						style={
							state.bgColor
								? { backgroundColor: state.bgColor }
								: undefined
						}
					>
						<Baseline
							className="h-3 w-3"
							style={
								state.fontColor
									? { color: state.fontColor }
									: undefined
							}
						/>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<ColorMenuGroup
						label="Text"
						colors={TEXT_COLORS}
						activeValue={state.fontColor}
						onSelect={applyFontColor}
					/>
					<ColorMenuGroup
						label="Background"
						colors={BACKGROUND_COLORS}
						activeValue={state.bgColor}
						onSelect={applyBgColor}
					/>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>,
		anchorElem,
	);
}

function ColorMenuGroup({
	label,
	colors,
	activeValue,
	onSelect,
}: {
	label: string;
	colors: ColorOption[];
	activeValue: string;
	onSelect: (color: string | null) => void;
}) {
	return (
		<DropdownMenuGroup>
			<DropdownMenuLabel>{label}</DropdownMenuLabel>
			{colors.map((color) => (
				<DropdownMenuItem
					key={color.key}
					onSelect={() => onSelect(color.value)}
					className={
						(color.value ?? '') === activeValue ? 'bg-accent' : ''
					}
				>
					<Baseline className={`h-3 w-3 ${color.iconClassName}`} />
					{color.label}
				</DropdownMenuItem>
			))}
		</DropdownMenuGroup>
	);
}

export default function EditorToolbarPlugin({
	anchorElem = document.body,
	options,
}: {
	anchorElem?: HTMLElement;
	options: BlockPickerOption[];
}): JSX.Element | null {
	const [editor] = useLexicalComposerContext();
	return (
		<EditorToolbar
			editor={editor}
			anchorElem={anchorElem}
			options={options}
		/>
	);
}
