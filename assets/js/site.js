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
        error:       { fa: 'منو بارگذاری نشد. لطفا صفحه را دوباره باز کنید.', en: 'The menu could not be loaded. Please reload the page.' },
        badge_barista: { fa: 'پیشنهاد باریستا', en: "Barista's Pick" },
        badge_popular: { fa: 'محبوب‌ترین', en: 'Best Seller' },
        badge_new:     { fa: 'جدید', en: 'New' },
        badge_special: { fa: 'ویژه', en: 'Special' },
        order_tray_title: { fa: 'صورت‌حساب', en: 'Your Order' },
        order_items_unit: { fa: 'آیتم', en: 'items' },
        order_total:      { fa: 'مبلغ قابل پرداخت:', en: 'Total Payable:' },
        order_view:       { fa: 'مشاهده اقلام', en: 'View Items' },
        order_clear:      { fa: 'پاک کردن', en: 'Clear' },
        order_clear_confirm: { fa: 'آیا مایل به حذف تمام موارد از فاکتور هستید؟', en: 'Clear all items from your order?' },
        order_modal_title:{ fa: 'ریز اقلام سفارش', en: 'Order Summary' },
        order_copy:       { fa: 'کپی فاکتور برای صندوق', en: 'Copy order list' },
        order_copied:     { fa: 'فاکتور کپی شد! ✓', en: 'Copied! ✓' },
        order_close:      { fa: 'بستن', en: 'Close' },
        order_add:        { fa: 'افزودن', en: 'Add' },
        order_empty:      { fa: 'هنوز آیتمی انتخاب نشده است.', en: 'No items selected yet.' },
        counter_title:        { fa: 'صورت‌حساب و پرداخت در صندوق', en: 'Counter Payment & Bill' },
        counter_subtitle:     { fa: 'نمایش مبلغ نهایی جهت تسویه در کارتخوان یا صندوق', en: 'Final payable amount for cashier & POS' },
        counter_table:        { fa: 'انتخاب شماره میز یا بیرون‌بر:', en: 'Select Table or Takeaway:' },
        counter_takeaway:     { fa: 'بیرون‌بر', en: 'Takeaway' },
        counter_table_prefix: { fa: 'میز', en: 'Table' },
        counter_pay_box_title:{ fa: 'مبلغ نهایی قابل پرداخت در صندوق (کارتخوان)', en: 'Final Amount to Pay at POS Counter' },
        counter_words_prefix: { fa: 'مبلغ به حروف:', en: 'Amount in words:' },
        counter_pos_tip:      { fa: 'لطفاً هنگام کشیدن کارت، مبلغ فوق را در نمایشگر دستگاه کارتخوان بررسی نمایید.', en: 'Please check this amount on the POS terminal screen before confirming payment.' },
        counter_add_more:     { fa: '+ افزودن آیتم بیشتر (منو)', en: '+ Add More Items (Menu)' },
        counter_new_order:    { fa: '✓ پرداخت شد / سفارش جدید', en: '✓ Paid / New Order' },
        counter_back_menu:    { fa: 'بازگشت به منو', en: 'Back to Menu' },
        counter_pay_btn:      { fa: 'پرداخت در صندوق', en: 'Pay at Counter' },
        counter_order_num:    { fa: 'شماره فاکتور:', en: 'Order Ref:' },
        counter_date:         { fa: 'زمان ثبت:', en: 'Time:' },
        counter_empty_prompt: { fa: 'هنوز آیتمی به سفارش خود اضافه نکرده‌اید.', en: 'No items in your order yet.' },
        counter_empty_desc:   { fa: 'برای انتخاب نوشیدنی‌ها و دسرهای مورد نظر خود به منو بروید.', en: 'Go to the menu to select your drinks, pastries and dishes.' },
        counter_view_menu:    { fa: 'مشاهده منو و انتخاب آیتم‌ها', en: 'View Menu & Pick Items' },
        counter_paid_success: { fa: 'با تشکر از سفارش شما! فاکتور تسویه و بسته شد.', en: 'Thank you! The bill has been settled successfully.' },
        counter_row_total:    { fa: 'جمع:', en: 'Total:' }
    };
    function t(k) { return (T[k] && T[k][LANG]) || k; }

    function tomanToWords(amountInThousands) {
        if (!amountInThousands || isNaN(amountInThousands) || amountInThousands === 0) return LANG === 'fa' ? 'صفر تومان' : 'Zero';
        var toman = Math.round(amountInThousands * 1000);
        var ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
        var teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
        var tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
        var hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
        function chunk(n) {
            var p = [];
            var h = Math.floor(n / 100);
            var r = n % 100;
            if (h > 0) p.push(hundreds[h]);
            if (r >= 10 && r <= 19) {
                p.push(teens[r - 10]);
            } else {
                var t = Math.floor(r / 10);
                var o = r % 10;
                if (t > 0) p.push(tens[t]);
                if (o > 0) p.push(ones[o]);
            }
            return p.join(' و ');
        }
        var millions = Math.floor(toman / 1000000);
        var thousands = Math.floor((toman % 1000000) / 1000);
        var rem = toman % 1000;
        var parts = [];
        if (millions > 0) parts.push(chunk(millions) + ' میلیون');
        if (thousands > 0) parts.push(chunk(thousands) + ' هزار');
        if (rem > 0) parts.push(chunk(rem));
        return parts.length ? parts.join(' و ') + ' تومان' : '';
    }

    function formatTomanCommas(amountInThousands, lang) {
        var toman = Math.round((amountInThousands || 0) * 1000);
        var s = toman.toLocaleString('en-US');
        return (lang || LANG) === 'fa' ? s.replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }) : s;
    }

    function buildItemMap(menu) {
        var map = {};
        (menu.categories || []).forEach(function (c) {
            (c.items || []).forEach(function (it) {
                map[it.id] = it;
            });
        });
        return map;
    }

    function loadSavedOrder(itemMap) {
        var res = {};
        try {
            var raw = localStorage.getItem('paraph_order');
            if (!raw) return res;
            var parsed = JSON.parse(raw);
            Object.keys(parsed).forEach(function (id) {
                if (itemMap[id] && parsed[id] && parsed[id].count > 0) {
                    res[id] = { item: itemMap[id], count: parsed[id].count };
                }
            });
        } catch (e) {}
        return res;
    }

    function saveStoredOrder(order) {
        try {
            var simplified = {};
            Object.keys(order).forEach(function (id) {
                if (order[id] && order[id].count > 0) {
                    simplified[id] = { count: order[id].count };
                }
            });
            localStorage.setItem('paraph_order', JSON.stringify(simplified));
        } catch (e) {}
    }

    function getOrderRefCode() {
        var ref = '';
        try {
            ref = sessionStorage.getItem('paraph_order_ref');
            if (!ref) {
                ref = '#P-' + Math.floor(100 + Math.random() * 900);
                sessionStorage.setItem('paraph_order_ref', ref);
            }
        } catch (e) {
            ref = '#P-' + Math.floor(100 + Math.random() * 900);
        }
        return ref;
    }

    function resetOrderRefCode() {
        try { sessionStorage.removeItem('paraph_order_ref'); } catch (e) {}
    }

    function getFormattedDateTime() {
        var now = new Date();
        try {
            var opts = { hour: '2-digit', minute: '2-digit' };
            var timeStr = now.toLocaleTimeString(LANG === 'fa' ? 'fa-IR' : 'en-US', opts);
            var dateStr = now.toLocaleDateString(LANG === 'fa' ? 'fa-IR' : 'en-US', { month: 'short', day: 'numeric' });
            return dateStr + ' — ' + timeStr;
        } catch (e) {
            return now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
        }
    }

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
        star:      '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        sparkle:   '<path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/>',
        receipt:   '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
        trash:     '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        copy:      '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
        check:     '<path d="M20 6 9 17l-5-5"/>',
        plus:      '<path d="M12 5v14M5 12h14"/>',
        close:     '<path d="M18 6 6 18M6 6l12 12"/>',
        up:        '<path d="M12 19V5M5 12l7-7 7 7"/>',
        card:      '<rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/>',
        table:     '<rect x="3" y="4" width="18" height="6" rx="2"/><path d="M6 10v10M18 10v10M10 10v6M14 10v6"/>'
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

    /** Safe element builder: attributes via setAttribute or event listeners, strings become text nodes. */
    function el(tag, attrs, children) {
        var n = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach(function (k) {
                if (attrs[k] === null || attrs[k] === undefined || attrs[k] === false) return;
                if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') {
                    n.addEventListener(k.substring(2).toLowerCase(), attrs[k]);
                } else {
                    n.setAttribute(k, attrs[k]);
                }
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

        /* ---------- Price sum calculator state ---------- */
        var order = {};     // itemId -> { item: it, count: number }
        var itemMap = {};   // itemId -> it
        var trayEl = null;
        var modalEl = null;
        var modalBody = null;
        var modalTotalSpan = null;
        var copyBtn = null;

        function getOrderCount() {
            var c = 0;
            Object.keys(order).forEach(function (k) { c += order[k].count; });
            return c;
        }

        function getOrderTotal() {
            var sum = 0;
            Object.keys(order).forEach(function (k) { sum += (order[k].item.price || 0) * order[k].count; });
            return sum;
        }

        function updateItemControl(itemId) {
            var ctrl = document.querySelector('[data-item-ctrl="' + itemId + '"]');
            if (!ctrl) return;
            var entry = order[itemId];
            var count = entry ? entry.count : 0;
            ctrl.replaceChildren();
            if (count === 0) {
                var addBtn = el('button', {
                    'class': 'btn-add',
                    type: 'button',
                    'aria-label': t('order_add'),
                    title: t('order_add')
                }, [icon('plus', 'icon--xs', '2.4')]);
                addBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    changeItemQty(itemId, 1);
                });
                ctrl.appendChild(addBtn);
                ctrl.classList.remove('is-active');
            } else {
                var subBtn = el('button', { 'class': 'stepper__btn stepper__btn--sub', type: 'button', 'aria-label': '-' }, ['−']);
                var countSpan = el('span', { 'class': 'stepper__val' }, [num(count)]);
                var addBtn = el('button', { 'class': 'stepper__btn stepper__btn--add', type: 'button', 'aria-label': '+' }, ['+']);
                subBtn.addEventListener('click', function (e) { e.stopPropagation(); changeItemQty(itemId, -1); });
                addBtn.addEventListener('click', function (e) { e.stopPropagation(); changeItemQty(itemId, 1); });
                ctrl.appendChild(subBtn);
                ctrl.appendChild(countSpan);
                ctrl.appendChild(addBtn);
                ctrl.classList.add('is-active');
            }
        }

        function changeItemQty(itemId, delta) {
            var it = itemMap[itemId];
            if (!it) return;
            if (!order[itemId]) {
                if (delta > 0) order[itemId] = { item: it, count: delta };
            } else {
                order[itemId].count += delta;
                if (order[itemId].count <= 0) delete order[itemId];
            }
            saveStoredOrder(order);
            updateItemControl(itemId);
            updateTray();
            if (modalEl && modalEl.classList.contains('is-open')) renderModalContent();
        }

        function clearAllOrder() {
            var keys = Object.keys(order);
            order = {};
            saveStoredOrder(order);
            keys.forEach(function (id) { updateItemControl(id); });
            updateTray();
            closeModal();
        }

        function updateTray() {
            var count = getOrderCount();
            var sum = getOrderTotal();
            if (trayEl) {
                if (count > 0) {
                    trayEl.classList.add('is-visible');
                    var countEl = trayEl.querySelector('.tray__badge');
                    if (countEl) countEl.textContent = num(count);
                    var sumEl = trayEl.querySelector('.tray__sum-val');
                    if (sumEl) sumEl.textContent = num(sum) + ' ' + t('unit');
                } else {
                    trayEl.classList.remove('is-visible');
                    closeModal();
                }
            }
        }

        function openModal() {
            if (getOrderCount() === 0) return;
            renderModalContent();
            modalEl.classList.add('is-open');
            modalEl.setAttribute('aria-hidden', 'false');
            document.body.classList.add('has-modal');
        }

        function closeModal() {
            if (!modalEl) return;
            modalEl.classList.remove('is-open');
            modalEl.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('has-modal');
        }

        function renderModalContent() {
            if (!modalBody) return;
            var keys = Object.keys(order);
            if (keys.length === 0) {
                modalBody.replaceChildren(el('p', { 'class': 'order-modal__empty' }, [t('order_empty')]));
                if (modalTotalSpan) modalTotalSpan.textContent = '0 ' + t('unit');
                return;
            }
            var rows = keys.map(function (id) {
                var entry = order[id];
                var it = entry.item;
                var count = entry.count;
                var subtotal = (it.price || 0) * count;

                var subBtn = el('button', { 'class': 'stepper__btn stepper__btn--sub', type: 'button' }, ['−']);
                var countSpan = el('span', { 'class': 'stepper__val' }, [num(count)]);
                var addBtn = el('button', { 'class': 'stepper__btn stepper__btn--add', type: 'button' }, ['+']);
                subBtn.addEventListener('click', function () { changeItemQty(id, -1); });
                addBtn.addEventListener('click', function () { changeItemQty(id, 1); });

                var stepper = el('div', { 'class': 'stepper is-active' }, [subBtn, countSpan, addBtn]);

                var delBtn = el('button', { 'class': 'icon-btn icon-btn--del', type: 'button', title: t('order_clear') }, [icon('trash', 'icon--xs')]);
                delBtn.addEventListener('click', function () {
                    delete order[id];
                    saveStoredOrder(order);
                    updateItemControl(id);
                    updateTray();
                    renderModalContent();
                });

                return el('div', { 'class': 'order-row' }, [
                    el('div', { 'class': 'order-row__names' }, [
                        el('strong', { 'class': 'order-row__name' }, [txt(it.name)]),
                        el('small', { 'class': 'order-row__unit-price' }, [num(it.price) + ' ' + t('unit') + ' / ' + t('order_items_unit')])
                    ]),
                    stepper,
                    el('div', { 'class': 'order-row__total' }, [
                        el('strong', null, [num(subtotal) + ' ' + t('unit')])
                    ]),
                    delBtn
                ]);
            });

            modalBody.replaceChildren(el('div', { 'class': 'order-rows' }, rows));
            var tot = getOrderTotal();
            if (modalTotalSpan) {
                modalTotalSpan.textContent = formatTomanCommas(tot, LANG) + ' تومان';
            }
            var wordsEl = modalEl.querySelector('.order-modal__words');
            if (wordsEl) {
                wordsEl.textContent = tomanToWords(tot);
            }
        }

        var sections = cats.map(function (c, i) {
            var items = (c.items || []).map(function (it) {
                itemMap[it.id] = it;
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
                var badgeEl = null;
                if (it.badge) {
                    var bKey = 'badge_' + it.badge;
                    var bLabel = (T[bKey] && T[bKey][LANG]) || (typeof it.badge === 'object' ? txt(it.badge) : it.badge);
                    var bIcon = it.badge === 'barista' ? icon('sparkle', 'badge__icon', '2') :
                                (it.badge === 'popular' ? icon('star', 'badge__icon', '2') : null);
                    var badgeChildren = [];
                    if (bIcon) badgeChildren.push(bIcon);
                    badgeChildren.push(el('span', null, [bLabel]));
                    badgeEl = el('span', { 'class': 'badge badge--' + (typeof it.badge === 'string' ? it.badge : 'custom') }, badgeChildren);
                }

                var canOrder = !soldOut && it.price !== null && it.price !== undefined && it.price !== '';
                var actionChildren = [price];
                if (canOrder) {
                    actionChildren.push(el('div', { 'class': 'item__ctrl', 'data-item-ctrl': it.id }));
                }

                return el('li', {
                    'class': 'item' + (it.addon ? ' item--addon' : '') + (soldOut ? ' item--soldout' : '') + (it.badge ? ' item--featured' : ''),
                    'data-search': (txt(it.name, 'fa') + ' ' + txt(it.name, 'en')).toLowerCase()
                }, [
                    el('div', { 'class': 'item__names' }, [
                        el('div', { 'class': 'item__title-row' }, [
                            el('span', { 'class': 'item__name' }, [txt(it.name)]),
                            badgeEl
                        ]),
                        el('span', { 'class': 'item__sub', lang: OTHER }, [txt(it.name, OTHER)])
                    ]),
                    el('span', { 'class': 'item__dots', 'aria-hidden': 'true' }),
                    el('div', { 'class': 'item__action' }, actionChildren)
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

        // Load persisted order items
        order = loadSavedOrder(itemMap);

        /* ---------- Floating Tray ---------- */
        trayEl = el('aside', { 'class': 'order-tray', 'id': 'orderTray', 'aria-label': t('order_tray_title') }, [
            el('div', { 'class': 'tray__info', onclick: openModal }, [
                el('div', { 'class': 'tray__icon-wrap' }, [
                    icon('receipt', 'tray__icon'),
                    el('span', { 'class': 'tray__badge' }, ['0'])
                ]),
                el('div', { 'class': 'tray__text' }, [
                    el('span', { 'class': 'tray__label' }, [t('order_total')]),
                    el('strong', { 'class': 'tray__sum-val' }, ['0 ' + t('unit')])
                ])
            ]),
            el('div', { 'class': 'tray__actions' }, [
                el('button', { 'class': 'btn btn--tray-view', type: 'button', onclick: openModal }, [
                    icon('up', 'icon--xs'),
                    el('span', null, [t('order_view')])
                ]),
                el('a', { 'class': 'btn btn--primary btn--tray', href: 'counter.html' }, [
                    icon('card', 'icon--xs'),
                    el('span', null, [t('counter_pay_btn')])
                ]),
                el('button', { 'class': 'icon-btn icon-btn--tray-clear', type: 'button', title: t('order_clear'), 'aria-label': t('order_clear'), onclick: function () {
                    if (confirm(t('order_clear_confirm'))) clearAllOrder();
                } }, [icon('trash', 'icon--xs')])
            ])
        ]);

        /* ---------- Modal / Bottom Sheet ---------- */
        modalEl = el('div', { 'class': 'order-modal', id: 'orderModal', 'aria-hidden': 'true' }, [
            el('div', { 'class': 'order-modal__backdrop', onclick: closeModal }),
            el('div', { 'class': 'order-modal__dialog' }, [
                el('header', { 'class': 'order-modal__head' }, [
                    el('div', { 'class': 'order-modal__title-box' }, [
                        icon('receipt', 'icon--gold'),
                        el('h3', null, [t('order_modal_title')])
                    ]),
                    el('button', { 'class': 'icon-btn icon-btn--close', type: 'button', 'aria-label': t('order_close'), onclick: closeModal }, [icon('close')])
                ]),
                modalBody = el('div', { 'class': 'order-modal__body' }),
                el('footer', { 'class': 'order-modal__foot' }, [
                    el('div', { 'class': 'order-modal__total-banner' }, [
                        el('div', { 'class': 'order-modal__total-col' }, [
                            el('span', null, [t('order_total')]),
                            el('small', { 'class': 'order-modal__words' }, [tomanToWords(getOrderTotal())])
                        ]),
                        modalTotalSpan = el('strong', { 'class': 'order-modal__total-amount' }, ['0 تومان'])
                    ]),
                    el('div', { 'class': 'order-modal__actions' }, [
                        el('a', { 'class': 'btn btn--primary btn--to-counter', href: 'counter.html' }, [
                            icon('card', 'icon--xs'),
                            el('span', null, [t('counter_pay_btn') + ' ←'])
                        ]),
                        copyBtn = el('button', { 'class': 'btn btn--copy', type: 'button' }, [
                            icon('copy', 'icon--xs'),
                            el('span', null, [t('order_copy')])
                        ]),
                        el('button', { 'class': 'btn btn--outline btn--danger-outline', type: 'button', onclick: function () {
                            if (confirm(t('order_clear_confirm'))) clearAllOrder();
                        } }, [icon('trash', 'icon--xs'), el('span', null, [t('order_clear')])])
                    ])
                ])
            ])
        ]);

        if (copyBtn) {
            copyBtn.addEventListener('click', function () {
                var lines = [];
                lines.push('☕ ' + txt(site.name, LANG));
                lines.push('📋 ' + t('order_modal_title') + ':');
                lines.push('────────────────────────');
                var sum = 0;
                Object.keys(order).forEach(function (id) {
                    var e = order[id];
                    var sub = (e.item.price || 0) * e.count;
                    sum += sub;
                    lines.push('• ' + num(e.count) + '× ' + txt(e.item.name, LANG) + ' (' + num(sub) + ' ' + t('unit') + ')');
                });
                lines.push('────────────────────────');
                lines.push('💰 ' + t('order_total') + ' ' + num(sum) + ' ' + t('unit'));
                var text = lines.join('\n');
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function () {
                        var s = copyBtn.querySelector('span');
                        var old = s.textContent;
                        s.textContent = t('order_copied');
                        copyBtn.classList.add('is-copied');
                        setTimeout(function () {
                            s.textContent = old;
                            copyBtn.classList.remove('is-copied');
                        }, 2200);
                    });
                }
            });
        }

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

        document.body.replaceChildren(header, main, footer, toTop, trayEl, modalEl);

        // Initialize item control buttons
        Object.keys(itemMap).forEach(function (id) {
            updateItemControl(id);
        });
        updateTray();

        document.title = txt(site.name) + ' — ' + t('menu');
        var desc = document.querySelector('meta[name="description"]');
        if (desc) desc.setAttribute('content', txt(site.tagline));

        // Search, category scroll-spy, theme toggle, back-to-top (same script as the PHP site)
        var s = document.createElement('script');
        s.src = 'assets/js/main.js?v=5';
        document.body.appendChild(s);

        // The cards fade in when scrolled into view (main.js). Never leave them hidden if that
        // doesn't happen (slow connection, background tab, old browser).
        setTimeout(function () {
            document.querySelectorAll('.category').forEach(function (c) { c.classList.add('is-in'); });
        }, 1200);
    }

    /* ---------- Counter page (Payment & Bill showcase) ---------- */
    function renderCounter(site, menu) {
        var itemMap = buildItemMap(menu);
        var order = loadSavedOrder(itemMap);
        var currentTable = 'takeaway';
        try {
            var savedTable = localStorage.getItem('paraph_table');
            if (savedTable) currentTable = savedTable;
        } catch (e) {}

        var orderRef = getOrderRefCode();
        var dateTimeStr = getFormattedDateTime();

        function getOrderCount() {
            var c = 0;
            Object.keys(order).forEach(function (k) { c += order[k].count; });
            return c;
        }

        function getOrderTotal() {
            var sum = 0;
            Object.keys(order).forEach(function (k) { sum += (order[k].item.price || 0) * order[k].count; });
            return sum;
        }

        // Topbar
        var header = el('header', { 'class': 'topbar' }, [
            el('div', { 'class': 'container topbar__inner' }, [
                el('a', { 'class': 'brand', href: './' }, [
                    el('span', { 'class': 'brand__mark', 'aria-hidden': 'true' }, ['P']),
                    el('span', { 'class': 'brand__name' }, [txt(site.name)])
                ]),
                el('div', { 'class': 'topbar__actions' }, [
                    el('a', { 'class': 'btn-back-menu', href: LANG === 'en' ? 'menu-en.html' : 'menu-fa.html' }, [
                        icon(LANG === 'fa' ? 'arrowR' : 'arrowL', 'icon--xs'),
                        el('span', null, [t('counter_back_menu')])
                    ]),
                    el('nav', { 'class': 'lang-switch', 'aria-label': 'Language' }, [
                        el('a', { href: 'counter.html', 'class': LANG === 'fa' ? 'is-active' : null, hreflang: 'fa', lang: 'fa' }, ['فا']),
                        el('a', { href: 'counter.html', 'class': LANG === 'en' ? 'is-active' : null, hreflang: 'en', lang: 'en' }, ['EN'])
                    ]),
                    el('button', { 'class': 'icon-btn', id: 'themeToggle', type: 'button', 'aria-label': t('theme'), title: t('theme') }, [
                        icon('sun', 'i-sun', '1.8'), icon('moon', 'i-moon', '1.8')
                    ])
                ])
            ])
        ]);

        var container = el('div', { 'class': 'container counter-page' });

        function renderAll() {
            container.replaceChildren();
            var count = getOrderCount();
            var total = getOrderTotal();

            // Hero Header
            var heroHead = el('div', { 'class': 'counter-head' }, [
                el('div', { 'class': 'counter-head__lead' }, [
                    el('div', { 'class': 'counter-badge-pill' }, [
                        icon('receipt', 'icon--xs'),
                        el('span', null, [t('counter_order_num') + ' ' + orderRef])
                    ]),
                    el('h1', { 'class': 'counter-title' }, [t('counter_title')]),
                    el('p', { 'class': 'counter-subtitle' }, [t('counter_subtitle')])
                ]),
                el('div', { 'class': 'counter-meta-chips' }, [
                    el('span', { 'class': 'meta-chip' }, [
                        icon('pin', 'icon--xs'),
                        el('span', null, [currentTable === 'takeaway' ? t('counter_takeaway') : (t('counter_table_prefix') + ' ' + num(currentTable))])
                    ]),
                    el('span', { 'class': 'meta-chip' }, [
                        el('span', { dir: 'ltr' }, [dateTimeStr])
                    ])
                ])
            ]);

            // Table Selection Chips
            var tables = [
                { id: 'takeaway', label: t('counter_takeaway') },
                { id: '1', label: t('counter_table_prefix') + ' ' + num(1) },
                { id: '2', label: t('counter_table_prefix') + ' ' + num(2) },
                { id: '3', label: t('counter_table_prefix') + ' ' + num(3) },
                { id: '4', label: t('counter_table_prefix') + ' ' + num(4) },
                { id: '5', label: t('counter_table_prefix') + ' ' + num(5) },
                { id: '6', label: t('counter_table_prefix') + ' ' + num(6) },
                { id: '7', label: t('counter_table_prefix') + ' ' + num(7) },
                { id: '8', label: t('counter_table_prefix') + ' ' + num(8) },
                { id: '9', label: t('counter_table_prefix') + ' ' + num(9) },
                { id: '10', label: t('counter_table_prefix') + ' ' + num(10) }
            ];

            var tableChipsEl = el('div', { 'class': 'counter-table-selector' }, [
                el('span', { 'class': 'selector-label' }, [t('counter_table')]),
                el('div', { 'class': 'selector-chips' }, tables.map(function (tbl) {
                    var chip = el('button', {
                        'class': 'table-chip' + (currentTable === tbl.id ? ' is-active' : ''),
                        type: 'button'
                    }, [tbl.label]);
                    chip.addEventListener('click', function () {
                        currentTable = tbl.id;
                        try { localStorage.setItem('paraph_table', currentTable); } catch (e) {}
                        renderAll();
                    });
                    return chip;
                }))
            ]);

            if (count === 0) {
                // Empty State
                var emptyCard = el('div', { 'class': 'counter-card counter-card--empty' }, [
                    el('div', { 'class': 'counter-empty__icon' }, [icon('receipt', 'icon--xl')]),
                    el('h2', { 'class': 'counter-empty__title' }, [t('counter_empty_prompt')]),
                    el('p', { 'class': 'counter-empty__desc' }, [t('counter_empty_desc')]),
                    el('a', { 'class': 'btn btn--primary btn--lg', href: LANG === 'en' ? 'menu-en.html' : 'menu-fa.html' }, [
                        icon(LANG === 'fa' ? 'arrowL' : 'arrowR', 'icon--xs'),
                        el('span', null, [t('counter_view_menu')])
                    ])
                ]);
                container.appendChild(heroHead);
                container.appendChild(tableChipsEl);
                container.appendChild(emptyCard);
                return;
            }

            // Items List Card
            var rows = Object.keys(order).map(function (id) {
                var entry = order[id];
                var it = entry.item;
                var c = entry.count;
                var subtotal = (it.price || 0) * c;

                var subBtn = el('button', { 'class': 'stepper__btn stepper__btn--sub', type: 'button', 'aria-label': '-' }, ['−']);
                var countSpan = el('span', { 'class': 'stepper__val' }, [num(c)]);
                var addBtn = el('button', { 'class': 'stepper__btn stepper__btn--add', type: 'button', 'aria-label': '+' }, ['+']);

                subBtn.addEventListener('click', function () {
                    if (order[id].count > 1) {
                        order[id].count -= 1;
                    } else {
                        delete order[id];
                    }
                    saveStoredOrder(order);
                    renderAll();
                });
                addBtn.addEventListener('click', function () {
                    order[id].count += 1;
                    saveStoredOrder(order);
                    renderAll();
                });

                var stepper = el('div', { 'class': 'stepper is-active' }, [subBtn, countSpan, addBtn]);

                var delBtn = el('button', { 'class': 'icon-btn icon-btn--del', type: 'button', title: t('order_clear') }, [icon('trash', 'icon--xs')]);
                delBtn.addEventListener('click', function () {
                    delete order[id];
                    saveStoredOrder(order);
                    renderAll();
                });

                return el('div', { 'class': 'counter-item-row' }, [
                    el('div', { 'class': 'item-info' }, [
                        el('strong', { 'class': 'item-name' }, [txt(it.name)]),
                        el('span', { 'class': 'item-sub', lang: OTHER }, [txt(it.name, OTHER)]),
                        el('small', { 'class': 'item-unit-price' }, [
                            num(it.price) + ' ' + t('unit') + ' / ' + t('order_items_unit')
                        ])
                    ]),
                    el('div', { 'class': 'item-controls' }, [
                        stepper,
                        el('div', { 'class': 'item-subtotal' }, [
                            el('small', null, [t('counter_row_total') + ' ']),
                            el('strong', null, [num(subtotal) + ' ' + t('unit')])
                        ]),
                        delBtn
                    ])
                ]);
            });

            var itemsCard = el('div', { 'class': 'counter-card counter-items-card' }, [
                el('div', { 'class': 'counter-card__header' }, [
                    el('div', { 'class': 'card-header-title' }, [
                        icon('cup', 'icon--gold'),
                        el('h2', null, [t('order_modal_title') + ' (' + num(count) + ' ' + t('order_items_unit') + ')'])
                    ]),
                    el('a', { 'class': 'link-add-more', href: LANG === 'en' ? 'menu-en.html' : 'menu-fa.html' }, [
                        el('span', null, [t('counter_add_more')])
                    ])
                ]),
                el('div', { 'class': 'counter-card__body' }, rows)
            ]);

            // GRAND COUNTER PAYMENT SHOWCASE
            var words = tomanToWords(total);
            var commas = formatTomanCommas(total, LANG);

            var payShowcase = el('div', { 'class': 'counter-pay-showcase' }, [
                el('div', { 'class': 'showcase-badge' }, [
                    icon('card', 'icon--xs'),
                    el('span', null, [t('counter_pay_box_title')])
                ]),
                el('div', { 'class': 'showcase-main-amount' }, [
                    el('span', { 'class': 'pay-number' }, [commas]),
                    el('span', { 'class': 'pay-currency' }, ['تومان'])
                ]),
                el('div', { 'class': 'showcase-shortcut' }, [
                    el('span', null, ['(' + num(total) + ' هزار تومان)'])
                ]),
                words ? el('div', { 'class': 'showcase-words-box' }, [
                    el('span', { 'class': 'words-prefix' }, [t('counter_words_prefix')]),
                    el('strong', { 'class': 'words-text' }, [words])
                ]) : null,
                el('div', { 'class': 'showcase-pos-notice' }, [
                    el('span', { 'class': 'notice-dot', 'aria-hidden': 'true' }, ['●']),
                    el('span', null, [t('counter_pos_tip')])
                ])
            ]);

            // Action Buttons
            var copyBtnEl = el('button', { 'class': 'btn btn--primary btn--counter-action', type: 'button' }, [
                icon('copy', 'icon--xs'),
                el('span', null, [t('order_copy')])
            ]);

            copyBtnEl.addEventListener('click', function () {
                var lines = [];
                lines.push('☕ ' + txt(site.name, LANG));
                lines.push('📋 ' + t('counter_title') + ' — ' + orderRef);
                lines.push('📍 ' + (currentTable === 'takeaway' ? t('counter_takeaway') : (t('counter_table_prefix') + ' ' + num(currentTable))));
                lines.push('🕒 ' + dateTimeStr);
                lines.push('────────────────────────');
                Object.keys(order).forEach(function (id) {
                    var e = order[id];
                    var sub = (e.item.price || 0) * e.count;
                    lines.push('• ' + num(e.count) + '× ' + txt(e.item.name, LANG) + ' (' + num(sub) + ' ' + t('unit') + ')');
                });
                lines.push('────────────────────────');
                lines.push('💳 مبلغ نهایی کارتخوان: ' + formatTomanCommas(total, LANG) + ' تومان');
                if (words) lines.push('📝 به حروف: ' + words);
                var text = lines.join('\n');

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function () {
                        var s = copyBtnEl.querySelector('span');
                        var old = s.textContent;
                        s.textContent = t('order_copied');
                        copyBtnEl.classList.add('is-copied');
                        setTimeout(function () {
                            s.textContent = old;
                            copyBtnEl.classList.remove('is-copied');
                        }, 2200);
                    });
                }
            });

            var newOrderBtn = el('button', { 'class': 'btn btn--outline btn--new-order', type: 'button' }, [
                icon('check', 'icon--xs'),
                el('span', null, [t('counter_new_order')])
            ]);
            newOrderBtn.addEventListener('click', function () {
                if (confirm('صورت‌حساب تسویه شد و سفارش بسته شود؟')) {
                    order = {};
                    saveStoredOrder(order);
                    resetOrderRefCode();
                    orderRef = getOrderRefCode();
                    renderAll();
                }
            });

            var addMoreBtn = el('a', { 'class': 'btn btn--outline btn--add-more', href: LANG === 'en' ? 'menu-en.html' : 'menu-fa.html' }, [
                icon('plus', 'icon--xs'),
                el('span', null, [t('counter_add_more')])
            ]);

            var actionsCard = el('div', { 'class': 'counter-actions-grid' }, [
                copyBtnEl,
                addMoreBtn,
                newOrderBtn
            ]);

            container.appendChild(heroHead);
            container.appendChild(tableChipsEl);
            container.appendChild(payShowcase);
            container.appendChild(itemsCard);
            container.appendChild(actionsCard);
        }

        renderAll();

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

        var main = el('main', { 'class': 'counter-main' }, [container]);
        document.body.replaceChildren(header, main, footer);
        document.title = txt(site.name) + ' — ' + t('counter_title');

        // Theme toggle listener
        var themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', function () {
                var cur = document.documentElement.getAttribute('data-theme');
                var nxt = cur === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', nxt);
                try { localStorage.setItem('paraph_theme', nxt); } catch (e) {}
            });
        }
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
        if (PAGE === 'welcome') {
            renderWelcome(site);
        } else if (PAGE === 'counter') {
            renderCounter(site, menu);
        } else {
            renderMenu(site, menu);
        }
    }).catch(function (e) {
        if (window.console) console.error(e);
        showError();
    });
})();
