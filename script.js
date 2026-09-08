const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });
}

const weddingDate = new Date('2026-10-19T15:00:00+08:00');
const countdownElements = {
  days: document.getElementById('days'),
  hours: document.getElementById('hours'),
  minutes: document.getElementById('minutes'),
  seconds: document.getElementById('seconds')
};

function updateCountdown() {
  if (!countdownElements.days || !countdownElements.hours || !countdownElements.minutes || !countdownElements.seconds) {
    return;
  }

  const now = new Date();
  const distance = weddingDate - now;

  if (distance <= 0) {
    countdownElements.days.textContent = '0';
    countdownElements.hours.textContent = '0';
    countdownElements.minutes.textContent = '0';
    countdownElements.seconds.textContent = '0';
    return;
  }

  countdownElements.days.textContent = Math.floor(distance / (1000 * 60 * 60 * 24));
  countdownElements.hours.textContent = Math.floor((distance / (1000 * 60 * 60)) % 24);
  countdownElements.minutes.textContent = Math.floor((distance / (1000 * 60)) % 60);
  countdownElements.seconds.textContent = Math.floor((distance / 1000) % 60);
}

updateCountdown();
if (countdownElements.days && countdownElements.hours && countdownElements.minutes && countdownElements.seconds) {
  setInterval(updateCountdown, 1000);
}

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
  return String(value || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function searchSeat() {
  if (!searchInput || !result) {
    return;
  }

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

if (searchButton && searchInput) {
  searchButton.addEventListener('click', searchSeat);
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      searchSeat();
    }
  });
}

// RSVP plus-one lookup. Keep the real guest list private in Google Sheets, not in this public file.
const rsvpSection = document.getElementById('rsvp');
const rsvpEndpoint = rsvpSection?.dataset.rsvpEndpoint?.trim() || '';

const rsvpLookupForm = document.getElementById('rsvpLookupForm');
const rsvpDetailsForm = document.getElementById('rsvpDetailsForm');
const rsvpStatus = document.getElementById('rsvpStatus');
const guestNameInput = document.getElementById('guestName');
const inviteCodeInput = document.getElementById('inviteCode');
const guestGreeting = document.getElementById('guestGreeting');
const plusOneBlock = document.getElementById('plusOneBlock');
const bringingPlusOne = document.getElementById('bringingPlusOne');
const plusOneName = document.getElementById('plusOneName');
const resetRsvpButton = document.getElementById('resetRsvpButton');

const matchedGuestName = document.getElementById('matchedGuestName');
const matchedInviteCode = document.getElementById('matchedInviteCode');
const matchedSeats = document.getElementById('matchedSeats');
const matchedPlusOneAllowed = document.getElementById('matchedPlusOneAllowed');

const demoRsvpGuests = [
  { name: 'Sample Guest', inviteCode: 'PL-001', seats: 2, plusOneAllowed: true },
  { name: 'Demo Guest', inviteCode: 'PL-002', seats: 1, plusOneAllowed: false }
];

function setRsvpStatus(message, type = '') {
  if (!rsvpStatus) {
    return;
  }

  rsvpStatus.className = `rsvp-status ${type}`.trim();
  rsvpStatus.innerHTML = message;
}

async function lookupGuest(name, inviteCode) {
  if (rsvpEndpoint) {
    const url = new URL(rsvpEndpoint);
    url.searchParams.set('action', 'lookup');
    url.searchParams.set('name', name);
    if (inviteCode) {
      url.searchParams.set('code', inviteCode);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Could not connect to the RSVP database.');
    }

    return response.json();
  }

  const guest = demoRsvpGuests.find((item) => {
    const nameMatches = normalize(item.name) === normalize(name);
    const codeMatches = !inviteCode || normalize(item.inviteCode) === normalize(inviteCode);
    return nameMatches && codeMatches;
  });

  if (!guest) {
    return {
      success: false,
      demoMode: true,
      message: 'The RSVP form is installed but not yet connected to the private guest list. For testing, try Sample Guest with code PL-001.'
    };
  }

  return {
    success: true,
    demoMode: true,
    guest
  };
}

function showRsvpForm(guest, demoMode = false) {
  if (!rsvpDetailsForm || !guestGreeting || !plusOneBlock) {
    return;
  }

  const plusOneAllowed = Boolean(guest.plusOneAllowed || String(guest.plusOneAllowed).toLowerCase() === 'yes');
  const seats = Number(guest.seats || (plusOneAllowed ? 2 : 1));

  matchedGuestName.value = guest.name || '';
  matchedInviteCode.value = guest.inviteCode || inviteCodeInput?.value || '';
  matchedSeats.value = String(seats);
  matchedPlusOneAllowed.value = plusOneAllowed ? 'Yes' : 'No';

  if (plusOneAllowed) {
    guestGreeting.innerHTML = `<strong>Hi ${guest.name}!</strong><br>Your invitation includes ${seats} seats. You may RSVP with one plus one.`;
    plusOneBlock.classList.remove('hidden');
  } else {
    guestGreeting.innerHTML = `<strong>Hi ${guest.name}!</strong><br>Your invitation is reserved for ${seats} seat${seats > 1 ? 's' : ''}.`;
    plusOneBlock.classList.add('hidden');
    if (bringingPlusOne) bringingPlusOne.checked = false;
    if (plusOneName) plusOneName.value = '';
  }

  rsvpDetailsForm.classList.remove('hidden');
  setRsvpStatus(demoMode ? 'Demo mode is active. Connect the private Google Sheet endpoint to use your real guest list.' : 'Invitation found. Please complete your RSVP below.', demoMode ? 'warning' : 'success');
}

if (rsvpLookupForm) {
  rsvpLookupForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = guestNameInput?.value.trim();
    const inviteCode = inviteCodeInput?.value.trim();

    if (!name) {
      setRsvpStatus('Please enter your full name.', 'error');
      return;
    }

    setRsvpStatus('Checking your invitation...', 'warning');
    rsvpDetailsForm?.classList.add('hidden');

    try {
      const data = await lookupGuest(name, inviteCode);
      if (!data.success) {
        setRsvpStatus(data.message || 'We could not find that name. Please check your spelling or contact the wedding coordinator.', data.demoMode ? 'warning' : 'error');
        return;
      }

      showRsvpForm(data.guest, data.demoMode);
    } catch (error) {
      setRsvpStatus(error.message || 'Something went wrong while checking your invitation.', 'error');
    }
  });
}

if (rsvpDetailsForm) {
  rsvpDetailsForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const attendanceStatus = document.getElementById('attendanceStatus')?.value || '';
    const plusOneAllowed = matchedPlusOneAllowed?.value === 'Yes';
    const willBringPlusOne = plusOneAllowed && Boolean(bringingPlusOne?.checked);

    if (!attendanceStatus) {
      setRsvpStatus('Please select if you will attend.', 'error');
      return;
    }

    if (willBringPlusOne && !plusOneName?.value.trim()) {
      setRsvpStatus('Please enter your plus one name.', 'error');
      return;
    }

    const payload = {
      action: 'submit',
      name: matchedGuestName?.value || '',
      inviteCode: matchedInviteCode?.value || '',
      seats: matchedSeats?.value || '',
      plusOneAllowed: matchedPlusOneAllowed?.value || 'No',
      attendanceStatus,
      bringingPlusOne: willBringPlusOne ? 'Yes' : 'No',
      plusOneName: willBringPlusOne ? plusOneName.value.trim() : '',
      notes: document.getElementById('rsvpNotes')?.value.trim() || ''
    };

    if (!rsvpEndpoint) {
      setRsvpStatus('Demo RSVP recorded on screen only. Connect the private Google Sheet endpoint to save real responses.', 'warning');
      return;
    }

    try {
      const response = await fetch(rsvpEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Could not submit your RSVP.');
      }

      setRsvpStatus('Thank you! Your RSVP has been submitted.', 'success');
      rsvpDetailsForm.classList.add('hidden');
      rsvpLookupForm.reset();
    } catch (error) {
      setRsvpStatus(error.message || 'Something went wrong while submitting your RSVP.', 'error');
    }
  });
}

if (resetRsvpButton) {
  resetRsvpButton.addEventListener('click', () => {
    rsvpDetailsForm?.classList.add('hidden');
    rsvpLookupForm?.reset();
    setRsvpStatus('Enter your name to check another invitation.');
  });
}
