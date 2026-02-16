import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-arena-deep">
      <Sidebar />
      <main className="flex-1 ml-20">
        {children}
      </main>
    </div>
  );
}
