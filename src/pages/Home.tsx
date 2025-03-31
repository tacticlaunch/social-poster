import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { isLoggedIn } from '@/services/telegramService';

const Home = () => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const loggedIn = await isLoggedIn();
      setIsUserLoggedIn(loggedIn);
    })();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Create Social Media Posts from Telegram Messages</h1>
        <p className="text-xl text-muted-foreground">
          Select messages from your Telegram account, customize, and generate ready-to-post content for Twitter and Telegram channels.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-3">How It Works</h2>
          <ol className="list-decimal list-inside space-y-3 text-card-foreground">
            <li>Login with your Telegram account</li>
            <li>Browse and select messages from your chats</li>
            <li>Customize your prompt and formatting</li>
            <li>Generate and copy your post content</li>
            <li>Paste into ChatGPT for final formatting</li>
          </ol>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-3">Features</h2>
          <ul className="list-disc list-inside space-y-3 text-card-foreground">
            <li>Secure Telegram authentication</li>
            <li>Easy message selection interface</li>
            <li>Customizable prompts and templates</li>
            <li>Preview before finalizing</li>
            <li>Format for Twitter or Telegram channels</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-center">
        {isUserLoggedIn ? (
          <Link to="/messages" className="px-6 py-3 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-opacity-90 transition-colors">
            Select Messages
          </Link>
        ) : (
          <Link to="/login" className="px-6 py-3 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-opacity-90 transition-colors">
            Get Started
          </Link>
        )}
      </div>
    </div>
  );
};

export default Home; 