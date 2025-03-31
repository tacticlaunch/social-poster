import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Settings() {
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedApiId = localStorage.getItem('telegram_api_id');
    const savedApiHash = localStorage.getItem('telegram_api_hash');
    if (savedApiId && savedApiHash) {
      setApiId(savedApiId);
      setApiHash(savedApiHash);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiId || !apiHash) {
      toast.error('Please fill in both API ID and API Hash');
      return;
    }

    localStorage.setItem('telegram_api_id', apiId);
    localStorage.setItem('telegram_api_hash', apiHash);
    setIsOpen(false);
    toast.success('API credentials saved successfully');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="text-[#a8a8a8] hover:text-white px-3 py-2 rounded-md text-sm font-medium">
          Settings
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[#2f2f2f] border-[#3f3f3f]">
        <DialogHeader>
          <DialogTitle className="text-white">API Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiId" className="text-white">Telegram API ID</Label>
            <Input
              id="apiId"
              type="text"
              value={apiId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiId(e.target.value)}
              className="bg-[#1f1f1f] border-[#3f3f3f] text-white"
              placeholder="Enter your API ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiHash" className="text-white">Telegram API Hash</Label>
            <Input
              id="apiHash"
              type="text"
              value={apiHash}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiHash(e.target.value)}
              className="bg-[#1f1f1f] border-[#3f3f3f] text-white"
              placeholder="Enter your API Hash"
            />
          </div>
          <Button type="submit" className="w-full bg-[#2b5278] hover:bg-[#3f3f3f]">
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 