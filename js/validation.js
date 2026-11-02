/* =========================================================
   WanderLux — reusable form validation
   ---------------------------------------------------------
   Used by the trip calculator, the appointment form and the
   contact form. Each input declares its rules with standard
   HTML attributes (required, type, min, max, minlength,
   pattern) plus optional data-* attributes:
     data-rule="name|phone|future-date"
     data-label="Friendly field name used in messages"
   Errors are shown inline next to the field, linked with
   aria-describedby, and listed in an error summary so screen
   reader and keyboard users can jump straight to each problem.
   ========================================================= */
window.FormValidator = (function () {
  "use strict";

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]{2,60}$/;
  // Australian and international numbers: optional +, 8–15 digits, spaces/brackets/dashes allowed
  const PHONE_RE = /^\+?[\d\s()-]{8,20}$/;

  function labelOf(input) {
    if (input.dataset.label) return input.dataset.label;
    const label = input.form.querySelector('label[for="' + input.id + '"]');
    return label ? label.textContent.replace("*", "").trim() : input.name;
  }

  /** Returns an error message for one input, or "" when valid. */
  function check(input) {
    const value = input.value.trim();
    const label = labelOf(input);
    const rule = input.dataset.rule;

    if (input.required && value === "") {
      return input.tagName === "SELECT" ? "Choose a " + label.toLowerCase() + "." : "Enter your " + label.toLowerCase() + ".";
    }
    if (value === "") return ""; // optional and empty is fine

    if (input.type === "email" && !EMAIL_RE.test(value)) {
      return "Enter an email address in the format name@example.com.";
    }
    if (rule === "name" && !NAME_RE.test(value)) {
      return "Name can only contain letters, spaces, hyphens and apostrophes (2–60 characters).";
    }
    if (rule === "phone") {
      const digits = value.replace(/\D/g, "");
      if (!PHONE_RE.test(value) || digits.length < 8 || digits.length > 15) {
        return "Enter a phone number with 8 to 15 digits, for example 0412 345 678.";
      }
    }
    if (input.type === "number") {
      const n = Number(value);
      const min = input.min !== "" ? Number(input.min) : -Infinity;
      const max = input.max !== "" ? Number(input.max) : Infinity;
      if (!Number.isInteger(n)) return label + " must be a whole number.";
      if (n < min || n > max) return label + " must be between " + min + " and " + max + ".";
    }
    if (rule === "future-date") {
      const chosen = new Date(value + "T00:00:00");
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const limit = new Date(today); limit.setMonth(limit.getMonth() + 6);
      if (isNaN(chosen)) return "Enter a valid date.";
      if (chosen <= today) return "Choose a date from tomorrow onwards.";
      if (chosen > limit) return "Choose a date within the next 6 months.";
      if (chosen.getDay() === 0) return "We are closed on Sundays. Choose Monday to Saturday.";
    }
    const minLen = Number(input.getAttribute("minlength"));
    if (minLen && value.length < minLen) {
      return label + " must be at least " + minLen + " characters (currently " + value.length + ").";
    }
    return "";
  }

  function showError(input, message) {
    const field = input.closest(".field");
    const errorEl = document.getElementById(input.id + "-error");
    if (field) field.classList.toggle("has-error", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (errorEl) errorEl.textContent = message;
  }

  function renderSummary(form, errors) {
    let summary = form.querySelector(".error-summary");
    if (!errors.length) { if (summary) summary.remove(); return; }
    if (!summary) {
      summary = document.createElement("div");
      summary.className = "error-summary";
      summary.setAttribute("role", "alert");
      summary.tabIndex = -1;
      form.prepend(summary);
    }
    summary.innerHTML =
      "<h2>Fix " + errors.length + (errors.length === 1 ? " problem" : " problems") + " to continue</h2><ul>" +
      errors.map((e) => '<li><a href="#' + e.input.id + '">' + e.message + "</a></li>").join("") +
      "</ul>";
    summary.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        document.getElementById(a.getAttribute("href").slice(1)).focus();
      })
    );
    summary.focus();
  }

  /** Attach live validation to a form. Returns { validate() } */
  function attach(form) {
    const inputs = Array.from(form.querySelectorAll("input, select, textarea")).filter(
      (el) => el.id && !el.closest(".honeypot") && el.type !== "hidden" && el.type !== "radio" && el.type !== "checkbox"
    );
    form.noValidate = true; // we show our own accessible messages instead of browser bubbles

    inputs.forEach((input) => {
      // Validate when the user leaves a field, then re-check while they correct it
      input.addEventListener("blur", (e) => {
        // If focus is moving to the submit button, let the submit handler validate.
        // Showing a message here would shift the layout so the click could miss the button.
        if (e.relatedTarget && e.relatedTarget.type === "submit") return;
        if (input.value.trim() !== "" || input.dataset.touched) showError(input, check(input));
        input.dataset.touched = "1";
      });
      input.addEventListener("input", () => { if (input.getAttribute("aria-invalid") === "true") showError(input, check(input)); });
    });

    return {
      validate() {
        const errors = [];
        inputs.forEach((input) => {
          const message = check(input);
          showError(input, message);
          if (message) errors.push({ input, message });
        });
        renderSummary(form, errors);
        return errors.length === 0;
      },
      reset() {
        inputs.forEach((input) => { showError(input, ""); delete input.dataset.touched; });
        renderSummary(form, []);
      }
    };
  }

  return { attach, check };
})();
