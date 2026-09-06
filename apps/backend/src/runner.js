// Execution is authenticated and quota-controlled by ExecutionService in app.js.
// This compatibility entry point deliberately cannot execute code on the API host.
export async function runSubmission() {
  throw new Error('Use the authenticated /api/challenges/:id/submit endpoint. Local execution has been removed.');
}
