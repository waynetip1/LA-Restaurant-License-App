import { redirect } from 'next/navigation';

// Root path / redirects to /dashboard
export default function RootPage() {
  redirect('/dashboard');
}
