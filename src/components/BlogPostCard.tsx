import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BlogPost } from '@/lib/mock-loaders';
import { formatDate } from '@/lib/utils';

interface Props {
	post: BlogPost;
}

export default function BlogPostCard({ post }: Props) {
	return (
		<a href={`/blog/${post.slug}`} className="group block">
			<Card className="transition-colors hover:border-ring hover:bg-accent/50">
				<CardHeader>
					<CardDescription>
						<time dateTime={post.date}>
							{formatDate(new Date(post.date))}
						</time>
					</CardDescription>
					<CardTitle className="text-xl group-hover:text-primary transition-colors">
						{post.title}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground leading-relaxed">
						{post.description}
					</p>
				</CardContent>
				<CardFooter className="flex-wrap gap-2">
					{post.tags.map((tag) => (
						<Badge key={tag} variant="secondary">
							{tag}
						</Badge>
					))}
				</CardFooter>
			</Card>
		</a>
	);
}
