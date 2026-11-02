/* =========================================================
   WanderLux — site configuration
   ---------------------------------------------------------
   The appointment and contact forms are emailed through
   FormSubmit (https://formsubmit.co), a free form-to-email
   service that works on static hosts such as GitHub Pages.

   TO ENABLE EMAIL SENDING:
   1. Replace RECIPIENT_EMAIL below with the inbox that should
      receive enquiries.
   2. Deploy the site and submit any form once. FormSubmit sends
      a one-time activation email to that inbox — click
      "Activate Form". Every later submission arrives as an email.

   While RECIPIENT_EMAIL is still the placeholder, the forms fall
   back to opening the visitor's email app with the message
   pre-filled, so they still work during local testing.
   ========================================================= */
window.WANDERLUX_CONFIG = Object.freeze({
  RECIPIENT_EMAIL: "your-email@example.com",
  FORM_ENDPOINT_BASE: "https://formsubmit.co/ajax/",
  AGENCY_EMAIL: "hello@wanderlux.com.au",
  CURRENCY: "AUD"
});
