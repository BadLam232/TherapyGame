const FALLBACK_URL = 'https://t.me';

type TelegramWebAppRuntime = {
  ready: () => void;
  expand: () => void;
  openTelegramLink?: (url: string) => void;
  HapticFeedback?: {
    impactOccurred?: (style: 'light' | 'medium' | 'heavy') => void;
    notificationOccurred?: (type: 'error' | 'success' | 'warning') => void;
  };
};

export function getTelegramWebApp(): TelegramWebAppRuntime | null {
  return (window as Window & { Telegram?: { WebApp?: TelegramWebAppRuntime } }).Telegram?.WebApp ?? null;
}

export function initTelegramWebApp(): void {
  const tg = getTelegramWebApp();
  if (!tg) {
    return;
  }

  try {
    tg.ready();
    tg.expand();
  } catch {
    // Ignore unavailable Telegram APIs in browser preview.
  }
}

export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  const tg = getTelegramWebApp();
  try {
    tg?.HapticFeedback?.impactOccurred(style);
  } catch {
    // Haptics may not exist outside Telegram mobile app.
  }
}

export function hapticNotify(type: 'error' | 'success' | 'warning' = 'success'): void {
  const tg = getTelegramWebApp();
  try {
    tg?.HapticFeedback?.notificationOccurred(type);
  } catch {
    // Ignore if unsupported.
  }
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function shareResultText(text: string): Promise<'shared' | 'copied' | 'none'> {
  const tg = getTelegramWebApp();
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(FALLBACK_URL)}&text=${encodeURIComponent(text)}`;

  if (tg?.openTelegramLink) {
    try {
      tg.openTelegramLink(shareUrl);
      return 'shared';
    } catch {
      // Continue with fallbacks.
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch {
      // User may cancel native share sheet.
    }
  }

  if (await copyToClipboard(text)) {
    return 'copied';
  }

  return 'none';
}
