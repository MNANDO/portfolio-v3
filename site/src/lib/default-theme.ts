import type { EditorThemeClasses } from 'lexical';
import './editor-theme.css';

export const editorTheme: EditorThemeClasses = {
	blockCursor: 'EditorTheme__blockCursor',
	embedBlock: {
		base: 'select-none',
		focus: 'outline outline-2 outline-blue-500',
	},
	hashtag: 'bg-primary/10 text-primary px-1 rounded',
	heading: {
		h1: 'text-[1.875em] font-bold leading-[1.3] mt-[0.5em] mb-[5px] text-foreground',
		h2: 'text-[1.5em] font-semibold leading-[1.3] mt-[0.5em] mb-px text-foreground',
		h3: 'text-[1.25em] font-semibold leading-[1.3] mt-[0.5em] mb-px text-foreground',
		h4: 'text-base font-semibold leading-[1.3] mt-[0.5em] mb-px text-foreground',
		h5: 'text-sm font-semibold leading-[1.3] mt-[0.5em] mb-px text-foreground',
		h6: 'text-xs font-semibold leading-[1.3] mt-[0.5em] mb-px text-foreground',
	},
	hr: 'EditorTheme__hr',
	image: 'editor-image',
	indent: '[--lexical-indent-base-value:24px]',
	link: 'text-foreground underline decoration-muted-foreground underline-offset-2 hover:decoration-foreground cursor-pointer',
	list: {
		checklist: '',
		listitem:
			'm-0 pl-[0.2em] leading-normal text-foreground marker:text-foreground',
		listitemChecked: 'EditorTheme__listItemChecked',
		listitemUnchecked: 'EditorTheme__listItemUnchecked',
		nested: {
			listitem: 'list-none before:hidden after:hidden',
		},
		olDepth: [
			'm-0 pl-6 list-outside list-decimal',
			'm-0 pl-6 list-outside list-[lower-alpha]',
			'm-0 pl-6 list-outside list-[lower-roman]',
			'm-0 pl-6 list-outside list-decimal',
			'm-0 pl-6 list-outside list-[lower-alpha]',
		],
		ul: 'm-0 pl-6 list-outside list-disc',
	},
	paragraph: 'm-0 relative leading-normal text-foreground',
	quote: 'my-1 pl-3.5 border-l-[3px] border-border text-muted-foreground',
	tab: 'EditorTheme__tabNode',
	text: {
		bold: 'font-semibold',
		capitalize: 'capitalize',
		code: 'bg-muted rounded px-[0.4em] py-[0.2em] font-mono text-[85%] text-destructive',
		highlight: 'bg-accent px-0.5 -mx-0.5',
		italic: 'italic',
		lowercase: 'lowercase',
		strikethrough: 'line-through',
		subscript: 'text-[0.8em] align-sub',
		superscript: 'text-[0.8em] align-super',
		underline: 'underline',
		underlineStrikethrough: 'underline line-through',
		uppercase: 'uppercase',
	},
};
