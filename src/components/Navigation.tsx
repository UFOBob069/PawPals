'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { FaHome, FaSearch, FaPlus, FaInbox, FaUser, FaBars, FaPaw, FaSignOutAlt } from 'react-icons/fa';
import { useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Public navigation items (always visible)
  const publicNavItems = [
    { href: '/', icon: FaHome, label: 'Home' },
    { href: '/search', icon: FaSearch, label: 'Find Care' },
    { href: '/about', icon: FaPaw, label: 'About' },
  ];

  // Auth-required navigation items
  const authNavItems = [
    { href: '/post', icon: FaPlus, label: 'Post Job' },
    { href: '/inbox', icon: FaInbox, label: 'Messages' },
  ];

  // Combine nav items based on auth state
  const navItems = [...publicNavItems, ...(user ? authNavItems : [])];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-neutral-light shadow-soft z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <FaPaw className="text-2xl text-primary-coral transform group-hover:rotate-12 transition-transform" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary-coral to-primary-mint bg-clip-text text-transparent">
              PawPals
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  pathname === href
                    ? 'text-primary-coral bg-secondary-lightCoral bg-opacity-10 font-medium'
                    : 'text-neutral-dark hover:text-primary-coral hover:bg-neutral-lightest'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{label}</span>
              </Link>
            ))}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className={`flex items-center space-x-2 p-2 rounded-full transition-all ${
                    pathname === '/profile'
                      ? 'ring-2 ring-primary-coral ring-offset-2'
                      : 'hover:ring-2 hover:ring-primary-mint hover:ring-offset-2'
                  }`}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Profile'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-mint text-white flex items-center justify-center">
                      <FaUser className="w-4 h-4" />
                    </div>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-neutral-dark hover:text-primary-coral transition-colors"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-neutral-dark hover:text-primary-coral transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-medium px-4 py-2 bg-primary-coral text-white rounded-lg hover:bg-opacity-90 transition-all hover:shadow-soft"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-neutral-dark hover:bg-neutral-lightest transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <FaBars className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-light bg-white">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center space-x-3 px-4 py-3 transition-colors ${
                  pathname === href
                    ? 'text-primary-coral bg-secondary-lightCoral bg-opacity-10'
                    : 'text-neutral-dark hover:bg-neutral-lightest'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/profile"
                  className={`flex items-center space-x-3 px-4 py-3 transition-colors ${
                    pathname === '/profile'
                      ? 'text-primary-coral bg-secondary-lightCoral bg-opacity-10'
                      : 'text-neutral-dark hover:bg-neutral-lightest'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaUser className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-neutral-dark hover:bg-neutral-lightest transition-colors"
                >
                  <FaSignOutAlt className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="px-4 py-3 space-y-2">
                <Link
                  href="/login"
                  className="block w-full px-4 py-2 text-center text-neutral-dark hover:bg-neutral-lightest rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="block w-full px-4 py-2 text-center bg-primary-coral text-white rounded-lg hover:bg-opacity-90 transition-all hover:shadow-soft"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
} 