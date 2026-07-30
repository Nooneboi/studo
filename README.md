# Study Ledger — how to publish it

Everything here is free — no card, no paid plan. You'll use GitHub's
website only (no commands, no terminal).

## What's in this folder

```
index.html        Home page
quiz.html          Practice page (loads quizzes from /data)
resources.html     Resources page — edit the list directly in this file
builder.html        Your private quiz-builder tool (don't share this link)
manifest.json, sw.js  Make the site installable + work offline
css/style.css       All the styling
js/                 The code that runs each page
data/               Quiz JSON files live here + index.json lists them
icons/              App icons
```

## Step 1 — Create a free GitHub account
Go to github.com → Sign up → confirm your email. That's it, no payment info needed.

## Step 2 — Create a repository (a project folder on GitHub)
1. Click the **+** in the top-right → **New repository**.
2. Name it something like `study-ledger`.
3. Set it to **Public** (so the link works for anyone).
4. Leave everything else as default → **Create repository**.

## Step 3 — Upload this site
1. On your new (empty) repo page, click **uploading an existing file**.
2. Drag every file and folder from this project into the upload box
   (yes, you can drag whole folders like `css/`, `js/`, `data/`, `icons/`).
3. Scroll down → **Commit changes**.

## Step 4 — Turn on GitHub Pages
1. In your repo, go to **Settings** → **Pages** (left sidebar).
2. Under "Build and deployment" → Source: **Deploy from a branch**.
3. Branch: **main**, folder: **/ (root)** → **Save**.
4. Wait about a minute, then refresh — GitHub shows your live link at
   the top, something like:
   `https://yourusername.github.io/study-ledger/`

That link is what you send to learners. It works forever, for free,
and after their first visit it keeps working offline too.

## Step 5 — Bookmark your Builder page for yourself
Your private editing tool lives at:
`https://yourusername.github.io/study-ledger/builder.html`

Don't put this link in anything you share publicly — it has no
password, it's just "not listed" anywhere. (If you want it fully
hidden later, we can talk about a simple password gate.)

## How to add a new quiz (do this whenever you want to publish one)
1. Open your **Builder** page.
2. Fill in the quiz title, description, and questions.
3. Click **Download quiz JSON** — this saves a `.json` file to your
   computer.
4. Go to your GitHub repo → open the `data` folder → **Add file** →
   **Upload files** → upload that `.json` file.
5. Open `data/index.json` in the repo (click it, then the pencil/edit
   icon) and add an entry for your new quiz, e.g.:
   ```json
   {
     "file": "your-new-quiz.json",
     "title": "Your Quiz Title",
     "description": "One line about it"
   }
   ```
   (Don't forget the comma between entries if there's more than one.)
6. Commit changes. Give it a minute — the new quiz now shows up on
   the Practice page for everyone with the link.

## How to edit the Home or Resources page text
Those are plain text inside `index.html` and `resources.html`. Open
the file in GitHub (pencil icon to edit), change the words between
the `<p>` and `<h1>` tags, and commit. No code knowledge required
beyond "don't delete the `<...>` tags."

## What learners can and can't do
- They **can**: answer questions, change their answers, delete
  (hide) questions they've mastered, highlight text, and take notes
  — all saved automatically to their own device.
- They **can't**: send anything back to you, or affect what other
  learners see. Every learner's copy is independent and private to
  them.

## If you want to update the design or add features later
Everything is plain HTML/CSS/JavaScript with comments explaining
each part — bring this whole folder back to a fresh conversation
and describe what you want changed.
