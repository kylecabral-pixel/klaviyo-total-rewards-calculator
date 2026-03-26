/**
 * Google Drive scaffold — wire googleapis + service account when you add the dependency.
 * Env: GOOGLE_APPLICATION_CREDENTIALS or GDRIVE_SERVICE_ACCOUNT_JSON (path to JSON key file)
 */

export function getGDriveFolderId() {
  return process.env.GDRIVE_OFFER_FOLDER_ID || ''
}

/**
 * Placeholder: upload PDF bytes to shared drive folder after adding googleapis.
 */
export async function uploadOfferPdf() {
  if (!getGDriveFolderId()) {
    console.warn('[gdrive] GDRIVE_OFFER_FOLDER_ID not set; uploadOfferPdf is a no-op')
  }
  return { ok: false, skipped: true, reason: 'googleapis not integrated yet' }
}
