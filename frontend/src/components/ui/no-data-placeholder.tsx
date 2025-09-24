import { BarChart3 } from 'lucide-react';

export const NoDataPlaceholder = ({ message = "Not enough data to display" }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-muted/50 rounded-lg">
      <BarChart3 className="w-12 h-12 text-muted-foreground/50 mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};
