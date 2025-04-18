'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { FaPaperPlane } from 'react-icons/fa';
import Link from 'next/link';

interface Message {
  text: string;
  subject: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [recipientName, setRecipientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<Message>({
    text: '',
    subject: ''
  });

  useEffect(() => {
    const fetchRecipientDetails = async () => {
      if (!params.userId) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', params.userId as string));
        if (!userDoc.exists()) {
          setError('User not found');
          return;
        }
        setRecipientName(userDoc.data().name || 'Service Provider');
      } catch (err) {
        console.error('Error fetching recipient details:', err);
        setError('Failed to load recipient details');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipientDetails();
  }, [params.userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?redirect=${returnUrl}`);
      return;
    }

    if (!message.subject.trim() || !message.text.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSending(true);
    setError('');

    try {
      await addDoc(collection(db, 'messages'), {
        from: user.uid,
        to: params.userId,
        subject: message.subject,
        text: message.text,
        createdAt: serverTimestamp(),
        read: false
      });

      setMessage({ subject: '', text: '' });
      alert('Message sent successfully!');
      router.back();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-coral mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !recipientName) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 text-primary-coral hover:text-primary-coral/80"
        >
          ← Go back
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-6 text-primary-coral hover:text-primary-coral/80 flex items-center gap-2"
        >
          ← Back to service
        </button>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h2 className="text-xl font-semibold text-primary-navy mb-4">
              Sign in to Contact {recipientName}
            </h2>
            <p className="text-gray-600 mb-6">
              You need to be signed in to send messages to service providers.
            </p>
            <Link
              href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
              className="inline-block bg-primary-coral text-white px-6 py-3 rounded-lg 
                       hover:bg-primary-coral/90 transition-colors duration-200 font-medium"
            >
              Sign In
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              Don't have an account?{' '}
              <Link
                href={`/signup?redirect=${encodeURIComponent(window.location.pathname)}`}
                className="text-primary-coral hover:text-primary-coral/80"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 text-primary-coral hover:text-primary-coral/80 flex items-center gap-2"
      >
        ← Back to service
      </button>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-primary-navy mb-6">
          Contact {recipientName}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              value={message.subject}
              onChange={(e) => setMessage(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-coral/20 focus:border-primary-coral"
              placeholder="e.g., Question about your dog walking service"
              disabled={sending}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              value={message.text}
              onChange={(e) => setMessage(prev => ({ ...prev, text: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-coral/20 focus:border-primary-coral"
              placeholder="Type your message here..."
              disabled={sending}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-primary-coral text-white py-3 px-4 rounded-lg 
                     hover:bg-primary-coral/90 transition-colors duration-200 font-medium
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <FaPaperPlane />
                Send Message
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 