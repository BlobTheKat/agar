import { WebSocketServer } from 'ws'
import { repl } from 'basic-repl'
import YAML from 'yaml'
import { promises as fs } from 'fs'
import https from 'https'
const fns = []
globalThis.CONFIG = YAML.parse(''+await fs.readFile('../config.yaml'))
globalThis.config = f => (fns.push(f),f())
const { sockets, arena, messages, PlayerSocket, cmds, bans } = await import('./agar_arena.js')
let wss
if(CONFIG.key && CONFIG.cert){
	const httpServer = https.createServer({key: await fs.readFile(CONFIG.key), cert: await fs.readFile(CONFIG.cert)})
	wss = new WebSocketServer({server: httpServer})
	httpServer.listen(CONFIG.port || 37730)
}else wss = new WebSocketServer({port: CONFIG.port || 37730})
const packet = new DataView(new ArrayBuffer(7))
wss.on('connection', (ws, {url}) => {
	if(bans.has(ws._socket.remoteAddress)) return ws.close()
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
	ws.send(packet)
	ws.on('close', closed)
	ws.on('message', message)
})
function closed(){
	sockets.delete(this.sock)
	this.sock.disconnected()
}
function message(msg){
	if(!msg.length)return
	const d = new DataView(msg.buffer, msg.byteOffset + 1, msg.byteLength - 1)
	const fn = messages[msg[0]]
	if(fn)try{fn(this.sock, d)}catch{}
}
repl('(server) ', cmd => {
	cmd = cmd.trim()
	if(!cmd)return
	const args = cmd.match(/\S+|"([^"]|\\.)"/g)
	const fn = cmds[args[0]]
	if(!fn)return console.log('\x1b[31mNo such command: '+args[0]+'\x1b[m')
	let r
	try{r = fn.call(...args)}catch(e){return console.log('\x1b[31m' + e + '\x1b[m')}
	if(Array.isArray(r))for(const v of r)console.log(v)
	else if(r !== undefined)console.log(r)

})
repl('$ ', cmd => console.log(eval(cmd)))

for await(const _ of fs.watch('../config.yaml')){
	Object.assign(globalThis.CONFIG, YAML.parse(''+await fs.readFile('../config.yaml')))
	for(const f of fns) f()
}