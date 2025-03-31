import { Api, TelegramClient } from 'telegram';
import BigInteger from 'big-integer';
import { Semaphore } from 'await-semaphore';
import { StringSession } from 'telegram/sessions';

import { TelegramMessage, TelegramUser } from '@/types';

let client: TelegramClient | null = null;
let codeResolver: ((code: string) => void) | null = null;
let passwordResolver: ((password: string) => void) | null = null;

const getApiCredentials = () => {
  const apiId = localStorage.getItem('telegram_api_id');
  const apiHash = localStorage.getItem('telegram_api_hash');

  if (!apiId || !apiHash) {
    throw new Error('API credentials not found. Please set them in Settings.');
  }

  return {
    apiId: parseInt(apiId, 10),
    apiHash,
  };
};

export const initializeClient = async () => {
  if (client) {
    return client;
  }

  const session = new StringSession(localStorage.getItem('telegram_session') || '');
  const { apiId, apiHash } = getApiCredentials();

  client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();

  if (!await client.isUserAuthorized()) {
    throw new Error('User is not authorized');
  }

  return client;
};

export type LoginCallbacks = {
  onCodeRequired: () => void;
  onPasswordRequired: () => void;
  onError: (error: Error) => void;
  onSuccess: () => void;
};

export const loginTelegram = async (
  phoneNumber: string,
  callbacks: LoginCallbacks
) => {
  const { apiId, apiHash } = getApiCredentials();
  const session = new StringSession();
  
  if (client) {
    await client.disconnect();
    client = null;
  }

  client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.connect();

  try {
    await client.start({
      phoneNumber: async () => phoneNumber,
      phoneCode: async () => {
        callbacks.onCodeRequired();
        return new Promise<string>((resolve) => {
          codeResolver = resolve;
        });
      },
      password: async () => {
        callbacks.onPasswordRequired();
        return new Promise<string>((resolve) => {
          passwordResolver = resolve;
        });
      },
      onError: (err) => {
        callbacks.onError(err instanceof Error ? err : new Error(String(err)));
      },
    });

    localStorage.setItem('telegram_session', session.save());
    callbacks.onSuccess();
  } catch (error) {
    console.error('Login error:', error);
    callbacks.onError(error instanceof Error ? error : new Error('Login failed'));
    throw error;
  }
};

export const submitCode = (code: string) => {
  if (codeResolver) {
    codeResolver(code);
    codeResolver = null;
  } else {
    throw new Error('No active code request');
  }
};

export const submitPassword = (password: string) => {
  if (passwordResolver) {
    passwordResolver(password);
    passwordResolver = null;
  } else {
    throw new Error('No active password request');
  }
};

export const getCurrentUser = async (): Promise<TelegramUser | null> => {
  try {
    const client = await initializeClient();
    const me = await client.getMe();
    
    if (!me || typeof me !== 'object') {
      return null;
    }

    return {
      id: Number(me.id),
      first_name: me.firstName || '',
      last_name: me.lastName || '',
      username: me.username || '',
      photo_url: '', // We'll skip photo for now as it requires additional processing
      auth_date: Math.floor(Date.now() / 1000),
      hash: '', // Not applicable for direct client
    };
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

export const isLoggedIn = async () => {
  try {
    const client = await initializeClient();
    return await client.isUserAuthorized();
  } catch {
    return false;
  }
};

export const getChats = async () => {
  const client = await initializeClient();
  const result = await client.getDialogs();
  return result.map(dialog => ({
    id: dialog.id,
    title: dialog.title,
    unreadCount: dialog.unreadCount,
    lastMessage: dialog.message?.message,
    lastMessageDate: dialog.message?.date,
  }));
};

export const getMessages = async (chatId: number, limit: number = 50) => {
  const client = await initializeClient();
  const messages = await client.getMessages(chatId, {
    limit,
    reverse: true,
  });

  return messages.map(msg => {
    const sender = msg.sender;
    const chat = msg.chat;
    
    return {
      id: msg.id,
      chat_id: chatId,
      text: msg.message || '',
      date: msg.date,
      chat_title: chat instanceof Api.Chat ? chat.title : '',
      fromId: sender ? Number(sender.id) : undefined,
      user: sender instanceof Api.User ? {
        id: Number(sender.id),
        first_name: sender.firstName || '',
        last_name: sender.lastName || '',
        username: sender.username || '',
      } : undefined,
    } as TelegramMessage;
  });
};

export const logout = async () => {
  if (client) {
    await client.disconnect();
    client = null;
  }
  localStorage.removeItem('telegram_session');
};

// Get Telegram client (initialize if needed)
const semaphore = new Semaphore(1);
export const getTelegramClient = async (): Promise<TelegramClient> => {
  const release = await semaphore.acquire();
  try {
    // If client exists, return it
    if (client) return client;
    // Initialize with saved session or create new
    return await initializeClient();
  } finally {
    release();
  }
};

// Add function to get forum topics
export const getForumTopics = async (chatId: number): Promise<Array<{
  id: number;
  title: string;
  icon_color: number;
  icon_emoji_id?: string;
  top_message: number;
  message_thread_id: number;
  messages_count: number;
  views_count: number;
  creation_date: number;
  creator_id: number;
  is_pinned: boolean;
  is_closed: boolean;
  is_hidden: boolean;
}>> => {
  try {
    const client = await getTelegramClient();
    const result = await client.invoke(new Api.channels.GetForumTopics({
      channel: chatId,
      offsetDate: 0,
      offsetId: 0,
      offsetTopic: 0,
      limit: 100
    }));

    if (!result || typeof result !== 'object' || !('topics' in result)) {
      return [];
    }

    const topics = result.topics as unknown as Array<{
      id: number;
      title: string;
      iconColor: number;
      iconEmojiId?: string;
      topMessage: number;
      messageThreadId: number;
      messagesCount: number;
      viewsCount: number;
      creationDate: number;
      creatorId: number;
      isPinned: boolean;
      isClosed: boolean;
      isHidden: boolean;
    }>;

    return topics.map(topic => ({
      id: Number(topic.id),
      title: topic.title,
      icon_color: topic.iconColor,
      icon_emoji_id: topic.iconEmojiId,
      top_message: Number(topic.topMessage),
      message_thread_id: Number(topic.messageThreadId),
      messages_count: topic.messagesCount,
      views_count: topic.viewsCount,
      creation_date: topic.creationDate,
      creator_id: Number(topic.creatorId),
      is_pinned: topic.isPinned,
      is_closed: topic.isClosed,
      is_hidden: topic.isHidden
    }));
  } catch (error) {
    console.error(`Failed to get forum topics for chat ${chatId}:`, error);
    return [];
  }
};

// Update getUserChats to include forum topics
export const getUserChats = async (): Promise<Array<{
  id: number;
  title: string;
  username?: string;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  is_forum?: boolean;
  forum_topics?: Array<{
    id: number;
    title: string;
    icon_color: number;
    icon_emoji_id?: string;
    top_message: number;
    message_thread_id: number;
    messages_count: number;
    views_count: number;
    creation_date: number;
    creator_id: number;
    is_pinned: boolean;
    is_closed: boolean;
    is_hidden: boolean;
  }>;
}>> => {
  try {
    const client = await getTelegramClient();
    const result = await client.getDialogs({
      // limit: 400
    });
    
    const chats = await Promise.all(result.map(async (dialog) => {
      const chat = dialog.entity;
      if (!chat) {
        return null;
      }

      const chatInfo: {
        id: number;
        title: string;
        username?: string;
        type: 'private' | 'group' | 'supergroup' | 'channel';
        is_forum?: boolean;
        accessHash?: string;
        forum_topics?: Array<{
          id: number;
          title: string;
          icon_color: number;
          icon_emoji_id?: string;
          top_message: number;
          message_thread_id: number;
          messages_count: number;
          views_count: number;
          creation_date: number;
          creator_id: number;
          is_pinned: boolean;
          is_closed: boolean;
          is_hidden: boolean;
        }>;
      } = {
        id: Number(chat.id),
        title: 'title' in chat ? String(chat.title) : ('firstName' in chat ? String(chat.firstName) + ' ' + (chat.lastName ? String(chat.lastName) : '') : 'Unknown Chat'),
        type: chat.className.toLowerCase() as 'private' | 'group' | 'supergroup' | 'channel',
        username: 'username' in chat ? chat.username ? String(chat.username) : undefined : undefined,
        accessHash: 'accessHash' in chat ? String(chat.accessHash) : undefined,
      };

      // Check if this is a forum channel and get its topics
      if (chat.className === 'Channel' && 'forum' in chat && chat.forum) {
        chatInfo.is_forum = true;
        chatInfo.forum_topics = await getForumTopics(Number(chat.id));
      }

      return chatInfo;
    }));

    return chats.filter((chat): chat is NonNullable<typeof chat> => chat !== null);
  } catch (error) {
    console.error('Failed to get chats:', error);
    return [];
  }
};

function buildApiMessage(message: any): TelegramMessage | null {
  if (!message || !('message' in message)) return null;
  
  return {
    id: message.id,
    chat_id: message.peerId,
    chat_title: message.chat?.title || '',
    date: message.date,
    fromId: message.fromId.userId,
    text: message.message,
  };
}

function buildApiUser(user: any): any | null {
  if (!user || !('id' in user)) return null;
  
  return {
    id: user.id,
    first_name: user.firstName || '',
    last_name: user.lastName || '',
    username: user.username || '',
  };
}

function buildApiChatFromPreview(chat: any): any | null {
  if (!chat || !('id' in chat)) return null;
  
  return {
    id: chat.id,
    title: chat.title || '',
    type: chat.className,
    username: chat.username || '',
  };
}

export async function getChatMessages({
  chat,
  threadId,
  offsetId,
  isSavedDialog,
  limit = 50,
  addOffset = 0,
}: {
  chat: { id: number; accessHash: string };
  threadId?: number;
  offsetId?: number;
  isSavedDialog?: boolean;
  limit?: number;
  addOffset?: number;
}): Promise<{
  messages: TelegramMessage[];
  users: any[];
  chats: any[];
  count?: number;
} | undefined> {
  const client = await getTelegramClient();
  if (!client) {
    throw new Error('Telegram client is not initialized');
  }

  const RequestClass = threadId === undefined
    ? Api.messages.GetHistory
    : isSavedDialog
      ? Api.messages.GetSavedHistory
      : Api.messages.GetReplies;

  let result;
  try {
    result = await client.invoke(new RequestClass({
      peer: new Api.InputPeerChannel({
        channelId: BigInteger(chat.id),
        accessHash: BigInteger(chat.accessHash),
      }),
      ...(threadId !== undefined && !isSavedDialog && {
        msgId: threadId,
      }),
      ...(offsetId && {
        offsetId: Math.min(offsetId, 2147483647),
      }),
      limit,
      addOffset,
    }));
  } catch (err: any) {
    if (err.errorMessage === 'CHANNEL_PRIVATE') {
      // Handle private channel error
      return undefined;
    }
    throw err;
  }

  if (
    !result
    || result instanceof Api.messages.MessagesNotModified
    || !result.messages
  ) {
    return undefined;
  }

  const messages = result.messages.map(buildApiMessage).filter((msg): msg is TelegramMessage => msg !== null);
  const users = result.users.map(buildApiUser).filter((user): user is any => user !== null);
  const chats = result.chats.map(buildApiChatFromPreview).filter((chat): chat is any => chat !== null);
  const count = !(result instanceof Api.messages.Messages) ? result.count : undefined;

  return {
    messages,
    users,
    chats,
    count,
  };
} 