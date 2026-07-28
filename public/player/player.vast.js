/**
 * player.vast.js
 * UZDUB Player - VAST Ad Manager
 * https://uzdub.net
 *
 * Implements VAST 2.0 / 3.0 / 4.x (Inline & Wrapper) ad playback:
 * Preroll, Midroll (multiple cue points), Postroll.
 *
 * Public API: class VastManager
 *
 * Expected `player` object contract (already provided by host player):
 *   player.video        -> HTMLVideoElement used for movie playback
 *   player.sources       -> array of movie source descriptors
 *   player.ui             -> optional UI adapter (methods called defensively)
 *   player.events         -> optional event emitter with .emit(name, data)
 *   player.options         -> configuration object
 *   player.currentSource    -> current movie source descriptor
 *
 * This file does not create or manage the underlying player. It only
 * manages the VAST ad lifecycle and reuses player.video for ad playback,
 * saving and restoring the movie state around ad breaks.
 */

(function (global) {
	'use strict';

	// ---------------------------------------------------------------------
	// Constants
	// ---------------------------------------------------------------------

	const DEFAULT_TIMEOUT_MS = 8000;
	const DEFAULT_MAX_WRAPPER_DEPTH = 5;

	const AD_TYPE = {
		PREROLL: 'preroll',
		MIDROLL: 'midroll',
		POSTROLL: 'postroll'
	};

	const TRACKING_KEYS = [
		'creativeView', 'start', 'firstQuartile', 'midpoint', 'thirdQuartile',
		'complete', 'mute', 'unmute', 'pause', 'resume', 'rewind',
		'fullscreen', 'exitFullscreen', 'expand', 'collapse', 'acceptInvitation',
		'skip', 'close', 'closeLinear', 'progress', 'otherAdInteraction', 'replay'
	];

	const VAST_ERROR_CODES = {
		XML_PARSE_ERROR: 100,
		SCHEMA_VALIDATION_ERROR: 101,
		VERSION_UNSUPPORTED: 102,
		TRAFFICKING_ERROR: 200,
		WRAPPER_LIMIT_REACHED: 302,
		WRAPPER_NO_ADS: 303,
		LINEAR_NOT_FOUND: 400,
		FILE_NOT_FOUND: 401,
		MEDIAFILE_TIMEOUT: 402,
		MEDIAFILE_NOT_SUPPORTED: 403,
		MEDIAFILE_PLAYBACK_ERROR: 405,
		PROBLEM_DISPLAYING_MEDIAFILE: 406,
		SYMPTOM_INDICATED_NO_CREATIVE: 500,
		GENERAL_LINEAR_ERROR: 400,
		GENERAL_NONLINEAR_ERROR: 500,
		GENERAL_COMPANION_ERROR: 600,
		UNDEFINED_ERROR: 900,
		VAST_TIMEOUT: 301,
		NO_ADS_AVAILABLE: 303
	};

	// ---------------------------------------------------------------------
	// Small internal utilities (module-private, not exposed)
	// ---------------------------------------------------------------------

	function noop() {}

	function safeCall(obj, method, ...args) {
		if (obj && typeof obj[method] === 'function') {
			try {
				return obj[method](...args);
			} catch (err) {
				warn(`UI/event callback "${method}" threw an error`, err);
			}
		}
		return undefined;
	}

	function warn(...args) {
		console.warn('[VastManager]', ...args);
	}

	function errLog(...args) {
		console.warn('[VastManager:error]', ...args);
	}

	function textOf(node) {
		if (!node) return '';
		return (node.textContent || '').trim();
	}

	function attr(node, name) {
		if (!node || !node.getAttribute) return null;
		return node.getAttribute(name);
	}

	function firstChild(parent, tagName) {
		if (!parent) return null;
		const children = parent.children || [];
		for (let i = 0; i < children.length; i++) {
			if (children[i].tagName === tagName) return children[i];
		}
		return null;
	}

	function allChildren(parent, tagName) {
		if (!parent) return [];
		const out = [];
		const children = parent.children || [];
		for (let i = 0; i < children.length; i++) {
			if (children[i].tagName === tagName) out.push(children[i]);
		}
		return out;
	}

	function toNumber(value, fallback) {
		const n = parseFloat(value);
		return Number.isFinite(n) ? n : fallback;
	}

	/**
	 * Parses a VAST duration/offset string.
	 * Supports "HH:MM:SS" / "HH:MM:SS.mmm" and percentage strings like "20%".
	 * Returns { seconds, isPercent, percent }.
	 */
	function parseTimeOffset(value) {
		if (!value) return null;
		value = value.trim();
		if (value.endsWith('%')) {
			const percent = toNumber(value.slice(0, -1), 0);
			return { seconds: null, isPercent: true, percent };
		}
		const parts = value.split(':');
		if (parts.length !== 3) return null;
		const hours = toNumber(parts[0], 0);
		const minutes = toNumber(parts[1], 0);
		const seconds = toNumber(parts[2], 0);
		return {
			seconds: (hours * 3600) + (minutes * 60) + seconds,
			isPercent: false,
			percent: null
		};
	}

	function replaceMacros(url, data) {
		if (!url) return url;
		const cacheBuster = String(Math.round(Math.random() * 1e10));
		const timestamp = new Date().toISOString();
		const map = {
			'[ERRORCODE]': data && data.errorCode != null ? String(data.errorCode) : String(VAST_ERROR_CODES.UNDEFINED_ERROR),
			'[CACHEBUSTING]': cacheBuster,
			'[CACHEBUSTER]': cacheBuster,
			'[TIMESTAMP]': timestamp,
			'[CONTENTPLAYHEAD]': data && data.contentPlayhead != null ? data.contentPlayhead : '00:00:00.000',
			'[ASSETURI]': data && data.assetUri ? encodeURIComponent(data.assetUri) : '',
			'[LIMITADTRACKING]': 'false',
			'[REGULATIONS]': ''
		};
		let result = url;
		Object.keys(map).forEach((key) => {
			result = result.split(key).join(map[key]);
		});
		return result;
	}

	/**
	 * Fires a tracking pixel without CORS restrictions using an Image beacon.
	 */
	function fireBeacon(url) {
		if (!url) return;
		try {
			const img = new Image();
			img.src = url;
		} catch (err) {
			warn('Failed to fire tracking beacon', url, err);
		}
	}

	function formatContentPlayhead(seconds) {
		if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		const ms = Math.floor((seconds - Math.floor(seconds)) * 1000);
		const pad = (n, len) => String(n).padStart(len, '0');
		return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)}.${pad(ms, 3)}`;
	}

	// ---------------------------------------------------------------------
	// VastManager
	// ---------------------------------------------------------------------

	class VastManager {

		constructor(player) {
			if (!player || !player.video) {
				throw new Error('VastManager requires a player instance with a video element.');
			}

			this.player = player;
			this.video = player.video;
			this.options = player.options || {};
			this.ui = player.ui || null;
			this.events = player.events || null;

			this.maxWrapperDepth = toNumber(this.options.vastMaxWrapperDepth, DEFAULT_MAX_WRAPPER_DEPTH);
			this.timeoutDuration = toNumber(this.options.vastTimeout, DEFAULT_TIMEOUT_MS);
			this.defaultSkipOffsetSeconds = toNumber(this.options.vastDefaultSkipOffset, 5);

			// Ad break configuration
			this.prerollTagUrl = null;
			this.postrollTagUrl = null;
			this.midrollCuePoints = []; // [{ time, tagUrl, played }]

			// Current ad break state
			this.adType = null;
			this.adModel = null;
			this.isAdPlaying = false;
			this.isAdLoading = false;

			this.trackingFired = new Set();
			this.impressionFired = false;

			this.skipEnabled = false;
			this.skipOffsetSeconds = null;
			this.lastReportedQuartile = null;

			this.timers = {
				countdown: null,
				skip: null,
				timeout: null,
				progress: null
			};

			this.movieState = null;

			this._testVideoEl = null;
			this._boundAdHandlers = null;
			this._boundClickHandler = null;
			this._boundMovieTimeUpdate = null;
			this._destroyed = false;

			this._pendingAbortController = null;

			this._bindMidrollWatcher();
		}

		// -------------------------------------------------------------
		// Public API: configuration
		// -------------------------------------------------------------

		/**
		 * Configures which ad tags to use for each ad type.
		 * @param {Object} config
		 *   config.preroll  {string}
		 *   config.postroll {string}
		 *   config.midroll  {Array<{time:number, tagUrl:string}>}
		 */
		configure(config) {
			if (!config) return;
			if (config.preroll) this.prerollTagUrl = config.preroll;
			if (config.postroll) this.postrollTagUrl = config.postroll;
			if (Array.isArray(config.midroll)) {
				this.midrollCuePoints = config.midroll
					.filter((cp) => cp && cp.tagUrl && Number.isFinite(cp.time))
					.map((cp) => ({ time: cp.time, tagUrl: cp.tagUrl, played: false }))
					.sort((a, b) => a.time - b.time);
			}
		}

		// -------------------------------------------------------------
		// Public API: loading / parsing
		// -------------------------------------------------------------

		/**
		 * Loads and resolves a VAST ad tag (including wrapper chains).
		 * @param {string} adTagUrl
		 * @param {string} type one of AD_TYPE
		 * @returns {Promise<Object>} resolved ad model
		 */
		load(adTagUrl, type) {
			if (!adTagUrl) return Promise.reject(new Error('adTagUrl is required'));

			this.adType = type || AD_TYPE.PREROLL;
			this.isAdLoading = true;
			this.startTimeout();

			return this._resolveWrapperChain(adTagUrl, 0, this._createAccumulator())
				.then((model) => {
					this.clearAdTimeout();
					this.isAdLoading = false;

					if (!model || !model.linear || !model.linear.mediaFiles.length) {
						this.sendError(VAST_ERROR_CODES.LINEAR_NOT_FOUND, model);
						return Promise.reject(new Error('No playable Linear MediaFile found in VAST response'));
					}

					const bestMediaFile = this._selectBestMediaFile(model.linear.mediaFiles);
					if (!bestMediaFile) {
						this.sendError(VAST_ERROR_CODES.MEDIAFILE_NOT_SUPPORTED, model);
						return Promise.reject(new Error('No compatible MediaFile found for this browser'));
					}

					model.linear.selectedMediaFile = bestMediaFile;
					this.adModel = model;
					return model;
				})
				.catch((err) => {
					this.clearAdTimeout();
					this.isAdLoading = false;
					throw err;
				});
		}

		/**
		 * Parses a raw VAST XML string into an ad model (no wrapper resolution).
		 * Exposed for direct XML use cases (e.g. VMAP-extracted inline XML).
		 * @param {string} xmlString
		 */
		parse(xmlString) {
			try {
				const xmlDoc = this._parseXmlString(xmlString);
				const ads = allChildren(xmlDoc.documentElement, 'Ad');
				for (const adEl of ads) {
					const wrapperEl = firstChild(adEl, 'Wrapper');
					const inlineEl = firstChild(adEl, 'InLine');
					if (inlineEl) {
						const acc = this._createAccumulator();
						this._mergeInlineAd(acc, inlineEl);
						return Promise.resolve(acc);
					}
					if (wrapperEl) {
						const tagUri = textOf(firstChild(wrapperEl, 'VASTAdTagURI'));
						if (tagUri) {
							const acc = this._createAccumulator();
							this._mergeWrapperAd(acc, wrapperEl);
							return this._resolveWrapperChain(tagUri, 1, acc);
						}
					}
				}
				return Promise.reject(new Error('No usable <Ad> found in VAST document'));
			} catch (err) {
				this.sendError(VAST_ERROR_CODES.XML_PARSE_ERROR);
				return Promise.reject(err);
			}
		}

		// -------------------------------------------------------------
		// Public API: playback
		// -------------------------------------------------------------

		/**
		 * Plays whichever ad type is currently configured on this.adType,
		 * using the already-resolved this.adModel (call load() first),
		 * or triggers the appropriate playXXX() convenience method.
		 */
		play() {
			if (!this.adType) {
				warn('play() called with no adType set; use playPreroll/playMidroll/playPostroll instead.');
				return Promise.resolve();
			}
			if (this.adModel) {
				return this._startAdPlayback(this.adModel);
			}
			switch (this.adType) {
				case AD_TYPE.PREROLL: return this.playPreroll();
				case AD_TYPE.MIDROLL: return this.playMidroll();
				case AD_TYPE.POSTROLL: return this.playPostroll();
				default: return Promise.resolve();
			}
		}

		playPreroll(adTagUrl) {
			const tag = adTagUrl || this.prerollTagUrl;
			if (!tag) return Promise.resolve();
			this.adType = AD_TYPE.PREROLL;
			return this.load(tag, AD_TYPE.PREROLL)
				.then((model) => this._startAdPlayback(model))
				.catch((err) => {
					errLog('Preroll failed, resuming movie', err);
					this._resumeMovieAfterFailure();
				});
		}

		/**
		 * Registers midroll cue points (if not already configured) and starts
		 * watching movie playback for cue point crossings.
		 * @param {Array<{time:number, tagUrl:string}>} [cuePoints]
		 */
		playMidroll(cuePoints) {
			if (Array.isArray(cuePoints)) {
				this.midrollCuePoints = cuePoints
					.filter((cp) => cp && cp.tagUrl && Number.isFinite(cp.time))
					.map((cp) => ({ time: cp.time, tagUrl: cp.tagUrl, played: false }))
					.sort((a, b) => a.time - b.time);
			}
			this._bindMidrollWatcher();
			return Promise.resolve();
		}

		playPostroll(adTagUrl) {
			const tag = adTagUrl || this.postrollTagUrl;
			if (!tag) return Promise.resolve();
			this.adType = AD_TYPE.POSTROLL;
			return this.load(tag, AD_TYPE.POSTROLL)
				.then((model) => this._startAdPlayback(model))
				.catch((err) => {
					errLog('Postroll failed', err);
					this.cleanup();
				});
		}

		/**
		 * Called internally when a midroll cue point is crossed.
		 */
		_triggerMidroll(cuePoint) {
			cuePoint.played = true;
			this.adType = AD_TYPE.MIDROLL;
			this.load(cuePoint.tagUrl, AD_TYPE.MIDROLL)
				.then((model) => this._startAdPlayback(model))
				.catch((err) => {
					errLog('Midroll failed, resuming movie', err);
					this._resumeMovieAfterFailure();
				});
		}

		// -------------------------------------------------------------
		// Core ad playback lifecycle
		// -------------------------------------------------------------

		_startAdPlayback(model) {
			if (this.isAdPlaying) {
				warn('An ad is already playing; ignoring new playback request.');
				return Promise.resolve();
			}

			this.adModel = model;
			this.isAdPlaying = true;
			this.trackingFired = new Set();
			this.impressionFired = false;
			this.lastReportedQuartile = null;

			this._saveMovieState();

			const linear = model.linear;
			const mediaFile = linear.selectedMediaFile;

			this.skipOffsetSeconds = this._resolveSkipOffsetSeconds(linear);
			this.skipEnabled = false;

			safeCall(this.ui, 'showAdOverlay', { adType: this.adType });
			safeCall(this.ui, 'setAdTitle', model.adTitle || '');
			safeCall(this.ui, 'hideSkipButton');
			safeCall(this.events, 'emit', 'vast:adBreakStart', { adType: this.adType, model });

			this._unbindMovieListeners();
			this._bindAdEvents();

			this.video.pause();
			this.video.src = mediaFile.url;
			this.video.load();

			this._fireImpressions();

			this.startTimeout();

			const playPromise = this.video.play();
			if (playPromise && typeof playPromise.catch === 'function') {
				playPromise.catch((err) => {
					errLog('Ad video failed to start playback', err);
					this.sendError(VAST_ERROR_CODES.MEDIAFILE_PLAYBACK_ERROR);
					this.finish();
				});
			}

			this.bindClickThrough();

			return Promise.resolve();
		}

		_fireImpressions() {
			if (this.impressionFired) return;
			this.impressionFired = true;
			const model = this.adModel;
			if (!model) return;
			(model.impressionUrls || []).forEach((url) => {
				fireBeacon(replaceMacros(url, {}));
			});
			this.sendTracking('creativeView');
		}

		// -------------------------------------------------------------
		// Ad video event binding
		// -------------------------------------------------------------

		_bindAdEvents() {
			this._unbindAdEvents();

			const handlers = {
				loadedmetadata: () => this._onAdLoadedMetadata(),
				canplay: () => this._onAdCanPlay(),
				canplaythrough: () => this.clearAdTimeout(),
				play: () => this._onAdPlay(),
				pause: () => this._onAdPause(),
				ended: () => this._onAdEnded(),
				timeupdate: () => this._onAdTimeUpdate(),
				seeking: () => this._onAdSeeking(),
				seeked: () => this._onAdSeeked(),
				waiting: () => this._onAdWaiting(),
				error: () => this._onAdError(),
				volumechange: () => this._onAdVolumeChange(),
				fullscreenchange: () => this._onFullscreenChange()
			};

			this._boundAdHandlers = handlers;

			Object.keys(handlers).forEach((eventName) => {
				this.video.addEventListener(eventName, handlers[eventName]);
			});

			document.addEventListener('fullscreenchange', handlers.fullscreenchange);
		}

		_unbindAdEvents() {
			if (!this._boundAdHandlers) return;
			const handlers = this._boundAdHandlers;
			Object.keys(handlers).forEach((eventName) => {
				this.video.removeEventListener(eventName, handlers[eventName]);
			});
			document.removeEventListener('fullscreenchange', handlers.fullscreenchange);
			this._boundAdHandlers = null;
		}

		_onAdLoadedMetadata() {
			this.startCountdown();
			this.startSkipTimer();
			safeCall(this.ui, 'updateAdDuration', this.video.duration);
		}

		_onAdCanPlay() {
			this.clearAdTimeout();
		}

		_onAdPlay() {
			if (!this.trackingFired.has('start')) {
				this.sendTracking('start');
			} else {
				this.sendTracking('resume');
			}
		}

		_onAdPause() {
			if (!this.video.ended) {
				this.sendTracking('pause');
			}
		}

		_onAdEnded() {
			this.sendTracking('complete');
			this.finish();
		}

		_onAdTimeUpdate() {
			this._updateQuartileTracking();
			this._updateCountdownUi();
			this._updateSkipUi();
			this._updateProgressTracking();
		}

		_onAdSeeking() { /* no-op: ads are not seekable by user in standard flow */ }
		_onAdSeeked() { /* no-op */ }

		_onAdWaiting() {
			safeCall(this.ui, 'showAdBuffering', true);
		}

		_onAdError() {
			const mediaError = this.video.error;
			const code = mediaError ? mediaError.code : VAST_ERROR_CODES.MEDIAFILE_PLAYBACK_ERROR;
			errLog('Ad video element error', code, mediaError);
			this.sendError(VAST_ERROR_CODES.MEDIAFILE_PLAYBACK_ERROR);
			this.finish();
		}

		_onAdVolumeChange() {
			if (this.video.muted) {
				this.sendTracking('mute');
			} else {
				this.sendTracking('unmute');
			}
		}

		_onFullscreenChange() {
			const isFullscreen = !!(document.fullscreenElement);
			if (isFullscreen) {
				this.sendTracking('fullscreen');
			} else {
				this.sendTracking('exitFullscreen');
			}
		}

		_updateQuartileTracking() {
			const duration = this.video.duration;
			if (!Number.isFinite(duration) || duration <= 0) return;
			const ratio = this.video.currentTime / duration;

			if (ratio >= 0.25 && !this.trackingFired.has('firstQuartile')) {
				this.sendTracking('firstQuartile');
			}
			if (ratio >= 0.5 && !this.trackingFired.has('midpoint')) {
				this.sendTracking('midpoint');
			}
			if (ratio >= 0.75 && !this.trackingFired.has('thirdQuartile')) {
				this.sendTracking('thirdQuartile');
			}
		}

		_updateProgressTracking() {
			const model = this.adModel;
			if (!model || !model.linear || !model.linear.progressEvents) return;
			const currentTime = this.video.currentTime;
			model.linear.progressEvents.forEach((progressEvent, index) => {
				const key = `progress_${index}`;
				if (this.trackingFired.has(key)) return;
				const target = progressEvent.isPercent
					? (progressEvent.percent / 100) * this.video.duration
					: progressEvent.seconds;
				if (Number.isFinite(target) && currentTime >= target) {
					this.trackingFired.add(key);
					fireBeacon(replaceMacros(progressEvent.url, { contentPlayhead: formatContentPlayhead(currentTime) }));
				}
			});
		}

		// -------------------------------------------------------------
		// Countdown / Skip UI
		// -------------------------------------------------------------

		startCountdown() {
			this._clearTimer('countdown');
			this.timers.countdown = setInterval(() => this._updateCountdownUi(), 250);
			this._updateCountdownUi();
		}

		_updateCountdownUi() {
			if (!this.isAdPlaying) return;
			const duration = this.video.duration;
			const currentTime = this.video.currentTime;
			if (!Number.isFinite(duration) || duration <= 0) return;
			const remaining = Math.max(0, Math.ceil(duration - currentTime));
			safeCall(this.ui, 'updateAdCountdown', remaining);
			safeCall(this.ui, 'updateAdProgress', Math.min(1, currentTime / duration));
		}

		startSkipTimer() {
			this._clearTimer('skip');
			if (this.skipOffsetSeconds == null) {
				safeCall(this.ui, 'hideSkipButton');
				return;
			}
			safeCall(this.ui, 'showSkipButton');
			safeCall(this.ui, 'disableSkipButton');
			this.timers.skip = setInterval(() => this._updateSkipUi(), 250);
		}

		_updateSkipUi() {
			if (!this.isAdPlaying || this.skipOffsetSeconds == null) return;
			if (this.skipEnabled) return;
			if (this.video.currentTime >= this.skipOffsetSeconds) {
				this.skipEnabled = true;
				this._clearTimer('skip');
				safeCall(this.ui, 'enableSkipButton');
			} else {
				const remaining = Math.max(0, Math.ceil(this.skipOffsetSeconds - this.video.currentTime));
				safeCall(this.ui, 'updateSkipCountdown', remaining);
			}
		}

		_resolveSkipOffsetSeconds(linear) {
			if (!linear || !linear.skipOffset) {
				return this.options.vastForceSkippable ? this.defaultSkipOffsetSeconds : null;
			}
			const offset = linear.skipOffset;
			if (offset.isPercent) {
				const duration = linear.duration || this.video.duration || 0;
				return (offset.percent / 100) * duration;
			}
			return offset.seconds;
		}

		/**
		 * User-triggered skip (e.g. Skip Ad button clicked).
		 */
		skip() {
			if (!this.isAdPlaying || !this.skipEnabled) return;
			this.sendTracking('skip');
			this.stop();
		}

		// -------------------------------------------------------------
		// Click-through handling
		// -------------------------------------------------------------

		bindClickThrough() {
			this._unbindClickThrough();
			const linear = this.adModel && this.adModel.linear;
			if (!linear || !linear.clickThrough) return;

			const handler = (event) => {
				event.preventDefault();
				this.video.pause();
				(linear.clickTrackingUrls || []).forEach((url) => {
					fireBeacon(replaceMacros(url, { contentPlayhead: formatContentPlayhead(this.video.currentTime) }));
				});
				this.sendTracking('click');
				const win = global.open(linear.clickThrough, '_blank', 'noopener,noreferrer');
				if (win) win.opener = null;
				this.video.play().catch(noop);
			};

			this._boundClickHandler = handler;
			this.video.style.cursor = 'pointer';
			this.video.addEventListener('click', handler);
			safeCall(this.ui, 'showAdClickThrough', linear.clickThrough);
		}

		_unbindClickThrough() {
			if (this._boundClickHandler) {
				this.video.removeEventListener('click', this._boundClickHandler);
				this._boundClickHandler = null;
			}
			this.video.style.cursor = '';
		}

		// -------------------------------------------------------------
		// Timeout handling
		// -------------------------------------------------------------

		startTimeout() {
			this.clearAdTimeout();
			this.timers.timeout = setTimeout(() => {
				warn('VAST operation timed out after', this.timeoutDuration, 'ms');
				if (this._pendingAbortController) {
					this._pendingAbortController.abort();
				}
				this.sendError(VAST_ERROR_CODES.VAST_TIMEOUT);
				if (this.isAdPlaying) {
					this.finish();
				} else {
					this.isAdLoading = false;
					this._resumeMovieAfterFailure();
				}
			}, this.timeoutDuration);
		}

		clearAdTimeout() {
			this._clearTimer('timeout');
		}

		_clearTimer(name) {
			if (this.timers[name]) {
				clearInterval(this.timers[name]);
				clearTimeout(this.timers[name]);
				this.timers[name] = null;
			}
		}

		_clearAllTimers() {
			Object.keys(this.timers).forEach((name) => this._clearTimer(name));
		}

		// -------------------------------------------------------------
		// Tracking
		// -------------------------------------------------------------

		/**
		 * Fires a tracking event by key. Each key fires at most once per ad
		 * break, except events explicitly allowed to repeat (none by default).
		 */
		sendTracking(eventName) {
			if (this.trackingFired.has(eventName)) return;
			this.trackingFired.add(eventName);

			const model = this.adModel;
			if (!model || !model.linear || !model.linear.trackingEvents) return;

			const urls = model.linear.trackingEvents[eventName] || [];
			const macroData = { contentPlayhead: formatContentPlayhead(this.video.currentTime) };
			urls.forEach((url) => fireBeacon(replaceMacros(url, macroData)));

			safeCall(this.events, 'emit', `vast:${eventName}`, { adType: this.adType, model });
		}

		sendError(errorCode, model) {
			const targetModel = model || this.adModel;
			const urls = (targetModel && targetModel.errorUrls) || [];
			urls.forEach((url) => fireBeacon(replaceMacros(url, { errorCode })));
			safeCall(this.events, 'emit', 'vast:error', { errorCode, adType: this.adType });
			errLog('VAST error', errorCode);
		}

		/**
		 * Binds timeupdate-based quartile/progress tracking.
		 * Kept as a distinct public method per API contract; the actual
		 * work happens inside _onAdTimeUpdate, this simply ensures the
		 * ad event listeners (which include timeupdate) are active.
		 */
		watchTracking() {
			if (!this._boundAdHandlers) {
				this._bindAdEvents();
			}
		}

		// -------------------------------------------------------------
		// Movie state save / restore
		// -------------------------------------------------------------

		_saveMovieState() {
			const video = this.video;
			this.movieState = {
				source: this.player.currentSource || null,
				currentTime: video.currentTime,
				playbackRate: video.playbackRate,
				volume: video.volume,
				muted: video.muted,
				wasPaused: video.paused,
				fullscreen: !!document.fullscreenElement,
				quality: this.player.currentQuality || (this.options && this.options.quality) || null,
				subtitles: this.player.currentSubtitles || null
			};
		}

		restoreMovie() {
			const state = this.movieState;
			const video = this.video;
			if (!state) return;

			this._unbindAdEvents();
			this._unbindClickThrough();
			safeCall(this.ui, 'hideAdOverlay');
			safeCall(this.ui, 'hideSkipButton');
			safeCall(this.ui, 'showAdBuffering', false);

			// Delegate content restore to the host player, which knows how to
			// load direct video (MP4/HLS via SourceManager) or an embed iframe.
			if (this.player && typeof this.player.resumeAfterAd === 'function') {
				this.player.resumeAfterAd(state);
				this._bindMidrollWatcher();
				safeCall(this.events, 'emit', 'vast:movieRestored', {});
				return;
			}

			// Fallback: restore directly on the video element.
			if (state.source && state.source.src) {
				video.src = state.source.src;
			} else if (state.source && typeof state.source === 'string') {
				video.src = state.source;
			}
			video.load();

			const onReady = () => {
				video.removeEventListener('loadedmetadata', onReady);
				try {
					video.currentTime = state.currentTime || 0;
				} catch (err) {
					warn('Failed to restore movie currentTime', err);
				}
				video.playbackRate = state.playbackRate || 1;
				video.volume = state.volume;
				video.muted = state.muted;

				if (!state.wasPaused) {
					video.play().catch(noop);
				}

				this._bindMidrollWatcher();
				safeCall(this.events, 'emit', 'vast:movieRestored', {});
			};

			video.addEventListener('loadedmetadata', onReady);
		}

		_resumeMovieAfterFailure() {
			this.isAdPlaying = false;
			if (this.movieState) {
				this.restoreMovie();
			} else {
				this._bindMidrollWatcher();
			}
			safeCall(this.ui, 'hideAdOverlay');
			this.cleanup();
		}

		// -------------------------------------------------------------
		// Finish / stop / destroy
		// -------------------------------------------------------------

		/**
		 * Called when an ad completes naturally (ended event).
		 */
		finish() {
			if (!this.isAdPlaying) return;
			this.isAdPlaying = false;

			safeCall(this.events, 'emit', 'vast:adBreakEnd', { adType: this.adType });

			const type = this.adType;
			this._clearAllTimers();
			this._unbindAdEvents();
			this._unbindClickThrough();
			safeCall(this.ui, 'hideAdOverlay');
			safeCall(this.ui, 'hideSkipButton');

			if (type === AD_TYPE.POSTROLL) {
				this.cleanup();
				safeCall(this.events, 'emit', 'vast:contentComplete', {});
				return;
			}

			this.restoreMovie();
			this.cleanup();
		}

		/**
		 * User- or system-initiated early stop (skip/close), distinct from
		 * natural completion.
		 */
		stop() {
			if (!this.isAdPlaying) return;
			this.sendTracking('close');
			this.finish();
		}

		/**
		 * Full teardown of the VastManager instance. Call when the host
		 * player itself is being destroyed.
		 */
		destroy() {
			if (this._destroyed) return;
			this._destroyed = true;

			this._clearAllTimers();
			this._unbindAdEvents();
			this._unbindClickThrough();
			this._unbindMovieListeners();

			if (this._pendingAbortController) {
				this._pendingAbortController.abort();
				this._pendingAbortController = null;
			}

			this.isAdPlaying = false;
			this.isAdLoading = false;
			this.adModel = null;
			this.movieState = null;
			this.trackingFired.clear();
			this.midrollCuePoints = [];

			this.player = null;
			this.video = null;
			this.ui = null;
			this.events = null;
			this._testVideoEl = null;
		}

		/**
		 * Resets per-ad-break state without destroying the manager, so it is
		 * ready to load and play the next ad break.
		 */
		cleanup() {
			this._clearAllTimers();
			this.adModel = null;
			this.trackingFired.clear();
			this.impressionFired = false;
			this.skipEnabled = false;
			this.skipOffsetSeconds = null;
			this.lastReportedQuartile = null;
			this.isAdPlaying = false;
			this.isAdLoading = false;
			this.adType = null;
		}

		// -------------------------------------------------------------
		// Midroll cue point watching
		// -------------------------------------------------------------

		_bindMidrollWatcher() {
			this._unbindMovieListeners();
			if (!this.midrollCuePoints.length) return;

			const handler = () => {
				if (this.isAdPlaying || this.isAdLoading) return;
				const currentTime = this.video.currentTime;
				const cuePoint = this.midrollCuePoints.find(
					(cp) => !cp.played && currentTime >= cp.time
				);
				if (cuePoint) {
					this._triggerMidroll(cuePoint);
				}
			};

			this._boundMovieTimeUpdate = handler;
			this.video.addEventListener('timeupdate', handler);
		}

		_unbindMovieListeners() {
			if (this._boundMovieTimeUpdate) {
				this.video.removeEventListener('timeupdate', this._boundMovieTimeUpdate);
				this._boundMovieTimeUpdate = null;
			}
		}

		// -------------------------------------------------------------
		// Wrapper chain resolution
		// -------------------------------------------------------------

		_createAccumulator() {
			return {
				adSystem: null,
				adTitle: null,
				description: null,
				impressionUrls: [],
				errorUrls: [],
				adParameters: null,
				extensions: [],
				companions: [],
				icons: [],
				linear: {
					duration: null,
					skipOffset: null,
					mediaFiles: [],
					clickThrough: null,
					clickTrackingUrls: [],
					trackingEvents: TRACKING_KEYS.reduce((map, key) => {
						map[key] = [];
						return map;
					}, {}),
					progressEvents: []
				},
				nonLinear: null,
				wrapperDepth: 0
			};
		}

		_resolveWrapperChain(adTagUrl, depth, accumulator) {
			if (depth > this.maxWrapperDepth) {
				this.sendError(VAST_ERROR_CODES.WRAPPER_LIMIT_REACHED, accumulator);
				return Promise.reject(new Error('Maximum VAST wrapper depth exceeded'));
			}

			accumulator.wrapperDepth = depth;

			return this._fetchXml(adTagUrl)
				.then((xmlDoc) => {
					const vastEl = xmlDoc.documentElement;
					if (!vastEl || vastEl.tagName !== 'VAST') {
						this.sendError(VAST_ERROR_CODES.SCHEMA_VALIDATION_ERROR, accumulator);
						return Promise.reject(new Error('Invalid VAST document: missing <VAST> root'));
					}

					const ads = allChildren(vastEl, 'Ad');
					if (!ads.length) {
						this.sendError(VAST_ERROR_CODES.WRAPPER_NO_ADS, accumulator);
						return Promise.reject(new Error('VAST response contains no <Ad> elements'));
					}

					for (const adEl of ads) {
						const wrapperEl = firstChild(adEl, 'Wrapper');
						const inlineEl = firstChild(adEl, 'InLine');

						if (inlineEl) {
							this._mergeInlineAd(accumulator, inlineEl);
							return accumulator;
						}

						if (wrapperEl) {
							this._mergeWrapperAd(accumulator, wrapperEl);
							const nextTagUri = textOf(firstChild(wrapperEl, 'VASTAdTagURI'));
							const allowMultipleAds = attr(wrapperEl, 'allowMultipleAds') === 'true';
							if (!nextTagUri) {
								continue;
							}
							return this._resolveWrapperChain(nextTagUri, depth + 1, accumulator)
								.catch((err) => {
									const fallback = attr(wrapperEl, 'fallbackOnNoAd') === 'true';
									if (fallback && ads.indexOf(adEl) < ads.length - 1) {
										return accumulator;
									}
									throw err;
								});
						}
					}

					this.sendError(VAST_ERROR_CODES.WRAPPER_NO_ADS, accumulator);
					return Promise.reject(new Error('No InLine or Wrapper found among <Ad> elements'));
				});
		}

		_mergeWrapperAd(accumulator, wrapperEl) {
			accumulator.adSystem = accumulator.adSystem || textOf(firstChild(wrapperEl, 'AdSystem'));

			allChildren(wrapperEl, 'Error').forEach((el) => {
				const url = textOf(el);
				if (url) accumulator.errorUrls.push(url);
			});

			allChildren(wrapperEl, 'Impression').forEach((el) => {
				const url = textOf(el);
				if (url) accumulator.impressionUrls.push(url);
			});

			const creative = firstChild(wrapperEl, 'Creatives') &&
				allChildren(firstChild(wrapperEl, 'Creatives'), 'Creative');
			(creative || []).forEach((creativeEl) => {
				const linearEl = firstChild(creativeEl, 'Linear');
				if (linearEl) {
					this._mergeLinearTrackingOnly(accumulator, linearEl);
				}
			});

			this._mergeExtensions(accumulator, wrapperEl);
		}

		_mergeLinearTrackingOnly(accumulator, linearEl) {
			const trackingEventsEl = firstChild(linearEl, 'TrackingEvents');
			if (trackingEventsEl) {
				allChildren(trackingEventsEl, 'Tracking').forEach((trackEl) => {
					const eventName = attr(trackEl, 'event');
					const url = textOf(trackEl);
					if (!eventName || !url) return;
					if (!accumulator.linear.trackingEvents[eventName]) {
						accumulator.linear.trackingEvents[eventName] = [];
					}
					accumulator.linear.trackingEvents[eventName].push(url);
				});
			}

			const videoClicksEl = firstChild(linearEl, 'VideoClicks');
			if (videoClicksEl) {
				allChildren(videoClicksEl, 'ClickTracking').forEach((el) => {
					const url = textOf(el);
					if (url) accumulator.linear.clickTrackingUrls.push(url);
				});
			}
		}

		_mergeInlineAd(accumulator, inlineEl) {
			accumulator.adSystem = accumulator.adSystem || textOf(firstChild(inlineEl, 'AdSystem'));
			accumulator.adTitle = textOf(firstChild(inlineEl, 'AdTitle')) || accumulator.adTitle;
			accumulator.description = textOf(firstChild(inlineEl, 'Description')) || accumulator.description;

			allChildren(inlineEl, 'Error').forEach((el) => {
				const url = textOf(el);
				if (url) accumulator.errorUrls.push(url);
			});

			allChildren(inlineEl, 'Impression').forEach((el) => {
				const url = textOf(el);
				if (url) accumulator.impressionUrls.push(url);
			});

			const adParamsCandidates = [];
			const creativesEl = firstChild(inlineEl, 'Creatives');
			const creatives = creativesEl ? allChildren(creativesEl, 'Creative') : [];

			creatives.forEach((creativeEl) => {
				const linearEl = firstChild(creativeEl, 'Linear');
				if (linearEl) {
					this._mergeLinearFull(accumulator, linearEl, adParamsCandidates);
				}

				const nonLinearAdsEl = firstChild(creativeEl, 'NonLinearAds');
				if (nonLinearAdsEl) {
					accumulator.nonLinear = this._extractNonLinear(nonLinearAdsEl);
				}

				const companionAdsEl = firstChild(creativeEl, 'CompanionAds');
				if (companionAdsEl) {
					accumulator.companions = accumulator.companions.concat(
						this._extractCompanions(companionAdsEl)
					);
				}
			});

			if (adParamsCandidates.length) {
				accumulator.adParameters = adParamsCandidates[0];
			}

			this._mergeExtensions(accumulator, inlineEl);
		}

		_mergeLinearFull(accumulator, linearEl, adParamsCandidates) {
			const durationText = textOf(firstChild(linearEl, 'Duration'));
			const durationOffset = parseTimeOffset(durationText);
			if (durationOffset && !durationOffset.isPercent) {
				accumulator.linear.duration = durationOffset.seconds;
			}

			const skipOffsetAttr = attr(linearEl, 'skipoffset') || attr(linearEl, 'skipOffset');
			if (skipOffsetAttr) {
				accumulator.linear.skipOffset = parseTimeOffset(skipOffsetAttr);
			}

			const mediaFilesEl = firstChild(linearEl, 'MediaFiles');
			if (mediaFilesEl) {
				allChildren(mediaFilesEl, 'MediaFile').forEach((mfEl) => {
					const url = textOf(mfEl);
					if (!url) return;
					accumulator.linear.mediaFiles.push({
						url,
						type: (attr(mfEl, 'type') || '').toLowerCase(),
						delivery: (attr(mfEl, 'delivery') || 'progressive').toLowerCase(),
						width: toNumber(attr(mfEl, 'width'), 0),
						height: toNumber(attr(mfEl, 'height'), 0),
						bitrate: toNumber(attr(mfEl, 'bitrate'), 0),
						codec: attr(mfEl, 'codec') || null,
						apiFramework: attr(mfEl, 'apiFramework') || null
					});
				});

				const interactiveEl = firstChild(mediaFilesEl, 'InteractiveCreativeFile');
				if (interactiveEl) {
					const url = textOf(interactiveEl);
					if (url) {
						accumulator.linear.mediaFiles.push({
							url,
							type: (attr(interactiveEl, 'type') || '').toLowerCase(),
							delivery: 'progressive',
							width: 0, height: 0, bitrate: 0,
							codec: null,
							apiFramework: attr(interactiveEl, 'apiFramework') || null,
							interactive: true
						});
					}
				}
			}

			const trackingEventsEl = firstChild(linearEl, 'TrackingEvents');
			if (trackingEventsEl) {
				allChildren(trackingEventsEl, 'Tracking').forEach((trackEl) => {
					const eventName = attr(trackEl, 'event');
					const url = textOf(trackEl);
					if (!eventName || !url) return;

					if (eventName === 'progress') {
						const offsetAttr = attr(trackEl, 'offset');
						const parsed = offsetAttr ? parseTimeOffset(offsetAttr) : null;
						if (parsed) {
							accumulator.linear.progressEvents.push({ ...parsed, url });
						}
						return;
					}

					if (!accumulator.linear.trackingEvents[eventName]) {
						accumulator.linear.trackingEvents[eventName] = [];
					}
					accumulator.linear.trackingEvents[eventName].push(url);
				});
			}

			const videoClicksEl = firstChild(linearEl, 'VideoClicks');
			if (videoClicksEl) {
				const clickThroughEl = firstChild(videoClicksEl, 'ClickThrough');
				if (clickThroughEl) {
					accumulator.linear.clickThrough = textOf(clickThroughEl);
				}
				allChildren(videoClicksEl, 'ClickTracking').forEach((el) => {
					const url = textOf(el);
					if (url) accumulator.linear.clickTrackingUrls.push(url);
				});
			}

			const iconsEl = firstChild(linearEl, 'Icons');
			if (iconsEl) {
				accumulator.icons = accumulator.icons.concat(this._extractIcons(iconsEl));
			}

			const adParamsEl = firstChild(linearEl, 'AdParameters');
			if (adParamsEl) {
				adParamsCandidates.push(textOf(adParamsEl));
			}
		}

		_extractNonLinear(nonLinearAdsEl) {
			const trackingEventsEl = firstChild(nonLinearAdsEl, 'TrackingEvents');
			const trackingEvents = {};
			if (trackingEventsEl) {
				allChildren(trackingEventsEl, 'Tracking').forEach((trackEl) => {
					const eventName = attr(trackEl, 'event');
					const url = textOf(trackEl);
					if (!eventName || !url) return;
					if (!trackingEvents[eventName]) trackingEvents[eventName] = [];
					trackingEvents[eventName].push(url);
				});
			}

			const ads = allChildren(nonLinearAdsEl, 'NonLinear').map((el) => ({
				width: toNumber(attr(el, 'width'), 0),
				height: toNumber(attr(el, 'height'), 0),
				apiFramework: attr(el, 'apiFramework') || null,
				resource: textOf(firstChild(el, 'StaticResource')) ||
					textOf(firstChild(el, 'IFrameResource')) ||
					textOf(firstChild(el, 'HTMLResource')) || null,
				clickThrough: textOf(firstChild(el, 'NonLinearClickThrough')) || null,
				clickTrackingUrls: allChildren(el, 'NonLinearClickTracking').map(textOf).filter(Boolean)
			}));

			return { ads, trackingEvents };
		}

		_extractCompanions(companionAdsEl) {
			return allChildren(companionAdsEl, 'Companion').map((el) => {
				const staticResourceEl = firstChild(el, 'StaticResource');
				const iframeResourceEl = firstChild(el, 'IFrameResource');
				const htmlResourceEl = firstChild(el, 'HTMLResource');

				const trackingEventsEl = firstChild(el, 'TrackingEvents');
				const trackingEvents = {};
				if (trackingEventsEl) {
					allChildren(trackingEventsEl, 'Tracking').forEach((trackEl) => {
						const eventName = attr(trackEl, 'event');
						const url = textOf(trackEl);
						if (!eventName || !url) return;
						if (!trackingEvents[eventName]) trackingEvents[eventName] = [];
						trackingEvents[eventName].push(url);
					});
				}

				return {
					id: attr(el, 'id') || null,
					width: toNumber(attr(el, 'width'), 0),
					height: toNumber(attr(el, 'height'), 0),
					resourceType: staticResourceEl ? 'static' : (iframeResourceEl ? 'iframe' : (htmlResourceEl ? 'html' : null)),
					resourceUrl: textOf(staticResourceEl) || textOf(iframeResourceEl) || null,
					resourceHtml: htmlResourceEl ? textOf(htmlResourceEl) : null,
					creativeType: staticResourceEl ? attr(staticResourceEl, 'creativeType') : null,
					clickThrough: textOf(firstChild(el, 'CompanionClickThrough')) || null,
					clickTrackingUrls: allChildren(el, 'CompanionClickTracking').map(textOf).filter(Boolean),
					altText: textOf(firstChild(el, 'AltText')) || null,
					trackingEvents
				};
			});
		}

		_extractIcons(iconsEl) {
			return allChildren(iconsEl, 'Icon').map((el) => {
				const iconClicksEl = firstChild(el, 'IconClicks');
				return {
					program: attr(el, 'program') || null,
					width: toNumber(attr(el, 'width'), 0),
					height: toNumber(attr(el, 'height'), 0),
					xPosition: attr(el, 'xPosition') || 'right',
					yPosition: attr(el, 'yPosition') || 'top',
					apiFramework: attr(el, 'apiFramework') || null,
					resourceUrl: textOf(firstChild(el, 'StaticResource')) ||
						textOf(firstChild(el, 'IFrameResource')) ||
						textOf(firstChild(el, 'HTMLResource')) || null,
					clickThrough: iconClicksEl ? textOf(firstChild(iconClicksEl, 'IconClickThrough')) : null,
					clickTrackingUrls: iconClicksEl
						? allChildren(iconClicksEl, 'IconClickTracking').map(textOf).filter(Boolean)
						: [],
					viewTrackingUrls: allChildren(el, 'IconViewTracking').map(textOf).filter(Boolean)
				};
			});
		}

		_mergeExtensions(accumulator, parentEl) {
			const extensionsEl = firstChild(parentEl, 'Extensions');
			if (!extensionsEl) return;
			allChildren(extensionsEl, 'Extension').forEach((extEl) => {
				accumulator.extensions.push({
					type: attr(extEl, 'type') || null,
					content: textOf(extEl)
				});
			});
		}

		// -------------------------------------------------------------
		// XML fetching / parsing
		// -------------------------------------------------------------

		_fetchXml(url) {
			this._pendingAbortController = (typeof AbortController !== 'undefined') ? new AbortController() : null;

			const fetchOptions = { method: 'GET', credentials: 'omit' };
			if (this._pendingAbortController) {
				fetchOptions.signal = this._pendingAbortController.signal;
			}

			return fetch(url, fetchOptions)
				.then((response) => {
					if (!response.ok) {
						this.sendError(VAST_ERROR_CODES.FILE_NOT_FOUND);
						throw new Error(`Failed to fetch VAST tag: HTTP ${response.status}`);
					}
					return response.text();
				})
				.then((xmlText) => this._parseXmlString(xmlText))
				.catch((err) => {
					if (err && err.name === 'AbortError') {
						this.sendError(VAST_ERROR_CODES.VAST_TIMEOUT);
						throw new Error('VAST request timed out');
					}
					throw err;
				});
		}

		_parseXmlString(xmlText) {
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
			const parserError = xmlDoc.getElementsByTagName('parsererror')[0];
			if (parserError) {
				this.sendError(VAST_ERROR_CODES.XML_PARSE_ERROR);
				throw new Error('VAST XML parse error: ' + textOf(parserError));
			}
			return xmlDoc;
		}

		// -------------------------------------------------------------
		// MediaFile selection
		// -------------------------------------------------------------

		_getTestVideoEl() {
			if (!this._testVideoEl) {
				this._testVideoEl = document.createElement('video');
			}
			return this._testVideoEl;
		}

		_classifyMediaFile(mediaFile) {
			const type = mediaFile.type || '';
			if (type.indexOf('mpegurl') !== -1 || type.indexOf('x-mpegURL'.toLowerCase()) !== -1 || /\.m3u8($|\?)/i.test(mediaFile.url)) {
				return 'hls';
			}
			if (type.indexOf('mp4') !== -1 || /\.mp4($|\?)/i.test(mediaFile.url)) {
				return 'mp4';
			}
			if (type.indexOf('webm') !== -1 || /\.webm($|\?)/i.test(mediaFile.url)) {
				return 'webm';
			}
			return 'other';
		}

		_isMediaFileSupported(mediaFile) {
			if (mediaFile.apiFramework && mediaFile.apiFramework.toUpperCase() === 'VPAID') {
				// VPAID creatives are not executed by this manager (no ad-unit sandboxing here).
				return false;
			}

			const kind = this._classifyMediaFile(mediaFile);

			if (kind === 'hls') {
				const testEl = this._getTestVideoEl();
				const nativeSupport = testEl.canPlayType('application/vnd.apple.mpegurl') !== '';
				const hlsJsSupport = !!(global.Hls && global.Hls.isSupported && global.Hls.isSupported());
				return nativeSupport || hlsJsSupport;
			}

			if (!mediaFile.type) {
				return true; // unknown MIME, allow as a last-resort candidate
			}

			const testEl = this._getTestVideoEl();
			const result = testEl.canPlayType(mediaFile.type);
			return result === 'probably' || result === 'maybe';
		}

		_selectBestMediaFile(mediaFiles) {
			const priorityOf = { mp4: 1, hls: 2, webm: 3, other: 4 };

			const compatible = mediaFiles
				.filter((mf) => !mf.interactive)
				.filter((mf) => this._isMediaFileSupported(mf))
				.map((mf) => ({ mf, kind: this._classifyMediaFile(mf) }))
				.sort((a, b) => {
					const priorityDiff = priorityOf[a.kind] - priorityOf[b.kind];
					if (priorityDiff !== 0) return priorityDiff;

					const qualityA = a.mf.bitrate || (a.mf.width * a.mf.height) || 0;
					const qualityB = b.mf.bitrate || (b.mf.width * b.mf.height) || 0;
					return qualityB - qualityA;
				});

			return compatible.length ? compatible[0].mf : null;
		}
	}

	// ---------------------------------------------------------------------
	// Export
	// ---------------------------------------------------------------------

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = VastManager;
	} else {
		global.VastManager = VastManager;
	}

})(typeof window !== 'undefined' ? window : globalThis);