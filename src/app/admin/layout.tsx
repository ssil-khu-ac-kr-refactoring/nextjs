import Link from 'next/link';

const adminPages = [
  { name: 'Home', path: '/admin/home' },
  { name: 'About', path: '/admin/about' },
  { name: 'Research', path: '/admin/research' },
  { name: 'News', path: '/admin/news' },
  { name: 'People', path: '/admin/people' },
  { name: 'Contact', path: '/admin/contact' },
  { name: 'Publication', path: '/admin/publications' },
  { name: 'Tab Management', path: '/admin/board/tabs' },
  { name: 'Post Management', path: '/admin/board/posts' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 shrink-0 bg-zinc-900 text-zinc-100 flex flex-col justify-between border-r border-border">
        <div>
          <div className="p-5 text-xl font-bold tracking-tight">Admin Panel</div>
          <nav>
            <ul>
              {adminPages.map((page) => (
                <li key={page.name}>
                  <Link
                    href={page.path}
                    className="block px-5 py-3 text-sm hover:bg-zinc-800 transition-colors"
                  >
                    {page.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <Link
            href="/"
            className="block w-full text-center bg-zinc-800 hover:bg-zinc-700 rounded-xl py-2 text-sm transition-colors"
          >
            main page
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
