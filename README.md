# ResearchTree: Collaborative D3 Tree with Firebase

ResearchTree is a web‑based research roadmap tool that allows multiple users to build and manage hierarchical research trees in real time. It features dynamic node editing, drag‑and‑drop reordering, version history, and export capabilities.

## Table of Contents

* [Features](#features)
* [Prerequisites](#prerequisites)
* [Setup](#setup)
* [Configuration](#configuration)
* [Usage](#usage)
* [Folder Structure](#folder-structure)
* [Deployment](#deployment)
* [License](#license)

## Features

* Add, edit, and delete nodes dynamically
* Drag and drop to reorganize the tree structure
* Email‑based authentication and access control
* Admin panel for approving edit requests
* Real‑time synchronization with Firebase Firestore
* Version history with revert capability
* Export tree as PNG or PDF

## Prerequisites

* A Firebase project with Firestore and Authentication enabled
* A modern web browser (Chrome, Firefox, Edge, Safari)

## Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/researchtree.git
   cd researchtree
   ```

2. **Start a local web server**
   You can use Python’s built‑in server:

   ```bash
   python3 -m http.server 8000
   ```

3. **Open the app**
   Navigate to `http://localhost:8000` in your browser.

## Configuration

1. Copy your Firebase project settings into `firebase-config.js`:

   ```js
   // firebase-config.js
   const firebaseConfig = {
     apiKey: "<YOUR_API_KEY>",
     authDomain: "<YOUR_AUTH_DOMAIN>",
     projectId: "<YOUR_PROJECT_ID>",
     // …other settings…
   };

   // Initialize Firebase
   firebase.initializeApp(firebaseConfig);
   const auth = firebase.auth();
   const db   = firebase.firestore();
   ```

2. The admin email is set in `script.js`:

   ```js
   const ADMIN_EMAIL = "your.admin@example.com";
   ```

## Usage

* **Sign up** or **log in** with your email and password.
* Admins will see an “Admin Panel” button and can approve or revoke edit access.
* Regular users can request edit access, which the admin can grant.
* Click on any node to open the edit modal: rename, add notes or link, add child nodes, move, or delete.
* Use the **Download PNG** or **Download PDF** buttons to export your tree.
* Revert to earlier versions using the version history dropdown.

## Folder Structure

```
researchtree/
├── index.html
├── style.css
├── script.js
├── firebase-config.js
└── images/
    └── logo.png
```

## Deployment

This is a static front‑end app. You can host it on any static‑site provider, such as:

* GitHub Pages
* Netlify
* Firebase Hosting

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
