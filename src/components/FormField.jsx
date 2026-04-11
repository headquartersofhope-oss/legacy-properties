import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function FormField({ label, name, value, onChange, type = "text", options, placeholder, required, rows }) {
  const handleChange = (val) => onChange(name, val);

  if (type === "select") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{label}{required && ' *'}</Label>
        <Select value={value || ""} onValueChange={(v) => handleChange(v)}>
          <SelectTrigger><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
          <SelectContent>
            {options?.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{label}{required && ' *'}</Label>
        <Textarea value={value || ""} onChange={(e) => handleChange(e.target.value)} placeholder={placeholder} rows={rows || 3} />
      </div>
    );
  }

  if (type === "checkbox") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox checked={!!value} onCheckedChange={(v) => handleChange(v)} />
        <Label className="text-xs font-medium">{label}</Label>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}{required && ' *'}</Label>
      <Input type={type} value={value || ""} onChange={(e) => handleChange(e.target.value)} placeholder={placeholder} required={required} />
    </div>
  );
}