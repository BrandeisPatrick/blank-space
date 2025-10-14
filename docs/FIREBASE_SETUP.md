# Firebase Setup Guide

This guide will help you set up Firebase Authentication and Firestore for your Blank Space application.

## Prerequisites

- A Google account
- Node.js and npm installed
- Your Blank Space project cloned and ready

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `blank-space-prod` (or your preferred name)
4. Enable Google Analytics (optional, but recommended)
5. Click **"Create project"**

## Step 2: Enable Authentication

1. In your Firebase project, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Enable **Email/Password** authentication:
   - Click on **"Email/Password"**
   - Toggle **"Enable"** to ON
   - Click **"Save"**
4. Enable **Google** authentication:
   - Click on **"Google"**
   - Toggle **"Enable"** to ON
   - Select a support email
   - Click **"Save"**

## Step 3: Create Firestore Database

1. In your Firebase project, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in production mode"** (we'll deploy security rules next)
4. Choose a location closest to your users (e.g., `us-central` for US)
5. Click **"Enable"**

## Step 4: Get Web App Configuration

1. In Firebase Console, click the gear icon ⚙️ next to **"Project Overview"**
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web** icon `</>`
5. Register your app:
   - App nickname: `blank-space-web`
   - Check **"Also set up Firebase Hosting"** (optional)
   - Click **"Register app"**
6. Copy the Firebase configuration object (you'll need these values)

It should look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "blank-space-prod.firebaseapp.com",
  projectId: "blank-space-prod",
  storageBucket: "blank-space-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 5: Get Admin SDK Credentials

1. In **"Project settings"**, go to the **"Service accounts"** tab
2. Click **"Generate new private key"**
3. Click **"Generate key"** (a JSON file will be downloaded)
4. Open the JSON file and extract these values:
   - `project_id`
   - `client_email`
   - `private_key`

## Step 6: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in the Firebase values in `.env`:

```env
# Client-side Firebase config (from Step 4)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=blank-space-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=blank-space-prod
VITE_FIREBASE_STORAGE_BUCKET=blank-space-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Server-side Firebase Admin SDK (from Step 5)
FIREBASE_ADMIN_PROJECT_ID=blank-space-prod
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@blank-space-prod.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**Important:** Keep the quotes around `FIREBASE_ADMIN_PRIVATE_KEY` and preserve the `\n` characters!

## Step 7: Deploy Firestore Security Rules

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```
   - Select: **Firestore** and **Storage**
   - Use existing project: `blank-space-prod`
   - Accept defaults for file paths (they're already set up)

4. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

## Step 8: Configure Vercel (for Production)

1. Go to your Vercel project settings
2. Go to **"Environment Variables"**
3. Add all the Firebase environment variables from your `.env` file
4. Make sure to add them for **Production**, **Preview**, and **Development** environments
5. Redeploy your project

## Step 9: Test Locally

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:5173`

3. Test the authentication flow:
   - Click "Sign In"
   - Click "Sign up" to create a new account
   - Try signing up with email/password
   - Try signing in with Google
   - Create an artifact and verify it's saved to Firestore

## Step 10: Verify in Firebase Console

1. Go to **Authentication** in Firebase Console
   - You should see your test user
2. Go to **Firestore Database**
   - Navigate to `users/{userId}/artifacts`
   - You should see your test artifact

## Troubleshooting

### "Firebase Admin credentials not configured"
- Make sure all three `FIREBASE_ADMIN_*` variables are set in `.env`
- Check that the private key has `\n` characters preserved
- Restart your dev server after adding env variables

### "No authorization header" errors
- Make sure you're signed in
- Check browser console for authentication errors
- Try signing out and back in

### "Firestore index required"
- This is normal on first use
- Firebase will create the index automatically
- Wait 1-2 minutes and try again

### Google Sign-In not working locally
- Add `http://localhost:5173` to authorized domains:
  - Go to Firebase Console > Authentication > Settings
  - Scroll to "Authorized domains"
  - Add `localhost`

## Cost Optimization Tips

1. **Debouncing**: Auto-save is already debounced (2 seconds) to reduce writes
2. **Caching**: Artifacts are cached in React state to reduce reads
3. **Batch operations**: Consider batching multiple updates if needed
4. **Monitor usage**: Check Firebase Console > Usage tab regularly

## Security Best Practices

1. ✅ Never commit `.env` to git (already in `.gitignore`)
2. ✅ Security rules are configured to only allow users to access their own data
3. ✅ API endpoints verify JWT tokens server-side
4. ✅ File size limits are enforced (10MB max)
5. ⚠️ Consider adding rate limiting for production
6. ⚠️ Enable email verification for production

## Next Steps

- [ ] Set up email verification flow
- [ ] Add password reset functionality (UI already exists)
- [ ] Implement artifact sharing/collaboration
- [ ] Add version history for artifacts
- [ ] Set up monitoring and alerts

## Support

If you encounter issues, check:
1. [Firebase Documentation](https://firebase.google.com/docs)
2. [Vercel Documentation](https://vercel.com/docs)
3. GitHub Issues for this project

---

**Firebase Implementation Complete!** 🎉

Your app now has:
- ✅ Email/Password Authentication
- ✅ Google OAuth
- ✅ Remote Artifact Storage
- ✅ Cross-device Sync
- ✅ User-scoped Data
- ✅ Secure API Endpoints
