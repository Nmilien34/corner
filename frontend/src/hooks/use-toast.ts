import { toast as sonnerToast } from 'sonner';

type ToastOptions = {
  variant?: 'default' | 'destructive';
  title?: string;
  description?: string;
};

/**
 * Toast helper that uses sonner under the hood (avoids Radix Toast ref loop).
 * Same API as before: toast({ variant: 'destructive', title, description }).
 */
function toast(options: ToastOptions) {
  const { variant = 'default', title = '', description } = options;
  if (variant === 'destructive') {
    sonnerToast.error(title || 'Error', { description: description ?? undefined });
  } else {
    sonnerToast(title || undefined, { description: description ?? undefined });
  }
}

export { toast };
