(function () {
  "use strict";

  var root = document.documentElement;
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  // Colour theme follows the system setting. Only a choice that differs from the system is
  // stored, so the page tracks the system again once the toggle or the system brings them level.
  function systemTheme() { return darkQuery.matches ? "dark" : "light"; }
  function setTheme(theme) {
    if (theme === systemTheme()) {
      delete root.dataset.theme;
      try { localStorage.removeItem("theme"); } catch (e) {}
    } else {
      root.dataset.theme = theme;
      try { localStorage.setItem("theme", theme); } catch (e) {}
    }
  }
  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      setTheme((root.dataset.theme || systemTheme()) === "dark" ? "light" : "dark");
    });
    darkQuery.addEventListener("change", function () {
      if (root.dataset.theme) setTheme(root.dataset.theme);
    });
  }

  // Email address is assembled at runtime to keep it out of the static markup.
  var address = ["sendrowski.janek", "gmail.com"].join("@");
  document.querySelectorAll(".js-email").forEach(function (link) {
    link.href = "mailto:" + address;
    var label = link.querySelector(".email-text");
    if (label) label.textContent = address;
  });

  // Copy buttons: data-copy holds the text, otherwise the sibling <pre> is copied.
  document.querySelectorAll(".copy").forEach(function (button) {
    button.addEventListener("click", function () {
      var pre = button.parentElement.querySelector("pre");
      var text = button.dataset.copy || (pre ? pre.textContent : "");
      var done = function () {
        button.textContent = "Copied";
        button.classList.add("is-copied");
        setTimeout(function () {
          button.textContent = "Copy";
          button.classList.remove("is-copied");
        }, 1600);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done);
      } else {
        var area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        area.remove();
      }
    });
  });

  // Easter egg: a forceful pull past the top of the page makes the content dip and reveals a
  // genealogy coalescing into its root. Upward scroll only counts once the page has rested at
  // the top, so momentum from arriving there does not trigger it.
  var egg = document.querySelector(".mrca");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var atTopSince = window.scrollY <= 0 ? Date.now() : null;
  var pull = 0;
  var pullTimer;
  var playing = false;

  function playEgg() {
    if (playing || reducedMotion.matches) return;
    playing = true;
    egg.hidden = false;
    root.classList.add("egg-play");
    setTimeout(function () {
      root.classList.remove("egg-play");
      egg.hidden = true;
      playing = false;
    }, 1550);
  }

  function addPull(amount) {
    if (atTopSince === null || Date.now() - atTopSince < 600) return;
    pull += amount;
    clearTimeout(pullTimer);
    pullTimer = setTimeout(function () { pull = 0; }, 350);
    if (pull > 200) {
      pull = 0;
      playEgg();
    }
  }

  if (egg) {
    var touchY = null;
    window.addEventListener("scroll", function () {
      if (window.scrollY > 0) atTopSince = null;
      else if (atTopSince === null) atTopSince = Date.now();
    }, { passive: true });
    window.addEventListener("wheel", function (e) {
      if (e.deltaY < 0) addPull(-e.deltaY);
    }, { passive: true });
    window.addEventListener("touchstart", function (e) { touchY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener("touchmove", function (e) {
      if (touchY === null) return;
      var y = e.touches[0].clientY;
      if (y > touchY) addPull((y - touchY) * 6);
      touchY = y;
    }, { passive: true });
  }

  // Highlight the navigation entry of the topmost section: the last section whose top has
  // reached the scroll-padding line, where in-page links place a section when jumped to.
  var nav = document.querySelector(".nav");
  var list = nav && nav.querySelector("ul");
  var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll("a")) : [];
  var sections = navLinks.map(function (a) { return document.getElementById(a.hash.slice(1)); });
  var current = -1;
  var ticking = false;

  function update() {
    ticking = false;
    var line = (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0) + 8;
    var index = 0;
    sections.forEach(function (section, i) {
      if (section && section.getBoundingClientRect().top <= line) index = i;
    });
    // The last section can be too short to reach the line, so it is active at the page end.
    if (window.innerHeight + window.scrollY >= root.scrollHeight - 2) index = sections.length - 1;
    if (index === current) return;
    current = index;
    navLinks.forEach(function (a, i) {
      if (i === index) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    list.style.setProperty("--i", index);
    if (nav.scrollWidth > nav.clientWidth) {
      var link = navLinks[index];
      nav.scrollTo({ left: link.offsetLeft - nav.clientWidth / 2 + link.offsetWidth / 2, behavior: "smooth" });
    }
  }

  if (navLinks.length) {
    var schedule = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
  }
})();
