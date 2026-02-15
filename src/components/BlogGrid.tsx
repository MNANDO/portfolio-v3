import { useState, useMemo } from 'react';
import GridFilters from '@/components/GridFilters';
import BlogPostCard from '@/components/BlogPostCard';
import type { BlogPost } from '@/lib/mock-loaders';

interface Props {
	posts: BlogPost[];
}

export default function BlogGrid({ posts }: Props) {
	const [search, setSearch] = useState('');
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [sortOrder, setSortOrder] = useState<string>('newest');

	const allTags = useMemo(() => {
		const tags = new Set<string>();
		posts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
		return Array.from(tags).sort();
	}, [posts]);

	const filteredPosts = useMemo(() => {
		let result = posts;

		if (search) {
			const query = search.toLowerCase();
			result = result.filter(
				(post) =>
					post.title.toLowerCase().includes(query) ||
					post.description.toLowerCase().includes(query),
			);
		}

		if (selectedTags.length > 0) {
			result = result.filter((post) =>
				selectedTags.some((tag) => post.tags.includes(tag)),
			);
		}

		result = [...result].sort((a, b) => {
			const dateA = new Date(a.date).getTime();
			const dateB = new Date(b.date).getTime();
			return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
		});

		return result;
	}, [posts, search, selectedTags, sortOrder]);

	return (
		<div className="space-y-6">
			<GridFilters
				search={search}
				searchPlaceholder="Search posts..."
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
			{filteredPosts.length === 0 ? (
				<p className="py-12 text-center text-muted-foreground">
					No posts found.
				</p>
			) : (
				<div className="space-y-6">
					{filteredPosts.map((post) => (
						<BlogPostCard key={post.slug} post={post} />
					))}
				</div>
			)}
		</div>
	);
}
