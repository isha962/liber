import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#111111",
          borderRadius: 16,
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
          <path
            d="M12 18C20 12 28 12 32 18C36 12 44 12 52 18V44C44 38 36 38 32 44C28 38 20 38 12 44V18Z"
            stroke="#fc4c02"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5.5"
          />
          <path d="M32 18V44" stroke="#fc4c02" strokeLinecap="round" strokeWidth="5.5" />
        </svg>
      </div>
    ),
    size,
  );
}
