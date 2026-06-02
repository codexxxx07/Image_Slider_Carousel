/**
 * 2D Image Slider — glassmorphism UI, infinite horizontal loop
 *
 * - Slides in a flex row; track moves with translateX()
 * - Clone first/last for seamless infinite loop
 * - Auto-play (setInterval), pause on hover
 */

/* ——— Full-page skeleton loader (overlay; auto-dismiss 2–3s) ——— */

const SKELETON_MIN_MS = 2000;
const SKELETON_MAX_MS = 3000;
const SKELETON_FADE_MS = 500;

function initSkeletonLoader() {
  const loader = document.getElementById("skeleton-loader");
  if (!loader) return;

  const delay =
    SKELETON_MIN_MS +
    Math.random() * (SKELETON_MAX_MS - SKELETON_MIN_MS);

  let removed = false;
  let transitionHandler = null;

  const removeLoader = () => {
    if (removed) return;
    removed = true;
    
    // Clean up event listener to prevent memory leak
    if (transitionHandler) {
      loader.removeEventListener("transitionend", transitionHandler);
      transitionHandler = null;
    }
    
    loader.setAttribute("aria-busy", "false");
    loader.remove();
    document.body.classList.remove("skeleton-loading", "skeleton-revealed");
  };

  const reveal = () => {
    loader.classList.add("skeleton-loader--exit");
    document.body.classList.remove("skeleton-loading");
    document.body.classList.add("skeleton-revealed");

    transitionHandler = (e) => {
      if (e.target !== loader || e.propertyName !== "opacity") return;
      removeLoader();
    };
    
    loader.addEventListener("transitionend", transitionHandler);

    window.setTimeout(removeLoader, SKELETON_FADE_MS + 150);
  };

  window.setTimeout(reveal, delay);
}

initSkeletonLoader();

/* ——— Light / Dark theme (session only; always light on reload) ——— */

function initTheme() {
  const toggle = document.getElementById("theme-toggle");
  const icon = document.getElementById("theme-icon");
  if (!toggle || !icon) return;

  document.documentElement.classList.remove("dark");

  const syncIcon = () => {
    const isDark = document.documentElement.classList.contains("dark");
    icon.textContent = isDark ? "☀️" : "🌙";
    toggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
  };

  syncIcon();

  toggle.addEventListener("click", () => {
    icon.style.transform = "scale(0.75) rotate(-90deg)";
    icon.style.opacity = "0";
    window.setTimeout(() => {
      document.documentElement.classList.toggle("dark");
      syncIcon();
      icon.style.transform = "scale(1) rotate(0deg)";
      icon.style.opacity = "1";
    }, 150);
  });
}

const SLIDES = [
  {
    src: "assets/Miles Morales.jpg",
    alt: "Miles Morales",
    title: "Miles Morales",
    description: "A young Spider-Man with unique bio-electric powers and invisibility, balancing hero life with his identity.",
    tag: "Spidy Verse",
  },
  {
    src: "assets/Gwen Stacy.jpg",
    alt: "Gwen Stacy",
    title: "Gwen Stacy",
    description: "A skilled and confident Spider-Woman from another universe, known for her agility and drum-playing passion.",
    tag: "Spidy Verse",
  },
  {
    src: "assets/Pavitra Prabhakar.jpg",
    alt: "Pavitra Prabhakar",
    title: "Pavitra Prabhakar",
    description: "ndia’s Spider-Man who mixes desi swag with heroism while protecting Mumbattan.",
    tag: "Spidy Verse",
  },
  {
    src: "assets/Spider Noir.jpg",
    alt: "Spider Noir",
    title: "Spider Noir",
    description: "A dark, 1930s-style Spider-Man who fights crime with a gritty, detective-like approach.",
    tag: "Spidy Verse",
  },
  {
    src: "assets/Penny Parkar.jpg",
    alt: "Penny Parkar",
    title: "Penny Parkar",
    description: "A genius young girl who pilots a high-tech spider robot (SP//dr), blending brains with futuristic hero action.",
    tag: "Spidy Verse",
  },
  {
    src: "assets/Miguel o Hara.jpg",
    alt: "Miguel O'Hara",
    title: "Miguel O'Hara",
    description: "A futuristic Spider-Man with enhanced strength and tech-based abilities from the year 2099.",
    tag: "Spidy Verse",
  },
  {
    src: "assets/Dog Spiderman.jpg",
    alt: "Spider Dog",
    title: "Spider Dog",
    description: "A cute and loyal dog with Spider-like abilities, bringing both action and humor.",
    tag: "Spidy Verse",
  },
];

const CONFIG = {
  autoplayMs: 3500,
  transition: "transform 0.5s ease-in-out",
};

let carouselEl;
let viewportEl;
let trackEl;
let prevBtn;
let nextBtn;
let dotsEl;

let realCount;
/** Index in track (includes leading + trailing clones) */
let currentIndex = 1;
let isPaused = false;
let autoplayTimer = null;
let resizeTimer = null;
let isTransitioning = false;
let cachedTrackGap = null;

// Store event listeners for cleanup
const eventListeners = [];

// Rate limiting: minimum time between navigation actions (ms)
const NAVIGATION_THROTTLE_MS = 300;
let lastNavigationTime = 0;

function getTrackGap() {
  // Cache the gap value to avoid expensive computed style calls
  if (cachedTrackGap !== null) return cachedTrackGap;
  
  const gap = getComputedStyle(trackEl).gap;
  cachedTrackGap = Number.parseFloat(gap) || 16;
  return cachedTrackGap;
}

// Invalidate cache on resize
function invalidateTrackGapCache() {
  cachedTrackGap = null;
}

// XSS-safe HTML escaping
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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

    // Use textContent for security, build DOM safely
    const inner = document.createElement("div");
    inner.className = "slide-inner scale-90 opacity-70 rounded-3xl border border-white/30 bg-white/10 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl transition duration-500 ease-in-out hover:scale-105 hover:shadow-2xl";
    
    const imgContainer = document.createElement("div");
    imgContainer.className = "overflow-hidden rounded-xl";
    
    const img = document.createElement("img");
    img.src = slide.src;
    img.alt = escapeHtml(slide.alt);
    img.loading = i === 1 ? "eager" : "lazy"; // Preload first real slide
    img.className = "block h-[160px] w-full rounded-xl object-cover sm:h-[220px] lg:h-[280px]";
    img.width = 900;
    img.height = 600;
    img.decoding = "async";
    
    // Add error handling for images
    img.onerror = function() {
      this.style.display = 'none';
      const fallback = document.createElement('div');
      fallback.className = 'flex items-center justify-center h-[160px] sm:h-[220px] lg:h-[280px] bg-gray-200 rounded-xl text-gray-500 text-sm';
      fallback.textContent = 'Image not available';
      imgContainer.appendChild(fallback);
    };
    
    imgContainer.appendChild(img);
    inner.appendChild(imgContainer);
    
    const content = document.createElement("div");
    content.className = "mt-2 px-2 pb-1";
    
    const tag = document.createElement("span");
    tag.className = "inline-block rounded-full bg-white/30 px-3 py-1 text-xs font-medium text-gray-600";
    tag.textContent = escapeHtml(slide.tag);
    content.appendChild(tag);
    
    const title = document.createElement("h3");
    title.className = "mt-2 text-xl font-semibold text-gray-800 sm:text-2xl";
    title.textContent = escapeHtml(slide.title);
    content.appendChild(title);
    
    const desc = document.createElement("p");
    desc.className = "mt-1 text-sm text-gray-500";
    desc.textContent = escapeHtml(slide.description);
    content.appendChild(desc);
    
    inner.appendChild(content);
    item.appendChild(inner);
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
    
    const clickHandler = () => goToRealIndex(i);
    btn.addEventListener("click", clickHandler);
    eventListeners.push({ element: btn, event: 'click', handler: clickHandler });
    
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
  // Rate limiting: prevent rapid navigation
  const now = Date.now();
  if (isTransitioning && now - lastNavigationTime < NAVIGATION_THROTTLE_MS) {
    return;
  }
  
  lastNavigationTime = now;
  isTransitioning = true;
  
  currentIndex = index;
  applyTransform(animate);
  updateSlideStates();
  updateDots();
  
  // Reset transition lock after animation completes
  if (animate) {
    setTimeout(() => {
      isTransitioning = false;
    }, 500);
  } else {
    isTransitioning = false;
  }
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

  try {
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
    isTransitioning = false;
  } catch (error) {
    console.error('Transition end error:', error);
    isTransitioning = false;
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
  // Store event listeners for cleanup
  const prevHandler = () => { try { prev(); } catch (e) { console.error('Prev button error:', e); } };
  const nextHandler = () => { try { next(); } catch (e) { console.error('Next button error:', e); } };
  const transitionHandler = onTransitionEnd;
  
  prevBtn.addEventListener("click", prevHandler);
  nextBtn.addEventListener("click", nextHandler);
  trackEl.addEventListener("transitionend", transitionHandler);
  
  eventListeners.push(
    { element: prevBtn, event: 'click', handler: prevHandler },
    { element: nextBtn, event: 'click', handler: nextHandler },
    { element: trackEl, event: 'transitionend', handler: transitionHandler }
  );

  carouselEl.addEventListener("mouseenter", () => {
    isPaused = true;
    stopAutoplay();
  });

  carouselEl.addEventListener("mouseleave", () => {
    isPaused = false;
    startAutoplay();
  });

  // Debounced resize handler
  const resizeHandler = () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      try {
        invalidateTrackGapCache();
        applyTransform(false);
        updateSlideStates();
      } catch (error) {
        console.error('Resize handler error:', error);
      }
    }, 150);
  };
  
  window.addEventListener("resize", resizeHandler, { passive: true });
  eventListeners.push({ element: window, event: 'resize', handler: resizeHandler });

  document.addEventListener("visibilitychange", () => {
    try {
      if (document.hidden) stopAutoplay();
      else if (!isPaused) startAutoplay();
    } catch (error) {
      console.error('Visibility change error:', error);
    }
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);
  eventListeners.push({ element: window, event: 'beforeunload', handler: cleanup });
}

function cleanup() {
  // Stop autoplay
  stopAutoplay();
  
  // Clear resize timer
  if (resizeTimer) {
    clearTimeout(resizeTimer);
    resizeTimer = null;
  }
  
  // Remove all stored event listeners
  eventListeners.forEach(({ element, event, handler }) => {
    try {
      element.removeEventListener(event, handler);
    } catch (e) {
      // Ignore errors during cleanup
    }
  });
  eventListeners.length = 0;
}

function initSlider() {
  try {
    carouselEl = document.getElementById("carousel");
    viewportEl = document.getElementById("viewport");
    trackEl = document.getElementById("track");
    prevBtn = document.getElementById("prev");
    nextBtn = document.getElementById("next");
    dotsEl = document.getElementById("dots");

    if (!carouselEl || !viewportEl || !trackEl || !prevBtn || !nextBtn || !dotsEl) {
      console.error("Slider elements not found. Check HTML ids.");
      return;
    }

    realCount = SLIDES.length;
    buildSlides();
    buildDots();
    goToTrackIndex(1, false);
    bindEvents();
    startAutoplay();
  } catch (error) {
    console.error('Slider initialization error:', error);
    // Attempt cleanup on error
    cleanup();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    initTheme();
    initSlider();
  } catch (error) {
    console.error('Initialization error:', error);
  }
});
