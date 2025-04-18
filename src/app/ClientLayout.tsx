'use client';

import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/contexts/AuthContext";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Navigation />
      <div className="min-h-screen bg-neutral-lightest bg-opacity-50 pt-16">
        <div className="relative">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-paw-pattern opacity-5 pointer-events-none" />
          
          {/* Content */}
          <div className="relative">
            {children}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
} 