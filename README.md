# PawPals - Community-First Dog Care Platform

PawPals is a trusted, payment-free platform that connects dog owners with local hosts for walks, daycare, and vacation sitting. The platform focuses on building long-term relationships rather than one-off gigs.

## Features

- **Core Matching**: Enable owners to post jobs and browse host profiles via map & list views with breed-based filters
- **Direct Chat**: Real-time messaging to arrange care details
- **User Roles**: Separate role flags for owners and hosts (users can be both)
- **Profile Management**: Complete profiles for both users and dogs
- **Job Posting**: Create and manage service requests
- **Map Integration**: Browse nearby hosts and jobs using an interactive map

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions)
- **Maps**: Mapbox GL JS
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Mapbox account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pawpals.git
   cd pawpals
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Firebase project and enable Authentication, Firestore, and Storage.

4. Create a Mapbox account and get an access token.

5. Create a `.env.local` file in the root directory with the following variables:
   ```
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Mapbox Configuration
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/            # Reusable UI components
├── contexts/             # React contexts
├── lib/                  # Utility functions and configurations
├── types/               # TypeScript type definitions
└── styles/              # Global styles
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Mapbox](https://www.mapbox.com/)
