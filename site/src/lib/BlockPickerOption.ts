import type { ReactNode } from 'react';
import type { LexicalEditor } from 'lexical';
import { MenuOption } from '@lexical/react/LexicalTypeaheadMenuPlugin';

export type BlockCategory =
	| 'basic'
	| 'headings'
	| 'lists'
	| 'quotes'
	| 'dividers'
	| 'alignment'
	| 'advanced';

export class BlockPickerOption extends MenuOption {
	title: string;
	icon?: ReactNode;
	keywords: readonly string[];
	keyboardShortcut?: string;
	category: BlockCategory;
	insert: (args: { editor: LexicalEditor; queryString: string }) => void;

	constructor(opts: {
		id: string;
		title: string;
		icon?: ReactNode;
		keywords: readonly string[];
		keyboardShortcut?: string;
		category: BlockCategory;
		insert: (args: { editor: LexicalEditor; queryString: string }) => void;
	}) {
		super(opts.id);
		this.title = opts.title;
		this.icon = opts.icon;
		this.keywords = opts.keywords;
		this.keyboardShortcut = opts.keyboardShortcut;
		this.category = opts.category;
		this.insert = opts.insert;
	}
}
