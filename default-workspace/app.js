/* ============================================================
   潮汐心事 HeartTides — 共享脚本
   每个模块都做了存在性判断，同一份脚本可用于所有页面
   ============================================================ */
(function () {
  'use strict';

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 导航：滚动描边 + 移动端抽屉 ---------- */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');

  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', (window.scrollY || document.documentElement.scrollTop) > 16);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (burger && drawer) {
    var closeMenu = function () {
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', '打开菜单');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    var openMenu = function () {
      document.body.classList.add('menu-open');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', '关闭菜单');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    burger.addEventListener('click', function () {
      document.body.classList.contains('menu-open') ? closeMenu() : openMenu();
    });
    drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- 2. 滚动渐显 ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !RM) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var sibs = Array.prototype.slice.call(el.parentNode.children).filter(function (c) {
          return c.hasAttribute && c.hasAttribute('data-reveal');
        });
        el.style.transitionDelay = Math.min(Math.max(sibs.indexOf(el), 0) * 90, 360) + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 3. 提示条 ---------- */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  /* ---------- 4. 客返列表 + 弹窗 ---------- */
  var REVIEWS = [
    {
      name: '小鹿', service: '塔罗占卜 · 单问 ¥33', date: '2025.11.02',
      text: '我问的是要不要辞职。她没有替我做决定，只是把牌里我一直在回避的那件事说了出来——我不是怕辞不掉，我是怕走完之后没有人认可我。挂掉语音我在楼下坐了很久，但第二天就把辞职信写好了。谢谢你没有哄我。'
    },
    {
      name: '匿', service: '恋爱圣三角 ¥36', date: '2025.10.27',
      text: '圣三角把我和他的位置摆得特别清楚。之前我一直在猜他到底想不想认真，看完那三张牌我才明白，问题不在他想不想，在我一直不肯问。听完就不再反复猜了，很谢谢。'
    },
    {
      name: '阿遥', service: '远程灵气疗愈', date: '2025.10.19',
      text: '本来对远程是有点怀疑的，就抱着试试看的心态。过程中手心一直发热，结束后当晚睡了整八个小时——很久没有过的那种睡法。第二天起来肩膀是松的。'
    },
    {
      name: '柒月', service: '占星骰子 ¥18', date: '2025.10.11',
      text: '十八块问了一个我一直不敢问的问题，答案干脆得让我笑了。骰子是真的不绕弯子。后来照着她说的那个方向挪了一小步，事情居然真的动起来了。'
    },
    {
      name: 'Nora', service: '未来恋人 ¥40', date: '2025.09.28',
      text: '当时她描述的类型——偏年长、做技术、话少但细心、在某种「重复性」的场合认识。三个月后遇到的人几乎完全重合，场景也对上了。有一点毛，但更多是安心。'
    },
    {
      name: '匿', service: '四季牌阵 ¥100', date: '2025.09.15',
      text: '四季牌阵更像一次年度复盘，不是那种「你明年会发财」的许诺，而是把四个季节的能量一条一条摊开。我做了一整页笔记，到现在还在翻。这个价格买到的是四十分钟的专注，很值。'
    }
  ];

  var listEl = document.getElementById('reviews-list');
  var moonSVG = '<svg class="rv-moon" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M7.6 1A5 5 0 0 0 7.6 11A9.4 9.4 0 0 1 7.6 1Z"/></svg>';

  if (listEl) {
    var frag = document.createDocumentFragment();
    REVIEWS.forEach(function (r, i) {
      var el = document.createElement('article');
      el.className = 'review';
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', '查看 ' + r.name + ' 的完整评价');
      el.dataset.index = i;
      el.innerHTML =
        '<div class="rv-top">' + moonSVG +
          '<span class="rv-name">' + r.name + '</span>' +
          '<span class="rv-date">' + r.date + '</span>' +
        '</div>' +
        '<blockquote>“' + r.text + '”</blockquote>' +
        '<div class="rv-foot">' +
          '<span class="rv-svc">' + r.service + '</span>' +
          '<span class="rv-more">阅读全文 <span class="arr">→</span></span>' +
        '</div>';
      frag.appendChild(el);
    });
    listEl.appendChild(frag);
  }

  var lightbox = document.getElementById('lightbox');
  if (lightbox && listEl) {
    var lbText = document.getElementById('lbText');
    var lbName = document.getElementById('lbName');
    var lbSvc = document.getElementById('lbSvc');
    var lbDate = document.getElementById('lbDate');
    var lbClose = document.getElementById('lbClose');
    var lastFocused = null;

    var openLightbox = function (i) {
      var r = REVIEWS[i];
      if (!r) return;
      lastFocused = document.activeElement;
      lbText.textContent = '“' + r.text + '”';
      lbName.textContent = r.name;
      lbSvc.textContent = r.service;
      lbDate.textContent = r.date;
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    };
    var closeLightbox = function () {
      if (!lightbox.classList.contains('open')) return;
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    };

    listEl.addEventListener('click', function (e) {
      var card = e.target.closest('.review');
      if (card) openLightbox(Number(card.dataset.index));
    });
    listEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.review');
      if (card) { e.preventDefault(); openLightbox(Number(card.dataset.index)); }
    });
    lbClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
  }

  /* ---------- 5. 留言（localStorage） ---------- */
  var form = document.getElementById('guestForm');
  if (form) {
    var GB_KEY = 'hecate_guestbook_v1';
    var SEED = [
      {
        name: '夜航船', service: '塔罗占卜', date: '2025.11.08',
        text: '第一次找塔罗，紧张到手心出汗。全程被照顾得很好，没有那种压迫感，也没有被吓。原来占卜也可以是这么温柔的一件事。',
        reply: '谢谢你愿意把这段心事交给我。慢慢来，牌已经替你把路标好了。'
      },
      {
        name: '小满', service: '灵气疗愈', date: '2025.11.05',
        text: '想问一下灵气疗愈需要提前准备什么吗？需要空腹或者安静的环境吗？',
        reply: '不需要空腹，找一个不会被打扰的十五分钟就好。可以躺着，手机静音，结束后喝一杯温水。'
      },
      {
        name: '黑猫先生', service: '仪式代做', date: '2025.10.30',
        text: '仪式代做可以指定日期吗？想赶在满月那天。',
        reply: '可以的。月相日期是排期里最优先的，不过请至少提前三天告诉我，材料需要时间准备。'
      }
    ];

    var guestList = document.getElementById('guestList');
    var msgCount = document.getElementById('msgCount');

    var loadMsgs = function () {
      try {
        var arr = JSON.parse(localStorage.getItem(GB_KEY) || '[]');
        return Array.isArray(arr) ? arr : [];
      } catch (e) { return []; }
    };
    var saveMsgs = function (arr) {
      try { localStorage.setItem(GB_KEY, JSON.stringify(arr)); } catch (e) {}
    };
    var today = function () {
      var d = new Date();
      var p = function (n) { return n < 10 ? '0' + n : '' + n; };
      return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate());
    };

    var buildMsg = function (m) {
      var wrap = document.createElement('div');
      wrap.className = 'msg' + (m.isPrivate ? ' private' : '');

      var head = document.createElement('div');
      head.className = 'msg-head';

      var nm = document.createElement('span');
      nm.className = 'msg-name';
      nm.textContent = m.name;
      head.appendChild(nm);

      var svc = document.createElement('span');
      svc.className = 'msg-svc';
      svc.textContent = m.service;
      head.appendChild(svc);

      var dt = document.createElement('span');
      dt.className = 'msg-date';
      dt.textContent = m.date;
      head.appendChild(dt);

      wrap.appendChild(head);

      var body = document.createElement('p');
      body.textContent = m.isPrivate ? '（这是一条私密留言，只有站长能看到。）' : m.text;
      wrap.appendChild(body);

      if (m.reply) {
        var rep = document.createElement('div');
        rep.className = 'msg-reply';
        var who = document.createElement('b');
        who.textContent = '小汐回复';
        rep.appendChild(who);
        rep.appendChild(document.createTextNode(m.reply));
        wrap.appendChild(rep);
      }
      return wrap;
    };

    var renderMsgs = function () {
      if (!guestList) return;
      guestList.textContent = '';
      var all = loadMsgs().concat(SEED);
      var f = document.createDocumentFragment();
      all.forEach(function (m) { f.appendChild(buildMsg(m)); });
      guestList.appendChild(f);
      if (msgCount) msgCount.textContent = (all.length < 10 ? '0' : '') + all.length;
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nameInput = document.getElementById('gName');
      var textInput = document.getElementById('gText');
      var name = nameInput.value.trim();
      var text = textInput.value.trim();

      if (!name) { toast('请先留一个昵称'); nameInput.focus(); return; }
      if (!text) { toast('留言内容还没有写'); textInput.focus(); return; }

      var isPrivate = !document.getElementById('gPublic').checked;
      var arr = loadMsgs();
      arr.unshift({
        name: name.slice(0, 20),
        service: document.getElementById('gService').value,
        text: text.slice(0, 300),
        isPrivate: isPrivate,
        date: today()
      });
      saveMsgs(arr);
      renderMsgs();

      form.reset();
      document.getElementById('gPublic').checked = true;

      toast(isPrivate ? '已收到你的私密留言，我会看到' : '留言已留下，谢谢你');
      if (guestList) guestList.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'nearest' });
    });

    renderMsgs();
  }

  /* ---------- 6. 复制微信号 ---------- */
  var copyBtn = document.getElementById('copyWechat');
  if (copyBtn) {
    var WECHAT = copyBtn.getAttribute('data-wechat') || 'moonkey_heka';

    var fallbackCopy = function () {
      var ta = document.createElement('textarea');
      ta.value = WECHAT;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      document.body.removeChild(ta);
      toast(ok ? '微信号已复制：' + WECHAT : '微信号：' + WECHAT + '（请手动复制）');
    };

    copyBtn.addEventListener('click', function () {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(WECHAT).then(function () {
          toast('微信号已复制：' + WECHAT);
        }, fallbackCopy);
      } else {
        fallbackCopy();
      }
    });
  }
})();
