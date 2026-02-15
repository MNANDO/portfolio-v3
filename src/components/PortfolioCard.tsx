import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PortfolioItem } from '@/lib/mock-loaders';
import { formatDate } from '@/lib/utils';

interface Props {
	item: PortfolioItem;
}

export default function PortfolioCard({ item }: Props) {
	return (
		<a href={`/portfolio/${item.slug}`} className="group block">
			<Card className="overflow-hidden pt-0 transition-colors hover:border-ring hover:bg-accent/50">
				<div className="flex h-48 items-center justify-center bg-muted">
					<span className="text-sm text-muted-foreground">
						Project Preview
					</span>
				</div>
				<CardHeader>
					<CardDescription>
						<time dateTime={item.date}>
							{formatDate(new Date(item.date))}
						</time>
					</CardDescription>
					<CardTitle className="text-xl group-hover:text-primary transition-colors">
						{item.title}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground leading-relaxed">
						{item.description}
					</p>
				</CardContent>
				<CardFooter className="flex-wrap gap-2">
					{item.tags.map((tag) => (
						<Badge key={tag} variant="secondary">
							{tag}
						</Badge>
					))}
				</CardFooter>
			</Card>
		</a>
	);
}
