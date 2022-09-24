import { EjectedMass } from "./cells/ejectedmass.js";
import { PlayerCell } from "./cells/player.js";
import { packet } from "./util.js";
const empty = new Uint8Array()
const players = new Map
export class PlayerSocket{
	x = 0; y = 0; z = .5; mz = 1
	rw = 100; rh = 100
	dx = 0; dy = 0
	cached = new Set
	cached2 = new Set
	cells = new Set
	kind = 0
	name = empty
	score = 0
	id = 0
	spectating = null
	pong = 0
	ping = 0
	constructor(socket, arena){
		this.ws = socket
		this.arena = arena
	}
	makeid(){
		let i = 0
		while(players.has(++i));
		if(i == 65536)return 0
		this.id = i
		players.set(i, this)
		return i
	}
	spectate(id){
		this.z = 0.2
		this.spectating = players.get(id) || null
	}
	control(){
		if(this.spectating){
			this.x = this.spectating.x
			this.y = this.spectating.y
			this.z = this.spectating.z
			return
		}
		const {speedexponent, speed} = CONFIG.player
		const x = this.dx / this.z * this.mz + this.x
		const y = this.dy / this.z * this.mz + this.y
		let score = 0
		for(const cell of this.cells){
			if(!cell.m){
				this.cells.delete(cell);
				if(!this.cells.size)this.died()
				continue
			}
			score += cell.m
			if(cell.age <= 20)continue
			let dx = (x - cell.x) * this.z / 4
			let dy = (y - cell.y) * this.z / 4
			const d = Math.sqrt(dx * dx + dy * dy) / (cell.m ** -speedexponent * speed)
			if(d > 1)dx /= d, dy /= d
			const smoothness = cell.age < 30 ? 15 : 5
			cell.dx += (dx - cell.dx) / smoothness
			cell.dy += (dy - cell.dy) / smoothness
		}
		this.reframe()
		this.score = score
	}
	reframe(){
		let x = 0, y = 0, r = 0
		const count = this.cells.size
		if(!count)return
		for(const cell of this.cells){
			x += cell.x
			y += cell.y
			r += cell.r
		}
		this.x = x / count
		this.y = y / count
		this.z = Math.min(.6, 10 / Math.sqrt(r))
	}
	died(){
		players.delete(this.id)
		this.score = 0
		packet.setUint8(0, 2)
		this.send(new Uint8Array(packet.buffer, 0, 1))
	}
	newcell(x, y, m){
		if(this.cells.size >= CONFIG.player.maxcells)return null
		const c = new PlayerCell(x, y, this)
		c.m = m
		c.kind = this.kind
		this.cells.add(c)
		this.arena.add(c)
		c.nameid = this.id
		return c
	}
	split(){
		let t = this.cells.size
		const minmass = CONFIG.player.minmass * 2
		for(const cell of this.cells){
			if(cell.m < minmass)continue
			const double = this.newcell(cell.x, cell.y, cell.m / 2)
			if(!double)break
			cell.m /= 2
			const fac = Math.min(1000, 50 / Math.sqrt(cell.dx * cell.dx + cell.dy * cell.dy))
			double.dx = cell.dx * fac
			double.dy = cell.dy * fac
			if(!--t)break
		}
	}
	eject(){
		if(this.arena.ejectedCount >= CONFIG.eject.max)return
		const loss = CONFIG.eject.mass / CONFIG.eject.efficiency
		const speed = CONFIG.eject.speed, rand = CONFIG.eject.randomthrow
		for(const cell of this.cells){
			if(cell.m < CONFIG.player.minmass + loss)continue
			const fac = Math.sqrt(cell.dx * cell.dx + cell.dy * cell.dy) || 1
			const blob = new EjectedMass(cell.x + cell.dx * cell.r / fac, cell.y + cell.dy * cell.r / fac, CONFIG.eject.mass, cell.kind | 0x1000)
			cell.m -= loss
			//TODO: spawn at surface
			blob.dx = cell.dx * speed / fac + Math.random() * rand - rand/2
			blob.dy = cell.dy * speed / fac + Math.random() * rand - rand/2
			this.arena.add(blob)
		}
	}
	send(buf, critical = true){
		if(this.ws._socket._writableState.buffered.length){
			//can't reuse buffer; must clone
			if(!critical)return //skip
			const b = Buffer.alloc(buf.byteLength)
			b.set(buf, 0)
			this.ws.send(b)
		}else this.ws.send(buf)
	}
	[Symbol.for('nodejs.util.inspect.custom')](){
		return this.cells.size ? 'Player(\x1b[33m'+this.cells.size+'\x1b[m) [...]' : 'Player []'
	}
	debug(){
		const name = dec.decode(this.name).replace(/\W/g,"")||'unnamed'
		return '\x1b[m: Player \x1b[30m"'+name+'"\x1b[m (cells: \x1b[33m' + this.cells.size + '\x1b[m, score: \x1b[33m'+Math.floor(this.score)+'\x1b[m)'
	}
	get ip(){return this.ws._socket.remoteAddress}
}
export const dec = new TextDecoder()