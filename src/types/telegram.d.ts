interface TelegramHapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  selectionChanged(): void;
}

interface TelegramWebApp {
  ready(): void;
  expand(): void;
  openTelegramLink(url: string): void;
  HapticFeedback?: TelegramHapticFeedback;
}

interface TelegramContainer {
  WebApp?: TelegramWebApp;
}

declare global {
  interface Window {
    Telegram?: TelegramContainer;
  }
}

export {};
