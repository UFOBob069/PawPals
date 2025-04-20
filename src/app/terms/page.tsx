'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-primary-navy mb-8">Terms of Service</h1>

        {/* Use at Your Own Risk */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary-navy mb-4">1. Use at Your Own Risk</h2>
          <p className="text-gray-700 mb-4">
            YourPawPals does not screen, verify, or guarantee the identity, conduct, or suitability of any user. 
            Use of the platform and any in-person interactions are at your own risk. Users are advised to exercise 
            caution and due diligence when interacting with other users or pets.
          </p>
        </section>

        {/* No Insurance or Guarantees */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary-navy mb-4">2. No Insurance or Guarantees</h2>
          <p className="text-gray-700 mb-4">
            YourPawPals does not offer any insurance or compensation in the event of property damage, injury, 
            or pet-related incidents. Users are solely responsible for their arrangements, including but not 
            limited to obtaining appropriate insurance coverage and taking necessary precautions.
          </p>
        </section>

        {/* No Employment Relationship */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary-navy mb-4">3. No Employment Relationship</h2>
          <p className="text-gray-700 mb-4">
            Users are not employees, agents, or contractors of YourPawPals. All arrangements are made 
            independently between users. YourPawPals serves solely as a platform to facilitate connections 
            between pet owners and service providers.
          </p>
        </section>

        {/* No Background Checks */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary-navy mb-4">4. No Background Checks</h2>
          <p className="text-gray-700 mb-4">
            YourPawPals does not conduct background checks, license verifications, or other vetting on any users. 
            Exercise caution and judgment when interacting with others. Users are encouraged to independently 
            verify credentials and references.
          </p>
        </section>

        {/* Indemnity Clause */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary-navy mb-4">5. Indemnity Clause</h2>
          <p className="text-gray-700 mb-4">
            You agree to indemnify and hold harmless YourPawPals and its affiliates from any claims, damages, 
            losses, or liabilities arising from your use of the platform. This includes legal fees and costs 
            related to your violation of these terms or your interactions with other users.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary-navy mb-4">6. Limitation of Liability</h2>
          <p className="text-gray-700 mb-4">
            YourPawPals' liability to you for any cause whatsoever shall not exceed $100 or the amount paid 
            for the service, whichever is less. We are not liable for any indirect, incidental, special, 
            consequential, or punitive damages.
          </p>
        </section>

        {/* Content & Conduct */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary-navy mb-4">7. Content & Conduct</h2>
          <p className="text-gray-700 mb-4">
            We may suspend or remove content or accounts at our sole discretion if deemed harmful or inappropriate. 
            Users agree to maintain professional conduct and refrain from posting false, misleading, or harmful content.
          </p>
        </section>

        {/* Governing Law & Dispute Resolution */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary-navy mb-4">8. Governing Law & Dispute Resolution</h2>
          <p className="text-gray-700 mb-4">
            These Terms are governed by the laws of the State of Texas. Any disputes shall be resolved through 
            binding arbitration in Austin, TX. Users waive their right to participate in class action lawsuits.
          </p>
        </section>

        {/* Last Updated */}
        <div className="mt-12 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
          <Link 
            href="/"
            className="inline-block mt-4 text-primary-coral hover:text-primary-coral/80"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 