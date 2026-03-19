// Build-time constant injected by esbuild (true in watch mode, false in production build)
declare const __DEV_MODE__: boolean;

// Navigation API (Chrome 105+)
// Minimal typings for the features we use
interface NavigationEventMap {
  navigatesuccess: Event;
  navigateerror: Event;
  navigate: Event;
  currententrychange: Event;
}

interface Navigation extends EventTarget {
  addEventListener<K extends keyof NavigationEventMap>(
    type: K,
    listener: (ev: NavigationEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof NavigationEventMap>(
    type: K,
    listener: (ev: NavigationEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
}

declare const navigation: Navigation | undefined;

// Window augmentation for __domo_rules__
interface Window {
  __domo_rules__?: Record<string, AbortController>;
}
