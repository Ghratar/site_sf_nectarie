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
   SMOOTH NAV SCROLL (NO SNAP)
---------------------------- */

document.querySelectorAll('nav a[href^="#"]').forEach(link => {
  link.addEventListener("click", function (e) {
    e.preventDefault();

    const targetId = this.getAttribute("href");
    const target = document.querySelector(targetId);
    if (!target) return;

    const headerOffset = 140;
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition =
      elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });

    // Stops the snap
    history.pushState(null, "", targetId);
  });
});


