# Adding your own meme pictures to Meme Room

**You do not need to edit JavaScript or install anything on your computer.** You can manage the pictures in your GitHub repository.

## Upload pictures using GitHub's website

1. Open the GitHub repository that Render is already using for Meme Room.
2. Open the `public` folder, then the `memes` folder.
3. Click **Add file → Upload files**.
4. Drag in some suitable `.jpg`, `.jpeg`, `.png`, or `.webp` images, or choose them using the file picker. You can add multiple pictures at once.
5. Click **Commit changes**. Use a description such as `Add new meme images`.
6. Open the Render dashboard and confirm that your service finishes its automatic deployment. If auto-deploy is disabled, manually deploy the newest GitHub commit.
7. Refresh your `/host` page. In the **Lobby**, below Host Controls, you should now see a message like **`12 meme images loaded from public/memes`**.
8. After at least two players join, select the number of rounds and click **Start game**.

## How the image deck works

- The game reads the pictures directly from `public/memes` when the server starts. You do **not** need a separate list or file manifest.
- As soon as there is **one valid image**, gameplay uses image memes instead of the original 16 emoji prompts.
- A random image is chosen each round. No repeats occur until all your images have been shown; then the deck reshuffles.
- The **TV and all players' phones** show the same photo, with its full aspect ratio preserved—no cropping.
- The picture itself is uncaptioned by the game. Each player invents their own caption, and the normal voting, scores, and leaderboard continue to work.

## Replacing or removing memes

- **Add:** GitHub → `public/memes` → Add file → Upload files → Commit changes.
- **Replace:** In GitHub, delete the old image and upload your replacement, then commit.
- **Remove:** Open an image file in GitHub, choose the delete/trash action, and commit.
- **Rename:** Rename locally and re-upload, deleting the old copy from GitHub.

Each edit triggers a new deployment if automatic deployment is enabled. **Do not change images during a live game:** redeploying restarts the server and erases the current in-memory game, including scores.

## Tips for a 20–25-player event

- Start with at least as many photos as rounds; for 15 rounds, upload 15 or more.
- Landscape and portrait photos both work. The TV displays the entire picture with surrounding space when necessary.
- Keep individual pictures roughly 1200–1600 pixels wide and under 1 MB if practical. Twenty-five phones downloading huge files at once may take longer.
- Images should be family-friendly and suitable to display publicly. Ensure you have permission or appropriate rights to use them.
- Check the host lobby's image count after Render completes deployment, then run a two-phone test before the event.

## Troubleshooting

**I still see an emoji:** Either Render hasn't deployed the newest commit, you put photos in a different folder, or the image format isn't supported. Only `.jpg`, `.jpeg`, `.png`, and `.webp` are scanned.

**The photo says it can't load:** Verify the image file opens normally in GitHub and that the file wasn't corrupted. Check the image's URL in a browser (for example: `https://YOUR-SERVICE.onrender.com/memes/surprised-cat.jpg`).

**I have 10 photos but 12 rounds:** The first 10 rounds use each photo once, in random order; after the deck is exhausted, photos can repeat.

**I just uploaded a file and nothing changed:** Wait for Render's deployment to finish and refresh the host page. Image discovery happens during server startup; the live game does not monitor GitHub for file changes.
