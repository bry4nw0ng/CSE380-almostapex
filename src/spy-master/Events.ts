export enum BattlerEvent {
    BATTLER_KILLED = "BATTLER_KILLED",
    BATTLER_RESPAWN = "BATTLER_RESPAWN",
    
    BATTLER_CHANGE = "BATTLER_CHANGE",
    CONSUME = "CONSUME",
    HIT = "HIT",
}

export enum ItemEvent {
    ITEM_REQUEST = "ITEM_REQUEST",

    LASERGUN_FIRED = "LASERGUN_FIRED",

    DANEEDLE_USED = "DANEEDLE_USED",

    CONSUMABLE_USED = "CONSUMABLE_USED",
    INVENTORY_CHANGED = "INVENTORY_CHANGED",
}

export enum HudEvent {
    HEALTH_CHANGE = "HEALTH_CHANGE",
    WAVE_IN_CENTER = "WaveAlertInCenter",
    WAVE_DONE = "WaveAlertDone",
}

export enum PlayerEvent {
    PLAYER_KILLED = "PLAYER_KILLED"
}

export enum AAEvents {
    // An event that tells the MB level to start. Has data: {}
    LEVEL_START = "LEVEL_START",
    // An event that tells the MB level to end. Has data: {}
    LEVEL_END = "LEVEL_END",

    // An event triggered when the player enters an area designated as a "level end" location. Had data: {}
    PLAYER_ENTERED_LEVEL_END ="PLAYER_ENTERED_LEVEL_END",

    /**
     * The event that gets emitted when the player's health changes
     * 
     * Has data: { curhp: number, maxhp: number }
     */
    HEALTH_CHANGE = "HEALTH_CHANGE",

    // The event sent when a particle hits a tile in the destructible tilemap layer
    PARTICLE_HIT_DESTRUCTIBLE = "PARTICLE_HIT_DESTRUCTIBLE",

    // The event sent when the player dies. Gets sent after the player's death animation
    PLAYER_DEAD = "PLAYER_DEAD",
    WAVE_CHANGE = "WAVE_CHANGE"
    
}

export enum AbilityEvent {
    OPEN_TREASURE = "OPEN_TREASURE",
    USED_GUM = "USED_GUM",
    USED_JETPACK = "USED_JETPACK",
    SHARK_FIN = "SHARK_FIN"
}

export enum CheatEvent {
    CHEAT_CITY = "CHEAT_CITY",
    CHEAT_OCEAN = "CHEAT_OCEAN",
    CHEAT_INVINCIBLE = "CHEAT_INVINCIBLE",
    CHEAT_POW_CANNON = "CHEAT_POW_CANNON",
    CHEAT_GIVE_ITEMS = "CHEAT_GIVE_ITEMS",
    CHEAT_SPAWN_BOSS = "CHEAT_SPAWN_BOSS",
    CHEAT_GIVE_CRYSTALS = "CHEAT_GIVE_CRYSTALS",
    CHEAT_TELEPORT_TO_MERCHANT = "CHEAT_TELEPORT_TO_MERCHANT",
    CHEAT_CONSOLE_LOCATION = "CHEAT_CONSOLE_LOCATION"
}