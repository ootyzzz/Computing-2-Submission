# Computing 2 Coursework Submission.

**CID**: 02376158  
**Name**: Feifan Xia

---

# Setup & Run

**Dependencies:**

- All dependencies are managed by npm. In the project root, run:

```sh
npm install
```

- This will install all required packages, including `mocha` for testing.

**Run the Web Application:**

- From the VSCode sidebar, go to **Run and Debug** and select **Run Web App** to start the application.
- **Terminal equivalent:**
  - need to add

---

# Game Guide

- Click a cell to make your move. Each move determines the next zone for your opponent.
- Win a small board to claim that zone. Win three zones in a row to win the game!
- Enable **AI** on the right to play against the computer. The AI "brain" bar shows its strength.
- Use **Undo**, **Random Move**, or **New Game** at any time.
- Player stats and Elo are tracked on both sides.
- Click the **?** button in the lower left for help at any time.

---

# Checklist

### Game Module – API

- [x] Include a `.js` module file in `/web-app` containing the API using `jsdoc`.
- [x] Update `/jsdoc.json` to point to this module in `.source.include` (line 7)
- [x] Compile jsdoc using the run configuration `Generate Docs`
- [x] Check the generated docs have compiled correctly.

### Game Module – Implementation

- [x] The file above should be fully implemented.

### Unit Tests – Specification

- [x] Write unit test definitions in `/web-app/tests`.
- [x] Check the headings appear in the Testing sidebar.

### Unit Tests – Implementation

- [x] Implement the tests above.

### Web Application

- Implement in `/web-app`
  - [x] `index.html`
  - [x] `default.css`
  - [x] `main.js`
  - [x] `UltimateTTT.js`
  - [x] `Stats.js`
  - [x] `ramda.js`

### Finally

- [ ] Push to GitHub.
- [ ] Sync the changes.
- [ ] Check submission on GitHub website.

---

# TODO

- [ ] Refactor for better functional programming and more Ramda usage (eliminate remaining `for` loops, use Ramda combinators).
- [ ] Fix all jslint errors (expand all `if` returns to block style, remove imperative code from logic files).
- [ ] Ensure all pure logic is in the game module, not in UI.
- [ ] Add more tests.
- [ ] Improve accessibility (keyboard navigation, ARIA labels).
- [ ] Polish UI and add more tests if needed.
