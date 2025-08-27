(function HeaderController() {
  // Avatar hydration: prefers userAvatarUrl, else initials from userName, else 'U'
  function hydrateAvatar() {
    const target = document.getElementById("profileAvatar");
    if (!target) return;
    function initialsFromName() {
      const name = localStorage.getItem("userName") || "User";
      const initials =
        (name.trim().match(/\b\w/g) || []).slice(0, 2).join("").toUpperCase() ||
        "U";
      return initials;
    }

    target.innerHTML = "";
    const url = localStorage.getItem("userAvatarUrl");
    if (url) {
      const img = new Image();
      img.onload = () => {
        target.innerHTML = "";
        target.appendChild(img);
      };
      img.onerror = () => {
        target.textContent = initialsFromName();
      };
      img.src = url;
    } else {
      target.textContent = initialsFromName();
    }
  }

  // Clicking avatar -> profile page (adjust as needed)
  const profileBtn = document.getElementById("profileBtn");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }

  // Live update avatar when user changes photo/name in another tab
  window.addEventListener("storage", (e) => {
    if (e.key === "userAvatarUrl" || e.key === "userName") hydrateAvatar();
  });

  // Run
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hydrateAvatar, {
      once: true,
    });
  } else {
    hydrateAvatar();
  }
})();
