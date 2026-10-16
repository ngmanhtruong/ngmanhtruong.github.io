/**
 * Portfolio - Client-side interactions
 * Handles smooth scrolling, navigation highlighting, and interactive doodles.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initScrollSpy();
  initInteractiveCheckboxes();
  initBackToTop();
  initDoodleInteractions();
  initHashAnchor();
});

/**
 * Enhanced smooth scrolling with proper offset handling for section anchors.
 */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;
      
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update URL hash without abrupt jump
        history.pushState(null, '', targetId);
      }
    });
  });
}

/**
 * Highlights current active navigation item according to viewport scroll position.
 * Uses exact coordinate spy matching the design component specifications.
 */
function initScrollSpy() {
  const ids = ['about', 'skills', 'work', 'projects', 'school', 'contact'];
  const navLinks = document.querySelectorAll('.nav a');
  
  if (!navLinks.length) return;

  const updateSpy = () => {
    let cur = '';
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= 150) {
        cur = id;
      }
    }

    const de = document.documentElement;
    if (de && window.innerHeight + (window.scrollY || de.scrollTop) >= de.scrollHeight - 10 && cur) {
      cur = 'contact';
    }

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${cur}`) {
        link.classList.add('on');
        link.classList.add('active');
      } else {
        link.classList.remove('on');
        link.classList.remove('active');
      }
    });
  };

  let ticking = false;
  const requestTick = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateSpy();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  updateSpy();
}

/**
 * Makes the hand-drawn checklist items in "Things I enjoy" toggleable on click.
 */
function initInteractiveCheckboxes() {
  const items = document.querySelectorAll('.enjoy-item');
  
  items.forEach(item => {
    item.addEventListener('click', () => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        
        // Trigger subtle animation on toggle
        const checkSvg = item.querySelector('.check-box svg');
        if (checkSvg) {
          checkSvg.style.transform = checkbox.checked ? 'scale(1.15) rotate(-3deg)' : 'scale(0.95)';
          setTimeout(() => {
            checkSvg.style.transform = '';
          }, 200);
        }
      }
    });
  });
}

/**
 * Floating back-to-top button behavior.
 */
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 400) {
          btn.classList.add('visible');
        } else {
          btn.classList.remove('visible');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/**
 * Adds playful micro-interactions to doodle icons when clicked or hovered.
 */
function initDoodleInteractions() {
  const doodles = document.querySelectorAll('.dd:not(.abs)');
  
  doodles.forEach(doodle => {
    doodle.style.cursor = 'pointer';
    doodle.style.transition = 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
    
    doodle.addEventListener('mouseenter', () => {
      const randomRotate = (Math.random() * 20 - 10).toFixed(1);
      doodle.style.transform = `scale(1.2) rotate(${randomRotate}deg)`;
    });
    
    doodle.addEventListener('mouseleave', () => {
      doodle.style.transform = '';
    });
  });
}

/**
 * Lands exactly on the section named in the URL hash (e.g. coming from articles via
 * `index.html#contact`). Mobile Safari performs the native jump before web fonts finish loading
 * and the page above the target changes height, so it ends up in the wrong place. We re-align
 * once fonts/images are ready (instantly, without the smooth-scroll animation).
 */
function initHashAnchor() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;

  let userScrolled = false;
  const markScrolled = () => { userScrolled = true; };
  window.addEventListener('touchstart', markScrolled, { once: true, passive: true });
  window.addEventListener('wheel', markScrolled, { once: true, passive: true });

  const align = () => {
    const el = document.getElementById(id);
    if (!el || userScrolled) return;
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    el.scrollIntoView({ block: 'start' });
    html.style.scrollBehavior = prev;
  };

  const settle = () => { align(); setTimeout(align, 250); setTimeout(align, 800); };
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  if (document.readyState === 'complete') {
    fontsReady.then(settle);
  } else {
    window.addEventListener('load', () => fontsReady.then(settle), { once: true });
  }
}
