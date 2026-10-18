// =====================================================================
//  AD CONFIGURATION  —  edit this file to turn on real ads
//  Full step-by-step guide: see ADMOB_GUIDE.md in the project root.
// =====================================================================
//
//  • ANDROID / iOS APP (Capacitor)  -> Google AdMob  (banner, interstitial, rewarded)
//  • WEBSITE (Netlify)              -> Google H5 Games Ads (AdSense "Ad Placement API")
//    (AdMob does NOT work on normal websites – Google uses AdSense/H5 Games Ads for web.)
//
//  The IDs below are Google's OFFICIAL TEST IDs. They are safe to use while
//  developing. Replace them with your own IDs ONLY for the release build.
//  NEVER click your own live ads – your account can get banned.
// =====================================================================

export const AD_CONFIG = {
  // Master switch. false = no ads anywhere (rewarded buttons are hidden too).
  enabled: true,

  // This game targets children (6-12). These flags are REQUIRED by Google
  // Families Policy / COPPA. Do not change them for a kids game.
  childDirected: true,
  maxAdContentRating: 'General', // G-rated ads only
  nonPersonalizedAds: true,

  // ---------------- AdMob (Capacitor native app) ----------------
  admob: {
    // true while testing. Set false ONLY for the Play Store release build.
    testing: true,
    android: {
      // App ID goes in android/app/src/main/AndroidManifest.xml (see guide)
      appId: 'ca-app-pub-3940256099942544~3347511713',
      banner: 'ca-app-pub-3940256099942544/6300978111',
      interstitial: 'ca-app-pub-3940256099942544/1033173712',
      rewarded: 'ca-app-pub-3940256099942544/5224354917',
    },
    ios: {
      appId: 'ca-app-pub-3940256099942544~1458002511',
      banner: 'ca-app-pub-3940256099942544/2934735716',
      interstitial: 'ca-app-pub-3940256099942544/4411468910',
      rewarded: 'ca-app-pub-3940256099942544/1712485313',
    },
  },

  // ---------------- H5 Games Ads (web / Netlify) ----------------
  web: {
    // Your AdSense publisher id, e.g. 'ca-pub-1234567890123456'. Empty = off.
    adsenseClient: '',
    // 'on' shows Google test ads on the web. Set '' for production.
    adbreakTest: 'on',
    // When no real ad network is available (local dev / not configured),
    // show a friendly simulated ad so you can test the reward flow.
    mockAds: import.meta.env.DEV,
  },

  // ---------------- Kid-friendly frequency rules ----------------
  frequency: {
    interstitialMinSeconds: 150, // at least 2.5 min between interstitials
    interstitialEveryNBreaks: 2, // only every 2nd level-end / game-over
    showBannerOnMenus: true, // banners ONLY on menus, never during gameplay
  },
};
