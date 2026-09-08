// Google Apps Script template for Philip & Liezl RSVP plus-one lookup.
// Keep your real guest list in a private Google Sheet. Do not commit guest data to GitHub.
//
// Recommended Google Sheet columns in row 1:
// Full Name | Invite Code | Plus One Allowed | Max Guests | RSVP Status | Bringing Plus One | Plus One Name | Notes | Submitted At
//
// This script is flexible: it also accepts Guest Name instead of Full Name, and Seats instead of Max Guests.

const SHEET_NAME = 'Guests';

const HEADER_ALIASES = {
  name: ['full name', 'guest name', 'name'],
  inviteCode: ['invite code', 'invitation code', 'code'],
  plusOneAllowed: ['plus one allowed', 'plus one', 'allowed plus one', 'with plus one'],
  seats: ['max guests', 'seats', 'guest count', 'number of seats'],
  rsvpStatus: ['rsvp status', 'status'],
  bringingPlusOne: ['bringing plus one', 'bring plus one'],
  plusOneName: ['plus one name', 'companion name', 'guest companion'],
  notes: ['notes', 'meal notes', 'message', 'meal notes or message'],
  submittedAt: ['submitted at', 'timestamp', 'date submitted']
};

function doGet(e) {
  return handleRequest(e, e.parameter || {});
}

function doPost(e) {
  let data = {};

  try {
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents || '{}');
    }
  } catch (error) {
    data = {};
  }

  data = Object.assign({}, e.parameter || {}, data);
  return handleRequest(e, data);
}

function handleRequest(e, data) {
  let response;

  try {
    const action = String(data.action || '').toLowerCase();

    if (action === 'lookup') {
      response = lookupGuest(data);
    } else if (action === 'submit') {
      response = submitRsvp(data);
    } else {
      response = {
        success: false,
        message: 'Unknown RSVP action.'
      };
    }
  } catch (error) {
    response = {
      success: false,
      message: error.message
    };
  }

  return outputResponse(e, response);
}

function lookupGuest(data) {
  const sheet = getGuestSheet();
  const table = getTable(sheet);
  const guest = findGuest(table, data.name, data.code || data.inviteCode);

  if (!guest) {
    return {
      success: false,
      message: 'We could not find that name. Please check your spelling or contact the wedding coordinator.'
    };
  }

  return {
    success: true,
    guest: {
      name: guest.name,
      inviteCode: guest.inviteCode,
      seats: guest.seats,
      plusOneAllowed: guest.plusOneAllowed
    }
  };
}

function submitRsvp(data) {
  const sheet = getGuestSheet();
  const table = getTable(sheet);
  const guest = findGuest(table, data.name, data.inviteCode || data.code);

  if (!guest) {
    return {
      success: false,
      message: 'Guest not found.'
    };
  }

  const status = String(data.attendanceStatus || '').toLowerCase() === 'yes' ? 'Attending' : 'Not Attending';

  setCellIfColumnExists(sheet, table.map.rsvpStatus, guest.row, status);
  setCellIfColumnExists(sheet, table.map.bringingPlusOne, guest.row, data.bringingPlusOne || 'No');
  setCellIfColumnExists(sheet, table.map.plusOneName, guest.row, data.plusOneName || '');
  setCellIfColumnExists(sheet, table.map.notes, guest.row, data.notes || '');
  setCellIfColumnExists(sheet, table.map.submittedAt, guest.row, new Date());

  return {
    success: true,
    message: 'RSVP saved.'
  };
}

function getGuestSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const namedSheet = spreadsheet.getSheetByName(SHEET_NAME);
  return namedSheet || spreadsheet.getSheets()[0];
}

function getTable(sheet) {
  if (!sheet) {
    throw new Error('Guest sheet not found.');
  }

  const values = sheet.getDataRange().getValues();

  if (!values.length) {
    throw new Error('Guest sheet is empty.');
  }

  return {
    values,
    map: buildHeaderMap(values[0])
  };
}

function buildHeaderMap(headers) {
  const normalizedHeaders = headers.map((header) => normalize(header));
  const map = {};

  Object.keys(HEADER_ALIASES).forEach((key) => {
    map[key] = -1;

    for (let i = 0; i < HEADER_ALIASES[key].length; i++) {
      const alias = HEADER_ALIASES[key][i];
      const index = normalizedHeaders.indexOf(alias);

      if (index !== -1) {
        map[key] = index;
        break;
      }
    }
  });

  return map;
}

function findGuest(table, name, code) {
  if (table.map.name === -1) {
    throw new Error('Full Name column not found. Add a Full Name column in row 1.');
  }

  const cleanName = normalize(name);
  const cleanCode = normalize(code);
  const matches = [];

  for (let i = 1; i < table.values.length; i++) {
    const row = table.values[i];
    const guestName = String(row[table.map.name] || '').trim();
    const inviteCode = table.map.inviteCode !== -1 ? String(row[table.map.inviteCode] || '').trim() : '';

    if (!guestName) {
      continue;
    }

    const nameMatches = normalize(guestName) === cleanName;
    const codeMatches = !cleanCode || normalize(inviteCode) === cleanCode;

    if (nameMatches && codeMatches) {
      const plusOneRaw = table.map.plusOneAllowed !== -1 ? row[table.map.plusOneAllowed] : '';
      const seatsRaw = table.map.seats !== -1 ? row[table.map.seats] : '';
      const plusOneAllowed = isYes(plusOneRaw);
      const seats = Number(seatsRaw || (plusOneAllowed ? 2 : 1));

      matches.push({
        row: i + 1,
        inviteCode,
        name: guestName,
        seats,
        plusOneAllowed
      });
    }
  }

  if (matches.length > 1 && !cleanCode) {
    throw new Error('More than one guest has this name. Please enter your invitation code.');
  }

  return matches[0] || null;
}

function setCellIfColumnExists(sheet, columnIndex, row, value) {
  if (columnIndex !== -1) {
    sheet.getRange(row, columnIndex + 1).setValue(value);
  }
}

function isYes(value) {
  const cleanValue = normalize(value);
  return ['yes', 'y', 'true', '1', 'allowed', 'oo'].indexOf(cleanValue) !== -1;
}

function normalize(value) {
  return String(value || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function outputResponse(e, data) {
  const callback = e && e.parameter ? String(e.parameter.callback || '') : '';
  const json = JSON.stringify(data);

  if (callback && isSafeCallbackName(callback)) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function isSafeCallbackName(callback) {
  return /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(callback);
}
