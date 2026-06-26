import { redirect } from 'next/navigation';

/** Raiz do app → login (sem landing page). */
export default function HomePage() {
  redirect('/login');
}
