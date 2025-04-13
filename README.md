# Budget This

A comprehensive personal budgeting and expense tracking application with Progressive Web App (PWA) capabilities.

## Features

- Track monthly income and expenses
- Categorize expenses (fixed, variable, subscription)
- View financial summaries and analytics
- Progressive Web App (PWA) for offline access
- User authentication with Firebase
- Data sharing between authorized users

## Tech Stack

- Next.js 15
- React 19
- Material UI 7
- Firebase (Authentication, Firestore)
- TypeScript
- PWA (Service Workers, Manifest)

## Development Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local` and add your Firebase configuration
3. Install dependencies:
   ```
   npm install
   ```
4. Run the development server:
   ```
   npm run dev
   ```

## Environment Variables

The following environment variables are required:

```
# Firebase configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# User Authorization
NEXT_PUBLIC_ALLOWED_EMAILS=

# Primary User Configuration
NEXT_PUBLIC_PRIMARY_USER_EMAIL=
NEXT_PUBLIC_PRIMARY_USER_ID=
```

## Deployment

This application is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Add all environment variables in the Vercel dashboard
3. Deploy

## PWA Features

- Installable on desktop and mobile devices
- Offline access to previously loaded data
- Custom offline fallback page
- Background synchronization when network is restored

## License

MIT
