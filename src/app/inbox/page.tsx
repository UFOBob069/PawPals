'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, or } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaPaperPlane } from 'react-icons/fa';
import Link from 'next/link';

interface Message {
  id: string;
  from?: string;
  to?: string;
  participants?: string[];
  text: string;
  subject: string;
  createdAt: any;
  read: boolean;
  senderUid: string;
}

export default function InboxPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Group messages by subject
  const messageThreads = messages.reduce((threads, message) => {
    const baseSubject = message.subject.replace(/^Re: /, '');
    if (!threads[baseSubject]) {
      threads[baseSubject] = [];
    }
    threads[baseSubject].push(message);
    return threads;
  }, {} as Record<string, Message[]>);

  // Get unique subjects for the left panel
  const uniqueSubjects = Object.keys(messageThreads).map(subject => ({
    subject,
    latestMessage: messageThreads[subject].reduce((latest, msg) => 
      latest.createdAt > msg.createdAt ? latest : msg
    ),
    unread: messageThreads[subject].some(msg => !msg.read && msg.senderUid !== user?.uid)
  })).sort((a, b) => b.latestMessage.createdAt - a.latestMessage.createdAt);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent('/inbox'));
      return;
    }

    const messagesQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      setMessages(messageData);
      if (!selectedSubject && messageData.length > 0) {
        const firstSubject = messageData[0].subject.replace(/^Re: /, '');
        setSelectedSubject(firstSubject);
      }
    });

    return () => unsubscribe();
  }, [user, router, selectedSubject]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSubject || !newMessage.trim()) return;

    setLoading(true);

    try {
      const currentThread = messageThreads[selectedSubject];
      const lastMessage = currentThread[0]; // Most recent message in thread
      
      const messageData = {
        participants: [
          user.uid,
          lastMessage.participants 
            ? lastMessage.participants.find(id => id !== user.uid)
            : lastMessage.from === user.uid 
              ? lastMessage.to 
              : lastMessage.from
        ],
        senderUid: user.uid,
        text: newMessage.trim(),
        subject: `Re: ${selectedSubject}`,
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
                {uniqueSubjects.map(({ subject, latestMessage, unread }) => (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`w-full p-4 text-left hover:bg-gray-50 ${
                      selectedSubject === subject ? 'bg-primary-yellow/20' : ''
                    } ${unread ? 'font-semibold' : ''}`}
                  >
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {subject}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {latestMessage.text}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {latestMessage.createdAt?.toDate().toLocaleString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Thread View */}
            <div className="flex-1 flex flex-col">
              {selectedSubject ? (
                <>
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-primary-navy">
                      {selectedSubject}
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {messageThreads[selectedSubject]
                      .sort((a, b) => a.createdAt - b.createdAt) // Show oldest first
                      .map(message => (
                        <div 
                          key={message.id}
                          className={`mb-4 ${
                            message.senderUid === user.uid 
                              ? 'ml-auto' 
                              : 'mr-auto'
                          }`}
                        >
                          <div className={`rounded-lg p-4 max-w-[80%] ${
                            message.senderUid === user.uid
                              ? 'bg-primary-coral/10 ml-auto'
                              : 'bg-gray-100'
                          }`}>
                            <p className="text-sm text-gray-900">{message.text}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-primary-coral">
                                {message.senderUid === user.uid ? 'You' : 'Them'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {message.createdAt?.toDate().toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                    ))}
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
                  <p className="text-gray-500">Select a conversation to view</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 