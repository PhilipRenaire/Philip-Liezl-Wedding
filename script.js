const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
  });
});

const weddingDate = new Date('2026-10-19T15:00:00+08:00');

function updateCountdown() {
  const now = new Date();
  const distance = weddingDate - now;

  if (distance <= 0) {
    document.getElementById('days').textContent = '0';
    document.getElementById('hours').textContent = '0';
    document.getElementById('minutes').textContent = '0';
    document.getElementById('seconds').textContent = '0';
    return;
  }

  document.getElementById('days').textContent = Math.floor(distance / (1000 * 60 * 60 * 24));
  document.getElementById('hours').textContent = Math.floor((distance / (1000 * 60 * 60)) % 24);
  document.getElementById('minutes').textContent = Math.floor((distance / (1000 * 60)) % 60);
  document.getElementById('seconds').textContent = Math.floor((distance / 1000) % 60);
}

updateCountdown();
setInterval(updateCountdown, 1000);

// Sample seating data. Do not place private guest data in a public repository.
const seatingData = [
  { name: 'Sample Guest', table: 'Table 1', group: 'Family' },
  { name: 'Maria Santos', table: 'Table 2', group: 'Relatives' },
  { name: 'Juan Dela Cruz', table: 'Table 3', group: 'Friends' }
];

const searchInput = document.getElementById('seatSearch');
const searchButton = document.getElementById('searchButton');
const result = document.getElementById('seatResult');

function normalize(value) {
  return value.toLowerCase().trim();
}

function searchSeat() {
  const query = normalize(searchInput.value);

  if (!query) {
    result.textContent = 'Please enter your name to check your table assignment.';
    return;
  }

  const guest = seatingData.find((item) => normalize(item.name).includes(query));

  if (!guest) {
    result.textContent = 'We could not find that name yet. Please check your spelling or contact the wedding coordinator.';
    return;
  }

  result.innerHTML = `<strong>${guest.name}</strong><br>You are assigned to <strong>${guest.table}</strong><br><span>${guest.group}</span>`;
}

searchButton.addEventListener('click', searchSeat);
searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    searchSeat();
  }
});
