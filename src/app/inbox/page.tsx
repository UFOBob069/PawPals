'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaPaperPlane } from 'react-icons/fa';
import Link from 'next/link';

interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  subject: string;
  createdAt: any;
  read: boolean;
}

export default function InboxPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent('/inbox'));
      return;
    }

    // Query messages where the current user is either the sender or recipient
    const messagesQuery = query(
      collection(db, 'messages'),
      where('to', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      setMessages(messageData);
      if (!selectedMessage && messageData.length > 0) {
        setSelectedMessage(messageData[0]);
      }
    });

    return () => unsubscribe();
  }, [user, selectedMessage, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMessage || !newMessage.trim()) return;

    setLoading(true);

    try {
      const messageData = {
        from: user.uid,
        to: selectedMessage.from === user.uid ? selectedMessage.to : selectedMessage.from,
        text: newMessage.trim(),
        subject: `Re: ${selectedMessage.subject}`,
        createdAt: serverTimestamp(),
        read: false
      };

      await addDoc(collection(db, 'messages'), messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Sign in Required
        </h2>
        <p className="text-gray-600 mb-8">
          You need to be signed in to view your messages.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent('/inbox')}`}
          className="inline-block bg-primary-coral text-white px-6 py-3 rounded-lg 
                   hover:bg-primary-coral/90 transition-colors duration-200 font-medium"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex h-[calc(100vh-12rem)]">
            {/* Messages List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-primary-navy">Messages</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {messages.map(message => (
                  <button
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                    className={`w-full p-4 text-left hover:bg-gray-50 ${
                      selectedMessage?.id === message.id ? 'bg-primary-yellow/20' : ''
                    } ${!message.read ? 'font-semibold' : ''}`}
                  >
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {message.subject}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {message.text}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {message.createdAt?.toDate().toLocaleString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Message View */}
            <div className="flex-1 flex flex-col">
              {selectedMessage ? (
                <>
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-primary-navy">
                      {selectedMessage.subject}
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="bg-gray-100 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-900">{selectedMessage.text}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {selectedMessage.createdAt?.toDate().toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a reply..."
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral"
                      />
                      <button
                        type="submit"
                        disabled={loading || !newMessage.trim()}
                        className="p-2 text-primary-coral hover:text-primary-coral/80 disabled:opacity-50"
                      >
                        <FaPaperPlane className="text-xl" />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-500">Select a message to view</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 