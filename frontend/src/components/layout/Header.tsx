import { useLocation } from 'react-router-dom';

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/map': 'World Map',
  '/places': 'My Places',
};

export default function Header() {
  const { pathname } = useLocation();
  const base = '/' + pathname.split('/')[1];
  const title = titles[base] ?? 'Travel Intelligence';

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
    </header>
  );
}
