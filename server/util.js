import { MAX_PACKET_SIZE } from "./config.js"

export const colors = []
for(let i = 0; i < 15; i++)colors.push(0xF00 + i*16, 0x0F0 + i, 0x00F + i*256, 0xFF0 - i*256, 0x0FF - i*16, 0xF0F - i)

export const packet = new DataView(new Uint8Array(Math.min(268435456, MAX_PACKET_SIZE)).buffer)