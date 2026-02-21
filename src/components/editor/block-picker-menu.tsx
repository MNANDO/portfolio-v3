import { useRef, useEffect, type ReactNode } from 'react';

import { BlockPickerOption } from '@/lib/BlockPickerOption';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function BlockPickerMenuItem({
	index,
	isSelected,
	onClick,
	onMouseEnter,
	setRefElement,
	icon,
	title,
}: {
	index: number;
	isSelected: boolean;
	onClick: () => void;
	onMouseEnter: () => void;
	setRefElement: (element: HTMLElement | null) => void;
	icon: ReactNode;
	title: string;
}) {
	return (
		<li
			tabIndex={-1}
			className={cn(
				'flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer text-sm',
				isSelected
					? 'bg-accent text-accent-foreground'
					: 'hover:bg-accent/50',
			)}
			ref={setRefElement}
			role="option"
			aria-selected={isSelected}
			id={'typeahead-item-' + index}
			onMouseEnter={onMouseEnter}
			onClick={onClick}
		>
			<span className="flex items-center justify-center size-5">
				{icon}
			</span>
			<span>{title}</span>
		</li>
	);
}

type BlockPickerMenuProps = {
	options: BlockPickerOption[];
	selectedIndex: number | null;
	onSelectOption: (option: BlockPickerOption, index: number) => void;
	onSetHighlightedIndex: (index: number) => void;
	queryString?: string;
	onQueryChange?: (query: string) => void;
};

export function BlockPickerMenu({
	options,
	selectedIndex,
	onSelectOption,
	onSetHighlightedIndex,
	queryString,
	onQueryChange,
}: BlockPickerMenuProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	return (
		<div className="bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 z-50 min-w-50 rounded-md border p-1 shadow-md">
			{onQueryChange != null && (
				<div className="p-1 pb-0 mb-1">
					<Input
						ref={inputRef}
						placeholder="Filter blocks..."
						value={queryString ?? ''}
						onChange={(e) => onQueryChange(e.target.value)}
						className="h-7 text-xs"
					/>
				</div>
			)}
			<div className="max-h-50 overflow-y-auto">
				{options.length > 0 ? (
					<ul className="list-none m-0 p-0 mt-1">
						{options.map((option, i: number) => (
							<BlockPickerMenuItem
								key={option.key}
								index={i}
								isSelected={selectedIndex === i}
								onClick={() => {
									onSetHighlightedIndex(i);
									onSelectOption(option, i);
								}}
								onMouseEnter={() => {
									onSetHighlightedIndex(i);
								}}
								setRefElement={option.setRefElement}
								icon={option.icon}
								title={option.title}
							/>
						))}
					</ul>
				) : (
					<p className="text-muted-foreground text-xs px-2 py-1.5 mt-1">
						No results
					</p>
				)}
			</div>
		</div>
	);
}
