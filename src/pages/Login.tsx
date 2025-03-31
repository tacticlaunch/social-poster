import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginTelegram, submitCode, submitPassword } from '@/services/telegramService';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'api' | 'phone' | 'code' | 'password'>('api');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [apiId, setApiId] = useState(import.meta.env.VITE_TELEGRAM_API_ID || '');
  const [apiHash, setApiHash] = useState(import.meta.env.VITE_TELEGRAM_API_HASH || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if API credentials are already set
    const savedApiId = localStorage.getItem('telegram_api_id');
    const savedApiHash = localStorage.getItem('telegram_api_hash');
    if (savedApiId && savedApiHash) {
      setStep('phone');
    } else {
      setStep('api');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      switch (step) {
        case 'api':
          if (!apiId || !apiHash) {
            toast.error('Please fill in both API ID and API Hash');
            return;
          }
          localStorage.setItem('telegram_api_id', apiId);
          localStorage.setItem('telegram_api_hash', apiHash);
          setStep('phone');
          setLoading(false);
          break;

        case 'phone':
          if (!phoneNumber) {
            toast.error('Please enter your phone number');
            return;
          }
          await loginTelegram(phoneNumber, {
            onCodeRequired: () => {
              setStep('code');
              setLoading(false);
            },
            onPasswordRequired: () => {
              setStep('password');
              setLoading(false);
            },
            onError: (error) => {
              toast.error(error.message);
              setLoading(false);
            },
            onSuccess: () => navigate('/messages'),
          });
          break;

        case 'code':
          if (!code) {
            toast.error('Please enter the verification code');
            return;
          }
          try {
            await submitCode(code);
            setLoading(false);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to submit code');
          }
          break;

        case 'password':
          if (!password) {
            toast.error('Please enter your password');
            return;
          }
          try {
            await submitPassword(password);
            setLoading(false);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to submit password');
          }
          break;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-[#2f2f2f] rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-white text-center">
          {step === 'api' ? 'Enter API Credentials' : 'Login to Telegram'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'api' && (
            <div className="space-y-4">
              <div className="text-sm text-[#a8a8a8] space-y-2">
                <p>To get your API credentials:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://my.telegram.org/auth" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">my.telegram.org</a></li>
                  <li>Log in with your phone number</li>
                  <li>Click on "API development tools"</li>
                  <li>Create a new application</li>
                  <li>Copy the "api_id" and "api_hash" values</li>
                </ol>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">API ID</label>
                  <input
                    type="text"
                    value={apiId}
                    onChange={(e) => setApiId(e.target.value)}
                    className="w-full p-2 bg-[#2f2f2f] border border-[#3f3f3f] rounded-md text-white focus:outline-none focus:border-[#4f4f4f]"
                    placeholder="Enter your API ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">API Hash</label>
                  <input
                    type="text"
                    value={apiHash}
                    onChange={(e) => setApiHash(e.target.value)}
                    className="w-full p-2 bg-[#2f2f2f] border border-[#3f3f3f] rounded-md text-white focus:outline-none focus:border-[#4f4f4f]"
                    placeholder="Enter your API Hash"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'phone' && (
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                className="w-full p-2 bg-[#1f1f1f] border border-[#3f3f3f] rounded-md text-white focus:outline-none focus:border-[#4f4f4f]"
                placeholder="+1234567890"
                required
              />
            </div>
          )}

          {step === 'code' && (
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
                className="w-full p-2 bg-[#1f1f1f] border border-[#3f3f3f] rounded-md text-white focus:outline-none focus:border-[#4f4f4f]"
                placeholder="Enter the code"
                required
              />
            </div>
          )}

          {step === 'password' && (
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="w-full p-2 bg-[#1f1f1f] border border-[#3f3f3f] rounded-md text-white focus:outline-none focus:border-[#4f4f4f]"
                placeholder="Enter your password"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-[#1d4ed8] text-white rounded-md hover:bg-[#1e40af] transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : step === 'api' ? 'Continue' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 