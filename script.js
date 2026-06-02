/**
 * 2D Image Slider — glassmorphism UI, infinite horizontal loop
 *
 * - Slides in a flex row; track moves with translateX()
 * - Clone first/last for seamless infinite loop
 * - Auto-play (setInterval), pause on hover
 */

/* ——— Light / Dark theme ——— */

function initTheme() {
  const toggle = document.getElementById("theme-toggle");
  const icon = document.getElementById("theme-icon");
  if (!toggle || !icon) return;

  const applyTheme = (isDark) => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
    icon.textContent = isDark ? "☀️" : "🌙";
    toggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
  };

  const saved = localStorage.getItem("theme");
  if (saved === "dark" || saved === "light") {
    applyTheme(saved === "dark");
  } else {
    applyTheme(document.documentElement.classList.contains("dark"));
  }

  toggle.addEventListener("click", () => {
    const nextDark = !document.documentElement.classList.contains("dark");
    icon.style.transform = "scale(0.75) rotate(-90deg)";
    icon.style.opacity = "0";
    window.setTimeout(() => {
      applyTheme(nextDark);
      icon.style.transform = "scale(1) rotate(0deg)";
      icon.style.opacity = "1";
    }, 150);
  });
}

initTheme();

const SLIDES = [
  {
    src: "https://picsum.photos/id/1015/900/600",
    alt: "Mountain lake",
    title: "Alpine Reflection",
    description: "Still waters mirror snow-capped peaks at dawn.",
    tag: "Nature",
  },
  {
    src: "https://picsum.photos/id/1025/900/600",
    alt: "Dog portrait",
    title: "Golden Companion",
    description: "Warm light and a loyal friend in the countryside.",
    tag: "Portrait",
  },
  {
    src: "https://picsum.photos/id/1039/900/600",
    alt: "Bridge and river",
    title: "River Crossing",
    description: "Stone arches span a quiet flow through the valley.",
    tag: "Travel",
  },
  {
    src: "https://picsum.photos/id/1043/900/600",
    alt: "Coastal cliffs",
    title: "Ocean Edge",
    description: "Dramatic cliffs meet the open sea under soft clouds.",
    tag: "Coast",
  },
  {
    src: "https://picsum.photos/id/1050/900/600",
    alt: "Foggy forest",
    title: "Misty Woodland",
    description: "Tall pines fade into gentle fog along the trail.",
    tag: "Nature",
  },
  {
    src: "https://picsum.photos/id/1060/900/600",
    alt: "Desert dunes",
    title: "Sand Horizons",
    description: "Rolling dunes stretch under a clear desert sky.",
    tag: "Desert",
  },
  {
    src: "https://picsum.photos/id/1069/900/600",
    alt: "City skyline",
    title: "Urban Skyline",
    description: "Glass towers rise above the evening city glow.",
    tag: "City",
  },
];

const CONFIG = {
  autoplayMs: 3500,
  transition: "transform 0.5s ease-in-out",
};

const carouselEl = document.getElementById("carousel");
const viewportEl = document.getElementById("viewport");
const trackEl = document.getElementById("track");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const dotsEl = document.getElementById("dots");

if (!carouselEl || !viewportEl || !trackEl || !prevBtn || !nextBtn || !dotsEl) {
  throw new Error("Slider elements not found. Check HTML ids.");
}

const realCount = SLIDES.length;
/** Index in track (includes leading + trailing clones) */
let currentIndex = 1;
let isPaused = false;
let autoplayTimer = null;

function getTrackGap() {
  const gap = getComputedStyle(trackEl).gap;
  return Number.parseFloat(gap) || 16;
}

function buildSlides() {
  const ordered = [SLIDES[realCount - 1], ...SLIDES, SLIDES[0]];

  trackEl.innerHTML = "";
  ordered.forEach((slide, i) => {
    const item = document.createElement("article");
    item.setAttribute("role", "listitem");
    item.dataset.slideIndex = String(i);
    item.className =
      "slide shrink-0 w-[82%] max-w-[520px] sm:w-[75%] sm:max-w-[600px] lg:w-[68%] lg:max-w-[640px]";

    item.innerHTML = `
      <div class="slide-inner scale-90 opacity-70 rounded-3xl border border-white/30 bg-white/10 p-3 shadow-xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl transition duration-500 ease-in-out hover:scale-105 hover:shadow-2xl">
        <div class="overflow-hidden rounded-xl">
          <img
            src="${slide.src}"
            alt="${slide.alt}"
            loading="lazy"
            class="block h-[160px] w-full rounded-xl object-cover sm:h-[220px] lg:h-[280px]"
            width="900"
            height="600"
          />
        </div>
        <div class="mt-2 px-2 pb-1">
          <span class="inline-block rounded-full bg-white/30 px-3 py-1 text-xs font-medium text-gray-600">${slide.tag}</span>
          <h3 class="mt-2 text-xl font-semibold text-gray-800 sm:text-2xl">${slide.title}</h3>
          <p class="mt-1 text-sm text-gray-500">${slide.description}</p>
        </div>
      </div>
    `;

    trackEl.appendChild(item);
  });
}

function buildDots() {
  dotsEl.innerHTML = "";
  SLIDES.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-label", `Go to slide ${i + 1}`);
    btn.dataset.dotIndex = String(i);
    btn.className =
      "dot h-2 w-2 rounded-full bg-gray-300/80 transition-all duration-300 ease-in-out hover:bg-gray-400";
    btn.addEventListener("click", () => goToRealIndex(i));
    dotsEl.appendChild(btn);
  });
}

/** Map track index (with clones) to 0..realCount-1 */
function getRealIndex() {
  if (currentIndex === 0) return realCount - 1;
  if (currentIndex === realCount + 1) return 0;
  return currentIndex - 1;
}

function getOffsetForIndex(index) {
  const slides = trackEl.querySelectorAll(".slide");
  const viewportWidth = viewportEl.offsetWidth;
  const gap = getTrackGap();
  let offset = 0;

  for (let i = 0; i < index; i++) {
    offset += slides[i].offsetWidth + gap;
  }

  const active = slides[index];
  const centerAdjust = (viewportWidth - active.offsetWidth) / 2;
  return -(offset - centerAdjust);
}

function applyTransform(animate = true) {
  trackEl.style.transition = animate ? CONFIG.transition : "none";
  trackEl.style.transform = `translateX(${getOffsetForIndex(currentIndex)}px)`;
}

function updateSlideStates() {
  const slides = trackEl.querySelectorAll(".slide");
  slides.forEach((slide, i) => {
    const inner = slide.querySelector(".slide-inner");
    if (!inner) return;

    const isActive = i === currentIndex;
    inner.classList.toggle("scale-105", isActive);
    inner.classList.toggle("scale-90", !isActive);
    inner.classList.toggle("opacity-100", isActive);
    inner.classList.toggle("opacity-70", !isActive);
    inner.classList.toggle("brightness-105", isActive);
    inner.classList.toggle("brightness-95", !isActive);
    slide.setAttribute("aria-hidden", isActive ? "false" : "true");
  });
}

function updateDots() {
  const real = getRealIndex();
  dotsEl.querySelectorAll(".dot").forEach((dot, i) => {
    const active = i === real;
    dot.classList.toggle("h-2.5", active);
    dot.classList.toggle("w-6", active);
    dot.classList.toggle("bg-gray-700", active);
    dot.classList.toggle("h-2", !active);
    dot.classList.toggle("w-2", !active);
    dot.classList.toggle("bg-gray-300/80", !active);
    dot.setAttribute("aria-selected", active ? "true" : "false");
  });
}

function goToTrackIndex(index, animate = true) {
  currentIndex = index;
  applyTransform(animate);
  updateSlideStates();
  updateDots();
}

function goToRealIndex(realIndex) {
  goToTrackIndex(realIndex + 1, true);
  resetAutoplay();
}

function next() {
  goToTrackIndex(currentIndex + 1, true);
  resetAutoplay();
}

function prev() {
  goToTrackIndex(currentIndex - 1, true);
  resetAutoplay();
}

function onTransitionEnd(e) {
  if (e.target !== trackEl || e.propertyName !== "transform") return;

  if (currentIndex === 0) {
    currentIndex = realCount;
    applyTransform(false);
    updateSlideStates();
    updateDots();
  } else if (currentIndex === realCount + 1) {
    currentIndex = 1;
    applyTransform(false);
    updateSlideStates();
    updateDots();
  }
}

function startAutoplay() {
  stopAutoplay();
  autoplayTimer = setInterval(() => {
    if (!isPaused && !document.hidden) next();
  }, CONFIG.autoplayMs);
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}

function resetAutoplay() {
  if (!isPaused) startAutoplay();
}

function bindEvents() {
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);
  trackEl.addEventListener("transitionend", onTransitionEnd);

  carouselEl.addEventListener("mouseenter", () => {
    isPaused = true;
    stopAutoplay();
  });

  carouselEl.addEventListener("mouseleave", () => {
    isPaused = false;
    startAutoplay();
  });

  window.addEventListener(
    "resize",
    () => {
      applyTransform(false);
      updateSlideStates();
    },
    { passive: true }
  );

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else if (!isPaused) startAutoplay();
  });
}

function init() {
  buildSlides();
  buildDots();
  goToTrackIndex(1, false);
  bindEvents();
  startAutoplay();
}

init();
