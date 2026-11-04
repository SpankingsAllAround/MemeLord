# Meme Room — Image Edition (TV + phone caption party game)

An original, family-friendly, What Do You Meme?-style party game designed for 20–25 people (supports up to 40), with no physical cards or player accounts.

## What you get
- **TV host screen** at `/host` with QR code, live player count, stage controls, private caption review, winners, and top-ten leaderboard.
- **Phone player screen** at `/` for joining, writing original captions, first-round voting, and final voting.
- **Your own real meme pictures** from `public/memes/` (JPG, JPEG, PNG, WebP), automatically found when the server starts. Images fill the TV and phone screens without cropping, with a shuffled deck and no repeats until every image has appeared.
- The original **16 emoji scenarios remain as an automatic fallback** only when the memes folder contains no supported images.
- Players cannot vote for themselves, and can submit/vote only once per stage.
- **Two-stage voting** for larger groups: up to five captions per voter in a preliminary ballot; top five go to the final. When there are five or fewer entries, go straight to final voting.
- Host can remove captions before they appear in ballots. No captions are displayed to players until ballots open.
- Scores: 100 points per final vote, 50 points for finalist, 300 bonus for round winner(s) instead of 50. Ties share the winner bonus.
- Device reconnect with a unique browser token; no login or participant emails.

## Add meme pictures (new!)

1. In your GitHub repo, navigate to `public` > `memes`.
2. Choose **Add file** > **Upload files** and select the JPG, JPEG, PNG or WebP meme photos you want to use. (You can upload several at once.)
3. Choose **Commit changes**. Render automatically redeploys if auto-deploy is enabled.
4. Visit your `/host` lobby. Its Host Controls note shows how many image memes have loaded.
5. Start the game as usual. Each photo will appear on the TV and players' phones; players write captions for the photo, then vote.

The folder is deliberately empty in this download: **you supply your own pictures**. Until you add at least one, the old 16 emoji prompts keep the game playable. Photos must reside directly in `public/memes/` (not a subfolder). The app does not fetch memes from online sources or upload photos from players' phones.

See **`HOW-TO-ADD-MEMES.md`** for screenshots-free, detailed instructions including how to replace or remove photos.

## Run locally

1. Install Node.js 20 or newer.
2. Open a terminal in this folder and run `npm install`.
3. Copy `.env.example` to `.env` and change `HOST_PIN` to a private PIN/password.
4. Run `npm start`.
5. Open `http://localhost:3000/host` on the TV computer and enter the PIN.
6. For phones on the same Wi-Fi, use the **TV computer's LAN IP**, e.g. `http://192.168.1.50:3000/host`, **not `localhost`**. The displayed QR automatically points to the host computer's network address. Permit inbound TCP 3000 on the TV computer's firewall if needed.
7. Players scan the QR and enter their names. Host chooses round count and starts.

## Host on the internet (recommended for a room of 25)

For accessible QR joining without LAN/firewall concerns, deploy as **one Node web service** to a platform supporting long-lived WebSocket connections, e.g. Render:

1. Upload these files to a private GitHub repository (exclude `.env` and `node_modules`).
2. In Render, create a new **Web Service** from that repository, with `npm install` as build command and `npm start` as start command. `render.yaml` is also included.
3. Set environment variable `HOST_PIN` to a strong private value.
4. Open `https://YOUR-SERVICE.onrender.com/host` on your TV and enter the PIN.
5. Players scan the QR code. The QR links to the public HTTPS URL.

A free instance can sleep when idle and may take time to start. Paid always-on hosting is more reliable for live events.

## Game flow

1. **Lobby**: scan QR, join, choose round count.
2. **Submit**: show a prompt; everyone submits a 2–140 character caption.
3. **Review**: host removes inappropriate entries. This is a **host-only** operation, but the host page should be hidden from the audience during review if you want submissions anonymous before voting. Use a second private laptop for host controls to avoid revealing captions.
4. **Preliminary vote**: for more than five captions, each phone shows up to five eligible captions, never their own. The server ranks captions using a smoothed vote/exposure score to reduce advantage from appearing on more ballots.
5. **Final vote**: top five captions, excluding own entry from each player's ballot.
6. **Results**: reveal winners, award points, show leaderboard, repeat.

## Things to know before a live event

- **One active room** per server instance. To run simultaneous events, deploy separate instances.
- **In-memory data only**: restarting the server resets game, scores and player identities. Use an always-on host and avoid deploying during a game.
- **Late joins** are disabled after the host starts; device reconnects are supported through locally stored browser tokens.
- **Family friendliness is host-moderated**, not guaranteed by an automated content filter. The private review step matters.
- **Images are added through your GitHub repository**, not uploaded from the game website. Add them to `public/memes/`, commit, and allow Render to redeploy. There is no image upload dashboard and no online image search. If you add images, the original emoji prompts are not included in the randomized deck.
- For 20–25 participants, use stable Wi-Fi or internet access, test with a few phones, and keep the host PIN secret.
- The current preliminary ballot samples eligible captions, but because not every player sees every caption, voting is intended for fun, not scientific fairness.

## Customize

- Add or replace your own JPG, JPEG, PNG or WebP images directly in `public/memes/`, and commit to GitHub. The deck is built automatically on server startup—no code changes necessary. See `HOW-TO-ADD-MEMES.md` and `public/memes/README.md`.
- Without images, the game falls back to the 16 original emoji prompts defined in `server.js`.
- Adjust stage labels and styling in `public/style.css`, `host.js`, and `player.js`.
- Change the round limit choices in `public/host.js`.

## Privacy and accessibility

- Player data (names, captions, scores) stays in server memory until reset/restart. It is not written to a database or transmitted to an analytics provider.
- Vote and caption text is rendered with `textContent`, not HTML.
- The site has high-contrast controls and keyboard-focus indicators. Provide paper or shared-device participation for guests without phones.
