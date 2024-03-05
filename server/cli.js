import { sockets, bans, arena } from "./agar_arena.js";
import { dec } from "./socket.js";
const DIE = Uint8Array.of(255)
function find(player){
	if(!player.match(/\D/)){
		player = +player
		for(const s of sockets)if(s.id == player)return s
		throw "No player with ID "+player
	}else{
		const results = []
		const reg = new RegExp(player, 'yi')
		for(const s of sockets)if(dec.decode(s.name).match(reg))results.push(s)
		if(results.length > 1)throw "Multiple players matching (use their ID instead):\n" + results.map(a=>a.debug()).join('\n')
		if(!results.length)throw "No player matched the name "+player
		return results[0]
	}
}
export function list(){
	let r = []
	const players = {}
	for(const s of sockets)if(s.cells.size)r.push(s.debug())
	if(!r.length)throw "No players online"
	return r.join('\n')
}
export const l = list
export function kick(p){
	const {ws} = find(p)
	ws.send(DIE)
	ws.close()
	return '\x1b[32mDone!\x1b[m'
}
export function kill(p){
	for(const cell of find(p).cells){
		arena.remove(cell)
	}
	return '\x1b[32mKilled them!\x1b[m'
}
export function crazy(p){
	const sock = find(p);
	while(sock.newcell(...arena.randpos(), 1));
	for(const cell of sock.cells){
		cell.m += Math.random() * arena.w * arena.h / 200 / CONFIG.player.maxcells
	}
	return '\x1b[32mOVERPOWERED!!!\x1b[m'
}
export function tp(p, nx, ny){
	nx -= 0; ny -= 0;
	if(nx < 0)nx = 0; if(ny < 0)ny = 0
	if(nx >= arena.w)nx = arena.w - 0.001
	if(ny >= arena.h)ny = arena.h - 0.001
	for(const cell of find(p).cells){
		const {x, y, r} = cell
		cell.x = nx, cell.y = ny
		arena.repos(cell, x, y, r)
	}
	return '\x1b[32mTeleported them to (x: '+Math.round(nx)+', y: '+Math.round(ny)+')\x1b[m'
}
export function one(p){
	const cells = find(p).cells
	let max = {m: 0}
	for(const cell of cells)if(cell.m > max.m)max = cell
	for(const cell of cells){
		if(cell == max)continue
		arena.remove(cell)
	}
	return '\x1b[32mKilled all but one of their cells!\x1b[m'
}
export function penalty(p, m = '0.1'){
	m -= 0
	if(!(m > 0)){
		find(p).penalty = 0
		return '\x1b[32mRemoved penalty!\x1b[m'
	}
	if(m >= 100)return '\x1b[31mInvalid value'
	find(p).penalty = 1 - m/4000
	return '\x1b[32mPenalty set to '+m+'%/s\x1b[m'
}
export function killall(){
	for(const s of sockets)for(const cell of s.cells)arena.remove(cell)
	return '\x1b[32mKilled all players!\x1b[m'
}
export function reset(){
	arena.reset()
	return '\x1b[32mReset arena!\x1b[m'
}
export const clear = reset
export function feed(p, m){
	m -= 0
	if(!m)throw 'Invalid mass'
	for(const cell of find(p).cells){
		cell.m += m
		if(cell.m < 0)cell.m = CONFIG.player.minmass
	}
	return '\x1b[32mFed '+m+' to each of their cells!\x1b[m'
}
export function merge(p){
	for(const cell of find(p).cells)cell.age = Infinity
	return '\x1b[32mPlayer can now merge!\x1b[m'
}
export function ban(p){
	const player = find(p)
	player.ws.close()
	bans.add(player.ip)
	return '\x1b[32mBanned the IP "'+player.ip+'"\x1b[m'
}
export function pardon(ip){
	return bans.delete(ip) ? '\x1b[32mPardonned :)\x1b[m' : '\x1b[33mIP wasn\'t banned :/\x1b[m'
}
export const help = () => `\x1b[35mHelp\x1b[m:
list \x1b[30m-- List online players\x1b[m
feed \x1b[34m<player> \x1b[32m<mass> \x1b[30m-- Give mass to a player\x1b[m
kill \x1b[34m<player> \x1b[30m-- Kill all of a player's cells\x1b[m
merge \x1b[34m<player> \x1b[30m-- Allow a player's cells to merge\x1b[m
tp \x1b[34m<player> \x1b[32m<x> <y> \x1b[30m-- Teleport player to (x, y)\x1b[m
one \x1b[34m<player> \x1b[30m-- Kill all except one of player's cells\x1b[m
penalty \x1b[34m<player> \x1b[32m<percent_per_second> \x1b[30m-- Make a player lose mass FAST (0 to disable)\x1b[m
crazy \x1b[34m<player> \x1b[30m-- Inflate player's cells to quickly overtake the whole map
kick \x1b[34m<player> \x1b[30m-- Kick a player from the game\x1b[m
ban \x1b[34m<player> \x1b[30m-- Ban a player's IP from the game\x1b[m
pardon \x1b[36m<ip> \x1b[30m-- Revoke an IP ban\x1b[m
killall \x1b[30m-- Kill all players' cells\x1b[m
reset \x1b[30m-- Remove all cells (including food & viruses)\x1b[m
\x1b[30mhelp -- `+['???','help','take a wild guess','lol','this duh','unhelpful command','Unlocked at level 30','nani?!'][Math.floor(Math.random()*8)]