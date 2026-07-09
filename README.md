# BigQuery Release Insights Web Application

An elegant, modern web dashboard built with **Python Flask** and **Vanilla HTML/JS/CSS** that fetches, structures, and displays Google Cloud BigQuery release updates. The application allows users to search, filter, and compile release notes directly into customized Tweet drafts using a built-in Tweet campaign manager.

```
┌────────────────────────────────────────────────────────┐
│               BigQuery Release Insights                │
├────────────────────────────────────────────────────────┤
│  [Total: 84]   [Features: 42]   [Changes: 35]   [🔄]    │
├───────────────┬────────────────────────────────────────┤
│  🔍 Search    │ 📢 July 08, 2026  [FEATURE]         🔗 │
│               │ You can now perform multi-level        │
│  Filters:     │ aggregation in GoogleSQL.              │
│  [ All ]      │ ┌────────────────────────────────────┐ │
│  [ Feature ]  │ │ [ ] Select to Tweet    [🐦 Tweet]  │ │
│  [ Change ]   │ └────────────────────────────────────┘ │
│               │                                        │
│  Campaign:    │ 📢 July 06, 2026  [CHANGE]          🔗 │
│  [3 Selected] │ AdInsightsMMM report is temporarily    │
│  [Compose 🐦] │ disabled for Facebook Ads transfers.   │
└───────────────┴────────────────────────────────────────┘
```

---

## 🎨 Design Philosophy
*   **Slate Dark Mode Aesthetics**: Uses deep, high-contrast dark backgrounds (`#080b11`) paired with smooth cyan and indigo gradients.
*   **Glassmorphism**: Components feature semi-transparent backgrounds with backdrop blur filters (`backdrop-filter: blur(16px)`).
*   **Micro-animations**: Subtle transitions for hover effects, scale transformations, modal entries, and visual status pulse states.
*   **Custom Interface Components**: Includes custom checkboxes, badge states, and a circular progress ring for character count tracking.

---

## 🚀 Key Features

*   **Granular XML Parsing**: Parses individual updates from the `<entry>` content rather than displaying dates as a single blob.
*   **Status Indicators**: Displays the live feed status with pulse indicators showing when updates are checking, completed, or failed.
*   **Advanced Search & Category Filters**: Easily search keywords across categories or toggle category filters (`Feature`, `Change`, `Deprecation`, `General`).
*   **Tweet Campaign Manager**:
    *   Multi-select release updates to compile a combined campaign draft.
    *   Tweet individual items directly.
    *   Real-time character counter showing capacity with a visual, color-changing progress ring (Max 280 characters).
    *   No API keys required — uses secure **Twitter Web Intent redirection**.

---

## 📂 Project Structure

```
agy-cli-projects/
├── app.py                  # Python Flask server (Feed retrieval, proxy, parsing logic)
├── requirements.txt        # Python backend dependencies
├── templates/
│   └── index.html          # Semantic HTML layout and modal dialogs
├── static/
│   ├── css/
│   │   └── style.css       # Core layout, glassmorphism, responsive grids, and animations
│   └── js/
│   │   └── app.js          # Dynamic UI binding, search/filter algorithms, and intent logic
└── README.md               # Project documentation
```

---

## 🛠️ Installation & Setup

### Prerequisites
*   [Python 3.10+](https://www.python.org/downloads/)
*   [uv](https://github.com/astral-sh/uv) (Recommended fast package manager) or standard `pip`

### Step 1: Clone or Navigate to the Directory
```bash
cd "C:\Users\Valerie Lockhart\agy-cli-projects"
```

### Step 2: Set Up Virtual Environment & Dependencies
**Using `uv` (Recommended):**
```bash
uv venv
uv pip install -r requirements.txt
```

**Using Standard `pip`:**
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
```

---

## 💻 Running the Application

Start the Flask server locally:

**Using `uv`:**
```bash
.venv\Scripts\python.exe app.py
```

**Using standard Python:**
```bash
python app.py
```

Once started, open your web browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🔄 How It Works

### Architecture Flow
1.  **Proxying**: When the page loads, the frontend JavaScript makes a call to the local `/api/release-notes` endpoint.
2.  **CORS Bypass**: The Flask backend fetches the RSS Atom XML feed from `docs.cloud.google.com` to bypass browser CORS restrictions.
3.  **Parsing & Mapping**:
    *   The XML contains entries representing dates.
    *   The backend splits those dates' HTML content into individual updates by extracting header segments (`<h3>`).
    *   These items are structured as JSON and returned to the client.
4.  **UI Updates**: The client JavaScript handles layout mapping, filters, selection states, and formatting.
5.  **Twitter Integration**: Translates selected card arrays into pre-formatted, character-constrained drafts. When posting, it invokes:
    `https://twitter.com/intent/tweet?text=<payload>` to safely delegate the tweet to the user's Twitter/X account.
