# Portfolio Web

An interactive developer portfolio showcasing software engineering projects, technical competencies, and creative digital experiences with high-performance video scroll animations.

## Overview

**Portfolio Web** is a client-side portfolio application featuring interactive canvas-driven frame scrubbing, fluid typography, glassmorphism aesthetics, and modular project showcases. It serves as a visual hub for engineering case studies, full-stack projects, and direct contact integration.

## Features

- **Video Frame Scroll Scrubbing**: Canvas-rendered sequence that scrubs video frames in sync with viewport scroll progression.
- **Projects Showcase**: Interactive catalog featuring live demonstrations, source repositories, and architecture tags.
- **Responsive Layout**: Designed for desktops, tablets, and mobile devices with fluid CSS clamp scaling.
- **Contact Form**: Client-side contact integration with form validation, rate-limiting, and error handling.
- **Pure Web Standards**: Zero heavy framework overhead; built on HTML5, CSS3, and modern ES6+ JavaScript.

## Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3
- **Rendering**: Canvas 2D image sequence rendering
- **Services**: EmailJS client-side SDK for contact delivery

## Architecture

```
Browser Viewport Scroll
         │
         ▼
   js/main.js (Scroll Listener & Canvas Scrubbing Engine)
         │
         ├─► frames/ (Frame Buffer Cache)
         ├─► js/projects.js (Dynamic Project Renderers)
         └─► Contact Form (Client-Side Dispatcher)
```

## Project Structure

```
├── index.html        # Primary landing page and hero canvas
├── projects.html     # Dedicated project gallery page
├── css/
│   ├── style.css     # Main typography, layout, and component styles
│   └── projects.css  # Project grid and modal styles
├── js/
│   ├── main.js       # Core animations, canvas scrubbing, and contact handler
│   ├── projects.js   # Project data rendering and filters
│   └── email.min.js  # EmailJS client SDK
├── frames/           # Optimized animation frame sequence
└── .gitignore        # Git ignore rules
```

## Getting Started

### Prerequisites

A modern web browser.

### Installation & Running

1. Clone the repository:
   ```bash
   git clone https://github.com/vardhan-billakanti/portfolio_web.git
   cd portfolio_web
   ```

2. Open `index.html` in your browser or run a lightweight local static server:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```

## Security

This repository is a client-side static web application. It contains no private keys, database credentials, or server-side secrets.

## Author

**Billakanti Jaya Vardhan**
- GitHub: [@vardhan-billakanti](https://github.com/vardhan-billakanti)
