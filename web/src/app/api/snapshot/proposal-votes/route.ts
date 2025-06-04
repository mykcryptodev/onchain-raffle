import { NextResponse } from 'next/server';

const SNAPSHOT_GRAPHQL_URL = 'https://hub.snapshot.org/graphql';

interface SnapshotProposal {
  id: string;
  title: string;
  space: {
    id: string;
    name: string;
  };
  choices: string[];
  scores: number[];
  scores_total: number;
  votes: number;
  state: string;
}

interface SnapshotVote {
  id: string;
  voter: string;
  created: number;
  choice: any;
  vp: number;
  reason?: string;
}

const PROPOSAL_QUERY = `
  query Proposal($id: String!) {
    proposal(id: $id) {
      id
      title
      choices
      scores
      scores_total
      votes
      state
      space {
        id
        name
      }
    }
  }
`;

const VOTES_QUERY = `
  query Votes($proposalId: String!, $first: Int!, $skip: Int!) {
    votes(
      first: $first
      skip: $skip
      where: { proposal: $proposalId }
      orderBy: "vp"
      orderDirection: desc
    ) {
      id
      voter
      created
      choice
      vp
      reason
    }
  }
`;

async function fetchAllVotes(proposalId: string): Promise<SnapshotVote[]> {
  const votes: SnapshotVote[] = [];
  const limit = 1000; // GraphQL limit per request
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(SNAPSHOT_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: VOTES_QUERY,
        variables: {
          proposalId,
          first: limit,
          skip,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'GraphQL query failed');
    }

    const fetchedVotes = data.data?.votes || [];
    votes.push(...fetchedVotes);

    // Check if we've fetched all votes
    hasMore = fetchedVotes.length === limit;
    skip += limit;

    // Safety limit to prevent infinite loops
    if (votes.length > 50000) {
      console.warn('Reached maximum vote limit of 50,000');
      break;
    }
  }

  return votes;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proposalId } = body;

    if (!proposalId) {
      return NextResponse.json({ error: 'Proposal ID is required' }, { status: 400 });
    }

    // Extract proposal ID from URL if a full URL is provided
    let cleanProposalId = proposalId.trim();
    if (cleanProposalId.includes('snapshot.org')) {
      // Extract the proposal ID from URLs like:
      // https://snapshot.org/#/space.eth/proposal/0x123...
      const matches = cleanProposalId.match(/proposal\/(0x[a-fA-F0-9]+)/);
      if (matches && matches[1]) {
        cleanProposalId = matches[1];
      }
    }

    // Validate proposal ID format (should be 0x followed by hex characters)
    const idPattern = /^0x[a-fA-F0-9]+$/;
    if (!idPattern.test(cleanProposalId)) {
      return NextResponse.json({ 
        error: 'Invalid proposal ID format. Must be a hex string starting with 0x.' 
      }, { status: 400 });
    }

    console.log(`Fetching proposal data for ID: ${cleanProposalId}`);

    // Fetch proposal details
    const proposalResponse = await fetch(SNAPSHOT_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: PROPOSAL_QUERY,
        variables: { id: cleanProposalId },
      }),
    });

    if (!proposalResponse.ok) {
      return NextResponse.json({ 
        error: `Failed to fetch proposal: ${proposalResponse.status}` 
      }, { status: proposalResponse.status });
    }

    const proposalData = await proposalResponse.json();
    
    if (proposalData.errors) {
      return NextResponse.json({ 
        error: proposalData.errors[0]?.message || 'Failed to fetch proposal' 
      }, { status: 400 });
    }

    const proposal = proposalData.data?.proposal;
    
    if (!proposal) {
      return NextResponse.json({ 
        error: 'Proposal not found. Please check the ID and try again.' 
      }, { status: 404 });
    }

    console.log(`Fetching votes for proposal: ${proposal.title}`);

    // Fetch all votes
    const votes = await fetchAllVotes(cleanProposalId);
    
    console.log(`Found ${votes.length} votes for the proposal`);

    return NextResponse.json({ 
      proposal,
      votes,
    });

  } catch (error) {
    console.error('Error in Snapshot proposal fetch:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch proposal data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 