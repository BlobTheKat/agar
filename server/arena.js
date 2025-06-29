import { EjectedMass } from "./cells/ejectedmass.js"
import { Virus } from "./cells/virus.js"
import { base_physics_box_size as minboxsize } from "./config.js"
export class Arena{
	constructor(w, h){
		this.w = w
		this.h = h
		w = -(-w >> minboxsize)
		h = -(-h >> minboxsize)
		this.layers = []
		this.layers2 = []
		this.lw = w
		this.tl = -1
		this.ticks = 0
		do{
			let a = []
			for(let i = w * h; i; i--)a.push(null)
			this.layers.push(a)
			this.layers2.push(w == this.lw ? a : a.slice(0))
			w = w + 1 >> 1
			h = h + 1 >> 1
			this.tl++
		}while(w * h > 16)
		this.size = 0
		this.active = new Set
	}
	add(cell){
		cell.r = ceil(sqrt(cell.m) * 10)
		let li = min(this.tl, 32 - clz32(cell.r - 1 >> minboxsize))
		let w = -(-this.lw >> li), x = cell.x >> minboxsize + li, y = cell.y >> minboxsize + li
		if(li && li <= this.tl){
			const a = this.layers2[li], b = x + y * w
			;(a[b] || (a[b] = new Set)).add(cell)
		}
		while(li <= this.tl){
			const a = this.layers[li], b = x + y * w++
			;(a[b] || (a[b] = new Set)).add(cell)
			w >>= 1; x >>= 1; y >>= 1; li++
		}
		this.size++
		this.active.add(cell)
		cell.added(this)
	}
	remove(cell){
		if(!cell.r) return
		this.size--
		cell.removed(this)
		this.active.delete(cell)
		let li = min(this.tl, 32 - clz32(cell.r - 1 >> minboxsize))
		let w = -(-this.lw >> li), x = cell.x >> minboxsize + li, y = cell.y >> minboxsize + li
		if(li && li <= this.tl){
			const a = this.layers2[li], b = x + y * w
			const s = a[b]
			s.delete(cell)
			if(!s.size)a[b] = null
		}
		while(li <= this.tl){
			const a = this.layers[li], b = x + y * w++
			const s = a[b]
			s.delete(cell)
			if(!s.size)a[b] = null
			w >>= 1; x >>= 1; y >>= 1; li++
		}
		cell.m = cell.r = 0
	}
	repos(cell, oldx, oldy, oldr){
		let li = min(this.tl, 32 - clz32(oldr - 1 >> minboxsize))
		const li2 = min(this.tl, 32 - clz32(cell.r - 1 >> minboxsize))
		const back = max(li,li2,min(this.tl + 1, 32 - min(clz32(oldx ^ cell.x), clz32(oldy ^ cell.y)) - minboxsize))
		if(li == li2 && li == back) return
		let x = oldx >> minboxsize + li, y = oldy >> minboxsize + li
		let w = -(-this.lw >> li)
		if(li){
			const a = this.layers2[li], b = x + y * w
			const s = a[b]
			s.delete(cell)
			if(!s.size)a[b] = null
		}
		while(li < back){
			const a = this.layers[li], b = x + y * w++
			const s = a[b]
			s.delete(cell)
			if(!s.size)a[b] = null
			w >>= 1; x >>= 1; y >>= 1; li++
		}
		li = li2; w = -(-this.lw >> li)
		x = cell.x >> minboxsize + li; y = cell.y >> minboxsize + li
		if(li){
			const a = this.layers2[li], b = x + y * w
			;(a[b] || (a[b] = new Set)).add(cell)
		}
		while(li < back){
			const a = this.layers[li], b = x + y * w++
			;(a[b] || (a[b] = new Set)).add(cell)
			w >>= 1; x >>= 1; y >>= 1; li++
		}
	}
	[Symbol.for('nodejs.util.inspect.custom')](){
		return this.size ? 'Arena(\x1b[33m'+this.size+'\x1b[m) [...]' : 'Arena []'
	}
	select(x0, x1, y0, y1, cb){
		let li = min(this.tl, 32 - clz32(x1 - x0 + y1 - y0 - .1 >> minboxsize + 3))
		const l = this.layers[li]
		let w = -(-this.lw >> li), h = l.length / w
		let sx = max(0, (x0 >> minboxsize + li) - 1), ex = min(w, -(-x1 >> minboxsize + li) + 1)
		let sy = max(0, (y0 >> minboxsize + li) - 1), ey = min(h, -(-y1 >> minboxsize + li) + 1)
		let eyw = ey * w
		for(let y = sy * w;y < eyw; y += w) for(let x = sx;x < ex;x++){
			const s = l[x + y];if(s)for(const i of s)if(cb(i))break
		}
		while(++li <= this.tl){
			const l = this.layers2[li]
			w = w + 1 >> 1; h = h + 1 >> 1
			sx = sx ? sx - 1 >> 1 : 0; sy = sy ? sy - 1 >> 1 : 0
			ex = min(ex + 2 >> 1, w); ey = min(ey + 2 >> 1, h)
			eyw = ey * w
			for(let y = sy * w;y < eyw; y += w)for(let x = sx;x < ex;x++){
				const s = l[x + y];if(s)for(const i of s)if(cb(i))break
			}
		}
	}
	tick(){
		let t = this.active.size
		for(const cell of this.active){
			const {x: oldx, y: oldy, r: oldr, dx: olddx, dy: olddy} = cell
			cell.x += cell.dx
			cell.y += cell.dy
			cell.dx *= 1 - CONFIG.friction
			cell.dy *= 1 - CONFIG.friction
			if(abs(cell.dx) < 0.01)cell.dx = 0
			if(abs(cell.dy) < 0.01)cell.dy = 0
			this.select(cell.x - cell.r, cell.x + cell.r, cell.y - cell.r, cell.y + cell.r, cell2 => {
				if(cell2 == cell) return
				const dx = cell2.x - cell.x, dy = cell2.y - cell.y
				const d = sqrt(dx * dx + dy * dy)
				if(d > cell.r + cell2.r) return
				const {x: oldx2, y: oldy2, r: oldr2} = cell2
				cell.touched(cell2, d, this)
				if(!this.active.has(cell2))cell2.touched(cell, d, this)
				const massChanged = oldr2 * oldr2 < cell2.m * 100 || (oldr2 - 1) * (oldr2 - 1) >= cell2.m * 100
				if(massChanged && cell2.m)cell2.r = ceil(sqrt(cell2.m) * 10)
				if(cell2.x<0)cell2.x=0,cell2.touchedborder(2)
				if(cell2.y<0)cell2.y=0,cell2.touchedborder(0)
				if(cell2.x>=this.w)cell2.x=this.w - 0.001,cell2.touchedborder(3)
				if(cell2.y>=this.w)cell2.y=this.w - 0.001,cell2.touchedborder(1)
				if(oldx2 != cell2.x || oldy2 != cell2.y || cell2.dx || cell2.dy || massChanged){
					this.active.add(cell2)
					if(oldx2 >> minboxsize != cell2.x >> minboxsize || oldy2 >> minboxsize != cell2.y >> minboxsize || massChanged)
						repos.push(cell2),rc.push(oldr2, oldy2, oldx2)
				}
				return !cell.m
			})
			let a
			while(a = repos.pop()){
				if(!a.m){
					a.x=rc.pop();a.y=rc.pop();a.r=rc.pop();
					this.remove(a)
				}else this.repos(a, rc.pop(), rc.pop(), rc.pop())
			}
			if(!cell.tick(this) && !olddx && !olddy)this.active.delete(cell)
			if(!cell.m)cell.x = oldx, cell.y = oldy, cell.r = oldr, this.remove(cell)
			else{
				if(cell.x<0)cell.x=0,cell.touchedborder(2)
				if(cell.y<0)cell.y=0,cell.touchedborder(0)
				if(cell.x>=this.w)cell.x=this.w - 1,cell.touchedborder(3)
				if(cell.y>=this.w)cell.y=this.w - 1,cell.touchedborder(1)
				const massChanged = oldr * oldr < cell.m * 100 || (oldr - 1) * (oldr - 1) >= cell.m * 100
				if(massChanged)cell.r = ceil(sqrt(cell.m) * 10)
				if(oldx >> minboxsize != cell.x >> minboxsize || oldy >> minboxsize != cell.y >> minboxsize || massChanged)
					this.repos(cell, oldx, oldy, oldr)
			}
			if(!--t)break
		}
		this.ticks++
	}
	randx(){ return floor(random() * this.w) }
	randy(){ return floor(random() * this.h) }
	reset(){ this.select(0,this.w,0,this.h, cell => this.remove(cell)) }
}
const repos = [], rc = []