/* Paraph Café — online menu renderer (GitHub Pages).
 * Reads data/site.json + data/menu.json (edited in the online admin, /admin/) and builds
 * the start screen or the menu page. All text is inserted with textContent, never as HTML.
 */
(function () {
    'use strict';

    var LANG  = document.documentElement.lang === 'en' ? 'en' : 'fa';
    var OTHER = LANG === 'fa' ? 'en' : 'fa';
    var PAGE  = document.body.getAttribute('data-page');   // "welcome" | "menu"

    var T = {
        menu:        { fa: 'منو', en: 'Menu' },
        search:      { fa: 'جستجو در منو…', en: 'Search the menu…' },
        unit:        { fa: 'هزار ت', en: 'K' },
        daily_price: { fa: 'قیمت روز', en: 'Daily price' },
        unavailable: { fa: 'ناموجود', en: 'Sold out' },
        no_results:  { fa: 'موردی پیدا نشد', en: 'Nothing found' },
        theme:       { fa: 'تغییر تم', en: 'Toggle theme' },
        top:         { fa: 'بازگشت به بالا', en: 'Back to top' },
        hours:       { fa: 'ساعات کاری', en: 'Opening hours' },
        contact:     { fa: 'تماس', en: 'Contact' },
        address:     { fa: 'آدرس', en: 'Address' },
        rights:      { fa: 'تمامی حقوق محفوظ است', en: 'All rights reserved' },
        error:       { fa: 'منو بارگذاری نشد. لطفا صفحه را دوباره باز کنید.', en: 'The menu could not be loaded. Please reload the page.' }
    };
    function t(k) { return (T[k] && T[k][LANG]) || k; }

    /* Trusted, constant SVG markup only (never user data). */
    var ICONS = {
        sandwich:  '<path d="M3 11c0-4 4-7 9-7s9 3 9 7H3z"/><path d="M3 15h18"/><path d="M4 19h16a1 1 0 0 0 1-1v-1H3v1a1 1 0 0 0 1 1z"/>',
        leaf:      '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19 14 10"/>',
        cup:       '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3"/>',
        ice:       '<path d="M6 4h12l-1.5 16h-9L6 4z"/><path d="M9 9h3v3H9zM12.5 13h3v3h-3z"/><path d="M14 2l-1 6"/>',
        mug:       '<path d="M5 8h11v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2"/><path d="M7 4c1 .8 1 1.6 0 2.4M10.5 4c1 .8 1 1.6 0 2.4M14 4c1 .8 1 1.6 0 2.4"/>',
        drip:      '<path d="M5 4h14l-5 7h-4L5 4z"/><path d="M12 11v3"/><path d="M7 15h10v3a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-3z"/>',
        smoothie:  '<path d="M6 8h12l-1.5 13h-9L6 8z"/><path d="M5 8h14"/><path d="M13 8l3-6"/><circle cx="10" cy="5" r="2"/>',
        cake:      '<path d="M4 12h16v8H4z"/><path d="M4 16c2 1.5 4 1.5 6 0s4-1.5 6 0 3 1 4 0"/><path d="M12 12V8"/><path d="M12 4.5c.8.8.8 1.8 0 2.5-.8-.7-.8-1.7 0-2.5z"/>',
        glass:     '<path d="M5 4h14l-7 8-7-8z"/><path d="M12 12v8M8 20h8"/><circle cx="16.5" cy="5.5" r="2"/>',
        shake:     '<path d="M7 9h10l-1.3 12H8.3L7 9z"/><path d="M6 9a6 4 0 0 1 12 0"/><path d="M12 5V2l3-1"/>',
        instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>',
        pin:       '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
        arrowR:    '<path d="M5 12h14M13 5l7 7-7 7"/>',
        arrowL:    '<path d="M19 12H5M11 5l-7 7 7 7"/>',
        sun:       '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
        moon:      '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
        search:    '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
        up:        '<path d="M12 19V5M5 12l7-7 7 7"/>'
    };
    function icon(name, cls, width) {
        var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        s.setAttribute('class', cls || 'icon');
        s.setAttribute('viewBox', '0 0 24 24');
        s.setAttribute('fill', 'none');
        s.setAttribute('stroke', 'currentColor');
        s.setAttribute('stroke-width', width || '1.6');
        s.setAttribute('stroke-linecap', 'round');
        s.setAttribute('stroke-linejoin', 'round');
        s.setAttribute('aria-hidden', 'true');
        s.innerHTML = ICONS[name] || ICONS.cup;   // constant markup from the table above
        return s;
    }

    /** Safe element builder: attributes via setAttribute, strings become text nodes. */
    function el(tag, attrs, children) {
        var n = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach(function (k) {
                if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) n.setAttribute(k, attrs[k]);
            });
        }
        (children || []).forEach(function (c) {
            if (c === null || c === undefined || c === false) return;
            n.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
        });
        return n;
    }

    function num(n) {
        var s = String(n);
        return LANG === 'fa' ? s.replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }) : s;
    }
    function txt(obj, lang) { return obj && typeof obj[lang || LANG] === 'string' ? obj[lang || LANG] : ''; }

    /** Only real web links (blocks javascript: and similar). */
    function safeUrl(u) { return /^https:\/\/[^\s"'<>]+$/i.test(u || '') ? u : ''; }
    function instagramHandle(u) {
        var m = /^https:\/\/(?:www\.)?instagram\.com\/([^\/?#]+)/i.exec(u || '');
        return m ? '@' + m[1] : 'Instagram';
    }

    /* ---------- Colours (same formulas as the PHP site) ---------- */
    var DEFAULT_COLORS = { primary: '#4a2c1d', dark: '#2b1a12', accent: '#c08a5b', cream: '#f3e5cf', bg_light: '#f5ede1', bg_dark: '#0f0a07' };
    function themeCss(colors) {
        var c = {};
        Object.keys(DEFAULT_COLORS).forEach(function (k) {
            var v = colors && colors[k];
            c[k] = /^#[0-9a-f]{6}$/i.test(v || '') ? v.toLowerCase() : DEFAULT_COLORS[k];
        });
        var p = c.primary, d = c.dark, a = c.accent, cr = c.cream, l = c.bg_light, k = c.bg_dark;
        var light = '--bg:' + l + ';--bg-2:color-mix(in srgb,' + l + ' 90%,' + p + ');--surface:color-mix(in srgb,' + l + ' 22%,#fff);' +
            '--choco:' + p + ';--choco-deep:' + d + ';--brand-dark:' + d + ';--caramel:' + a + ';--cream:' + cr + ';' +
            '--price-bg:' + cr + ';--price-text:' + p + ';--line:color-mix(in srgb,' + p + ' 16%,transparent);' +
            '--toolbar-bg:color-mix(in srgb,' + l + ' 82%,transparent);--chip-bg:color-mix(in srgb,' + l + ' 22%,#fff);';
        var dark = '--bg:' + k + ';--bg-2:color-mix(in srgb,' + k + ' 90%,' + cr + ');--surface:color-mix(in srgb,' + k + ' 80%,' + p + ');' +
            '--choco:color-mix(in srgb,' + p + ' 85%,#fff);--choco-deep:color-mix(in srgb,' + d + ' 85%,#000);' +
            '--caramel:color-mix(in srgb,' + a + ' 85%,#fff);--price-bg:color-mix(in srgb,' + k + ' 65%,' + p + ');' +
            '--price-text:' + cr + ';--line:color-mix(in srgb,' + cr + ' 12%,transparent);' +
            '--toolbar-bg:color-mix(in srgb,' + k + ' 80%,transparent);--chip-bg:color-mix(in srgb,' + k + ' 80%,' + p + ');';
        return ':root{' + light + '}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){' + dark + '}}:root[data-theme="dark"]{' + dark + '}';
    }
    function applyTheme(colors) {
        var css = themeCss(colors);
        var tag = document.getElementById('themeColors') || document.head.appendChild(el('style', { id: 'themeColors' }));
        tag.textContent = css;
        try { localStorage.setItem('paraph_theme_css', css); } catch (e) {}
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta && colors && /^#[0-9a-f]{6}$/i.test(colors.dark || '')) meta.setAttribute('content', colors.dark);
    }

    /* ---------- Start screen ---------- */
    function renderWelcome(site) {
        var main = el('main', { 'class': 'welcome' }, [
            el('div', { 'class': 'welcome__glow', 'aria-hidden': 'true' }),
            el('div', { 'class': 'welcome__card' }, [
                el('span', { 'class': 'welcome__logo', 'aria-hidden': 'true' }, ['P']),
                el('h1', { 'class': 'welcome__title' }, [
                    el('span', { lang: 'fa' }, [txt(site.name, 'fa')]),
                    el('span', { lang: 'en' }, [txt(site.name, 'en')])
                ]),
                el('p', { 'class': 'welcome__tagline' }, [
                    el('span', { lang: 'fa' }, [txt(site.tagline, 'fa')]),
                    el('span', { lang: 'en' }, [txt(site.tagline, 'en')])
                ]),
                el('div', { 'class': 'welcome__actions' }, [
                    el('a', { 'class': 'start-btn start-btn--solid', href: 'menu-fa.html', lang: 'fa' }, [el('span', null, ['شروع · مشاهده منو']), icon('arrowL', null, '2')]),
                    el('a', { 'class': 'start-btn start-btn--outline', href: 'menu-en.html', lang: 'en', dir: 'ltr' }, [el('span', null, ['Start · View Menu']), icon('arrowR', null, '2')])
                ]),
                safeUrl(site.instagram) ? el('div', { 'class': 'welcome__social' }, [
                    el('a', { 'class': 'social-btn', href: safeUrl(site.instagram), target: '_blank', rel: 'noopener' }, [
                        icon('instagram'), el('span', { dir: 'ltr' }, [instagramHandle(site.instagram)])
                    ])
                ]) : null,
                el('p', { 'class': 'welcome__hours' }, [
                    el('span', { lang: 'fa' }, [txt(site.hours, 'fa')]),
                    el('span', { 'class': 'dot', 'aria-hidden': 'true' }, ['•']),
                    el('span', { lang: 'en' }, [txt(site.hours, 'en')])
                ]),
                txt(site.address, 'fa') ? el('p', { 'class': 'welcome__address' }, [icon('pin'), ' ' + txt(site.address, 'fa')]) : null
            ])
        ]);
        document.body.replaceChildren(main);
        document.title = txt(site.name, 'fa') + ' · ' + txt(site.name, 'en');
    }

    /* ---------- Menu page ---------- */
    function renderMenu(site, menu) {
        var cats = (menu.categories || []).filter(function (c) { return c.visible !== false; });

        var header = el('header', { 'class': 'topbar' }, [
            el('div', { 'class': 'container topbar__inner' }, [
                el('a', { 'class': 'brand', href: './' }, [
                    el('span', { 'class': 'brand__mark', 'aria-hidden': 'true' }, ['P']),
                    el('span', { 'class': 'brand__name' }, [txt(site.name)])
                ]),
                el('div', { 'class': 'topbar__actions' }, [
                    el('nav', { 'class': 'lang-switch', 'aria-label': 'Language' }, [
                        el('a', { href: 'menu-fa.html', 'class': LANG === 'fa' ? 'is-active' : null, hreflang: 'fa', lang: 'fa' }, ['فا']),
                        el('a', { href: 'menu-en.html', 'class': LANG === 'en' ? 'is-active' : null, hreflang: 'en', lang: 'en' }, ['EN'])
                    ]),
                    el('button', { 'class': 'icon-btn', id: 'themeToggle', type: 'button', 'aria-label': t('theme'), title: t('theme') }, [
                        icon('sun', 'i-sun', '1.8'), icon('moon', 'i-moon', '1.8')
                    ])
                ])
            ])
        ]);

        var drip = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        drip.setAttribute('class', 'hero__drip');
        drip.setAttribute('viewBox', '0 0 1200 60');
        drip.setAttribute('preserveAspectRatio', 'none');
        drip.setAttribute('aria-hidden', 'true');
        drip.innerHTML = '<path d="M0,0 H1200 V18 C1170,18 1165,46 1140,46 C1115,46 1112,18 1080,18 H960 C935,18 935,54 905,54 C875,54 878,18 850,18 H700 C680,18 680,38 660,38 C640,38 640,18 620,18 H460 C435,18 432,58 400,58 C368,58 368,18 340,18 H220 C200,18 198,40 175,40 C152,40 150,18 130,18 H0 Z"/>';

        var hero = el('section', { 'class': 'hero' }, [
            el('div', { 'class': 'container hero__inner' }, [
                el('p', { 'class': 'hero__eyebrow' }, [t('menu') + ' · ' + (LANG === 'fa' ? 'Menu' : 'منو')]),
                el('h1', { 'class': 'hero__title' }, [txt(site.name)]),
                el('p', { 'class': 'hero__tagline' }, [txt(site.tagline)]),
                el('div', { 'class': 'hero__meta' }, [el('span', { 'class': 'pill' }, [txt(site.hours)])])
            ]),
            drip
        ]);

        var chips = el('nav', { 'class': 'chips', id: 'chips', 'aria-label': t('menu') }, cats.map(function (c) {
            return el('a', { 'class': 'chip', href: '#cat-' + c.id, 'data-target': 'cat-' + c.id }, [icon(c.icon), el('span', null, [txt(c.title)])]);
        }));
        var toolbar = el('div', { 'class': 'toolbar', id: 'toolbar' }, [
            el('div', { 'class': 'container' }, [
                el('label', { 'class': 'search' }, [
                    icon('search', null, '2'),
                    el('input', { type: 'search', id: 'search', placeholder: t('search'), autocomplete: 'off' })
                ]),
                chips
            ])
        ]);

        var sections = cats.map(function (c, i) {
            var items = (c.items || []).map(function (it) {
                var soldOut = it.available === false;
                var price;
                if (soldOut) {
                    price = el('span', { 'class': 'price price--soldout' }, [t('unavailable')]);
                } else if (it.price === null || it.price === undefined || it.price === '') {
                    price = el('span', { 'class': 'price price--daily' }, [t('daily_price')]);
                } else {
                    price = el('span', { 'class': 'price' }, [
                        it.addon ? el('small', null, ['+']) : null,
                        ' ' + num(it.price) + ' ',
                        el('small', null, [t('unit')])
                    ]);
                }
                return el('li', {
                    'class': 'item' + (it.addon ? ' item--addon' : '') + (soldOut ? ' item--soldout' : ''),
                    'data-search': (txt(it.name, 'fa') + ' ' + txt(it.name, 'en')).toLowerCase()
                }, [
                    el('div', { 'class': 'item__names' }, [
                        el('span', { 'class': 'item__name' }, [txt(it.name)]),
                        el('span', { 'class': 'item__sub', lang: OTHER }, [txt(it.name, OTHER)])
                    ]),
                    el('span', { 'class': 'item__dots', 'aria-hidden': 'true' }),
                    price
                ]);
            });
            return el('section', { 'class': 'category', id: 'cat-' + c.id }, [
                el('header', { 'class': 'category__head' }, [
                    el('span', { 'class': 'category__icon' }, [icon(c.icon)]),
                    el('div', { 'class': 'category__titles' }, [
                        el('h2', null, [txt(c.title)]),
                        el('span', { 'class': 'category__sub', lang: OTHER }, [txt(c.title, OTHER)])
                    ]),
                    el('span', { 'class': 'category__num' }, [num(i + 1 < 10 ? '0' + (i + 1) : i + 1)])
                ]),
                txt(c.note) ? el('p', { 'class': 'category__note' }, [txt(c.note)]) : null,
                el('ul', { 'class': 'items' }, items)
            ]);
        });

        var main = el('main', null, [
            hero,
            toolbar,
            el('div', { 'class': 'container' }, [
                el('div', { 'class': 'menu', id: 'menu' }, sections),
                el('p', { 'class': 'empty', id: 'empty', hidden: 'hidden' }, [t('no_results')])
            ])
        ]);

        var phone = (site.phone || '').replace(/[^\d+]/g, '');
        var contact = [];
        if (phone) contact.push(el('p', null, [el('a', { href: 'tel:' + phone, dir: 'ltr' }, [num(site.phone)])]));
        if (safeUrl(site.instagram)) contact.push(el('p', null, [el('a', { href: safeUrl(site.instagram), target: '_blank', rel: 'noopener', dir: 'ltr' }, [instagramHandle(site.instagram)])]));

        var footer = el('footer', { 'class': 'footer' }, [
            el('div', { 'class': 'container footer__grid' }, [
                el('div', { 'class': 'footer__brand' }, [
                    el('span', { 'class': 'brand__mark', 'aria-hidden': 'true' }, ['P']),
                    el('div', null, [el('strong', null, [txt(site.name)]), el('p', null, [txt(site.tagline)])])
                ]),
                el('div', null, [el('h4', null, [t('hours')]), el('p', null, [txt(site.hours)])]),
                el('div', null, [el('h4', null, [t('address')]), el('p', null, [txt(site.address)])]),
                contact.length ? el('div', null, [el('h4', null, [t('contact')])].concat(contact)) : null
            ]),
            el('div', { 'class': 'container footer__bottom' }, ['© ' + num(new Date().getFullYear()) + ' ' + txt(site.name) + ' — ' + t('rights')])
        ]);

        var toTop = el('button', { 'class': 'to-top', id: 'toTop', type: 'button', 'aria-label': t('top') }, [icon('up', null, '2')]);

        document.body.replaceChildren(header, main, footer, toTop);
        document.title = txt(site.name) + ' — ' + t('menu');
        var desc = document.querySelector('meta[name="description"]');
        if (desc) desc.setAttribute('content', txt(site.tagline));

        // Search, category scroll-spy, theme toggle, back-to-top (same script as the PHP site)
        var s = document.createElement('script');
        s.src = 'assets/js/main.js?v=5';
        document.body.appendChild(s);
    }

    function showError() {
        document.body.replaceChildren(el('p', { style: 'padding:40px 16px;text-align:center;font-family:Vazirmatn,sans-serif' }, [t('error')]));
    }

    function getJson(path) {
        return fetch(path + '?v=' + Date.now(), { cache: 'no-store' }).then(function (r) {
            if (!r.ok) throw new Error(path + ' ' + r.status);
            return r.json();
        });
    }

    Promise.all([getJson('data/site.json'), getJson('data/menu.json')]).then(function (res) {
        var site = res[0] || {}, menu = res[1] || {};
        applyTheme(site.colors);
        if (PAGE === 'welcome') renderWelcome(site); else renderMenu(site, menu);
    }).catch(function (e) {
        if (window.console) console.error(e);
        showError();
    });
})();
