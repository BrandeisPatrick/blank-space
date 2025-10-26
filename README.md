# Blank Space

> Build AI apps fast — open source alternative to [v0](https://v0.dev), [Lovable](https://lovable.dev), and [Bolt](https://bolt.new).

<p align="center">
  <!-- Optional hero: replace with your own image or keep only the demo GIF below -->
  <!-- <img src="docs/hero.png" alt="Blank Space Hero" width="100%" /> -->
</p>

<p align="center">
  <a href="https://github.com/BrandeisPatrick/blank-space/stargazers">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/BrandeisPatrick/blank-space?logo=github">
  </a>
  <a href="https://github.com/BrandeisPatrick/blank-space/issues">
    <img alt="Issues" src="https://img.shields.io/github/issues/BrandeisPatrick/blank-space">
  </a>
  <a href="https://github.com/BrandeisPatrick/blank-space/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/badge/License-Apache_2.0-blue">
  </a>
  <img alt="Free tier" src="https://img.shields.io/badge/Free%20tier-50%20req%2Fday-brightgreen">
</p>

<p align="center">
  <strong>Try it live:</strong> <a href="https://www.blankspace.build">www.blankspace.build</a>
</p>

---

## ✨ What is Blank Space?

Blank Space is an open-source AI app builder focused on speed and simplicity:
- **Visual flow to app** — create useful AI flows quickly.
- **Composable agents** — orchestrate tools/functions with an extendable core.
- **Bring your own UI** — drop in components or templates you already love.
- **Self-hostable** — run locally or deploy to your favorite platform.

---

## 🎬 Demo

<p align="center">
  <img src="./public/blank-space-demo.gif" width="800" alt="Blank Space Demo">
</p>

---

## 🚀 Quick Start

```bash
# 1) Clone
git clone https://github.com/BrandeisPatrick/blank-space
cd blank-space

# 2) Configure (optional: copy and fill in env values if needed)
cp .env.example .env

# 3) Install & run
npm install
npm run dev
# open http://localhost:5173  (or the port shown in your terminal)
```

---

## 🧪 Testing

Blank Space includes comprehensive automated tests with 75% coverage:

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:sandpack   # Sandpack integration tests
npm run test:browser    # Browser environment tests
npm run test:contracts  # FileOperations contract tests
```

**Test Stats:**
- 16 automated tests
- 100% pass rate
- ~1.3s runtime
- Catches browser-specific bugs and integration issues

**Learn more:** See [Testing Documentation](./docs/testing/TEST_LOG.md) for detailed test information, bug fixes, and coverage improvements.
