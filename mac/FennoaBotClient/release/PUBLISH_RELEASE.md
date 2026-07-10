# Publish CheckApp 0.1.0

## Files

- `CheckApp-0.1.0.dmg`
- `CheckApp-0.1.0.sha256`
- `RELEASE_NOTES_0.1.0.md`

## GitHub Release

Create a new GitHub Release in:

`Kris-creator23/check-product`

Use:

- Tag: `checkapp-mac-v0.1.0`
- Title: `CheckApp 0.1.0`
- Release notes: contents of `RELEASE_NOTES_0.1.0.md`
- Asset: `CheckApp-0.1.0.dmg`

After publishing, copy the asset URL and set it in Vercel:

```text
NEXT_PUBLIC_MAC_DOWNLOAD_URL=https://github.com/Kris-creator23/check-product/releases/download/checkapp-mac-v0.1.0/CheckApp-0.1.0.dmg
```

Then redeploy the site and test:

```text
https://checkapp.fi/api/download
```
