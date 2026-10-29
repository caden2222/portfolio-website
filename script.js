/* =========================================================
   CADEN TOH — PORTFOLIO INTERACTIONS

   Includes:
   • Accessible mobile navigation
   • Smooth section navigation
   • Active navigation tracking
   • Reading progress indicator
   • Floating back-to-top control
   • Scroll reveal animations
   • Project category filters
   • Project keyword search
   • Ctrl/Cmd + K navigation menu
   • Keyboard navigation
   • Copy-email control and feedback
   • Pointer lighting on cards
   • Missing-image fallbacks
   • Reduced-motion support
   • Automatic copyright year

   No dependencies.
========================================================= */

(() => {
  "use strict";

  /* -------------------------------------------------------
     CONFIGURATION
  ------------------------------------------------------- */

  const CONFIG = {
    mobileBreakpoint: 720,
    revealDuration: 520,
    searchDelay: 120,
    showBackToTopAfter: 650,

    features: {
      projectTools: true,
      commandMenu: true,
      copyEmail: true,
      scrollReveal: false,
      scrollProgress: true,
      backToTop: true,
      cardGlow: true,
      imageFallbacks: true
    }
  };

  function boot() {
    /* Prevent duplicate controls if the script loads twice. */

    if (
      document.documentElement.dataset.cadenInteractions === "ready"
    ) {
      return;
    }

    document.documentElement.dataset.cadenInteractions = "ready";

    /* -----------------------------------------------------
       SHARED REFERENCES
    ----------------------------------------------------- */

    const $ = (selector, root = document) =>
      root.querySelector(selector);

    const $$ = (selector, root = document) => [
      ...root.querySelectorAll(selector)
    ];

    const motion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const mobile = window.matchMedia(
      `(max-width: ${CONFIG.mobileBreakpoint}px)`
    );

    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    );

    const runningAnimations = new Set();
    const scrollLocks = new Set();

    const header = $(".site-header");
    const navigation = $(".nav-links");
    const menuToggle = $(".menu-toggle");
    const emailLink = $('a[href^="mailto:"]');

    let email = "";
    let bodyOverflow = "";
    let bodyPadding = "";
    let menuOpen = false;
    let scrollQueued = false;
    let progressBar = null;
    let backToTop = null;
    let commandDialog = null;
    let lastActiveSection = "";

    try {
      email = emailLink
        ? decodeURIComponent(
            emailLink
              .getAttribute("href")
              .slice(7)
              .split("?")[0]
          )
        : "";
    } catch {
      email = "";
    }

    /* -----------------------------------------------------
       UTILITIES
    ----------------------------------------------------- */

    function element(tag, className = "", text = "") {
      const node = document.createElement(tag);

      if (className) {
        node.className = className;
      }

      if (text) {
        node.textContent = text;
      }

      return node;
    }

    function style(node, values) {
      Object.assign(node.style, values);
      return node;
    }

    function show(node, visible, display = "") {
      node.hidden = !visible;

      /*
       * Explicit display prevents existing CSS classes from
       * overriding the browser's default [hidden] styling.
       */

      node.style.display = visible ? display : "none";
    }

    function animate(
      node,
      frames,
      duration = CONFIG.revealDuration
    ) {
      if (
        motion.matches ||
        typeof node.animate !== "function"
      ) {
        return;
      }

      const animation = node.animate(frames, {
        duration,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)"
      });

      runningAnimations.add(animation);

      animation.finished
        .catch(() => {})
        .finally(() => {
          runningAnimations.delete(animation);
        });
    }

    motion.addEventListener("change", () => {
      if (!motion.matches) {
        return;
      }

      runningAnimations.forEach(animation => {
        animation.cancel();
      });

      runningAnimations.clear();
    });

    /* -----------------------------------------------------
       SHARED SCROLL LOCK

       Navigation and the command menu can independently
       request a lock without overwriting each other's state.
    ----------------------------------------------------- */

    function lockScroll(key, locked) {
      if (locked) {
        if (scrollLocks.has(key)) {
          return;
        }

        if (scrollLocks.size === 0) {
          bodyOverflow = document.body.style.overflow;
          bodyPadding = document.body.style.paddingRight;

          const gutter =
            window.innerWidth -
            document.documentElement.clientWidth;

          const padding =
            parseFloat(
              getComputedStyle(document.body).paddingRight
            ) || 0;

          document.body.style.overflow = "hidden";

          if (gutter > 0) {
            document.body.style.paddingRight =
              `${padding + gutter}px`;
          }
        }

        scrollLocks.add(key);
      } else {
        if (!scrollLocks.has(key)) {
          return;
        }

        scrollLocks.delete(key);

        if (scrollLocks.size === 0) {
          document.body.style.overflow = bodyOverflow;
          document.body.style.paddingRight = bodyPadding;
        }
      }
    }

    /* -----------------------------------------------------
       MOBILE NAVIGATION
    ----------------------------------------------------- */

    function setMenu(open, restoreFocus = false) {
      if (!navigation || !menuToggle) {
        return;
      }

      menuOpen = Boolean(open && mobile.matches);

      navigation.classList.toggle("active", menuOpen);

      menuToggle.setAttribute(
        "aria-expanded",
        String(menuOpen)
      );

      menuToggle.setAttribute(
        "aria-label",
        menuOpen
          ? "Close navigation menu"
          : "Open navigation menu"
      );

      const icon = menuToggle.querySelector("span");

      if (icon) {
        icon.textContent = menuOpen ? "×" : "☰";
      } else {
        menuToggle.textContent = menuOpen ? "×" : "☰";
      }

      lockScroll("navigation", menuOpen);

      if (!menuOpen && restoreFocus) {
        menuToggle.focus({
          preventScroll: true
        });
      }
    }

    if (menuToggle && navigation) {
      menuToggle.addEventListener("click", () => {
        setMenu(!menuOpen);
      });

      mobile.addEventListener("change", () => {
        setMenu(false);
      });

      document.addEventListener("click", event => {
        if (
          menuOpen &&
          !navigation.contains(event.target) &&
          !menuToggle.contains(event.target)
        ) {
          setMenu(false);
        }
      });

      document.addEventListener("keydown", event => {
        if (event.key === "Escape" && menuOpen) {
          event.preventDefault();
          setMenu(false, true);
        }
      });

      header?.addEventListener("focusout", () => {
        requestAnimationFrame(() => {
          if (
            menuOpen &&
            !header.contains(document.activeElement)
          ) {
            setMenu(false);
          }
        });
      });
    }

    /* -----------------------------------------------------
       SAME-PAGE NAVIGATION

       Preserves modified clicks, downloads, external links,
       and links explicitly opening in another tab.
    ----------------------------------------------------- */

    document.addEventListener("click", event => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link = event.target.closest?.("a[href]");

      if (
        !link ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
      ) {
        return;
      }

      let url;

      try {
        url = new URL(
          link.href,
          window.location.href
        );
      } catch {
        return;
      }

      if (
        !url.hash ||
        url.origin !== location.origin ||
        url.pathname !== location.pathname ||
        url.search !== location.search
      ) {
        return;
      }

      let id;

      try {
        id = decodeURIComponent(
          url.hash.slice(1)
        );
      } catch {
        return;
      }

      const target = document.getElementById(id);

      if (!target) {
        return;
      }

      event.preventDefault();

      setMenu(false);

      if (commandDialog?.open) {
        commandDialog.close();
      }

      /*
       * Move keyboard focus to the destination without
       * introducing a permanent extra tab stop.
       */

      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");

        target.addEventListener(
          "blur",
          () => {
            target.removeAttribute("tabindex");
          },
          { once: true }
        );
      }

      target.focus({
        preventScroll: true
      });

      const offset =
        (header?.getBoundingClientRect().height || 72) + 24;

      const top = Math.max(
        0,
        target.getBoundingClientRect().top +
          window.scrollY -
          offset
      );

      try {
        if (location.hash !== url.hash) {
          history.pushState(
            null,
            "",
            url.hash
          );
        }
      } catch {
        /*
         * Scrolling still works if the browser does not
         * allow the history update.
         */
      }

      window.scrollTo({
        top,
        behavior: motion.matches
          ? "instant"
          : "smooth"
      });
    });

    /* -----------------------------------------------------
       COPYRIGHT YEAR
    ----------------------------------------------------- */

    $$("#current-year").forEach(node => {
      node.textContent = new Date().getFullYear();
    });

    /* -----------------------------------------------------
       SCROLL STATE

       Progress, navigation and back-to-top visibility share
       one animation-frame update.
    ----------------------------------------------------- */

    const sections = $$("main section[id]");

    const navAnchors = $$(
      '.nav-links a[href^="#"]'
    );

    const navColors = new Map(
      navAnchors.map(link => [
        link,
        link.style.color
      ])
    );

    function updateScroll() {
      scrollQueued = false;

      const y = Math.max(
        0,
        window.scrollY
      );

      const max = Math.max(
        0,
        document.documentElement.scrollHeight -
          window.innerHeight
      );

      if (progressBar) {
        const progress = max
          ? Math.min(y / max, 1)
          : 0;

        progressBar.style.transform =
          `scaleX(${progress})`;
      }

      if (backToTop) {
        show(
          backToTop,
          y > CONFIG.showBackToTopAfter,
          "inline-flex"
        );
      }

      if (header) {
        const scrolled = y > 20;

        if (
          header.dataset.scrolled !==
          String(scrolled)
        ) {
          header.dataset.scrolled =
            String(scrolled);

          header.style.boxShadow = scrolled
            ? "0 8px 28px rgba(0,0,0,0.18)"
            : "";
        }
      }

      let active = sections[0]?.id || "";

      const threshold =
        (header?.getBoundingClientRect().height || 72) +
        90;

      sections.forEach(section => {
        if (
          section.getBoundingClientRect().top <=
          threshold
        ) {
          active = section.id;
        }
      });

      if (max > 0 && y >= max - 8) {
        active =
          sections.at(-1)?.id ||
          active;
      }

      if (active !== lastActiveSection) {
        navAnchors.forEach(link => {
          const selected =
            link.getAttribute("href") ===
            `#${active}`;

          if (selected) {
            link.setAttribute(
              "aria-current",
              "location"
            );
          } else {
            link.removeAttribute(
              "aria-current"
            );
          }

          link.style.color = selected
            ? "var(--accent, #22d3ee)"
            : navColors.get(link);
        });

        lastActiveSection = active;
      }
    }

    function queueScroll() {
      if (scrollQueued) {
        return;
      }

      scrollQueued = true;

      requestAnimationFrame(updateScroll);
    }

    /* -----------------------------------------------------
       READING PROGRESS INDICATOR
    ----------------------------------------------------- */

    if (CONFIG.features.scrollProgress) {
      progressBar = element(
        "div",
        "reading-progress"
      );

      progressBar.setAttribute(
        "aria-hidden",
        "true"
      );

      style(progressBar, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "2px",
        background: "var(--accent, #22d3ee)",
        transform: "scaleX(0)",
        transformOrigin: "left",
        pointerEvents: "none",
        zIndex: "2000"
      });

      document.body.append(progressBar);
    }

    /* -----------------------------------------------------
       FLOATING BACK-TO-TOP CONTROL
    ----------------------------------------------------- */

    if (
      CONFIG.features.backToTop &&
      $("#home")
    ) {
      backToTop = element(
        "a",
        "button button-secondary",
        "↑"
      );

      backToTop.href = "#home";
      backToTop.title = "Back to top";

      backToTop.setAttribute(
        "aria-label",
        "Back to top"
      );

      style(backToTop, {
        position: "fixed",
        right: "20px",
        bottom: "20px",
        width: "46px",
        height: "46px",
        minHeight: "46px",
        padding: "0",
        zIndex: "900",
        boxShadow: "var(--shadow)"
      });

      show(backToTop, false);

      document.body.append(backToTop);
    }

    window.addEventListener(
      "scroll",
      queueScroll,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      queueScroll,
      { passive: true }
    );

    window.addEventListener(
      "load",
      queueScroll,
      { once: true }
    );

    if ("ResizeObserver" in window) {
      new ResizeObserver(queueScroll)
        .observe(document.body);
    }

    document.fonts?.ready
      .then(queueScroll)
      .catch(() => {});

    /* -----------------------------------------------------
       SCROLL REVEALS

       Elements are never permanently hidden. If animation
       APIs are unavailable, the content remains readable.
    ----------------------------------------------------- */

    if (
      CONFIG.features.scrollReveal &&
      "IntersectionObserver" in window
    ) {
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) {
              return;
            }

            observer.unobserve(entry.target);

            if (
              entry.target.contains(
                document.activeElement
              )
            ) {
              return;
            }

            animate(entry.target, [
              {
                opacity: 0,
                transform: "translateY(18px)"
              },
              {
                opacity: 1,
                transform: "translateY(0)"
              }
            ]);
          });
        },
        {
          threshold: 0.08
        }
      );

      $$(
        [
          ".hero-content",
          ".hero-image",
          ".section-heading",
          ".highlight-card",
          ".skill-card",
          ".project-card",
          ".achievement-card"
        ].join(", ")
      ).forEach(node => {
        observer.observe(node);
      });
    }

    /* -----------------------------------------------------
       PROJECT FILTERS & KEYWORD SEARCH
    ----------------------------------------------------- */

    if (CONFIG.features.projectTools) {
      const grid = $(".projects-grid");

      const cards = grid
        ? $$(".project-card", grid)
        : [];

      if (grid && cards.length) {
        if (!grid.id) {
          grid.id = "project-grid";
        }

        const toolbar = style(
          element("div", "project-toolbar"),
          {
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px"
          }
        );

        const filters = style(
          element("div", "hero-actions"),
          {
            margin: "0",
            gap: "8px",
            flexDirection: "row",
            flexWrap: "wrap"
          }
        );

        filters.setAttribute(
          "role",
          "group"
        );

        filters.setAttribute(
          "aria-label",
          "Filter projects by category"
        );

        const search = element(
          "input",
          "button button-secondary"
        );

        search.type = "search";
        search.placeholder =
          "Search projects or tools…";

        search.setAttribute(
          "aria-label",
          "Search projects by name, topic or technology"
        );

        search.setAttribute(
          "aria-controls",
          grid.id
        );

        style(search, {
          flex: "1 1 240px",
          minWidth: "0",
          width: "100%",
          fontWeight: "400",
          textAlign: "left"
        });

        const status = element(
          "p",
          "section-label"
        );

        status.setAttribute(
          "role",
          "status"
        );

        status.setAttribute(
          "aria-live",
          "polite"
        );

        status.setAttribute(
          "aria-atomic",
          "true"
        );

        style(status, {
          marginBottom: "20px",
          fontSize: "0.7rem"
        });

        const empty = element(
          "div",
          "highlight-card"
        );

        const emptyText = element(
          "p",
          "",
          "No matching projects. Try a different keyword or reset your filters."
        );

        const reset = element(
          "button",
          "button button-secondary",
          "Reset filters"
        );

        reset.type = "button";
        reset.style.marginTop = "16px";

        empty.append(
          emptyText,
          reset
        );

        show(empty, false);

        toolbar.append(
          filters,
          search
        );

        grid.before(
          toolbar,
          status
        );

        grid.after(empty);

        /*
         * Categories come from the existing project labels.
         * Adding another project with a matching category
         * automatically includes it in the relevant filter.
         */

        const records = cards.map(card => {
          const category = (
            $(".project-category", card)
              ?.textContent || ""
          ).toLowerCase();

          let group = "other";

          if (
            /machine learning|generative ai|computer vision/
              .test(category)
          ) {
            group = "ai";
          } else if (
            /data|analytics/.test(category)
          ) {
            group = "data";
          } else if (
            /fintech|web|software/.test(category)
          ) {
            group = "web";
          }

          return {
            card,
            group,
            text: card.textContent.toLowerCase(),
            display: card.style.display,
            visible: true
          };
        });

        const categories = [
          ["all", "All"],
          ["ai", "AI & ML"],
          ["data", "Data"],
          ["web", "Web & FinTech"],
          ["other", "Other"]
        ].filter(([key]) => {
          return (
            key === "all" ||
            records.some(record => {
              return record.group === key;
            })
          );
        });

        const buttons = new Map();

        let selected = "all";
        let debounce;

        function applyFilters(
          withAnimation = true
        ) {
          const terms = search.value
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean);

          let count = 0;

          records.forEach(record => {
            const matchesCategory =
              selected === "all" ||
              selected === record.group;

            const matchesSearch =
              terms.every(term => {
                return record.text.includes(term);
              });

            const matches =
              matchesCategory &&
              matchesSearch;

            const entering =
              matches &&
              !record.visible;

            record.visible = matches;
            record.card.hidden = !matches;

            record.card.style.display = matches
              ? record.display
              : "none";

            if (matches) {
              count++;
            }

            if (
              entering &&
              withAnimation
            ) {
              animate(
                record.card,
                [
                  { opacity: 0 },
                  { opacity: 1 }
                ],
                260
              );
            }
          });

          buttons.forEach((button, key) => {
            const active =
              selected === key;

            button.className =
              `button ${
                active
                  ? "button-primary"
                  : "button-secondary"
              }`;

            button.setAttribute(
              "aria-pressed",
              String(active)
            );
          });

          const noun = records.length === 1
            ? "project"
            : "projects";

          status.textContent =
            `${count} of ${records.length} ${noun} shown`;

          show(
            empty,
            count === 0
          );

          queueScroll();
        }

        categories.forEach(([key, label]) => {
          const count = key === "all"
            ? records.length
            : records.filter(record => {
                return record.group === key;
              }).length;

          const button = element(
            "button",
            "button button-secondary",
            `${label} (${count})`
          );

          button.type = "button";

          button.setAttribute(
            "aria-controls",
            grid.id
          );

          style(button, {
            minHeight: "38px",
            padding: "8px 12px",
            fontSize: "0.75rem",
            width: "auto"
          });

          button.addEventListener(
            "click",
            () => {
              clearTimeout(debounce);

              selected = key;

              applyFilters();
            }
          );

          buttons.set(
            key,
            button
          );

          filters.append(button);
        });

        search.addEventListener(
          "input",
          () => {
            clearTimeout(debounce);

            debounce = setTimeout(
              applyFilters,
              CONFIG.searchDelay
            );
          }
        );

        search.addEventListener(
          "keydown",
          event => {
            if (
              event.key === "Escape" &&
              search.value
            ) {
              event.preventDefault();

              clearTimeout(debounce);

              search.value = "";

              applyFilters();
            }
          }
        );

        reset.addEventListener(
          "click",
          () => {
            clearTimeout(debounce);

            selected = "all";
            search.value = "";

            applyFilters();

            search.focus({
              preventScroll: true
            });
          }
        );

        applyFilters(false);
      }
    }

    /* -----------------------------------------------------
       NOTIFICATIONS
    ----------------------------------------------------- */

    const toast = style(
      element("div", "highlight-card"),
      {
        position: "fixed",
        left: "50%",
        bottom: "80px",
        transform: "translateX(-50%)",
        width: "max-content",
        maxWidth: "calc(100vw - 32px)",
        padding: "12px 18px",
        zIndex: "3000",
        pointerEvents: "none",
        fontSize: "0.85rem",
        textAlign: "center"
      }
    );

    toast.setAttribute(
      "role",
      "status"
    );

    toast.setAttribute(
      "aria-live",
      "polite"
    );

    toast.setAttribute(
      "aria-atomic",
      "true"
    );

    show(toast, false);

    document.body.append(toast);

    let toastTimer;

    function notify(message) {
      clearTimeout(toastTimer);

      toast.textContent = message;

      show(toast, true);

      animate(
        toast,
        [
          { opacity: 0 },
          { opacity: 1 }
        ],
        180
      );

      toastTimer = setTimeout(
        () => {
          show(toast, false);
        },
        3200
      );
    }

    /* -----------------------------------------------------
       CLIPBOARD SUPPORT

       Uses the Clipboard API first, with a fallback for
       contexts where that API is unavailable.
    ----------------------------------------------------- */

    async function copyText(text) {
      try {
        if (
          !navigator.clipboard?.writeText
        ) {
          throw new Error(
            "Clipboard unavailable"
          );
        }

        await navigator.clipboard.writeText(text);

        return true;
      } catch {
        const previous =
          document.activeElement;

        const field = style(
          element("textarea"),
          {
            position: "fixed",
            left: "-9999px",
            top: "0",
            opacity: "0"
          }
        );

        field.value = text;
        field.readOnly = true;

        field.setAttribute(
          "aria-label",
          "Email address to copy"
        );

        document.body.append(field);

        field.select();

        let copied = false;

        try {
          copied =
            document.execCommand("copy");
        } catch {
          copied = false;
        }

        field.remove();

        previous?.focus({
          preventScroll: true
        });

        return copied;
      }
    }

    /* -----------------------------------------------------
       COPY EMAIL BUTTON
    ----------------------------------------------------- */

    if (
      CONFIG.features.copyEmail &&
      email &&
      $(".contact-actions")
    ) {
      const button = element(
        "button",
        "button button-secondary",
        "Copy Email"
      );

      button.type = "button";

      button.setAttribute(
        "aria-label",
        `Copy email address: ${email}`
      );

      let labelTimer;

      button.addEventListener(
        "click",
        async () => {
          clearTimeout(labelTimer);

          button.disabled = true;

          button.setAttribute(
            "aria-busy",
            "true"
          );

          try {
            const copied =
              await copyText(email);

            button.textContent = copied
              ? "Copied ✓"
              : "Copy Email";

            notify(
              copied
                ? "Email address copied."
                : `Copy unavailable. Email: ${email}`
            );
          } finally {
            button.disabled = false;

            button.removeAttribute(
              "aria-busy"
            );

            labelTimer = setTimeout(
              () => {
                button.textContent =
                  "Copy Email";
              },
              1800
            );
          }
        }
      );

      $(".contact-actions").append(button);
    }

    /* -----------------------------------------------------
       COMMAND MENU

       Ctrl + K / Cmd + K
       Press / when outside a text field

       Uses a native dialog for modal focus handling.
    ----------------------------------------------------- */

    if (
      CONFIG.features.commandMenu &&
      typeof HTMLDialogElement !== "undefined" &&
      HTMLDialogElement.prototype.showModal
    ) {
      const seen = new Set();

      const commands = $$(
        [
          ".nav-links a",
          ".project-actions a",
          ".hero-links a",
          ".contact-actions a"
        ].join(", ")
      )
        .filter(link => {
          if (
            !link.getAttribute("href") ||
            seen.has(link.href)
          ) {
            return false;
          }

          seen.add(link.href);

          return true;
        })
        .map(link => {
          const project =
            link.closest(".project-card");

          const label = project
            ? $("h3", project)
                ?.textContent.trim()
            : link.textContent.trim();

          const category = project
            ? "Project"
            : link
                .getAttribute("href")
                .startsWith("#")
              ? "Section"
              : "Link";

          return {
            label,
            category,
            href: link.getAttribute("href"),
            target: link.target,
            rel: link.rel
          };
        });

      const isMac = /Mac|iPhone|iPad/.test(
        navigator.platform ||
        navigator.userAgent
      );

      const shortcut = isMac
        ? "⌘ K"
        : "Ctrl K";

      const trigger = element(
        "button",
        "button button-secondary",
        `Quick navigation · ${shortcut}`
      );

      trigger.type = "button";

      trigger.setAttribute(
        "aria-haspopup",
        "dialog"
      );

      trigger.setAttribute(
        "aria-controls",
        "portfolio-command-menu"
      );

      trigger.setAttribute(
        "aria-expanded",
        "false"
      );

      style(trigger, {
        minHeight: "32px",
        padding: "5px 10px",
        fontSize: "0.72rem",
        fontFamily: "var(--font-mono, monospace)"
      });

      (
        $(".hero-links") ||
        $(".hero-actions") ||
        document.body
      ).append(trigger);

      commandDialog = element(
        "dialog",
        "highlight-card"
      );

      commandDialog.id =
        "portfolio-command-menu";

      commandDialog.setAttribute(
        "aria-labelledby",
        "command-menu-title"
      );

      style(commandDialog, {
        width: "min(600px, calc(100vw - 32px))",
        maxWidth: "600px",
        maxHeight: "80svh",
        margin: "min(14vh, 100px) auto auto",
        padding: "20px",
        overflowY: "auto",
        color: "var(--text, #f1f5f9)",
        boxShadow:
          "0 0 0 100vmax rgba(0,0,0,0.65), " +
          "0 28px 90px rgba(0,0,0,0.5)"
      });

      const headingRow = style(
        element("div"),
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "16px"
        }
      );

      const heading = element(
        "h2",
        "",
        "Jump to anything"
      );

      heading.id =
        "command-menu-title";

      style(heading, {
        margin: "0",
        fontSize: "1.15rem",
        letterSpacing: "-0.03em"
      });

      const close = element(
        "button",
        "button button-secondary",
        "Esc"
      );

      close.type = "button";

      close.setAttribute(
        "aria-label",
        "Close quick navigation"
      );

      style(close, {
        minHeight: "30px",
        padding: "4px 8px",
        fontSize: "0.7rem"
      });

      headingRow.append(
        heading,
        close
      );

      const search = element(
        "input",
        "button button-secondary"
      );

      search.type = "search";

      search.placeholder =
        "Search sections, projects and links…";

      search.setAttribute(
        "aria-label",
        "Search quick navigation"
      );

      search.setAttribute(
        "aria-describedby",
        "command-menu-help"
      );

      search.autocomplete = "off";
      search.autofocus = true;

      style(search, {
        width: "100%",
        minWidth: "0",
        fontWeight: "400",
        marginBottom: "12px"
      });

      const results = element("ul");

      results.setAttribute(
        "aria-label",
        "Navigation results"
      );

      const help = element(
        "p",
        "",
        "Type to search · ↓ to browse · Enter to open · Esc to close"
      );

      help.id =
        "command-menu-help";

      style(help, {
        margin: "16px 0 0",
        color: "var(--muted, #9ba8b8)",
        fontSize: "0.72rem"
      });

      commandDialog.append(
        headingRow,
        search,
        results,
        help
      );

      document.body.append(commandDialog);

      function renderCommands() {
        const terms = search.value
          .toLowerCase()
          .trim()
          .split(/\s+/)
          .filter(Boolean);

        const matches = commands.filter(
          command => {
            const searchable =
              `${command.label} ${command.category}`
                .toLowerCase();

            return terms.every(term => {
              return searchable.includes(term);
            });
          }
        );

        results.replaceChildren();

        matches.forEach(command => {
          const item = element("li");

          const link = element(
            "a",
            "button button-secondary"
          );

          link.href = command.href;

          if (command.target) {
            link.target = command.target;
          }

          if (command.target === "_blank") {
            link.rel = "noopener noreferrer";
          } else if (command.rel) {
            link.rel = command.rel;
          }

          style(link, {
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            gap: "12px",
            padding: "11px 12px",
            marginBottom: "6px",
            textAlign: "left",
            fontSize: "0.82rem"
          });

          const label = element(
            "span",
            "",
            command.label
          );

          const category = element(
            "span",
            "",
            command.category
          );

          style(category, {
            color: "var(--muted, #9ba8b8)",
            fontSize: "0.7rem",
            flexShrink: "0"
          });

          link.append(
            label,
            category
          );

          link.addEventListener(
            "click",
            () => {
              commandDialog.close();
            }
          );

          item.append(link);
          results.append(item);
        });

        if (!matches.length) {
          const empty = element(
            "li",
            "",
            "No matching pages or projects."
          );

          style(empty, {
            padding: "16px 4px",
            color: "var(--muted, #9ba8b8)"
          });

          results.append(empty);
        }
      }

      function openCommands() {
        if (commandDialog.open) {
          return;
        }

        setMenu(false);

        search.value = "";

        renderCommands();

        commandDialog.showModal();

        lockScroll(
          "commands",
          true
        );

        trigger.setAttribute(
          "aria-expanded",
          "true"
        );

        search.focus({
          preventScroll: true
        });

        animate(
          commandDialog,
          [
            { opacity: 0 },
            { opacity: 1 }
          ],
          180
        );
      }

      trigger.addEventListener(
        "click",
        openCommands
      );

      close.addEventListener(
        "click",
        () => {
          commandDialog.close();
        }
      );

      commandDialog.addEventListener(
        "close",
        () => {
          lockScroll(
            "commands",
            false
          );

          trigger.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      );

      /* Close when clicking outside the dialog box. */

      commandDialog.addEventListener(
        "click",
        event => {
          if (
            event.target !== commandDialog
          ) {
            return;
          }

          const bounds =
            commandDialog.getBoundingClientRect();

          const outside =
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom;

          if (outside) {
            commandDialog.close();
          }
        }
      );

      search.addEventListener(
        "input",
        renderCommands
      );

      search.addEventListener(
        "keydown",
        event => {
          const links = $$(
            "a",
            results
          );

          if (
            event.key === "ArrowDown" &&
            links.length
          ) {
            event.preventDefault();

            links[0].focus();
          } else if (
            event.key === "Enter"
          ) {
            event.preventDefault();

            links[0]?.click();
          }
        }
      );

      results.addEventListener(
        "keydown",
        event => {
          const links = $$(
            "a",
            results
          );

          const index = links.indexOf(
            document.activeElement
          );

          if (index < 0) {
            return;
          }

          if (
            event.key === "ArrowDown"
          ) {
            event.preventDefault();

            links[
              Math.min(
                index + 1,
                links.length - 1
              )
            ].focus();
          } else if (
            event.key === "ArrowUp"
          ) {
            event.preventDefault();

            if (index === 0) {
              search.focus();
            } else {
              links[index - 1].focus();
            }
          }
        }
      );

      document.addEventListener(
        "keydown",
        event => {
          if (
            event.defaultPrevented ||
            event.isComposing
          ) {
            return;
          }

          const typing =
            event.target instanceof Element &&
            event.target.closest(
              [
                "input",
                "textarea",
                "select",
                '[contenteditable="true"]',
                '[role="textbox"]'
              ].join(", ")
            );

          const shortcutPressed =
            (event.metaKey || event.ctrlKey) &&
            !event.altKey &&
            !event.shiftKey &&
            event.key.toLowerCase() === "k";

          const slashPressed =
            event.key === "/" &&
            !typing &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.altKey;

          if (
            shortcutPressed ||
            (
              slashPressed &&
              !commandDialog.open
            )
          ) {
            event.preventDefault();

            if (commandDialog.open) {
              commandDialog.close();
            } else {
              openCommands();
            }
          }
        }
      );
    }

    /* -----------------------------------------------------
       CARD POINTER LIGHTING

       Restores the original background on pointer exit.
       Disabled for touch devices and reduced motion.
    ----------------------------------------------------- */

    if (CONFIG.features.cardGlow) {
      $$(
        [
          ".project-card",
          ".skill-card",
          ".highlight-card",
          ".achievement-card"
        ].join(", ")
      ).forEach(card => {
        if (
          card.closest("dialog") ||
          card === toast
        ) {
          return;
        }

        const background =
          card.style.background;

        let frame = 0;
        let pointer = null;

        function resetGlow() {
          cancelAnimationFrame(frame);

          frame = 0;
          pointer = null;

          card.style.background =
            background;
        }

        card.addEventListener(
          "pointermove",
          event => {
            if (
              !finePointer.matches ||
              motion.matches ||
              event.pointerType !== "mouse"
            ) {
              return;
            }

            pointer = {
              x: event.clientX,
              y: event.clientY
            };

            if (frame) {
              return;
            }

            frame = requestAnimationFrame(
              () => {
                frame = 0;

                if (!pointer) {
                  return;
                }

                const bounds =
                  card.getBoundingClientRect();

                const x =
                  pointer.x - bounds.left;

                const y =
                  pointer.y - bounds.top;

                card.style.background =
                  `radial-gradient(
                    340px circle at ${x}px ${y}px,
                    rgba(34,211,238,0.065),
                    transparent 72%
                  ), var(--card, #10161d)`;
              }
            );
          },
          {
            passive: true
          }
        );

        card.addEventListener(
          "pointerleave",
          resetGlow
        );

        card.addEventListener(
          "pointercancel",
          resetGlow
        );

        motion.addEventListener(
          "change",
          resetGlow
        );

        finePointer.addEventListener(
          "change",
          resetGlow
        );
      });
    }

    /* -----------------------------------------------------
       IMAGE FALLBACKS

       Preserves accessible image descriptions.
       Restores the image if it subsequently loads.
    ----------------------------------------------------- */

    if (CONFIG.features.imageFallbacks) {
      $$(
        ".profile-image, .project-image img"
      ).forEach(image => {
        let fallback;

        const originalDisplay =
          image.style.display;

        function recoverImage() {
          fallback?.remove();

          fallback = null;

          image.style.display =
            originalDisplay;

          queueScroll();
        }

        function replaceImage() {
          if (fallback) {
            return;
          }

          const portrait =
            image.classList.contains(
              "profile-image"
            );

          const title = $(
            "h3",
            image.closest(".project-card") ||
              image.parentElement
          )?.textContent.trim();

          fallback = element(
            "div",
            portrait
              ? "photo-placeholder"
              : "",
            portrait
              ? "CT"
              : title || "Project preview"
          );

          fallback.setAttribute(
            "role",
            "img"
          );

          fallback.setAttribute(
            "aria-label",
            `${image.alt || "Image"} — image unavailable`
          );

          if (portrait) {
            style(fallback, {
              fontSize: "3rem",
              letterSpacing: "-0.06em"
            });
          } else {
            style(fallback, {
              width: "100%",
              height: "100%",
              minHeight: "180px",
              display: "grid",
              placeItems: "center",
              padding: "24px",
              background:
                "var(--surface-raised, #161e27)",
              color:
                "var(--muted, #9ba8b8)",
              fontFamily:
                "var(--font-mono, monospace)",
              fontSize: "0.85rem",
              textAlign: "center"
            });
          }

          image.style.display = "none";

          image.after(fallback);

          queueScroll();
        }

        image.addEventListener(
          "error",
          replaceImage
        );

        image.addEventListener(
          "load",
          recoverImage
        );

        if (
          image.complete &&
          image.naturalWidth === 0
        ) {
          replaceImage();
        }
      });
    }

    queueScroll();
  }

  /* -------------------------------------------------------
     INITIALISATION
  ------------------------------------------------------- */

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      {
        once: true
      }
    );
  } else {
    boot();
  }
})();

/* ==========================================
   CINEMATIC SCROLL ENGINE
========================================== */

(() => {
  "use strict";

  function initCinema() {
    const root = document.documentElement;

    if (
      root.dataset.cinemaInitialized ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    root.dataset.cinemaInitialized = "true";

    const reduceMotion = matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const smallScreen = matchMedia(
      "(max-width: 720px)"
    );

    const hero = document.querySelector(".hero");

    const headings = [
      ...document.querySelectorAll(
        [
          ".hero h1",
          ".section-heading h2",
          ".contact-section h2"
        ].join(", ")
      )
    ];

    const reveals = [
      ...document.querySelectorAll(
        [
          ".hero-content > .eyebrow",
          ".hero-content > h2",
          ".hero-content > .hero-description",
          ".hero-content > .hero-actions",
          ".hero-content > .hero-links",
          ".hero-image",
          ".about-text",
          ".about-highlights > .highlight-card",
          ".skill-card",
          ".project-card",
          ".achievement-card",
          ".section-heading > .section-label",
          ".contact-content > p",
          ".contact-actions"
        ].join(", ")
      )
    ];

    const media = [
      ...document.querySelectorAll(".project-image")
    ];

    const targets = [
      ...new Set([
        ...headings,
        ...reveals
      ])
    ];

    let observer;
    let frame = 0;
    let enabled = false;

    const clamp = (value, min, max) => {
      return Math.min(
        max,
        Math.max(min, value)
      );
    };

    /* --------------------------------------
       SPLIT HEADINGS INTO ANIMATED WORDS

       Existing spans, links, line breaks and
       whitespace are preserved.
    -------------------------------------- */

    function wrapWords(heading) {
      const walker = document.createTreeWalker(
        heading,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const hasText = /\S/.test(
              node.textContent
            );

            const alreadyWrapped =
              node.parentElement.closest(".fx-word");

            return hasText && !alreadyWrapped
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          }
        }
      );

      const textNodes = [];

      while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
      }

      let index = 0;

      textNodes.forEach(node => {
        const fragment =
          document.createDocumentFragment();

        node.textContent
          .split(/(\s+)/)
          .forEach(part => {
            if (!part) {
              return;
            }

            if (/^\s+$/.test(part)) {
              fragment.append(
                document.createTextNode(part)
              );

              return;
            }

            const word =
              document.createElement("span");

            const inner =
              document.createElement("span");

            word.className = "fx-word";
            inner.className = "fx-word-inner";

            inner.textContent = part;

            inner.style.setProperty(
              "--fx-word-delay",
              `${Math.min(index++ * 55, 330)}ms`
            );

            word.append(inner);
            fragment.append(word);
          });

        node.replaceWith(fragment);
      });

      heading.classList.add("fx-heading");
    }

    headings.forEach(wrapWords);

    reveals.forEach(node => {
      node.classList.add("fx-reveal");
    });

    media.forEach(node => {
      node.classList.add("fx-project-media");
    });

    /* --------------------------------------
       STAGGER ENTRANCES

       Cards arrive in waves.
       Hero elements follow reading order.
    -------------------------------------- */

    document.querySelectorAll(
      [
        ".skills-grid",
        ".projects-grid",
        ".achievements-grid",
        ".about-highlights",
        ".hero-content"
      ].join(", ")
    ).forEach(group => {
      [...group.children]
        .filter(node => {
          return node.classList.contains(
            "fx-reveal"
          );
        })
        .forEach((node, index) => {
          const step =
            group.classList.contains("hero-content")
              ? index
              : index % 3;

          node.style.setProperty(
            "--fx-delay",
            `${Math.min(step, 3) * 90}ms`
          );
        });
    });

    /* --------------------------------------
       SCROLL PARALLAX

       Layout is measured before styles are
       written to avoid unnecessary reflows.
    -------------------------------------- */

    function updateParallax() {
      frame = 0;

      if (!enabled || document.hidden) {
        return;
      }

      const viewport = window.innerHeight;

      const strength = smallScreen.matches
        ? 0.4
        : 1;

      const heroRect =
        hero?.getBoundingClientRect();

      const imageUpdates = media
        .map(node => {
          const bounds =
            node.getBoundingClientRect();

          if (
            bounds.bottom < 0 ||
            bounds.top > viewport
          ) {
            return null;
          }

          const distance =
            viewport / 2 -
            bounds.top -
            bounds.height / 2;

          const y =
            clamp(
              distance / viewport * 36,
              -18,
              18
            ) * strength;

          return {
            node,
            y
          };
        })
        .filter(Boolean);

      if (
        heroRect &&
        heroRect.bottom > 0
      ) {
        const progress = clamp(
          -heroRect.top /
            Math.max(heroRect.height * 0.8, 1),
          0,
          1
        );

        root.style.setProperty(
          "--fx-hero-y",
          `${progress * 72 * strength}px`
        );

        root.style.setProperty(
          "--fx-hero-opacity",
          String(1 - progress * 0.65)
        );

        root.style.setProperty(
          "--fx-portrait-y",
          `${progress * -52 * strength}px`
        );

        root.style.setProperty(
          "--fx-portrait-rotate",
          `${progress * -2 * strength}deg`
        );
      }

      imageUpdates.forEach(({ node, y }) => {
        node.style.setProperty(
          "--fx-image-y",
          `${y.toFixed(2)}px`
        );
      });
    }

    /* Run only when a scroll or layout change needs it. */

    function requestUpdate() {
      if (
        enabled &&
        !frame &&
        !document.hidden
      ) {
        frame = requestAnimationFrame(
          updateParallax
        );
      }
    }

    /* --------------------------------------
       REVEAL OBSERVER & MOTION PREFERENCES
    -------------------------------------- */

    function setMotion() {
      observer?.disconnect();

      cancelAnimationFrame(frame);

      frame = 0;
      enabled = !reduceMotion.matches;

      if (!enabled) {
        root.classList.remove("fx-ready");

        targets.forEach(node => {
          node.classList.add("fx-visible");
        });

        return;
      }

      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add(
              "fx-visible"
            );

            observer.unobserve(
              entry.target
            );
          });
        },
        {
          threshold: 0.1,
          rootMargin: "0px 0px -24px 0px"
        }
      );

      targets.forEach(node => {
        /*
         * Keep content above a restored scroll
         * position visible when revisiting a page.
         */

        if (
          node.getBoundingClientRect().bottom <= 0
        ) {
          node.classList.add("fx-visible");
        }

        if (
          !node.classList.contains("fx-visible")
        ) {
          observer.observe(node);
        }
      });

      root.classList.add("fx-ready");

      requestUpdate();
    }

    /* Immediately reveal anything reached by keyboard. */

    document.addEventListener(
      "focusin",
      event => {
        event.target
          .closest?.(".fx-reveal, .fx-heading")
          ?.classList.add("fx-visible");
      }
    );

    window.addEventListener(
      "scroll",
      requestUpdate,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      requestUpdate,
      { passive: true }
    );

    window.addEventListener(
      "load",
      requestUpdate,
      { once: true }
    );

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
        } else {
          requestUpdate();
        }
      }
    );

    reduceMotion.addEventListener(
      "change",
      setMotion
    );

    if ("ResizeObserver" in window) {
      new ResizeObserver(requestUpdate)
        .observe(document.body);
    }

    setMotion();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initCinema,
      { once: true }
    );
  } else {
    initCinema();
  }
})();