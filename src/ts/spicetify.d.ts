// Minimal typings for the parts of the Spicetify API this theme uses.
// Extend as modules are added, or swap for the official globals.d.ts from spicetify/cli.
interface SpicetifyPlayer {
  data?: { item?: { metadata?: Record<string, string> } };
  addEventListener(type: "songchange" | "onprogress" | "onplaypause", cb: (e?: unknown) => void): void;
}

interface Window {
  Spicetify?: {
    Player?: SpicetifyPlayer;
    Platform?: { version?: string; History?: { listen(cb: (loc: { pathname: string }) => void): () => void } };
    showNotification?: (text: string, isError?: boolean) => void;
    Topbar?: { Button: new (label: string, iconSvg: string, onClick: () => void) => unknown };

  };
}
