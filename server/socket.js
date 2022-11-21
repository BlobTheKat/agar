import { idlebots } from "./agar_arena.js";
import { bot } from "./bot.js";
import { EjectedMass } from "./cells/ejectedmass.js";
import { PlayerCell } from "./cells/player.js";
import { colors, packet } from "./util.js";
const specname = Uint8Array.of(83, 112, 101, 99, 116, 97, 116, 111, 114) //"Spectator"
export const players = new Map
let speedexponent = 0, speed = 0
let loss = 0, ejectspeed = 0, ejectrand = 0
config(() => {
	({speedexponent, speed} = CONFIG.player)
	loss = CONFIG.eject.mass / CONFIG.eject.efficiency
	ejectspeed = CONFIG.eject.speed
	ejectrand = CONFIG.eject.randomthrow
})

function rmcells(sock){
	for(const c of sock.cells)sock.arena.remove(c)
}

export class PlayerSocket{
	x = 0; y = 0; z = .5; mz = 1
	rw = 100; rh = 100
	dx = 0; dy = 0
	cached = new Set
	cached2 = new Set
	cells = new Set
	kind = 0
	name = specname
	score = 0
	id = 0
	spectating = null
	spectated = 0
	ping = 0
	ratelimit = 0
	penalty = 0
	constructor(socket, arena){
		this.ws = socket
		this.arena = arena
	}
	cooldown(ms){
		const now = Date.now()
		const next = Math.max(this.ratelimit, now - 10000) + ms
		if(next > now)return true
		this.ratelimit = next
		return false
	}
	play(name){
		if(players.size >= CONFIG.maxplayers)return this.spectate(0)
		const teams = Math.min(CONFIG.teams, colors.length)
		if(this.spectating)this.spectating.spectated--,this.spectating = null
		if(this.ws){
			packet.setUint8(0, 1)
			this.send(packet, 1)
		}
		this.dx = this.dy = 0
		if(this.cells.size)return
		let id = 0
		while(players.has(++id));
		if(id == 65536)return
		this.id = id
		players.set(id, this)
		const cell = new PlayerCell(...this.arena.randpos(), this, teams ? this.kind || colors[Math.floor(Math.random() * teams)] : undefined)
		cell.age = 50
		this.kind = cell.kind
		this.cells.add(cell)
		this.arena.add(cell)
		this.name = name
		cell.nameid = id
	}
	spectate(id){
		this.z = 0.2
		this.mz = 1
		if(this.spectating = players.get(id) || null)this.spectating.spectated++
	}
	control(){
		if(this.spectating){
			this.x = this.spectating.x
			this.y = this.spectating.y
			this.z = this.spectating.z
			return
		}
		this.reframe()
		if(!this.ws)bot(this)
		const x = this.dx / this.z * this.mz + this.x
		const y = this.dy / this.z * this.mz + this.y
		let score = 0
		for(const cell of this.cells){
			if(!cell.m){
				this.cells.delete(cell)
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
	disconnected(){
		if(!this.id)return
		players.delete(this.id)
		if(this.spectating)this.spectating.spectated--
		for(const cell of this.cells)cell.dx = cell.dy = 0,cell.kind=0x2666
		setTimeout(rmcells, CONFIG.celltimeout * 1000, this)
	}
	died(menu = true){
		this.name = specname
		players.delete(this.id)
		this.id = 0
		this.score = 0
		if(this.ws){
			if(menu){
				packet.setUint8(0, 2)
				this.send(packet, 1)
			}
		}else this.arena.botCount--, idlebots.push(this)
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
		for(const cell of this.cells){
			if(cell.m < CONFIG.player.minmass + loss)continue
			const fac = Math.sqrt(cell.dx * cell.dx + cell.dy * cell.dy) || 1
			const blob = new EjectedMass(cell.x + cell.dx * cell.r / fac, cell.y + cell.dy * cell.r / fac, CONFIG.eject.mass, cell.kind | 0x1000)
			cell.m -= loss
			//TODO: spawn at surface
			blob.dx = cell.dx * ejectspeed / fac + Math.random() * ejectrand - ejectrand/2
			blob.dy = cell.dy * ejectspeed / fac + Math.random() * ejectrand - ejectrand/2
			this.arena.add(blob)
		}
	}
	send({buffer}, i, critical = true){
		if(this.ws._socket._writableState.buffered.length){
			//can't reuse buffer; must clone
			if(!critical)return //skip
			const b = Buffer.alloc(i)
			b.set(new Uint8Array(buffer, 0, i), 0)
			this.ws.send(b)
		}else this.ws.send(new Uint8Array(buffer, 0, i))
	}
	[Symbol.for('nodejs.util.inspect.custom')](){
		return this.cells.size ? 'Player(\x1b[33m'+this.cells.size+'\x1b[m) [...]' : 'Player []'
	}
	debug(){
		const name = dec.decode(this.name).replace(/\W/g,"")||'unnamed'
		return '\x1b[32m' + this.id + '\x1b[m: Player \x1b[90m"'+name+'"\x1b[m (cells: \x1b[33m' + this.cells.size + '\x1b[m, score: \x1b[33m'+Math.floor(this.score)+'\x1b[m)'
	}
	get ip(){return this.ws._socket.remoteAddress}
}
export const dec = new TextDecoder()