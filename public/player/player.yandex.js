/*!
 * ==========================================
 * UZDUB Player
 * Yandex Video Ads Manager v4.0  (FreeKino-style)
 * https://uzdub.net
 * ==========================================
 *
 * Yandex Video Ads SDK (adsdk.js) — RSY InStream: preroll, midroll, postroll.
 * Rasmiy hujjat: https://yandex.ru/dev/video-sdk/doc/ru/sdk-html5/adsdk-module
 *
 * FreeKino usuli (jonli saytdan o'rganilgan):
 *   AdLoader.create(cfg) → loadAd() → preload({videoSlot, desiredBitrate})
 *   → createPlaybackController(adVideo, slot) → subscribe(...) → playAd()
 *   + adLoadTimeout (7s) — reklama yuklanmasa kontentga o'tadi (loading qotmaydi)
 *   + cancellation guard
 *   + alohida adVideo elementi (kontent videosiga tegilmaydi)
 */

class YandexAdsManager {

    constructor(player, config = {}) {
        this.player = player;
        this.config = config;

        this.adLoadTimeout = config.adLoadTimeout || 7000;

        this._sdkLoaded  = false;
        this._sdkPromise = null;
        this._cancelled  = false;

        this._midrollFired   = false;
        this._postrollFired  = false;
        this._midrollListener  = null;
        this._postrollListener = null;
    }

    /* ------------------------------------------------------------------ */
    /*  SDK Loader (idempotent)                                             */
    /* ------------------------------------------------------------------ */

    loadSdk() {
        if (this._sdkPromise) return this._sdkPromise;

        this._sdkPromise = new Promise((resolve) => {
            if (window.ya && window.ya.videoAd) {
                this._sdkLoaded = true;
                resolve();
                return;
            }
            const s   = document.createElement('script');
            s.src     = 'https://yandex.ru/ads/system/adsdk.js';
            s.async   = true;
            s.onload  = () => { this._sdkLoaded = true; resolve(); };
            s.onerror = () => resolve(); // yuklanmasa reklamasiz davom
            document.head.appendChild(s);
        });

        return this._sdkPromise;
    }

    /* ------------------------------------------------------------------ */
    /*  Ad play helper (FreeKino pipeline + timeout + cancel guard)         */
    /* ------------------------------------------------------------------ */

    /**
     * @param {Object}   params  - { partnerId, category, impId? }
     * @param {Function} onStop  - reklama tugaganda
     * @param {Function} onError - xato / timeout yuz berganda
     */
    _playAd(params, onStop, onError) {

        if (this._cancelled || !window.ya || !window.ya.videoAd) {
            onError && onError();
            return;
        }

        const player  = this.player;
        const ui      = player.ui;
        const video   = player.video;
        const adVideo = ui.elements.adVideo;
        const slot    = ui.elements.adLayer;

        // Ad layer: adVideo ko'rinadi, loading spinner aylanadi
        player._inAd = true;
        ui.showAdLayerYandex();
        ui.showAdLoading();

        let done      = false;
        let cancelled = false;

        const finish = (cb) => {
            if (done) return;
            done = true;
            clearTimeout(timeoutId);
            player._inAd = false;
            ui.hideAdLoading();
            ui.hideAdLayer();
            cb && cb();
        };

        // adLoadTimeout — reklama yuklanmasa kontentga o'tamiz
        const timeoutId = setTimeout(() => {
            cancelled = true;
            finish(onError);
        }, this.adLoadTimeout);

        const guard = (v) => {
            if (cancelled || this._cancelled) throw new Error('cancelled');
            return v;
        };

        // Ad konfiguratsiyasi
        const adConfig = {
            partnerId:            params.partnerId,
            category:             params.category,
            targetRef:            window.location.href,
            videoContentUrl:      (player.currentSource && player.currentSource.src) || window.location.href,
            videoContentDuration: isFinite(video.duration) ? video.duration : 0,
        };
        if (params.impId !== undefined) adConfig.impId = params.impId;

        window.ya.videoAd
            .loadModule('AdLoader')
            .then(guard)
            .then((module) => module.AdLoader.create(adConfig))
            .then(guard)
            .then((adLoader) => adLoader.loadAd())
            .then(guard)
            .then((adStore) => {
                // preload — ad-video elementini oldindan tayyorlaydi (mobil uchun muhim)
                if (typeof adStore.preload === 'function') {
                    return adStore.preload({ videoSlot: adVideo, desiredBitrate: 1000 })
                        .then(() => adStore, () => adStore);
                }
                return adStore;
            })
            .then(guard)
            .then((adStore) => {
                clearTimeout(timeoutId); // yuklandi — endi timeout kerak emas

                const controller = adStore.createPlaybackController(adVideo, slot);

                controller.subscribe('AdStarted',       () => ui.hideAdLoading());
                controller.subscribe('AdStopped',       () => finish(onStop));
                controller.subscribe('AdSkipped',       () => finish(onStop));
                controller.subscribe('AdError',         () => finish(onError));
                controller.subscribe('AllAdsCompleted', () => finish(onStop));

                controller.playAd();
            })
            .catch(() => finish(onError));
    }

    /* ------------------------------------------------------------------ */
    /*  Preroll                                                             */
    /* ------------------------------------------------------------------ */

    async playPreroll() {

        if (this._cancelled) return;

        if (!this.config.preroll || !this.config.preroll.partnerId) {
            this.player.startContent();
            return;
        }

        await this.loadSdk();

        if (this._cancelled) return;

        if (!this._sdkLoaded) {
            this.player.startContent();
            return;
        }

        const proceed = () => {
            this._setupMidroll();
            this._setupPostroll();
            this.player.startContent();
        };

        this._playAd(this.config.preroll, proceed, proceed);
    }

    /* ------------------------------------------------------------------ */
    /*  Midroll                                                             */
    /* ------------------------------------------------------------------ */

    _setupMidroll() {
        if (!this.config.midroll || !this.config.midroll.partnerId) return;

        const video      = this.player.video;
        const targetTime = this.config.midroll.time || 30;

        const listener = () => {
            if (this._midrollFired) return;
            if (video.currentTime < targetTime) return;

            this._midrollFired = true;
            video.removeEventListener('timeupdate', listener);
            video.pause();

            this._playAd(
                this.config.midroll,
                () => video.play().catch(() => {}),
                () => video.play().catch(() => {})
            );
        };

        this._midrollListener = listener;
        video.addEventListener('timeupdate', listener);
    }

    /* ------------------------------------------------------------------ */
    /*  Postroll                                                            */
    /* ------------------------------------------------------------------ */

    _setupPostroll() {
        if (!this.config.postroll || !this.config.postroll.partnerId) return;

        const video = this.player.video;

        const listener = () => {
            if (this._postrollFired) return;
            this._postrollFired = true;
            video.removeEventListener('ended', listener);
            this._playAd(this.config.postroll, null, null);
        };

        this._postrollListener = listener;
        video.addEventListener('ended', listener);
    }

    /* ------------------------------------------------------------------ */
    /*  Destroy                                                             */
    /* ------------------------------------------------------------------ */

    destroy() {
        this._cancelled = true;
        const video = this.player.video;
        if (!video) return;
        if (this._midrollListener)  video.removeEventListener('timeupdate', this._midrollListener);
        if (this._postrollListener) video.removeEventListener('ended',      this._postrollListener);
    }
}
