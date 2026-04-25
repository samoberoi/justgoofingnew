const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-6 md:px-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-primary">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: April 25, 2026
        </p>

        <div className="space-y-6 text-base leading-relaxed">
          <section>
            <p>
              JustGoofing ("we", "our", or "us") operates the JustGoofing mobile application
              (the "App"). This Privacy Policy informs you of our policies regarding the
              collection, use, and disclosure of personal data when you use our App and the
              choices you have associated with that data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">1. Information We Collect</h2>
            <p className="mb-2">We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Contact Information:</strong> Phone number, name, and email address used to create your account.</li>
              <li><strong>Children's Profiles:</strong> Names, ages, and date of birth of children registered by parents for play session bookings.</li>
              <li><strong>Location Data:</strong> Precise GPS location used to find the nearest store and for delivery services.</li>
              <li><strong>Booking & Order Data:</strong> Records of play sessions, food orders, payments, and check-in/check-out times.</li>
              <li><strong>Identifiers:</strong> Unique user ID for authentication and session management.</li>
              <li><strong>Device Information:</strong> Device type, operating system, and app version for diagnostics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and maintain our services (booking, ordering, check-in).</li>
              <li>To process payments and fulfill orders.</li>
              <li>To send booking confirmations, order updates, and notifications.</li>
              <li>To find the nearest store using your location.</li>
              <li>To manage loyalty rewards, points, and referrals.</li>
              <li>To improve our App and customer experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">3. Children's Privacy</h2>
            <p>
              The JustGoofing App is intended for use by parents and adult guardians (13+).
              While the App allows parents to create profiles for their children for the
              purpose of booking play sessions, we do not knowingly collect personal
              information directly from children under 13. All child profile data is entered
              and managed solely by the parent or legal guardian.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">4. Data Sharing</h2>
            <p>
              We do not sell or rent your personal information. We may share data with:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Service providers</strong> who assist with payments, hosting, and analytics.</li>
              <li><strong>Store staff</strong> for the purpose of fulfilling your bookings and orders.</li>
              <li><strong>Legal authorities</strong> when required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">5. Data Security</h2>
            <p>
              We use industry-standard security measures including encryption, secure
              authentication, and Row-Level Security policies to protect your data. However,
              no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">6. Data Retention</h2>
            <p>
              We retain your personal data only for as long as necessary to provide our
              services and comply with legal obligations. You may request deletion of your
              account and data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and data.</li>
              <li>Opt-out of marketing communications.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">8. Third-Party Services</h2>
            <p>
              Our App uses Lovable Cloud (powered by Supabase) for backend services
              including authentication, database, and storage. Their privacy practices are
              governed by their respective policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page and updating the "Last
              updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <ul className="list-none pl-0 space-y-1 mt-2">
              <li><strong>Email:</strong> support@justgoofing.com</li>
              <li><strong>Owner:</strong> HyperRevamp</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
