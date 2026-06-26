import { BrandLogoCarousel } from '@/components/ui/brand-logo-carousel';

interface LoadingScreenProps {
  message: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <BrandLogoCarousel size={56} />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </main>
  );
}
