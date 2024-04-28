import { Arena } from './arena.js'
import { max_width, max_height } from './config.js'
import { Food } from './cells/food.js'
import { Virus } from './cells/virus.js'
import { packet, packet8 } from './util.js'
import { MotherVirus } from './cells/mothervirus.js'
import { PlayerSocket, players } from './socket.js'
const safe = Math.floor(packet.byteLength - 31)
let i = 13
function encode({x, y, r, kind, id, nameid}){
	if(i >= safe)return
	packet.setInt16(i + 14, kind)
	packet.setInt32(i + 10, r)
	packet.setInt32(i + 7, y)
	packet.setInt32(i + 4, x + (id / 256 & 0xFF000000))
	packet.setInt32(i, id)
	packet.setUint16(i + 16, nameid)
	i += 18
}
export const idlebots = []
function newbot(){
	const sock = new PlayerSocket(null, arena)
	sockets.add(sock)
	return sock
}
const enc = new TextEncoder()
const names = []
config(() => {
	while(names.length)names.pop()
	for(const n of CONFIG.bots.names)names.push(enc.encode(n))
	if(!names.length)names.push('')
})
export const arena = new class extends Arena{
	foodCount = 0
	virusCount = 0
	players = 0
	ejectedCount = 0
	botCount = 0
	tillReset = +CONFIG.autoreset || 0
	tick(){
		super.tick()
		if(CONFIG.autoreset && --this.tillReset <= 0){
			this.reset()
			this.tillReset = CONFIG.autoreset
			console.info('Arena auto-reset!')
		}
		if(this.ticks % 20)return
		for(let i = CONFIG.bots.amount - (players.size + this.botCount >> 1); i > 0; i--){
			this.botCount++
			(idlebots.pop() || newbot()).play(names[Math.floor(Math.random() * names.length)])
		}
		for(let i = Math.min(CONFIG.food.spawn * 20, CONFIG.food.min - this.foodCount); i > 0; i--){
			const f = new Food(...super.randpos())
			super.add(f)
		}
		for(let i = Math.min(CONFIG.virus.spawn * 20, CONFIG.virus.min - this.virusCount); i > 0; i--){
			const f = Math.random() < CONFIG.mothervirus.ratio ? new MotherVirus(...super.randpos()) : new Virus(...super.randpos())
			super.add(f)
		}
	}
}(Math.min(CONFIG.width, max_width), Math.min(CONFIG.height, max_height))

let tps = 20, last = Date.now()
setInterval(function tick(){
	const now = Date.now()
	let dt = now - last
	if(dt<50) return
	last = Math.min(last+dt, now-50)
	tps += (1000 / dt - tps) / 10
	if(sockets.size - arena.botCount - idlebots.length < 1)return
	arena.tick()
	const teams = (!!CONFIG.teams << 7) + (CONFIG.skins << 6)
	if(!(arena.ticks % 30)){
		i = 9
		packet.setUint8(6, Math.min(200, tps * 5))
		packet.setUint16(7, players.size)
		for(const s of sockets){
			if(!s.score)continue
			packet.setUint8(i, s.name.length)
			packet8.set(s.name, ++i)
			i += s.name.length
			packet.setFloat32(i, s.score)
			packet.setUint16(i + 4, s.id); i += 6
			if(teams >> 7)packet.setUint16(i, s.kind), i += 2
		}
		packet8[0] = 16
		for(const sock of sockets){
			if(!sock.ws)continue
			if(sock.ping > 65535){
				packet.setUint16(6, 0)
				if(now - sock.ping > 30e3){
					sock.ws.terminate()
					sockets.delete(sock)
					continue
				}
			}else packet.setUint16(3, sock.ping),sock.ping = now
			packet.setUint16(1, sock.id)
			packet.setUint8(5, teams + Math.min(sock.spectated, 63))
			sock.send(packet, i)
		}
	}
	for(const sock of sockets){
		sock.control()
		if(!sock.ws)continue
		let a = sock.cached2; sock.cached2 = sock.cached, sock.cached = a
		i = 13
		const rw = sock.rw / sock.z * sock.mz, rh = sock.rh / sock.z * sock.mz
		const x0 = sock.x - rw, x1 = sock.x + rw, y0 = sock.y - rh, y1 = sock.y + rh
		arena.select(x0, x1, y0, y1, cell => {
			if(cell.x + cell.r < x0 || cell.x - cell.r >= x1 || cell.y + cell.r < y0 || cell.y - cell.r >= y1) return
			sock.cached2.add(cell)
			if(!a.delete(cell) || arena.active.has(cell))encode(cell)
		})
		packet.setUint32(9, Math.log(sock.z / sock.mz) * 1e6 + 10e6)
		packet.setUint32(6, sock.y)
		packet.setUint32(3, sock.x)
		packet.setUint32(0, Math.floor(i / 18))
		sock.send(packet, i, false)
		i = 1
		packet8[0] = 3
		try{
			for(const cell of a){
				packet.setUint32(i, cell.id)
				packet.setUint8(i + 4, cell.id / 4294967296)
				i += 5
				a.delete(cell)
			}
		}catch{}
		sock.send(packet, i)
	}
}, 1)
export const sockets = new Set
export const bans = new Set
export { default as messages } from './messages.js'
export { PlayerSocket } from './socket.js'
export * as cmds from './cli.js'