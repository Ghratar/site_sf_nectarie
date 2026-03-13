/* ---------------------------
   SMOOTH SCROLL REVEAL
---------------------------- */

const reveals = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target); // 🔑 only once
      }
    });
  },
  {
    threshold: 0.15,
    rootMargin: "0px 0px -80px 0px"
  }
);

reveals.forEach(el => observer.observe(el));



/* ---------------------------
   TEAM CAROUSEL — WITH FADE + AUTOPLAY
---------------------------- */

const teamMembers = [
  { name: "Dr. Silvia Mihaela Ilie", role: "Medic Oncolog / Fondator" },
  { name: "Rodica Grancea", role: "Economist / Fondator" },
  { name: "Alis Ilie", role: "Biolog" },
  { name: "Octavia Voiculescu", role: "Contabil" }
];
const collaborators = [
  { name: "Narcisa Diana Opriș", role: "Farmacist" },
  { name: "Dr. Olimpia Moldoveanu", role: "Medic Recuperare" },
  { name: "Dr. Lucia Neagoe", role: "Psiholog" },
  { name: "Dragoș Marineață", role: "Preot" },
  { name: "Alexandru Ilie", role: "IT" }
];

let currentColabIndex = 0;

const colabNameEl = document.getElementById("colab-name");
const colabRoleEl = document.getElementById("colab-role");
const colabCard = document.querySelector(".collaborator-member");

function changeCollaborator(newIndex) {
  colabCard.classList.add("fade-out");

  setTimeout(() => {
    currentColabIndex = newIndex;
    colabNameEl.textContent = collaborators[currentColabIndex].name;
    colabRoleEl.textContent = collaborators[currentColabIndex].role;

    colabCard.classList.remove("fade-out");
  }, 500);
}

document.querySelector(".colab-prev").addEventListener("click", () => {
  changeCollaborator((currentColabIndex - 1 + collaborators.length) % collaborators.length);
  restartColabAutoplay();
});

document.querySelector(".colab-next").addEventListener("click", () => {
  changeCollaborator((currentColabIndex + 1) % collaborators.length);
  restartColabAutoplay();
});

let colabAutoplay = setInterval(() => {
  changeCollaborator((currentColabIndex + 1) % collaborators.length);
}, 6000);

function restartColabAutoplay() {
  clearInterval(colabAutoplay);
  colabAutoplay = setInterval(() => {
    changeCollaborator((currentColabIndex + 1) % collaborators.length);
  }, 6000);
}

colabNameEl.textContent = collaborators[0].name;
colabRoleEl.textContent = collaborators[0].role;

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
}, 6000);

// Stop & restart autoplay on user interaction
function restartAutoplay() {
  clearInterval(autoplay);
  autoplay = setInterval(() => {
    changeMember((currentIndex + 1) % teamMembers.length);
  }, 6000);
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

    const headerOffset = 100;
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

/* ---------------------------
   GALLERY CAROUSEL
---------------------------- */

const galleryItems = [
  {
    title: "Sărbători împreună",
    image: "SARBATORI-IMPREUNA.png"
  },
  {
    title: "Pelerinaj",
    image: "PELERINAJ.png"
  },
  {
    title: "Grup de suport",
    image: "GRUP-DE-SUPORT.png"
  },
  {
    title: "Colaborări",
    image: "COLABORARI.jpeg"
  }
];

let currentGalleryIndex = 0;

const galleryTitleEl = document.getElementById("gallery-title");
const galleryImageEl = document.getElementById("gallery-image");

function changeGalleryItem(newIndex) {
  galleryTitleEl.classList.add("fade-out");
  galleryImageEl.classList.add("fade-out");

  setTimeout(() => {
    currentGalleryIndex = newIndex;

    galleryTitleEl.textContent = galleryItems[currentGalleryIndex].title;
    galleryImageEl.src = galleryItems[currentGalleryIndex].image;
    galleryImageEl.alt = galleryItems[currentGalleryIndex].title;

    galleryTitleEl.classList.remove("fade-out");
    galleryImageEl.classList.remove("fade-out");
  }, 400);
}

document.querySelector(".gallery-prev").addEventListener("click", () => {
  changeGalleryItem((currentGalleryIndex - 1 + galleryItems.length) % galleryItems.length);
  restartGalleryAutoplay();
});

document.querySelector(".gallery-next").addEventListener("click", () => {
  changeGalleryItem((currentGalleryIndex + 1) % galleryItems.length);
  restartGalleryAutoplay();
});

let galleryAutoplay = setInterval(() => {
  changeGalleryItem((currentGalleryIndex + 1) % galleryItems.length);
}, 6000);

function restartGalleryAutoplay() {
  clearInterval(galleryAutoplay);
  galleryAutoplay = setInterval(() => {
    changeGalleryItem((currentGalleryIndex + 1) % galleryItems.length);
  }, 6000);
}

galleryTitleEl.textContent = galleryItems[0].title;
galleryImageEl.src = galleryItems[0].image;
galleryImageEl.alt = galleryItems[0].title;

// LIGHTBOX GALERIE

const galleryImages = document.querySelectorAll(".gallery-carousel img");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.querySelector(".lightbox-img");
const closeLightbox = document.querySelector(".lightbox-close");

galleryImages.forEach(img => {
  img.addEventListener("click", () => {
    lightbox.style.display = "flex";
    lightboxImg.src = img.src;
  });
});

closeLightbox.addEventListener("click", () => {
  lightbox.style.display = "none";
});

lightbox.addEventListener("click", (e) => {
  if (e.target !== lightboxImg) {
    lightbox.style.display = "none";
  }
});

/* ---------------------------
   BACK TO TOP BUTTON
---------------------------- */

const backToTopBtn = document.getElementById("back-to-top");

if (backToTopBtn) {
  backToTopBtn.addEventListener("click", () => {
    smoothScrollTo(0, 800);
  });
}