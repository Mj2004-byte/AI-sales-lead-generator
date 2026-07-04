# AI Sales Lead Generator — MVP

A premium, interactive Single Page Application (SPA) designed to build high-converting B2B sales outreach pipelines. The application uses the **Groq API** (powered by the `llama-3.3-70b-versatile` model) to search for companies, identify key decision-makers, calculate relevance scores, and draft personalized cold email campaigns.

## Key Features

- **Lead Targeting**: Search by industry/niche, target location, and decision-maker roles.
- **Outreach personalization**: Enter your own product value proposition, and the AI will draft highly customized cold outreach copy tailored to the lead's profile.
- **AI Scoring Engine**: Categorizes leads into **Hot**, **Warm**, or **Cool** categories with circular gauge visualizers and detailed AI scoring reasoning.
- **Email Copy Editor**: Review, edit, and copy personalized cold outreach drafts directly from the lead detail drawer.
- **Local Simulation Fallback**: Seamlessly switches to local simulations if no API key is provided, making the app immediately interactive and runnable out-of-the-box.
- **Data Exporting**: Download all enriched leads directly into a UTF-8 CSV spreadsheet compatible with Excel and Google Sheets.
- **Premium Glassmorphism Design**: Sleek dark mode visual theme with micro-animations, skeleton loaders, and console-style loading trackers.

## Project Structure

```
├── index.html        # Main dashboard and modal layout structures
├── style.css         # Dark theme style guidelines and keyframe animations
├── app.js            # Frontend view state controllers and event bindings
├── generator.js      # Groq API client queries and Simulated Lead Engine
└── README.md         # Project documentation
```

## Getting Started

### Local Setup
1. Clone this repository:
   ```bash
   git clone https://github.com/Mj2004-byte/AI-sales-lead-generator.git
   cd AI-sales-lead-generator
   ```
2. Start a local server:
   * **Python**: `python -m http.server 8000`
   * **Node**: `npx serve`
3. Open **`http://localhost:8000`** in your browser.

### Configuring API Key
- By default, the application is pre-loaded with your Groq API Key.
- You can manage or clear your key at any time by clicking the **Settings Gear** icon in the top right corner.
