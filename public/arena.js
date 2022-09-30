import {layers} from './messages.js'
export let x = 0
export let y = 0
export let z = 0.5
let scale = 1, sw = 0, sh = 0
function calc_size(){
	let w = innerWidth, h = innerHeight
	let sd = Math.max(w / 2000, h / 1125)
	if(sd > 1)w /= sd, h /= sd
	else{
		sd = Math.min(w / 800, h / 450)
		if(sd < 1)w /= sd, h /= sd
		else sd = 1
	}
	w = Math.round(w); h = Math.round(h)
	if(w != sw || h != sh)resized(w, h, sd)
}
function resized(w, h, sd){
	if(!ws)return
	scale = sd
	packet.setUint8(0, 32)
	packet.setUint16(1, sw = w)
	packet.setUint16(3, sh = h)
	ws.send(new Uint8Array(packet.buffer, 0, 5))
}
export let t = {x: 0, y: 0, z: 1}
let last = Date.now()
export const c = arena.getContext('2d')
let fps = 45
requestAnimationFrame(function a(){
	calc_size()
	sel.style.transform = 'translateY(-50%) scale(' + (innerWidth < 400 ? (innerWidth / 400) : 1) + ')'
	let w = innerWidth / 2, h = innerHeight / 2
	showcol = !+localStorage.nc
	showmass = !!+localStorage.sm
	shownames = !+localStorage.nn
	showskins = !+localStorage.ns
	staticskins = !!+localStorage.ss
	noshapes = !!+localStorage.nj
	staticshapes = !!+localStorage.sj
	max = Math.max(innerWidth, innerHeight)
	x0 = w - max/2; y0 = h - max/2
	const dt = Math.min(.05, (Date.now() - last) / 1000)
	fps += (1 / dt - fps) / 10
	if(!fps)fps = 1
	myscore.children[2].textContent = 'FPS: '+Math.round(fps)
	last = Date.now()
	if(!+localStorage.lc){
		x += (t.x - x) * dt * 20; y += (t.y - y) * dt * 20
		z *= (t.z * scale / z) ** (dt * 3)
	}
	if(!z)z = t.z || 1
	const left = x * z - w, top = y * z - h
	px = +localStorage.lr ? devicePixelRatio < 1.5 ? 0.5 : 1 : devicePixelRatio
	if(!+localStorage.ec){
		arena.width = Math.round(innerWidth * px)
		arena.height = Math.round(innerHeight * px)
	}
	c.lineWidth = staticshapes ? Math.round(5 * px) : Math.min(Math.round(px * z * 8), Math.round(15 * px))
	c.textBaseline = 'middle'
	c.textAlign = 'center'
	c.lineJoin = 'miter'
	if(!+localStorage.rz)for(const k in layers)for(const cell of layers[k]){
		cell.tick(dt)
		const r = cell.r*z*px, x = (cell.x * z - left)*px, y = (cell.y * z - top)*px
		cell.draw(x, y, r)
	}
	else for(const k of Object.keys(layers).reverse())for(const cell of layers[k]){
		cell.tick(dt)
		const r = cell.r*z*px, x = (cell.x * z - left)*px, y = (cell.y * z - top)*px
		cell.draw(x, y, r)
	}
	arena.style.backgroundSize = +localStorage.pg ? '800px' : z * 800 + 'px'
	arena.style.backgroundPosition = +localStorage.pg ? w - x * 0.1 + 'px ' + (h - y * 0.1) + 'px' : -left + 'px ' + -top + 'px'
	arena.style.imageRendering = z < 1 ? '' : 'pixelated'
	requestAnimationFrame(a)
})
export let showcol = true
export let showmass = false
export let shownames = true
export let showskins = true
export let staticskins = false
export let noshapes = false
export let staticshapes = false
export let x0 = 0, y0 = 0, max = 1, px = 1