import React from "react"
import { EventHandlers } from "./EventHandlers"
import { Label } from "./Label"

export function Code({ code }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 32,
        left: "-50%",
        backgroundColor: "#1d1d1d",
        color: "#fff",
        fontFamily: "monospace",
        borderRadius: 20,
        overflow: "hidden",
        padding: 16,
        border: "1px solid #000",
        width: 400,
        zIndex: 999
      }}
    >
      {code}
    </div>
  )
}
