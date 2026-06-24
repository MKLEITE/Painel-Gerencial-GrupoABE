import { LoginPageShell } from '@/components/login/login-page-shell';

/** Evita HTML estático com tema errado (tela “em branco” no login). */
export const dynamic = 'force-dynamic';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <LoginPageShell>{children}</LoginPageShell>;
}
