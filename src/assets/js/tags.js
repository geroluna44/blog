(function () {
  var strip = document.querySelector("[data-tags-strip]");
  if (!strip) return;

  var viewport = strip.querySelector(".tags-viewport");
  var track = strip.querySelector(".tags-track");
  var prev = strip.querySelector('[data-dir="prev"]');
  var next = strip.querySelector('[data-dir="next"]');
  if (!viewport || !track || !prev || !next) return;

  function overflow() {
    return track.scrollWidth - viewport.clientWidth > 1;
  }

  function update() {
    if (!overflow()) {
      strip.classList.add("is-static");
      return;
    }
    strip.classList.remove("is-static");
    var max = track.scrollWidth - viewport.clientWidth;
    prev.disabled = viewport.scrollLeft <= 1;
    next.disabled = viewport.scrollLeft >= max - 1;
  }

  function scrollBy(dir) {
    var step = Math.max(120, Math.round(viewport.clientWidth * 0.7));
    viewport.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  prev.addEventListener("click", function () {
    scrollBy(-1);
  });
  next.addEventListener("click", function () {
    scrollBy(1);
  });

  viewport.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
