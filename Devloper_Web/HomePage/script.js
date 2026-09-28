(() => {
  "use strict";

  const header = document.querySelector("#site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#primary-navigation");
  const navLinks = [...document.querySelectorAll(".nav-link")];
  const sections = [...document.querySelectorAll(".section-anchor")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const setMenuState = (open, returnFocus = false) => {
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.querySelector(".sr-only").textContent = open
      ? "Close navigation menu"
      : "Open navigation menu";
    navigation.classList.toggle("is-open", open);
    header.classList.toggle("menu-active", open);
    document.body.classList.toggle("menu-open", open);

    if (returnFocus) {
      menuButton.focus();
    }
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    setMenuState(!isOpen);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
  });

  document.addEventListener("click", (event) => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    if (isOpen && !header.contains(event.target)) {
      setMenuState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      setMenuState(false, true);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 800) {
      setMenuState(false);
    }
  });

  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 16);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const year = document.querySelector("#current-year");
  year.textContent = String(new Date().getFullYear());

  const setActiveLink = (sectionId) => {
    navLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${sectionId}`;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          setActiveLink(visible.target.id);
        }
      },
      { rootMargin: "-25% 0px -60%", threshold: [0.05, 0.2, 0.5] }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  const revealElements = document.querySelectorAll(".reveal");
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.12 }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  }

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const tiltCards = document.querySelectorAll("[data-tilt]");

  if (!reducedMotion.matches && finePointer.matches) {
    tiltCards.forEach((card) => {
      let animationFrame = 0;

      const updateTilt = (event) => {
        if (reducedMotion.matches || !finePointer.matches) return;
        const bounds = card.getBoundingClientRect();
        const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
        const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;

        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => {
          card.style.setProperty("--tilt-x", `${(-vertical * 7).toFixed(2)}deg`);
          card.style.setProperty("--tilt-y", `${(horizontal * 7).toFixed(2)}deg`);
        });
      };

      const resetTilt = () => {
        cancelAnimationFrame(animationFrame);
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      };

      card.addEventListener("pointermove", updateTilt, { passive: true });
      card.addEventListener("pointerleave", resetTilt);
      card.addEventListener("pointercancel", resetTilt);
    });
  }

  const heroStage = document.querySelector(".brand-stage");

  if (heroStage && !reducedMotion.matches && finePointer.matches) {
    let animationFrame = 0;
    const depths = {
      "--hero-banner-x": 5,
      "--hero-banner-y": 4,
    };

    const resetHeroDepth = () => {
      cancelAnimationFrame(animationFrame);
      Object.keys(depths).forEach((name) => heroStage.style.setProperty(name, "0px"));
    };

    heroStage.addEventListener("pointermove", (event) => {
      if (reducedMotion.matches || !finePointer.matches) {
        resetHeroDepth();
        return;
      }

      const bounds = heroStage.getBoundingClientRect();
      const horizontal = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
      const vertical = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));

      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        Object.entries(depths).forEach(([name, maximum]) => {
          const offset = name.endsWith("-x") ? horizontal : vertical;
          heroStage.style.setProperty(name, `${(offset * maximum).toFixed(1)}px`);
        });
      });
    }, { passive: true });

    heroStage.addEventListener("pointerleave", resetHeroDepth);
    heroStage.addEventListener("pointercancel", resetHeroDepth);
    reducedMotion.addEventListener("change", resetHeroDepth);
  }

  const banner = document.querySelector(".brand-banner");
  const floatingApps = [
    { element: document.querySelector(".floating-arrowsolve"), segmentDuration: 2.35 },
    { element: document.querySelector(".floating-pdf"), segmentDuration: 1.95 },
    { element: document.querySelector(".floating-playexa"), segmentDuration: 1.6 },
  ].filter(({ element }) => element);

  if (banner && floatingApps.length) {
    let animationFrame = 0;
    let lastFrame = 0;
    let bannerVisible = !("IntersectionObserver" in window);

    const measureApps = () => {
      const width = banner.clientWidth;
      const height = banner.clientHeight;
      floatingApps.forEach((app) => {
        const size = app.element.offsetWidth;
        const inset = size / 2 + 8;
        app.bounds = {
          size,
          left: inset,
          right: Math.max(inset, width - inset),
          top: inset,
          bottom: Math.max(inset, height - inset),
        };
      });
    };

    const randomPoint = (app, previous) => {
      const width = app.bounds.right - app.bounds.left;
      const height = app.bounds.bottom - app.bounds.top;
      const minimumDistance = Math.min(width, height) * 0.4;
      let point;

      for (let attempt = 0; attempt < 12; attempt += 1) {
        point = { x: Math.random(), y: Math.random() };
        if (!previous || Math.hypot((point.x - previous.x) * width, (point.y - previous.y) * height) >= minimumDistance) {
          break;
        }
      }
      return point;
    };

    const animateApps = (now) => {
      const delta = lastFrame ? Math.min(now - lastFrame, 40) / 1000 : 0;
      lastFrame = now;

      floatingApps.forEach((app) => {
        app.progress += delta / app.segmentDuration;
        if (app.progress >= 1) {
          app.progress -= 1;
          app.points.shift();
          app.points.push(randomPoint(app, app.points[1]));
        }

        const [first, control, last] = app.points;
        const startX = (first.x + control.x) / 2;
        const startY = (first.y + control.y) / 2;
        const endX = (control.x + last.x) / 2;
        const endY = (control.y + last.y) / 2;
        const remaining = 1 - app.progress;
        const x = remaining * remaining * startX + 2 * remaining * app.progress * control.x + app.progress * app.progress * endX;
        const y = remaining * remaining * startY + 2 * remaining * app.progress * control.y + app.progress * app.progress * endY;
        const { bounds, element } = app;
        const left = bounds.left + x * (bounds.right - bounds.left) - bounds.size / 2;
        const top = bounds.top + y * (bounds.bottom - bounds.top) - bounds.size / 2;
        element.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
      });

      animationFrame = requestAnimationFrame(animateApps);
    };

    const stopApps = (reset = false) => {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      lastFrame = 0;
      if (reset) {
        floatingApps.forEach(({ element }) => {
          element.style.left = "";
          element.style.top = "";
          element.style.transform = "";
        });
      }
    };

    const startApps = () => {
      if (animationFrame || document.hidden || reducedMotion.matches || !bannerVisible) return;
      measureApps();
      floatingApps.forEach((app) => {
        const { element } = app;
        if (!app.points) {
          const first = randomPoint(app);
          const control = randomPoint(app, first);
          app.points = [first, control, randomPoint(app, control)];
          app.progress = Math.random();
        }
        element.style.left = "0";
        element.style.top = "0";
      });
      animationFrame = requestAnimationFrame(animateApps);
    };

    if ("ResizeObserver" in window) {
      new ResizeObserver(measureApps).observe(banner);
    } else {
      window.addEventListener("resize", measureApps, { passive: true });
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        bannerVisible = entry.isIntersecting;
        if (bannerVisible) startApps();
        else stopApps();
      }).observe(banner);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopApps();
      else startApps();
    });
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) {
        stopApps(true);
      } else {
        startApps();
      }
    });
    startApps();
  }
})();
