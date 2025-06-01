# Farcaster Mini App Setup Guide

Your Next.js app is now configured as a Farcaster Mini App! Here are the final steps to complete the setup:

## 1. Environment Variables

Add the following environment variable to your `.env.local` file:

```
NEXT_PUBLIC_URL=https://your-domain.com
```

Replace `your-domain.com` with your actual domain.

## 2. Generate the Farcaster Manifest

1. Visit the [Farcaster JSON Tool](https://warpcast.com/~/developers/new) in Warpcast
2. Enter your domain (e.g., `your-domain.com`)
3. Sign the verification with your Farcaster account
4. Copy the generated JSON

## 3. Update the Manifest File

Replace the contents of `/public/.well-known/farcaster.json` with the JSON from step 2.

The key fields to update are:
- `domain`: Your actual domain
- `account`: The verification details from the tool
- `profile.coverUrl`: Update to point to your cover image
- `profile.logoUrl`: Update to point to your logo (currently using `/logo.png`)

## 4. What's Been Added

### Farcaster SDK Integration
- Installed `@farcaster/frame-sdk` for Mini App functionality
- Created `FarcasterProvider` component that:
  - Initializes the SDK when the app loads
  - Calls `sdk.actions.ready()` to hide the splash screen
  - Wraps the entire app to ensure SDK is available
- Created `useFarcaster` hook that provides:
  - Access to Farcaster user context
  - Native share functionality using `composeCast`
  - Error handling and loading states

### Share Functionality
- Added a share button to raffle pages
- Uses native `sdk.actions.composeCast()` for in-app sharing
- Automatically includes the raffle URL as an embed
- The embed will display the custom OG image with raffle details

### Metadata Tags
- Added `fc:frame` meta tags to the root layout
- Created dynamic metadata for individual raffle pages at `/raffle/[address]`
- Each raffle page has its own sharable embed with custom OG image

### OG Image Generation
- `/api/og` - General OG image for the app
- `/api/og/[address]` - Dynamic OG images for each raffle showing:
  - Raffle creator
  - Prize amount
  - Token type
  - Raffle status (Active/Completed/Pending)
  - Winner (if selected)

### Manifest File
- Created `/public/.well-known/farcaster.json` with app profile and verification

## 5. Testing Your Mini App

1. Deploy your app to your domain
2. Visit `https://your-domain.com/.well-known/farcaster.json` to verify the manifest is accessible
3. Use the [Mini App Debug Tool](https://warpcast.com/~/developers/mini-apps/debug) to preview your app
4. Share a raffle URL in Warpcast to see the custom embed
5. Test the share button functionality within the app

## 6. Sharing Raffles

When users click the share button:
- The native Farcaster composer opens with pre-filled text
- The raffle URL is automatically included as an embed
- The embed displays the custom OG image with raffle details

When users share raffle URLs in their feed, other users will see:
- A rich preview with the custom OG image
- A "View Raffle" button that opens the Mini App
- The ability to interact with the raffle directly from their feed

## 7. SDK Features Available

The following Farcaster SDK features are now available in your app:

- **Context**: Access user information through `sdk.context`
- **Ready**: Hide splash screen when app loads
- **Compose Cast**: Native sharing with `sdk.actions.composeCast()`
- **Open URL**: Navigate to external URLs
- **Additional actions**: See the [Farcaster docs](https://miniapps.farcaster.xyz/) for more SDK capabilities

## Notes

- The OG images are generated dynamically based on on-chain data
- If token symbol retrieval is needed, you may need to implement a custom solution or use a token list API
- Make sure your domain has HTTPS enabled
- The manifest must be served with the correct MIME type (application/json)
- The SDK automatically detects if the app is running in a Farcaster client 