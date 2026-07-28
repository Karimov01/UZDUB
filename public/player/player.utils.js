/*!
 * ==========================================
 * UZDUB Player
 * Utils v1.0
 * https://uzdub.net
 * ==========================================
 */

class Utils {

    static formatTime(seconds) {

        if (!isFinite(seconds)) {

            return "00:00";

        }

        seconds = Math.floor(seconds);

        const hours = Math.floor(seconds / 3600);

        const minutes = Math.floor((seconds % 3600) / 60);

        const secs = seconds % 60;

        if (hours > 0) {

            return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(secs)}`;

        }

        return `${this.pad(minutes)}:${this.pad(secs)}`;

    }

    static pad(number) {

        return number.toString().padStart(2, "0");

    }

    static isMobile() {

        return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    }

    static isTouch() {

        return (
            "ontouchstart" in window ||
            navigator.maxTouchPoints > 0
        );

    }

    static clamp(value, min, max) {

        return Math.min(Math.max(value, min), max);

    }

    static debounce(callback, delay = 300) {

        let timer;

        return (...args) => {

            clearTimeout(timer);

            timer = setTimeout(() => {

                callback.apply(null, args);

            }, delay);

        };

    }

    static createElement(tag, className = "") {

        const element = document.createElement(tag);

        if (className) {

            element.className = className;

        }

        return element;

    }

    static addClass(element, className) {

        element.classList.add(className);

    }

    static removeClass(element, className) {

        element.classList.remove(className);

    }

    static toggleClass(element, className) {

        element.classList.toggle(className);

    }

    static hasClass(element, className) {

        return element.classList.contains(className);

    }

}