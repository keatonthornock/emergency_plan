/**
 * Ward emergency signup Apps Script backend.
 *
 * Sheet schema (House List tab):
 *   A: Address (primary lookup key)
 *   B: Name
 *   C: Contact
 */

const SPREADSHEET_ID = 'REPLACE_WITH_YOUR_SPREADSHEET_ID';
const DEFAULT_HOUSE_TAB = 'House List';
const REVIEW_QUEUE_TAB = 'Review Queue';

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const submittedAddress = normalizeWhitespace(payload.address);
    const submittedName = normalizeWhitespace(payload.full_name);
    const submittedPhone = normalizeWhitespace(payload.phone);
    const houseTabName = normalizeWhitespace(payload.sheet_tab_name) || DEFAULT_HOUSE_TAB;

    if (!submittedAddress || !submittedName || !submittedPhone) {
      return jsonResponse({
        success: false,
        message: 'Missing required fields: full_name, address, and phone are required.'
      });
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const houseTab = sheet.getSheetByName(houseTabName);
    if (!houseTab) {
      return jsonResponse({
        success: false,
        message: `Configured tab not found: ${houseTabName}`
      });
    }

    const lastRow = houseTab.getLastRow();
    if (lastRow < 2) {
      return jsonResponse({
        success: false,
        message: `No address data found in tab '${houseTabName}'.`
      });
    }

    const data = houseTab.getRange(2, 1, lastRow - 1, 3).getValues();

    let matchedIndex = -1;
    for (let i = 0; i < data.length; i += 1) {
      const existingAddress = normalizeWhitespace(data[i][0]);
      if (existingAddress && existingAddress === submittedAddress) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex === -1) {
      return jsonResponse({
        success: false,
        message: `No matching address found in ${houseTabName}: ${submittedAddress}`
      });
    }

    const rowNumber = matchedIndex + 2;
    const existingName = normalizeWhitespace(data[matchedIndex][1]);
    const existingContact = normalizeWhitespace(data[matchedIndex][2]);

    let nameInserted = false;
    let contactInserted = false;
    let queuedForReview = false;

    if (!existingName) {
      houseTab.getRange(rowNumber, 2).setValue(submittedName);
      nameInserted = true;
    } else if (existingName !== submittedName) {
      queuedForReview = true;
    }

    if (!existingContact) {
      houseTab.getRange(rowNumber, 3).setValue(submittedPhone);
      contactInserted = true;
    } else if (existingContact !== submittedPhone) {
      queuedForReview = true;
    }

    if (queuedForReview) {
      const reviewQueue = getOrCreateReviewQueue(sheet);
      reviewQueue.appendRow([
        new Date(),
        submittedAddress,
        existingName,
        submittedName,
        existingContact,
        submittedPhone
      ]);
    }

    const insertedAny = nameInserted || contactInserted;
    let message = 'No updates were required.';
    if (insertedAny && queuedForReview) {
      message = 'Values were inserted where blank; conflicts were queued for review.';
    } else if (insertedAny) {
      message = 'Submission received and values were inserted.';
    } else if (queuedForReview) {
      message = 'Submission conflicts with existing values and was queued for review.';
    }

    return jsonResponse({
      success: true,
      message,
      address: submittedAddress,
      row_number: rowNumber,
      name_inserted: nameInserted,
      contact_inserted: contactInserted,
      queued_for_review: queuedForReview,
      sheet_tab_name: houseTabName
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getOrCreateReviewQueue(sheet) {
  let queue = sheet.getSheetByName(REVIEW_QUEUE_TAB);
  if (!queue) {
    queue = sheet.insertSheet(REVIEW_QUEUE_TAB);
    queue.getRange(1, 1, 1, 6).setValues([[
      'timestamp',
      'address',
      'existing_name',
      'proposed_name',
      'existing_contact',
      'proposed_contact'
    ]]);
  }

  return queue;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
