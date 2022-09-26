import { c, z } from "./arena.js"
import { h, w } from "./messages.js"
const PI2 = Math.PI * 2
function jelltick(p, v, n, x, y){
	const corr = Math.max(-y, -x, x - w, y - h) / 100 - 0.2
	if(corr > 0)return v + Math.random() * 0.2 - 0.1 - corr
	return p * 0.1 + n * 0.1 + v * 0.75 + Math.random() * 0.2 - 0.1
}
function pass(v, k, i){
	if(k)return v / 2 + (i & 1 ? 1 : 0)
	else return v
}

export function circle(x, y, r){
	c.arc(x, y, r, 0, PI2)
}
export function jagged(x, y, r, cell){
	const intensity = 1 + c.lineWidth / r / 2
	let high = true
	let spikes = cell.points.length
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
export function jelly(x, y, r, cell, arg){
	const {points, x: cellx, y: celly, r: cellr} = cell
	const {lineWidth} = c
	const rr = lineWidth / r, rz = 1 / r * cell.r
	const min = Math.max(-cellr, -200) * z / lineWidth
	let i = points.length, o = 0
	if(i < 2)return circle(x, y, r)
	let cx = Math.sin(PI2 / i), cy = Math.cos(PI2 / i)
	const first = points[0]
	let f = Math.max(min, jelltick(points[i - 1], first, points[1], cellx, celly + cellr + lineWidth * first * rz))
	c.moveTo(x, y + r + lineWidth * pass(f, arg, 0))
	let ax = 0, ay = r
	while(--i){
		const p = points[i]
		let v = Math.max(min, jelltick(i > 1 ? points[i - 1] : first, p, points[o], cellx + (ax + lineWidth * p) * rz, celly + (ay + lineWidth * p) * rz))
		points[o] = f; f = v
		o = ay * cy - ax * cx
		ax = ax * cy + ay * cx
		ay = o
		v = 1 + pass(v, arg, i) * rr
		c.lineTo(x + ax * v, y + ay * v)
		o = i
	}
	points[1] = f
	c.closePath()
}