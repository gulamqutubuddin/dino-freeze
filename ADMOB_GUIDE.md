# 📱 AdMob Integration Guide – Dino Freeze Blast

Game me **Google AdMob** lagane ka pura provision pehle se configure kiya gaya hai. Is guide me step-by-step bataya gaya hai ki test ads kaise check karein aur Play Store par launch karte waqt apne Real AdMob Ads kaise lagayein.

---

## 🌟 1. Ad Architecture Kaise Kaam Karta Hai?

Game me ek unified abstraction layer hai (`src/ads/AdService.js` aur `src/ads/adConfig.js`):

| Platform | Ad Provider | Ad Types |
| :--- | :--- | :--- |
| **Android / iOS App (Capacitor)** | **Google AdMob** (`@capacitor-community/admob`) | 📌 Adaptive Banner, 🎬 Interstitial, 🎁 Rewarded Video |
| **Web Browser (Netlify / itch.io)** | **Google H5 Games Ads** (AdSense for Games) | 🎬 Natural break ads, 🎁 Rewarded |
| **Local Dev / Testing** | **Simulated Mock Ad** | 📺 5s interactive test modal with skip/reward |

> **Zaroori Baat**: Google AdMob official tor par native Android/iOS mobile apps ke liye hota hai. Web browsers me Google AdSense / H5 Games Ads chalta hai. Humne **Capacitor** include kar diya hai jisse ye game 1 click me Android app ban jata hai aur usme asli AdMob SDK load hota hai!

---

## 🛠️ 2. Google AdMob Account & Ad Units Kaise Banayein?

1. **AdMob Account Banayein**:
   - [Google AdMob](https://admob.google.com/) par jayein aur apne Google account se sign in karein.
2. **App Add Karein**:
   - Left menu me **Apps** > **Add App** par click karein.
   - Platform: **Android** select karein.
   - Is the app listed on a supported app store? Agar naya app hai to **No** select karein.
   - App Name likhein: `Dino Freeze Blast`.
   - **User Metrics** enable rakhein.
3. **App ID Note Karein**:
   - App create hone ke baad aapko ek **App ID** milega, jaise:
     `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY` (beech me `~` hota hai).
4. **Ad Units Create Karein**:
   - **Banner Ad**:
     - Name: `Main Menu Banner`
     - Ad type: Banner
     - Save karne par **Banner Ad Unit ID** milega: `ca-app-pub-XXXXXXXXXXXXXXXX/1111111111`
   - **Interstitial Ad**:
     - Name: `Level Complete Interstitial`
     - Ad type: Interstitial
     - Save karne par **Interstitial Ad Unit ID** milega: `ca-app-pub-XXXXXXXXXXXXXXXX/2222222222`
   - **Rewarded Video Ad**:
     - Name: `Revive & Double Crystals Rewarded`
     - Ad type: Rewarded
     - Reward amount: `1`, Item: `Reward`
     - Save karne par **Rewarded Ad Unit ID** milega: `ca-app-pub-XXXXXXXXXXXXXXXX/3333333333`

---

## 📁 3. Apne Ad IDs Code Me Kaha Daalne Hain?

### File 1: `src/ads/adConfig.js`
Is file ko open karein aur `admob.android` section me apne IDs replace karein:

```javascript
export const AD_CONFIG = {
  enabled: true,

  // Kids game policy (COPPA & Families Policy) - ALWAYS TRUE
  childDirected: true,
  maxAdContentRating: 'General',
  nonPersonalizedAds: true,

  admob: {
    // Testing ke waqt true rakhein. Play Store release se pehle FALSE karein!
    testing: false,

    android: {
      appId: 'ca-app-pub-YOUR_ADMOB_PUB_ID~YOUR_APP_ID',
      banner: 'ca-app-pub-YOUR_ADMOB_PUB_ID/YOUR_BANNER_ID',
      interstitial: 'ca-app-pub-YOUR_ADMOB_PUB_ID/YOUR_INTERSTITIAL_ID',
      rewarded: 'ca-app-pub-YOUR_ADMOB_PUB_ID/YOUR_REWARDED_ID',
    },
  },
  ...
};
```

---

## 🤖 4. Android App (APK / AAB) Kaise Banayein?

Project me Capacitor pehle se configured hai. Android build banane ke 4 aasan steps:

### Step 1: Web build banayein
Terminal me run karein:
```bash
npm run build
```

### Step 2: Android platform add karein (Sirf pehli baar)
```bash
npx cap add android
```
*(Yeh `android/` folder create kar dega jisme Android Studio project hota hai).*

### Step 3: `AndroidManifest.xml` me App ID add karein
File open karein:
`android/app/src/main/AndroidManifest.xml`

`<application ...>` tag ke andar ye meta-data daalein:
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-YOUR_ADMOB_PUB_ID~YOUR_APP_ID"/>
```
*(Testing ke waqt Google ka official test App ID daal sakte hain: `ca-app-pub-3940256099942544~3347511713`)*

### Step 4: Sync & Android Studio Open Karein
```bash
npx cap sync
npx cap open android
```
Android Studio open hone ke baad:
1. Phone connect karein ya Emulator start karein aur **Run (Green Play button)** dabayein.
2. Play Store release ke liye:
   **Build** > **Generate Signed Bundle / APK** > **Android App Bundle (.aab)** select karein aur keystore se sign karke Play Console par upload karein.

---

## 👶 5. Google Families Policy & COPPA Compliance (Kids Game ke Niyam)

Kyunki ye game 6-12 saal ke bachhon ke liye banaya gaya hai, Google Play Console aur AdMob ke strict rules hain:

1. **COPPA Tagging**:
   - Humne code me pehle se `childDirected: true` aur `tagForUnderAgeOfConsent: true` set kiya hua hai. Isse Google bachhon ka personal data collect nahi karta.
2. **G-Rated Ads Only**:
   - Code me `maxAdContentRating: 'General'` set hai. Isse sirf baccho ke dekhne yogya safe ads aayenge.
3. **Non-Intrusive Ad Experience**:
   - Gameplay ke dauran kabhi koi ad nahi aata (baccha goli chala raha ho to beech me ad aakar game kharab nahi karega).
   - Banners sirf Main Menu aur Shop screens par bottom me aate hain.
   - Interstitials har level ke baad nahi, frequency-capped aate hain (at least 2.5 minutes ka gap).
   - Rewarded video player ki apni marzi se chalta hai (Defeat par revive hona ya Crystals double karna).

---

## 🌐 6. Website / Netlify par Ads Kaise Chalayein?

Agar aap is game ko browser me publish karte hain (jaise Netlify, Vercel, Poki, ya itch.io):
1. [Google AdSense](https://adsense.google.com/) me jaakar **AdSense for Platforms / H5 Games Ads** ke liye apply karein.
2. `src/ads/adConfig.js` me apna publisher client daal dein:
   ```javascript
   web: {
     adsenseClient: 'ca-pub-XXXXXXXXXXXXXXXX',
     adbreakTest: '', // production me empty chhod dein
   }
   ```
3. Website par automatically Google ka `adBreak` API trigger hoga.

---

## ⚠️ 7. Account Ban Hone Se Bachne Ke Golden Rules

- ❌ **KABHI BHI** apne khud ke phone par aane wale live ads par click na karein!
- ❌ Testing ke waqt hamesha `testing: true` rakhein ya AdMob console me apna phone **Test Device** ke roop me add karein.
- ❌ Bachhon ko bar-bar force karke ads mat dikhayein; AdService me frequency cap pehle se set hai, use na hatayein.
