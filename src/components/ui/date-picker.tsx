"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
	value: string; // ISO date string YYYY-MM-DD or ""
	onChange: (value: string) => void;
	placeholder?: string;
	required?: boolean;
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", required }: DatePickerProps) {
	const [open, setOpen] = useState(false);

	const selected = value ? parseISO(value) : undefined;

	const handleSelect = (date: Date | undefined) => {
		onChange(date ? format(date, "yyyy-MM-dd") : "");
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"w-full justify-start text-left font-normal",
						!selected && "text-muted-foreground",
					)}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{selected ? format(selected, "PPP") : placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={selected}
					onSelect={handleSelect}
					initialFocus
				/>
				{!required && selected && (
					<div className="border-t border-border p-2">
						<Button
							variant="ghost"
							size="sm"
							className="w-full"
							onClick={() => handleSelect(undefined)}
						>
							Clear
						</Button>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
