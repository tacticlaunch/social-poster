import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TelegramMessage, PromptTemplate, LanguageOption } from '../types';
import { isLoggedIn } from '@/services/telegramService';

// Mock prompt templates
const MOCK_TEMPLATES: PromptTemplate[] = [
  {
    id: 'default',
    name: 'Default Template',
    content: `Create a social media post using these messages:
\`\`\`
{{messages}}
\`\`\`

Use a professional tone, include emojis, and add relevant hashtags.`,
    platform: 'both'
  },
  {
    id: 'twitter',
    name: 'Twitter Optimized',
    content: `Create a Twitter post based on these messages:
\`\`\`
{{messages}}
\`\`\`

KEEP IT UNDER 280 CHARACTERS (you can make threads if needed), use 2-3 relevant hashtags, and ensure it is engaging.`,
    platform: 'twitter'
  },
  {
    id: 'telegram',
    name: 'Telegram Channel',
    content: `Create a Telegram channel post from these messages:
\`\`\`
{{messages}}
\`\`\`

Format it with proper paragraphs, use emojis, and add a strong call to action at the end.`,
    platform: 'telegram'
  }
];

// Language options
const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Russian' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
];

const PostEditor = () => {
  const navigate = useNavigate();
  const [selectedMessages, setSelectedMessages] = useState<TelegramMessage[]>([]);
  const [promptTemplates] = useState<PromptTemplate[]>(MOCK_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isUsingTemplate, setIsUsingTemplate] = useState<boolean>(true);
  const [finalOutput, setFinalOutput] = useState<string>('');
  const [outputGenerated, setOutputGenerated] = useState<boolean>(false);
  const [platform, setPlatform] = useState<'telegram' | 'twitter' | 'both'>('both');
  const [language, setLanguage] = useState<string>('en');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    (async () => {
    // Check if user is logged in
    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
      navigate('/login');
      return;
    }
    
    // Get selected messages from localStorage
    const messagesJson = localStorage.getItem('selected_messages');
    if (!messagesJson) {
      setError('No messages found');
      navigate('/messages');
      return;
    }
    
    try {
      const messages = JSON.parse(messagesJson);
      setSelectedMessages(messages);
      
      // Initialize custom prompt with default template
      const defaultTemplate = promptTemplates.find(t => t.id === 'default');
      if (defaultTemplate) {
        setCustomPrompt(defaultTemplate.content);
      }
    } catch (error) {
      console.error('Error parsing selected messages:', error);
      setError('Error parsing selected messages');
      navigate('/messages');
    }
    })()
  }, [navigate, promptTemplates]);
  
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = promptTemplates.find(t => t.id === templateId);
    if (template) {
      setCustomPrompt(template.content);
      setPlatform(template.platform);
    }
  };
  
  const handlePromptTypeChange = (useTemplate: boolean) => {
    setIsUsingTemplate(useTemplate);
    
    if (useTemplate) {
      const template = promptTemplates.find(t => t.id === selectedTemplate);
      if (template) {
        setCustomPrompt(template.content);
      }
    }
  };
  
  const generateOutput = () => {
    // Format the selected messages
    const formattedMessages = selectedMessages.map(message => {
      const date = new Date(message.date).toLocaleString();
      return `[${date}] ${message.user?.first_name}: ${message.text}`;
    }).join('\n\n');
    
    // Get language name for prompt
    const selectedLanguage = LANGUAGE_OPTIONS.find(l => l.code === language);
    const languageName = selectedLanguage ? selectedLanguage.name : 'English';
    
    // Generate the final output by replacing {{messages}} with the formatted messages
    let output = customPrompt.replace('{{messages}}', formattedMessages);
    
    // Add language instruction if custom prompt doesn't already mention it
    if (!output.toLowerCase().includes(languageName.toLowerCase())) {
      output = `Please respond in ${languageName}. ${output}`;
    }
    
    setFinalOutput(output);
    setOutputGenerated(true);
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(finalOutput)
      .then(() => {
        alert('Copied to clipboard!');
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
        alert('Failed to copy to clipboard. Please try again.');
      });
  };
  
  const removeMessage = (messageId: number) => {
    // Create a new array without the message to be removed
    const newSelectedMessages = selectedMessages.filter(msg => msg.id !== messageId);
    
    // If we're removing the last message, go back to selection
    if (newSelectedMessages.length === 0) {
      console.log('No messages left, going back to selection');
      navigate('/messages');
      return;
    }
    
    // Update the state with the new array
    setSelectedMessages(newSelectedMessages);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-white">Post Editor</h2>
        
        {error && (
          <div className="p-4 bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-md text-[#ff3b30]">
            {error}
          </div>
        )}
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Selected Messages */}
        <div className="w-1/2 bg-[#2f2f2f] shadow-md flex flex-col">
          <div className="p-4 border-b border-[#3f3f3f]">
            <h3 className="text-lg font-semibold mb-4 text-white">Selected Messages</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {selectedMessages.map(message => (
              <div key={message.id} className="p-3 border border-[#3f3f3f] rounded-md relative bg-[#1f1f1f] mb-4">
                <button 
                  className="absolute top-2 right-2 text-[#ff3b30] hover:text-opacity-80"
                  onClick={() => removeMessage(message.id)}
                >
                  ✕
                </button>
                <div className="pr-6">
                  <div className="flex justify-between">
                    <span className="font-medium text-white">{message.user?.first_name} {message.user?.last_name || ''}</span>
                    <span className="text-sm text-[#a8a8a8]">
                      {new Date(message.date).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-white">{message.text}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-[#3f3f3f]">
            <button
              className="text-sm text-[#007bff] hover:underline"
              onClick={() => navigate('/messages')}
            >
              ← Back to message selection
            </button>
          </div>
        </div>

        {/* Editor Section */}
        <div className="flex-1 flex flex-col bg-[#2f2f2f] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Post Editor</h2>
            <div className="flex items-center space-x-4">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="bg-[#1f1f1f] text-white px-3 py-1 rounded-md border border-[#3f3f3f] focus:outline-none focus:border-[#4f4f4f]"
              >
                <option value="telegram">Telegram</option>
                <option value="twitter">Twitter</option>
                <option value="both">Both</option>
              </select>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#1f1f1f] text-white px-3 py-1 rounded-md border border-[#3f3f3f] focus:outline-none focus:border-[#4f4f4f]"
              >
                {LANGUAGE_OPTIONS.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="mb-4">
              <div className="flex items-center space-x-4 mb-2">
                <label className="flex items-center space-x-2 text-white">
                  <input
                    type="radio"
                    checked={isUsingTemplate}
                    onChange={() => handlePromptTypeChange(true)}
                    className="text-[#2b5278] focus:ring-[#2b5278]"
                  />
                  <span>Use Template</span>
                </label>
                <label className="flex items-center space-x-2 text-white">
                  <input
                    type="radio"
                    checked={!isUsingTemplate}
                    onChange={() => handlePromptTypeChange(false)}
                    className="text-[#2b5278] focus:ring-[#2b5278]"
                  />
                  <span>Custom Prompt</span>
                </label>
              </div>

              {isUsingTemplate && (
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full bg-[#1f1f1f] text-white px-3 py-2 rounded-md border border-[#3f3f3f] focus:outline-none focus:border-[#4f4f4f]"
                >
                  <option value="">Select a template</option>
                  {promptTemplates
                    .filter(t => t.platform === platform || t.platform === 'both' || platform === 'both')
                    .map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                </select>
              )}

              <div className="mt-4">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full bg-[#1f1f1f] text-white px-3 py-2 rounded-md border border-[#3f3f3f] focus:outline-none focus:border-[#4f4f4f] resize-none"
                  rows={5}
                  placeholder="Enter your prompt here. Use {'{{messages}}'} where you want the selected messages to appear."
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-white">Generated Output</h3>
                <button
                  onClick={generateOutput}
                  disabled={!selectedTemplate && !customPrompt}
                  className="bg-[#2b5278] text-white px-4 py-2 rounded-md hover:bg-[#3f3f3f] transition-colors disabled:opacity-50"
                >
                  Generate
                </button>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="text-sm text-[#a8a8a8] mb-2">
                  Use {'{{messages}}'} in your prompt to indicate where the selected messages should be inserted. The selected language will be added to your prompt automatically.
                </div>
                <div className="flex-1 bg-[#1f1f1f] rounded-md p-4 overflow-auto">
                  {outputGenerated ? (
                    <>
                      <div className="text-white whitespace-pre-wrap">{finalOutput}</div>
                      <div className="flex justify-end mt-4">
                        <button
                          className="bg-[#2f2f2f] text-white px-4 py-2 rounded-md hover:bg-[#3f3f3f] transition-colors"
                          onClick={handleCopyToClipboard}
                        >
                          Copy to Clipboard
                        </button>
                      </div>
                      <div className="p-4 bg-[#2f2f2f] rounded-md mt-4">
                        <h3 className="font-medium mb-2 text-white">Next Steps:</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-[#a8a8a8]">
                          <li>Copy the generated prompt above</li>
                          <li>Paste it into ChatGPT or your preferred AI tool</li>
                          <li>Get your formatted post ready for publishing</li>
                          <li>Post to your preferred social media platform</li>
                        </ol>
                      </div>
                    </>
                  ) : (
                    <div className="text-[#808080]">
                      Generated content will appear here. Select a template or enter a custom prompt, then click Generate.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostEditor; 