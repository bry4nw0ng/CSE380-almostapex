import Game from "./Wolfie2D/Loop/Game";
import SplashScreen from "./spy-master/Scenes/SplashScreen";
import { AAControls } from "./spy-master/AAControls";
import { AbilityEvent } from "./spy-master/Events";

// The main function is your entrypoint into Wolfie2D. Specify your first scene and any options here.
(function main(){
    // Run any tests
    runTests();

    // Set up options for our game
    let options = {
        canvasSize: {x: 1024, y: 1024},          // The size of the game
        clearColor: {r: 1, g: 1, b: 1},   // The color the game clears to
        inputs: [
            {name: AAControls.MOVE_UP, keys: ["w"]},
            {name: AAControls.MOVE_DOWN, keys: ["s"]},
            {name: AAControls.MOVE_LEFT, keys: ["a"]},
            {name: AAControls.MOVE_RIGHT, keys: ["d"]},
            {name: AAControls.ATTACK, keys: ["f"]},
            {name: AAControls.MEELEE, keys: ["space"]},
            {name: AAControls.ABILITY1, keys: ["1"]},
            {name: AAControls.ABILITY2, keys: ["2"]},
            {name: AAControls.ABILITY3, keys: ["3"]},
            {name: AAControls.PICKUP_ITEM, keys: ["e"]},
            {name: AAControls.INTERACT, keys: ["e"]},
            {name: AAControls.CHEAT_CITY, keys: ["c"]},
            {name: AAControls.CHEAT_MOUNTAIN, keys: ["m"]},
            {name: AAControls.CHEAT_OCEAN, keys: ["o"]},
            {name: AAControls.CHEAT_TOP_LEVEL, keys: ["t"]},
            {name: AAControls.CHEAT_INVINCIBLE, keys: ["i"]},
            {name: AAControls.CHEAT_POW_CANNON, keys: ["p"]},
            {name: AAControls.CHEAT_GIVE_ITEMS, keys: ["u"]}
        ],
        useWebGL: false,                        // Tell the game we want to use webgl
        showDebug: false                      // Whether to show debug messages. You can change this to true if you want
    }

    // Set up custom registries

    // Create a game with the options specified
    const game = new Game(options);

    // Start our game
    game.start(SplashScreen, {});

})();

function runTests(){};