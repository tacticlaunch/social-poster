// Telegram user type
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Telegram message type
export interface TelegramMessage {
  id: number;
  chat_id: number;
  date: number;
  text: string;
  chat_title: string;
  fromId?: number;
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
}

// Chat type
export interface TelegramChat {
  id: number;
  title: string;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  username?: string;
  accessHash?: string;
  is_forum?: boolean;
  forum_topics?: TelegramForumTopic[];
}

// Selected content for post creation
export interface SelectedContent {
  messages: TelegramMessage[];
  prompt: string;
  platform: 'telegram' | 'twitter' | 'both';
  language: string;
}

// Language option for post generation
export interface LanguageOption {
  code: string;
  name: string;
}

// User prompt template
export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  platform: 'telegram' | 'twitter' | 'both';
} 

export interface TelegramForumTopic {
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
}
