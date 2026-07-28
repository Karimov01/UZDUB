/*!
 * ==========================================
 * UZDUB Player
 * Event Manager v4.0  (FreeKino-style interactions)
 * https://uzdub.net
 * ==========================================
 */

class EventManager {

    constructor(player) {
        this.player   = player;
        this.ui       = player.ui;
        this.video    = player.video;
        this.el       = player.ui.elements;

        this._listeners  = [];  // {target, type, fn}
        this._emitBus    = {};  // event bus for VastManager

        this._idleTimer  = null;
        this._holdTimer  = null;
        this._holding    = false;
        this._prevRate   = 1;
        this._lastTap    = 0;
        this._tapTimer   = null;

        this._dragging   = false;
    }

    /* ------------------------------------------------------------------ */
    /*  Small helpers                                                       */
    /* ------------------------------------------------------------------ */

    on(target, type, fn, opts) {
        target.addEventListener(type, fn, opts);
        this._listeners.push({ target, type, fn });
    }

    /* Simple event bus (VastManager uses player.events.emit) */
    emit(name, data) {
        (this._emitBus[name] || []).forEach(fn => fn(data));
    }
    listen(name, fn) {
        (this._emitBus[name] = this._emitBus[name] || []).push(fn);
    }

    /* ------------------------------------------------------------------ */
    /*  Bind all                                                            */
    /* ------------------------------------------------------------------ */

    bind() {
        this.bindVideo();
        this.bindButtons();
        this.bindProgress();
        this.bindVolume();
        this.bindSettings();
        this.bindGestures();
        this.bindKeyboard();
        this.bindActivity();
        this.bindFullscreen();
        this.bindPip();
        this.bindAdControls();
    }

    /* ------------------------------------------------------------------ */
    /*  Video element events                                                */
    /* ------------------------------------------------------------------ */

    bindVideo() {
        const v = this.video;

        this.on(v, 'play', () => {
            this.player.isPlaying = true;
            this.ui.setPlayIcon(true);
            this.ui.hidePauseAd();
        });

        this.on(v, 'pause', () => {
            this.player.isPlaying = false;
            this.ui.setPlayIcon(false);
            if (this.player.started && !this.player.isEmbed &&
                this.player._pauseAd && !this.player._inAd && !this.player._pauseAdDismissed) {
                this.ui.showPauseAd(this.player._pauseAd.img, this.player._pauseAd.url);
            }
        });

        this.on(v, 'timeupdate', () => {
            const d = v.duration;
            if (isFinite(d) && d > 0) {
                this.ui.updateProgress(v.currentTime / d);
            }
            this.ui.updateTime(v.currentTime, d);
        });

        this.on(v, 'progress', () => {
            if (v.buffered.length && isFinite(v.duration) && v.duration > 0) {
                const end = v.buffered.end(v.buffered.length - 1);
                this.ui.updateBuffer(end / v.duration);
            }
        });

        this.on(v, 'loadedmetadata', () => {
            this.ui.updateTime(v.currentTime, v.duration);
            this.ui.setHdBadge(this._detectHd(v.videoHeight));
        });

        this.on(v, 'waiting', () => this.ui.showSpinner());
        this.on(v, 'playing', () => { this.ui.hideSpinner(); this.ui.hideError(); });
        this.on(v, 'canplay', () => this.ui.hideSpinner());
        this.on(v, 'ended',   () => { this.ui.setPlayIcon(false); });

        this.on(v, 'volumechange', () => {
            this.ui.setMuteIcon(v.muted, v.volume);
            this.ui.setVolumeFill(v.muted ? 0 : v.volume);
        });

        this.on(v, 'error', () => {
            if (this.player._inAd) return;
            if (!v.currentSrc) return; // no source set yet
            this.ui.showError('Video yuklanmadi. Iltimos qayta urinib ko\'ring.');
        });
    }

    _detectHd(h) {
        if (!h) return '';
        if (h >= 2160) return '4K';
        if (h >= 720)  return 'HD';
        return '';
    }

    /* ------------------------------------------------------------------ */
    /*  Buttons                                                             */
    /* ------------------------------------------------------------------ */

    bindButtons() {
        const e = this.el;

        this.on(e.bigPlay, 'click', () => this.player.play());
        this.on(e.playBtn, 'click', () => this.player.toggle());
        this.on(e.muteBtn, 'click', () => this.player.toggleMute());
        this.on(e.fsBtn,   'click', () => this.player.fullscreen());
        this.on(e.errorRetry, 'click', () => {
            this.ui.hideError();
            this.player.started = false;
            this.player.play();
        });

        // Ripple on interactive buttons
        [e.playBtn, e.muteBtn, e.settingsBtn, e.fsBtn, e.pipBtn].forEach(btn => {
            if (btn) this.on(btn, 'pointerdown', (ev) => this._btnRipple(btn, ev));
        });

        // Pause-ad close
        if (e.pauseAdClose) this.on(e.pauseAdClose, 'click', (ev) => {
            ev.stopPropagation();
            this.ui.hidePauseAd();
            this.player._pauseAdDismissed = true;
        });
    }

    _btnRipple(btn, ev) {
        const r = document.createElement('span');
        r.className = 'uzdub-btn-ripple';
        const rect = btn.getBoundingClientRect();
        r.style.left = (ev.clientX - rect.left) + 'px';
        r.style.top  = (ev.clientY - rect.top)  + 'px';
        btn.appendChild(r);
        setTimeout(() => r.remove(), 500);
    }

    /* ------------------------------------------------------------------ */
    /*  Progress bar                                                        */
    /* ------------------------------------------------------------------ */

    bindProgress() {
        const wrap = this.el.progressWrap;
        const v    = this.video;

        const pctFromEvent = (ev) => {
            const rect = wrap.getBoundingClientRect();
            const x    = (ev.touches ? ev.touches[0].clientX : ev.clientX) - rect.left;
            return Utils.clamp(x / rect.width, 0, 1);
        };

        const seekTo = (ev) => {
            if (!isFinite(v.duration)) return;
            const pct = pctFromEvent(ev);
            v.currentTime = pct * v.duration;
            this.ui.updateProgress(pct);
        };

        this.on(wrap, 'pointerdown', (ev) => {
            this._dragging = true;
            this.el.progressHandle.classList.add('uzdub-dragging');
            seekTo(ev);
            wrap.setPointerCapture && wrap.setPointerCapture(ev.pointerId);
        });
        this.on(wrap, 'pointermove', (ev) => {
            if (isFinite(v.duration)) {
                const rect = wrap.getBoundingClientRect();
                const x    = ev.clientX - rect.left;
                const pct  = Utils.clamp(x / rect.width, 0, 1);
                this._showThumb(x, pct * v.duration);
            }
            if (this._dragging) seekTo(ev);
        });
        this.on(wrap, 'pointerup', () => {
            if (this._dragging) { this._dragging = false; this.el.progressHandle.classList.remove('uzdub-dragging'); }
        });
        this.on(wrap, 'pointerleave',  () => this.ui.hideThumbnail());
        this.on(wrap, 'pointercancel', () => { this._dragging = false; this.el.progressHandle.classList.remove('uzdub-dragging'); });
    }

    _showThumb(x, time) {
        const tv = this.el.thumbVideo;
        this.ui.showThumbnail(x, Utils.formatTime(time));
        if (tv && tv.getAttribute('src') && isFinite(tv.duration)) {
            const draw = () => {
                try {
                    const ctx = this.el.thumbCanvas.getContext('2d');
                    ctx.drawImage(tv, 0, 0, this.el.thumbCanvas.width, this.el.thumbCanvas.height);
                } catch (e) { /* ignore */ }
                tv.removeEventListener('seeked', draw);
            };
            tv.addEventListener('seeked', draw);
            try { tv.currentTime = time; } catch (e) { /* ignore */ }
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Volume                                                              */
    /* ------------------------------------------------------------------ */

    bindVolume() {
        const slider = this.el.volSlider;
        let vdrag = false;

        const setFromEvent = (ev) => {
            const rect = slider.getBoundingClientRect();
            const x    = (ev.touches ? ev.touches[0].clientX : ev.clientX) - rect.left;
            this.player.setVolume(Utils.clamp(x / rect.width, 0, 1));
        };

        this.on(slider, 'pointerdown', (ev) => { vdrag = true; setFromEvent(ev); slider.setPointerCapture && slider.setPointerCapture(ev.pointerId); });
        this.on(slider, 'pointermove', (ev) => { if (vdrag) setFromEvent(ev); });
        this.on(slider, 'pointerup',   () => vdrag = false);
    }

    /* ------------------------------------------------------------------ */
    /*  Settings menu                                                       */
    /* ------------------------------------------------------------------ */

    bindSettings() {
        const e = this.el;

        this.on(e.settingsBtn, 'click', (ev) => { ev.stopPropagation(); this.ui.toggleSettingsMenu(); });

        this.on(e.menu, 'click', (ev) => {
            const row  = ev.target.closest('[data-action]');
            const back = ev.target.closest('[data-back]');
            const item = ev.target.closest('.uzdub-speed-item');

            if (row)  { this.ui.showMenuPage(row.dataset.action); return; }
            if (back) { this.ui.showMenuPage(back.dataset.back);  return; }
            if (item) {
                const rate = parseFloat(item.dataset.rate);
                this.player.setPlaybackRate(rate);
                this.ui.setSpeedActive(rate);
                this.ui.showMenuPage('main');
            }
        });

        this.on(document, 'click', (ev) => {
            if (!e.menu.hasAttribute('hidden') &&
                !e.menu.contains(ev.target) &&
                !e.settingsBtn.contains(ev.target)) {
                this.ui.closeSettingsMenu();
            }
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Gestures                                                            */
    /* ------------------------------------------------------------------ */

    bindGestures() {
        const g = this.el.gesture;

        const handleZone = (zone, dir) => {
            this.on(zone, 'pointerup', () => {
                if (this.player.isEmbed || this.player._inAd) return;
                const now = Date.now();
                const dt  = now - this._lastTap;

                if (dt < 300) {
                    clearTimeout(this._tapTimer);
                    this._lastTap = 0;
                    if (dir === 0) {
                        this.player.toggle();
                    } else {
                        this.player.seek(this.video.currentTime + dir * 10);
                        this.ui.showCenterFlash(dir > 0 ? '+10s »' : '« -10s');
                    }
                } else {
                    this._lastTap = now;
                    this._tapTimer = setTimeout(() => {
                        if (Utils.isTouch()) this._toggleControlsVisibility();
                        else                 this.player.toggle();
                    }, 300);
                }
            });
        };

        handleZone(this.el.gestureLeft,  -1);
        handleZone(this.el.gestureMid,    0);
        handleZone(this.el.gestureRight, +1);

        // Hold-to-2x
        this.on(this.el.gestureMid, 'pointerdown', () => {
            if (this.player.isEmbed || this.player._inAd || !this.player.isPlaying) return;
            this._holdTimer = setTimeout(() => {
                this._holding  = true;
                this._prevRate = this.video.playbackRate;
                this.video.playbackRate = 2;
                this.el.holdSpeed.classList.add('uzdub-visible');
            }, 500);
        });
        const endHold = () => {
            clearTimeout(this._holdTimer);
            if (this._holding) {
                this._holding = false;
                this.video.playbackRate = this._prevRate;
                this.el.holdSpeed.classList.remove('uzdub-visible');
            }
        };
        this.on(this.el.gestureMid, 'pointerup',     endHold);
        this.on(this.el.gestureMid, 'pointerleave',  endHold);
        this.on(this.el.gestureMid, 'pointercancel', endHold);

        this._bindSwipeVolume(g);
    }

    _toggleControlsVisibility() {
        const idle = this.el.wrapper.classList.contains('uzdub-idle');
        if (idle) this._activity();
        else      this.ui.setIdle(true);
    }

    _bindSwipeVolume(g) {
        let startY = null, startVol = 0;
        this.on(g, 'touchstart', (ev) => {
            if (ev.touches.length !== 1) return;
            startY   = ev.touches[0].clientY;
            startVol = this.video.muted ? 0 : this.video.volume;
        }, { passive: true });
        this.on(g, 'touchmove', (ev) => {
            if (startY === null) return;
            const dy = startY - ev.touches[0].clientY;
            if (Math.abs(dy) < 20) return;
            const rect = g.getBoundingClientRect();
            const vol  = Utils.clamp(startVol + dy / rect.height, 0, 1);
            this.player.setVolume(vol);
            this.ui.showVolumeOSD(vol);
        }, { passive: true });
        this.on(g, 'touchend', () => startY = null);
    }

    /* ------------------------------------------------------------------ */
    /*  Keyboard                                                            */
    /* ------------------------------------------------------------------ */

    bindKeyboard() {
        this.on(this.el.wrapper, 'keydown', (ev) => {
            if (this.player.isEmbed) return;
            switch (ev.key) {
                case ' ':
                case 'k':
                    ev.preventDefault(); this.player.toggle(); break;
                case 'ArrowRight':
                    ev.preventDefault(); this.player.seek(this.video.currentTime + 5); this.ui.showCenterFlash('+5s »'); break;
                case 'ArrowLeft':
                    ev.preventDefault(); this.player.seek(this.video.currentTime - 5); this.ui.showCenterFlash('« -5s'); break;
                case 'ArrowUp':
                    ev.preventDefault(); { const nv = Utils.clamp((this.video.muted ? 0 : this.video.volume) + 0.1, 0, 1); this.player.setVolume(nv); this.ui.showVolumeOSD(nv); } break;
                case 'ArrowDown':
                    ev.preventDefault(); { const nv = Utils.clamp((this.video.muted ? 0 : this.video.volume) - 0.1, 0, 1); this.player.setVolume(nv); this.ui.showVolumeOSD(nv); } break;
                case 'm': case 'M': this.player.toggleMute(); break;
                case 'f': case 'F': this.player.fullscreen(); break;
            }
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Activity / auto-hide                                                */
    /* ------------------------------------------------------------------ */

    bindActivity() {
        const w = this.el.wrapper;
        const act = () => this._activity();
        this.on(w, 'pointermove', act);
        this.on(w, 'pointerdown', act);
        this.on(w, 'touchstart',  act, { passive: true });
    }

    _activity() {
        this.ui.setIdle(false);
        clearTimeout(this._idleTimer);
        this._idleTimer = setTimeout(() => {
            if (this.player.isPlaying && !this.player._inAd) this.ui.setIdle(true);
        }, 2500);
    }

    /* ------------------------------------------------------------------ */
    /*  Fullscreen change                                                   */
    /* ------------------------------------------------------------------ */

    bindFullscreen() {
        const onChange = () => {
            const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
            this.ui.setFullscreenIcon(isFull);
            this.el.wrapper.classList.toggle('uzdub-fs', isFull);
        };
        this.on(document, 'fullscreenchange', onChange);
        this.on(document, 'webkitfullscreenchange', onChange);
    }

    /* ------------------------------------------------------------------ */
    /*  PiP                                                                  */
    /* ------------------------------------------------------------------ */

    bindPip() {
        if (this.el.pipBtn) this.on(this.el.pipBtn, 'click', () => this.player.pip());
    }

    /* ------------------------------------------------------------------ */
    /*  Ad controls (VAST skip)                                             */
    /* ------------------------------------------------------------------ */

    bindAdControls() {
        this.on(this.el.adSkip, 'click', () => {
            if (!this.el.adSkip.classList.contains('uzdub-ad-skip-ready')) return;
            if (this.player.vast && this.player.vast.skipEnabled) {
                this.player.vast.skip();
            }
        });

        this.on(this.el.adVolBtn, 'click', () => {
            const av = this.el.adVideo;
            av.muted = !av.muted;
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Destroy                                                             */
    /* ------------------------------------------------------------------ */

    destroy() {
        this._listeners.forEach(({ target, type, fn }) => {
            target.removeEventListener(type, fn);
        });
        this._listeners = [];
        clearTimeout(this._idleTimer);
        clearTimeout(this._holdTimer);
        clearTimeout(this._tapTimer);
    }
}
