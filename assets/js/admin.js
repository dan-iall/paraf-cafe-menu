/* Paraph Café — online admin (GitHub Pages).
 * Edits data/menu.json and data/site.json in the GitHub repository through the GitHub API,
 * using a personal access token that only lives in this browser. The menu pages read the same
 * files, so a save shows on the menu after GitHub Pages redeploys (~1 minute).
 */
(function () {
    'use strict';

    /* ---------- Never run inside another site's frame (clickjacking protection) ---------- */
    if (window.top !== window.self) {
        document.getElementById('app').textContent = 'این صفحه را مستقیما باز کنید.';
        try { window.top.location = window.location.href; } catch (e) {}
        return;
    }
    try { var th = localStorage.getItem('theme'); if (th === 'dark' || th === 'light') document.documentElement.setAttribute('data-theme', th); } catch (e) {}

    /* ---------- Repository (derived from the address, e.g. salehlava.github.io/paraf-cafe-menu) ---------- */
    var OWNER = 'salehlava', REPO = 'paraf-cafe-menu', BRANCH = 'main';
    (function () {
        var host = /^([a-z0-9-]+)\.github\.io$/i.exec(location.hostname);
        var seg = location.pathname.split('/').filter(Boolean)[0];
        if (host && seg && seg !== 'admin') { OWNER = host[1]; REPO = seg; }
    })();
    var API = (window.PARAPH_TEST_API || 'https://api.github.com') + '/repos/' + OWNER + '/' + REPO;   // test hook: local mock server
    var FILES = { site: 'data/site.json', menu: 'data/menu.json' };
    var TOKEN_KEY = 'paraph_admin_token';

    var ICON_LABELS = {
        sandwich: 'ساندویچ', leaf: 'دمنوش', cup: 'فنجان', ice: 'نوشیدنی سرد', mug: 'ماگ',
        drip: 'قهوه دمی', smoothie: 'اسموتی', cake: 'کیک', glass: 'ماکتیل', shake: 'شیک'
    };
    var COLOR_FIELDS = [
        ['primary', 'رنگ اصلی', 'دکمه‌ها، آیکون دسته‌ها، تب انتخاب‌شده'],
        ['dark', 'رنگ تیره', 'نوار بالا، سربرگ منو، صفحه شروع'],
        ['accent', 'رنگ تاکیدی', 'نوارهای تزئینی، لینک‌ها'],
        ['cream', 'رنگ کرم', 'برچسب قیمت، متن روشن روی زمینه تیره'],
        ['bg_light', 'پس‌زمینه حالت روشن', 'رنگ زمینه صفحه در حالت روز'],
        ['bg_dark', 'پس‌زمینه حالت تیره', 'رنگ زمینه صفحه در حالت شب']
    ];
    var PRESETS = [
        ['شکلاتی (پیش‌فرض)', '#4a2c1d', '#2b1a12', '#c08a5b', '#f3e5cf', '#f5ede1', '#0f0a07'],
        ['اسپرسو', '#3e2723', '#1b120f', '#a1887f', '#efebe9', '#f7f3f0', '#0d0a09'],
        ['پسته‌ای', '#4f6b3a', '#1f2b17', '#b5c97a', '#eef3e0', '#f4f6ec', '#0b0f08'],
        ['رز', '#8a3b52', '#2e1119', '#e0a3b0', '#f8e6ea', '#fbf1f3', '#12080b'],
        ['سرمه‌ای و طلایی', '#23395b', '#0f1a2b', '#c9a227', '#f1ead6', '#f4f2ec', '#070b12'],
        ['مشکی و طلایی', '#2b2b2b', '#111111', '#d4af37', '#f5ecd0', '#f6f4ef', '#050505']
    ];

    var token = null;
    var data = { site: null, menu: null };
    var sha = { site: null, menu: null };
    var saved = { site: '', menu: '' };
    var tab = 'menu';
    var busy = false;

    /* ---------- Small helpers ---------- */
    function el(tag, attrs, children) {
        var n = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach(function (k) {
                var v = attrs[k];
                if (v === null || v === undefined || v === false) return;
                if (k.indexOf('on') === 0 && typeof v === 'function') n.addEventListener(k.slice(2), v);
                else if (k === 'value') n.value = v;
                else if (k === 'checked') n.checked = !!v;
                else n.setAttribute(k, v === true ? '' : v);
            });
        }
        (children || []).forEach(function (c) {
            if (c === null || c === undefined || c === false) return;
            n.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
        });
        return n;
    }
    function fa(n) { return String(n).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }); }
    function latin(s) {
        return String(s || '').replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); })
            .replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); });
    }
    function newId(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
    function fromB64(s) {
        var bin = atob(String(s).replace(/\s/g, ''));
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new TextDecoder().decode(bytes);
    }
    function toB64(str) {
        var bytes = new TextEncoder().encode(str), bin = '';
        for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin);
    }
    function serialize(obj) { return JSON.stringify(obj, null, 2) + '\n'; }
    function isDirty(key) { return data[key] !== null && serialize(data[key]) !== saved[key]; }
    function anyDirty() { return isDirty('site') || isDirty('menu'); }

    function api(path, method, body) {
        return fetch(API + path, {
            method: method || 'GET',
            cache: 'no-store',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        }).then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, json: j }; });
        });
    }

    function readToken() {
        try { return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
    }
    function storeToken(t, remember) {
        try {
            sessionStorage.setItem(TOKEN_KEY, t);
            if (remember) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY);
        } catch (e) {}
    }
    function forgetToken() {
        try { sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY); } catch (e) {}
        token = null;
    }

    var root = document.getElementById('app');
    function show(nodes) { root.replaceChildren.apply(root, [].concat(nodes)); }

    /* ---------- Login ---------- */
    function renderLogin(error) {
        var input = el('input', { type: 'password', dir: 'ltr', autocomplete: 'off', placeholder: 'github_pat_…', required: true });
        var remember = el('input', { type: 'checkbox' });
        var btn = el('button', { 'class': 'btn btn--primary btn--block', type: 'submit' }, ['ورود']);
        var form = el('form', { 'class': 'form', onsubmit: function (e) {
            e.preventDefault();
            var t = input.value.trim();
            if (!t) return;
            btn.disabled = true; btn.textContent = 'در حال بررسی…';
            token = t;
            api('').then(function (r) {
                if (r.status === 401) throw new Error('کلید نامعتبر یا منقضی است.');
                if (r.status === 404 || r.status === 403) throw new Error('این کلید به مخزن ' + OWNER + '/' + REPO + ' دسترسی ندارد.');
                if (r.status !== 200) throw new Error('خطای GitHub (' + r.status + ').');
                storeToken(t, remember.checked);
                return load();
            }).catch(function (err) {
                forgetToken();
                renderLogin(err.message || 'اتصال به GitHub برقرار نشد.');
            });
        } }, [
            el('label', { 'class': 'field' }, [el('span', null, ['کلید دسترسی GitHub']), input]),
            el('label', { 'class': 'check' }, [remember, ' روی این دستگاه به خاطر بسپار (فقط روی دستگاه شخصی)']),
            btn
        ]);

        var help = el('details', { 'class': 'help' }, [
            el('summary', null, ['کلید دسترسی را چطور بسازم؟']),
            el('ol', null, [
                el('li', null, ['وارد حساب GitHub خود شوید و این صفحه را باز کنید: ', el('a', { href: 'https://github.com/settings/personal-access-tokens/new', target: '_blank', rel: 'noopener', dir: 'ltr' }, ['github.com/settings/personal-access-tokens/new'])]),
                el('li', null, ['Token name: یک نام دلخواه، مثلا Paraph menu']),
                el('li', null, ['Repository access: گزینه Only select repositories و انتخاب ', el('b', { dir: 'ltr' }, [REPO])]),
                el('li', null, ['Permissions → Repository permissions → Contents: ', el('b', null, ['Read and write'])]),
                el('li', null, ['Generate token را بزنید و کلید (شروع با github_pat_) را اینجا وارد کنید.'])
            ]),
            el('p', { 'class': 'muted small' }, ['این کلید فقط در همین مرورگر ذخیره می‌شود و فقط به همین مخزن دسترسی دارد. آن را به کسی ندهید.'])
        ]);

        show(el('main', { 'class': 'auth' }, [
            el('div', { 'class': 'auth__box' }, [
                el('span', { 'class': 'mark mark--lg' }, ['P']),
                el('h1', null, ['پنل مدیریت آنلاین منو']),
                el('p', { 'class': 'muted' }, ['ورود با کلید دسترسی GitHub']),
                error ? el('div', { 'class': 'alert alert--error' }, [error]) : null,
                form,
                help,
                el('a', { 'class': 'auth__back', href: '../' }, ['← بازگشت به منو'])
            ])
        ]));
        input.focus();
    }

    /* ---------- Load data from GitHub ---------- */
    function loadFile(key) {
        return api('/contents/' + FILES[key] + '?ref=' + BRANCH).then(function (r) {
            if (r.status === 401) throw new Error('auth');
            if (r.status !== 200) throw new Error('فایل ' + FILES[key] + ' خوانده نشد (' + r.status + ').');
            sha[key] = r.json.sha;
            data[key] = JSON.parse(fromB64(r.json.content));
            saved[key] = serialize(data[key]);
        });
    }
    function load() {
        show(el('p', { 'class': 'loading' }, ['در حال بارگذاری منو…']));
        return Promise.all([loadFile('site'), loadFile('menu')]).then(function () {
            normalize();
            saved.site = serialize(data.site);
            saved.menu = serialize(data.menu);
            renderApp();
        }).catch(function (err) {
            if (err.message === 'auth') { forgetToken(); renderLogin('کلید منقضی شده است. دوباره وارد شوید.'); return; }
            show(el('main', { 'class': 'auth' }, [el('div', { 'class': 'auth__box' }, [
                el('div', { 'class': 'alert alert--error' }, [err.message]),
                el('button', { 'class': 'btn', onclick: function () { load(); } }, ['تلاش دوباره'])
            ])]));
        });
    }
    function normalize() {
        var s = data.site = data.site || {};
        ['name', 'tagline', 'hours', 'address'].forEach(function (k) { s[k] = s[k] || { fa: '', en: '' }; });
        s.phone = s.phone || ''; s.instagram = s.instagram || '';
        s.colors = s.colors || {};
        var m = data.menu = data.menu || {};
        m.categories = (m.categories || []).map(function (c) {
            c.id = c.id || newId('c');
            c.icon = c.icon || 'cup';
            c.title = c.title || { fa: '', en: '' };
            c.note = c.note || { fa: '', en: '' };
            c.visible = c.visible !== false;
            c.items = (c.items || []).map(function (it) {
                it.id = it.id || newId('i');
                it.name = it.name || { fa: '', en: '' };
                it.price = (it.price === '' || it.price === undefined) ? null : it.price;
                it.available = it.available !== false;
                it.addon = !!it.addon;
                return it;
            });
            return c;
        });
    }

    /* ---------- App shell ---------- */
    var statusEl, saveBtn;
    function setStatus(type, msg) {
        statusEl.className = 'status' + (type ? ' status--' + type : '');
        statusEl.textContent = msg || '';
    }
    function refreshSaveState() {
        if (!saveBtn) return;
        var dirty = anyDirty();
        saveBtn.disabled = busy || !dirty;
        saveBtn.textContent = busy ? 'در حال ذخیره…' : (dirty ? 'ذخیره و انتشار' : 'ذخیره شده ✓');
        if (dirty && !busy && statusEl.className.indexOf('status--ok') !== -1) setStatus('', '');
    }

    function renderApp() {
        statusEl = el('div', { 'class': 'status', role: 'status' });
        saveBtn = el('button', { 'class': 'btn btn--primary', type: 'button', onclick: save }, ['ذخیره و انتشار']);
        var tabs = [['menu', 'منو'], ['info', 'اطلاعات کافه'], ['colors', 'رنگ‌ها']].map(function (t) {
            return el('button', { type: 'button', 'class': 'tab' + (tab === t[0] ? ' is-active' : ''), onclick: function () { tab = t[0]; renderApp(); } }, [t[1]]);
        });
        var body = tab === 'menu' ? renderMenuTab() : tab === 'info' ? renderInfoTab() : renderColorsTab();

        show([
            el('header', { 'class': 'gh-top' }, [
                el('div', { 'class': 'gh-top__in' }, [
                    el('div', { 'class': 'gh-brand' }, [el('span', { 'class': 'mark' }, ['P']), el('div', null, [el('strong', null, [(data.site.name && data.site.name.fa) || 'پنل مدیریت']), el('small', null, ['پنل مدیریت آنلاین'])])]),
                    el('nav', { 'class': 'tabs' }, tabs),
                    el('div', { 'class': 'gh-actions' }, [
                        el('a', { 'class': 'btn btn--sm', href: '../', target: '_blank' }, ['مشاهده منو']),
                        saveBtn,
                        el('button', { 'class': 'btn btn--sm', type: 'button', onclick: logout }, ['خروج'])
                    ])
                ]),
                el('div', { 'class': 'gh-top__in' }, [statusEl])
            ]),
            el('div', { 'class': 'gh-wrap' }, [body])
        ]);
        refreshSaveState();
    }

    function logout() {
        if (anyDirty() && !confirm('تغییرات ذخیره نشده از بین می‌روند. خارج می‌شوید؟')) return;
        forgetToken();
        data = { site: null, menu: null };
        renderLogin();
    }

    /* ---------- Inputs bound to the data ---------- */
    function bindText(obj, key, attrs) {
        return el('input', Object.assign({ value: obj[key] || '', oninput: function (e) { obj[key] = e.target.value; refreshSaveState(); } }, attrs || {}));
    }
    function field(label, input, wide) {
        return el('label', { 'class': 'field' + (wide ? ' field--wide' : '') }, [el('span', null, [label]), input]);
    }

    /* ---------- Menu tab ---------- */
    function move(list, i, dir) {
        var j = i + dir;
        if (j < 0 || j >= list.length) return;
        var tmp = list[i]; list[i] = list[j]; list[j] = tmp;
        renderApp();
    }

    function renderMenuTab() {
        var cats = data.menu.categories;
        var sections = cats.map(function (c, ci) {
            var titleH = el('h2', null, [c.title.fa || 'بدون نام']);
            var iconSel = el('select', { onchange: function (e) { c.icon = e.target.value; refreshSaveState(); } },
                Object.keys(ICON_LABELS).map(function (k) { return el('option', { value: k, selected: c.icon === k ? 'selected' : null }, [ICON_LABELS[k]]); }));

            var rows = c.items.map(function (it, ii) {
                var price = el('input', {
                    'class': 'price-input', dir: 'ltr', inputmode: 'numeric', placeholder: 'قیمت روز',
                    value: it.price === null ? '' : String(it.price),
                    oninput: function (e) {
                        var v = latin(e.target.value).replace(/\D+/g, '');
                        it.price = v === '' ? null : parseInt(v, 10);
                        refreshSaveState();
                    }
                });
                return el('div', { 'class': 'item-row' + (it.available ? '' : ' item-row--off'), 'data-item': it.id }, [
                    bindText(it.name, 'fa', { placeholder: 'نام فارسی', 'aria-label': 'نام فارسی' }),
                    bindText(it.name, 'en', { placeholder: 'English name', dir: 'ltr', 'aria-label': 'نام انگلیسی' }),
                    price,
                    el('div', { 'class': 'item-row__flags' }, [
                        el('label', { 'class': 'check', title: 'اگر تیک نداشته باشد «ناموجود» نمایش داده می‌شود' }, [
                            el('input', { type: 'checkbox', checked: it.available, onchange: function (e) { it.available = e.target.checked; e.target.closest('.item-row').classList.toggle('item-row--off', !it.available); refreshSaveState(); } }), ' موجود'
                        ]),
                        el('label', { 'class': 'check' }, [
                            el('input', { type: 'checkbox', checked: it.addon, onchange: function (e) { it.addon = e.target.checked; refreshSaveState(); } }), ' افزودنی'
                        ])
                    ]),
                    el('div', { 'class': 'item-row__actions' }, [
                        el('button', { 'class': 'icon-btn', type: 'button', title: 'بالا', disabled: ii === 0 ? 'disabled' : null, onclick: function () { move(c.items, ii, -1); } }, ['▲']),
                        el('button', { 'class': 'icon-btn', type: 'button', title: 'پایین', disabled: ii === c.items.length - 1 ? 'disabled' : null, onclick: function () { move(c.items, ii, 1); } }, ['▼']),
                        el('button', { 'class': 'icon-btn icon-btn--danger', type: 'button', title: 'حذف', onclick: function () {
                            if (confirm('«' + (it.name.fa || it.name.en || 'این آیتم') + '» حذف شود؟')) { c.items.splice(ii, 1); renderApp(); }
                        } }, ['✕'])
                    ])
                ]);
            });

            return el('section', { 'class': 'card cat' + (c.visible ? '' : ' cat--hidden'), id: 'cat-' + c.id }, [
                el('div', { 'class': 'cat__head' }, [
                    el('div', { 'class': 'cat__title' }, [titleH, el('small', { dir: 'ltr' }, [c.title.en])]),
                    el('div', { 'class': 'cat__order' }, [
                        el('button', { 'class': 'icon-btn', type: 'button', title: 'بالا', disabled: ci === 0 ? 'disabled' : null, onclick: function () { move(cats, ci, -1); } }, ['▲']),
                        el('button', { 'class': 'icon-btn', type: 'button', title: 'پایین', disabled: ci === cats.length - 1 ? 'disabled' : null, onclick: function () { move(cats, ci, 1); } }, ['▼'])
                    ])
                ]),
                el('details', { 'class': 'cat__edit' }, [
                    el('summary', null, ['ویرایش دسته']),
                    el('div', { 'class': 'form form--grid' }, [
                        field('عنوان فارسی', bindText(c.title, 'fa', { oninput: function (e) { c.title.fa = e.target.value; titleH.textContent = e.target.value || 'بدون نام'; refreshSaveState(); } })),
                        field('عنوان انگلیسی', bindText(c.title, 'en', { dir: 'ltr' })),
                        field('توضیح فارسی (اختیاری)', bindText(c.note, 'fa', { placeholder: 'مثلا: قیمت روز' })),
                        field('توضیح انگلیسی (اختیاری)', bindText(c.note, 'en', { dir: 'ltr' })),
                        field('آیکون', iconSel),
                        el('label', { 'class': 'check' }, [el('input', { type: 'checkbox', checked: c.visible, onchange: function (e) { c.visible = e.target.checked; refreshSaveState(); } }), ' نمایش در منو']),
                        el('div', { 'class': 'form__actions' }, [
                            el('button', { 'class': 'btn btn--danger btn--sm', type: 'button', onclick: function () {
                                if (confirm('دسته «' + (c.title.fa || '') + '» و همه آیتم‌هایش حذف شود؟')) { cats.splice(ci, 1); renderApp(); }
                            } }, ['حذف دسته'])
                        ])
                    ])
                ]),
                el('div', { 'class': 'items-head' }, [el('span', null, ['نام فارسی']), el('span', null, ['نام انگلیسی']), el('span', null, ['قیمت']), el('span', null, ['وضعیت']), el('span')]),
                el('div', null, rows),
                el('button', { 'class': 'btn btn--sm add-item', type: 'button', onclick: function () {
                    var it = { id: newId('i'), name: { fa: '', en: '' }, price: null, available: true, addon: false };
                    c.items.push(it);
                    renderApp();
                    var row = document.querySelector('[data-item="' + it.id + '"] input');
                    if (row) row.focus();
                } }, ['+ افزودن آیتم'])
            ]);
        });

        return el('div', null, [
            el('p', { 'class': 'muted' }, ['قیمت‌ها به هزار تومان هستند (مثلا ۲۸۰). قیمت خالی = «قیمت روز». اعداد فارسی هم قابل قبول است. بعد از تغییرات «ذخیره و انتشار» را بزنید.']),
            el('nav', { 'class': 'jump' }, cats.map(function (c) {
                return el('a', { href: '#cat-' + c.id, 'class': c.visible ? null : 'is-hidden' }, [c.title.fa || '—', ' ', el('small', null, [fa(c.items.length)])]);
            })),
            el('div', null, sections),
            el('button', { 'class': 'btn btn--primary', type: 'button', onclick: function () {
                var c = { id: newId('c'), icon: 'cup', title: { fa: 'دسته جدید', en: 'New category' }, note: { fa: '', en: '' }, visible: true, items: [] };
                cats.push(c);
                renderApp();
                var sec = document.getElementById('cat-' + c.id);
                if (sec) { sec.scrollIntoView({ behavior: 'smooth' }); sec.querySelector('details').open = true; }
            } }, ['+ دسته جدید'])
        ]);
    }

    /* ---------- Café info tab ---------- */
    function renderInfoTab() {
        var s = data.site;
        var insta = bindText(s, 'instagram', { dir: 'ltr', placeholder: 'https://instagram.com/paraph.cafe یا @paraph.cafe', onchange: function (e) {
            var v = e.target.value.trim();
            if (v && !/^https?:\/\//i.test(v)) v = 'https://instagram.com/' + v.replace(/^@/, '').replace(/^\/+/, '');
            v = v.replace(/^http:\/\//i, 'https://');
            s.instagram = v; e.target.value = v; refreshSaveState();
        } });
        return el('section', { 'class': 'card' }, [
            el('h2', null, ['اطلاعات کافه']),
            el('p', { 'class': 'muted' }, ['در صفحه شروع، منو و پایین صفحه نمایش داده می‌شود.']),
            el('div', { 'class': 'form form--grid' }, [
                field('نام کافه (فارسی)', bindText(s.name, 'fa')),
                field('نام کافه (انگلیسی)', bindText(s.name, 'en', { dir: 'ltr' })),
                field('شعار (فارسی)', bindText(s.tagline, 'fa')),
                field('شعار (انگلیسی)', bindText(s.tagline, 'en', { dir: 'ltr' })),
                field('ساعات کاری (فارسی)', bindText(s.hours, 'fa')),
                field('ساعات کاری (انگلیسی)', bindText(s.hours, 'en', { dir: 'ltr' })),
                field('آدرس (فارسی)', bindText(s.address, 'fa')),
                field('آدرس (انگلیسی)', bindText(s.address, 'en', { dir: 'ltr' })),
                field('تلفن (خالی = نمایش داده نشود)', bindText(s, 'phone', { dir: 'ltr' })),
                field('اینستاگرام', insta)
            ])
        ]);
    }

    /* ---------- Colours tab ---------- */
    function renderColorsTab() {
        var col = data.site.colors;
        var rows = COLOR_FIELDS.map(function (f) {
            var key = f[0];
            var cur = /^#[0-9a-f]{6}$/i.test(col[key] || '') ? col[key] : PRESETS[0][COLOR_FIELDS.indexOf(f) + 1];
            var hex = el('input', { type: 'text', dir: 'ltr', maxlength: '7', value: cur });
            var picker = el('input', { type: 'color', value: cur });
            picker.addEventListener('input', function () { col[key] = picker.value; hex.value = picker.value; refreshSaveState(); });
            hex.addEventListener('input', function () {
                if (/^#[0-9a-f]{6}$/i.test(hex.value)) { col[key] = hex.value.toLowerCase(); picker.value = col[key]; refreshSaveState(); }
            });
            return el('label', { 'class': 'color-row' }, [picker, el('span', { 'class': 'color-row__text' }, [el('strong', null, [f[1]]), el('small', { 'class': 'muted' }, [f[2]])]), hex]);
        });
        var presets = PRESETS.map(function (p) {
            return el('button', { type: 'button', 'class': 'preset', onclick: function () {
                COLOR_FIELDS.forEach(function (f, i) { col[f[0]] = p[i + 1]; });
                renderApp();
            } }, [
                el('span', { 'class': 'preset__swatches' }, p.slice(1, 5).map(function (h) { var i = el('i'); i.style.background = h; return i; })),
                el('span', { 'class': 'preset__name' }, [p[0]])
            ]);
        });
        return el('div', null, [
            el('section', { 'class': 'card' }, [el('h2', null, ['تم‌های آماده']), el('div', { 'class': 'presets' }, presets)]),
            el('section', { 'class': 'card' }, [el('h2', null, ['رنگ‌های دلخواه']), el('div', { 'class': 'colors' }, rows),
                el('p', { 'class': 'muted' }, ['بعد از «ذخیره و انتشار»، رنگ‌ها حدود ۱ دقیقه بعد روی منو اعمال می‌شوند.'])])
        ]);
    }

    /* ---------- Save to GitHub ---------- */
    function validate() {
        var bad = null;
        data.menu.categories.forEach(function (c) {
            if (!bad && !(c.title.fa || '').trim()) bad = { id: 'cat-' + c.id, msg: 'یک دسته عنوان فارسی ندارد.' };
            c.items.forEach(function (it) {
                if (!bad && (!(it.name.fa || '').trim() || !(it.name.en || '').trim())) bad = { item: it.id, msg: 'نام فارسی و انگلیسی همه آیتم‌ها را وارد کنید.' };
            });
        });
        if (!bad && !(data.site.name.fa || '').trim()) bad = { msg: 'نام فارسی کافه را وارد کنید (تب اطلاعات کافه).' };
        return bad;
    }

    function putFile(key) {
        return api('/contents/' + FILES[key], 'PUT', {
            message: (key === 'menu' ? 'Update menu' : 'Update café info') + ' (online admin)',
            content: toB64(serialize(data[key])),
            sha: sha[key],
            branch: BRANCH
        }).then(function (r) {
            if (r.status === 200 || r.status === 201) {
                sha[key] = r.json.content.sha;
                saved[key] = serialize(data[key]);
                return;
            }
            var e = new Error(String(r.status));
            e.status = r.status;
            throw e;
        });
    }

    function save() {
        if (busy || !anyDirty()) return;
        var bad = validate();
        if (bad) {
            setStatus('err', bad.msg);
            if (bad.item || bad.id) {
                if (tab !== 'menu') { tab = 'menu'; renderApp(); setStatus('err', bad.msg); }
                var target = bad.item ? document.querySelector('[data-item="' + bad.item + '"]') : document.getElementById(bad.id);
                if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.classList.add('is-invalid'); }
            }
            return;
        }
        busy = true; refreshSaveState(); setStatus('', 'در حال ذخیره در GitHub…');
        var chain = Promise.resolve();
        ['menu', 'site'].forEach(function (k) { if (isDirty(k)) chain = chain.then(function () { return putFile(k); }); });
        chain.then(function () {
            busy = false; refreshSaveState();
            setStatus('ok', 'ذخیره شد ✓ — منو تا حدود ۱ دقیقه دیگر به‌روز می‌شود.');
        }).catch(function (e) {
            busy = false; refreshSaveState();
            if (e.status === 401) { setStatus('err', 'کلید منقضی شده است. دوباره وارد شوید (تغییرات شما هنوز در این صفحه است).'); return; }
            if (e.status === 403 || e.status === 404) { setStatus('err', 'این کلید اجازه ذخیره ندارد. در GitHub برای کلید، Contents را روی «Read and write» بگذارید.'); return; }
            if (e.status === 409 || e.status === 422) { setStatus('err', 'منو در جای دیگری تغییر کرده است. صفحه را تازه کنید و دوباره تغییر دهید.'); return; }
            setStatus('err', 'ذخیره نشد (' + (e.status || e.message) + '). اتصال اینترنت را بررسی کنید و دوباره «ذخیره» را بزنید.');
        });
    }

    window.addEventListener('beforeunload', function (e) {
        if (data.menu && anyDirty()) { e.preventDefault(); e.returnValue = ''; }
    });
    document.addEventListener('input', function (e) {
        var row = e.target.closest && e.target.closest('.is-invalid');
        if (row) row.classList.remove('is-invalid');
    });

    /* ---------- Start ---------- */
    token = readToken();
    if (token) load(); else renderLogin();
})();
