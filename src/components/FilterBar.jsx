import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FilterBar({ filters, onFilterChange, onClearAll, filterOptions }) {
  const hasActiveFilters = Object.values(filters).some(v => v !== null && v !== undefined && v !== '');

  return (
    <div className="space-y-3">
      {hasActiveFilters && (
        <div className="text-xs text-muted-foreground font-medium">
          Filters active ({Object.values(filters).filter(v => v !== null && v !== undefined && v !== '').length})
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <div key={option.key} className="flex items-center gap-1">
            <Select value={filters[option.key] || ""} onValueChange={(value) => onFilterChange(option.key, value || null)}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder={option.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All {option.label}</SelectItem>
                {option.values.map((val) => (
                  <SelectItem key={val.value} value={val.value}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearAll} className="h-8 text-xs">
            <X className="w-3 h-3 mr-1" /> Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}