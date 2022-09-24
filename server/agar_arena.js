import { Arena } from './arena.js'
import { max_width, max_height } from './config.js'
import { Food } from './cells/food.js'
import { Virus } from './cells/virus.js'
import { packet } from './util.js'
import { performance } from 'perf_hooks'
import { MotherVirus } from './cells/mothervirus.js'
const safe = Math.floor(packet.length * 0.7)
const packet8 = new Uint8Array(packet.buffer)
let i = 13
function encode({x, y, r, kind, id, nameid}){
	if(i > safe)return
	packet.setInt16(i + 14, kind)
	packet.setInt32(i + 10, r)
	packet.setInt32(i + 7, y)
	packet.setInt32(i + 4, x + (id / 256 & 0xFF000000))
	packet.setInt32(i, id)
	packet.setUint16(i + 16, nameid)
	i += 18
}
export const arena = new class extends Arena{
	foodCount = 0
	virusCount = 0
	players = 0
	ejectedCount = 0
	tick(){
		super.tick()
		for(let i = Math.min(CONFIG.food.spawn, CONFIG.food.min - this.foodCount); i > 0; i--){
			const f = new Food(...super.randpos())
			super.add(f)
		}
		for(let i = Math.min(CONFIG.virus.spawn, CONFIG.virus.min - this.virusCount); i > 0; i--){
			const f = Math.random() < CONFIG.mothervirus.ratio ? new MotherVirus(...super.randpos()) : new Virus(...super.randpos())
			super.add(f)
		}
	}
}(Math.min(CONFIG.width, max_width), Math.min(CONFIG.height, max_height))
let tps = 40, last = Date.now()
setInterval(function tick(){
	const now = Date.now()
	let dt = now - last
	last = now
	tps += (1000 / dt - tps) / 10
	arena.tick()
	if(!(arena.ticks % 30)){
		i = 9
		packet.setUint8(8, Math.min(200, tps * 5))
		for(const s of sockets){
			if(!s.score)continue
			packet.setUint8(i, s.name.length)
			packet8.set(s.name, ++i)
			i += s.name.length
			packet.setFloat32(i, s.score)
			packet.setUint16(i + 4, s.id); i += 6
		}
		packet8[0] = 16
		const buf = new Uint8Array(packet.buffer, 0, i)
		for(const sock of sockets){
			if(sock.ping > 65535){
				packet.setUint16(6, 0)
				if(now - sock.ping > 30e3){
					sock.ws.terminate()
					sockets.delete(sock)
					continue
				}
			}else packet.setUint16(6, sock.ping),sock.ping = now
			packet.setUint32(1, sock.id)
			packet.setUint8(5, sock.id / 4294967296)
			sock.send(buf)
		}
	}
	for(const sock of sockets){
		sock.control()
		let a = sock.cached2; sock.cached2 = sock.cached, sock.cached = a
		i = 13
		const rw = sock.rw / sock.z * sock.mz, rh = sock.rh / sock.z * sock.mz
		const x0 = sock.x - rw, x1 = sock.x + rw, y0 = sock.y - rh, y1 = sock.y + rh
		for(const cell of arena.select(x0, x1, y0, y1)){
			if(cell.x + cell.r < x0 || cell.x - cell.r >= x1 || cell.y + cell.r < y0 || cell.y - cell.r >= y1)continue
			sock.cached2.add(cell)
			if(!a.delete(cell) || arena.active.has(cell))encode(cell)
		}
		packet.setUint32(9, Math.log(sock.z / sock.mz) * 1e6 + 10e6)
		packet.setUint32(6, sock.y)
		packet.setUint32(3, sock.x)
		packet.setUint32(0, Math.floor(i / 18))
		sock.send(new Uint8Array(packet.buffer, 0, i), false)
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
		sock.send(new Uint8Array(packet.buffer, 0, i))
	}
}, 23)
export const sockets = new Set
export const bans = new Set
export {default as messages} from './messages.js'
export { PlayerSocket } from './socket.js'
export * as cmds from './cli.js'