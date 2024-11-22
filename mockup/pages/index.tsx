import Link from 'next/link';

export default function Home() {
  const pages = [
    { name: 'Overview', path: '/dashboard/overview' },
    { name: 'Applications', path: '/dashboard/applications' },
    { name: 'Deployments', path: '/dashboard/deployments' },
    { name: 'Monitoring', path: '/dashboard/monitoring' },
    { name: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">NodeRoll Dashboard Mockups</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <Link 
            key={page.path} 
            href={page.path}
            className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-2xl font-semibold text-primary">{page.name}</h2>
            <p className="mt-2 text-muted-foreground">View {page.name.toLowerCase()} mockup</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
