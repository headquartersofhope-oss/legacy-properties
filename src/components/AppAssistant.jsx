import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ASSISTANT_CONFIG = {
  appName: 'Legacy Properties',
  appColor: '#34D399',
  rolePrompts: {
    housing_admin: [
      'Bed availability',
      'Pending referrals',
      'Open incidents',
    ],
    admin: [
      'Full property report',
      'Occupancy status',
      'Health check',
    ],
  },
};

export default function AppAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [context, setContext] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const res = await base44.functions.invoke('getAppAssistantContext', {});
        setContext(res.data);
      } catch (err) {
        console.error('Failed to fetch app context:', err);
      }
    };
    if (isOpen) {
      fetchContext();
    }
  }, [isOpen]);

  const generateBriefMessage = () => {
    if (!context || !user) return '';

    const timestamp = new Date(context.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const briefLines = [
      `I am Rodney Jones, super admin of RE Jones Global. Here is my Legacy Properties live report as of ${timestamp}.`,
      '',
      `Properties: ${context.properties.total} total (${context.properties.active} active)`,
      `Beds: ${context.beds.occupied}/${context.beds.total} occupied | ${context.beds.available} available | ${context.beds.needs_cleaning} cleaning | ${context.beds.reserved} reserved`,
      `Active Occupancy Records: ${context.occupancy.active_records}`,
      `Pending Referrals: ${context.referrals.pending}`,
      `Open Incidents: ${context.incidents.open}`,
      `Overdue Fees: ${context.fees.due}`,
    ];

    if (context.occupancy_mismatches.length > 0) {
      briefLines.push(`Occupancy Mismatches Detected: ${context.occupancy_mismatches.length}`);
    }

    if (context.recent_audit_logs.length > 0) {
      briefLines.push(`Recent Events (24h): ${context.recent_audit_logs.length}`);
    }

    return briefLines.join('\n');
  };

  const handleBriefClaude = async () => {
    const brief = generateBriefMessage();
    if (!brief) return;

    setMessages([{ role: 'assistant', content: brief }]);
    setLoading(true);

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Here is my housing operations brief for Legacy Properties:\n\n${brief}\n\nProvide a concise operational summary with key insights and any alerts.`,
        model: 'claude_sonnet_4_6',
      });

      setMessages(prev => [...prev, { role: 'assistant', content: res }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFullBrief = () => {
    const brief = generateBriefMessage();
    navigator.clipboard.writeText(brief).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !context) return;

    const brief = generateBriefMessage();
    const userMessage = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Rodney, the super admin assistant for Legacy Properties housing operations.\n\nCurrent Status:\n${brief}\n\nUser Question: ${userMessage}\n\nProvide a concise, actionable response.`,
        model: 'claude_sonnet_4_6',
      });

      setMessages(prev => [...prev, { role: 'assistant', content: res }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const rolePrompts = user ? ASSISTANT_CONFIG.rolePrompts[user.role] || [] : [];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-110 z-40"
        style={{
          backgroundColor: ASSISTANT_CONFIG.appColor,
          color: '#0D1117',
          boxShadow: `0 0 20px ${ASSISTANT_CONFIG.appColor}40`,
        }}
        title="Open Legacy Properties Assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-card border border-card-border rounded-lg shadow-2xl flex flex-col max-h-96 z-40">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-card-border bg-gradient-to-r from-primary/10 to-transparent">
            <h2 className="text-sm font-bold text-heading">{ASSISTANT_CONFIG.appName} Assistant</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-label hover:text-heading"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-label text-xs mt-2">
                <p className="mb-4 text-heading">Welcome to {ASSISTANT_CONFIG.appName}!</p>
                <div className="space-y-2">
                  <Button
                    onClick={handleBriefClaude}
                    className="w-full text-xs bg-elevated hover:bg-primary/20 text-heading border border-card-border"
                  >
                    Brief Claude
                  </Button>
                  <Button
                    onClick={handleCopyFullBrief}
                    variant="outline"
                    className="w-full text-xs border-card-border text-heading hover:bg-elevated"
                  >
                    {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copied ? 'Copied!' : 'Copy Full Brief'}
                  </Button>
                </div>
                {rolePrompts.length > 0 && (
                  <div className="mt-4">
                    <p className="text-muted-label text-xs mb-2">Quick Actions:</p>
                    <div className="space-y-1">
                      {rolePrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInputValue(prompt);
                          }}
                          className="block w-full text-left text-xs px-2 py-1 rounded bg-elevated hover:bg-primary/20 text-body-text hover:text-heading transition border border-card-border"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`text-xs p-2 rounded ${
                  msg.role === 'user'
                    ? 'bg-primary/20 text-heading ml-8 border border-primary/30'
                    : 'bg-elevated text-body-text mr-8 border border-card-border'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {loading && <div className="text-xs text-muted-label animate-pulse">Thinking...</div>}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-card-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about operations..."
                className="flex-1 bg-elevated border border-card-border rounded px-2 py-1 text-xs text-heading placeholder-muted-label focus:outline-none focus:border-primary"
                disabled={loading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={loading || !inputValue.trim()}
                className="text-xs bg-primary hover:bg-primary-dark text-white"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}