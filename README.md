# 🎃 Concurso de Disfraces: Halloween Costume Voting

Live costume voting for the party. The TV shows a QR code; guests scan, type a name for each category, and the results stay secret until voting is closed.

## Links

| What | Link |
|---|---|
| 📺 **TV screen** (open this on the TV) | https://luiserodz93.github.io/halloweenparty/ |
| 📱 **Phone voting page** (what the QR opens) | https://luiserodz93.github.io/halloweenparty/vote.html |
| 💻 GitHub repo | https://github.com/luiserodz93/halloweenparty |
| ⚙️ GitHub Pages settings | https://github.com/luiserodz93/halloweenparty/settings/pages |
| 🚀 Deploy status (Actions) | https://github.com/luiserodz93/halloweenparty/actions |
| 🔥 Firebase project | https://console.firebase.google.com/project/halloween-party-85bff/overview |
| 🗂️ Firebase votes (data) | https://console.firebase.google.com/project/halloween-party-85bff/database/halloween-party-85bff-default-rtdb/data |
| 🔒 Firebase rules | https://console.firebase.google.com/project/halloween-party-85bff/database/halloween-party-85bff-default-rtdb/rules |

## Files

| File | Purpose |
|---|---|
| `index.html` | TV screen: QR code, voter count, open/close buttons, results reveal |
| `vote.html` | Phone ballot (one vote per phone, locked after submitting, name suggestions) |
| `config.js` | Firebase settings, title, and **categories** (edit here to rename/add/remove) |
| `store.js` | Database connection and vote counting |

## Party night checklist

1. Open the **TV screen** link on the TV and press **F** for fullscreen.
2. Click **Abrir votación**.
3. Scan the QR with your own phone to make sure it works.
4. Clear any test votes: ⚙︎ (faint, bottom-right) → **Borrar todos los votos**.
5. Let guests vote. The TV shows only how many people have voted; results stay secret 🤫.
6. When it's time, click **Cerrar votación** → confirm. Phones lock and the 🏆 results are revealed.

### Host controls (TV screen)

| Control | Action |
|---|---|
| **Abrir votación** | Open voting (hides results, shows the QR lobby) |
| **Cerrar votación** | Close voting and reveal results |
| Small **Abrir votación** on the results screen | Reopen voting and go back to the lobby |
| **V** key | Open / close voting |
| **F** key | Fullscreen on / off |
| ⚙︎ → Borrar todos los votos | Delete all votes (can't be undone) |

## How voting works

- Guests type a name per category; any category can be skipped. The last category (Ganador General) is the grand prize.
- Names are matched ignoring case, extra spaces and accents (`maria lopez` = `María López`). Tapping a field shows names others already typed, so spellings match.
- **One vote per phone.** After submitting, the ballot is locked. Firebase rules also reject a second vote from the same phone and any vote while voting is closed.
- Limit: a guest could vote again from a private tab or another browser/phone.

## Making changes

1. Open the file on GitHub → click ✏️ → edit → **Commit changes**.
2. Wait ~1 minute (check **Actions** for a green ✓).
3. On the TV, hard-refresh: **Cmd+Shift+R** (Mac) / **Ctrl+Shift+R** (Windows).

Categories live in `config.js`. Keep each `id` short with no spaces. Changing an `id` mid-party orphans that category's votes.

## Firebase database rules

Published under Realtime Database → Rules:

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

`party2026` must match `ROOT` in `config.js`. To run a fresh contest later, change `ROOT` (e.g. `party2027`) and update the rules to match.

## After the party

Votes are stored in Firebase and stay there until deleted. Closing the tab doesn't remove them. Anyone with the database address can read them.

- **Delete the votes:** ⚙︎ → Borrar todos los votos, or Firebase **data** link → hover `party2026` → 🗑️.
- **Take the site offline:** GitHub Pages settings → Branch → **None** → Save.
- **Delete everything:** Firebase → Project settings → General → **Delete project**.
