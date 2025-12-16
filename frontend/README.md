# 📦 Logistics & Container Management System

## 1. Sidebar

- Fix sidebar alignment and behavior
- Ensure UI consistency across all modules

---

## 2. Loading Sheet (New)

### Field & Logic Changes

- ❌ Remove **Total Pieces**
- ✅ Add fields from **Summary Sheet**:
  - Date
  - CTN
  - Total Weight
  - CBM
- Disable **item entry** once upper (summary) fields are filled
- Auto-generate **Particular** using **Item No**
- Rename **Mark** → **Shipping Mark**
- Remove **Client**
- Add **CTN Mark** beside Shipping Mark
- Optimize scrolling for wide-width screens

### UI & UX

- Add all required **date fields**
- Adjust fonts (uniform & readable)
- UI must remain **constant**
- Add **Back Button**
  - Keyboard shortcut: **ESC**

---

## 3. Container Overview

### Functional Changes

- Add **Status**
  - `Loaded | In Sea | Delivered`
- Optimize **Search**
- Add **Date Filter**
- ❌ Remove **Pieces**
- ❌ Remove “Totals across visible containers”

### Totals Section

- Total CTN
- Total Weight
- Total CBM

### Other Improvements

- Replace **Sheets** with **Clients Count**
- Download options:
  - PDF
  - Image
  - Excel Export
- Combine **Shipping Mark + CTN Mark** (Preview only)
- Client Summary:
  - Copy button
- ❌ Remove **Send** option

---

## 4. Bifurcation

- ❌ Remove stats section
- Data should follow **Loading Sheet**
- Item name:
  - Dynamic OR
  - Auto-calculated

---

## 5. Packing List

- HSN:
  - Data purpose only
  - ❌ Not shown in Print
- Master Company:
  - **YIWU ZHOULAI TRADING CO., LIMITED**
- Combine **Shipping Mark + CTN Mark** (Preview only)
- Highlight:
  - Total Weight
  - Total CBM
  - Total CTN

---

## 6. Invoice

- HSN:
  - Data only
  - ❌ Not shown in Print

---

## 7. Warehouse Plan

- Fix logic same as **Bifurcation**

---

## 8. New Module – Container Summary

- Flow Position:
  - After **Invoice**
  - Before **Warehouse Plan**
- Exact format as Sheet
- Status:
  - `Loaded | In Sea | Delivered`

---

## 9. Accounts Module

- Client-wise accounting
- Default state: **Empty**
- Fetch by:
  - Container
  - Client
- Add **New Client**
  - From Account
  - To Account

### Special Requirement

- Separate workflow for:
  - **David**
  - **Dineshbhai**
- Direct sheet creation every time a new sheet is required

---

## 10. Clients Master

- Centralized client management

---

## 11. Expense Management

- **Mumbai**
  - Reference: `OCT 25 PAYMENT.xlsx (CONT tab)`
- Container-wise expenses
- Reports:
  - Weekly
  - Monthly
  - Yearly
  - As per available data
- State-wise expense tracking

---

## 12. Client Order Tracker

- Exact behavior like Sheet

---

## 13. Global Announcement

- System-wide announcements

---

## 🔄 System Flow

1. Loading Sheet
2. Bifurcation
3. Packing List
   - Address Master
4. Invoice
   - Address Master
5. Container Summary
6. Warehouse Plan
7. Accounts
   - Main
   - David
   - Dinesh
8. Client Order Tracker
9. Expense
   - Mumbai
   - Ahmedabad
10. Client Master (Lead Management)
11. User Management

- Profile Management

12. Dashboard
13. Employee Performance Tracking
14. Container Progress Record
15. Backups
16. Role-Based Access System

---

## 🚀 Future Pipeline

1. Team Communication (Chat Feature)
2. Attendance Management
3. Dark Mode & UI Improvements
4. WhatsApp Integration
