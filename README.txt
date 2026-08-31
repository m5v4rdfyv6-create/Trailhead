TRAILHEAD — EXPEDITION EDITION

Upload every file in this folder to the root of your GitHub Pages repository.

This version includes:
- Dynamic scenic app backgrounds that change automatically with trail progress
- Pine Ridge, Desert Canyon, Coastal Trail, Alpine Pass, Autumn Ridge, and Night Expedition environments
- Automatic XP based on task category, priority, and due date
- Daily expedition goal and Perfect Trail Day bonus
- Trail Caches and Camp Day streak protection
- Journey page with trail map and unlockable environments
- Separate Achievements page
- Notes, stepping stones, recurring tasks, quick picks, filters, and archive
- Local browser storage and offline PWA support

On iPhone: open the GitHub Pages URL in Safari, tap Share, then Add to Home Screen.

Data is stored locally on that device/browser.


PLANNER EDITION
Adds a Planner page with Daily, Weekly, and Monthly views. All views use the same Trailhead tasks and due dates; no duplicate task system is created. Weekly and monthly progress update automatically as tasks are completed.

COLLABORATIVE BUILD DEPLOYMENT NOTE
This ZIP is intentionally packaged with index.html at the ZIP root. Replace the existing site files with the contents of this ZIP rather than uploading the enclosing folder.
The service worker uses a new cache (trailhead-collab-v5) and uses network-first navigation so new index.html versions are not hidden behind an old cached PWA page.
After deployment, the Trailhead header shows “Collaborative Build” and bottom navigation includes Requests and Profile.


CROSS-DEVICE SYNC
When signed in, Trailhead keeps the full app state in Supabase and a local offline copy. Changes sync between web, installed phone PWA, and laptop sessions using the same Trailhead account. The app checks for remote changes while open and again when it returns to the foreground.
