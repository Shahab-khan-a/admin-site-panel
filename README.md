# Ajeer Notice Verification & Admin Panel (أجير - التحقق من تصريح أجير)

This project is a 100% pixel-perfect clone of the official Qiwa Ajeer Notice Verification portal (`https://ajeer.qiwa.sa/notice-verification/...`) with a dedicated, interactive, and beautifully designed **Admin Panel** at `/admin`.

## Features
- **Pixel-Perfect Verification Page (`/` and `/notice-verification/[token]`)**:
  - Matches the exact design, typography (Frutiger Arabic fonts, icomoon icons), borders, padding, headers, footers, and official government branding.
  - Fully responsive across mobile, tablet, and desktop screens with RTL (Right-to-Left) Arabic support.
  - Zero hydration issues or warnings.
- **Interactive Admin Panel (`/admin`)**:
  - **Visual & Color Consistency**: Designed with the official Qiwa / Ajeer color palette (forest green `#1f6f55`, deep navy `#1f2548`, clean slate cards).
  - **Full Editability**: Every single piece of data is editable:
    - **بيانات التصريح (Notice Details)**: رقم التصريح, نوع التصريح, تاريخ البداية, تاريخ النهاية.
    - **بيانات العامل (Worker Details)**: اسم العامل, رقم الإقامة/الهوية, الجنسية, المهنة, الجنس, تاريخ الميلاد.
    - **بيانات المنشأة (Facility Details)**: رقم المنشأة, اسم المنشأة.
    - **الحالة والتحقق (Status & Verification)**: ساري / فعال (أخضر) أو منتهي / ملغي (أحمر), رسالة التحقق.
  - **Live Real-Time Preview**: Displays the exact permit document preview updating live as you type.
  - **Instant Synchronization**: Any edits saved in `/admin` immediately reflect on the main verification page across all devices and tabs.
  - **One-Click Reset**: Easily restore the original reference permit data at any time.

## Quick Links
- **Main Verification Page**: [http://localhost:3000](http://localhost:3000)
- **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Direct Link**: [http://localhost:3000/notice-verification/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXJ2aWNlIjoidGVtcHdvcmsiLCJpZCI6IjU4NjYzMyIsImlhdCI6MTc5MDYwNjU4OSwic3RhdHVzIjoidmFsaWQiLCJzdGFydF9hdCI6IjIwMjYtMDktMjciLCJlbmRfYXQiOiIyMDI2LTEwLTI3In0.TWyC975AO9yNCA4yBdnMjk_HDJbgar9xGlg2oGDi2IA](http://localhost:3000/notice-verification/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXJ2aWNlIjoidGVtcHdvcmsiLCJpZCI6IjU4NjYzMyIsImlhdCI6MTc5MDYwNjU4OSwic3RhdHVzIjoidmFsaWQiLCJzdGFydF9hdCI6IjIwMjYtMDktMjciLCJlbmRfYXQiOiIyMDI2LTEwLTI3In0.TWyC975AO9yNCA4yBdnMjk_HDJbgar9xGlg2oGDi2IA)
