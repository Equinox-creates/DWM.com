import React, { useState, useEffect } from 'react';
import { LogOut, Shield, Loader2, Trash2, Copy, Plus, Hash, MessageSquare } from 'lucide-react';
import { toast } from '../utils/toast';
import { playButtonSound, playDeleteSound } from '../utils/sounds';

interface DiscordWebhook {
  id: string;
  name: string;
  channel_id: string;
  guild_id: string;
  url: string;
  avatar?: string;
}

export const AccountPanel: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [webhooks, setWebhooks] = useState<DiscordWebhook[]>([]);
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const storedUser = localStorage.getItem('username');
    if (storedUser) {
      setUsername(storedUser);
      setIsLoggedIn(true);
      loadWebhooks();
      loadMessageCounts();
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { user, token, webhook } = event.data.data;
        localStorage.setItem('username', user.username);
        localStorage.setItem('discord_token', token);
        
        setUsername(user.username);
        setIsLoggedIn(true);
        
        if (webhook) {
            addWebhook(webhook);
            toast.success(`Webhook created successfully!`);
        } else {
            toast.success(`Welcome, ${user.username}!`);
        }
      }
    };

    const handleCountUpdate = () => {
      loadMessageCounts();
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('webhook_count_updated', handleCountUpdate);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('webhook_count_updated', handleCountUpdate);
    };
  }, []);

  const loadWebhooks = () => {
    try {
      const stored = localStorage.getItem('discord_webhooks');
      if (stored) {
        setWebhooks(JSON.parse(stored));
      } else {
        // Migration: check if old single webhook exists
        const oldWebhook = localStorage.getItem('discord_webhook');
        if (oldWebhook) {
          const parsed = JSON.parse(oldWebhook);
          setWebhooks([parsed]);
          localStorage.setItem('discord_webhooks', JSON.stringify([parsed]));
        }
      }
    } catch (e) {
      console.error('Failed to load webhooks', e);
    }
  };

  const loadMessageCounts = () => {
    try {
      const stored = localStorage.getItem('webhook_message_counts');
      if (stored) {
        setMessageCounts(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load message counts', e);
    }
  };

  const addWebhook = (newWebhook: DiscordWebhook) => {
    setWebhooks(prev => {
      // Check if it already exists
      if (prev.some(w => w.id === newWebhook.id)) return prev;
      const updated = [...prev, newWebhook];
      localStorage.setItem('discord_webhooks', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteWebhook = (id: string) => {
    playDeleteSound();
    setWebhooks(prev => {
      const updated = prev.filter(w => w.id !== id);
      localStorage.setItem('discord_webhooks', JSON.stringify(updated));
      return updated;
    });
    toast.success("Webhook removed from dashboard.");
  };

  const handleCopyUrl = (url: string) => {
    playButtonSound();
    navigator.clipboard.writeText(url);
    toast.success("Webhook URL copied to clipboard!");
  };

  const handleDiscordLogin = async () => {
    playButtonSound();
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/discord/url`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      
      const width = 600;
      const height = 800;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        url,
        'discord_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      if (!authWindow) {
        toast.error('Please allow popups to sign in with Discord');
      }
    } catch (error) {
      console.error('Discord login error:', error);
      toast.error('Failed to initiate Discord login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    playButtonSound();
    setIsLoggedIn(false);
    setUsername('');
    setWebhooks([]);
    localStorage.removeItem('username');
    localStorage.removeItem('discord_token');
    localStorage.removeItem('discord_webhook');
    localStorage.removeItem('discord_webhooks');
    toast.success("Logged out successfully.");
  };

  if (!isLoggedIn) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-[#1e1e1e] rounded-xl border border-zinc-200 dark:border-zinc-800 text-center overflow-y-auto">
        <div className="w-full max-w-sm bg-white dark:bg-[#2b2d31] p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700">
            <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-[#5865F2] rounded-full flex items-center justify-center shadow-lg shadow-[#5865F2]/20">
                    <Shield className="w-6 h-6 text-white" />
                </div>
            </div>
            
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Sign in
            </h2>
            <p className="text-sm text-zinc-500 mb-8">
                to continue to Webhook Manager
            </p>
            
            <button 
                onClick={handleDiscordLogin}
                disabled={isLoading}
                className="w-full py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <svg className="w-6 h-6" viewBox="0 0 127.14 96.36" fill="currentColor">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.33,46,96.22,53,91.08,65.69,84.69,65.69Z"/>
                    </svg>
                    Sign in with Discord
                  </>
                )}
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1e] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-center relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3 shadow-xl border-4 border-white dark:border-zinc-700 relative z-10">
          <span className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{username.charAt(0).toUpperCase()}</span>
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-zinc-800" title="Online" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white relative z-10">{username}</h2>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {/* Webhooks Dashboard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Hash className="w-4 h-4" /> Your Webhooks
            </h3>
            <button 
              onClick={handleDiscordLogin}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Create Webhook
            </button>
          </div>

          <div className="space-y-3">
            {webhooks.map(webhook => (
              <div key={webhook.id} className="flex flex-col p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/30 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {webhook.avatar ? (
                      <img src={`https://cdn.discordapp.com/avatars/${webhook.id}/${webhook.avatar}.png`} alt={webhook.name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                        <Hash className="w-5 h-5 text-zinc-500" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-white">{webhook.name || 'Unnamed Webhook'}</div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1">
                        <Hash className="w-3 h-3" /> Channel ID: {webhook.channel_id}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleCopyUrl(webhook.url)} 
                      className="p-1.5 text-zinc-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-md transition-colors" 
                      title="Copy Webhook URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteWebhook(webhook.id)} 
                      className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" 
                      title="Delete Webhook"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Messages Sent
                  </div>
                  <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                    {messageCounts[webhook.url] || 0}
                  </div>
                </div>
              </div>
            ))}
            
            {webhooks.length === 0 && (
              <div className="text-center py-8 px-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Hash className="w-6 h-6 text-zinc-400" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">No Webhooks Yet</h4>
                <p className="text-xs text-zinc-500 mb-4">Create your first webhook to start sending messages to your Discord servers.</p>
                <button 
                  onClick={handleDiscordLogin}
                  disabled={isLoading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create Webhook
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-sm font-bold border border-transparent hover:border-red-200 dark:hover:border-red-900/30"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
