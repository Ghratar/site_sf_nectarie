/* ---------------------------
   SMOOTH SCROLL REVEAL
---------------------------- */

const reveals = document.querySelectorAll('.reveal');

function handleScroll() {
  for (let i = 0; i < reveals.length; i++) {
    const windowHeight = window.innerHeight;
    const elementTop = reveals[i].getBoundingClientRect().top;
    const revealPoint = 180;

    if (elementTop < windowHeight - revealPoint) {
      reveals[i].classList.add("active");
      reveals[i].classList.remove("reveal");
    }
  }
}

window.addEventListener("scroll", handleScroll);
handleScroll(); // run once on load



/* ---------------------------
   TEAM CAROUSEL — WITH FADE + AUTOPLAY
---------------------------- */

const teamMembers = [
  { name: "Dr. Silvia Mihaela Ilie", role: "Medic Oncolog / Fondatoare" },
  { name: "Rodica Grancea", role: "Economist / Fondatoare" },
  { name: "Octavia Voiculescu", role: "Contabilitate / Administrație" },
  { name: "Narcisa Opriș", role: "Farmacistă" },
  { name: "Alis Ilie", role: "Biolog (Laborator)" },
  { name: "Alexandru Ilie", role: "IT / Dezvoltare Web" }
];

let currentIndex = 0;

const nameEl = document.getElementById("team-name");
const roleEl = document.getElementById("team-role");
const card = document.querySelector(".team-member");

// Fade transition handler
function changeMember(newIndex) {
  card.classList.add("fade-out");

  setTimeout(() => {
    currentIndex = newIndex;
    nameEl.textContent = teamMembers[currentIndex].name;
    roleEl.textContent = teamMembers[currentIndex].role;

    card.classList.remove("fade-out");
  }, 500); // matches CSS transition time
}

// Buttons
document.querySelector(".prev").addEventListener("click", () => {
  changeMember((currentIndex - 1 + teamMembers.length) % teamMembers.length);
  restartAutoplay();
});

document.querySelector(".next").addEventListener("click", () => {
  changeMember((currentIndex + 1) % teamMembers.length);
  restartAutoplay();
});

// Autoplay every 3 seconds
let autoplay = setInterval(() => {
  changeMember((currentIndex + 1) % teamMembers.length);
}, 3000);

// Stop & restart autoplay on user interaction
function restartAutoplay() {
  clearInterval(autoplay);
  autoplay = setInterval(() => {
    changeMember((currentIndex + 1) % teamMembers.length);
  }, 3000);
}

// Initialize first member
nameEl.textContent = teamMembers[0].name;
roleEl.textContent = teamMembers[0].role;




/* ---------------------------
   OPTIONAL: Scroll to top on refresh
   (Fixes weird scroll positions)
---------------------------- */

window.onbeforeunload = function () {
  window.scrollTo(0, 0);
};


const progress = document.getElementById("scroll-progress");

window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const docHeight = document.body.scrollHeight - window.innerHeight;
  const percent = (scrollTop / docHeight) * 100;
  progress.style.width = percent + "%";
});

/* ---------------------------
   NAV TRANSPARENCY ON SCROLL
---------------------------- */

const header = document.querySelector("header");

window.addEventListener("scroll", () => {
  if (window.scrollY > 80) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

/* ---------------------------
   DEFINITIVE SMOOTH SCROLL
---------------------------- */

document.querySelectorAll("nav a[data-target]").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();

    const id = link.dataset.target;
    const target = document.getElementById(id);
    if (!target) return;

    const headerOffset = 140;
    const targetY =
      target.getBoundingClientRect().top +
      window.pageYOffset -
      headerOffset;

    smoothScrollTo(targetY, 900);

    history.pushState(null, "", `#${id}`);
  });
});

function smoothScrollTo(target, duration) {
  const start = window.pageYOffset;
  const distance = target - start;
  let startTime = null;

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);

    // easeInOutCubic
    const ease =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    window.scrollTo(0, start + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}



