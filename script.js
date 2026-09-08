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
const rsvpEndpoint = rsvpSection?.dataset.rsvpEndpoint?.trim() || 'https://script.google.com/macros/s/AKfycbzrtTDKXdgI-hSUhJh9fAatWxVWI1cOH_fK9u0uD_dONW9kk_O9kyX6XCIZiDLkWtGF/exec';

const rsvpLookupForm = document.getElementById('rsvpLookupForm');
const rsvpDetailsForm = document.getElementById('rsvpDetailsForm');
const rsvpStatus = document.getElementById('rsvpStatus');
const guestNameInput = document.getElementById('guestName');
const inviteCodeInput = document.getElementById('inviteCode');
const guestGreeting = document.getElementById('guestGreeting');
const plusOneBlock = document.getElementById('plusOneBlock');
const plusOneCountNote = document.getElementById('plusOneCountNote');
const plusOneFields = document.getElementById('plusOneFields');
const bringingPlusOne = document.getElementById('bringingPlusOne');
const bringingPlusOneLabel = document.getElementById('bringingPlusOneLabel');

const matchedGuestName = document.getElementById('matchedGuestName');
const matchedInviteCode = document.getElementById('matchedInviteCode');
const matchedSeats = document.getElementById('matchedSeats');
const matchedPlusOneAllowed = document.getElementById('matchedPlusOneAllowed');

const demoRsvpGuests = [
  { name: 'Sample Guest', inviteCode: 'PL-001', seats: 3, plusOneAllowed: true },
  { name: 'Demo Guest', inviteCode: 'PL-002', seats: 1, plusOneAllowed: false }
];

function setRsvpStatus(message, type = '') {
  if (!rsvpStatus) {
    return;
  }

  rsvpStatus.className = `rsvp-status ${type}`.trim();
  rsvpStatus.innerHTML = message;
}

function hasLiveRsvpEndpoint() {
  return Boolean(rsvpEndpoint && rsvpEndpoint.startsWith('https://script.google.com/macros/s/') && rsvpEndpoint.endsWith('/exec'));
}

function rsvpJsonpRequest(params, timeout = 15000) {
  return new Promise((resolve, reject) => {
    if (!hasLiveRsvpEndpoint()) {
      reject(new Error('The RSVP form is not connected to a Google Apps Script endpoint yet.'));
      return;
    }

    let url;
    try {
      url = new URL(rsvpEndpoint);
    } catch (error) {
      reject(new Error('The RSVP endpoint URL is not valid.'));
      return;
    }

    const callbackName = `rsvpCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    url.searchParams.set('callback', callbackName);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value == null ? '' : String(value));
    });

    const script = document.createElement('script');
    let isDone = false;

    const cleanup = () => {
      isDone = true;
      clearTimeout(timer);
      delete window[callbackName];
      script.remove();
    };

    const timer = setTimeout(() => {
      if (!isDone) {
        cleanup();
        reject(new Error('The RSVP database did not respond. Please check that the Google Apps Script is deployed for Anyone, then try again.'));
      }
    }, timeout);

    window[callbackName] = (data) => {
      if (!isDone) {
        cleanup();
        resolve(data);
      }
    };

    script.onerror = () => {
      if (!isDone) {
        cleanup();
        reject(new Error('Could not load the RSVP database. Please redeploy the Google Apps Script web app using access: Anyone.'));
      }
    };

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

async function lookupGuest(name, inviteCode) {
  if (hasLiveRsvpEndpoint()) {
    return rsvpJsonpRequest({
      action: 'lookup',
      name,
      code: inviteCode
    });
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

function getSeatCount(guest, plusOneAllowed) {
  const seatCount = Number(guest.seats || guest.maxGuests || 0);

  if (Number.isFinite(seatCount) && seatCount > 0) {
    return Math.max(1, Math.floor(seatCount));
  }

  return plusOneAllowed ? 2 : 1;
}

function getPlusOneLimit(guest, seats, plusOneAllowed) {
  if (!plusOneAllowed) {
    return 0;
  }

  const explicitLimit = Number(guest.plusOneLimit || guest.plusOneCount || guest.allowedPlusOnes || 0);

  if (Number.isFinite(explicitLimit) && explicitLimit > 0) {
    return Math.floor(explicitLimit);
  }

  return Math.max(1, seats - 1);
}

function renderPlusOneFields(limit) {
  if (!plusOneFields) {
    return;
  }

  plusOneFields.innerHTML = '';

  for (let index = 1; index <= limit; index += 1) {
    const label = document.createElement('label');
    label.className = 'rsvp-field';
    label.setAttribute('for', `plusOneName${index}`);

    const labelText = limit === 1 ? 'Plus One Name' : `Plus One ${index} Name`;
    const placeholderText = limit === 1 ? "Enter your guest's full name" : `Enter guest ${index}'s full name`;

    label.innerHTML = `
      <span>${labelText}</span>
      <input type="text" id="plusOneName${index}" class="plus-one-name-input" name="plusOneName${index}" placeholder="${placeholderText}" autocomplete="name" />
    `;

    plusOneFields.appendChild(label);
  }
}

function getEnteredPlusOneNames() {
  return Array.from(document.querySelectorAll('.plus-one-name-input'))
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function clearPlusOneDetails() {
  if (bringingPlusOne) {
    bringingPlusOne.checked = false;
  }

  if (plusOneFields) {
    plusOneFields.innerHTML = '';
  }

  if (plusOneCountNote) {
    plusOneCountNote.textContent = '';
  }
}

function showRsvpForm(guest, demoMode = false) {
  if (!rsvpDetailsForm || !guestGreeting || !plusOneBlock) {
    return;
  }

  const plusOneAllowed = Boolean(guest.plusOneAllowed || String(guest.plusOneAllowed).toLowerCase() === 'yes');
  const seats = getSeatCount(guest, plusOneAllowed);
  const plusOneLimit = getPlusOneLimit(guest, seats, plusOneAllowed);

  if (matchedGuestName) matchedGuestName.value = guest.name || '';
  if (matchedInviteCode) matchedInviteCode.value = guest.inviteCode || inviteCodeInput?.value || '';
  if (matchedSeats) matchedSeats.value = String(seats);
  if (matchedPlusOneAllowed) matchedPlusOneAllowed.value = plusOneAllowed ? 'Yes' : 'No';

  clearPlusOneDetails();

  if (plusOneAllowed && plusOneLimit > 0) {
    const additionalGuestText = plusOneLimit === 1 ? '1 additional guest' : `${plusOneLimit} additional guests`;
    guestGreeting.innerHTML = `<strong>Hi ${guest.name}!</strong><br>Your invitation includes ${seats} seat${seats > 1 ? 's' : ''}. You may add up to ${additionalGuestText}.`;

    if (plusOneCountNote) {
      plusOneCountNote.textContent = `You may enter up to ${additionalGuestText} below.`;
    }

    if (bringingPlusOneLabel) {
      bringingPlusOneLabel.textContent = plusOneLimit === 1 ? 'I will bring my plus one.' : 'I will bring additional guests.';
    }

    renderPlusOneFields(plusOneLimit);
    plusOneBlock.classList.remove('hidden');
  } else {
    guestGreeting.innerHTML = `<strong>Hi ${guest.name}!</strong><br>Your invitation is reserved for ${seats} seat${seats > 1 ? 's' : ''}.`;
    plusOneBlock.classList.add('hidden');
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
      setRsvpStatus('Please enter your first name and last name.', 'error');
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
    const seats = Number(matchedSeats?.value || 1);
    const plusOneLimit = plusOneAllowed ? Math.max(1, seats - 1) : 0;
    const enteredPlusOneNames = getEnteredPlusOneNames();
    const isAttending = attendanceStatus === 'Yes';
    const willBringPlusOne = isAttending && plusOneAllowed && (Boolean(bringingPlusOne?.checked) || enteredPlusOneNames.length > 0);

    if (!attendanceStatus) {
      setRsvpStatus('Please select if you will attend.', 'error');
      return;
    }

    if (willBringPlusOne && enteredPlusOneNames.length === 0) {
      setRsvpStatus('Please enter at least one additional guest name.', 'error');
      return;
    }

    if (enteredPlusOneNames.length > plusOneLimit) {
      setRsvpStatus(`Please enter only up to ${plusOneLimit} additional guest${plusOneLimit > 1 ? 's' : ''}.`, 'error');
      return;
    }

    const plusOneNamesText = willBringPlusOne ? enteredPlusOneNames.join('; ') : '';

    const payload = {
      action: 'submit',
      name: matchedGuestName?.value || '',
      inviteCode: matchedInviteCode?.value || '',
      seats: matchedSeats?.value || '',
      plusOneAllowed: matchedPlusOneAllowed?.value || 'No',
      attendanceStatus,
      bringingPlusOne: willBringPlusOne ? 'Yes' : 'No',
      plusOneName: plusOneNamesText,
      plusOneNames: plusOneNamesText,
      plusOneCount: willBringPlusOne ? enteredPlusOneNames.length : 0,
      notes: (document.getElementById('rsvpNotes')?.value.trim() || '').slice(0, 500)
    };

    if (!hasLiveRsvpEndpoint()) {
      setRsvpStatus('Demo RSVP recorded on screen only. Connect the private Google Sheet endpoint to save real responses.', 'warning');
      return;
    }

    try {
      setRsvpStatus('Submitting your RSVP...', 'warning');
      const data = await rsvpJsonpRequest(payload);

      if (!data.success) {
        throw new Error(data.message || 'Could not submit your RSVP.');
      }

      setRsvpStatus('Thank you! Your RSVP has been submitted.', 'success');
      rsvpDetailsForm.classList.add('hidden');
      rsvpLookupForm.reset();
      clearPlusOneDetails();
    } catch (error) {
      setRsvpStatus(error.message || 'Something went wrong while submitting your RSVP.', 'error');
    }
  });
}
