const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
  });
});

// Sample seating data. Replace this with your final guest list.
// For privacy, avoid uploading the full private guest list to a public GitHub repo.
const seatingData = [
  { name: "Philip Renaire Salvacion", table: "Couple's Table", group: "Bride & Groom" },
  { name: "Sample Guest", table: "Table 1", group: "Family" },
  { name: "Maria Santos", table: "Table 2", group: "Relatives" },
  { name: "Juan Dela Cruz", table: "Table 3", group: "Friends" }
];

const searchInput = document.getElementById("seatSearch");
const searchButton = document.getElementById("searchButton");
const result = document.getElementById("seatResult");

function normalize(value) {
  return value.toLowerCase().trim();
}

function searchSeat() {
  const query = normalize(searchInput.value);

  if (!query) {
    result.textContent = "Please enter your name to check your table assignment.";
    return;
  }

  const guest = seatingData.find((item) => normalize(item.name).includes(query));

  if (!guest) {
    result.innerHTML = "We couldn’t find that name yet. Please check your spelling or contact the wedding coordinator.";
    return;
  }

  result.innerHTML = `
    <strong>${guest.name}</strong><br>
    You are assigned to <strong>${guest.table}</strong><br>
    <span>${guest.group}</span>
  `;
}

searchButton.addEventListener("click", searchSeat);
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchSeat();
  }
});
