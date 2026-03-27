/**
 * Google Drive scaffold — wire `googleapis` + service account when you add the dependency.
 * Env: GOOGLE_APPLICATION_CREDENTIALS, GDRIVE_SERVICE_ACCOUNT_JSON (path to JSON key), or inline JSON TBD per ops.
 */

export function getGDriveFolderId() {
  return process.env.GDRIVE_OFFER_FOLDER_ID || ''
}

function hasGDriveCredentialsHint() {
  return Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GDRIVE_SERVICE_ACCOUNT_JSON,
  )
}

/**
 * Non-secret status for /api/integrations/* and health dashboards.
 */
export function getGDriveStatus() {
  return {
    folderConfigured: Boolean(getGDriveFolderId()),
    credentialsConfigured: hasGDriveCredentialsHint(),
    uploadImplemented: false,
  }
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

/**
 * Placeholder: export generated offer PDF to the configured folder (implement with Drive API).
 */
export async function exportPdfToFolder() {
  return uploadOfferPdf()
}
