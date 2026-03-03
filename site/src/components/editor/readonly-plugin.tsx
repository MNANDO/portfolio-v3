import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

export default function ReadOnlyPlugin() {
	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		editor.setEditable(false);
		return () => {
			editor.setEditable(true);
		};
	}, [editor]);
	return null;
}
