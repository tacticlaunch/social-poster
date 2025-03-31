# Social Poster

A web application for creating social media posts from Telegram messages. Easily select messages from your Telegram account, combine them with custom prompts, and generate formatted content for Telegram channels and Twitter.

## Features

- Direct Telegram integration using the MTProto API
- Browse and select messages from your Telegram chats
- Customize prompts for different social media platforms
- Multi-language support for post generation (Russian, English, Spanish, and more)
- Generate formatted content ready to be processed by ChatGPT
- Preview and copy output to clipboard

## Technical Stack

- **Frontend**: React with TypeScript
- **Styling**: TailwindCSS
- **Router**: React Router
- **Telegram API**: Client-side MTProto integration using `telegram` package
- **Build Tool**: Vite

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Telegram API credentials (API ID and API Hash)

### Getting Telegram API Credentials

1. Visit [https://my.telegram.org/](https://my.telegram.org/) and log in with your phone number
2. Go to "API development tools" and create a new application
3. Copy the **API ID** (a number) and **API Hash** (a string)
4. Create a `.env` file in the project root (copy from `.env.example`)
5. Add your credentials to the `.env` file:
   ```
   VITE_TELEGRAM_API_ID=your_api_id_here
   VITE_TELEGRAM_API_HASH=your_api_hash_here
   ```

### Steps to Run Locally

1. Clone the repository:
   ```
   git clone https://github.com/tacticlaunch/social-poster.git
   cd social-poster
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Telegram API credentials to the `.env` file

4. Start the development server:
   ```
   npm run dev
   ```

5. Open http://localhost:3000 in your browser

## How It Works

### Authentication Flow

1. User logs in with their phone number via the MTProto API
2. Authentication involves entering the verification code sent to the Telegram app
3. The session is stored locally and used for subsequent requests

### Message Selection

1. User browses through their chats from the Telegram API
2. Messages are fetched and displayed for the selected chat
3. User can select multiple messages to include in their post

### Post Creation

1. Selected messages are combined with a user-defined prompt
2. A preview is generated that can be copied to clipboard
3. The user can then paste this into ChatGPT for final formatting

## Security

- All Telegram API interactions happen directly in the browser
- No server component is required
- Credentials and session data are stored locally in the browser
- Messages are only accessed when explicitly requested by the user

## Project Structure

```
social-poster/
├── public/            # Static assets
├── src/
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── services/      # API and service functions
│   │   └── telegramService.ts  # Telegram MTProto implementation
│   ├── types/         # TypeScript type definitions
│   ├── App.tsx        # Main App component with routing
│   ├── main.tsx       # Application entry point
│   └── index.css      # Global styles and Tailwind imports
├── index.html         # HTML template
├── tsconfig.json      # TypeScript configuration
├── vite.config.ts     # Vite configuration
└── README.md          # Project documentation
```

## Development

### Building for Production

```
npm run build
```

This will generate optimized production files in the `dist` directory.

### Preview Production Build

```
npm run preview
```

## Future Enhancements

- Direct integration with ChatGPT API for post formatting
- Save and manage multiple drafts
- Direct posting to social media platforms
- Custom templates library
- Analytics for post performance

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Created with ❤️ by Alexey Elizarov