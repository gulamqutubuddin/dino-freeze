// =====================================================================
//  AdService – one API for every platform
//    • Native app (Capacitor)  -> AdMob via @capacitor-community/admob
//    • Web (Netlify)           -> Google H5 Games Ads (adBreak API)
//    • Dev / not configured    -> friendly simulated ad (optional)
//
//  Game code only calls:
//    AdService.init()
//    AdService.showBanner() / hideBanner()         (menus only)
//    AdService.maybeShowInterstitial('level_end')  (natural breaks only)
//    AdService.showRewarded('revive')  -> Promise<boolean>
//    AdService.rewardedAvailable()     -> boolean
// =====================================================================
import { Capacitor } from '@capacitor/core';
import { AD_CONFIG } from './adConfig.js';

const listeners = new Set(); // {onAdStart, onAdEnd, onMock}
let provider = 'none'; // 'admob' | 'h5' | 'mock' | 'none'
let AdMob = null;
let admobMod = null;
let initPromise = null;
let lastInterstitial = 0;
let breakCount = 0;
let rewardedReady = false;
let interstitialReady = false;
let bannerShown = false;

const emit = (name, data) => listeners.forEach((l) => l[name] && l[name](data));
const ids = () => (Capacitor.getPlatform() === 'ios' ? AD_CONFIG.admob.ios : AD_CONFIG.admob.android);

async function initAdMob() {
  admobMod = await import('@capacitor-community/admob');
  AdMob = admobMod.AdMob;
  await AdMob.initialize({
    initializeForTesting: AD_CONFIG.admob.testing,
    tagForChildDirectedTreatment: AD_CONFIG.childDirected,
    tagForUnderAgeOfConsent: AD_CONFIG.childDirected,
    maxAdContentRating: admobMod.MaxAdContentRating?.General || AD_CONFIG.maxAdContentRating,
  });
  provider = 'admob';
  preloadInterstitial();
  preloadRewarded();
}

function adOpts(adId) {
  return { adId, isTesting: AD_CONFIG.admob.testing, npa: AD_CONFIG.nonPersonalizedAds };
}
async function preloadInterstitial() {
  try { await AdMob.prepareInterstitial(adOpts(ids().interstitial)); interstitialReady = true; }
  catch (e) { interstitialReady = false; }
}
async function preloadRewarded() {
  try { await AdMob.prepareRewardVideoAd(adOpts(ids().rewarded)); rewardedReady = true; }
  catch (e) { rewardedReady = false; setTimeout(preloadRewarded, 30000); }
}

function initH5() {
  const client = AD_CONFIG.web.adsenseClient;
  window.adsbygoogle = window.adsbygoogle || [];
  window.adBreak = window.adConfig = function (o) { window.adsbygoogle.push(o); };
  if (AD_CONFIG.nonPersonalizedAds) window.adsbygoogle.requestNonPersonalizedAds = 1;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  s.crossOrigin = 'anonymous';
  s.setAttribute('data-ad-client', client);
  s.setAttribute('data-ad-frequency-hint', `${AD_CONFIG.frequency.interstitialMinSeconds}s`);
  if (AD_CONFIG.web.adbreakTest) s.setAttribute('data-adbreak-test', AD_CONFIG.web.adbreakTest);
  document.head.appendChild(s);
  window.adConfig({ preloadAdBreaks: 'on', sound: 'on' });
  provider = 'h5';
}

export const AdService = {
  subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
  get provider() { return provider; },

  init() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      if (!AD_CONFIG.enabled) { provider = 'none'; return; }
      try {
        if (Capacitor.isNativePlatform()) await initAdMob();
        else if (AD_CONFIG.web.adsenseClient) initH5();
        else provider = AD_CONFIG.web.mockAds ? 'mock' : 'none';
      } catch (e) {
        console.warn('[Ads] init failed, continuing without ads', e);
        provider = AD_CONFIG.web.mockAds ? 'mock' : 'none';
      }
    })();
    return initPromise;
  },

  rewardedAvailable() {
    if (provider === 'admob') return rewardedReady;
    return provider === 'h5' || provider === 'mock';
  },

  async showBanner() {
    if (provider !== 'admob' || !AD_CONFIG.frequency.showBannerOnMenus || bannerShown) return;
    try {
      await AdMob.showBanner({
        ...adOpts(ids().banner),
        adSize: admobMod.BannerAdSize.ADAPTIVE_BANNER,
        position: admobMod.BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
      });
      bannerShown = true;
    } catch (e) { /* no fill – ignore */ }
  },

  async hideBanner() {
    if (provider !== 'admob' || !bannerShown) return;
    try { await AdMob.removeBanner(); } catch (e) { /* ignore */ }
    bannerShown = false;
  },

  /** Call ONLY at natural breaks (level end / game over). Frequency-capped. */
  async maybeShowInterstitial(placement = 'break') {
    if (provider === 'none') return;
    breakCount++;
    const f = AD_CONFIG.frequency;
    const now = Date.now() / 1000;
    if (breakCount % f.interstitialEveryNBreaks !== 0) return;
    if (now - lastInterstitial < f.interstitialMinSeconds) return;
    lastInterstitial = now;

    if (provider === 'admob') {
      if (!interstitialReady) { preloadInterstitial(); return; }
      emit('onAdStart');
      try { await AdMob.showInterstitial(); } catch (e) { /* ignore */ }
      interstitialReady = false;
      emit('onAdEnd');
      preloadInterstitial();
    } else if (provider === 'h5') {
      await new Promise((resolve) => {
        window.adBreak({
          type: 'next', name: placement,
          beforeAd: () => emit('onAdStart'),
          afterAd: () => emit('onAdEnd'),
          adBreakDone: () => resolve(),
        });
      });
    } else if (provider === 'mock') {
      emit('onAdStart');
      await new Promise((resolve) => emit('onMock', { type: 'interstitial', placement, done: resolve }));
      emit('onAdEnd');
    }
  },

  /** Player-chosen rewarded ad. Resolves true only if the reward was earned. */
  async showRewarded(placement = 'reward') {
    if (provider === 'admob') {
      if (!rewardedReady) { preloadRewarded(); return false; }
      emit('onAdStart');
      let ok = false;
      try { const r = await AdMob.showRewardVideoAd(); ok = !!r; } catch (e) { ok = false; }
      rewardedReady = false;
      emit('onAdEnd');
      preloadRewarded();
      return ok;
    }
    if (provider === 'h5') {
      return new Promise((resolve) => {
        let earned = false;
        window.adBreak({
          type: 'reward', name: placement,
          beforeAd: () => emit('onAdStart'),
          afterAd: () => emit('onAdEnd'),
          beforeReward: (showAdFn) => showAdFn(),
          adViewed: () => { earned = true; },
          adDismissed: () => { earned = false; },
          adBreakDone: () => resolve(earned),
        });
      });
    }
    if (provider === 'mock') {
      emit('onAdStart');
      const ok = await new Promise((resolve) => emit('onMock', { type: 'rewarded', placement, done: resolve }));
      emit('onAdEnd');
      return !!ok;
    }
    return false;
  },
};
