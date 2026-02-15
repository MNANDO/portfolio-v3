import { useState, useMemo } from 'react';
import GridFilters from '@/components/GridFilters';
import PortfolioCard from '@/components/PortfolioCard';
import type { PortfolioItem } from '@/lib/mock-loaders';

interface Props {
	items: PortfolioItem[];
}

export default function PortfolioGrid({ items }: Props) {
	const [search, setSearch] = useState('');
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [sortOrder, setSortOrder] = useState<string>('newest');

	const allTags = useMemo(() => {
		const tags = new Set<string>();
		items.forEach((item) => item.tags.forEach((tag) => tags.add(tag)));
		return Array.from(tags).sort();
	}, [items]);

	const filteredItems = useMemo(() => {
		let result = items;

		if (search) {
			const query = search.toLowerCase();
			result = result.filter(
				(item) =>
					item.title.toLowerCase().includes(query) ||
					item.description.toLowerCase().includes(query),
			);
		}

		if (selectedTags.length > 0) {
			result = result.filter((item) =>
				selectedTags.some((tag) => item.tags.includes(tag)),
			);
		}

		result = [...result].sort((a, b) => {
			const dateA = new Date(a.date).getTime();
			const dateB = new Date(b.date).getTime();
			return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
		});

		return result;
	}, [items, search, selectedTags, sortOrder]);

	return (
		<div className="space-y-6">
			<GridFilters
				search={search}
				searchPlaceholder="Search projects..."
				onSearch={setSearch}
				onSort={setSortOrder}
				sortOrder={sortOrder}
				tags={allTags}
				selectedTags={selectedTags}
				onTagSelect={(tag) =>
					setSelectedTags((prev) =>
						prev.includes(tag)
							? prev.filter((t) => t !== tag)
							: [...prev, tag],
					)
				}
			/>

			{/* Grid */}
			{filteredItems.length === 0 ? (
				<p className="py-12 text-center text-muted-foreground">
					No projects found.
				</p>
			) : (
				<div className="space-y-6">
					{filteredItems.map((item) => (
						<PortfolioCard key={item.slug} item={item} />
					))}
				</div>
			)}
		</div>
	);
}
