import React from "react"

export function Label({ children }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 11,
        right: 8,
        fontSize: 12
      }}
    >
      {children}
    </div>
  )
}
