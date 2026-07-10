import Dashboard from './components/Dashboard';

export const metadata = {
  title: 'Linux Observatory - System Performance Dashboard',
  description: 'Real-time resource performance logging, alert thresholds and analytics dashboard.',
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-zinc-950">
      <Dashboard />
    </main>
  );
}
