import { c, staticshapes, z } from "./arena.js"
import { h, w } from "./messages.js"
const PI2 = Math.PI * 2
function jelltick(p, v, n, x, y){
	const corr = Math.max(-y, -x, x - w, y - h) / 100 - .2
	if(corr > 0) return p * 0.1 + n * 0.1 + v * 0.8 + Math.random() * 0.1 - 0.05 - corr
	return p * 0.2 + n * 0.2 + v * 0.55 + Math.random() * 0.2 - 0.1
}

const MITER = 'miter', ROUND = 'round'
export function cellpath(x, y, r, kind, cell){
	const {lineWidth} = c, rr = lineWidth / r
	let i = cell.expectedPoints
	if(i < 10) return c.arc(x, y, r, 0, PI2)
	const cx = Math.sin(PI2 / i), cy = Math.cos(PI2 / i)
	const {points} = cell
	const mask = kind>>3
	c.lineJoin = mask ? MITER : ROUND
	if(points){
		// jelly
		let d = points.length - i
		if(d){
			if(d>0) while(d--) points.pop()
			else while(d++) points.push(points[0] || 0)
		}
		const {x: cellx, y: celly, r: cellr} = cell
		let o = 0
		const rz = cellr / r
		const min = -Math.min(cellr, 70) / (rr * cellr)
		const last = points[i-1]
		let f = Math.max(min, jelltick(points[i - 1], points[0], points[1], cellx, celly + cellr * (1 + points[0] * rr)))
		c.moveTo(x, y + r + lineWidth * f)
		let ax = 0, ay = r
		while(--i){
			const p = (1 + points[i] * rr) * rz
			let v = Math.max(min, jelltick(i >= 1 ? points[i - 1] : last, points[i], points[o], cellx + ax * p, celly + ay * p))
			points[o] = f; f = v
			o = ay * cy - ax * cx
			ax = ax * cy + ay * cx
			ay = o
			v = 1 + (v + (i&mask)) * rr
			c.lineTo(x + ax * v, y + ay * v)
			o = i
		}
		points[1] = f
	}else{
		c.moveTo(x, y + r)
		let ax = 0, ay = r
		while(--i){
			const o = ay * cy - ax * cx
			ax = ax * cy + ay * cx
			ay = o
			const v = 1 + (i&mask) * rr
			c.lineTo(x + ax * v, y + ay * v)
		}
	}
	c.closePath()
}