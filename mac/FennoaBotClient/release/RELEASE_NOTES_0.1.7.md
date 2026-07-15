# CheckApp 0.1.7

## Changes

- Stops before saving a receipt so the user can verify and save the data manually in Fennoa.
- Updates the confirmation text and adds the green `Jatka seuraavaan kuittiin` button.
- Reads receipt dates and fills Fennoa's `Ostopäivä` and `Tositepäivä` fields.
- Supports Finnish date formatting without leading zeroes, for example `7.5.2026`.
- Fixes the packaged Playwright runtime used by the macOS application.

## macOS

- Signed with Apple Developer ID.
- Notarized and accepted by Apple.
- Notarization ticket is stapled to the DMG.

