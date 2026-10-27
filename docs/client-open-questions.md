# Open Questions & Missing Documentation — Client Questionnaire

Last reviewed against the live catalog, consent templates, checkout logic, and public pages.

## 1. Legal / policy documents (missing entirely)
- [ ] Privacy Policy (no page, no footer link)
- [ ] Terms of Service / Website Terms of Use
- [ ] HIPAA Notice of Privacy Practices
- [ ] Shipping policy — carrier, cold-chain handling, delivery windows, who pays
- [ ] Return / refund policy for medications, labs, and Zoom calls
      (today only the appointment no-show / 24-hour reschedule rule exists)
- [ ] Telehealth state-licensure disclosure — confirm the licensed-state list
      (site currently references Florida and Nevada)

## 2. Consent templates to resolve
15 templates exist; 4 are inactive and look like superseded duplicates.
Confirm they can be retired, or name the current one:

| Inactive template | Active equivalent |
| --- | --- |
| `controlled-medication-consent` | `controlled-substance-consent` |
| `hormone-trt-consent` | `hrt-consent` / `trt-consent` |
| `lab-order-personal-use` (v2) | `lab-order-consent` |
| `telehealth-general` | `telehealth-consent` |

Also needed:
- [ ] Final approved text/PDF for each active consent
- [ ] Is re-consent required annually, or only when the version changes?

## 3. Clinical operations
- [ ] Lab result turnaround time, and who notifies the patient when purchased blood work is complete
- [ ] Standard rejection reasons / wording when labs are disapproved
- [ ] Repeat-lab intervals for peptides, dermatology, ED, and intimacy products
- [ ] Do ED products (Sildenafil / Tadalafil) require labs, intake, or an appointment?
- [ ] Does the pregnancy/fertility acknowledgment apply to all patients, or only hormone/GLP-1 patients?

## 4. Fulfillment and pharmacy
- [ ] Pharmacy assignment for the newest products (ED, dermatology, TopiClick creams)
- [ ] Supplies add-on is a flat $25 today — provide the final per-pharmacy amounts
- [ ] Is a prescription-transfer / pharmacy-communication document needed?

## 5. Contact and business details
- [ ] The contact form is display-only (no email, no database record) — provide the destination inbox,
      or confirm it should be stored as a lead
- [ ] Practice address, phone number, business hours
- [ ] Provider name, license number, and NPI for the telehealth disclosure

## 6. Commercial
- [ ] Tax handling — are medications and labs taxable in FL and NV?
- [ ] Are membership/subscription refills planned? If so, pricing.
- [ ] Cancellation window for orders already approved but not yet shipped

---

### What unblocks once answers arrive
1. Add Privacy, Terms, HIPAA, Shipping, and Refund pages with footer links.
2. Wire the contact form to the backend and notification email.
3. Retire the four duplicate consent templates.
4. Set per-pharmacy supplies pricing and finalize ED/dermatology clinical rules.
