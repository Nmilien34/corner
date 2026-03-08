import { Toaster as SonnerToaster } from 'sonner';

// Sonner Toaster (replaced Radix Toast to fix "Maximum update depth exceeded").
export function Toaster() {
  return (
    <SonnerToaster
      richColors
      position="bottom-right"
      toastOptions={{ style: { border: '1px solid var(--border)' } }}
    />
  );
}
