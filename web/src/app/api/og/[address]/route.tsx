import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { getContract } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import * as raffleAbi from "@/abis/raffle";
import { balanceOf, decimals } from "thirdweb/extensions/erc20";

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

    const [tokenDecimals, balance] = await Promise.all([
      decimals({ contract: tokenContract }),
      balanceOf({ contract: tokenContract, address: address as `0x${string}` }),
    ]);

    const prizeAmount = (Number(balance) / Math.pow(10, tokenDecimals)).toFixed(2);
    const shortOwner = `${owner.slice(0, 6)}...${owner.slice(-4)}`;
    const isActive = !prizeDistributed && winner === "0x0000000000000000000000000000000000000000";

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
            backgroundColor: "#111827",
            backgroundImage: "radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 2%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 2%)",
            backgroundSize: "100px 100px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px",
              backgroundColor: "rgba(17, 24, 39, 0.95)",
              borderRadius: "24px",
              border: "3px solid #3b82f6",
              boxShadow: "0 0 60px rgba(59, 130, 246, 0.5)",
              maxWidth: "900px",
            }}
          >
            {/* Status Badge */}
            <div
              style={{
                position: "absolute",
                top: "30px",
                right: "30px",
                padding: "8px 20px",
                borderRadius: "20px",
                backgroundColor: isActive ? "#10b981" : "#6b7280",
                color: "white",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              {isActive ? "ACTIVE" : prizeDistributed ? "COMPLETED" : "PENDING"}
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: "56px",
                fontWeight: "bold",
                background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                backgroundClip: "text",
                color: "transparent",
                margin: "0",
                marginBottom: "30px",
              }}
            >
              🎟️ Raffle
            </h1>

            {/* Prize Amount */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginBottom: "40px",
              }}
            >
              <p
                style={{
                  fontSize: "24px",
                  color: "#9ca3af",
                  margin: "0",
                  marginBottom: "10px",
                }}
              >
                Prize Pool
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "64px",
                    fontWeight: "bold",
                    color: "#f3f4f6",
                  }}
                >
                  {prizeAmount}
                </span>
                <span
                  style={{
                    fontSize: "36px",
                    color: "#3b82f6",
                    fontWeight: "600",
                  }}
                >
                  TOKENS
                </span>
              </div>
            </div>

            {/* Creator Info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 32px",
                backgroundColor: "#1e293b",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            >
              <span style={{ color: "#9ca3af", fontSize: "20px" }}>Created by</span>
              <span style={{ color: "#e5e7eb", fontSize: "20px", fontWeight: "600" }}>
                {shortOwner}
              </span>
            </div>

            {/* Winner Info (if exists) */}
            {winner !== "0x0000000000000000000000000000000000000000" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px 32px",
                  backgroundColor: "#1e293b",
                  borderRadius: "12px",
                  border: "2px solid #10b981",
                }}
              >
                <span style={{ color: "#10b981", fontSize: "20px" }}>🏆 Winner:</span>
                <span style={{ color: "#e5e7eb", fontSize: "20px", fontWeight: "600" }}>
                  {`${winner.slice(0, 6)}...${winner.slice(-4)}`}
                </span>
              </div>
            )}

            {/* Call to Action */}
            {isActive && (
              <p
                style={{
                  fontSize: "18px",
                  color: "#6b7280",
                  margin: "0",
                  marginTop: "30px",
                }}
              >
                Enter now for a chance to win!
              </p>
            )}
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
            backgroundColor: "#111827",
          }}
        >
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#e5e7eb",
            }}
          >
            Raffle
          </h1>
          <p
            style={{
              fontSize: "24px",
              color: "#9ca3af",
            }}
          >
            View this raffle on-chain
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