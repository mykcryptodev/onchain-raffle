export interface NeynarUser {
  object: string;
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  pro?: {
    status: string;
    subscribed_at: string;
    expires_at: string;
  };
  profile?: {
    bio?: {
      text: string;
    };
  };
  follower_count: number;
  following_count: number;
  verifications: string[];
  verified_addresses: {
    eth_addresses: string[];
    sol_addresses?: string[];
    primary: {
      eth_address: string;
      sol_address?: string;
    };
  };
  auth_addresses: Array<{
    address: string;
    app: {
      object: string;
      fid: number;
    };
  }>;
  verified_accounts: Array<{
    platform: string;
    username: string;
  }>;
  power_badge: boolean;
  experimental?: {
    neynar_user_score: number;
    deprecation_notice: string;
  };
  score: number;
}