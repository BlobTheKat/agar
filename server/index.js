import { WebSocketServer } from 'ws'
import {repl} from 'basic-repl'
import YAML from 'yaml'
import {promises as fs} from 'fs'
import { packet } from './util.js';
globalThis.CONFIG = YAML.parse(''+await fs.readFile('../config.yaml'))
;(async()=>{for await(const _ of fs.watch('../config.yaml'))Object.assign(globalThis.CONFIG, YAML.parse(''+await fs.readFile('../config.yaml')))})()
const { sockets, arena, messages, PlayerSocket } = await import('./agar_arena.js')
const wss = new WebSocketServer({port: CONFIG.port || 37730})
wss.on('connection', (ws, {url}) => {
	let [w, h] = url.slice(1).split('/')
	w = Math.min(2000, +w || 640); h = Math.min(1125, +h || 360)
	const sock = new PlayerSocket(ws, arena)
	sock.x = arena.w >> 1
	sock.y = arena.h >> 1
	ws.sock = sock
	sockets.add(sock)
	packet.setUint32(3, arena.w)
	packet.setUint32(0, arena.h)
	packet.setUint8(0, 17)
	ws.send(new Uint8Array(packet.buffer, 0, 7))
	ws.on('close', closed)
	ws.on('message', message)
})
function closed(){
	sockets.delete(this.sock)
	setTimeout(rmcells, CONFIG.celltimeout * 1000, this.sock.cells)
	for(const cell of this.sock.cells)cell.dx = cell.dy = 0,cell.kind=0x2666
}
function rmcells(cells){
	for(const c of cells)arena.remove(c)
}
function message(msg){
	if(!msg.length)return
	const d = new DataView(msg.buffer, msg.byteOffset + 1, msg.byteLength - 1)
	const fn = messages[msg[0]]
	if(fn)try{fn(this.sock, d)}catch{}
}
repl('(server) ', cmd => '')
repl('$ ', cmd => {console.log(eval(cmd))})
function test(){
	let a = new Uint8Array(100000)
	const s = [...sockets][0]
	a.fill(255)
	s.send(a)
	a.fill(0)
	a[0] = 255
	s.send(a)
}