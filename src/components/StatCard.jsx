export default function StatCard({ label, value, icon: Icon, color = "primary" }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      )}
      <div>
        <p className="text-2xl font-bold text-foreground">{value ?? 0}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}