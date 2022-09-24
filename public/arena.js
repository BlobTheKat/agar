import {layers} from './messages.js'
globalThis.x = 0
globalThis.y = 0
globalThis.z = 0.5
globalThis.t = {x: 0, y: 0, z: 1, i: 1}
let last = Date.now()
export const c = arena.getContext('2d')
let fps = 45
requestAnimationFrame(function a(){
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
	myscore.children[3].textContent = 'FPS: '+Math.round(fps)
	last = Date.now()
	if(!+localStorage.lc){
		x += (t.x - x) * dt * 20; y += (t.y - y) * dt * 20
		z *= (t.z / z) ** (dt * 3)
	}
	if(!z)z = t.z || 1
	const left = x * z - w, top = y * z - h
	px = +localStorage.lr ? devicePixelRatio < 1.5 ? 0.5 : 1 : devicePixelRatio
	if(!+localStorage.ec){
		arena.width = Math.round(innerWidth * px)
		arena.height = Math.round(innerHeight * px)
	}
	c.lineWidth = staticshapes ? Math.round(5 * px) : Math.round(px * z * 8)
	c.textBaseline = 'middle'
	c.textAlign = 'center'
	if(!+localStorage.rz)for(const k in layers)for(const cell of layers[k]){
		cell.tick(dt)
		const r = Math.round(cell.r*z*px), x = Math.floor((cell.x * z - left)*px), y = Math.floor((cell.y * z - top)*px)
		cell.draw(x, y, r)
	}
	else for(const k of Object.keys(layers).reverse())for(const cell of layers[k]){
		cell.tick(dt)
		const r = cell.r*z*px, x = (cell.x * z - left)*px, y = (cell.y * z - top)*px
		cell.draw(x, y, r)
	}
	arena.style.backgroundSize = +localStorage.pg ? '50px' : z * 50 + 'px'
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