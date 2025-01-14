# BookMyDev: Connect with Developers for Your Projects

![BookMyDev Banner](https://via.placeholder.com/1200x400.png?text=BookMyDev)

## 🚀 Overview
**BookMyDev** is an innovative platform that connects clients with developers to streamline project collaboration, scheduling, and secure payments. Built with **Next.js**, **Firebase**, and **shadcn**, this platform ensures smooth and transparent interactions between clients and developers.

---

## 🌟 Key Features

- **Developer-Client Matching**: Match clients with developers based on skills and expertise.
- **Scheduling System**: Book time slots for chats or video conferences.
- **Real-Time Communication**: 
  - Instant chat system.
  - Integrated video conferencing.
- **Secure Payment System**: 
  - Integrated with crypto wallets like MetaMask and Trust Wallet.
  - Developers can request task-based funding directly in chat.
- **Task-Based Funding**: 
  - Ensure transparency and clarity about project expenses.

---

## 🔥 Project Highlights

- **Frontend**: Next.js for a seamless, responsive UI.
- **Backend**: Firebase for authentication, Firestore, and cloud functions.
- **Styling**: Shadcn for modern and accessible UI components.
- **Security**: Custom Firestore rules to ensure secure data handling.

---

## ⚡ Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    function isValidDate(date) {
      return date is string && date.size() > 0;
    }
    function isValidAmount() {
      return request.resource.data.amount is number && 
             request.resource.data.amount > 0 &&
             request.resource.data.amount <= 100000;
    }
    function isValidWalletData() {
      return request.resource.data.type in ['MetaMask', 'Trust Wallet', 'Phantom'] &&
             request.resource.data.address is string &&
             request.resource.data.address.size() >= 10 &&
             request.resource.data.chain is string &&
             request.resource.data.label is string &&
             request.resource.data.label.size() <= 50 &&
             request.resource.data.userId == request.auth.uid;
    }
    function isValidBookingData() {
      let data = request.resource.data;
      return data.keys().hasAll([
        'userId', 
        'developerId', 
        'date', 
        'timeSlot', 
        'duration', 
        'totalCost', 
        'status', 
        'paymentStatus', 
        'createdAt'
      ]) &&
      data.userId is string &&
      data.developerId is string &&
      data.duration > 0 &&
      data.duration <= 4 &&
      data.totalCost >= 0 &&
      data.status in ['confirmed', 'cancelled', 'completed'] &&
      data.paymentStatus in ['pending', 'completed'] &&
      isValidDate(data.date) &&
      isValidDate(data.createdAt);
    }
    function isValidTimeSlot() {
      let slot = request.resource.data.timeSlot;
      return slot.keys().hasAll(['start', 'end']) &&
             slot.start is string &&
             slot.end is string;
    }
    match /users/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
      match /wallets/{walletId} {
        allow read, write: if isAuthenticated() && isOwner(userId);
      }
      match /transactions/{transactionId} {
        allow read, write: if isAuthenticated() && isOwner(userId);
      }
    }
    match /bookings/{bookingId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if false;
    }
    match /chats/{chatId} {
      allow read, write: if true;
    }
    match /services/{serviceId} {
      allow read: if true;
      allow create: if isAuthenticated() && 
        request.resource.data.developerId == request.auth.uid;
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated() && 
        resource.data.developerId == request.auth.uid;
    }
    match /devMeet/{developerId} {
      allow read, write: if request.auth != null && (request.auth.uid == resource.data.userId || request.auth.token.admin == true);
    }
  }
}
```

---

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/BookMyDev.git
   cd BookMyDev
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

> **Note**: Firebase configuration and tokens are hardcoded in the project for simplicity. Ensure to replace these with your own Firebase project details.

---

## 🎨 File Structure

```plaintext
app/
├── Developers/
│   ├── [booking]/
│   │   └── page.jsx
│   ├── EditService/
│   ├── FAQ/
│   ├── ListService/
│   ├── ManageWallet/
│   ├── PrivacyPolicy/
│   ├── SignIn/
│   ├── TermsOfService/
│   ├── WorkDashboard/
│   ├── YourBookings/
|   ├── layout.js
|   └── page.js
├── components/
│   └── ui/
│       ├── BecomeDeveloperDialog.jsx
│       ├── ChatComponent.jsx
│       ├── Footer.jsx
│       ├── Nav.jsx
│       ├── NavbarSkeleton.jsx
│       ├── VideoConference.jsx
│       ├── WalletSkeleton.jsx
│       └── theme-provider.js
├── public/
│   └── favicon.ico
└── styles/
    └── globals.css
```

---

## ✨ Contributing
We welcome contributions! Please fork this repository, create a feature branch, and submit a pull request.

---

## 💬 Contact
For queries, contact us at [support@bookmydev.com](sushanshetty1470@gmail.com).

---

Enjoy connecting with developers seamlessly using **BookMyDev**! 🎉
