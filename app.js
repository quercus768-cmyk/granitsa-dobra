(function () {
  var PET_PAGE = document.body.getAttribute("data-pet-page") || "pet.html";
  var ANIMALS = window.ANIMALS || [];
  var SITE = window.SITE || {};

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ссылки из config.js */
  function setLinks() {
    document.querySelectorAll("[data-link]").forEach(function (a) {
      var url = SITE[a.getAttribute("data-link")];
      if (url) {
        a.setAttribute("href", url);
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener");
      } else {
        a.removeAttribute("href");
        a.classList.add("no-link");
        if (a.hasAttribute("data-optional")) a.style.display = "none";
      }
    });
  }

  /* меню на телефоне */
  var burger = document.querySelector(".burger");
  var nav = document.querySelector("nav");
  if (burger && nav) {
    burger.addEventListener("click", function () { nav.classList.toggle("open"); });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") nav.classList.remove("open");
    });
  }

  /* кнопки «Поделиться» */
  document.querySelectorAll("[data-share]").forEach(function (b) {
    b.addEventListener("click", function () {
      var url = location.href.split("#")[0];
      if (navigator.share) {
        navigator.share({ title: document.title, url: url }).catch(function () {});
      } else {
        window.open("https://vk.com/share.php?url=" + encodeURIComponent(url), "_blank", "noopener");
      }
    });
  });

  function hasVideo(a) {
    return a.gallery.some(function (g) { return g.type === "video"; });
  }

  function cardHtml(a) {
    var meta = [a.who, a.since ? "с нами с " + a.since : ""].filter(Boolean).join(" · ");
    return '<a class="pet" href="' + PET_PAGE + "?id=" + encodeURIComponent(a.id) + '" data-kind="' + a.kind + '" data-status="' + esc(a.status) + '">' +
      '<div class="pic"><img src="' + a.cover + '" alt="' + esc(a.name + ", " + a.who.toLowerCase()) + '" loading="lazy">' +
      (hasVideo(a) ? '<span class="badge">▶ видео</span>' : "") + "</div>" +
      '<div class="info"><h3>' + esc(a.name) + '</h3><div class="meta">' + esc(meta) + "</div>" +
      '<div class="tag-line">' + esc(a.tagline) + '</div><span class="more">Познакомиться →</span></div></a>';
  }

  /* каталог на главной */
  var grid = document.getElementById("grid");
  var filters = document.getElementById("filters");
  if (grid && filters) {
    var defs = [
      { key: "all", label: "Все", test: function () { return true; } },
      { key: "dog", label: "Собаки", test: function (a) { return a.kind === "dog"; } },
      { key: "cat", label: "Кошки", test: function (a) { return a.kind === "cat"; } },
      { key: "home", label: "Ищут дом", test: function (a) { return a.status === "Ищет дом"; } }
    ].filter(function (d) {
      return d.key === "all" || ANIMALS.some(d.test);
    });
    if (defs.length <= 2) { filters.style.display = "none"; }
    var render = function (def) {
      grid.innerHTML = ANIMALS.filter(def.test).map(cardHtml).join("");
    };
    filters.innerHTML = defs.map(function (d, i) {
      return '<button class="chip' + (i === 0 ? " on" : "") + '" data-key="' + d.key + '">' + d.label + "</button>";
    }).join("");
    filters.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      filters.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("on", c === b); });
      render(defs.filter(function (d) { return d.key === b.getAttribute("data-key"); })[0]);
    });
    render(defs[0]);
  }

  /* страница питомца */
  var root = document.getElementById("pet-root");
  if (root) {
    var id = new URLSearchParams(location.search).get("id");
    var a = ANIMALS.filter(function (x) { return x.id === id; })[0];
    if (!a) {
      root.innerHTML = '<p style="padding:40px var(--pad);font-size:20px">Такого хвостика мы не нашли. <a href="' + document.body.getAttribute("data-home") + '#pets" style="color:var(--accent);font-weight:700">Посмотреть всех подопечных</a></p>';
    } else {
      document.title = a.name + " — Граница добра";
      var meta = [a.who, a.since ? "с нами с " + a.since : ""].filter(Boolean);
      var info = '<h1>' + esc(a.name) + '</h1><div class="meta">' +
        meta.map(function (m) { return '<span class="pill">' + esc(m) + "</span>"; }).join("") +
        '<span class="pill status">' + esc(a.status) + "</span></div>" +
        '<div class="tagline">' + esc(a.tagline) + "</div>" +
        a.story.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
        '<div class="btns"><a class="btn main"' + (a.vk ? ' href="' + esc(a.vk) + '" target="_blank" rel="noopener"' : ' data-link="vk"') + ">Следить за " + esc(a.name) + " в ВК</a>" +
        '<button class="btn" data-share>Поделиться</button></div>';
      root.innerHTML = '<div class="crumb"><a href="' + document.body.getAttribute("data-home") + '#pets">← Все хвостики</a></div>' +
        '<div class="pet-page"><div><div class="gal-main" id="gal-main"></div><div class="thumbs" id="thumbs"></div></div>' +
        '<div class="pet-info">' + info + "</div></div>";

      var main = document.getElementById("gal-main");
      var thumbs = document.getElementById("thumbs");
      var show = function (i) {
        var g = a.gallery[i];
        main.innerHTML = g.type === "video"
          ? '<video controls playsinline loop muted preload="metadata" poster="' + g.poster + '" src="' + g.src + '"></video>'
          : '<img src="' + g.src + '" alt="' + esc(g.alt || a.name) + '">';
        thumbs.querySelectorAll(".thumb").forEach(function (t, k) { t.classList.toggle("on", k === i); });
      };
      if (a.gallery.length > 1) {
        thumbs.innerHTML = a.gallery.map(function (g, i) {
          return '<button class="thumb" data-i="' + i + '" aria-label="Показать ' + (i + 1) + '"><img src="' + (g.type === "video" ? g.poster : g.src) + '" alt="">' + (g.type === "video" ? "<i>▶</i>" : "") + "</button>";
        }).join("");
        thumbs.addEventListener("click", function (e) {
          var t = e.target.closest(".thumb");
          if (t) show(+t.getAttribute("data-i"));
        });
      }
      show(0);

      var others = ANIMALS.filter(function (x) { return x.id !== a.id; });
      var oh = document.getElementById("others-grid");
      if (oh) { oh.innerHTML = others.map(cardHtml).join(""); }
    }
  }

  /* увеличение фото в галерее */
  var shots = Array.prototype.slice.call(document.querySelectorAll(".mosaic [data-full]"));
  if (shots.length) {
    var lb = document.createElement("div");
    lb.className = "lb";
    lb.innerHTML = '<button class="x" aria-label="Закрыть">×</button><button class="p" aria-label="Назад">‹</button><img alt=""><button class="n" aria-label="Дальше">›</button>';
    document.body.appendChild(lb);
    var big = lb.querySelector("img"), cur = 0;
    var open = function (i) {
      cur = (i + shots.length) % shots.length;
      big.src = shots[cur].getAttribute("data-full");
      big.alt = shots[cur].querySelector("img").alt;
      lb.classList.add("open");
    };
    var close = function () { lb.classList.remove("open"); };
    shots.forEach(function (b, i) { b.addEventListener("click", function () { open(i); }); });
    lb.addEventListener("click", function (e) {
      if (e.target.classList.contains("x") || e.target === lb) close();
      else if (e.target.classList.contains("p")) open(cur - 1);
      else if (e.target.classList.contains("n")) open(cur + 1);
    });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") open(cur - 1);
      if (e.key === "ArrowRight") open(cur + 1);
    });
    var sx = 0;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) open(cur + (dx < 0 ? 1 : -1));
    });
  }

  setLinks();
})();
