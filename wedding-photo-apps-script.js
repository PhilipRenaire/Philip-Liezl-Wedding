/**
 * Philip & Liezl Wedding Memories — Google Apps Script backend
 *
 * Free Google Drive staging workflow:
 * Guest Upload -> Pending Uploads -> Approved / Rejected
 *
 * This version uses Google Drive resumable uploads with small chunks relayed
 * through Apps Script. This avoids direct browser-to-Drive upload failures on
 * mobile while still allowing files up to 1 GB.
 *
 * SETUP / UPDATE
 * 1. Paste this file into Code.gs in the wedding-media Apps Script project.
 * 2. Paste wedding-photo-upload.html into Upload.html.
 * 3. Run setupWeddingPhotoSystem() once after updating.
 * 4. Update the existing Web App deployment to a NEW VERSION.
 *
 * NOTE:
 * - Guest Name is required.
 * - A Video Message for the Couple is required.
 * - At least one wedding photo/video memory is required.
 * - Maximum individual file size is 1 GB.
 * - Every uploaded file starts as Pending.
 * - Video Messages are tagged separately from Wedding Memories.
 * - Change Status in the Google Sheet to Approved or Rejected to move the file automatically.
 */

const CONFIG = {
  rootFolderName: 'P&L Wedding Memories',
  pendingFolderName: 'Pending Uploads',
  approvedFolderName: 'Approved',
  rejectedFolderName: 'Rejected',
  spreadsheetName: 'Wedding Photo Uploads',
  sheetName: 'Uploads',
  maxFileBytes: 1024 * 1024 * 1024, // 1 GB per individual file
  maxChunkBytes: 4 * 1024 * 1024, // 4 MB chunks for mobile reliability
  allowedMimePrefixes: ['image/', 'video/'],
  allowedUploadTypes: ['Wedding Memory', 'Video Message']
};

const COL = {
  id: 1,
  uploadedAt: 2,
  guestName: 3,
  uploadType: 4,
  originalFileName: 5,
  mimeType: 6,
  sizeBytes: 7,
  driveFileId: 8,
  driveLink: 9,
  status: 10,
  reviewedAt: 11
};

const HEADERS = [
  'ID',
  'Uploaded At',
  'Guest Name',
  'Upload Type',
  'Original File Name',
  'MIME Type',
  'Size (Bytes)',
  'Drive File ID',
  'Drive Link',
  'Status',
  'Reviewed At'
];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Upload')
    .setTitle('Share Your Memories | Philip & Liezl')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setupWeddingPhotoSystem() {
  const props = PropertiesService.getScriptProperties();

  const root = findOrCreateFolder_(DriveApp.getRootFolder(), CONFIG.rootFolderName);
  const pending = findOrCreateFolder_(root, CONFIG.pendingFolderName);
  const approved = findOrCreateFolder_(root, CONFIG.approvedFolderName);
  const rejected = findOrCreateFolder_(root, CONFIG.rejectedFolderName);

  let spreadsheet = null;
  const savedSpreadsheetId = props.getProperty('SPREADSHEET_ID');

  if (savedSpreadsheetId) {
    try {
      spreadsheet = SpreadsheetApp.openById(savedSpreadsheetId);
    } catch (err) {
      spreadsheet = null;
    }
  }

  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create(CONFIG.spreadsheetName);
    DriveApp.getFileById(spreadsheet.getId()).moveTo(root);
  }

  let sheet = spreadsheet.getSheetByName(CONFIG.sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.sheetName);
  }

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#4b245f')
    .setFontColor('#ffffff');

  sheet.setColumnWidth(COL.id, 180);
  sheet.setColumnWidth(COL.uploadedAt, 155);
  sheet.setColumnWidth(COL.guestName, 180);
  sheet.setColumnWidth(COL.uploadType, 145);
  sheet.setColumnWidth(COL.originalFileName, 240);
  sheet.setColumnWidth(COL.mimeType, 150);
  sheet.setColumnWidth(COL.sizeBytes, 110);
  sheet.setColumnWidth(COL.driveFileId, 220);
  sheet.setColumnWidth(COL.driveLink, 220);
  sheet.setColumnWidth(COL.status, 115);
  sheet.setColumnWidth(COL.reviewedAt, 155);

  sheet.getRange('B:B').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sheet.getRange('K:K').setNumberFormat('yyyy-mm-dd hh:mm:ss');

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pending', 'Approved', 'Rejected'], true)
    .setAllowInvalid(false)
    .build();

  const maxRows = Math.max(sheet.getMaxRows(), 1000);
  if (sheet.getMaxRows() < maxRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), maxRows - sheet.getMaxRows());
  }
  sheet.getRange(2, COL.status, sheet.getMaxRows() - 1, 1).setDataValidation(statusRule);

  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, sheet.getMaxRows(), HEADERS.length).createFilter();
  }

  props.setProperties({
    ROOT_FOLDER_ID: root.getId(),
    PENDING_FOLDER_ID: pending.getId(),
    APPROVED_FOLDER_ID: approved.getId(),
    REJECTED_FOLDER_ID: rejected.getId(),
    SPREADSHEET_ID: spreadsheet.getId(),
    SHEET_NAME: CONFIG.sheetName
  }, true);

  deleteTriggersByHandler_('handleUploadStatusEdit');
  ScriptApp.newTrigger('handleUploadStatusEdit')
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();

  return {
    ok: true,
    message: 'Wedding photo system is ready for resumable uploads up to 1 GB per file.',
    rootFolderUrl: root.getUrl(),
    pendingFolderUrl: pending.getUrl(),
    approvedFolderUrl: approved.getUrl(),
    rejectedFolderUrl: rejected.getUrl(),
    spreadsheetUrl: spreadsheet.getUrl()
  };
}

/**
 * Creates a Google Drive resumable upload session.
 * The browser then sends small base64 chunks to Apps Script, which forwards
 * them to this Drive session. This avoids mobile cross-origin upload drops.
 */
function beginWeddingMediaUpload(payload) {
  ensureSetup_();

  const guestName = String(payload.guestName || '').trim();
  const uploadType = String(payload.uploadType || 'Wedding Memory').trim();
  const originalFileName = sanitizeFileName_(String(payload.fileName || 'upload'));
  const mimeType = String(payload.mimeType || '').trim();
  const fileSize = Number(payload.fileSize || 0);

  validateUploadRequest_(guestName, uploadType, originalFileName, mimeType, fileSize);

  const props = PropertiesService.getScriptProperties();
  const pendingFolderId = props.getProperty('PENDING_FOLDER_ID');

  const id = Utilities.getUuid();
  const safeGuest = guestName.replace(/[^a-zA-Z0-9 _.-]/g, '').trim().slice(0, 60) || 'Guest';
  const typePrefix = uploadType === 'Video Message' ? 'VIDEO MESSAGE' : 'MEMORY';
  const storedName = typePrefix + ' - ' + safeGuest + ' - ' + id.slice(0, 8) + ' - ' + originalFileName;

  const metadata = {
    name: storedName,
    mimeType: mimeType,
    parents: [pendingFolderId],
    description:
      'Wedding guest upload\n' +
      'Guest: ' + guestName + '\n' +
      'Upload Type: ' + uploadType + '\n' +
      'Status: Pending'
  };

  const endpoint =
    'https://www.googleapis.com/upload/drive/v3/files' +
    '?uploadType=resumable&fields=id,name,mimeType,size,webViewLink';

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(fileSize)
    },
    payload: JSON.stringify(metadata),
    muteHttpExceptions: true,
    followRedirects: false
  });

  const status = response.getResponseCode();
  const headers = response.getAllHeaders();
  const sessionUrl = headers.Location || headers.location;

  if (status < 200 || status >= 300 || !sessionUrl) {
    throw new Error('Could not start the Google Drive upload. Please try again.');
  }

  return {
    ok: true,
    id: id,
    sessionUrl: String(sessionUrl),
    fileName: originalFileName,
    uploadType: uploadType,
    maxFileBytes: CONFIG.maxFileBytes
  };
}

/**
 * Relays one small resumable-upload chunk from the guest browser to Google Drive.
 * This keeps the browser talking only to google.script.run instead of directly
 * to the Drive resumable endpoint.
 */
function uploadWeddingMediaChunk(payload) {
  ensureSetup_();

  const sessionUrl = validateSessionUrl_(String(payload.sessionUrl || '').trim());
  const start = Number(payload.start);
  const total = Number(payload.total);
  const mimeType = String(payload.mimeType || 'application/octet-stream').trim();
  const base64 = String(payload.base64 || '').trim();

  if (!Number.isFinite(start) || start < 0) {
    throw new Error('Invalid upload position.');
  }
  if (!Number.isFinite(total) || total <= 0 || total > CONFIG.maxFileBytes) {
    throw new Error('Invalid upload size.');
  }
  if (!base64) {
    throw new Error('Upload chunk is empty.');
  }

  const bytes = Utilities.base64Decode(base64);
  if (!bytes.length || bytes.length > CONFIG.maxChunkBytes) {
    throw new Error('Upload chunk is too large.');
  }

  const end = start + bytes.length - 1;
  if (end >= total) {
    if (end !== total - 1) {
      throw new Error('Upload chunk exceeds the declared file size.');
    }
  }

  const response = UrlFetchApp.fetch(sessionUrl, {
    method: 'put',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
      'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
      'Content-Type': mimeType
    },
    payload: bytes,
    muteHttpExceptions: true,
    followRedirects: false
  });

  const status = response.getResponseCode();

  if (status === 200 || status === 201) {
    let file = {};
    try {
      file = JSON.parse(response.getContentText() || '{}');
    } catch (err) {
      throw new Error('Google Drive completed the upload but returned an unreadable response.');
    }

    return {
      ok: true,
      done: true,
      file: file,
      nextByte: total
    };
  }

  if (status === 308) {
    const headers = response.getAllHeaders();
    const rangeHeader = headers.Range || headers.range || '';
    return {
      ok: true,
      done: false,
      nextByte: getNextByteFromRange_(String(rangeHeader), start + bytes.length)
    };
  }

  if ([429, 500, 502, 503, 504].includes(status)) {
    throw new Error('Google Drive temporarily interrupted the upload.');
  }

  throw new Error('Google Drive upload failed (' + status + ').');
}

/**
 * Checks how many bytes Google Drive has safely received for a resumable upload.
 */
function getWeddingMediaUploadStatus(payload) {
  ensureSetup_();

  const sessionUrl = validateSessionUrl_(String(payload.sessionUrl || '').trim());
  const total = Number(payload.total);

  if (!Number.isFinite(total) || total <= 0 || total > CONFIG.maxFileBytes) {
    throw new Error('Invalid upload size.');
  }

  const response = UrlFetchApp.fetch(sessionUrl, {
    method: 'put',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
      'Content-Range': 'bytes */' + total
    },
    payload: '',
    muteHttpExceptions: true,
    followRedirects: false
  });

  const status = response.getResponseCode();

  if (status === 200 || status === 201) {
    let file = {};
    try {
      file = JSON.parse(response.getContentText() || '{}');
    } catch (err) {
      throw new Error('Google Drive finished the upload but returned an unreadable response.');
    }

    return {
      ok: true,
      done: true,
      file: file,
      nextByte: total
    };
  }

  if (status === 308) {
    const headers = response.getAllHeaders();
    const rangeHeader = headers.Range || headers.range || '';
    return {
      ok: true,
      done: false,
      nextByte: getNextByteFromRange_(String(rangeHeader), 0)
    };
  }

  if (status === 404) {
    throw new Error('The upload session expired. Please start the upload again.');
  }

  throw new Error('Could not resume the upload (' + status + ').');
}

function validateSessionUrl_(url) {
  const allowed = /^https:\/\/www\.googleapis\.com\/upload\/drive\/v3\/files(?:\?|$)/i;
  if (!allowed.test(url)) {
    throw new Error('Invalid Google Drive upload session.');
  }
  return url;
}

function getNextByteFromRange_(rangeHeader, fallback) {
  const match = /bytes=0-(\d+)/i.exec(String(rangeHeader || ''));
  if (!match) return fallback;

  const lastByte = Number(match[1]);
  return Number.isFinite(lastByte) ? lastByte + 1 : fallback;
}

/**
 * Called after the browser finishes the resumable upload.
 * Verifies the Drive file is really in the private Pending folder,
 * then writes the tracking row to the moderation spreadsheet.
 */
function finalizeWeddingMedia(payload) {
  ensureSetup_();

  const id = String(payload.id || '').trim() || Utilities.getUuid();
  const guestName = String(payload.guestName || '').trim();
  const uploadType = String(payload.uploadType || 'Wedding Memory').trim();
  const originalFileName = sanitizeFileName_(String(payload.fileName || 'upload'));
  const requestedMimeType = String(payload.mimeType || '').trim();
  const driveFileId = String(payload.driveFileId || '').trim();

  if (!driveFileId) throw new Error('The uploaded Drive file could not be identified.');

  const file = DriveApp.getFileById(driveFileId);
  const actualMimeType = file.getMimeType() || requestedMimeType;
  const actualSize = Number(file.getSize() || 0);

  validateUploadRequest_(
    guestName,
    uploadType,
    originalFileName,
    actualMimeType,
    actualSize
  );

  const props = PropertiesService.getScriptProperties();
  const pendingFolderId = props.getProperty('PENDING_FOLDER_ID');

  let isInPendingFolder = false;
  const parents = file.getParents();
  while (parents.hasNext()) {
    if (parents.next().getId() === pendingFolderId) {
      isInPendingFolder = true;
      break;
    }
  }

  if (!isInPendingFolder) {
    throw new Error('The uploaded file is not in the wedding Pending folder.');
  }

  const spreadsheet = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
  const sheet = spreadsheet.getSheetByName(props.getProperty('SHEET_NAME') || CONFIG.sheetName);

  const existing = sheet
    .getRange(2, COL.driveFileId, Math.max(sheet.getLastRow() - 1, 1), 1)
    .createTextFinder(driveFileId)
    .matchEntireCell(true)
    .findNext();

  if (!existing) {
    sheet.appendRow([
      id,
      new Date(),
      guestName,
      uploadType,
      originalFileName,
      actualMimeType,
      actualSize,
      driveFileId,
      file.getUrl(),
      'Pending',
      ''
    ]);
  }

  return {
    ok: true,
    id: id,
    driveFileId: driveFileId,
    fileName: originalFileName,
    uploadType: uploadType,
    sizeBytes: actualSize,
    status: 'Pending'
  };
}

function validateUploadRequest_(guestName, uploadType, originalFileName, mimeType, fileSize) {
  if (!guestName) throw new Error('Your Name is required.');

  if (!CONFIG.allowedUploadTypes.includes(uploadType)) {
    throw new Error('Invalid upload type.');
  }

  if (!originalFileName) throw new Error('The file name is missing.');

  if (uploadType === 'Video Message') {
    if (!mimeType || !mimeType.startsWith('video/')) {
      throw new Error('Your message to the couple must be a video file.');
    }
  } else if (!mimeType || !CONFIG.allowedMimePrefixes.some(prefix => mimeType.startsWith(prefix))) {
    throw new Error('Only photo and video files are allowed.');
  }

  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    throw new Error('The selected file is empty.');
  }

  if (fileSize > CONFIG.maxFileBytes) {
    throw new Error('This file is too large. Maximum size is 1 GB per file.');
  }
}

/**
 * Installed edit trigger.
 * In the Uploads sheet, change the Status cell to:
 * Pending / Approved / Rejected
 *
 * The associated Drive file is automatically moved to the matching folder.
 */
function handleUploadStatusEdit(e) {
  if (!e || !e.range) return;

  const sheet = e.range.getSheet();
  if (sheet.getName() !== CONFIG.sheetName) return;
  if (e.range.getRow() < 2 || e.range.getColumn() !== COL.status) return;

  const status = String(e.value || '').trim();
  if (!['Pending', 'Approved', 'Rejected'].includes(status)) return;

  const row = e.range.getRow();
  const fileId = String(sheet.getRange(row, COL.driveFileId).getValue() || '').trim();
  if (!fileId) return;

  const props = PropertiesService.getScriptProperties();
  const folderIdByStatus = {
    Pending: props.getProperty('PENDING_FOLDER_ID'),
    Approved: props.getProperty('APPROVED_FOLDER_ID'),
    Rejected: props.getProperty('REJECTED_FOLDER_ID')
  };

  const targetFolderId = folderIdByStatus[status];
  if (!targetFolderId) return;

  try {
    const file = DriveApp.getFileById(fileId);
    const targetFolder = DriveApp.getFolderById(targetFolderId);
    file.moveTo(targetFolder);

    if (status === 'Pending') {
      sheet.getRange(row, COL.reviewedAt).clearContent();
    } else {
      sheet.getRange(row, COL.reviewedAt).setValue(new Date());
    }

    file.setDescription(
      'Wedding guest upload\n' +
      'Guest: ' + sheet.getRange(row, COL.guestName).getDisplayValue() + '\n' +
      'Upload Type: ' + sheet.getRange(row, COL.uploadType).getDisplayValue() + '\n' +
      'Status: ' + status
    );
  } catch (err) {
    console.error('Could not move upload:', err);
  }
}

function getUploadQueue(status) {
  ensureSetup_();

  const wanted = String(status || 'Pending').trim();
  const props = PropertiesService.getScriptProperties();
  const spreadsheet = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
  const sheet = spreadsheet.getSheetByName(props.getProperty('SHEET_NAME') || CONFIG.sheetName);

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  return values.slice(1)
    .filter(row => String(row[COL.status - 1] || '') === wanted)
    .map(row => ({
      id: row[COL.id - 1],
      uploadedAt: row[COL.uploadedAt - 1],
      guestName: row[COL.guestName - 1],
      uploadType: row[COL.uploadType - 1],
      originalFileName: row[COL.originalFileName - 1],
      mimeType: row[COL.mimeType - 1],
      sizeBytes: row[COL.sizeBytes - 1],
      driveFileId: row[COL.driveFileId - 1],
      driveLink: row[COL.driveLink - 1],
      status: row[COL.status - 1]
    }));
}

function ensureSetup_() {
  const props = PropertiesService.getScriptProperties();
  if (
    !props.getProperty('PENDING_FOLDER_ID') ||
    !props.getProperty('APPROVED_FOLDER_ID') ||
    !props.getProperty('REJECTED_FOLDER_ID') ||
    !props.getProperty('SPREADSHEET_ID')
  ) {
    throw new Error('Wedding photo system is not set up yet. Run setupWeddingPhotoSystem() first.');
  }
}

function findOrCreateFolder_(parentFolder, name) {
  const folders = parentFolder.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parentFolder.createFolder(name);
}

function sanitizeFileName_(name) {
  return String(name || '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

function deleteTriggersByHandler_(handlerName) {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === handlerName)
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
}
