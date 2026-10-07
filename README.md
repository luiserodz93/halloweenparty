# 🎃 Costume Contest Voting

A tiny, no-build web app for running a live costume contest at a party. Put the TV screen up, guests scan a QR code with their phones and vote in each category, and the results stay secret until the host closes voting, then get revealed on the TV.

Hosted for free on **GitHub Pages**, with votes stored in a free **Firebase Realtime Database**. The UI ships in Spanish (*Concurso de Disfraces*), and it's easy to translate.

## Features

- 📺 **TV screen** with a QR code, live "people have voted" counter, and big **Open / Close voting** buttons
- 🔒 **Host sign-in with Google**: only the host's account can open/close voting or reset votes (enforced by database rules); guests who open the TV page see no controls
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
                                   state/open   (host only)
                                   votes/<phone-id>/<category> = "Name"
```

| File | Purpose |
|---|---|
| `index.html` | TV screen: QR code, voter count, host sign-in, open/close buttons, results reveal |
| `vote.html` | Phone ballot |
| `config.js` | **Your settings**: Firebase config, allowed hosts, title, categories |
| `store.js` | Database connection, host sign-in, demo mode, vote counting |

## Set up your own (about 20 minutes)

### 1. Copy the repo
Click **Fork** (or **Use this template**) on GitHub to get your own copy.

### 2. Create a Firebase project and database
1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (Analytics can be off).
2. **Build → Realtime Database → Create database** → start in **locked mode**.
3. **Project settings (⚙️) → General → Your apps → `</>` (Web)** → register an app (skip Firebase Hosting) → copy the `firebaseConfig` values. Make sure it includes `databaseURL`. If it doesn't, copy the URL shown on the Realtime Database **Data** tab.

### 3. Turn on Google sign-in for the host
1. **Build → Authentication → Get started**.
2. **Sign-in method** tab → **Add new provider → Google** → **Enable** → set a public-facing name (shown in the Google pop-up) and a support email → **Save**. You can ignore the note about Android SHA-1 fingerprints.
3. **Settings** tab → **Authorized domains → Add domain** → `<your-username>.github.io` (no `https://`, no path).

### 4. Publish the database rules
**Realtime Database → Rules**, paste this, replace **all three** `YOUR_GMAIL@gmail.com` with the host's Google address (lowercase), and click **Publish**:
```json
{
  "rules": {
    "party2026": {
      ".read": true,
      "state": {
        ".write": "auth != null && auth.token.email_verified == true && auth.token.email == 'YOUR_GMAIL@gmail.com'"
      },
      "hostcheck": {
        ".write": "auth != null && auth.token.email_verified == true && auth.token.email == 'YOUR_GMAIL@gmail.com'"
      },
      "votes": {
        ".write": "!newData.exists() && auth != null && auth.token.email_verified == true && auth.token.email == 'YOUR_GMAIL@gmail.com'",
        "$voter": {
          ".write": "!data.exists() && root.child('party2026/state/open').val() !== false"
        }
      }
    }
  }
}
```
What these do: anyone can read; only the host can open/close voting or wipe votes; each phone can submit exactly one ballot, and only while voting is open. The host's email lives only in the rules (which aren't public), not in the repo. `hostcheck` is how the TV confirms the signed-in Google account is really the host.

### 5. Edit `config.js` ⚠️ required
Replace **both** of these with your own values:
```js
export const FIREBASE_CONFIG = { /* your values from step 2.3 */ };
export const LIVE_HOSTS = ["<your-username>.github.io"];
```
> **Why `LIVE_HOSTS`?** It lists the websites allowed to use the database in `FIREBASE_CONFIG`. On any other site the app falls back to demo mode, so a copy that still has someone else's settings can't write into their database by accident. If your site stays in demo mode, check the browser console for a message explaining why.

> **Check the `apiKey`** is the full 39-character value. Some apps mask keys with `•••` dots when displaying them; if yours got masked, copy it again from Firebase → Project settings → General → **Web API key**. Sign-in fails with `auth/api-key-not-valid` if the key is wrong.

Optionally change `TITLE` and `CATEGORIES` (the **last** category is the grand prize; keep each `id` short with no spaces).

### 6. Turn on GitHub Pages
Repo **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save**. After a minute or two your site is live at:
```
https://<your-username>.github.io/<repo-name>/
```

### 7. Test it
1. Open the site and click **🔒 Anfitrión** → sign in with the host's Google account. The buttons appear (the browser stays signed in).
2. Click **Abrir votación**, scan the QR with your phone, and vote.
3. Click **Cerrar votación** to see the reveal.
4. Clear test votes: ⚙︎ (bottom-right) → **Borrar todos los votos**.

### 8. Optional: restrict the API key to your site
In [Google Cloud → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials), select your Firebase project, open **Browser key (auto created by Firebase)** → **Application restrictions → Websites** → add:
```text
https://<your-username>.github.io/*
https://<your-project-id>.firebaseapp.com/*
```
→ **Save**. The second entry is required because Google sign-in runs on that domain. Changes can take a few minutes to apply. Do this after sign-in works, so you can tell which change broke something if anything does.

## Running the party

1. Open your site on the TV (or a laptop connected via HDMI), make sure you're signed in as host, and press **F** for fullscreen.
2. Click **Abrir votación**. Guests scan and vote; the TV shows only how many people have voted.
3. Click **Cerrar votación** → confirm. Phones lock and the 🏆 results appear.

| Control (TV, host only) | Action |
|---|---|
| **Abrir votación** / **Cerrar votación** | Open voting / close voting and reveal results |
| **V** key | Toggle voting |
| **F** key | Fullscreen (works for anyone) |
| ⚙︎ → Borrar todos los votos | Delete all votes |
| ⚙︎ → Cerrar sesión de anfitrión | Sign out on this device |

> Google sign-in uses a pop-up window. Some built-in smart-TV browsers block pop-ups; if yours does, run the TV page from a laptop over HDMI.

## Customizing

- **Categories, title:** `config.js`
- **Language:** the visible text lives in `index.html` and `vote.html`; search for the Spanish strings and replace them
- **Colors/fonts:** the `:root` CSS variables at the top of each HTML file
- **New contest:** change `ROOT` in `config.js` (e.g. `party2027`) **and** every `party2026` in your database rules

## Run locally

```bash
python3 -m http.server 8000
```
Then open http://localhost:8000. Locally the app runs in demo mode (votes sync between tabs of the same browser, no sign-in needed) unless you add `"localhost"` to `LIVE_HOSTS`.

## Security & privacy

This is built for a friendly party, not an election.

- **The Firebase config in `config.js` is public by design.** Every Firebase website ships it to the browser, and it can't be hidden or encrypted. The `apiKey` identifies your project; it isn't a password. Your **database rules** and the host's Google sign-in are what protect your data, so make sure step 4 is done.
- **Votes are publicly readable** by anyone who knows your database address, so a tech-savvy guest could peek at the tally before the reveal. Don't collect anything sensitive, and delete the data afterwards.
- **"One vote per phone" isn't one vote per person.** A private tab or another browser can vote again.
- **Host controls are protected** by Google sign-in plus database rules tied to the host's email. Sign out (⚙︎) on shared devices after the party.
- `LIVE_HOSTS` prevents **accidental** reuse of a database by copies of this repo; the database rules are what actually protect your data. For extra protection, restrict the API key (step 8) and/or enable [Firebase App Check](https://firebase.google.com/docs/app-check).
- On Firebase's free **Spark** plan, abuse can at worst exhaust the free quota; it can't run up a bill. Don't upgrade to the paid Blaze plan unless you need to.

## After the party

- Delete votes: ⚙︎ → Borrar todos los votos, or Firebase console → Realtime Database → Data → delete `party2026`.
- Take the site down: Settings → Pages → Branch → **None**.
- Remove everything: Firebase → Project settings → **Delete project**.

## License

[MIT](LICENSE)
