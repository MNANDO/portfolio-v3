import type { JSX } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	LexicalTypeaheadMenuPlugin,
	useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { TextNode } from 'lexical';
import { useCallback, useMemo, useState } from 'react';
import * as ReactDOM from 'react-dom';

import { BlockPickerOption } from '@/lib/BlockPickerOption';
import { BlockPickerMenu } from './block-picker-menu';

type BlockPickerPluginProps = {
	options: BlockPickerOption[];
};

export default function BlockPickerPlugin({
	options,
}: BlockPickerPluginProps): JSX.Element {
	const [editor] = useLexicalComposerContext();

	const [queryString, setQueryString] = useState<string | null>(null);

	const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
		allowWhitespace: true,
		minLength: 0,
	});

	const filteredOptions = useMemo(() => {
		if (!queryString) return options;

		const regex = new RegExp(queryString, 'i');

		return options.filter((option) => {
			return (
				regex.test(option.title) ||
				option.keywords.some((keyword: string) => regex.test(keyword))
			);
		});
	}, [options, queryString]);

	const onSelectOption = useCallback(
		(
			selectedOption: BlockPickerOption,
			nodeToRemove: TextNode | null,
			closeMenu: () => void,
			matchingString: string,
		) => {
			editor.update(() => {
				nodeToRemove?.remove();
				selectedOption.insert({
					editor,
					queryString: matchingString,
				});
				closeMenu();
			});
		},
		[editor],
	);

	return (
		<>
			<LexicalTypeaheadMenuPlugin<BlockPickerOption>
				onQueryChange={setQueryString}
				onSelectOption={onSelectOption}
				triggerFn={checkForTriggerMatch}
				options={filteredOptions}
				menuRenderFn={(
					anchorElementRef,
					{
						selectedIndex,
						selectOptionAndCleanUp,
						setHighlightedIndex,
					},
				) =>
					anchorElementRef.current && filteredOptions.length
						? ReactDOM.createPortal(
								<BlockPickerMenu
									options={filteredOptions}
									selectedIndex={selectedIndex}
									onSelectOption={(option) => {
										selectOptionAndCleanUp(option);
									}}
									onSetHighlightedIndex={setHighlightedIndex}
								/>,
								anchorElementRef.current,
							)
						: null
				}
			/>
		</>
	);
}
