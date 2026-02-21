import { HorizontalRuleNode } from '@lexical/extension';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import type { Klass, LexicalNode } from 'lexical';

export const baseNodes: Array<Klass<LexicalNode>> = [
	HeadingNode,
	ListNode,
	ListItemNode,
	QuoteNode,
	HorizontalRuleNode,
];
