/* =====================================================
   1. "NUSXA OLISH" TUGMALARI
   ===================================================== */
document.querySelectorAll("button.copy").forEach(function (btn) {
  btn.addEventListener("click", function () {
    var original = btn.textContent;
    function show(label) {
      btn.textContent = label;
      setTimeout(function () { btn.textContent = original; }, 1600);
    }
    // clipboard ishlamasa, matnni belgilab qo'yamiz
    function fallback() {
      var target = btn.parentNode.querySelector(".v");
      var range = document.createRange();
      range.selectNodeContents(target);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      show("belgilandi");
    }
    try {
      navigator.clipboard.writeText(btn.dataset.copy).then(function () { show("nusxalandi"); }, fallback);
    } catch (e) { fallback(); }
  });
});

/* =====================================================
   2. CHAQMOQ ANIMATSIYASI
   - bolts: ekranni yoritib o'tadigan katta chaqmoqlar
   - arcs:  doim harakatlanadigan elektr yoylari
   Sonini o'zgartirish uchun SOZLAMALAR'ni tahrirlang.
   ===================================================== */
(function () {
  var canvas = document.getElementById("fx");
  var ctx = canvas && canvas.getContext && canvas.getContext("2d");
  if (!ctx) return;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- SOZLAMALAR ---------- */
  var CFG = {
    maxBolts: 8,            // bir vaqtda ko'rinadigan chaqmoqlar soni
    boltDelay: [0.18, 0.8], // yangi chaqmoq paydo bo'lish oralig'i (soniya)
    arcs: 5,                // doimiy elektr yoylari soni
    flashPower: 0.09        // chaqmoq urganda ekran yorishishi
  };

  var W = 0, H = 0, small = false;
  var bolts = [], arcs = [], flash = 0, time = 0, last = 0, nextBolt = 0.1;

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    small = W < 700;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- Tarmoqlangan chaqmoq chizig'ini hosil qilish ---------- */

  // Ikki nuqta orasida tasodifiy egri-bugri chiziq yasaydi
  function jag(x1, y1, x2, y2, disp) {
    var pts = [[x1, y1], [x2, y2]];
    while (disp > 1.3 && pts.length < 260) {
      var next = [pts[0]];
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        var dx = b[0] - a[0], dy = b[1] - a[1];
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var off = (Math.random() - 0.5) * disp;
        next.push([(a[0] + b[0]) / 2 - dy / len * off, (a[1] + b[1]) / 2 + dx / len * off]);
        next.push(b);
      }
      pts = next;
      disp *= 0.55;
    }
    return pts;
  }

  // Asosiy chiziq + shoxlar + shox ichidagi mayda shoxlar
  function makeBolt(x1, y1, x2, y2, width, branches) {
    var len = Math.hypot(x2 - x1, y2 - y1);
    var main = jag(x1, y1, x2, y2, len * 0.26);
    var parts = [{ pts: main, w: width }];
    var angle = Math.atan2(y2 - y1, x2 - x1);

    for (var i = 0; i < branches; i++) {
      var s = main[Math.floor(rnd(0.08, 0.9) * (main.length - 1))];
      var a = angle + (Math.random() < 0.5 ? -1 : 1) * rnd(0.3, 1.05);
      var bl = rnd(0.12, 0.4) * len;
      var branch = jag(s[0], s[1], s[0] + Math.cos(a) * bl, s[1] + Math.sin(a) * bl, bl * 0.3);
      parts.push({ pts: branch, w: width * 0.55 });

      if (Math.random() < 0.6) {
        var s2 = branch[Math.floor(rnd(0.2, 0.85) * (branch.length - 1))];
        var a2 = a + (Math.random() < 0.5 ? -1 : 1) * rnd(0.35, 0.9);
        var bl2 = bl * rnd(0.25, 0.5);
        parts.push({ pts: jag(s2[0], s2[1], s2[0] + Math.cos(a2) * bl2, s2[1] + Math.sin(a2) * bl2, bl2 * 0.3), w: width * 0.32 });
      }
    }
    return parts;
  }

  // Chaqmoqni 3 qavat bilan chizadi: tashqi nur, o'rta nur, oq o'zak
  function drawBolt(parts, alpha, ox, oy) {
    ctx.lineJoin = ctx.lineCap = "round";
    parts.forEach(function (p) {
      ctx.beginPath();
      ctx.moveTo(p.pts[0][0] + ox, p.pts[0][1] + oy);
      for (var k = 1; k < p.pts.length; k++) ctx.lineTo(p.pts[k][0] + ox, p.pts[k][1] + oy);
      ctx.strokeStyle = "rgba(40,130,255," + alpha * 0.12 + ")";
      ctx.lineWidth = p.w * 12;
      ctx.stroke();
      ctx.strokeStyle = "rgba(90,190,255," + alpha * 0.32 + ")";
      ctx.lineWidth = p.w * 4;
      ctx.stroke();
      ctx.strokeStyle = "rgba(230,247,255," + Math.min(1, alpha) + ")";
      ctx.lineWidth = Math.max(0.6, p.w * 1.3);
      ctx.stroke();
    });
  }

  // Uchlaridagi yorug' shar
  function drawOrb(x, y, r, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(235,249,255," + a + ")");
    g.addColorStop(0.25, "rgba(90,190,255," + a * 0.55 + ")");
    g.addColorStop(1, "rgba(40,120,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ---------- Katta chaqmoqlar ---------- */
  function spawnBolt() {
    var x1, y1, x2, y2, side = Math.random();
    if (side < 0.62) {            // tepadan pastga
      x1 = rnd(0.03, 0.97) * W; y1 = -30;
      x2 = x1 + rnd(-0.35, 0.35) * W; y2 = rnd(0.45, 1.05) * H;
    } else if (side < 0.81) {     // chapdan
      x1 = -30; y1 = rnd(0.05, 0.7) * H;
      x2 = rnd(0.45, 1) * W; y2 = y1 + rnd(-0.1, 0.5) * H;
    } else {                      // o'ngdan
      x1 = W + 30; y1 = rnd(0.05, 0.7) * H;
      x2 = rnd(0, 0.55) * W; y2 = y1 + rnd(-0.1, 0.5) * H;
    }
    bolts.push({
      parts: makeBolt(x1, y1, x2, y2, rnd(1.5, 2.6), small ? 4 : rnd(6, 11)),
      life: rnd(0.5, 1.1), t: 0, flicker: 1,
      vx: rnd(-26, 26), vy: rnd(-8, 12)
    });
    flash = Math.max(flash, rnd(0.5, 1));
  }

  /* ---------- Doimiy elektr yoylari ---------- */
  function initArcs() {
    var count = small ? 3 : CFG.arcs;
    arcs = [];
    for (var i = 0; i < count; i++) {
      arcs.push({
        phase: [rnd(0, 6.28), rnd(0, 6.28), rnd(0, 6.28), rnd(0, 6.28)],
        speed: [rnd(0.1, 0.24), rnd(0.12, 0.26), rnd(0.1, 0.24), rnd(0.12, 0.26)],
        cx: rnd(0.15, 0.85), cy: rnd(0.15, 0.85),
        parts: null, timer: 0
      });
    }
  }

  function arcEnds(a) {
    var rx = W * 0.34, ry = H * 0.3;
    return [
      a.cx * W + Math.cos(time * a.speed[0] + a.phase[0]) * rx,
      a.cy * H + Math.sin(time * a.speed[1] + a.phase[1]) * ry,
      a.cx * W + Math.cos(time * a.speed[2] + a.phase[2] + 2.4) * rx,
      a.cy * H + Math.sin(time * a.speed[3] + a.phase[3] + 1.7) * ry
    ];
  }

  function drawArcs(dt, forceNew) {
    arcs.forEach(function (a) {
      var e = arcEnds(a);
      a.timer -= dt;
      if (!a.parts || a.timer <= 0 || forceNew) {     // yoy tez-tez yangilanib, "titrab" turadi
        a.parts = makeBolt(e[0], e[1], e[2], e[3], 1.2, small ? 2 : 4);
        a.timer = rnd(0.05, 0.11);
      }
      drawBolt(a.parts, 0.66, 0, 0);
      drawOrb(e[0], e[1], 36, 0.75);
      drawOrb(e[2], e[3], 36, 0.75);
    });
  }

  /* ---------- Asosiy sikl ---------- */
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    time += dt;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    // chaqmoq urganda butun ekran yorishadi
    if (flash > 0.01) {
      ctx.fillStyle = "rgba(60,140,255," + flash * CFG.flashPower + ")";
      ctx.fillRect(0, 0, W, H);
      flash *= Math.pow(0.0015, dt);
    }

    // yangi chaqmoq
    nextBolt -= dt;
    var limit = small ? Math.ceil(CFG.maxBolts / 2) : CFG.maxBolts;
    if (nextBolt <= 0 && bolts.length < limit) {
      spawnBolt();
      if (Math.random() < 0.3) spawnBolt();           // ba'zan qo'sh chaqmoq
      nextBolt = rnd(CFG.boltDelay[0], CFG.boltDelay[1]);
    }

    // mavjud chaqmoqlarni chizish
    for (var i = bolts.length - 1; i >= 0; i--) {
      var b = bolts[i];
      b.t += dt;
      var p = b.t / b.life;
      if (p >= 1) { bolts.splice(i, 1); continue; }
      if (Math.random() < 0.35) b.flicker = rnd(0.45, 1);
      var fade = Math.pow(Math.sin(Math.PI * Math.min(1, p * 1.25)), 0.5) * (p < 0.12 ? 1 : b.flicker);
      drawBolt(b.parts, fade, b.vx * b.t, b.vy * b.t);
    }

    drawArcs(dt, false);
    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(frame);
  }

  // Animatsiya o'chirilgan bo'lsa (reduced motion), bitta qotgan rasm chizamiz
  function drawStill() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < 4; i++) {
      drawBolt(makeBolt(rnd(0.1, 0.9) * W, -20, rnd(0.1, 0.9) * W, rnd(0.55, 1) * H, 2, small ? 4 : 7), 0.8, 0, 0);
    }
    time = 3;
    drawArcs(0, true);
    ctx.globalCompositeOperation = "source-over";
  }

  resize();
  initArcs();

  if (reduceMotion) {
    drawStill();
    window.addEventListener("resize", function () { resize(); initArcs(); drawStill(); });
  } else {
    window.addEventListener("resize", resize);
    requestAnimationFrame(function (t) { last = t; frame(t); });
  }
})();
