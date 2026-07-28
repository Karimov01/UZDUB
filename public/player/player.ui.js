/*!
 * ==========================================
 * UZDUB Player
 * UI Manager v4.0  (FreeKino-style DOM)
 * https://uzdub.net
 * ==========================================
 */

class UIManager {

    constructor(player) {
        this.player   = player;
        this.elements = {};
        this._toastTimer  = null;
        this._osdTimer    = null;
        this._rippleTimer = null;
        this._skipTimer   = null;
    }

    /* ------------------------------------------------------------------ */
    /*  Build DOM                                                           */
    /* ------------------------------------------------------------------ */

    build() {

        const w = this.player.container;
        w.className = 'uzdub uzdub-never-played';
        w.setAttribute('tabindex', '0');

        const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
        const speedItems = speeds.map(r =>
            `<button class="uzdub-menu-item uzdub-speed-item${r === 1 ? ' uzdub-active' : ''}" data-rate="${r}">` +
            `<span>${r}x</span>` +
            `<span class="uzdub-check">${r === 1 ? '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' : ''}</span>` +
            `</button>`
        ).join('');

        w.innerHTML =
        '<video class="uzdub-video" playsinline webkit-playsinline preload="none" x-webkit-airplay="allow"></video>' +
        '<div class="uzdub-poster-bg"></div>' +
        '<div class="uzdub-poster"></div>' +
        '<div class="uzdub-embed"></div>' +

        '<div class="uzdub-ad-layer">' +
          '<video class="uzdub-ad-video" playsinline webkit-playsinline></video>' +
          '<div class="uzdub-ad-top">' +
            '<span class="uzdub-ad-label-text">Reklama</span>' +
            '<span class="uzdub-ad-counter"></span>' +
          '</div>' +
          '<button class="uzdub-ad-skip uzdub-ad-skip-wait" type="button">' +
            '<span class="uzdub-ad-skip-ring">' +
              '<svg viewBox="0 0 36 36" class="uzdub-ad-skip-circle">' +
                '<circle cx="18" cy="18" r="15" class="uzdub-ad-skip-circle-bg"></circle>' +
                '<circle cx="18" cy="18" r="15" class="uzdub-ad-skip-circle-fg"></circle>' +
              '</svg>' +
              '<span class="uzdub-ad-skip-num"></span>' +
            '</span>' +
            '<span class="uzdub-ad-skip-text">O\'tkazib yuborish</span>' +
          '</button>' +
          '<button class="uzdub-ad-vol-btn" type="button" aria-label="Ovoz">' +
            '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>' +
          '</button>' +
          '<div class="uzdub-ad-clickzone"></div>' +
          '<div class="uzdub-ad-loading">' +
            '<div class="uzdub-ad-loading-spinner"><div></div><div></div><div></div><div></div></div>' +
            '<div class="uzdub-ad-loading-text">Reklama yuklanmoqda...</div>' +
          '</div>' +
        '</div>' +

        '<div class="uzdub-gesture">' +
          '<div class="uzdub-gesture-left"></div>' +
          '<div class="uzdub-gesture-mid"></div>' +
          '<div class="uzdub-gesture-right"></div>' +
        '</div>' +

        '<div class="uzdub-ripple"><span class="uzdub-ripple-label"></span></div>' +

        '<button class="uzdub-big-play" type="button" aria-label="Ijro">' +
          '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
        '</button>' +

        '<div class="uzdub-hold-speed">' +
          '<span class="uzdub-hold-speed-icon">►►</span>' +
          '<span class="uzdub-hold-speed-x">2x</span>' +
        '</div>' +

        '<div class="uzdub-spinner"><div></div><div></div><div></div><div></div></div>' +

        '<div class="uzdub-pause-ad">' +
          '<a class="uzdub-pause-ad-link" target="_blank" rel="noopener noreferrer">' +
            '<img class="uzdub-pause-ad-img" alt="Reklama">' +
          '</a>' +
          '<button class="uzdub-pause-ad-close" type="button" aria-label="Yopish">\xd7</button>' +
          '<span class="uzdub-pause-ad-label">Reklama</span>' +
        '</div>' +

        '<button class="uzdub-skip-seg" type="button"></button>' +
        '<span class="uzdub-chapter-title"></span>' +

        '<div class="uzdub-plist-bar">' +
          '<button class="uzdub-plist-btn uzdub-plist-season" type="button" style="display:none">' +
            '<span class="uzdub-plist-value">1</span>' +
            '<span class="uzdub-plist-sfx">-fasl</span>' +
            '<span class="uzdub-plist-chev">▾</span>' +
          '</button>' +
          '<button class="uzdub-plist-btn uzdub-plist-episode" type="button" style="display:none">' +
            '<span class="uzdub-plist-value">1</span>' +
            '<span class="uzdub-plist-total"></span>' +
            '<span class="uzdub-plist-sfx">-qism</span>' +
            '<span class="uzdub-plist-chev">▾</span>' +
          '</button>' +
        '</div>' +
        '<div class="uzdub-plist-menu"></div>' +

        '<div class="uzdub-next-ep">' +
          '<div class="uzdub-next-ep-thumb"></div>' +
          '<div class="uzdub-next-ep-info">' +
            '<div class="uzdub-next-ep-label">Keyingi qism</div>' +
            '<div class="uzdub-next-ep-title"></div>' +
            '<div class="uzdub-next-ep-countdown"><span class="uzdub-next-ep-sec">10</span> soniyadan keyin</div>' +
          '</div>' +
          '<button class="uzdub-next-ep-play" type="button">Hozir</button>' +
          '<button class="uzdub-next-ep-close" type="button" aria-label="Bekor qilish">\xd7</button>' +
        '</div>' +

        '<div class="uzdub-resume">' +
          '<div class="uzdub-resume-msg"></div>' +
          '<div class="uzdub-resume-btns">' +
            '<button class="uzdub-resume-btn uzdub-resume-continue" type="button">Davom ettirish</button>' +
            '<button class="uzdub-resume-btn uzdub-resume-restart" type="button">Boshidan</button>' +
          '</div>' +
        '</div>' +

        '<div class="uzdub-error">' +
          '<div class="uzdub-error-icon">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" width="56" height="56"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>' +
          '</div>' +
          '<div class="uzdub-error-msg">Video yuklanmadi</div>' +
          '<button class="uzdub-error-retry" type="button">Qayta urinish</button>' +
        '</div>' +

        '<div class="uzdub-controls">' +
          '<div class="uzdub-progress-wrap">' +
            '<div class="uzdub-progress-hit">' +
              '<div class="uzdub-progress-bg"></div>' +
              '<div class="uzdub-progress-buffer"></div>' +
              '<div class="uzdub-progress-played"></div>' +
              '<div class="uzdub-progress-handle"></div>' +
              '<div class="uzdub-progress-hover"></div>' +
            '</div>' +
          '</div>' +
          '<div class="uzdub-row">' +
            '<div class="uzdub-row-left">' +
              '<button class="uzdub-btn uzdub-play-btn" type="button" aria-label="Ijro/Pauza">' +
                '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
              '</button>' +
              '<div class="uzdub-vol-wrap">' +
                '<button class="uzdub-btn uzdub-mute-btn" type="button" aria-label="Ovoz">' +
                  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>' +
                '</button>' +
                '<div class="uzdub-vol-slider">' +
                  '<div class="uzdub-vol-fill" style="width:100%"></div>' +
                  '<div class="uzdub-vol-handle" style="left:100%"></div>' +
                '</div>' +
              '</div>' +
              '<div class="uzdub-time"><span class="uzdub-cur">0:00</span> / <span class="uzdub-dur">0:00</span></div>' +
            '</div>' +
            '<div class="uzdub-row-right">' +
              '<button class="uzdub-btn uzdub-settings-btn" type="button" aria-label="Sozlamalar">' +
                '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94 0 .31.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>' +
                '<span class="uzdub-hd-badge" style="display:none">HD</span>' +
              '</button>' +
              '<button class="uzdub-btn uzdub-pip-btn" type="button" aria-label="PiP">' +
                '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/></svg>' +
              '</button>' +
              '<button class="uzdub-btn uzdub-fs-btn" type="button" aria-label="To\'liq ekran">' +
                '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="uzdub-menu" hidden>' +
          '<div class="uzdub-menu-page" data-page="main">' +
            '<button class="uzdub-menu-row" data-action="quality"><span>Sifat</span>' +
              '<span class="uzdub-menu-val">Auto <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg></span>' +
            '</button>' +
            '<button class="uzdub-menu-row" data-action="speed"><span>Ijro tezligi</span>' +
              '<span class="uzdub-menu-val uzdub-speed-val">1x <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg></span>' +
            '</button>' +
          '</div>' +
          '<div class="uzdub-menu-page" data-page="quality" style="display:none">' +
            '<button class="uzdub-menu-back" data-back="main"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg> Sifat</button>' +
            '<div class="uzdub-menu-quality-info">Video sifati sizning internet tezligingizga qarab avtomatik sozlanadi.</div>' +
          '</div>' +
          '<div class="uzdub-menu-page" data-page="speed" style="display:none">' +
            '<button class="uzdub-menu-back" data-back="main"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg> Ijro tezligi</button>' +
            speedItems +
          '</div>' +
        '</div>' +

        '<div class="uzdub-thumbnail">' +
          '<canvas class="uzdub-thumb-canvas" width="160" height="90"></canvas>' +
          '<span class="uzdub-thumb-time"></span>' +
        '</div>' +
        '<video class="uzdub-thumb-video" muted preload="metadata" playsinline></video>' +

        '<div class="uzdub-vol-indicator">' +
          '<div class="uzdub-vol-bar"><div></div></div>' +
          '<span class="uzdub-vol-pct">100%</span>' +
        '</div>' +

        '<div class="uzdub-toast"></div>' +
        '<div class="uzdub-watermark"><span>UZDUB</span><small>Media</small></div>';

        this.cache();
    }

    /* ------------------------------------------------------------------ */
    /*  Cache elements                                                      */
    /* ------------------------------------------------------------------ */

    cache() {

        const w = this.player.container;
        const q = (s) => w.querySelector(s);

        this.elements = {
            wrapper:        w,
            video:          q('.uzdub-video'),
            adVideo:        q('.uzdub-ad-video'),
            posterBg:       q('.uzdub-poster-bg'),
            poster:         q('.uzdub-poster'),
            embed:          q('.uzdub-embed'),

            adLayer:        q('.uzdub-ad-layer'),
            adLabelText:    q('.uzdub-ad-label-text'),
            adCounter:      q('.uzdub-ad-counter'),
            adSkip:         q('.uzdub-ad-skip'),
            adSkipNum:      q('.uzdub-ad-skip-num'),
            adSkipCircleFg: q('.uzdub-ad-skip-circle-fg'),
            adSkipText:     q('.uzdub-ad-skip-text'),
            adVolBtn:       q('.uzdub-ad-vol-btn'),
            adClickzone:    q('.uzdub-ad-clickzone'),
            adLoading:      q('.uzdub-ad-loading'),

            gesture:        q('.uzdub-gesture'),
            gestureLeft:    q('.uzdub-gesture-left'),
            gestureMid:     q('.uzdub-gesture-mid'),
            gestureRight:   q('.uzdub-gesture-right'),

            ripple:         q('.uzdub-ripple'),
            rippleLabel:    q('.uzdub-ripple-label'),

            bigPlay:        q('.uzdub-big-play'),
            holdSpeed:      q('.uzdub-hold-speed'),
            spinner:        q('.uzdub-spinner'),

            pauseAd:        q('.uzdub-pause-ad'),
            pauseAdLink:    q('.uzdub-pause-ad-link'),
            pauseAdImg:     q('.uzdub-pause-ad-img'),
            pauseAdClose:   q('.uzdub-pause-ad-close'),

            skipSeg:        q('.uzdub-skip-seg'),
            chapterTitle:   q('.uzdub-chapter-title'),

            plistBar:       q('.uzdub-plist-bar'),
            plistSeason:    q('.uzdub-plist-season'),
            plistEpisode:   q('.uzdub-plist-episode'),
            plistMenu:      q('.uzdub-plist-menu'),

            nextEp:         q('.uzdub-next-ep'),
            nextEpThumb:    q('.uzdub-next-ep-thumb'),
            nextEpTitle:    q('.uzdub-next-ep-title'),
            nextEpSec:      q('.uzdub-next-ep-sec'),
            nextEpPlay:     q('.uzdub-next-ep-play'),
            nextEpClose:    q('.uzdub-next-ep-close'),

            resume:         q('.uzdub-resume'),
            resumeMsg:      q('.uzdub-resume-msg'),
            resumeContinue: q('.uzdub-resume-continue'),
            resumeRestart:  q('.uzdub-resume-restart'),

            error:          q('.uzdub-error'),
            errorMsg:       q('.uzdub-error-msg'),
            errorRetry:     q('.uzdub-error-retry'),

            controls:       q('.uzdub-controls'),
            progressWrap:   q('.uzdub-progress-wrap'),
            progressHit:    q('.uzdub-progress-hit'),
            progressBuffer: q('.uzdub-progress-buffer'),
            progressPlayed: q('.uzdub-progress-played'),
            progressHandle: q('.uzdub-progress-handle'),
            progressHover:  q('.uzdub-progress-hover'),

            playBtn:        q('.uzdub-play-btn'),
            volWrap:        q('.uzdub-vol-wrap'),
            muteBtn:        q('.uzdub-mute-btn'),
            volSlider:      q('.uzdub-vol-slider'),
            volFill:        q('.uzdub-vol-fill'),
            volHandle:      q('.uzdub-vol-handle'),
            cur:            q('.uzdub-cur'),
            dur:            q('.uzdub-dur'),

            settingsBtn:    q('.uzdub-settings-btn'),
            hdBadge:        q('.uzdub-hd-badge'),
            pipBtn:         q('.uzdub-pip-btn'),
            fsBtn:          q('.uzdub-fs-btn'),

            menu:           q('.uzdub-menu'),
            speedVal:       q('.uzdub-speed-val'),
            speedItems:     w.querySelectorAll('.uzdub-speed-item'),

            thumbnail:      q('.uzdub-thumbnail'),
            thumbCanvas:    q('.uzdub-thumb-canvas'),
            thumbTime:      q('.uzdub-thumb-time'),
            thumbVideo:     q('.uzdub-thumb-video'),

            volIndicator:   q('.uzdub-vol-indicator'),
            volBar:         q('.uzdub-vol-bar > div'),
            volPct:         q('.uzdub-vol-pct'),

            toast:          q('.uzdub-toast'),
            brand:          q('.uzdub-watermark'),
        };
    }

    /* ------------------------------------------------------------------ */
    /*  Poster                                                              */
    /* ------------------------------------------------------------------ */

    setPoster(url) {
        this.elements.posterBg.style.backgroundImage = `url("${url}")`;
        this.elements.poster.style.backgroundImage   = `url("${url}")`;
    }

    showPoster() { this.elements.wrapper.classList.add('uzdub-never-played'); }
    hidePoster() { this.elements.wrapper.classList.remove('uzdub-never-played'); }

    /* ------------------------------------------------------------------ */
    /*  Spinner                                                             */
    /* ------------------------------------------------------------------ */

    showSpinner() { this.elements.spinner.style.display = ''; }
    hideSpinner() { this.elements.spinner.style.display = 'none'; }

    /* ------------------------------------------------------------------ */
    /*  Error                                                               */
    /* ------------------------------------------------------------------ */

    showError(msg) {
        if (msg) this.elements.errorMsg.textContent = msg;
        this.elements.error.classList.add('uzdub-visible');
        this.hideSpinner();
    }

    hideError() { this.elements.error.classList.remove('uzdub-visible'); }

    /* ------------------------------------------------------------------ */
    /*  Time & progress                                                     */
    /* ------------------------------------------------------------------ */

    updateTime(current, duration) {
        this.elements.cur.textContent = Utils.formatTime(current);
        if (isFinite(duration) && duration > 0) {
            this.elements.dur.textContent = Utils.formatTime(duration);
        }
    }

    updateProgress(pct) {
        const p = (pct * 100).toFixed(3) + '%';
        this.elements.progressPlayed.style.width = p;
        this.elements.progressHandle.style.left  = p;
    }

    updateBuffer(pct) {
        this.elements.progressBuffer.style.width = (pct * 100).toFixed(3) + '%';
    }

    /* ------------------------------------------------------------------ */
    /*  Play / Mute / Fullscreen icons                                      */
    /* ------------------------------------------------------------------ */

    setPlayIcon(playing) {
        this.elements.playBtn.innerHTML = playing
            ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        this.elements.wrapper.classList.toggle('uzdub-playing', playing);
        this.elements.wrapper.classList.toggle('uzdub-paused', !playing);
    }

    setMuteIcon(muted, vol) {
        let path;
        if (muted || vol === 0) {
            path = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
        } else if (vol < 0.5) {
            path = '<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>';
        } else {
            path = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
        }
        this.elements.muteBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor">' + path + '</svg>';
    }

    setFullscreenIcon(isFull) {
        this.elements.fsBtn.innerHTML = isFull
            ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';
    }

    setRotateLockIcon() { /* future */ }

    /* ------------------------------------------------------------------ */
    /*  Volume slider fill                                                  */
    /* ------------------------------------------------------------------ */

    setVolumeFill(vol) {
        const pct = (vol * 100).toFixed(1) + '%';
        this.elements.volFill.style.width  = pct;
        this.elements.volHandle.style.left = pct;
    }

    /* ------------------------------------------------------------------ */
    /*  HD badge                                                            */
    /* ------------------------------------------------------------------ */

    setHdBadge(label) {
        const el = this.elements.hdBadge;
        if (label) {
            el.textContent = label;
            el.style.display = 'block';
            el.className = 'uzdub-hd-badge' + (label === '4K' ? ' uzdub-hd-4k' : '');
        } else {
            el.style.display = 'none';
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Toast                                                               */
    /* ------------------------------------------------------------------ */

    showToast(msg, duration) {
        duration = duration || 3000;
        const el = this.elements.toast;
        el.textContent = msg;
        el.classList.add('uzdub-visible');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => el.classList.remove('uzdub-visible'), duration);
    }

    /* ------------------------------------------------------------------ */
    /*  Volume OSD (right-side bar)                                         */
    /* ------------------------------------------------------------------ */

    showVolumeOSD(vol) {
        const pct = Math.round(vol * 100);
        this.elements.volBar.style.height = pct + '%';
        this.elements.volPct.textContent  = pct + '%';
        this.elements.volIndicator.classList.add('uzdub-visible');
        clearTimeout(this._osdTimer);
        this._osdTimer = setTimeout(() => {
            this.elements.volIndicator.classList.remove('uzdub-visible');
        }, 1800);
    }

    /* ------------------------------------------------------------------ */
    /*  Center ripple (tap / seek feedback)                                 */
    /* ------------------------------------------------------------------ */

    showCenterFlash(label) {
        const el = this.elements.ripple;
        this.elements.rippleLabel.textContent = label || '';
        el.classList.remove('uzdub-ripple-active');
        void el.offsetWidth;
        el.classList.add('uzdub-ripple-active');
        clearTimeout(this._rippleTimer);
        this._rippleTimer = setTimeout(() => el.classList.remove('uzdub-ripple-active'), 700);
    }

    /* ------------------------------------------------------------------ */
    /*  Thumbnail preview                                                   */
    /* ------------------------------------------------------------------ */

    showThumbnail(x, timeStr) {
        const el  = this.elements.thumbnail;
        el.style.display = '';
        this.elements.thumbTime.textContent = timeStr;
        const pw  = this.elements.progressWrap.getBoundingClientRect().width;
        const tw  = el.offsetWidth || 160;
        el.style.left = Math.max(8, Math.min(x - tw / 2, pw - tw - 8)) + 'px';
    }

    hideThumbnail() { this.elements.thumbnail.style.display = 'none'; }

    setupThumbnailSource(src) {
        const tv = this.elements.thumbVideo;
        if (/\.mp4($|\?)/i.test(src)) {
            tv.src = src;
        } else {
            tv.removeAttribute('src');
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Ad layer                                                            */
    /* ------------------------------------------------------------------ */

    /** Yandex: adVideo visible (fills black background behind SDK controls) */
    showAdLayerYandex() {
        this.elements.adVideo.style.display = 'block'; // CSS default = none, shuning uchun aniq 'block'
        this.elements.adSkip.style.display  = 'none';  // SDK injects its own
        // Yandex o'z UI'sini beradi — bizning VAST bezaklarini yashiramiz (skip bosilishi uchun)
        this.elements.adLayer.classList.add('uzdub-ad-yandex');
        this.showAdLayer();
    }

    /** VAST: adVideo hidden, main video shows through transparent adLayer */
    showAdLayerVast() {
        this.elements.adVideo.style.display = 'none';
        this.elements.adLayer.classList.remove('uzdub-ad-yandex');
        this.showAdLayer();
    }

    showAdLayer() {
        this.elements.adLayer.style.display = 'block';
        this.elements.wrapper.classList.add('uzdub-in-ad');
    }

    hideAdLayer() {
        this.elements.adLayer.style.display = 'none';
        this.elements.adVideo.style.display = 'none';
        this.elements.adLayer.classList.remove('uzdub-ad-yandex');
        this.elements.wrapper.classList.remove('uzdub-in-ad');
        clearInterval(this._skipTimer);
    }

    showAdLoading() { this.elements.adLoading.classList.add('uzdub-visible'); }
    hideAdLoading() { this.elements.adLoading.classList.remove('uzdub-visible'); }

    setAdCounter(text) {
        const el = this.elements.adCounter;
        el.textContent  = text || '';
        el.style.display = text ? 'inline' : 'none';
    }

    showAdSkip(skipDelaySec) {
        const el    = this.elements.adSkip;
        const circ  = this.elements.adSkipCircleFg;
        const numEl = this.elements.adSkipNum;
        const r     = 15;
        const len   = 2 * Math.PI * r; // ≈ 94.25

        circ.style.strokeDasharray  = len;
        circ.style.strokeDashoffset = 0;

        el.style.display = 'flex';
        el.classList.remove('uzdub-ad-skip-ready');
        el.classList.add('uzdub-ad-skip-wait');

        if (skipDelaySec <= 0) { this.enableAdSkip(); return; }

        numEl.textContent = skipDelaySec;
        let remaining = skipDelaySec;

        clearInterval(this._skipTimer);
        this._skipTimer = setInterval(() => {
            remaining--;
            circ.style.strokeDashoffset =
                ((skipDelaySec - remaining) / skipDelaySec * len).toFixed(2);

            if (remaining <= 0) {
                clearInterval(this._skipTimer);
                this.enableAdSkip();
            } else {
                numEl.textContent = remaining;
            }
        }, 1000);
    }

    enableAdSkip() {
        this.elements.adSkipNum.textContent = '';
        this.elements.adSkip.classList.remove('uzdub-ad-skip-wait');
        this.elements.adSkip.classList.add('uzdub-ad-skip-ready');
        this.elements.adSkipText.textContent = "O'tkazib yuborish ›";
    }

    updateAdSkipCountdown(n) {
        this.elements.adSkipNum.textContent = Math.ceil(n);
    }

    /* ------------------------------------------------------------------ */
    /*  Pause-ad banner                                                     */
    /* ------------------------------------------------------------------ */

    showPauseAd(imgUrl, clickUrl) {
        if (!imgUrl) return;
        this.elements.pauseAdImg.src   = imgUrl;
        this.elements.pauseAdLink.href = clickUrl || '#';
        this.elements.pauseAd.classList.add('uzdub-visible');
    }

    hidePauseAd() { this.elements.pauseAd.classList.remove('uzdub-visible'); }

    /* ------------------------------------------------------------------ */
    /*  Settings menu                                                       */
    /* ------------------------------------------------------------------ */

    openSettingsMenu()  { this.showMenuPage('main'); this.elements.menu.removeAttribute('hidden'); }
    closeSettingsMenu() { this.elements.menu.setAttribute('hidden', ''); }
    toggleSettingsMenu() {
        this.elements.menu.hasAttribute('hidden') ? this.openSettingsMenu() : this.closeSettingsMenu();
    }

    showMenuPage(name) {
        this.elements.menu.querySelectorAll('.uzdub-menu-page').forEach(p => {
            p.style.display = p.dataset.page === name ? '' : 'none';
        });
    }

    setSpeedActive(rate) {
        this.elements.speedItems.forEach(btn => {
            const active = parseFloat(btn.dataset.rate) === rate;
            btn.classList.toggle('uzdub-active', active);
            btn.querySelector('.uzdub-check').innerHTML = active
                ? '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
                : '';
        });
        const sv = this.elements.speedVal;
        if (sv) {
            sv.innerHTML = rate + 'x <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>';
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Idle / cursor hide                                                  */
    /* ------------------------------------------------------------------ */

    setIdle(idle) {
        this.elements.wrapper.classList.toggle('uzdub-idle', idle);
        if (idle) this.elements.wrapper.classList.add('uzdub-cursor-hidden');
        else      this.elements.wrapper.classList.remove('uzdub-cursor-hidden');
    }

    /* ------------------------------------------------------------------ */
    /*  VastManager compatibility aliases (safeCall won't throw)            */
    /* ------------------------------------------------------------------ */

    showAdOverlay()              { this.showAdLayerVast(); this.showAdLoading(); }
    hideAdOverlay()              { this.hideAdLayer(); }
    setAdTitle(t)                { if (this.elements.adLabelText) this.elements.adLabelText.textContent = t || 'Reklama'; }
    showSkipButton(d)            { this.showAdSkip(d || 0); }
    hideSkipButton()             { this.elements.adSkip.style.display = 'none'; clearInterval(this._skipTimer); }
    enableSkipButton()           { this.enableAdSkip(); }
    disableSkipButton()          { this.elements.adSkip.classList.remove('uzdub-ad-skip-ready'); this.elements.adSkip.classList.add('uzdub-ad-skip-wait'); }
    updateSkipCountdown(n)       { this.updateAdSkipCountdown(n); }
    updateAdCountdown(remaining) { this.setAdCounter(remaining > 0 ? Math.ceil(remaining) + 's' : ''); }
    updateAdProgress()           { /* optional */ }
    updateAdDuration()           { /* optional */ }
    showAdBuffering(show)        { show ? this.showAdLoading() : this.hideAdLoading(); }
    showAdClickThrough(url)      {
        if (url && this.elements.adClickzone) {
            this.elements.adClickzone.style.cursor = 'pointer';
            this.elements.adClickzone.onclick = () => window.open(url, '_blank', 'noopener');
        }
    }
}
