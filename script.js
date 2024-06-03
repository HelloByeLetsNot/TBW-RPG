document.addEventListener('DOMContentLoaded', async (event) => {
    // Toggle collapsible sections
    const collapsibles = document.querySelectorAll('.collapsible');
    collapsibles.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content) {
                content.style.display = content.style.display === 'block' ? 'none' : 'block';
            }
        });
    });

    // Check for stored username in local storage
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
        username = storedUsername;
        loginPopup.style.display = 'none';
        gameContainer.style.display = 'flex';
        await fetchLocations();
        await fetchNpcs();
        startGame();
    } else {
        loginPopup.style.display = 'flex';
    }

    fetchLeaderboard();
});

// DOM elements
const output = document.getElementById('output');
const input = document.getElementById('input');
const enterButton = document.getElementById('enter-button');
const hpBarInner = document.getElementById('hp-bar-inner');
const npcHpBar = document.getElementById('npc-hp-bar');
const npcHpBarInner = document.getElementById('npc-hp-bar-inner');
const leaderboardContent = document.getElementById('leaderboard-content');
const attackButton = document.getElementById('attack-button');
const fleeButton = document.getElementById('flee-button');
const exploreButton = document.getElementById('explore-button');
const northButton = document.getElementById('north-button');
const southButton = document.getElementById('south-button');
const eastButton = document.getElementById('east-button');
const westButton = document.getElementById('west-button');

const loginPopup = document.getElementById('login-popup');
const loginButton = document.getElementById('login-button');
const gameContainer = document.getElementById('game-container');

// Player variables
let playerHp = 100;
let playerGold = 10;
let playerInventory = [];
let navigationCount = 0;
let currentArea = 'forest';
let currentMap = 'map1';
let currentNpc = null;
let username = '';

// Game data
let areas = {};
let npcs = {};

// Fetch locations data from local JSON file
async function fetchLocations() {
    try {
        const response = await fetch('locations.json');
        if (!response.ok) throw new Error('Network response was not ok');
        areas = await response.json();
    } catch (error) {
        console.error('Error fetching locations:', error);
    }
}

// Fetch NPCs data from local JSON file
async function fetchNpcs() {
    try {
        const response = await fetch('npcs.json');
        if (!response.ok) throw new Error('Network response was not ok');
        npcs = await response.json();
    } catch (error) {
        console.error('Error fetching NPCs:', error);
    }
}

// Fetch leaderboard data from server
async function fetchLeaderboard() {
    try {
        const response = await fetch('/leaderboard');
        if (!response.ok) throw new Error('Network response was not ok');
        const leaderboard = await response.json();
        updateLeaderboardContent(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
    }
}

// Update leaderboard content in DOM
function updateLeaderboardContent(leaderboard) {
    leaderboardContent.innerHTML = leaderboard.map(entry => `<p>${entry.username}: ${entry.score}</p>`).join('');
}

// Save a new score to the leaderboard
async function saveToLeaderboard(username, score) {
    const newEntry = { username, score };
    try {
        const response = await fetch('/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEntry)
        });
        if (!response.ok) throw new Error('Network response was not ok');
        fetchLeaderboard();
    } catch (error) {
        console.error('Error saving to leaderboard:', error);
    }
}

// Calculate player's score
function calculateScore() {
    return navigationCount + playerInventory.length + playerGold;
}

// End the game and save the score
function endGame() {
    const score = calculateScore();
    saveToLeaderboard(username, score);
    alert(`Game over! Your score: ${score}`);
    location.reload();
}

// Update player's HP bar
function updateHpBar() {
    hpBarInner.style.width = `${playerHp}%`;
    hpBarInner.innerText = `${playerHp} HP`;
}

// Update NPC's HP bar
function updateNpcHpBar(npc) {
    if (npc && npc.health > 0) {
        npcHpBar.style.display = 'block';
        npcHpBarInner.style.width = `${npc.health / npc.maxHealth * 100}%`;
        npcHpBarInner.innerText = `${npc.health} HP`;
    } else {
        npcHpBar.style.display = 'none';
    }
}

// Format output for the game log
function formatOutput(text) {
    return `<p>${text.replace(/\n/g, '<br>')}</p>`;
}

// Scroll output to the bottom
function scrollToBottom() {
    output.scrollTop = output.scrollHeight;
}

// Handle player commands
function handleCommand(command) {
    const [mainCommand, ...args] = command.split(' ');
    const argument = args.join(' ');

    switch (mainCommand.toLowerCase()) {
        case 'go':
            move(argument);
            break;
        case 'explore':
            explore();
            break;
        case 'attack':
            attack();
            break;
        case 'flee':
            flee();
            break;
        case 'trade':
            trade(argument);
            break;
        case 'buy':
            buy(argument);
            break;
        case 'sell':
            sell(argument);
            break;
        case 'leave':
            leave();
            break;
        case 'help':
            showHelp();
            break;
        case 'end':
            endGame();
            break;
        case 'inventory':
            showInventory();
            break;
        default:
            output.innerHTML += formatOutput(`Unknown command: ${mainCommand}`);
            break;
    }

    input.value = '';
    scrollToBottom(); // Auto-scroll the output window
}

// Show player's inventory
function showInventory() {
    const inventoryItems = playerInventory.map(item => item.name).join(', ');
    output.innerHTML += formatOutput(`Inventory: ${inventoryItems || 'Your inventory is empty.'}`);
    scrollToBottom(); // Auto-scroll the output window
}

// Move to a new area
function move(direction) {
    if (currentNpc) {
        output.innerHTML += formatOutput(`You can't move while in an encounter.`);
        scrollToBottom(); // Auto-scroll the output window
        return;
    }
    const currentLocation = areas[currentMap][currentArea];
    const exit = currentLocation.exits[direction];
    if (!exit) {
        output.innerHTML += formatOutput(`You can't go that way.`);
        scrollToBottom(); // Auto-scroll the output window
        return;
    }
    const [newMap, newArea] = exit.split(':');
    currentMap = newMap || currentMap;
    currentArea = newArea || exit;
    navigationCount++;
    const newLocation = areas[currentMap][currentArea];
    output.innerHTML += formatOutput(`You move ${direction} to the ${currentArea}. ${newLocation.description}`);
    explore();
    scrollToBottom(); // Auto-scroll the output window
}

// Explore the current area
function explore() {
    if (currentNpc) {
        output.innerHTML += formatOutput(`You can't explore while in an encounter.`);
        scrollToBottom(); // Auto-scroll the output window
        return;
    }
    if (Math.random() < 0.4) {
        const npcsInArea = areas[currentMap][currentArea].npcs;
        const npcName = npcsInArea[Math.floor(Math.random() * npcsInArea.length)];
        currentNpc = { ...npcs[npcName] };
        output.innerHTML += formatOutput(`You encounter a ${currentNpc.name}. ${currentNpc.responses[0]}`);
        updateNpcHpBar(currentNpc);
    } else {
        output.innerHTML += formatOutput(`You find nothing of interest.`);
    }
    scrollToBottom(); // Auto-scroll the output window
}

function attack() {
    if (!currentNpc) {
        output.innerHTML += formatOutput(`There is no one to attack.`);
        scrollToBottom();
        return;
    }

    const playerRoll = Math.floor(Math.random() * 20) + 1;
    const npcRoll = Math.floor(Math.random() * 20) + 1;

    output.innerHTML += formatOutput(`You roll a ${playerRoll} to attack.`);
    scrollToBottom();

    if (playerRoll === 1) {
        playerHp -= 1;
        updateHpBar();
        output.innerHTML += formatOutput(`You fumble and hurt yourself!`);
        scrollToBottom();
    } else if (playerRoll === 20) {
        currentNpc.health -= 10;
        updateNpcHpBar(currentNpc);
        output.innerHTML += formatOutput(`Critical hit! You deal 10 damage to the ${currentNpc.name}.`);
        scrollToBottom();
    } else if (playerRoll > npcRoll) {
        currentNpc.health -= playerRoll - npcRoll;
        updateNpcHpBar(currentNpc);
        output.innerHTML += formatOutput(`You hit the ${currentNpc.name} for ${playerRoll - npcRoll} damage.`);
        scrollToBottom();
    } else {
        output.innerHTML += formatOutput(`You miss.`);
        scrollToBottom();
    }

    if (currentNpc.health <= 0) {
        output.innerHTML += formatOutput(`You have defeated the ${currentNpc.name}.`);
        playerGold += 5;
        playerInventory.push({ name: 'gold', price: 0 });
        output.innerHTML += formatOutput(`You find 5 gold on the ${currentNpc.name}.`);
        currentNpc = null;
        updateNpcHpBar(currentNpc);
    } else {
        npcAttack();
    }
    scrollToBottom();
}

function npcAttack() {
    const npcRoll = Math.floor(Math.random() * 20) + 1;
    const playerRoll = Math.floor(Math.random() * 20) + 1;

    output.innerHTML += formatOutput(`${currentNpc.name} rolls a ${npcRoll} to attack.`);
    scrollToBottom();

    if (npcRoll === 1) {
        currentNpc.health -= 1;
        updateNpcHpBar(currentNpc);
        output.innerHTML += formatOutput(`${currentNpc.name} fumbles and hurts itself!`);
        scrollToBottom();
    } else if (npcRoll === 20) {
        playerHp -= 10;
        updateHpBar();
        output.innerHTML += formatOutput(`Critical hit! The ${currentNpc.name} deals 10 damage to you.`);
        scrollToBottom();
    } else if (npcRoll > playerRoll) {
        playerHp -= npcRoll - playerRoll;
        updateHpBar();
        output.innerHTML += formatOutput(`The ${currentNpc.name} hits you for ${npcRoll - playerRoll} damage.`);
        scrollToBottom();
    } else {
        output.innerHTML += formatOutput(`The ${currentNpc.name} misses.`);
        scrollToBottom();
    }

    if (playerHp <= 0) {
        output.innerHTML += formatOutput(`You have been defeated by the ${currentNpc.name}.`);
        endGame();
    }
    scrollToBottom();
}
// Attempt to flee from the current NPC
function flee() {
    if (!currentNpc) {
        output.innerHTML += formatOutput(`There is no one to flee from.`);
        scrollToBottom(); // Auto-scroll the output window
        return;
    }

    const playerRoll = Math.floor(Math.random() * 20) + 1;
    const npcRoll = Math.floor(Math.random() * 20) + 1;

    output.innerHTML += formatOutput(`You roll a ${playerRoll} to flee.`);
    output.innerHTML += formatOutput(`${currentNpc.name} rolls a ${npcRoll} to pursue.`);

    if (playerRoll > npcRoll) {
        output.innerHTML += formatOutput(`You successfully flee from the ${currentNpc.name}.`);
        currentNpc = null;
        updateNpcHpBar(currentNpc);
    } else {
        playerHp -= npcRoll - playerRoll;
        updateHpBar();
        output.innerHTML += formatOutput(`You fail to flee and the ${currentNpc.name} hits you for ${npcRoll - playerRoll} damage.`);

        if (playerHp <= 0) {
            output.innerHTML += formatOutput(`You have been defeated by the ${currentNpc.name}.`);
            endGame();
        } else {
            npcAttack();
        }
    }
    scrollToBottom(); // Auto-scroll the output window
}

// Trade with the current NPC
function trade(npcName) {
    if (npcName.toLowerCase() !== 'merchant' || !currentNpc || currentNpc.name.toLowerCase() !== 'merchant') {
        output.innerHTML += formatOutput(`There is no merchant to trade with.`);
        scrollToBottom(); // Auto-scroll the output window
        return;
    }
    output.innerHTML += formatOutput(`The merchant offers the following items:`);
    for (const item in currentNpc.items) {
        output.innerHTML += formatOutput(`${item}: ${currentNpc.items[item].price} gold`);
    }
    scrollToBottom(); // Auto-scroll the output window
}

// Buy an item from the merchant
function buy(itemName) {
    if (!currentNpc || currentNpc.name.toLowerCase() !== 'merchant') {
        output.innerHTML += formatOutput(`There is no merchant to buy from.`);
        scrollToBottom(); // Auto-scroll the output window
        return;
    }
    const item = currentNpc.items[itemName];
    if (!item) {
        output.innerHTML += formatOutput(`The merchant does not have that item.`);
        scrollToBottom(); // Auto-scroll the output window
        return;
    }
    if (playerGold < item.price) {
        output.innerHTML += formatOutput(`You do not have enough gold to buy that.`);
        scrollToBottom(); // Auto-scroll the output window
        return;
    }
    playerGold -= item.price;
    playerInventory.push({ name: itemName, ...item });
    output.innerHTML += formatOutput(`You buy a ${itemName}.`);
    scrollToBottom(); // Auto-scroll the output window
}

// Sell an item to the merchant
function sell(itemName) {
    const itemIndex = playerInventory.findIndex(item => item.name.toLowerCase() === itemName.toLowerCase());
    if (itemIndex === -1) {
        output.innerHTML += formatOutput(`You do not have that item.`);
        scrollToBottom(); // Auto-scroll the output window
        return;
    }
    const item = playerInventory.splice(itemIndex, 1)[0];
    playerGold += item.price;
    output.innerHTML += formatOutput(`You sell a ${itemName}.`);
    scrollToBottom(); // Auto-scroll the output window
}

// Leave the current NPC
function leave() {
    if (!currentNpc || currentNpc.name.toLowerCase() !== 'merchant') {
        output.innerHTML += formatOutput(`There is no one to leave.`);
        scrollToBottom(); // Auto-scroll the output window
        return;
    }
    currentNpc = null;
    output.innerHTML += formatOutput(`You leave the merchant's stall.`);
    updateNpcHpBar(currentNpc);
    scrollToBottom(); // Auto-scroll the output window
}

// Show help command information
function showHelp() {
    output.innerHTML += formatOutput(`
        <strong>Commands:</strong>
        <ul>
            <li><strong>go [direction]</strong> - Move in a specified direction (north, south, east, west)</li>
            <li><strong>explore</strong> - Explore the current area for NPCs or other interactions</li>
            <li><strong>attack</strong> - Attack the current NPC</li>
            <li><strong>flee</strong> - Attempt to flee from the current NPC</li>
            <li><strong>trade merchant</strong> - Trade with the merchant NPC</li>
            <li><strong>buy [item]</strong> - Buy an item from the merchant</li>
            <li><strong>sell [item]</strong> - Sell an item to the merchant</li>
            <li><strong>leave</strong> - Leave the merchant's stall</li>
            <li><strong>help</strong> - List the description of things you can do and that can happen</li>
            <li><strong>end</strong> - End your game session and save your score</li>
            <li><strong>inventory</strong> - Show your current inventory</li>
        </ul>
    `);
    scrollToBottom(); // Auto-scroll the output window
}

// Update the player's inventory display
function updateInventory() {
    const inventoryItems = playerInventory.map(item => item.name).join(', ');
    output.innerHTML += formatOutput(`Inventory: ${inventoryItems || 'Your inventory is empty.'}`);
    scrollToBottom(); // Auto-scroll the output window
}

// Event listeners
enterButton.addEventListener('click', () => {
    handleCommand(input.value);
});

input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleCommand(input.value);
    }
});

loginButton.addEventListener('click', () => {
    username = document.getElementById('username').value.trim();
    if (username) {
        localStorage.setItem('username', username);
        loginPopup.style.display = 'none';
        gameContainer.style.display = 'flex';
        fetchLocations().then(() => fetchNpcs().then(() => startGame()));
    }
});

attackButton.addEventListener('click', () => {
    attack();
});

fleeButton.addEventListener('click', () => {
    flee();
});

exploreButton.addEventListener('click', () => {
    explore();
});

northButton.addEventListener('click', () => {
    move('north');
});

southButton.addEventListener('click', () => {
    move('south');
});

eastButton.addEventListener('click', () => {
    move('east');
});

westButton.addEventListener('click', () => {
    move('west');
});

// Start the game
function startGame() {
    output.innerHTML += formatOutput(`Welcome to the game, ${username}! You start in a forest. ${areas[currentMap][currentArea].description}`);
    updateInventory();
    scrollToBottom(); // Auto-scroll the output window
}