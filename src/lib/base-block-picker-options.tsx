import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Heading1,
	Heading2,
	Heading3,
	Image,
	List,
	ListChecks,
	ListOrdered,
	Minus,
	Pilcrow,
	Quote,
} from 'lucide-react';
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	FORMAT_ELEMENT_COMMAND,
} from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import {
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { BlockPickerOption } from './BlockPickerOption';

export const baseBlockPickerOptions: BlockPickerOption[] = [
	new BlockPickerOption({
		id: 'paragraph',
		title: 'Paragraph',
		icon: <Pilcrow />,
		keywords: ['normal', 'paragraph', 'p', 'text'],
		category: 'basic',
		insert: ({ editor }) => {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					$setBlocksType(selection, () => $createParagraphNode());
				}
			});
		},
	}),
	new BlockPickerOption({
		id: 'heading-1',
		title: 'Heading 1',
		icon: <Heading1 />,
		keywords: ['heading', 'header', 'h1'],
		category: 'headings',
		insert: ({ editor }) => {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					$setBlocksType(selection, () => $createHeadingNode('h1'));
				}
			});
		},
	}),
	new BlockPickerOption({
		id: 'heading-2',
		title: 'Heading 2',
		icon: <Heading2 />,
		keywords: ['heading', 'header', 'h2'],
		category: 'headings',
		insert: ({ editor }) => {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					$setBlocksType(selection, () => $createHeadingNode('h2'));
				}
			});
		},
	}),
	new BlockPickerOption({
		id: 'heading-3',
		title: 'Heading 3',
		icon: <Heading3 />,
		keywords: ['heading', 'header', 'h3'],
		category: 'headings',
		insert: ({ editor }) => {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					$setBlocksType(selection, () => $createHeadingNode('h3'));
				}
			});
		},
	}),
	new BlockPickerOption({
		id: 'ordered-list',
		title: 'Numbered List',
		icon: <ListOrdered />,
		keywords: ['numbered list', 'ordered list', 'ol'],
		category: 'lists',
		insert: ({ editor }) => {
			editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
		},
	}),
	new BlockPickerOption({
		id: 'unordered-list',
		title: 'Bulleted List',
		icon: <List />,
		keywords: ['bulleted list', 'unordered list', 'ul'],
		category: 'lists',
		insert: ({ editor }) => {
			editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
		},
	}),
	new BlockPickerOption({
		id: 'check-list',
		title: 'Check List',
		icon: <ListChecks />,
		keywords: ['check list', 'todo list'],
		category: 'lists',
		insert: ({ editor }) => {
			editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
		},
	}),
	new BlockPickerOption({
		id: 'quote',
		title: 'Quote',
		icon: <Quote />,
		keywords: ['block quote', 'quote'],
		category: 'quotes',
		insert: ({ editor }) => {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					$setBlocksType(selection, () => $createQuoteNode());
				}
			});
		},
	}),
	new BlockPickerOption({
		id: 'divider',
		title: 'Divider',
		icon: <Minus />,
		keywords: ['horizontal rule', 'divider', 'hr'],
		category: 'dividers',
		insert: ({ editor }) => {
			editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
		},
	}),
	new BlockPickerOption({
		id: 'align-left',
		title: 'Align left',
		icon: <AlignLeft />,
		keywords: ['align', 'left'],
		category: 'alignment',
		insert: ({ editor }) => {
			editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
		},
	}),
	new BlockPickerOption({
		id: 'align-center',
		title: 'Align center',
		icon: <AlignCenter />,
		keywords: ['align', 'center'],
		category: 'alignment',
		insert: ({ editor }) => {
			editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
		},
	}),
	new BlockPickerOption({
		id: 'align-right',
		title: 'Align right',
		icon: <AlignRight />,
		keywords: ['align', 'right'],
		category: 'alignment',
		insert: ({ editor }) => {
			editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
		},
	}),
];
