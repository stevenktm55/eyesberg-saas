import { redirect } from 'next/navigation';

export default function Home() {
  // Rediriger vers l'admin par défaut
  // L'app utilise un système de sous-domaines, donc cette page ne devrait normalement pas être accessible
  // Mais on redirige vers /admin pour éviter la page Next.js par défaut
  redirect('/admin');
}
