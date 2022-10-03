import { sockets } from "./agar_arena.js"
import { packet, packet8 } from "./util.js"
export default {
	0(sock, view){
		sock.dx = view.getInt16(0)
		sock.dy = view.getInt16(2)
		sock.mz = Math.max(0.3, Math.min(CONFIG.zoomlimit, sock.mz * 1.001 ** view.getInt16(4)))		
	},
	1(sock, view){
		//play
		sock.play(new Uint8Array(view.buffer, view.byteOffset, Math.min(view.byteLength, 48)))
	},
	2(sock, view){
		//spectate
		if(!sock.spectating){
			packet.setUint8(0, 1)
			sock.send(packet, 1)
		}
		if(sock.cells.size){
			for(const c of sock.cells){
				sock.arena.remove(c)
				sock.cells.delete(c)
			}
			sock.died(false)
		}
		sock.spectate(view.getUint16(0))
	},
	16(sock){
		if(sock.cooldown(100))return
		if(!sock.cells.size)return
		sock.split()
	},
	17(sock){
		if(sock.cooldown(10))return
		if(!sock.cells.size)return
		sock.eject()
	},
	18(sock){
		if(sock.cooldown(200))return
		if(!sock.cells.size)return
		for(let i = CONFIG.eject.gun; i > 0; i--)sock.eject()
	},
	32(sock, view){
		sock.rw = view.getUint16(0)
		sock.rh = view.getUint16(2)
	},
	33(sock){
		if(sock.ping < 65536)return
		sock.ping = Date.now() - sock.ping
	},
	128(sock, view){
		if(sock.cooldown(1000) || view.byteLength > 768)return
		const {length} = sock.name
		packet.setUint8(0, 128)
		packet.setUint8(1, length)
		packet.setUint16(2, sock.kind)
		packet8.set(sock.name, 4)
		packet8.set(new Uint8Array(view.buffer, view.byteOffset), length + 4)
		for(const sock of sockets)if(sock.ws)sock.send(packet, length + view.byteLength + 4)
	}
}