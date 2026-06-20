// Centralized application state — single source of truth
// All modules import and mutate this object directly.
// For a larger app, consider a reactive store (Zustand-style).

export const state = {
  chats: [],
  activeChatId: null,
  messages: {},        // { [chatId]: Message[] }
  reactions: {},       // { [chatId]: { [msgId]: { [emoji]: count } } }
  unread: {},          // { [chatId]: number }
  chatMeta: {},        // { [chatId]: { pinned, archived, muted } }
  connected: false,
  filter: 'all',       // 'all' | 'unread' | 'groups'

  // Send state
  quotedMessage: null,
  pendingFile: null,   // { file: File, type: string }
  isRecording: false,
  mediaRecorder: null,
  audioChunks: [],

  // UI state
  reactionTarget: null,  // { msgId, chatId }
  contextTarget: null,   // Chat object under right-click
  _muteTarget: null,     // chatId pending mute duration selection
  _groupInfo: null,      // last loaded Group for open panel
};
