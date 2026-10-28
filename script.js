const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------- Mobile menu ---------- */
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");

if (menuToggle && mainNav) {
  const setMenu = (open) => {
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    mainNav.classList.toggle("is-open", open);
  };

  menuToggle.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });
  mainNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });
}

/* ---------- Header, scroll progress, WhatsApp visibility ---------- */
const siteHeader = document.querySelector(".site-header");
const progressBar = document.querySelector(".scroll-progress");
const waWrap = document.querySelector(".wa-wrap");
let lastScrollY = window.scrollY;
let ticking = false;

const onScroll = () => {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const menuOpen = mainNav && mainNav.classList.contains("is-open");

  if (siteHeader) {
    siteHeader.classList.toggle("is-scrolled", y > 24);
    siteHeader.classList.toggle("is-hidden", !menuOpen && y > 400 && y > lastScrollY + 2);
    if (y < lastScrollY - 2) siteHeader.classList.remove("is-hidden");
  }
  if (progressBar) progressBar.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : 0);
  if (waWrap) waWrap.classList.toggle("is-shown", y > window.innerHeight * 0.5);

  lastScrollY = y;
  ticking = false;
};

window.addEventListener("scroll", () => {
  if (!ticking) {
    window.requestAnimationFrame(onScroll);
    ticking = true;
  }
}, { passive: true });
onScroll();

/* ---------- Active section in nav ---------- */
const navLinks = mainNav ? [...mainNav.querySelectorAll('a[href^="#"]:not(.nav-cta)')] : [];
if ("IntersectionObserver" in window && navLinks.length) {
  const sections = document.querySelectorAll("main section[id]");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((section) => spy.observe(section));
}

/* ---------- Scroll reveal with stagger ---------- */
document.querySelectorAll(".stagger").forEach((group) => {
  [...group.children].forEach((child, index) => child.style.setProperty("--i", index));
});

const revealElements = document.querySelectorAll(".reveal, .steps");
if ("IntersectionObserver" in window && !reduceMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

/* ---------- Pointer effects (desktop only) ---------- */
if (finePointer && !reduceMotion) {
  // 3D tilt on images
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    const area = card.parentElement;
    area.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.classList.add("is-tilting");
      card.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
      card.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
      card.style.setProperty("--sx", `${x * 100}%`);
      card.style.setProperty("--sy", `${y * 100}%`);
    });
    area.addEventListener("pointerleave", () => {
      card.classList.remove("is-tilting");
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--rx", "0deg");
    });
  });

  // Spotlight that follows the cursor on cards
  document.querySelectorAll(".spotlight").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  });

  // Magnetic buttons
  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
    });
    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
    });
  });
}

/* ---------- Copy to clipboard + toast ---------- */
const toast = document.querySelector(".toast");
let toastTimer;
const showToast = (message) => {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-shown");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-shown"), 2200);
};

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = "¡Copiado!";
      button.classList.add("is-done");
      showToast(`Copiado: ${button.dataset.copy}`);
      setTimeout(() => {
        button.textContent = "Copiar";
        button.classList.remove("is-done");
      }, 1800);
    } catch {
      showToast("No se pudo copiar. Seleccioná el texto manualmente.");
    }
  });
});

/* ---------- WhatsApp invitation bubble ---------- */
const waBubble = document.querySelector(".wa-bubble");
const waClose = document.querySelector(".wa-bubble-close");
let bubbleDismissed = false;
try { bubbleDismissed = sessionStorage.getItem("vg-wa-bubble") === "1"; } catch {}

if (waBubble && !bubbleDismissed) {
  setTimeout(() => {
    if (waWrap && waWrap.classList.contains("is-shown")) waBubble.hidden = false;
    else if (waWrap) {
      const waitForButton = new MutationObserver(() => {
        if (waWrap.classList.contains("is-shown")) {
          waBubble.hidden = false;
          waitForButton.disconnect();
        }
      });
      waitForButton.observe(waWrap, { attributes: true, attributeFilter: ["class"] });
    }
  }, 9000);
}

if (waClose && waBubble) {
  waClose.addEventListener("click", () => {
    waBubble.hidden = true;
    try { sessionStorage.setItem("vg-wa-bubble", "1"); } catch {}
  });
}

/* ---------- Footer year ---------- */
const yearElement = document.querySelector("#current-year");
if (yearElement) yearElement.textContent = new Date().getFullYear();
