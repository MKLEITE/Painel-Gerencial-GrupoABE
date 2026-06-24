import { LoginPageShell } from '@/components/login/login-page-shell';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <LoginPageShell>{children}</LoginPageShell>;
}
