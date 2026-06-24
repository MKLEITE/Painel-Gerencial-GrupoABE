import { getUserInitials } from '@/lib/user-initials';

interface UserAvatarProps {
  nome: string;
  fotoUrl?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

const SIZE_CLASS = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-12 w-12 text-base',
} as const;

export function UserAvatar({ nome, fotoUrl, size = 'sm', className = '' }: UserAvatarProps) {
  const iniciais = getUserInitials(nome);
  const sizeClass = SIZE_CLASS[size];

  if (fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fotoUrl}
        alt={`Foto de ${nome}`}
        className={`shrink-0 rounded-full object-cover ring-1 ring-accent/30 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`bg-brand flex shrink-0 items-center justify-center rounded-full font-bold text-primary-foreground ring-1 ring-accent/30 ${sizeClass} ${className}`}
      aria-hidden
    >
      {iniciais}
    </div>
  );
}
