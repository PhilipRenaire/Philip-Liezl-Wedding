// Google Apps Script template for Philip & Liezl RSVP plus-one lookup.
// Keep your real guest list in a private Google Sheet. Do not commit guest data to GitHub.
//
// Google Sheet columns, row 1 headers:
// Invite Code | Guest Name | Seats | Plus One Allowed | RSVP Status | Bringing Plus One | Plus One Name | Notes | Submitted At

const SHEET_NAME = 'Guests';

function doGet(e) {
  const action = (e.parameter.action || '').toLowerCase();

  if (action === 'lookup') {
    return lookupGuest(e);
  }

  return jsonResponse({
    success: false,
    message: 'Unknown RSVP action.'
  });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');

    if ((data.action || '').toLowerCase() !== 'submit') {
      return jsonResponse({ success: false, message: 'Unknown RSVP action.' });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const guest = findGuest(sheet, data.name, data.inviteCode);

    if (!guest) {
      return jsonResponse({ success: false, message: 'Guest not found.' });
    }

    const row = guest.row;
    sheet.getRange(row, 5).setValue(data.attendanceStatus || '');
    sheet.getRange(row, 6).setValue(data.bringingPlusOne || 'No');
    sheet.getRange(row, 7).setValue(data.plusOneName || '');
    sheet.getRange(row, 8).setValue(data.notes || '');
    sheet.getRange(row, 9).setValue(new Date());

    return jsonResponse({
      success: true,
      message: 'RSVP saved.'
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      message: error.message
    });
  }
}

function lookupGuest(e) {
  const name = e.parameter.name || '';
  const code = e.parameter.code || '';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const guest = findGuest(sheet, name, code);

  if (!guest) {
    return jsonResponse({
      success: false,
      message: 'We could not find that name. Please check your spelling or contact the wedding coordinator.'
    });
  }

  return jsonResponse({
    success: true,
    guest: {
      name: guest.name,
      inviteCode: guest.inviteCode,
      seats: guest.seats,
      plusOneAllowed: guest.plusOneAllowed
    }
  });
}

function findGuest(sheet, name, code) {
  if (!sheet) {
    throw new Error('Guests sheet not found.');
  }

  const cleanName = normalize(name);
  const cleanCode = normalize(code);
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const inviteCode = String(row[0] || '').trim();
    const guestName = String(row[1] || '').trim();
    const seats = Number(row[2] || 1);
    const plusOneAllowed = String(row[3] || '').trim().toLowerCase() === 'yes';

    const nameMatches = normalize(guestName) === cleanName;
    const codeMatches = !cleanCode || normalize(inviteCode) === cleanCode;

    if (nameMatches && codeMatches) {
      return {
        row: i + 1,
        inviteCode,
        name: guestName,
        seats,
        plusOneAllowed
      };
    }
  }

  return null;
}

function normalize(value) {
  return String(value || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
