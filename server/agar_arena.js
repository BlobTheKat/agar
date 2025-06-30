import { Arena } from './arena.js'
import { max_width, max_height } from './config.js'
import { Food } from './cells/food.js'
import { Virus } from './cells/virus.js'
import { packet, packet8, enc } from './util.js'
import { MotherVirus } from './cells/mothervirus.js'
import { PlayerSocket, players } from './socket.js'
const safe = floor(packet.byteLength - 31)
let i = 13
function encode({x, y, r, kind, id, _nameid}){
	if(i >= safe) return false
	packet.setUint16(i + 14, kind)
	packet.setInt32(i + 10, r)
	packet.setInt32(i + 7, y)
	packet.setInt32(i + 4, x + (id / 256 & 0xFF000000))
	packet.setInt32(i, id)
	packet.setUint16(i + 16, _nameid)
	i += 18
	return true
}
export const idlebots = []
function newbot(){
	const sock = new PlayerSocket(null, arena)
	sockets.add(sock)
	return sock
}
const names = []
let foodMin = 0, foodSpawn = 0
let virusMin = 0, virusSpawn = 0


export const arena = new class extends Arena{
	foodCount = 0
	virusCount = 0
	players = 0
	ejectedCount = 0
	botCount = 0
	tillReset = +CONFIG.autoreset || 0
	tick(){
		super.tick()
		if(this.ticks % 20) return
		if(CONFIG.autoreset && --this.tillReset <= 0){
			this.reset()
			this.tillReset = CONFIG.autoreset
			console.info('Arena auto-reset!')
		}
		for(let i = CONFIG.bots.amount - (players.size + this.botCount >> 1); i > 0; i--){
			this.botCount++
			(idlebots.pop() || newbot()).play(names[floor(random() * names.length)])
		}
		for(let i = min(foodSpawn, foodMin - this.foodCount); i > 0; i--){
			const f = new Food(super.randx(), super.randy())
			super.add(f)
		}
		const r = CONFIG.mothervirus.ratio
		for(let i = min(virusSpawn, virusMin - this.virusCount); i > 0; i--){
			const f = random() < r ?
				new MotherVirus(super.randx(), super.randy())
				: new Virus(super.randx(), super.randy())
			super.add(f)
		}
	}
}(min(CONFIG.width, max_width), min(CONFIG.height, max_height))

const den2val = d => (+d || 0) * arena.w * arena.h / 1e6
config(() => {
	while(names.length) names.pop()
	for(const n of CONFIG.bots.names) names.push(enc.encode(n))
	if(!names.length) names.push('')
	const {food, virus} = CONFIG
	foodMin = den2val(food.min); foodSpawn = den2val(food.spawn)
	virusMin = den2val(virus.min); virusSpawn = den2val(virus.spawn)
})

let tps = 20, last = performance.now()+1e6, alast = last
setInterval(function tick(){
	const now = performance.now()+1e6
	let dt = now - last
	if(dt<50) return
	last = max(last+50, now-200)
	tps += (-1000/(alast - (alast=now)) - tps) * .1
	if(sockets.size - arena.botCount - idlebots.length < 1) return
	arena.tick()
	const teams = (!!CONFIG.teams << 7) + (CONFIG.skins << 6)
	if(!(arena.ticks % 40)){
		i = 9
		packet.setUint8(6, min(200, round(tps * 10)))
		packet.setUint16(7, players.size)
		for(const s of sockets){
			if(!s.score)continue
			packet.setUint8(i, s.name.length)
			packet8.set(s.name, ++i)
			i += s.name.length
			packet.setFloat32(i, s.score)
			packet.setUint16(i + 4, s.id); i += 6
			if(teams >> 7) packet.setUint16(i, s.kind), i += 2
		}
		packet8[0] = 16
		for(const sock of sockets){
			if(!sock.ws)continue
			if(sock.ping > 65535){
				packet.setUint16(3, 0)
				if(now - sock.ping > 30e3){
					sock.ws.terminate()
					sockets.delete(sock)
					continue
				}
			}else packet.setUint16(3, sock.ping), sock.ping = now
			packet.setUint16(1, sock.id)
			packet.setUint8(5, teams + min(sock.spectated, 63))
			sock.send(packet, i)
		}
	}
	for(const sock of sockets){
		sock.control()
		if(!sock.ws) continue
		const a = sock.cached2; sock.cached2 = sock.cached, sock.cached = a
		i = 13
		const rw = sock.rw / sock.z * sock.mz, rh = sock.rh / sock.z * sock.mz
		const {x, y} = sock
		for(const cell of a) cell._nameid &= ~65536
		arena.select(x-rw, x+rw, y-rh, y+rh, cell => {
			if(abs(cell.x - x) - cell.r > rw || abs(cell.y - y) - cell.r > rh) return
			sock.cached2.push(cell)
			const n = cell._nameid; cell._nameid = n | 65536
			if(n&196608) encode(cell) || sock.cached2.pop()
		})
		packet.setUint32(9, log(sock.z / sock.mz) * 1e6 + 10e6)
		packet.setUint32(6, sock.y)
		packet.setUint32(3, sock.x)
		packet.setUint32(0, floor(i / 18))
		if(i > 13) sock.send(packet, i)
		let j = 0
		packet8[0] = 3
		while(j < a.length){
			i = 1
			try{
				for(; j < a.length; j++){
					const cell = a[j], n = cell._nameid
					if(n&65536) continue
					cell._nameid = n | 65536
					packet.setUint32(i, cell.id)
					packet.setUint8(i + 4, cell.id / 4294967296)
					i += 5
				}
			}catch{}
			if(i > 1) sock.send(packet, i)
		}
		a.length = 0
	}
}, 1)
export const sockets = new Set
export const bans = new Set
export { default as messages } from './messages.js'
export { PlayerSocket, players } from './socket.js'
export * as cmds from './cli.js'