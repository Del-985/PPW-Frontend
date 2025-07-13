PPW-Frontend/
├── .gitattributes
├── CNAME
├── estimate.html
├── index.html
├── package.json
├── portal.html
├── structure.md
├── admin/
│   ├── admin.html
│   └── admin.css
├── business/
│   ├── dashboard.html
│   └── register.html
├── css/
│   └── styles.css
├── scripts/
│   ├── admin.js
│   ├── contact.js
│   ├── dashboard.js
│   ├── estimate.js
│   ├── login.js
│   ├── register.js
│   └── verifyforzoho.html
└── zohoverify/
    └── verifyforzoho.html



# Repository Structure

This document outlines the structure of the **Pioneer Pressure Washing and Landscaping frontend repository**.

## Root-Level Files
- **.gitattributes** – Git configuration file for handling line endings.
- **CNAME** – Configures the custom domain (`pioneerwashandlandscape.com`) for GitHub Pages.
- **index.html** – Landing page for the public site.
- **estimate.html** – Public-facing page for customers to request free estimates.
- **portal.html** – Business login portal.
- **package.json** – (Present, though not commonly used with static sites) may be used for build or deployment tooling.
- **structure.md** – This documentation file.

---

## HTML Pages

### Public Pages
- `index.html` – Main homepage with service info, gallery, and contact form.
- `estimate.html` – Form to get an estimate on services.

### Business Portal
- `portal.html` – Business login interface.

### Admin
- `admin/admin.html` – Admin dashboard page.

### Business
- `business/register.html` – New business registration form.
- `business/dashboard.html` – Authenticated business user dashboard.

---

## CSS

- `css/styles.css` – Main sitewide stylesheet.
- `admin/admin.css` – Custom styles for admin dashboard.

---

## JavaScript

- `scripts/login.js` – Handles business login POST to backend.
- `scripts/contact.js` – Submits contact form data to the backend.
- `scripts/register.js` – Sends business registration data.
- `scripts/estimate.js` – Estimate form calculation logic.
- `scripts/dashboard.js` – Business dashboard interaction (task loading etc.).
- `scripts/admin.js` – Admin dashboard interaction (contact listing etc.).
- `scripts/verifyforzoho.html` – HTML file for Zoho domain verification (note: should likely be moved to `zohoverify/`).

---

## Miscellaneous

### Zoho Domain Verification
- `zohoverify/verifyforzoho.html` – Used to validate domain ownership with Zoho Mail (referenced in DNS or meta tag).

---

## API Dependencies

Frontend interfaces with:
https://pioneer-pressure-washing.onrender.com


Key endpoints used include:
- `POST /api/business/login`
- `POST /api/business/register`
- `POST /api/contact`
- `GET /api/admin/contacts`
- `GET /api/business/schedule`  
(*and others depending on dashboard interaction scripts*)

---

## Notes

- The project is deployed via **GitHub Pages** (static frontend).
- Backend API is deployed via **Render** (Node.js/Express).
- Custom domain DNS managed through **DreamHost**.
- Email functionality is handled via **Zoho SMTP** with domain verification.
