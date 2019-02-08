const userData = require('./userData.json')

module.exports = function PlayerList(mod) {
	const command = mod.command || mod.require.command;


	let players = {},
		history = [],
		currentLocation = null,
		watching = false,
		watchingMore = false,
		waitOnLoadingScreen = true,
		loadingScreenTimer = null,
		moving = false,
		pauseWhenMoving = false,

		searchName = null,
		searchId = null,

		emoteMimicName,
		emoteMimicId


	command.add('p', (...args) => {
		let arg1 = args[0]
		let arg2 = args[1]
		if (arg1) arg1.toLowerCase()
		switch (arg1) {
			case 'l':
			case 'list':
				//console.log(JSON.stringify(players,null,4))
				let names = []
				for (let p in players) {
					//console.log(players[p].name)
					names.push(players[p].name)
				}
				names.sort()
				command.message('Spawned players: ' + names.length)
				if (names.length == 0) return
				command.message(names.join(', '))
				break
			case 'guilds':
			case 'guild':
			case 'g':
				let guilds = []
				for (let p in players) {
					let found = false
					for (let g of guilds) {
						if (g.name == players[p].guild) {
							g.count++
							found = true
							break
						}
					}
					if (!found) {
						guilds.push({
							name: players[p].guild,
							count: 1
						})
					}
				}

				if (arg2) {
					let guildmembers = []
					args.shift()
					let name = args.join(' ')
					for (let p in players) {
						if (name.toLowerCase() == players[p].guild.toLowerCase()) guildmembers.push(players[p].name)
					}
					if (guildmembers.length == 0) {
						command.message('Guild ' + name + ' not found')
					}
					command.message('Players in ' + name + ':')
					command.message(guildmembers.join(', '))
					return
				}

				guilds.sort(compare)
				command.message('Spawned player guilds: ' + guilds.length)
				for (let i = 0; i < guilds.length; i++) {
					command.message(guilds[i].name + ' : ' + guilds[i].count)
				}
				//command.message(guilds.join(', '))
				break
			case 'watch': //alert, notify
			case 'w':
				if (!arg2) {
					watching = !watching
					command.message('Watching is ' + (watching ? 'en' : 'dis') + 'abled.')
				}
				if (['more', 'm'].includes(arg2)) {
					watchingMore = !watchingMore
					command.message('Watching detailed information ' + (watchingMore ? 'en' : 'dis') + 'abled.')
				}
				if (['loading', 'l'].includes(arg2)) {
					waitOnLoadingScreen = !waitOnLoadingScreen
					command.message('No notifications after loading screen: ' + (waitOnLoadingScreen ? 'en' : 'dis') + 'abled.')
				}
				if (['moving', 'move'].includes(arg2)) {
					pauseWhenMoving = !pauseWhenMoving
					command.message('Watching ' + (pauseWhenMoving ? 'dis' : 'en') + 'abled when moving.')
				}
				break
			case 'search':
			case 's':
				if (searchName && !arg2) {
					command.message('Stopping searching for ' + searchName + ', found: ' + (searchId ? 'yes' : 'no'))
					searchName = null
					searchId = null
				} else {
					searchId = null
					searchName = arg2
					command.message('Now searching for ' + searchName)
					for (let p in players) {
						if (searchName.toLowerCase() == players[p].name.toLowerCase()) {
							searchId = players[p].gameId
							searchName = players[p].name
							command.message(searchName + ' found!')
							printInfo(players[p])
						}
					}
				}
				break
			case 'player':
			case 'p':
				if (arg2) {
					for (let p in players) {
						if (arg2.toLowerCase() == players[p].name.toLowerCase()) {
							printInfo(players[p])
							return
						}
					}
					command.message('Player ' + arg2 + ' not found')
				} else {
					command.message('Player name missing or invalid: ' + arg2)
				}
				break
			case 'emote':
			case 'e':
				if (emoteMimicName) {
					command.message('Stopped emote mimicking ' + emoteMimicName)
					emoteMimicName = null
					emoteMimicId = null
					return
				}
				if (arg2) {
					for (let p in players) {
						if (arg2.toLowerCase() == players[p].name.toLowerCase()) {
							emoteMimicName = arg2
							emoteMimicId = players[p].gameId
							command.message('Now emote mimicking ' + arg2)
							return
						}
					}
					command.message('Player ' + arg2 + ' not found')
				} else {
					command.message('Player name missing or invalid: ' + arg2)
				}
				break
		}



	})

	mod.game.on('leave_game', () => {
		players = {}
	})
	mod.game.on('enter_loading_screen', () => {
		players = {}
	})
	mod.game.on('leave_loading_screen', () => {
		loadingScreenTimer = setTimeout(function () {
			loadingScreenTimer = null
		}, 3000)
	})

	mod.hook('C_PLAYER_LOCATION', 5, (event) => {
		currentLocation = event
		moving = event.type != 7
	});
	mod.hook('S_USER_LOCATION', 5, (event) => {
		if (!players[event.gameId]) return
		players[event.gameId].loc = event.loc
		players[event.gameId].w = event.w
	});

	mod.hook('S_SOCIAL', 1, (event) => {
		if (emoteMimicId && event.target == emoteMimicId) {
			mod.send('C_SOCIAL', 1, {
				emote: event.animation,
				unk: event.unk2
			})
		}
	})

	mod.hook('S_SPAWN_ME', 3, updateLocation)

	mod.hook('S_SPAWN_USER', 13, (event) => {
		if (event.guild == '') event.guild = '(Guildless)'
		players[event.gameId] = event

		if (watching) {
			if (waitOnLoadingScreen && loadingScreenTimer) return
			if (pauseWhenMoving && moving) return
			let found = null
			let str = 'Player ' + event.name + ' has arrived!'
			for (let i = history.length - 1; i >= 0; i--) {
				if (history[i].gameId == event.gameId && history[i].type == 0) {
					found = i
					break
				}
			}

			if (found) {
				str += ' Last seen at ' + getTime(history[found].time) + ', ' + getTimeDiff(Date.now() - history[found].time) + ' ago'
			}
			command.message(str)
			if (watchingMore) printinfo(event)
		}

		if (searchName && searchName.toLowerCase() == event.name.toLowerCase()) {
			searchId = event.gameId
			searchName = event.name
			command.message(searchName + ' spawned!')
			printInfo(event)
		}

		history.push({
			name: event.name,
			gameId: event.gameId,
			time: Date.now(),
			type: 1
		})
	})
	mod.hook('S_DESPAWN_USER', 3, (event) => {
		if (searchName && searchId && searchId == event.gameId) {
			command.message(searchName + ' despawned!');
		}

		if (watching && !mod.game.isInLoadingScreen) {
			if (waitOnLoadingScreen && loadingScreenTimer) return
			if (pauseWhenMoving && moving) return
			let found = null
			let str = 'Player ' + players[event.gameId].name + ' has gone'
			for (let i = history.length - 1; i >= 0; i--) {
				if (history[i].gameId == event.gameId && history[i].type == 1) {
					found = i
					break
				}
			}
			if (found) {
				//console.log(history[found])
				str += ', was visible for ' + getTimeDiff(Date.now() - history[found].time)
			}
			command.message(str)
		}
		history.push({
			gameId: event.gameId,
			time: Date.now(),
			type: 0
		})
		delete players[event.gameId]
	})

	function printInfo(player) {
		let gender = userData[player.templateId].gender,
			race = userData[player.templateId].race,
			teraclass = userData[player.templateId]["class"]

		command.message(player.name + ': ' + race + ' ' + gender + ' ' + teraclass)
		command.message(player.guildRank + ' of ' + player.guild)
		command.message('Visible: ' + player.visible + ', Alive: ' + player.alive + ', Newbie: ' + player.newbie + ', Outlaw: ' + player.pkEnabled)
		command.message('Distance2D: ' + unitsToMeters(dist2D(currentLocation.loc, player.loc)) + 'm, Distance3D: ' + unitsToMeters(dist3D(currentLocation.loc, player.loc)) + 'm')
	}

	function updateLocation(event) {
		currentLocation = {
			loc: event.loc,
			w: event.w
		}
		//console.log(currentLocation.loc)
	}

	function dist2D(loc1, loc2) {
		return Math.sqrt(Math.pow(loc2.x - loc1.x, 2) + Math.pow(loc2.y - loc1.y, 2));
	}

	function dist3D(loc1, loc2) {
		return Math.sqrt(Math.pow(loc2.x - loc1.x, 2) + Math.pow(loc2.y - loc1.y, 2) + Math.pow(loc2.z - loc1.z, 2))
	}

	function unitsToMeters(units) {
		return (units / 25).toFixed(2)
	}

	function compare(a, b) {
		let number = (b.count - a.count)
		if (number != 0) return number
		if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
		if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
		return 0
	}

	function getTime(date) {
		let now = date ? new Date(date) : new Date;
		let hours = now.getHours().toString().padStart(2, '0');
		let minutes = now.getMinutes().toString().padStart(2, '0');
		let seconds = now.getSeconds().toString().padStart(2, '0');
		return hours + ':' + minutes + ':' + seconds
	}

	function getTimeDiff(time) {
		time = Math.floor(time / 1000)
		let hours = Math.floor(time / 3600);
		time %= 3600;
		let minutes = Math.floor(time / 60);
		let seconds = time % 60;

		return (hours == 0 ? '' : hours + 'h, ') + (minutes == 0 ? '' : minutes + 'min, ') + seconds + 's'
	}

	this.destructor = () => { //for reloading purposes
		command.remove('p');
	};
}