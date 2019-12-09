/** @jsx jsx */
import { css } from "@emotion/core"
import styled from "@emotion/styled"

const light = ["#8e8e93", "#aeaeb2", "#c7c7cc", "#d1d1d6", "#e5e5e9", "#f2f2f7"]
const dark = ["#8e8e93", "#636366", "#48484a", "#3a393c", "#2c2b2e", "#1c1b1e"]

export const MachineContainer = styled.div`
  background-color: ${dark[2]};
  border-radius: 8px;
  overflow: hidden;
  width: fit-content;
`

export const MachineHeader = styled.div`
  background-color: ${dark[3]};
  padding: 8px 12px;
  border-bottom: 1px solid ${dark[4]};
`

export const StateContainer = styled.div`
  border: 1px solid ${dark[4]};
  background-color: ${dark[1]};
  border-radius: 8px;
  overflow: hidden;
  width: fit-content;
`

export const StateHeader = styled.div`
  background-color: ${({ inPath }) => (inPath ? "#ffd84c" : dark[0])};
  color: ${({ inPath }) => (inPath ? "#333" : "#000")};
  font-style: bold;
  padding: 8px;
  padding-right: 60px;
  border-bottom: 1px solid ${dark[4]};
`

export const EventName = styled.span``

export const Event = styled.div``

export const Section = styled.div``
