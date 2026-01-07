# Google OAuth Setup for WAVEZ Mobile App

## 🚀 Getting Your Google Client ID

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

### Step 2: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Add authorized redirect URIs:
   ```
   https://auth.expo.dev/@yourusername/wavez-mobile
   https://auth.expo.dev/wavez-mobile
   ```
5. Save and copy the Client ID

### Step 3: Update the App Code
1. Open `app/(tabs)/account.js`
2. Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID:
   ```javascript
   const GOOGLE_CLIENT_ID = 'your-actual-google-client-id-here';
   ```

### Step 4: Configure App.json (Already Done)
The app.json is already configured with:
```json
{
  "expo": {
    "scheme": "wavezmobile",
    "plugins": [
      [
        "expo-auth-session",
        {
          "scheme": "wavezmobile"
        }
      ]
    ]
  }
}
```

## 🧪 Testing Google Sign-In

1. Start your Expo server: `npx expo start --lan`
2. Open the app in Expo Go
3. Navigate to the "חשבון" (Account) tab
4. Tap "התחבר עם Google"
5. Complete the OAuth flow

## 🔧 Troubleshooting

### "Invalid Client" Error
- Make sure your Client ID is correct
- Verify the redirect URIs match exactly

### "Redirect URI Mismatch"
- Ensure the redirect URIs in Google Console match your Expo scheme
- The scheme should be `wavezmobile`

### Sign-In Works But No User Data
- Check that you enabled the Google+ API
- Verify the scopes include `openid`, `profile`, `email`

## 📱 Features Included

✅ **Google Sign-In Integration**
✅ **User Profile Display**
✅ **Persistent Login State**
✅ **Sign-Out Functionality**
✅ **RTL Hebrew Interface**
✅ **Beautiful UI Design**

## 🎯 User Experience

- **First-time users** see a welcome screen with Google sign-in
- **Signed-in users** see their profile with account management options
- **Persistent sessions** - users stay logged in between app restarts
- **Clean sign-out** with confirmation

---

**Note:** This setup uses Expo's built-in OAuth flow for maximum compatibility across iOS and Android. The user data is stored locally using AsyncStorage for offline access.







