import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ background: '#06060b' }}>
      <Sidebar />
      <main className="flex-1" style={{ marginLeft: 60 }}>
        {children}
      </main>
    </div>
  );
}
