const STORAGE_KEY = 'corner:chatFont';

const FONT_STACKS: Record<ChatFont, string> = {
  default: "'Geist', 'Geist Variable', ui-sans-serif, system-ui, sans-serif",
  sans: "ui-sans-serif, system-ui, 'Segoe UI', sans-serif",
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif",
  dyslexic: "'Lexend', ui-sans-serif, sans-serif",
};

export type ChatFont = 'default' | 'sans' | 'system' | 'dyslexic';

export function getChatFont(): ChatFont {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'default' || v === 'sans' || v === 'system' || v === 'dyslexic') return v;
  } catch {}
  return 'default';
}

export function setChatFont(value: ChatFont): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {}
  applyChatFont();
}

export function applyChatFont(): void {
  if (typeof document === 'undefined') return;
  const font = getChatFont();
  const stack = FONT_STACKS[font];
  document.documentElement.style.setProperty('--chat-font-family', stack);
}
