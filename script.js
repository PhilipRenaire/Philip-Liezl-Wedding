// Full-screen intro video before the wedding homepage.
(function initWeddingIntro() {
  const introVideoSrc = 'assets/intro.mp4?v=intro-mobile-20260911';
  const introSeenKey = 'philipLiezlIntroSeen';

  function markIntroSeen() {
    try {
      sessionStorage.setItem(introSeenKey, 'yes');
    } catch (error) {
      // Continue normally if session storage is unavailable.
    }
  }

  function hasSeenIntro() {
    try {
      return sessionStorage.getItem(introSeenKey) === 'yes';
    } catch (error) {
      return false;
    }
  }

  function finishIntro(overlay) {
    if (!overlay || overlay.dataset.finished === 'true') {
      return;
    }

    overlay.dataset.finished = 'true';
    markIntroSeen();
    overlay.classList.add('wedding-intro-hidden');
    document.body.style.overflow = '';

    setTimeout(() => {
      overlay.remove();
    }, 650);
  }

  function addIntroStyles() {
    if (document.getElementById('weddingIntroStyles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'weddingIntroStyles';
    style.textContent = `
      .wedding-intro-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: #120a17;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        opacity: 1;
        min-height: 100vh;
        min-height: 100dvh;
        transition: opacity 650ms ease, visibility 650ms ease;
      }

      .wedding-intro-overlay.wedding-intro-hidden {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }

      .wedding-intro-video {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        background: #120a17;
      }

      .wedding-intro-actions {
        position: absolute;
        right: max(24px, env(safe-area-inset-right));
        bottom: max(24px, calc(env(safe-area-inset-bottom) + 24px));
        left: auto;
        z-index: 3;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .wedding-intro-button {
        border: 1px solid rgba(255, 255, 255, 0.65);
        border-radius: 999px;
        padding: 11px 18px;
        background: rgba(18, 10, 23, 0.58);
        color: #fff;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.03em;
        cursor: pointer;
        backdrop-filter: blur(8px);
        transition: background 200ms ease, transform 200ms ease;
      }

      .wedding-intro-button:hover,
      .wedding-intro-button:focus {
        background: rgba(75, 36, 95, 0.82);
        transform: translateY(-1px);
      }

      .wedding-intro-message {
        position: absolute;
        left: 50%;
        bottom: max(92px, calc(env(safe-area-inset-bottom) + 92px));
        z-index: 3;
        transform: translateX(-50%);
        color: #fff;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: 700;
        text-align: center;
        background: rgba(18, 10, 23, 0.58);
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 999px;
        padding: 10px 16px;
        display: none;
      }

      .wedding-intro-overlay.needs-tap .wedding-intro-message {
        display: block;
      }

      @media (orientation: portrait), (max-width: 640px) {
        .wedding-intro-overlay {
          align-items: center;
          padding: 16px 0 calc(env(safe-area-inset-bottom) + 118px);
          background:
            radial-gradient(circle at center, rgba(75, 36, 95, 0.45), transparent 58%),
            #120a17;
        }

        .wedding-intro-video {
          width: 100vw;
          height: auto;
          max-width: 100vw;
          max-height: calc(100dvh - 140px);
          object-fit: contain;
        }

        .wedding-intro-actions {
          right: max(14px, env(safe-area-inset-right));
          bottom: max(18px, calc(env(safe-area-inset-bottom) + 18px));
          left: max(14px, env(safe-area-inset-left));
          justify-content: center;
          gap: 10px;
        }

        .wedding-intro-button {
          flex: 1 1 auto;
          min-width: 0;
          padding: 12px 14px;
          text-align: center;
          font-size: 13px;
        }

        .wedding-intro-button[data-intro-enter] {
          flex: 1 1 100%;
          font-size: 14px;
          padding: 13px 18px;
        }

        .wedding-intro-message {
          width: calc(100% - 32px);
          bottom: calc(env(safe-area-inset-bottom) + 96px);
          border-radius: 18px;
        }
      }

      @media (orientation: landscape) and (max-height: 500px) {
        .wedding-intro-video {
          object-fit: contain;
          width: 100vw;
          height: 100dvh;
        }

        .wedding-intro-actions {
          right: max(12px, env(safe-area-inset-right));
          bottom: max(12px, calc(env(safe-area-inset-bottom) + 12px));
          gap: 8px;
        }

        .wedding-intro-button {
          padding: 9px 13px;
          font-size: 12px;
        }

        .wedding-intro-message {
          bottom: calc(env(safe-area-inset-bottom) + 66px);
          font-size: 12px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createIntroOverlay() {
    addIntroStyles();

    const overlay = document.createElement('div');
    overlay.className = 'wedding-intro-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Wedding video intro');
    overlay.innerHTML = `
      <video class="wedding-intro-video" autoplay muted playsinline loop preload="auto">
        <source src="${introVideoSrc}" type="video/mp4" />
      </video>
      <div class="wedding-intro-message">Tap play to start the intro video.</div>
      <div class="wedding-intro-actions">
        <button type="button" class="wedding-intro-button" data-intro-sound>Tap for Sound</button>
        <button type="button" class="wedding-intro-button" data-intro-enter>Enter the Celebration</button>
      </div>
    `;

    document.body.style.overflow = 'hidden';
    document.body.prepend(overlay);

    const video = overlay.querySelector('.wedding-intro-video');
    const soundButton = overlay.querySelector('[data-intro-sound]');
    const enterButton = overlay.querySelector('[data-intro-enter]');

    enterButton?.addEventListener('click', () => {
      finishIntro(overlay);
    });

    soundButton?.addEventListener('click', () => {
      if (!video) {
        return;
      }

      video.muted = false;
      video.volume = 1;
      video.play().catch(() => {
        overlay.classList.add('needs-tap');
      });
      soundButton.textContent = 'Sound On';
      setTimeout(() => {
        soundButton.style.display = 'none';
      }, 900);
    });

    if (video) {
      video.addEventListener('error', () => {
        finishIntro(overlay);
      });
      video.play().catch(() => {
        overlay.classList.add('needs-tap');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!hasSeenIntro()) {
      createIntroOverlay();
    }
  });
})();

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

let currentPlusOneLimit = 0;

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

function showRequiredPopup(message, inputElement) {
  alert(message);
  setRsvpStatus(message, 'error');

  if (inputElement && typeof inputElement.focus === 'function') {
    inputElement.focus();
  }
}

function isYes(value) {
  if (value === true) return true;
  if (value === false || value == null) return false;
  return ['yes', 'y', 'true', '1', 'allowed', 'oo'].includes(normalize(value));
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

function hidePlusOneFields() {
  if (plusOneFields) {
    plusOneFields.innerHTML = '';
    plusOneFields.classList.add('hidden');
  }
}

function showPlusOneFields() {
  if (!plusOneFields || currentPlusOneLimit <= 0) {
    return;
  }

  renderPlusOneFields(currentPlusOneLimit);
  plusOneFields.classList.remove('hidden');
}

function updatePlusOneFieldVisibility() {
  if (bringingPlusOne?.checked) {
    showPlusOneFields();
  } else {
    hidePlusOneFields();
  }
}

function getEnteredPlusOneNames() {
  return Array.from(document.querySelectorAll('.plus-one-name-input'))
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function clearPlusOneDetails() {
  currentPlusOneLimit = 0;

  if (bringingPlusOne) {
    bringingPlusOne.checked = false;
  }

  hidePlusOneFields();

  if (plusOneCountNote) {
    plusOneCountNote.textContent = '';
  }
}

function showRsvpForm(guest, demoMode = false) {
  if (!rsvpDetailsForm || !guestGreeting || !plusOneBlock) {
    return;
  }

  const plusOneAllowed = isYes(guest.plusOneAllowed);
  const seats = getSeatCount(guest, plusOneAllowed);
  currentPlusOneLimit = getPlusOneLimit(guest, seats, plusOneAllowed);

  if (matchedGuestName) matchedGuestName.value = guest.name || '';
  if (matchedInviteCode) matchedInviteCode.value = guest.inviteCode || inviteCodeInput?.value || '';
  if (matchedSeats) matchedSeats.value = String(seats);
  if (matchedPlusOneAllowed) matchedPlusOneAllowed.value = plusOneAllowed ? 'Yes' : 'No';

  if (plusOneAllowed && currentPlusOneLimit > 0) {
    const additionalGuestText = currentPlusOneLimit === 1 ? '1 additional guest' : `${currentPlusOneLimit} additional guests`;
    guestGreeting.innerHTML = `<strong>Hi ${guest.name}!</strong><br>Your invitation includes ${seats} seat${seats > 1 ? 's' : ''}. You may add up to ${additionalGuestText}.`;

    if (plusOneCountNote) {
      plusOneCountNote.textContent = `You may enter up to ${additionalGuestText}. Check the box below to add their name${currentPlusOneLimit > 1 ? 's' : ''}.`;
    }

    if (bringingPlusOneLabel) {
      bringingPlusOneLabel.textContent = currentPlusOneLimit === 1 ? 'I will bring my plus one.' : 'I will bring additional guests.';
    }

    if (bringingPlusOne) {
      bringingPlusOne.checked = false;
    }
    hidePlusOneFields();
    plusOneBlock.classList.remove('hidden');
  } else {
    clearPlusOneDetails();
    guestGreeting.innerHTML = `<strong>Hi ${guest.name}!</strong><br>Your invitation is reserved for ${seats} seat${seats > 1 ? 's' : ''}.`;
    plusOneBlock.classList.add('hidden');
  }

  rsvpDetailsForm.classList.remove('hidden');
  setRsvpStatus(demoMode ? 'Demo mode is active. Connect the private Google Sheet endpoint to use your real guest list.' : 'Invitation found. Please complete your RSVP below.', demoMode ? 'warning' : 'success');
}

if (bringingPlusOne) {
  bringingPlusOne.addEventListener('change', updatePlusOneFieldVisibility);
}

if (rsvpLookupForm) {
  rsvpLookupForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = guestNameInput?.value.trim();
    const inviteCode = inviteCodeInput?.value.trim();

    if (!name) {
      showRequiredPopup('Please enter your first name and last name.', guestNameInput);
      return;
    }

    if (!inviteCode) {
      showRequiredPopup('Please enter your invitation code.', inviteCodeInput);
      return;
    }

    setRsvpStatus('Checking your invitation...', 'warning');
    rsvpDetailsForm?.classList.add('hidden');
    clearPlusOneDetails();

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
    const willBringPlusOne = isAttending && plusOneAllowed && Boolean(bringingPlusOne?.checked);

    if (!attendanceStatus) {
      showRequiredPopup('Please select if you will attend.', document.getElementById('attendanceStatus'));
      return;
    }

    if (willBringPlusOne && enteredPlusOneNames.length === 0) {
      showRequiredPopup('Please enter at least one additional guest name.', document.querySelector('.plus-one-name-input'));
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
