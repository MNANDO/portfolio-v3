import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';

interface GridFiltersProps {
	search: string;
	searchPlaceholder: string;
	onSearch: (search: string) => void;
	onSort: (sort: string) => void;
	sortOrder?: string;
	tags: string[];
	selectedTags: string[];
	onTagSelect: (tag: string) => void;
}

function GridFilters({
	search,
	searchPlaceholder,
	onSearch,
	onSort,
	sortOrder,
	tags,
	selectedTags,
	onTagSelect,
}: GridFiltersProps) {
	return (
		<div>
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
				<div className="relative min-w-0 flex-1">
					<Input
						placeholder={searchPlaceholder}
						value={search}
						onChange={(e) => onSearch(e.target.value)}
					/>
				</div>
				<Select value={sortOrder} onValueChange={onSort}>
					<SelectTrigger className="w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="newest">Newest first</SelectItem>
						<SelectItem value="oldest">Oldest first</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex gap-2 overflow-x-auto h-12">
				{tags.map((tag) => (
					<button
						key={tag}
						type="button"
						onClick={() => onTagSelect(tag)}
					>
						<Badge
							variant={
								selectedTags.includes(tag)
									? 'default'
									: 'outline'
							}
							className="cursor-pointer whitespace-nowrap"
						>
							{tag}
						</Badge>
					</button>
				))}
			</div>
		</div>
	);
}

export default GridFilters;
