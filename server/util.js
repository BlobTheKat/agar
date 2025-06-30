import { MAX_PACKET_SIZE } from "./config.js"

export const colors = []
for(let i = 0; i < 15; i++)
	colors.push(0xF00 + i*16, 0x0F0 + i, 0x00F + i*256, 0xFF0 - i*256, 0x0FF - i*16, 0xF0F - i)

export const packet = new DataView(new Uint8Array(min(268435456, MAX_PACKET_SIZE)).buffer)
export const packet8 = new Uint8Array(packet.buffer)

const ansiReplacer = a => {
	const c = a.charCodeAt(0)
	return c == 127 ? '\u2421' : String.fromCharCode(0x2400 | c)
}
export const escapeAnsi = v => v.replace(/[\x00-\x1f\x7f]/g, ansiReplacer)

export const dec = new TextDecoder()
export const enc = new TextEncoder()