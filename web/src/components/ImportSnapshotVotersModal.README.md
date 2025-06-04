# ImportSnapshotVotersModal

A modal component for importing Ethereum addresses from Snapshot proposal voters.

## Features

- Search for Snapshot proposals by ID or URL
- View proposal details including title, space, and voting results
- Automatically fetches all voters who participated in the proposal
- Shows voter information including their choice, voting power, and timestamp
- Allows bulk import of voter addresses
- Responsive design with mobile-optimized tabs
- Handles pagination for proposals with many voters

## Usage

```tsx
import { ImportSnapshotVotersModal } from '@/components/ImportSnapshotVotersModal';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImport = (addresses: string[]) => {
    // Handle the imported addresses
    console.log('Imported addresses:', addresses);
  };

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Import from Snapshot
      </button>

      <ImportSnapshotVotersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImport={handleImport}
      />
    </>
  );
}
```

## Props

- `isOpen` (boolean): Controls the visibility of the modal
- `onClose` (() => void): Callback when the modal is closed
- `onImport` ((addresses: string[]) => void): Callback when addresses are imported

## Supported Input Formats

The modal accepts various formats for proposal identification:

1. **Proposal ID**: `0x1234abcd...` (hex string)
2. **Full URL**: `https://snapshot.org/#/space.eth/proposal/0x1234abcd...`

## API Integration

The component uses a backend API route at `/api/snapshot/proposal-votes` which:

1. Validates the proposal ID
2. Fetches proposal details from Snapshot's GraphQL API
3. Fetches all votes with pagination support
4. Returns formatted data for display

## Design Features

### Desktop View
- Split-panel layout with proposal info on the left and selected voters on the right
- Visual representation of voting results with progress bars
- Easy management of selected addresses

### Mobile View
- Tab-based navigation between proposal info and voter list
- Touch-optimized scrolling
- Full-screen modal for better mobile experience

## Error Handling

- Validates proposal ID format before making API calls
- Shows user-friendly error messages for:
  - Invalid proposal IDs
  - Network errors
  - Proposals not found
  - API failures

## Example Snapshot Proposal IDs

Here are some example proposal IDs you can test with:

- ENS DAO proposals: Check https://snapshot.org/#/ens.eth
- Uniswap proposals: Check https://snapshot.org/#/uniswap
- Arbitrum proposals: Check https://snapshot.org/#/arbitrumfoundation.eth

Simply copy the proposal ID from the URL after clicking on any proposal. 