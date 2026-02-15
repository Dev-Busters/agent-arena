'use client';

export default function ProfilePage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
          <p className="text-slate-400">Manage your account settings</p>
        </div>
        
        {/* Placeholder */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
          <p className="text-slate-400">
            Profile settings, preferences, and account management will be available in Phase F
          </p>
        </div>
      </div>
    </div>
  );
}
