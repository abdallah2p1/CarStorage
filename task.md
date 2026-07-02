# CMS Dashboard & VTSCLOUD API Connection Tasks

Use this checklist to track your implementation progress. Follow these steps to connect the dynamic configurations and the VTSCLOUD XML API to your website.

---

## 📅 Initial Setup

- [x] Create core configuration structure (`src/app/utils/config.ts`) _[Completed]_
- [x] Create API XML parsing & Mock engine (`src/app/utils/api.ts`) _[Completed]_

---

## 🎨 Update `src/app/App.tsx`

### 1. State & Imports
- [ ] Add imports at the top of the file:
  - `getConfig`, `saveConfig`, `addSearchLog`, `clearSearchLogs`, `AppConfig` from `./utils/config`
  - `lookupVehicle`, `TowedVehicleDetails` from `./utils/api`
  - Additional Lucide icons: `Settings`, `LogOut`, `Trash2`, `Plus`, `Shield`, `Database`, `Activity`, `RefreshCw`
- [ ] Add `"admin"` to the `Page` type: `type Page = "home" | "search" | "faq" | "admin";`
- [ ] Initialize `config` state using `getConfig()` in `App` component.
- [ ] Initialize `searchResults` and auth states (`authSuccess`, `showAuthModal`).

### 2. Connect Dynamic Content
- [ ] Update `Header` component to accept `companyName` and dynamic navigation switch.
- [ ] Update `Footer` component to read name, phone, address, and license codes from `config`.
- [ ] Update `HomePage` to read required documents, business hours, company details, and hours notice from `config`.
- [ ] Update `FAQPage` to map questions from `config.faqs` dynamically.

### 3. Implement Admin PIN Gate
- [ ] Build the `AdminAuthModal` component to prompt for a passcode (`config.api.adminPin` which defaults to `1234`).
- [ ] Add a page change interceptor function to open the auth modal if page is set to `admin` and user is not yet logged in.

### 4. Create the CMS Dashboard UI
- [ ] Build `CmsDashboard` component with the following tab panels:
  - **Analytics Tab**: Show total lookups count, success rate, and list recent lookup queries from `config.logs` in a table.
  - **Company Profile Tab**: Build forms to edit company name, phone, address, and license codes.
  - **Business Hours Tab**: Edit times and set days as open/closed.
  - **Documents & FAQ Tab**: Build lists to add and delete required documents and FAQs.
  - **API Settings Tab**: Toggle between `mock`, `dev`, and `prod` modes, configure API `appID`, customize Admin PIN, and test mock responses.

### 5. Upgrade Lookup UI & XML Integration
- [ ] Update SearchWidget to call `lookupVehicle` on submit.
- [ ] Add multi-vehicle selection cards when search results return more than 1 vehicle (e.g. when searching for `COOLDUDE`).
- [ ] Create `VehicleDetailsView` to render selected vehicle properties:
  - Detailed line-item charges table showing Storage Fees, Towing Fees, etc.
  - Compliance messages (`legalDetails`) and Wrecker info.
  - Balance details with subtotal, discount total, tax amount, and total balance due.

---

## 🧪 Testing & Verification

- [ ] Verify TypeScript compiles with no errors (`npm run build`).
- [ ] Verify you can log into the Admin panel using PIN `1234`.
- [ ] Edit the company name in settings and verify it changes instantly in the Header and Footer.
- [ ] Add a new FAQ in settings and verify it displays on the FAQ page.
- [ ] Search for `COOLDUDE` in Mock Mode and verify that you can select between 2 different vehicles and view itemized bills.
