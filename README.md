# 🎃 Costume Contest Voting

A tiny, no-build web app for running a live costume contest at a party. Put the TV screen up, guests scan a QR code with their phones and vote in each category, and the results stay secret until the host closes voting, then get revealed on the TV.

Hosted for free on **GitHub Pages**, with votes stored in a free **Firebase Realtime Database**. The UI ships in Spanish (*Concurso de Disfraces*), and it's easy to translate.

## Features

- 📺 **TV screen** with a QR code, live "people have voted" counter, and big **Open / Close voting** buttons
- 🤫 **Secret results** while voting is open, revealed with an animation when voting closes
- 📱 **Phone ballot**: type a name per category (any can be skipped), with tap-to-fill suggestions so spellings match
- 🔤 Names match regardless of case, extra spaces and accents (`maria lopez` = `María López`)
- 🗳️ **One vote per phone**, enforced by the page *and* by database rules; no voting after close
- 🧪 **Demo mode** works with zero setup (syncs between tabs in one browser), handy for trying it out
- No build step, no server, no dependencies to install: four static files

## How it works

```
 Phones (vote.html) ──write──►  Firebase Realtime Database  ◄──listen── TV (index.html)
                                 party2026/
                                   state/open   (true/false)
                                   votes/<phone-id>/<category> = "Name"
```

| File | Purpose |
|---|---|
| `index.html` | TV screen: QR code, voter count, open/close buttons, results reveal |
| `vote.html` | Phone ballot |
| `config.js` | **Your settings**: Firebase config, allowed hosts, title, categories |
| `store.js` | Database connection, demo mode, vote counting |

## Set up your own (about 15 minutes)

### 1. Copy the repo
Click **Fork** (or **Use this template**) on GitHub to get your own copy.

### 2. Create a Firebase database
1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (Analytics can be off).
2. **Build → Realtime Database → Create database** → start in **locked mode**.
3. Open the **Rules** tab, paste this, and click **Publish**:
   ```json
   {
     "rules": {
       "party2026": {
         ".read": true,
         "state": { ".write": true },
         "votes": {
           ".write": "!newData.exists()",
           "$voter": {
             ".write": "!data.exists() && root.child('party2026/state/open').val() !== false"
           }
         }
       }
     }
   }
   ```
4. **Project settings (⚙️) → General → Your apps → `</>` (Web)** → register an app (skip Firebase Hosting) → copy the `firebaseConfig` values. Make sure it includes `databaseURL`. If it doesn't, copy the URL shown on the Realtime Database **Data** tab.

### 3. Edit `config.js` ⚠️ required
Replace **both** of these with your own values:
```js
export const FIREBASE_CONFIG = { /* your values from step 2.4 */ };
export const LIVE_HOSTS = ["<your-username>.github.io"];
```
> **Why `LIVE_HOSTS`?** It lists the websites allowed to use the database in `FIREBASE_CONFIG`. On any other site the app falls back to demo mode, so a copy that still has someone else's settings can't write into their database by accident. If your site stays in demo mode, check the browser console for a message explaining why.

Optionally change `TITLE` and `CATEGORIES` (the **last** category is the grand prize; keep each `id` short with no spaces).

### 4. Turn on GitHub Pages
Repo **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save**. After a minute or two your site is live at:
```
https://<your-username>.github.io/<repo-name>/
```

### 5. Test it
Open the site, click **Abrir votación**, scan the QR with your phone, vote, then click **Cerrar votación** to see the reveal. Clear test votes with the faint ⚙︎ (bottom-right) → **Borrar todos los votos**.

## Running the party

1. Open your site on the TV (or a laptop connected via HDMI) and press **F** for fullscreen.
2. Click **Abrir votación**. Guests scan and vote; the TV shows only how many people have voted.
3. Click **Cerrar votación** → confirm. Phones lock and the 🏆 results appear.

| Control (TV) | Action |
|---|---|
| **Abrir votación** / **Cerrar votación** | Open voting / close voting and reveal results |
| **V** key | Toggle voting |
| **F** key | Fullscreen |
| ⚙︎ → Borrar todos los votos | Delete all votes |

## Customizing

- **Categories, title:** `config.js`
- **Language:** the visible text lives in `index.html` and `vote.html`; search for the Spanish strings and replace them
- **Colors/fonts:** the `:root` CSS variables at the top of each HTML file
- **New contest:** change `ROOT` in `config.js` (e.g. `party2027`) **and** the matching name in your database rules

## Run locally

```bash
python3 -m http.server 8000
```
Then open http://localhost:8000. Locally the app runs in demo mode (votes sync between tabs of the same browser) unless you add `"localhost"` to `LIVE_HOSTS`.

## Security & privacy: please read

This is built for a friendly party, not an election.

- **Votes are publicly readable** by anyone who knows your database address (it's in `config.js`). Don't collect anything sensitive, and delete the data afterwards.
- **"One vote per phone" isn't one vote per person.** A private tab or another browser can vote again.
- **The host controls aren't password-protected.** Anyone who opens the TV page (the QR link minus `vote.html`) could close voting or wipe the votes. Don't share the TV link.
- `LIVE_HOSTS` prevents **accidental** reuse of a database by copies of this repo. It can't stop someone who deliberately writes to your database. For that, enable [Firebase App Check](https://firebase.google.com/docs/app-check) and/or add sign-in for the host.
- The Firebase web `apiKey` is not a secret; access is controlled by your database rules.

## After the party

- Delete votes: ⚙︎ → Borrar todos los votos, or Firebase console → Realtime Database → Data → delete `party2026`.
- Take the site down: Settings → Pages → Branch → **None**.
- Remove everything: Firebase → Project settings → **Delete project**.

## License

[MIT](LICENSE)
