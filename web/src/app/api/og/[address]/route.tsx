import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { getContract, ZERO_ADDRESS } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import * as raffleAbi from "@/abis/raffle";
import { shortenAddress } from "thirdweb/utils";
import { getCurrencyMetadata } from "thirdweb/extensions/erc20";
import { getSocialProfiles } from "thirdweb/social";

export const runtime = "edge";

interface Params {
  params: Promise<{
    address: string;
  }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { address } = await params;
    
    const raffleContract = getContract({
      client,
      chain,
      address: address as `0x${string}`,
    });

    const [owner, token, winner, prizeDistributed] = await Promise.all([
      raffleAbi.owner({ contract: raffleContract }),
      raffleAbi.token({ contract: raffleContract }),
      raffleAbi.winner({ contract: raffleContract }),
      raffleAbi.prizeDistributed({ contract: raffleContract }),
    ]);

    const tokenContract = getContract({
      client,
      chain,
      address: token,
    });

    // Fetch token metadata and owner's social profiles in parallel
    const [metadata, ownerProfiles, winnerProfiles] = await Promise.all([
      getCurrencyMetadata({ contract: tokenContract }),
      getSocialProfiles({ address: owner, client }),
      winner !== ZERO_ADDRESS ? getSocialProfiles({ address: winner, client }) : Promise.resolve([]),
    ]);
    
    const { name, symbol } = metadata;

    // Get the best available profile for owner (prioritize ENS, then Farcaster, then Lens)
    const ownerProfile = ownerProfiles.find(p => p.type === "ens") || 
                        ownerProfiles.find(p => p.type === "farcaster") || 
                        ownerProfiles.find(p => p.type === "lens") || 
                        null;
    
    const ownerName = ownerProfile?.name || shortenAddress(owner);
    const ownerAvatar = ownerProfile?.avatar;

    // Get the best available profile for winner
    const winnerProfile = winnerProfiles.find(p => p.type === "ens") || 
                         winnerProfiles.find(p => p.type === "farcaster") || 
                         winnerProfiles.find(p => p.type === "lens") || 
                         null;
    
    const winnerName = winnerProfile?.name || `${winner.slice(0, 6)}...${winner.slice(-4)}`;
    const winnerAvatar = winnerProfile?.avatar;

    const isActive = !prizeDistributed && winner === ZERO_ADDRESS;

    // Get the logo URL
    const logoUrl = `${request.nextUrl.origin}/logo.png`;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#000000",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Animated gradient background */}
          <div
            style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              right: "-50%",
              bottom: "-50%",
              background: "radial-gradient(ellipse at center, #3b82f6 0%, #8b5cf6 25%, #ec4899 50%, #06b6d4 75%, #3b82f6 100%)",
              opacity: "0.3",
              transform: "rotate(45deg)",
            }}
          />
          
          {/* Noise texture overlay - using a simpler pattern */}
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              right: "0",
              bottom: "0",
              background: "linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.02) 75%), linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.02) 75%)",
              backgroundSize: "30px 30px",
              backgroundPosition: "0 0, 15px 15px",
            }}
          />

          {/* Main content container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(20px)",
              borderRadius: "32px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 0 80px rgba(139, 92, 246, 0.3), inset 0 0 60px rgba(59, 130, 246, 0.1)",
              position: "relative",
              maxWidth: "1000px",
            }}
          >
            {/* Glowing orbs */}
            <div
              style={{
                position: "absolute",
                top: "-40px",
                left: "-40px",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
                opacity: "0.6",
                filter: "blur(30px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-40px",
                right: "-40px",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
                opacity: "0.6",
                filter: "blur(30px)",
              }}
            />

            {/* Logo and Title Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                marginBottom: "20px",
              }}
            >
              <img
                src={logoUrl}
                width="80"
                height="80"
                style={{
                  borderRadius: "20px",
                  boxShadow: "0 0 40px rgba(139, 92, 246, 0.5)",
                }}
              />
              <h1
                style={{
                  fontSize: "72px",
                  fontWeight: "900",
                  background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)",
                  backgroundClip: "text",
                  color: "transparent",
                  margin: "0",
                  letterSpacing: "-2px",
                  textShadow: "0 0 60px rgba(139, 92, 246, 0.5)",
                }}
              >
                ROFL HOUSE
              </h1>
            </div>

            {/* Token Prize Section */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "30px 50px",
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                borderRadius: "20px",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                marginBottom: "30px",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  color: "#94a3b8",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                🎁 Prize Token
              </div>
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: "800",
                  background: "linear-gradient(to right, #fbbf24, #f59e0b)",
                  backgroundClip: "text",
                  color: "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                {name}
                {symbol && (
                  <span
                    style={{
                      fontSize: "28px",
                      opacity: "0.8",
                    }}
                  >
                    ({symbol})
                  </span>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div
              style={{
                position: "absolute",
                top: "30px",
                right: "30px",
                padding: "12px 24px",
                borderRadius: "24px",
                background: isActive 
                  ? "linear-gradient(135deg, #10b981 0%, #34d399 100%)" 
                  : prizeDistributed 
                    ? "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)"
                    : "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)",
                color: "white",
                fontSize: "18px",
                fontWeight: "700",
                boxShadow: isActive ? "0 0 30px rgba(16, 185, 129, 0.5)" : "none",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {isActive ? "🔥 LIVE" : prizeDistributed ? "✅ COMPLETE" : "⏳ PENDING"}
            </div>

            {/* Creator Info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "20px 36px",
                background: "rgba(30, 41, 59, 0.5)",
                borderRadius: "16px",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                marginBottom: winner !== ZERO_ADDRESS ? "20px" : "0",
              }}
            >
              <span style={{ color: "#64748b", fontSize: "20px" }}>Created by</span>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {ownerAvatar ? (
                  <img
                    src={ownerAvatar}
                    width="40"
                    height="40"
                    style={{
                      borderRadius: "50%",
                      border: "2px solid rgba(139, 92, 246, 0.5)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "white",
                    }}
                  >
                    {ownerName[0].toUpperCase()}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ 
                    color: "#e2e8f0", 
                    fontSize: "22px", 
                    fontWeight: "700",
                  }}>
                    {ownerName}
                  </span>
                  {ownerProfile && (
                    <span style={{ 
                      color: "#64748b", 
                      fontSize: "14px",
                      textTransform: "capitalize",
                    }}>
                      {shortenAddress(owner)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Winner Info (if exists) */}
            {winner !== ZERO_ADDRESS && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "24px 40px",
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(34, 211, 238, 0.1) 100%)",
                  borderRadius: "20px",
                  border: "2px solid #10b981",
                  boxShadow: "0 0 40px rgba(16, 185, 129, 0.3)",
                }}
              >
                <span style={{ fontSize: "32px" }}>🏆</span>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {winnerAvatar ? (
                    <img
                      src={winnerAvatar}
                      width="40"
                      height="40"
                      style={{
                        borderRadius: "50%",
                        border: "2px solid #10b981",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #10b981, #34d399)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "white",
                      }}
                    >
                      {winnerName[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ color: "#10b981", fontSize: "18px", fontWeight: "600" }}>WINNER</span>
                    <span style={{ 
                      color: "#f0fdf4", 
                      fontSize: "24px", 
                      fontWeight: "800",
                    }}>
                      {winnerName}
                    </span>
                    {winnerProfile && (
                      <span style={{ 
                        color: "#86efac", 
                        fontSize: "14px",
                        textTransform: "capitalize",
                      }}>
                        {shortenAddress(winner)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Call to Action */}
            {isActive && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "30px",
                  padding: "16px 32px",
                  background: "linear-gradient(90deg, rgba(236, 72, 153, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
                  borderRadius: "12px",
                }}
              >
                <span style={{ fontSize: "28px" }}>🎲</span>
                <p
                  style={{
                    fontSize: "22px",
                    color: "#e2e8f0",
                    margin: "0",
                    fontWeight: "600",
                  }}
                >
                  Enter now for a chance to win!
                </p>
              </div>
            )}
          </div>

          {/* Decorative elements */}
          <div
            style={{
              position: "absolute",
              top: "10%",
              left: "5%",
              fontSize: "40px",
              opacity: "0.3",
              transform: "rotate(-15deg)",
            }}
          >
            ✨
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "10%",
              right: "5%",
              fontSize: "40px",
              opacity: "0.3",
              transform: "rotate(15deg)",
            }}
          >
            🎉
          </div>
          <div
            style={{
              position: "absolute",
              top: "20%",
              right: "10%",
              fontSize: "30px",
              opacity: "0.2",
            }}
          >
            🎟️
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`Error generating raffle OG image: ${e.message}`);
    
    // Return a fallback image
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#000000",
            background: "radial-gradient(ellipse at center, #1e293b 0%, #000000 100%)",
          }}
        >
          <h1
            style={{
              fontSize: "64px",
              fontWeight: "900",
              background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
              backgroundClip: "text",
              color: "transparent",
              marginBottom: "20px",
            }}
          >
            ROFL HOUSE
          </h1>
          <p
            style={{
              fontSize: "24px",
              color: "#64748b",
            }}
          >
            View this raffle onchain
          </p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
} 