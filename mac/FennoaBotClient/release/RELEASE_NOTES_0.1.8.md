# CheckApp 0.1.8

## Fixes

- Fixes the packaged Playwright driver crash on macOS.
- Signs the embedded Playwright Node runtime with the Apple JIT entitlements required by V8.
- Keeps trial access active until `trial_ends_at`, including when the subscription has been cancelled for the end of the trial.

## macOS

- Signed with Apple Developer ID.
- Notarized and accepted by Apple.
- Notarization ticket is stapled to the DMG.

