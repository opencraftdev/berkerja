export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold text-slate-950">Settings</h1>
      <p className="max-w-xl text-sm text-slate-500">
        Configure environment variables and authenticated access in your deployment environment. For local
        development, the header user id field can stand in for auth while Supabase credentials are being wired.
      </p>
    </div>
  );
}
