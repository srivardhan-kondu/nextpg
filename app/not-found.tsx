import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-6">
      <div className="max-w-md text-center">
        <p className="text-5xl font-bold text-primary">404</p>
        <h1 className="mt-3 text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you are looking for doesn&apos;t exist or has moved.
        </p>
        <Button asChild className="mt-5"><Link href="/">Back to home</Link></Button>
      </div>
    </main>
  );
}
