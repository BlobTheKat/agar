/*//higher = less quads produced, less memory, but heavier on performance
const MAX_W = 100
//higher = slightly better performance, although above a few million will start to badly impact memory
const RECYCLE_SIZE = 1000

const recycle = []
//~120B per quad
class QuadNode extends Array{
	constructor(a){
		super()
		this.parent = a
		this.w = 33 + (a.w & 31)
	}
	_add(cell){
		const w = this.w & 31
		const x = cell.x << w, y = cell.y << w
		if(this.w < 32)this[y < 0 ? x < 0 ? 3 : 2 : x < 0 ? 1 : 0]._add(cell)
		else if(this.w + cell.w >= MAX_W){
			//split
			this.w &= 31
			let tl = this.new()
			let tr = this.new()
			let bl = this.new()
			let br = this.new()
			for(let v; v = this.pop();){
				if(v.y << w < 0)if(v.x << w < 0)br._add(v); else bl._add(v)
				else if(v.x << w < 0)tr._add(v); else tl._add(v)
			}
		}else this.push(cell), this.w += cell.w << 5
	}
	move(cell, dx, dy){
		const fac = -1 >>> (this.w & 31)
		let x = (cell.x / fac % 1) + dx / fac, y = (cell.y / fac % 1) + dy / fac
		cell.x += dx
		cell.y += dy
		if(x >= 0 && x < 1 && y >= 0 && y < 1)return
		const p = this.parent
		if(this == p[0])p.reposition(cell, x / 2, y / 2)
		else if(this == p[1])p.reposition(cell, x / 2 + .5, y / 2)
		else if(this == p[2])p.reposition(cell, x / 2, y / 2 + .5)
		else p.reposition(cell, x / 2 + .5, y / 2 + .5)
		this._remove(cell)
	}
	reposition(cell, x, y){
		if(x >= 0 && x < 1 && y >= 0 && y < 1){
			this._add(cell, x, y)
			return
		}
		const p = this.parent
		if(this == p[0])p.reposition(cell, x / 2, y / 2)
		else if(this == p[1])p.reposition(cell, x / 2 + .5, y / 2)
		else if(this == p[2])p.reposition(cell, x / 2, y / 2 + .5)
		else p.reposition(cell, x / 2 + .5, y / 2 + .5)
	}
	new(){
		let a = recycle.pop()
		if(a)return a.parent = this, a.w = 33 + (this.w & 31), a
		return new QuadNode(this)
	}
	_remove(cell){
		if(this.w < 32){

		}
		this.splice(this.indexOf(cell), 1)

	}
}
const maxSize = 65536 //no touchey or everything break
class World{
	constructor(){
		this.root = new QuadNode({w: Math.clz32(maxSize*2-1)})

	}
}*/