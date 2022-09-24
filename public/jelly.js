import { c, staticshapes } from "./arena.js"
const PI2 = Math.PI * 2
export function circle(x, y, r){
	c.arc(x, y, r, 0, PI2)
}
export function jagged(x, y, r, cell){
	const intensity = 1 + c.lineWidth / r / 2
	let high = true
	let spikes = staticshapes ? (r / 1.5) & -2 : (cell.r / 1.5) & -2
	let i = spikes - 1
	let cx = Math.sin(PI2 / spikes), cy = Math.cos(PI2 / spikes)
	c.moveTo(x, y + r * intensity)
	let ax = 0, ay = r
	while(i--){
		high = !high
		let newy = ay * cy - ax * cx
		ax = ax * cy + ay * cx
		ay = newy
		if(high)c.lineTo(x + ax * intensity, y + ay * intensity)
		else c.lineTo(x + ax / intensity, y + ay / intensity)
	}
	c.closePath()
}