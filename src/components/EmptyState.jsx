import { Button } from '@/components/ui/button';
import { Plus, Inbox } from 'lucide-react';

const defaultIcon = Inbox;

export default function EmptyState({ 
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'default'
}) {
  const Icon = icon || defaultIcon;
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-muted/50 mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs text-center mb-6">
        {description}
      </p>
      {onAction && (
        <Button 
          onClick={onAction}
          variant={actionVariant}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}