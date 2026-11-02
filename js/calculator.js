/* =========================================================
   WanderLux — Trip Cost Calculator
   ---------------------------------------------------------
   Formula (all prices in AUD):
     rooms          = ceil(travellers / 2)        (twin share)
     daily spend    = travellers × days × dailyRate × styleMultiplier
     accommodation  = rooms × days × nightlyRate × styleMultiplier
     flights        = travellers × flightRate × flightFactor   (optional)
     insurance      = travellers × days × $9                    (optional)
     total          = sum of the above, rounded to the nearest dollar

   Example from the brief: 2 travellers, Bali, 5 days, Standard
     daily  = 2 × 5 × 135 × 1   = 1,350
     accom  = 1 × 5 × 220 × 1   = 1,100
     total  = 2,450
   ========================================================= */
(function () {
  "use strict";

  /* Preset rates per destination */
  const DESTINATIONS = {
    bali:        { name: "Bali",            code: "DPS", country: "Indonesia",    daily: 135, nightly: 220, flight: 780 },
    kyoto:       { name: "Kyoto",           code: "KIX", country: "Japan",        daily: 190, nightly: 260, flight: 1150 },
    santorini:   { name: "Santorini",       code: "JTR", country: "Greece",       daily: 210, nightly: 300, flight: 1900 },
    paris:       { name: "Paris",           code: "CDG", country: "France",       daily: 220, nightly: 310, flight: 1850 },
    queenstown:  { name: "Queenstown",      code: "ZQN", country: "New Zealand",  daily: 170, nightly: 240, flight: 520 },
    whitsundays: { name: "the Whitsundays", code: "PPP", country: "Queensland",   daily: 150, nightly: 280, flight: 420 }
  };

  /* Travel style multipliers */
  const STYLES = {
    budget:   { label: "Budget",   multiplier: 0.7,  flightFactor: 0.9 },
    standard: { label: "Standard", multiplier: 1.0,  flightFactor: 1.0 },
    luxury:   { label: "Luxury",   multiplier: 1.85, flightFactor: 2.4 }
  };

  const INSURANCE_PER_DAY = 9;

  const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

  /** Pure calculation — no DOM access, so it is easy to test. */
  function estimate({ destination, travellers, days, style, flights, insurance }) {
    const d = DESTINATIONS[destination];
    const s = STYLES[style];
    if (!d || !s) throw new Error("Unknown destination or style");

    const rooms = Math.ceil(travellers / 2);
    const lines = [
      { label: travellers + " × " + days + " days daily spend", amount: travellers * days * d.daily * s.multiplier },
      { label: rooms + (rooms === 1 ? " room" : " rooms") + " × " + days + " nights", amount: rooms * days * d.nightly * s.multiplier }
    ];
    if (flights) lines.push({ label: travellers + " return " + (travellers === 1 ? "flight" : "flights") + " from Melbourne", amount: travellers * d.flight * s.flightFactor });
    if (insurance) lines.push({ label: "Travel insurance", amount: travellers * days * INSURANCE_PER_DAY });

    lines.forEach((l) => (l.amount = Math.round(l.amount)));
    const total = lines.reduce((sum, l) => sum + l.amount, 0);
    return { total, lines, rooms, destination: d, style: s, perPerson: Math.round(total / travellers) };
  }

  /** Sentence in the format required by the brief */
  function summary(r, travellers, days) {
    return "Estimated cost for " + travellers + (travellers === 1 ? " traveller" : " travellers") +
      " to " + r.destination.name + " for " + days + (days === 1 ? " day" : " days") + ": " +
      money.format(r.total) + " – " + r.style.label + " Travel Package.";
  }

  // Expose the pure function for testing in the console: WanderLuxCalc.estimate({...})
  window.WanderLuxCalc = { estimate, summary, DESTINATIONS, STYLES };

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("trip-form");
    if (!form) return;

    const els = {
      destination: form.querySelector("#destination"),
      travellers: form.querySelector("#travellers"),
      days: form.querySelector("#days"),
      flights: form.querySelector("#flights"),
      insurance: form.querySelector("#insurance"),
      ticket: document.getElementById("ticket"),
      empty: document.getElementById("ticket-empty"),
      result: document.getElementById("ticket-result"),
      code: document.getElementById("t-code"),
      city: document.getElementById("t-city"),
      tTravellers: document.getElementById("t-travellers"),
      tDays: document.getElementById("t-days"),
      tStyle: document.getElementById("t-style"),
      total: document.getElementById("t-total"),
      perPerson: document.getElementById("t-pp"),
      note: document.getElementById("t-note"),
      rows: document.getElementById("t-rows"),
      foot: document.getElementById("t-foot"),
      request: document.getElementById("t-request")
    };
    const validator = window.FormValidator.attach(form);
    let hasCalculated = false;

    // Fill the destination list from the data so prices and options never drift apart
    Object.entries(DESTINATIONS).forEach(([key, d]) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = d.name.replace(/^the /, "The ") + ", " + d.country;
      els.destination.appendChild(opt);
    });

    // Allow links such as calculator.html?dest=bali from the home page
    const preset = new URLSearchParams(location.search).get("dest");
    if (preset && DESTINATIONS[preset]) els.destination.value = preset;

    // +/- stepper buttons
    form.querySelectorAll("[data-step]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.target);
        const next = (Number(input.value) || 0) + Number(btn.dataset.step);
        input.value = Math.min(Number(input.max), Math.max(Number(input.min), next));
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });

    function readValues() {
      return {
        destination: els.destination.value,
        travellers: Number(els.travellers.value),
        days: Number(els.days.value),
        style: form.querySelector('input[name="style"]:checked').value,
        flights: els.flights.checked,
        insurance: els.insurance.checked
      };
    }

    function render(values) {
      const r = estimate(values);
      els.empty.hidden = true;
      els.result.hidden = false;
      els.code.textContent = r.destination.code;
      els.city.textContent = r.destination.name.replace(/^the /, "The ");
      els.tTravellers.textContent = values.travellers;
      els.tDays.textContent = values.days;
      els.tStyle.textContent = r.style.label;
      els.total.textContent = money.format(r.total);
      els.perPerson.textContent = money.format(r.perPerson) + " per person";
      els.note.textContent = summary(r, values.travellers, values.days);
      els.rows.innerHTML = r.lines
        .map((l) => '<tr><th scope="row">' + l.label + "</th><td>" + money.format(l.amount) + "</td></tr>")
        .join("");
      els.foot.innerHTML = '<tr><th scope="row">Total estimate</th><td>' + money.format(r.total) + "</td></tr>";
      els.request.href = "appointment.html?trip=" + encodeURIComponent(els.note.textContent);

      // brief highlight so the change is noticed
      els.total.classList.remove("is-updated");
      void els.total.offsetWidth;
      els.total.classList.add("is-updated");
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validator.validate()) return;
      render(readValues());
      hasCalculated = true;
      // On small screens the ticket sits below the form — bring it into view
      if (window.matchMedia("(max-width: 1024px)").matches) {
        els.ticket.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      els.ticket.focus({ preventScroll: true });
    });

    // After the first calculation, keep the result live as preferences change
    form.addEventListener("input", () => {
      if (!hasCalculated) return;
      const ok = ["destination", "travellers", "days"].every((k) => window.FormValidator.check(els[k]) === "");
      if (ok) render(readValues());
    });

    form.addEventListener("reset", () => {
      hasCalculated = false;
      validator.reset();
      els.empty.hidden = false;
      els.result.hidden = true;
    });
  });
})();
