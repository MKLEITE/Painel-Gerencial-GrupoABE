import Image from 'next/image';
import Link from 'next/link';

/** Logo oficial do Grupo ABE — `apps/web/public/brand/GRUPOABE.png` */
export const LOGO_GRUPO_ABE = '/brand/GRUPOABE.png';

export function Logo({
  href = '/',
  className = '',
  height = 36,
  priority = false,
}: {
  href?: string | null;
  className?: string;
  /** Altura em px (largura proporcional). */
  height?: number;
  priority?: boolean;
}) {
  const content = (
    <span className={`group inline-flex items-center ${className}`}>
      <Image
        src={LOGO_GRUPO_ABE}
        alt="Grupo ABE"
        width={Math.round(height * 4.5)}
        height={height}
        priority={priority}
        className="w-auto object-contain object-left transition-transform duration-500 ease-spring group-hover:scale-[1.03]"
        style={{ height: `${height}px`, width: 'auto', maxWidth: 'min(220px, 55vw)' }}
      />
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="Painel Gerencial Grupo ABE">
        {content}
      </Link>
    );
  }
  return content;
}
