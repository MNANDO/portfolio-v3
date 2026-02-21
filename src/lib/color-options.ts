export type ColorOption = {
	key: string;
	label: string;
	iconClassName: string;
	value: string | null;
};

export const TEXT_COLORS: ColorOption[] = [
	{
		key: 'default',
		label: 'Default',
		iconClassName: 'text-foreground',
		value: null,
	},
	{
		key: 'gray',
		label: 'Gray',
		iconClassName: 'text-muted-foreground',
		value: '#6b7280',
	},
	{
		key: 'brown',
		label: 'Brown',
		iconClassName: 'text-amber-800 dark:text-amber-600',
		value: '#92400e',
	},
	{
		key: 'red',
		label: 'Red',
		iconClassName: 'text-red-500',
		value: '#ef4444',
	},
	{
		key: 'orange',
		label: 'Orange',
		iconClassName: 'text-orange-500',
		value: '#f97316',
	},
	{
		key: 'yellow',
		label: 'Yellow',
		iconClassName: 'text-yellow-500',
		value: '#eab308',
	},
	{
		key: 'green',
		label: 'Green',
		iconClassName: 'text-green-500',
		value: '#22c55e',
	},
	{
		key: 'blue',
		label: 'Blue',
		iconClassName: 'text-blue-500',
		value: '#3b82f6',
	},
	{
		key: 'purple',
		label: 'Purple',
		iconClassName: 'text-purple-500',
		value: '#a855f7',
	},
	{
		key: 'pink',
		label: 'Pink',
		iconClassName: 'text-pink-500',
		value: '#ec4899',
	},
];

export const BACKGROUND_COLORS: ColorOption[] = [
	{
		key: 'default',
		label: 'Default',
		iconClassName: 'rounded-xs bg-foreground/10 text-foreground',
		value: null,
	},
	{
		key: 'gray',
		label: 'Gray',
		iconClassName: 'rounded-xs bg-muted-foreground/20 text-muted-foreground',
		value: 'rgba(107, 114, 128, 0.35)',
	},
	{
		key: 'brown',
		label: 'Brown',
		iconClassName:
			'rounded-xs bg-amber-500/20 text-amber-800 dark:text-amber-600',
		value: 'rgba(245, 158, 11, 0.35)',
	},
	{
		key: 'red',
		label: 'Red',
		iconClassName: 'rounded-xs bg-red-500/20 text-red-500',
		value: 'rgba(239, 68, 68, 0.35)',
	},
	{
		key: 'orange',
		label: 'Orange',
		iconClassName: 'rounded-xs bg-orange-500/20 text-orange-500',
		value: 'rgba(249, 115, 22, 0.35)',
	},
	{
		key: 'yellow',
		label: 'Yellow',
		iconClassName: 'rounded-xs bg-yellow-500/20 text-yellow-500',
		value: 'rgba(234, 179, 8, 0.35)',
	},
	{
		key: 'green',
		label: 'Green',
		iconClassName: 'rounded-xs bg-green-500/20 text-green-500',
		value: 'rgba(34, 197, 94, 0.35)',
	},
	{
		key: 'blue',
		label: 'Blue',
		iconClassName: 'rounded-xs bg-blue-500/20 text-blue-500',
		value: 'rgba(59, 130, 246, 0.35)',
	},
	{
		key: 'purple',
		label: 'Purple',
		iconClassName: 'rounded-xs bg-purple-500/20 text-purple-500',
		value: 'rgba(168, 85, 247, 0.35)',
	},
	{
		key: 'pink',
		label: 'Pink',
		iconClassName: 'rounded-xs bg-pink-500/20 text-pink-500',
		value: 'rgba(236, 72, 153, 0.35)',
	},
];
