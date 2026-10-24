/* ==========================================================================
   韩系仿推特 · 个人主页原型 交互脚本
   模块：Tab 切换 / 点赞动效 / 转推 / 收藏 / 发帖浮层 / 灯箱 / 菜单 / Toast
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------------
     工具
     ------------------------------------------------------------------ */
  function fmt(n) {
    if (n >= 10000) {
      var v = n / 10000;
      return (v >= 10 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')) + '万';
    }
    return n.toLocaleString('en-US');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var toastEl = $('#toast');
  var toastText = $('#toast-text');
  var toastTimer = null;

  function toast(msg, ms) {
    if (!toastEl) return;
    toastText.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-show'); }, ms || 2200);
  }

  /* ------------------------------------------------------------------
     1. 内容 Tab 切换（滑动指示条）
     ------------------------------------------------------------------ */
  var tabs = $$('.tab');
  var panels = $$('.panel');
  var tabsBar = $('.tabs');
  var indicator = $('#tab-indicator');

  function placeIndicator(tab) {
    if (!indicator || !tab || !tabsBar) return;
    var r = tab.getBoundingClientRect();
    var p = tabsBar.getBoundingClientRect();
    indicator.style.width = r.width + 'px';
    indicator.style.left = (r.left - p.left) + 'px';
  }

  function stickyTop() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--topbar');
    return parseInt(v, 10) || 56;
  }

  function scrollTabsToTop() {
    if (!tabsBar) return;
    var top = tabsBar.getBoundingClientRect().top + window.pageYOffset - stickyTop();
    if (window.pageYOffset > top + 1) {
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  function activateTab(tab, doScroll) {
    if (!tab) return;
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panels.forEach(function (p) {
      var on = p.dataset.panel === tab.dataset.tab;
      p.hidden = !on;
      if (on) {
        $$('.reveal', p).forEach(function (el) { el.classList.add('in'); });
      }
    });
    placeIndicator(tab);
    if (doScroll) scrollTabsToTop();
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () { activateTab(t, true); });
  });

  window.addEventListener('resize', function () {
    placeIndicator($('.tab.is-active'));
  });

  /* ------------------------------------------------------------------
     2. 滚动入场动画
     ------------------------------------------------------------------ */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -30px 0px', threshold: 0.04 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ------------------------------------------------------------------
     3. 顶栏阴影 / 返回顶部
     ------------------------------------------------------------------ */
  var topbar = $('#topbar');

  function onScroll() {
    if (topbar) topbar.classList.toggle('is-scrolled', window.pageYOffset > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  var backBtn = $('#back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ------------------------------------------------------------------
     4. 主题切换
     ------------------------------------------------------------------ */
  var themeBtn = $('#theme-toggle');
  var themeIcon = $('#theme-icon');
  var themeLabel = $('#theme-label');

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var isDim = document.documentElement.getAttribute('data-theme') === 'dim';
      document.documentElement.setAttribute('data-theme', isDim ? 'light' : 'dim');
      var use = themeIcon.querySelector('use');
      if (use) use.setAttribute('href', isDim ? '#i-moon' : '#i-sun');
      themeLabel.textContent = isDim ? '夜樱模式' : '日间模式';
      toast(isDim ? '已切换到日间模式 ☀️' : '已切换到夜樱模式 🌙');
    });
  }

  /* ------------------------------------------------------------------
     5. 发帖浮层
     ------------------------------------------------------------------ */
  var overlay = $('#composer-overlay');
  var ta = $('#composer-text');
  var submitBtn = $('#composer-submit');
  var ring = $('#ring');
  var ringFg = $('#ring-fg');
  var ringN = $('#ring-n');
  var CIRC = 94.248;
  var lastFocus = null;

  function updateRing() {
    var n = ta.value.length;
    ringN.textContent = n;
    var p = Math.min(n / 280, 1);
    ringFg.style.strokeDashoffset = String(CIRC * (1 - p));
    ring.classList.toggle('is-on', n > 0);
    ring.classList.toggle('is-warn', n > 252);
    submitBtn.disabled = ta.value.trim().length === 0;
  }

  function autoGrow() {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 260) + 'px';
  }

  function openComposer(prefill) {
    lastFocus = document.activeElement;
    if (typeof prefill === 'string' && prefill) ta.value = prefill;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    updateRing();
    autoGrow();
    setTimeout(function () {
      ta.focus();
      try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) { /* noop */ }
    }, 130);
  }

  function closeComposer() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (ta) {
    ta.addEventListener('input', function () { updateRing(); autoGrow(); });
    updateRing();
  }

  var closeBtn = $('#composer-close');
  if (closeBtn) closeBtn.addEventListener('click', closeComposer);

  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeComposer();
    });
  }

  /* 新推文模板 —— 与页面里的推文结构保持一致 */
  function actionsHTML() {
    return '' +
      '<div class="tweet-actions">' +
        '<button class="act act-reply" type="button" data-act="reply" data-handle="@zhixia">' +
          '<span class="act-ico"><svg class="ic"><use href="#i-reply" /></svg></span><span class="act-n">0</span>' +
        '</button>' +
        '<button class="act act-rt" type="button" data-act="retweet" data-count="0" aria-pressed="false">' +
          '<span class="act-ico"><svg class="ic"><use href="#i-rt" /></svg></span><span class="act-n">0</span>' +
        '</button>' +
        '<button class="act act-like" type="button" data-act="like" data-count="0" aria-pressed="false">' +
          '<span class="act-ico"><svg class="ic"><use href="#i-heart" /></svg><span class="burst"></span></span><span class="act-n">0</span>' +
        '</button>' +
        '<span class="act act-views">' +
          '<span class="act-ico"><svg class="ic"><use href="#i-views" /></svg></span><span class="act-n">0</span>' +
        '</span>' +
        '<button class="act act-bm" type="button" data-act="bookmark" aria-pressed="false" aria-label="收藏">' +
          '<span class="act-ico"><svg class="ic"><use href="#i-bookmark" /></svg></span>' +
        '</button>' +
        '<button class="act act-share" type="button" data-act="share" aria-label="分享">' +
          '<span class="act-ico"><svg class="ic"><use href="#i-share" /></svg></span>' +
        '</button>' +
      '</div>';
  }

  function buildTweet(text) {
    return '' +
      '<article class="tweet is-new">' +
        '<a class="tweet-av" href="#" aria-label="知夏"><span class="av av-48">' +
          '<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#av-main" /></svg></span></a>' +
        '<div class="tweet-body">' +
          '<header class="tweet-head">' +
            '<div class="who"><span class="name">知夏</span>' +
              '<svg class="badge" viewBox="0 0 24 24"><use href="#i-verified" /></svg>' +
              '<span class="handle">@zhixia</span><span class="dot">·</span><span class="time">刚刚</span></div>' +
            '<button class="more" type="button" data-act="more" aria-label="更多操作">' +
              '<svg class="ic"><use href="#i-more" /></svg></button>' +
          '</header>' +
          '<p class="tweet-text">' + escapeHtml(text) + '</p>' +
          actionsHTML() +
        '</div>' +
      '</article>';
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      var text = ta.value.trim();
      if (!text) return;
      var feed = $('#feed');
      if (feed) feed.insertAdjacentHTML('afterbegin', buildTweet(text));
      ta.value = '';
      updateRing();
      autoGrow();
      closeComposer();
      toast('已发布 · 你的推文已经上线 ✿');
      scrollTabsToTop();
    });
  }

  /* ------------------------------------------------------------------
     6. 互动：点赞 / 转推 / 收藏 / 回复 / 分享
     ------------------------------------------------------------------ */
  function bump(btn, delta) {
    var n = parseInt(btn.dataset.count || '0', 10) + delta;
    if (n < 0) n = 0;
    btn.dataset.count = String(n);
    var label = $('.act-n', btn);
    if (label) label.textContent = fmt(n);
  }

  function burst(btn) {
    var holder = $('.burst', btn);
    if (!holder) return;
    holder.innerHTML = '';
    for (var i = 0; i < 7; i++) {
      var dot = document.createElement('i');
      var angle = (Math.PI * 2 / 7) * i + (Math.random() - 0.5) * 0.7;
      var dist = 13 + Math.random() * 9;
      dot.style.setProperty('--tx', (Math.cos(angle) * dist).toFixed(1) + 'px');
      dot.style.setProperty('--ty', (Math.sin(angle) * dist).toFixed(1) + 'px');
      dot.style.animationDelay = (i * 10) + 'ms';
      holder.appendChild(dot);
    }
    setTimeout(function () { holder.innerHTML = ''; }, 780);
  }

  function copyLink() {
    var url = 'https://zhixia.studio/@zhixia';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { toast('链接已复制到剪贴板'); },
        function () { toast('链接：' + url, 3200); }
      );
    } else {
      toast('链接：' + url, 3200);
    }
  }

  function removeTweet(btn) {
    var card = btn.closest ? btn.closest('.tweet') : null;
    if (!card) return;
    card.style.transition = 'opacity .22s ease, transform .22s ease, margin .22s ease';
    card.style.opacity = '0';
    card.style.transform = 'translateY(-6px)';
    setTimeout(function () {
      card.style.marginTop = '-' + card.offsetHeight + 'px';
      card.style.overflow = 'hidden';
      setTimeout(function () { card.remove(); }, 240);
    }, 200);
    toast('已删除这条推文');
  }

  function handleAct(el) {
    var act = el.dataset.act;

    if (act === 'like') {
      var on = el.getAttribute('aria-pressed') !== 'true';
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
      bump(el, on ? 1 : -1);
      if (on) {
        el.classList.remove('is-pop');
        void el.offsetWidth;
        el.classList.add('is-pop');
        burst(el);
        setTimeout(function () { el.classList.remove('is-pop'); }, 540);
        toast('已点赞 · 一点点小小的喜欢');
      }
      return;
    }

    if (act === 'retweet') {
      var on2 = el.getAttribute('aria-pressed') !== 'true';
      el.setAttribute('aria-pressed', on2 ? 'true' : 'false');
      bump(el, on2 ? 1 : -1);
      toast(on2 ? '已转推' : '已取消转推');
      return;
    }

    if (act === 'bookmark') {
      var on3 = el.getAttribute('aria-pressed') !== 'true';
      el.setAttribute('aria-pressed', on3 ? 'true' : 'false');
      toast(on3 ? '已加入书签' : '已移出书签');
      return;
    }

    if (act === 'reply') {
      openComposer((el.dataset.handle || '') + ' ');
      return;
    }

    if (act === 'share') { copyLink(); return; }

    if (act === 'more') { openMenu(el); return; }

    if (act === 'edit-profile') {
      toast('编辑资料（原型演示 · 可接后台表单）');
      return;
    }

    if (act === 'open-highlight') {
      toast('打开精选合集（原型演示）');
      return;
    }
  }

  /* ------------------------------------------------------------------
     7. 更多菜单
     ------------------------------------------------------------------ */
  var menu = $('#menu');
  var menuOn = false;

  function openMenu(btn) {
    menu.innerHTML = '' +
      '<button type="button" data-menu="pin"><svg class="ic"><use href="#i-pin" /></svg>置顶这条推文</button>' +
      '<button type="button" data-menu="reply-perm"><svg class="ic"><use href="#i-reply" /></svg>更改回复权限</button>' +
      '<button type="button" data-menu="copy"><svg class="ic"><use href="#i-link" /></svg>复制链接</button>' +
      '<button type="button" data-menu="delete" class="danger"><svg class="ic"><use href="#i-flag" /></svg>删除这条推文</button>';

    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    menuOn = true;

    var r = btn.getBoundingClientRect();
    var w = menu.offsetWidth;
    var h = menu.offsetHeight;
    var left = Math.min(r.right - w, window.innerWidth - w - 12);
    var top = r.bottom + 6;
    if (top + h > window.innerHeight - 12) top = r.top - h - 6;
    menu.style.left = Math.max(12, left) + 'px';
    menu.style.top = Math.max(12, top) + 'px';
    menu._owner = btn;
  }

  function closeMenu() {
    if (!menuOn) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    menuOn = false;
  }

  if (menu) {
    menu.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-menu]') : null;
      if (!b) return;
      var kind = b.dataset.menu;
      var owner = menu._owner;
      closeMenu();
      if (kind === 'copy') copyLink();
      else if (kind === 'delete' && owner) removeTweet(owner);
      else if (kind === 'pin') toast('已置顶（原型演示）');
      else if (kind === 'reply-perm') toast('已改为「仅关注者可回复」');
    });
  }

  window.addEventListener('scroll', closeMenu, { passive: true });

  /* ------------------------------------------------------------------
     8. 图片灯箱
     ------------------------------------------------------------------ */
  var lightbox = $('#lightbox');
  var lbStage = $('#lb-stage');

  function openLightbox(item) {
    var svg = $('svg.ph', item);
    if (!svg || !lbStage) return;
    lbStage.innerHTML = '';
    lbStage.appendChild(svg.cloneNode(true));
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    setTimeout(function () { if (lbStage) lbStage.innerHTML = ''; }, 280);
  }

  var lbClose = $('#lb-close');
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target === lbStage) closeLightbox();
    });
  }

  /* ------------------------------------------------------------------
     9. 新推文提示条
     ------------------------------------------------------------------ */
  var pill = $('#new-pill');
  if (pill) {
    setTimeout(function () { pill.classList.add('is-show'); }, 7000);

    pill.addEventListener('click', function () {
      var feed = $('#feed');
      ['刚刚烤好的饼干，家里全是黄油的味道 🍪', '今天不赶稿，只晒太阳。'].forEach(function (txt) {
        feed.insertAdjacentHTML('afterbegin', buildTweet(txt));
      });
      pill.classList.remove('is-show');
      toast('已显示 2 条新推文');
      scrollTabsToTop();
    });
  }

  /* ------------------------------------------------------------------
     10. 全局点击代理
     ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var zoom = t.closest('[data-zoom]');
    if (zoom) {
      e.preventDefault();
      openLightbox(zoom);
      return;
    }

    var opener = t.closest('[data-open-composer]');
    if (opener) {
      e.preventDefault();
      openComposer('');
      return;
    }

    var act = t.closest('[data-act]');
    if (act) {
      e.preventDefault();
      handleAct(act);
      return;
    }

    if (!t.closest('#menu')) closeMenu();

    var dead = t.closest('a[href="#"]');
    if (dead) e.preventDefault();
  });

  /* ------------------------------------------------------------------
     11. 键盘
     ------------------------------------------------------------------ */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (lightbox && lightbox.classList.contains('is-open')) { closeLightbox(); return; }
      if (overlay && overlay.classList.contains('is-open')) { closeComposer(); return; }
      closeMenu();
    }
  });

  /* ------------------------------------------------------------------
     12. 初始化
     ------------------------------------------------------------------ */
  function boot() {
    placeIndicator($('.tab.is-active'));
    onScroll();
  }

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);

  window.addEventListener('resize', function () { setTimeout(boot, 60); });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { placeIndicator($('.tab.is-active')); });
  }

})();
