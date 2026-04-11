import { ShieldOff } from "lucide-react";

export default function AccessDenied({ message = "You do not have permission to access this section." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <ShieldOff className="w-7 h-7 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Access Restricted</h2>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
    </div>
  );
}