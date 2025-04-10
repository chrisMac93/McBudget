# Budget This

A budget management application built with Next.js, Firebase, and Material UI.

## Features

- User authentication (sign up, login, logout)
- Add income and expense transactions
- View transaction history
- Delete transactions
- Categorize transactions
- Responsive UI with Material UI

## Tech Stack

- Next.js 15 with App Router
- Firebase Authentication
- Firebase Firestore
- Material UI
- TypeScript

## Project Structure

```
src/
├── app/                   # Next.js App Router
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   └── signup/        # Signup page
│   ├── dashboard/         # Dashboard page for managing budget
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page (redirects to login/dashboard)
├── components/            # Reusable components
│   ├── TransactionForm.tsx    # Form for adding transactions
│   └── TransactionList.tsx    # List of transactions
├── context/               # React context
│   ├── AuthContext.tsx    # Authentication context
│   └── ClientAuthProvider.tsx # Client wrapper for AuthContext
└── firebase/              # Firebase configuration and services
    ├── auth.ts            # Authentication service
    ├── config.ts          # Firebase initialization
    └── services.ts        # Firestore CRUD operations
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up Firebase:
   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password
   - Create a Firestore database
   - Create a web app in the Firebase project settings
   - Copy the Firebase configuration to `.env.local` file:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
     NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
     NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
     ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This project can be deployed with Vercel. Make sure to configure the environment variables in the Vercel project settings.

## License

This project is licensed under the MIT License.
