const STORAGE_KEY = 'corner:theme';

export type Theme = 'light' | 'auto' | 'dark';

export function getTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'auto' || v === 'dark') return v;
  } catch {}
  return 'auto';
}

export function setTheme(value: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {}
  applyTheme();
}

function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(): void {
  if (typeof document === 'undefined') return;
  const theme = getTheme();
  const useDark = theme === 'dark' || (theme === 'auto' && prefersDark());
  document.documentElement.classList.toggle('dark', useDark);
  document.documentElement.style.colorScheme = useDark ? 'dark' : 'light';
}

/** Call once in app to react to system theme changes when theme is "auto". */
export function subscribeToSystemTheme(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = () => {
    if (getTheme() === 'auto') callback();
  };
  mq.addEventListener('change', listener);
  return () => mq.removeEventListener('change', listener);
}
