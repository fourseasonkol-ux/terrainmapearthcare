import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { queryGeminiAssistant } from '../services/api';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: {
    center: [number, number];
    zoom: number;
    activeBasemap: string;
    layers: Record<string, boolean>;
    elevationUnit: string;
    contourInterval: number;
    terrainStats?: any;
    aoi?: any;
  };
  onExecuteAction: (actionName: string, args: any) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  executedActions?: { name: string; args: any }[];
  timestamp: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  currentState,
  onExecuteAction
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello, I am your GIS Assistant powered by Gemini 3.8 Flash. I can adjust contour intervals, toggle map layers, inspect terrain statistics, search geographic locations, or trigger raster analyses. How can I assist you?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'Show contour lines at 20-meter intervals',
    'Set hillshade to 315° NW with 2.0x exaggeration',
    'Switch elevation unit to feet',
    'Explain the terrain statistics for this area',
    'Search for Mount Rainier summit'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await queryGeminiAssistant(text.trim(), currentState);

      // Execute returned GIS actions in the application
      if (response.actions && response.actions.length > 0) {
        for (const action of response.actions) {
          onExecuteAction(action.name, action.args);
        }
      }

      const assistantMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        executedActions: response.actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `Error processing request: ${err.message || 'Gemini service unreachable.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#122436] border border-[#233B54] rounded-lg max-w-xl w-full shadow-2xl overflow-hidden flex flex-col h-[600px] text-xs text-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#233B54] flex items-center justify-between bg-[#0B1724]">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-[#56E6B2]/20 border border-[#56E6B2]/40 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#56E6B2]" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Terrain AI Assistant</h3>
              <p className="text-[10px] text-slate-400">Server-Side Gemini 3.8 Flash • GIS Function Calling</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0E1C2B]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-[#182C42] border border-[#233B54] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-[#56E6B2]" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed space-y-1.5 ${
                  msg.sender === 'user'
                    ? 'bg-[#1F3D5C] text-slate-100 border border-[#56E6B2]/40'
                    : 'bg-[#122436] text-slate-200 border border-[#233B54]'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {msg.executedActions && msg.executedActions.length > 0 && (
                  <div className="pt-1.5 border-t border-[#233B54] space-y-1">
                    <span className="text-[10px] font-semibold text-[#56E6B2] block uppercase tracking-wider">
                      Executed GIS Tools:
                    </span>
                    {msg.executedActions.map((act, idx) => (
                      <div
                        key={idx}
                        className="text-[10px] bg-[#0E1C2B] px-2 py-1 rounded font-mono text-slate-300 flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#56E6B2]" />
                        <span>{act.name}({JSON.stringify(act.args)})</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[9px] text-slate-500 text-right">{msg.timestamp}</div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-6 h-6 rounded-full bg-[#1F3D5C] border border-[#56E6B2]/40 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-200" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <Bot className="w-4 h-4 text-[#56E6B2] animate-pulse" />
              <span>Analyzing geospatial command with Gemini...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-[#122436] border-t border-[#233B54] overflow-x-auto flex items-center space-x-1.5 shrink-0">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider shrink-0 mr-1">Quick:</span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-[10px] bg-[#182C42] hover:bg-[#1F3D5C] text-slate-300 hover:text-[#56E6B2] border border-[#233B54] px-2.5 py-1 rounded whitespace-nowrap transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[#233B54] bg-[#0B1724]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask Gemini to configure contours, explain terrain, or search places..."
              className="flex-1 bg-[#122436] border border-[#233B54] rounded-md px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-[#56E6B2] focus:ring-1 focus:ring-[#56E6B2]"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-3.5 py-2 bg-[#56E6B2] hover:bg-[#45d4a1] text-[#0B1724] font-semibold rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
