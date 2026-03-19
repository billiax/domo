import type {
  DomoMessage,
  BackgroundBoundMessage,
  ContentBoundMessage,
  SidepanelBoundMessage
} from "../types/messages";

export function sendToBackground(msg: BackgroundBoundMessage): void {
  try {
    chrome.runtime.sendMessage(msg);
  } catch (err) {
    if (__DEV_MODE__) console.warn("[domo] message failed:", msg.type, err);
  }
}

export function sendToContent(msg: ContentBoundMessage): void;
export function sendToContent<R>(msg: ContentBoundMessage, callback: (response: R) => void): void;
export function sendToContent<R>(msg: ContentBoundMessage, callback?: (response: R) => void): void {
  const payload = { ...msg, target: "content" as const };
  try {
    if (callback) {
      (chrome.runtime.sendMessage as Function)(payload, callback);
    } else {
      chrome.runtime.sendMessage(payload);
    }
  } catch (err) {
    if (__DEV_MODE__) console.warn("[domo] message failed:", msg.type, err);
  }
}

export function sendToPanel(msg: SidepanelBoundMessage): void {
  try {
    chrome.runtime.sendMessage({ ...msg, target: "sidepanel" });
  } catch (err) {
    if (__DEV_MODE__) console.warn("[domo] message failed:", msg.type, err);
  }
}

export function onMessage<T extends DomoMessage["type"]>(
  type: T,
  handler: (msg: Extract<DomoMessage, { type: T }>) => void | unknown
): () => void {
  const listener = (msg: any): undefined => {
    if (msg.type === type) {
      handler(msg as Extract<DomoMessage, { type: T }>);
    }
    return undefined;
  };
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}
