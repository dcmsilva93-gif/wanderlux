# WanderLux Travel Agency — website

ICT502 Assessment 2 — Individual Coding Project. A responsive six-page static website built with HTML5, CSS3 and vanilla JavaScript (no frameworks).

## Pages

| File | Page |
|---|---|
| `index.html` | Home: rotating destination banner, introduction, popular packages |
| `services.html` | Destinations & services, with a category filter |
| `calculator.html` | Trip cost calculator |
| `appointment.html` | Appointment request form |
| `about.html` | About us: story, mission, values, consultants |
| `contact.html` | Contact details, map and contact form |

## Folder structure

```
css/style.css        all styles (design tokens, layout, components, responsive rules)
js/config.js         settings, including the email address for the forms
js/main.js           navigation, banner, scroll animations, services filter
js/validation.js     reusable accessible form validation
js/calculator.js     trip cost formula and result display
js/forms.js          sends the appointment and contact forms by email
images/              original SVG illustrations, avatars, favicon
fonts/               self-hosted web fonts (Bricolage Grotesque, Figtree — SIL Open Font License)
```

## Run locally

Open `index.html` in a browser, or serve the folder (recommended):

```
python -m http.server 8000
```

then visit http://localhost:8000.

## Turn on email sending (one-time)

1. Open `js/config.js` and replace `your-email@example.com` with the inbox that should receive enquiries.
2. Deploy the site (below), then submit the contact form once.
3. FormSubmit emails that inbox an activation link. Click **Activate Form**.
4. From then on, every contact and appointment submission arrives as an email.

Until step 1 is done, the forms open the visitor's email app with the message pre-filled instead.

## Deploy to GitHub Pages

1. Create a public repository on GitHub, for example `wanderlux`.
2. Upload the contents of this folder (so `index.html` is at the top level of the repository), or push with Git:
   ```
   git init
   git add .
   git commit -m "WanderLux website"
   git branch -M main
   git remote add origin https://github.com/<your-username>/wanderlux.git
   git push -u origin main
   ```
3. In the repository, go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, and select **Save**.
4. After a minute the site is live at `https://<your-username>.github.io/wanderlux/`.

## Calculator formula

```
rooms         = ceil(travellers / 2)
daily spend   = travellers × days × daily rate × style multiplier
accommodation = rooms × days × nightly rate × style multiplier
flights       = travellers × flight rate × flight factor     (optional)
insurance     = travellers × days × $9                        (optional)
```

Style multipliers: Budget 0.7, Standard 1.0, Luxury 1.85 (flight factors 0.9 / 1.0 / 2.4).
Example from the brief: 2 travellers, Bali, 5 days, Standard → $2,450.
