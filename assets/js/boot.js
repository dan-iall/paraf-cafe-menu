/* Paraph Café — runs first in <head> of the menu pages (before paint):
 * JS flag, saved light/dark choice, last known café colours, non-blocking Google Fonts.
 * It lives in a file instead of an inline <script> so the pages can use a strict
 * Content-Security-Policy (script-src 'self').
 */
(function () {
    var d = document.documentElement;
    d.className += ' js';
    try {
        var th = localStorage.getItem('theme');
        if (th === 'dark' || th === 'light') d.setAttribute('data-theme', th);
        var css = localStorage.getItem('paraph_theme_css');
        var tag = document.getElementById('themeColors');
        if (css && tag && /^:root\{[^<]*$/.test(css)) tag.textContent = css;
    } catch (e) {}

    // Fonts load as media="print" (not render-blocking) and switch on when ready.
    var f = document.getElementById('fonts');
    if (f) {
        if (f.sheet) f.media = 'all';
        else f.addEventListener('load', function () { f.media = 'all'; });
    }
})();
