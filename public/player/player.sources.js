/*!
 * ==========================================
 * UZDUB Player
 * Source Manager v2.0
 * https://uzdub.net
 * ==========================================
 */

class SourceManager {

    constructor(player) {

        this.player = player;

        this.video = player.video;

        this.hls = null;

        this.currentKind = null; // "mp4" | "hls" | "embed"

    }

    load(source) {

        if (typeof source === "string") {

            source = { src: source };

        }

        const src = source.src || "";
        const type = (source.type || "").toLowerCase();

        this.destroy();

        if (!src) {

            return;

        }

        if (this.isEmbed(src) || ["youtube", "okru", "mover", "embed"].includes(type)) {

            this.loadEmbed(src, type);

            return;

        }

        this.showVideo();

        if (type === "hls" || this.isHLS(src)) {

            this.currentKind = "hls";

            this.loadHLS(src);

            return;

        }

        this.currentKind = "mp4";

        this.loadMP4(src);

    }

    showVideo() {

        this.video.style.display = "";

        const frame = this.player.ui.elements.embed;

        if (frame) {

            frame.innerHTML = "";

            frame.classList.remove("show");

        }

        this.player.ui.elements.wrapper.classList.remove("uzdub-embed-mode");

    }

    loadMP4(src) {

        this.video.src = src;

        this.video.load();

    }

    loadHLS(src) {

        if (this.video.canPlayType("application/vnd.apple.mpegurl")) {

            this.video.src = src;

            this.video.load();

            return;

        }

        if (typeof Hls === "undefined") {

            console.error("Hls.js not found.");

            return;

        }

        this.hls = new Hls({

            enableWorker: true,

            lowLatencyMode: true

        });

        this.hls.loadSource(src);

        this.hls.attachMedia(this.video);

    }

    /* ==========================
       Embed (YouTube / OK.ru / Mover.uz)
    ========================== */

    loadEmbed(src, type) {

        this.currentKind = "embed";

        // Cross-origin iframe yuklanish holatini video eventlari orqali
        // bilib bo'lmaydi. Avvalgi MP4/HLS loaderi ko'rinib qolmasin.
        this.player.ui.hideSpinner();

        const url = this.buildEmbedUrl(src, type);

        const frame = this.player.ui.elements.embed;

        this.video.pause();

        this.video.removeAttribute("src");

        this.video.style.display = "none";

        this.player.ui.elements.wrapper.classList.add("uzdub-embed-mode");

        this.player.ui.hidePoster();

        frame.innerHTML =
            `<iframe
                src="${url}"
                frameborder="0"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowfullscreen
            ></iframe>`;

        frame.classList.add("show");

    }

    detectProvider(src) {

        if (/youtube\.com|youtu\.be/i.test(src)) return "youtube";

        if (/ok\.ru|odnoklassniki\.ru/i.test(src)) return "okru";

        if (/mover\.uz/i.test(src)) return "mover";

        return null;

    }

    isEmbed(src) {

        return !!this.detectProvider(src);

    }

    buildEmbedUrl(src, type) {

        const provider =
            type && type !== "embed" ? type : this.detectProvider(src);

        if (provider === "youtube") {

            const id = this.youtubeId(src);

            return id
                ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`
                : src;

        }

        if (provider === "okru") {

            const id = this.okruId(src);

            return id
                ? `https://ok.ru/videoembed/${id}?autoplay=1`
                : src;

        }

        if (provider === "mover") {

            if (/\/embed\//i.test(src)) return src;

            return src.replace(/\/watch\//i, "/embed/");

        }

        return src;

    }

    youtubeId(src) {

        const m = src.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);

        return m ? m[1] : null;

    }

    okruId(src) {

        const m = src.match(/(?:video|videoembed)\/(\d+)/);

        return m ? m[1] : null;

    }

    isMP4(src) {

        return /\.mp4($|\?)/i.test(src);

    }

    isHLS(src) {

        return /\.m3u8($|\?)/i.test(src);

    }

    destroy() {

        if (this.hls) {

            this.hls.destroy();

            this.hls = null;

        }

        const ui = this.player.ui;

        if (ui && ui.elements.embed) {

            ui.elements.embed.innerHTML = "";

            ui.elements.embed.classList.remove("show");

        }

        if (this.video) {

            this.video.removeAttribute("src");

            try {

                this.video.load();

            } catch (e) { /* ignore */ }

        }

    }

}
