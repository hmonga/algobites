import { useState } from 'react';

export default function ChatWithAI({ videoTitle, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!prompt.trim()) return;

    const newChat = [...chat, { role: 'user', content: prompt }];
    setChat(newChat);
    setPrompt('');
    setLoading(true);

    try {
      const res = await fetch('https://us-central1-algobi-14f1f.cloudfunctions.net/askAIv2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      setChat([...newChat, { role: 'ai', content: data.answer || 'No response' }]);
    } catch (err) {
      setChat([...newChat, { role: 'ai', content: 'Error talking to AI.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-xl font-bold hover:text-red-600"
        >
          ×
        </button>
        <h2 className="text-lg font-semibold mb-4">
          Ask AI about: <span className="text-blue-500">{videoTitle}</span>
        </h2>

        <div className="space-y-2 max-h-80 overflow-y-auto mb-4 border border-gray-300 dark:border-gray-700 rounded p-2">
          {chat.map((msg, i) => (
            <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div
                className={`inline-block px-3 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask something..."
            className="flex-1 px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-600"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
