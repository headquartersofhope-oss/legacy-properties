export default function PremiumPageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-1 w-12 bg-gradient-to-r from-primary to-secondary rounded-full" />
            <h1 className="text-3xl font-bold text-heading">{title}</h1>
          </div>
          {subtitle && <p className="text-sm text-body-text">{subtitle}</p>}
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}