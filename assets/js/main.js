/* Paraf Café — menu interactions: theme, search, category scroll-spy, back-to-top */
(function () {
    'use strict';

    var root = document.documentElement;

    /* ---------- Theme toggle ---------- */
    var themeBtn = document.getElementById('themeToggle');
    function isDark() {
        var t = root.getAttribute('data-theme');
        if (t) return t === 'dark';
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var next = isDark() ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) {}
        });
    }

    /* ---------- Entrance animation ---------- */
    var categories = Array.prototype.slice.call(document.querySelectorAll('.category'));
    if ('IntersectionObserver' in window) {
        var revealObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { en.target.classList.add('is-in'); revealObs.unobserve(en.target); }
            });
        }, { rootMargin: '0px 0px -40px 0px' });
        categories.forEach(function (c) { revealObs.observe(c); });
    } else {
        categories.forEach(function (c) { c.classList.add('no-anim'); });
    }

    /* ---------- Scroll-spy for category chips ---------- */
    var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
    var chipsNav = document.getElementById('chips');
    var activeId = null;

    function setActive(id) {
        if (id === activeId) return;
        activeId = id;
        chips.forEach(function (ch) {
            var on = ch.getAttribute('data-target') === id;
            ch.classList.toggle('is-active', on);
            if (on && chipsNav) {
                // keep the active chip visible inside the horizontal strip
                var navRect = chipsNav.getBoundingClientRect();
                var r = ch.getBoundingClientRect();
                if (r.left < navRect.left || r.right > navRect.right) {
                    chipsNav.scrollBy({ left: r.left - navRect.left - 16, behavior: 'smooth' });
                }
            }
        });
    }

    function spy() {
        var offset = 220;
        var current = null;
        for (var i = 0; i < categories.length; i++) {
            var c = categories[i];
            if (c.hidden) continue;
            if (c.getBoundingClientRect().top - offset <= 0) current = c.id;
        }
        if (!current) {
            var firstVisible = categories.filter(function (c) { return !c.hidden; })[0];
            current = firstVisible ? firstVisible.id : null;
        }
        setActive(current);
    }

    /* ---------- Sticky toolbar shadow + back-to-top ---------- */
    var toolbar = document.getElementById('toolbar');
    var toTop = document.getElementById('toTop');
    function onScroll() {
        var y = window.scrollY || window.pageYOffset;
        if (toolbar) toolbar.classList.toggle('is-stuck', toolbar.getBoundingClientRect().top <= 64);
        if (toTop) toTop.classList.toggle('is-visible', y > 600);
        spy();
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) { requestAnimationFrame(function () { onScroll(); ticking = false; }); ticking = true; }
    }, { passive: true });
    onScroll();

    if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

    /* ---------- Search ---------- */
    var search = document.getElementById('search');
    var empty = document.getElementById('empty');

    // Normalise Arabic/Persian letter variants and digits so searches match reliably.
    function norm(s) {
        return (s || '').toLowerCase()
            .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک')
            .replace(/[‌\s]+/g, ' ')
            .replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); })
            .trim();
    }

    var items = Array.prototype.slice.call(document.querySelectorAll('.item'));
    items.forEach(function (it) {
        it._key = norm(it.getAttribute('data-search'));
        var n = it.querySelector('.item__name');
        it._nameEl = n;
        it._nameText = n ? n.textContent : '';
    });

    function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    function highlight(it, q) {
        if (!it._nameEl) return;
        if (!q) { it._nameEl.textContent = it._nameText; return; }
        var re = new RegExp('(' + escapeRe(q) + ')', 'ig');
        var safe = it._nameText.replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
        it._nameEl.innerHTML = safe.replace(re, '<mark>$1</mark>');
    }

    function runSearch() {
        var raw = search.value;
        var q = norm(raw);
        var anyVisible = false;

        categories.forEach(function (cat) {
            var catItems = cat.querySelectorAll('.item');
            var catTitle = norm(cat.querySelector('.category__head').textContent);
            var catMatch = q && catTitle.indexOf(q) !== -1;
            var shown = 0;
            Array.prototype.forEach.call(catItems, function (it) {
                var match = !q || catMatch || it._key.indexOf(q) !== -1;
                it.hidden = !match;
                highlight(it, match && q && !catMatch ? raw.trim() : '');
                if (match) shown++;
            });
            cat.hidden = shown === 0;
            if (shown) { anyVisible = true; cat.classList.add('is-in'); }
        });

        chips.forEach(function (ch) {
            var target = document.getElementById(ch.getAttribute('data-target'));
            ch.hidden = !!(target && target.hidden);
        });

        if (empty) empty.hidden = anyVisible;
        activeId = null;
        spy();
    }

    if (search) {
        search.addEventListener('input', runSearch);
        search.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { search.value = ''; runSearch(); search.blur(); }
        });
    }
})();
