/*!
 * ==========================================
 * UZDUB Player
 * Core v3.0
 * https://uzdub.net
 * ==========================================
 */

class UZDUBPlayer {

    constructor(selector, options = {}) {

        this.selector = selector;

        this.container =
            typeof selector === "string"
                ? document.querySelector(selector)
                : selector;

        if (!this.container) {
            throw new Error(`UZDUB Player: Container "${selector}" not found.`);
        }

        this.options = options;

        this.video = null;
        this.ui = null;
        this.events = null;
        this.sources = null;
        this.vast = null;

        this.currentSource = null;
        this.currentType = null;
        this.isEmbed = false;
        this.started = false;
        this.prerollTag = null;
        this.prerollDone = false;

        // Ad state
        this._inAd = false;
        this._pauseAd = null;          // { img, url }
        this._pauseAdDismissed = false;

        this.isReady = false;
        this.isPlaying = false;
        this.volume = 1;
        this.muted = false;

        // Zoom & brightness state
        this._zoomScale = 1;
        this._brightness = 1;

        // Rotate lock state
        this._rotateLocked = false;
    }

    init() {

        this.ui = new UIManager(this);
        this.ui.build();

        this.video = this.ui.elements.video;

        this.sources = new SourceManager(this);
        this.events = new EventManager(this);
        this.events.bind();

        this.vast = new VastManager(this);

        // VAST ad state → _inAd (events.js buni tekshiradi)
        if (this.events && this.events.listen) {
            this.events.listen('vast:adBreakStart', () => { this._inAd = true; });
            this.events.listen('vast:adBreakEnd',   () => { this._inAd = false; });
            this.events.listen('vast:movieRestored',() => { this._inAd = false; });
        }

        this.isReady = true;
        return this;
    }

    /* ==========================
       Load
    ========================== */

    load(source) {

        if (typeof source === "string") source = { src: source };

        this.currentSource = source;
        this.currentType = (source.type || "").toLowerCase();
        this.started = false;
        this.prerollDone = false;
        this._pauseAdDismissed = false;

        // Pause-ad (pauzada banner reklama) — ixtiyoriy
        this._pauseAd = source.pauseAd && source.pauseAd.img ? source.pauseAd : null;

        this.isEmbed =
            this.sources.isEmbed(source.src) ||
            ["youtube", "okru", "mover", "embed"].includes(this.currentType);

        // Poster
        if (source.poster) {
            this.ui.setPoster(source.poster);
            this.ui.showPoster();
        }

        // Thumbnail hidden video (MP4/HLS only)
        if (!this.isEmbed && source.src) {
            this.ui.setupThumbnailSource(source.src);
        }

        // VAST reklama sozlamalari
        this.prerollTag = source.vast || source.preroll || null;

        if (this.vast) {
            const config = {};
            if (this.prerollTag) config.preroll = this.prerollTag;
            if (source.postroll) config.postroll = source.postroll;
            if (Array.isArray(source.midroll)) config.midroll = source.midroll;
            this.vast.configure(config);
        }

        return this;
    }

    /* ==========================
       Playback
    ========================== */

    play() {

        if (!this.video) return;

        // Resume an ad in progress
        if (this.vast && this.vast.isAdPlaying) {
            this.video.play().catch(() => {});
            return;
        }

        // First start: poster → (preroll) → content
        if (!this.started) {
            this.started = true;
            this.ui.hidePoster();
            this.ui.hideError();

            // Mobil uchun video elementni gesture bilan unlock qilamiz
            this._unlockVideo();

            if (this.prerollTag && !this.prerollDone) {
                this.prerollDone = true;

                if (this.vast) {
                    // VAST preroll
                    this.vast.playPreroll(this.prerollTag);
                } else {
                    this.startContent();
                }
                return;
            }

            this.startContent();
            return;
        }

        if (this.isEmbed) return;

        this.video.play().catch(() => {});
    }

    /* ==========================
       Mobil autoplay unlock
    ========================== */

    _unlockVideo() {
        if (!Utils.isMobile()) return;
        const v = this.video;
        if (!v) return;
        const wasMuted = v.muted;
        v.muted = true;
        const p = v.play();
        if (p && typeof p.then === "function") {
            p.then(() => {
                v.pause();
                v.muted = wasMuted;
                try { v.currentTime = 0; } catch (e) { /* ignore */ }
            }).catch(() => { v.muted = wasMuted; });
        }
    }

    startContent(state) {

        // Manba serverdan yoki HLS manifestdan javob kutayotgan paytda ham
        // foydalanuvchi qora/poster ekranni emas, loading indikatorini ko'rsin.
        // Iframe (YouTube/OK/Mover) ichidagi `playing` hodisasi tashqariga
        // chiqmaydi; ularda loaderni yoqsak u doimiy qolib ketadi.
        if (!this.isEmbed && this.ui) this.ui.showSpinner();
        this.sources.load(this.currentSource);

        if (this.isEmbed) return;

        const onMeta = () => {
            this.video.removeEventListener("loadedmetadata", onMeta);

            if (state) {
                try {
                    if (state.currentTime) this.video.currentTime = state.currentTime;
                } catch (e) { /* ignore */ }
                this.video.volume = state.volume;
                this.video.muted = state.muted;
                this.video.playbackRate = state.playbackRate || 1;
            }

            this.video.play().catch(() => {});
        };

        this.video.addEventListener("loadedmetadata", onMeta);
    }

    resumeAfterAd(state) {
        this.ui.hidePoster();
        this.startContent(state);
    }

    pause() {
        if (!this.video) return;
        this.video.pause();
    }

    toggle() {
        if (!this.video) return;
        if (!this.started || this.video.paused) {
            this.play();
        } else {
            this.pause();
        }
    }

    seek(seconds) {
        if (!this.video || !isFinite(this.video.duration)) return;
        this.video.currentTime = Utils.clamp(seconds, 0, this.video.duration);
    }

    setVolume(value) {
        if (!this.video) return;
        value = Utils.clamp(value, 0, 1);
        this.volume = value;
        this.video.volume = value;
        this.video.muted = value === 0;
    }

    mute() {
        if (!this.video) return;
        this.video.muted = true;
        this.muted = true;
    }

    unmute() {
        if (!this.video) return;
        this.video.muted = false;
        this.muted = false;
    }

    toggleMute() {
        if (this.video.muted) {
            this.unmute();
        } else {
            this.mute();
        }
    }

    setPlaybackRate(rate) {
        if (!this.video) return;
        this.video.playbackRate = rate;
    }

    /* ==========================
       Zoom (pinch gesture)
    ========================== */

    setZoom(scale) {
        this._zoomScale = Utils.clamp(scale, 0.5, 3.0);
        this.video.style.transformOrigin = "center center";
        this.video.style.transform = this._zoomScale !== 1
            ? `scale(${this._zoomScale})`
            : "";
    }

    /* ==========================
       Brightness (swipe left/right)
    ========================== */

    setBrightness(value) {
        this._brightness = Utils.clamp(value, 0.1, 2.0);
        this.video.style.filter = this._brightness !== 1
            ? `brightness(${this._brightness})`
            : "";
    }

    /* ==========================
       Picture in Picture
    ========================== */

    async pip() {
        if (!document.pictureInPictureEnabled) return;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await this.video.requestPictureInPicture();
            }
        } catch (e) {
            this.ui.showToast("PiP rejimi ishlamadi");
        }
    }

    /* ==========================
       Fullscreen + Landscape
    ========================== */

    fullscreen() {

        const wrapper = this.ui.elements.wrapper;
        const isFull = document.fullscreenElement || document.webkitFullscreenElement;

        if (!isFull) {

            const request =
                wrapper.requestFullscreen ||
                wrapper.webkitRequestFullscreen;

            if (request) {
                Promise.resolve(request.call(wrapper))
                    .then(() => this.lockOrientation())
                    .catch(() => this.lockOrientation());
            } else if (this.video.webkitEnterFullscreen) {
                // iOS Safari native fullscreen
                this.video.webkitEnterFullscreen();
            }

        } else {

            const exit = document.exitFullscreen || document.webkitExitFullscreen;
            if (exit) exit.call(document);
            this.unlockOrientation();

        }
    }

    lockOrientation() {
        if (!Utils.isMobile()) return;

        if (
            screen.orientation &&
            typeof screen.orientation.lock === "function"
        ) {
            screen.orientation.lock("landscape").catch(() => {
                // API rejected (e.g. not triggered by user gesture or not supported)
                this.ui.showToast("📱 Telefonni yonbosh (landscape) qiling");
            });
        } else {
            // Orientation API not supported — ask user manually
            this.ui.showToast("📱 Telefonni yonbosh (landscape) qiling");
        }
    }

    unlockOrientation() {
        if (this._rotateLocked) return; // User explicitly locked it
        try {
            if (screen.orientation && typeof screen.orientation.unlock === "function") {
                screen.orientation.unlock();
            }
        } catch (e) { /* ignore */ }
    }

    /* ==========================
       Rotate Lock Toggle (user-controlled)
    ========================== */

    toggleRotateLock() {
        this._rotateLocked = !this._rotateLocked;
        this.ui.setRotateLockIcon(this._rotateLocked);

        if (this._rotateLocked) {
            this.lockOrientation();
            this.ui.showToast("🔒 Ekran qulflandi");
        } else {
            try {
                if (screen.orientation && typeof screen.orientation.unlock === "function") {
                    screen.orientation.unlock();
                }
            } catch (e) { /* ignore */ }
            this.ui.showToast("🔓 Ekran qulfi ochildi");
        }
    }

    /* ==========================
       Destroy
    ========================== */

    destroy() {
        if (this.vast) this.vast.destroy();
        if (this.events) this.events.destroy();
        if (this.sources) this.sources.destroy();

        this.container.innerHTML = "";

        this.video = null;
        this.ui = null;
        this.events = null;
        this.sources = null;
        this.vast = null;
        this.isReady = false;
    }

}
