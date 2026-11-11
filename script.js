(function () {
  var els = document.querySelectorAll(".rv-in");
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (e) {
      e.classList.add("on");
    });
    return;
  }
  var io = new IntersectionObserver(
    function (es) {
      es.forEach(function (x) {
        if (x.isIntersecting) {
          x.target.classList.add("on");
          io.unobserve(x.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  els.forEach(function (e) {
    io.observe(e);
  });
})();

/* ===== Carrossel de atendimentos (passa sozinho, clique para ampliar) ===== */
(function () {
  var $ = function (id) {
    return document.getElementById(id);
  };
  var track = $("track");
  if (!track) return;
  var slides = [].slice.call(track.querySelectorAll(".slide"));
  var dotsBox = $("dots"),
    lb = $("lb"),
    lbimg = $("lbimg"),
    lbcap = $("lbcap");
  var cur = 0,
    dots = [],
    opener = null,
    timer = null,
    hold = false;
  var reduce =
    window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SEGUNDOS = 4; /* tempo entre uma foto e outra */

  slides.forEach(function (s, i) {
    s.addEventListener("click", function () {
      openLb(i);
    });
    var d = document.createElement("button");
    d.type = "button";
    d.setAttribute("aria-label", "Ir para foto " + (i + 1));
    d.addEventListener("click", function () {
      pause();
      go(i);
    });
    dotsBox.appendChild(d);
    dots.push(d);
  });

  function mark(i) {
    cur = i;
    dots.forEach(function (d, k) {
      d.classList.toggle("on", k === i);
    });
  }
  function go(i) {
    i = (i + slides.length) % slides.length;
    track.scrollTo({
      left: slides[i].offsetLeft,
      behavior: reduce ? "auto" : "smooth",
    });
    mark(i);
  }
  var t;
  track.addEventListener("scroll", function () {
    clearTimeout(t);
    t = setTimeout(function () {
      var best = 0,
        min = 1e9;
      slides.forEach(function (s, k) {
        var d = Math.abs(s.offsetLeft - track.scrollLeft);
        if (d < min) {
          min = d;
          best = k;
        }
      });
      mark(best);
    }, 60);
  });
  track.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") go(cur + 1);
    if (e.key === "ArrowLeft") go(cur - 1);
  });

  /* passagem automática (sempre ativa; pausa um pouco quando a pessoa interage) */
  var pauseUntil = 0,
    visible = true;
  function stop() {
    clearInterval(timer);
    timer = null;
  }
  function pause(ms) {
    pauseUntil = Date.now() + (ms || 6000);
  }
  function play() {
    stop();
    timer = setInterval(function () {
      if (!visible || document.hidden || !lb.hidden || Date.now() < pauseUntil)
        return;
      go(cur + 1);
    }, SEGUNDOS * 1000);
  }
  ["touchstart", "wheel", "keydown"].forEach(function (ev) {
    track.addEventListener(
      ev,
      function () {
        pause();
      },
      { passive: true },
    );
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (es) {
        visible = es[0].isIntersecting;
      },
      { threshold: 0.3 },
    ).observe(track.parentNode);
  }
  play();

  /* arrastar com o mouse (computador) */
  var down = false,
    moved = false,
    sx = 0,
    dxm = 0,
    startIdx = 0;
  track.addEventListener("dragstart", function (e) {
    e.preventDefault();
  });
  track.addEventListener("mousedown", function (e) {
    down = true;
    moved = false;
    dxm = 0;
    sx = e.clientX;
    startIdx = cur;
    pause(8000);
  });
  window.addEventListener("mousemove", function (e) {
    if (!down) return;
    dxm = e.clientX - sx;
    if (Math.abs(dxm) > 5) {
      moved = true;
      track.classList.add("drag");
    }
    if (moved) track.scrollLeft = slides[startIdx].offsetLeft - dxm;
  });
  window.addEventListener("mouseup", function () {
    if (!down) return;
    down = false;
    if (!moved) return;
    track.classList.remove("drag");
    var i = startIdx + (dxm < -60 ? 1 : dxm > 60 ? -1 : 0);
    go(Math.max(0, Math.min(slides.length - 1, i)));
  });
  track.addEventListener(
    "click",
    function (e) {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    },
    true,
  );

  /* ampliar */
  function show(i) {
    cur = (i + slides.length) % slides.length;
    var img = slides[cur].querySelector("img");
    lbimg.src = img.currentSrc || img.src;
    lbimg.alt = img.alt;
    lbcap.textContent = cur + 1 + " / " + slides.length;
  }
  function openLb(i) {
    opener = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    stop();
    $("lbx").focus();
  }
  function closeLb() {
    lb.hidden = true;
    document.body.style.overflow = "";
    go(cur);
    if (opener) opener.focus();
    play();
  }
  $("lbx").addEventListener("click", closeLb);
  $("lbp").addEventListener("click", function () {
    show(cur - 1);
  });
  $("lbn").addEventListener("click", function () {
    show(cur + 1);
  });
  lb.addEventListener("click", function (e) {
    if (e.target === lb) closeLb();
  });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowRight") show(cur + 1);
    if (e.key === "ArrowLeft") show(cur - 1);
  });
  var x0 = null;
  lb.addEventListener(
    "touchstart",
    function (e) {
      x0 = e.touches[0].clientX;
    },
    { passive: true },
  );
  lb.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  mark(0);
})();
