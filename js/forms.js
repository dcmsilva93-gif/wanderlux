/* =========================================================
   WanderLux — appointment & contact form submission
   ---------------------------------------------------------
   Validates with FormValidator, then sends the data as an
   email using the Fetch API and FormSubmit's AJAX endpoint.
   Falls back to a pre-filled mailto: link if the service is
   not configured or the network request fails.
   ========================================================= */
(function () {
  "use strict";

  const config = window.WANDERLUX_CONFIG;

  function isConfigured() {
    return config && /@/.test(config.RECIPIENT_EMAIL) && !/example\.com$/i.test(config.RECIPIENT_EMAIL);
  }

  function showStatus(form, type, html) {
    const box = form.querySelector(".form-status");
    box.className = "form-status form-status--" + type + " is-shown";
    box.innerHTML = html;
    box.focus();
  }

  function collect(form) {
    const data = {};
    new FormData(form).forEach((value, key) => { data[key] = String(value).trim(); });
    return data;
  }

  function buildMailto(subject, data) {
    const lines = Object.entries(data)
      .filter(([k]) => !k.startsWith("_"))
      .map(([k, v]) => k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, " ") + ": " + v);
    return "mailto:" + config.AGENCY_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(lines.join("\n"));
  }

  async function send(form, validator) {
    const submitBtn = form.querySelector('[type="submit"]');
    const originalLabel = submitBtn.textContent;
    const data = collect(form);

    // Spam trap: real visitors never fill the hidden field
    if (data._honey) return;

    const subject = form.dataset.subject + " — " + (data.name || "Website visitor");

    if (!isConfigured()) {
      // Local/testing mode: hand the message to the visitor's email app
      window.location.href = buildMailto(subject, data);
      showStatus(form, "info",
        "<p><strong>Your email app should now open with your message ready to send.</strong></p>" +
        "<p>If nothing happened, email us at <a href=\"mailto:" + config.AGENCY_EMAIL + "\">" + config.AGENCY_EMAIL + "</a>.</p>");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    try {
      const response = await fetch(config.FORM_ENDPOINT_BASE + encodeURIComponent(config.RECIPIENT_EMAIL), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.assign({}, data, {
          _subject: subject,
          _template: "table",
          _captcha: "false",
          _replyto: data.email
        }))
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || String(result.success) === "false") {
        throw new Error(result.message || "The email service returned status " + response.status);
      }

      showStatus(form, "success", form.dataset.successMessage.replace("{name}", data.name.split(" ")[0]));
      form.reset();
      validator.reset();
      form.dispatchEvent(new CustomEvent("form:sent"));
    } catch (err) {
      console.error("[WanderLux] Form send failed:", err);
      showStatus(form, "error",
        "<p><strong>Your message wasn't sent.</strong> " + (navigator.onLine ? "The email service didn't respond." : "You appear to be offline.") + "</p>" +
        '<p>Try again, or <a href="' + buildMailto(subject, data) + '">send it from your email app</a> instead. Your details are still in the form.</p>');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  }

  /* Pre-fill the appointment form when arriving from the calculator */
  function prefillFromQuery(form) {
    const params = new URLSearchParams(location.search);
    const trip = params.get("trip");
    const message = form.querySelector("#message");
    if (trip && message && !message.value) {
      message.value = "I'd like to discuss this estimate: " + trip.slice(0, 300);
    }
  }

  /* Live character counter for message boxes */
  function initCounter(form) {
    const textarea = form.querySelector("textarea[maxlength]");
    const counter = form.querySelector("[data-counter]");
    if (!textarea || !counter) return;
    const update = () => { counter.textContent = textarea.value.length + " / " + textarea.maxLength + " characters"; };
    textarea.addEventListener("input", update);
    form.addEventListener("form:sent", update);
    update();
  }

  /* Appointment date: earliest is tomorrow, latest six months ahead */
  function initDateLimits(form) {
    const date = form.querySelector('input[type="date"]');
    if (!date) return;
    const toISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const min = new Date(); min.setDate(min.getDate() + 1);
    const max = new Date(); max.setMonth(max.getMonth() + 6);
    date.min = toISO(min);
    date.max = toISO(max);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("form[data-email-form]").forEach((form) => {
      const validator = window.FormValidator.attach(form);
      initDateLimits(form);
      prefillFromQuery(form);
      initCounter(form);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (validator.validate()) send(form, validator);
      });
    });
  });
})();
