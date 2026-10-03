import { useEffect, useState } from 'react';
import { LifeBuoy, Send } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { fetchMessages, fetchSupportThreads, sendMessage } from '../services/api';
import { getStoredUser } from '../services/auth';

interface SupportThread {
  threadId: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  lastMessage: string;
  updatedAt: string;
}

interface SupportMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: { name: string; role: string };
}

export default function SupportInboxPage() {
  const admin = getStoredUser();
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadThreads = async () => {
      try {
        const data = await fetchSupportThreads();
        if (!cancelled) {
          setThreads(data);
          setSelectedThreadId(current => current || data[0]?.threadId || '');
        }
      } catch {
        if (!cancelled) setError('Could not load the support inbox. Check that the backend is online.');
      }
    };
    loadThreads();
    const interval = window.setInterval(loadThreads, 4000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    const loadMessages = async () => {
      try {
        const data = await fetchMessages(selectedThreadId);
        if (!cancelled) setMessages(data);
      } catch {
        if (!cancelled) setError('Could not load this conversation.');
      }
    };
    loadMessages();
    const interval = window.setInterval(loadMessages, 4000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [selectedThreadId]);

  const submitReply = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = reply.trim();
    if (!body || !selectedThreadId) return;
    try {
      const message = await sendMessage(selectedThreadId, body);
      setMessages(previous => [...previous, message]);
      setReply('');
      setError('');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Reply could not be sent.');
    }
  };

  const selectedThread = threads.find(thread => thread.threadId === selectedThreadId);

  return (
    <AdminLayout activeTab="support">
      <div className="space-y-5">
        <header>
          <h1 className="text-xl font-bold text-sage-900">Support Inbox</h1>
          <p className="text-xs text-sage-600 mt-1">Customer and technician messages, with replies delivered to their FieldFix chat.</p>
        </header>
        <div className="grid min-h-[min(72vh,680px)] grid-cols-1 overflow-hidden rounded-2xl border border-sage-200 bg-white md:grid-cols-[280px_1fr]">
          <aside className="border-b border-sage-200 md:border-b-0 md:border-r">
            <div className="flex items-center gap-2 border-b border-sage-100 p-4 text-sm font-bold text-sage-800"><LifeBuoy className="h-4 w-4 text-emerald-700" /> Conversations</div>
            <div className="max-h-[220px] overflow-y-auto md:max-h-[560px]">
              {threads.map(thread => (
                <button key={thread.threadId} onClick={() => { setSelectedThreadId(thread.threadId); setError(''); }} className={`block w-full border-b border-sage-100 p-4 text-left ${selectedThreadId === thread.threadId ? 'bg-emerald-50' : 'hover:bg-sage-50'}`}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold text-sage-900">{thread.participantName}</span>
                    <span className="text-[10px] uppercase text-sage-500">{thread.participantRole}</span>
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-sage-500">{thread.lastMessage}</span>
                  <span className="mt-1 block text-[10px] text-sage-400">{new Date(thread.updatedAt).toLocaleString()}</span>
                </button>
              ))}
              {threads.length === 0 && <p className="p-5 text-center text-xs text-sage-400">No support messages yet.</p>}
            </div>
          </aside>
          <section className="flex min-h-[460px] flex-col">
            {selectedThread ? <>
              <header className="border-b border-sage-100 p-4">
                <p className="text-sm font-bold text-sage-900">{selectedThread.participantName}</p>
                <p className="text-[11px] uppercase text-sage-500">{selectedThread.participantRole}</p>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto bg-sage-50/50 p-4">
                {messages.map(message => (
                  <div key={message.id} className={`flex ${message.senderId === admin?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs ${message.senderId === admin?.id ? 'bg-sky-700 text-white' : 'bg-white text-sage-800 shadow-sm'}`}>
                      <p className="mb-1 font-semibold">{message.senderId === admin?.id ? 'You' : message.sender?.name}</p>
                      <p>{message.body}</p>
                      <p className="mt-1 text-[10px] opacity-60">{new Date(message.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && <p className="py-12 text-center text-xs text-sage-400">No messages in this conversation yet.</p>}
              </div>
              <form onSubmit={submitReply} className="flex gap-2 border-t border-sage-100 p-4">
                <input value={reply} onChange={event => setReply(event.target.value)} placeholder="Reply to this conversation…" className="min-w-0 flex-1 rounded-xl border border-sage-200 px-4 py-2.5 text-xs focus:border-sky-600 focus:outline-none" />
                <button aria-label="Send reply" disabled={!reply.trim()} className="rounded-xl bg-sky-700 px-4 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
              </form>
            </> : <div className="flex flex-1 items-center justify-center p-8 text-center text-xs text-sage-400">Select a conversation to read and reply.</div>}
            {error && <p className="px-4 pb-3 text-xs text-rose-600">{error}</p>}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
