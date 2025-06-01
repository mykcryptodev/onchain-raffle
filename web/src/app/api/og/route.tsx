import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
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
              padding: "40px",
              backgroundColor: "rgba(17, 24, 39, 0.9)",
              borderRadius: "20px",
              border: "2px solid #3b82f6",
              boxShadow: "0 0 40px rgba(59, 130, 246, 0.5)",
            }}
          >
            <h1
              style={{
                fontSize: "72px",
                fontWeight: "bold",
                background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                backgroundClip: "text",
                color: "transparent",
                margin: "0",
                marginBottom: "20px",
              }}
            >
              Raffle
            </h1>
            <p
              style={{
                fontSize: "28px",
                color: "#e5e7eb",
                margin: "0",
                textAlign: "center",
                maxWidth: "600px",
              }}
            >
              Create provably fair onchain raffles
            </p>
            <div
              style={{
                display: "flex",
                gap: "20px",
                marginTop: "40px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  backgroundColor: "#1e293b",
                  borderRadius: "8px",
                }}
              >
                <span style={{ color: "#3b82f6", fontSize: "24px" }}>🎟️</span>
                <span style={{ color: "#e5e7eb", fontSize: "20px" }}>Fair & Transparent</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  backgroundColor: "#1e293b",
                  borderRadius: "8px",
                }}
              >
                <span style={{ color: "#3b82f6", fontSize: "24px" }}>🔗</span>
                <span style={{ color: "#e5e7eb", fontSize: "20px" }}>On-chain</span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
} 