# Players

Player tracking module for Tera proxy<br />
Keeps track of summoned players

### Usage
All commands start with `p` and are sent to proxy channel (`/8`)
- `list`/`l`
  - Lists all spawned players
  - Example: `/8 p l`
- `guilds`/`guild`/`g` `<optional argument>`
  - If no argument given, lists all guilds of spawned players
    - Example: `/8 p g`
  - If argument is given, lists all spawned players of a guild matching the argument
    - Example: `/8 p g inflamed`
- `watch`/`w` `<optional argument>`
  - Without argument:
    - Toggles monitoring player spawns and despawns
    - Sends a message every time a player despawns along with last seen / time spawned details
      - Example: `/8 p w`
  - Valid arguments:
    - `more`/`m`
      - Toggles printing of additional information when players spawn
      - Example: `/8 p w m`
    - `loading`/`l`
      - Toggles suspending watching for a short time after a loading screen to avoid massive spam (default: true)
      - Example: `/8 p w l`
    - `moving`/`move`
      - Toggles suspending watching while moving (default: false)
      - Example: `/8 p w move`
- `search`/`s` `<argument>`
  - Starts searching for player with name specified in `argument`
  - Example: `/8 p s playername`
  - Stop searching when no argument given: `/8 p s`
- `player`/`p` `<argument`
  - Shows detailed info about a spawned player
  - Example: `/8 p p playername`
- `emote`/`e` `<argument>`
  - Starts emote mimicking player with name specified in `argument`
  - Repeats their emotes immediately, useful for syncing dancing or memeing around
  - Example: `/8 p e playername`
  - Stop when no argument given: `/8 p e`