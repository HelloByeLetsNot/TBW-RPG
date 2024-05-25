document.addEventListener('DOMContentLoaded', async (event) => {
    const collapsibles = document.querySelectorAll('.collapsible');
    collapsibles.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content.style.display === 'block') {
                content.style.display = 'none';
            } else {
                content.style.display = 'block';
            }
        });
    });

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

const output = document.getElementById('output');
const input = document.getElementById('input');
const enterButton = document.getElementById('enter-button');
const hpBarInner = document.getElementById('hp-bar-inner');
const npcHpBar = document.getElementById('npc-hp-bar');
const npcHpBarInner = document.getElementById('npc-hp-bar-inner');
const leaderboardContent = document.getElementById('leaderboard-content');

const loginPopup = document.getElementById('login-popup');
const loginButton = document.getElementById('login-button');
const gameContainer = document.getElementById('game-container');

let playerHp = 100;
let playerGold = 10;
let playerInventory = [];
let navigationCount = 0;
let currentArea = 'forest';
let currentNpc = null;
let username = '';

let areas = {};
let npcs = {};

// Fetch locations data from local JSON file
async function fetchLocations() {
    try {
        const response = await fetch('locations.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        areas = await response.json();
    } catch (error) {
        console.error('Error fetching locations:', error);
    }
}

// Fetch NPCs data from local JSON file
async function fetchNpcs() {
    try {
        const response = await fetch('npcs.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        npcs = await response.json();
    } catch (error) {
        console.error('Error fetching NPCs:', error);
    }
}

// Fetch leaderboard data from server
async function fetchLeaderboard() {
    try {
        const response = await fetch('/leaderboard');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const leaderboard = await response.json();
        updateLeaderboardContent(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
    }
}

// Update leaderboard content in DOM
function updateLeaderboardContent(leaderboard) {
    leaderboardContent.innerHTML = leaderboard
        .map(entry => `<p>${entry.username}: ${entry.score}</p>`)
        .join('');
}

// Save a new score to the leaderboard
async function saveToLeaderboard(username, score) {
    const newEntry = { username, score };
    try {
        const response = await fetch('/leaderboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newEntry)
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        fetchLeaderboard();
    } catch (error) {
        console.error('Error saving to leaderboard:', error);
    }
}

function calculateScore() {
    return navigationCount + playerInventory.length + playerGold;
}

function endGame() {
    const score = calculateScore();
    saveToLeaderboard(username, score);
    alert(`Game over! Your score: ${score}`);
    location.reload();
}

function updateHpBar() {
    hpBarInner.style.width = `${playerHp}%`;
    hpBarInner.innerText = `${playerHp} HP`;
}

function updateNpcHpBar(npc) {
    if (npc && npc.health > 0) {
        npcHpBar.style.display = 'block';
        npcHpBarInner.style.width = `${npc.health / npc.maxHealth * 100}%`;
        npcHpBarInner.innerText = `${npc.health} HP`;
    } else {
        npcHpBar.style.display = 'none';
    }
}

function formatOutput(text) {
    return `<p>${text.replace(/\n/g, '<br>')}</p>`;
}

function handleCommand(command) {
    const parts = command.split(' ');
    const mainCommand = parts[0].toLowerCase();
    const argument = parts.slice(1).join(' ');

    switch (mainCommand) {
        case 'go':
            move(argument);
            break;
        case 'explore':
            explore();
            break;
        case 'attack':
            attack(argument);
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
            // Do nothing for unknown commands
            break;
    }

    input.value = '';
    output.scrollTop = output.scrollHeight;
}

function showInventory() {
    const inventoryItems = playerInventory.map(item => `${item.name} (${item.quantity})`).join(', ');
    output.innerHTML += formatOutput(`Inventory: ${inventoryItems || 'Your inventory is empty.'}`);
}

function move(direction) {
    if (!areas[currentArea].exits || !areas[currentArea].exits[direction]) {
        output.innerHTML += formatOutput(`You can't go that way.`);
        return;
    }
    currentArea = areas[currentArea].exits[direction];
    navigationCount++;
    output.innerHTML += formatOutput(`You move ${direction} to the ${currentArea}. ${areas[currentArea].description}`);
    explore();
}

function explore() {
    if (Math.random() < 0.4) {
        const npcsInArea = areas[currentArea].npcs;
        const npcName = npcsInArea[Math.floor(Math.random() * npcsInArea.length)];
        currentNpc = { ...npcs[npcName] };
        output.innerHTML += formatOutput(`You encounter a ${currentNpc.name}. ${currentNpc.responses[0]}`);
        updateNpcHpBar(currentNpc);
    } else {
        output.innerHTML += formatOutput(`You find nothing of interest.`);
    }
}

function attack(target) {
    if (!currentNpc) {
        output.innerHTML += formatOutput(`There is no one to attack.`);
        return;
    }

    const playerRoll = Math.floor(Math.random() * 20) + 1;
    const npcRoll = Math.floor(Math.random() * 20) + 1;

    output.innerHTML += formatOutput(`You roll a ${playerRoll} to attack.`);
    output.innerHTML += formatOutput(`${currentNpc.name} rolls a ${npcRoll} to defend.`);

    if (playerRoll === 1) {
        playerHp -= 1;
        updateHpBar();
        output.innerHTML += formatOutput(`You fumble and hurt yourself!`);
    } else if (playerRoll === 20) {
        currentNpc.health -= 10;
        updateNpcHpBar(currentNpc);
        output.innerHTML += formatOutput(`Critical hit! You deal 10 damage to the ${currentNpc.name}.`);
    } else if (playerRoll > npcRoll) {
        currentNpc.health -= playerRoll - npcRoll;
        updateNpcHpBar(currentNpc);
        output.innerHTML += formatOutput(`You hit the ${currentNpc.name} for ${playerRoll - npcRoll} damage.`);
    } else {
        output.innerHTML += formatOutput(`You miss.`);
    }

    if (currentNpc.health <= 0) {
        output.innerHTML += formatOutput(`You have defeated the ${currentNpc.name}.`);
        addItemToInventory('gold', 5);
        output.innerHTML += formatOutput(`You find 5 gold on the ${currentNpc.name}.`);
        currentNpc = null;
        updateNpcHpBar(currentNpc);
    } else {
        npcAttack();
    }
}

function addItemToInventory(name, quantity) {
    const item = playerInventory.find(item => item.name === name);
    if (item) {
        item.quantity += quantity;
    } else {
        playerInventory.push({ name, quantity });
    }
}

function npcAttack() {
    const npcRoll = Math.floor(Math.random() * 20) + 1;
    const playerRoll = Math.floor(Math.random() * 20) + 1;

    output.innerHTML += formatOutput(`${currentNpc.name} rolls a ${npcRoll} to attack.`);
    output.innerHTML += formatOutput(`You roll a ${playerRoll} to defend.`);

    if (npcRoll === 1) {
        currentNpc.health -= 1;
        updateNpcHpBar(currentNpc);
        output.innerHTML += formatOutput(`${currentNpc.name} fumbles and hurts itself!`);
    } else if (npcRoll === 20) {
        playerHp -= 10;
        updateHpBar();
        output.innerHTML += formatOutput(`Critical hit! The ${currentNpcname} deals 10 damage to you.`);
    } else if (npcRoll > playerRoll) {
        playerHp -= npcRoll - playerRoll;
        updateHpBar();
        output.innerHTML += formatOutput(`The ${currentNpc.name} hits you for ${npcRoll - playerRoll} damage.`);
    } else {
        output.innerHTML += formatOutput(`The ${currentNpc.name} misses.`);
    }

    if (playerHp <= 0) {
        endGame();
    }
}

function trade(npcName) {
    if (npcName.toLowerCase() !== 'merchant' || !currentNpc || currentNpc.name.toLowerCase() !== 'merchant') {
        output.innerHTML += formatOutput(`There is no merchant to trade with.`);
        return;
    }
    output.innerHTML += formatOutput(`The merchant offers the following items:`);
    for (const item in currentNpc.items) {
        output.innerHTML += formatOutput(`${item}: ${currentNpc.items[item].price} gold`);
    }
}

function buy(itemName) {
    if (!currentNpc || currentNpc.name.toLowerCase() !== 'merchant') {
        output.innerHTML += formatOutput(`There is no merchant to buy from.`);
        return;
    }
    const item = currentNpc.items[itemName];
    if (!item) {
        output.innerHTML += formatOutput(`The merchant does not have that item.`);
        return;
    }
    if (playerGold < item.price) {
        output.innerHTML += formatOutput(`You do not have enough gold to buy that.`);
        return;
    }
    playerGold -= item.price;
    addItemToInventory(itemName, 1);
    output.innerHTML += formatOutput(`You buy a ${itemName}.`);
}

function sell(itemName) {
    const itemIndex = playerInventory.findIndex(item => item.name.toLowerCase() === itemName.toLowerCase());
    if (itemIndex === -1) {
        output.innerHTML += formatOutput(`You do not have that item.`);
        return;
    }
    const item = playerInventory[itemIndex];
    if (item.quantity > 1) {
        item.quantity -= 1;
    } else {
        playerInventory.splice(itemIndex, 1);
    }
    playerGold += item.price;
    output.innerHTML += formatOutput(`You sell a ${itemName}.`);
}

function leave() {
    if (!currentNpc || currentNpc.name.toLowerCase() !== 'merchant') {
        output.innerHTML += formatOutput(`There is no one to leave.`);
        return;
    }
    currentNpc = null;
    output.innerHTML += formatOutput(`You leave the merchant's stall.`);
    updateNpcHpBar(currentNpc);
}

function showHelp() {
    output.innerHTML += formatOutput(`
        <strong>Commands:</strong>
        <ul>
            <li><strong>go [direction]</strong> - Move in a specified direction (north, south, east, west)</li>
            <li><strong>explore</strong> - Explore the current area for NPCs or other interactions</li>
            <li><strong>attack [npc]</strong> - Attack a specific NPC</li>
            <li><strong>attack</strong> - Attack the current NPC</li>
            <li><strong>trade merchant</strong> - Trade with the merchant NPC</li>
            <li><strong>buy [item]</strong> - Buy an item from the merchant</li>
            <li><strong>sell [item]</strong> - Sell an item to the merchant</li>
            <li><strong>leave</strong> - Leave the merchant's stall</li>
            <li><strong>help</strong> - List the description of things you can do and that can happen</li>
            <li><strong>end</strong> - End your game session and save your score</li>
            <li><strong>inventory</strong> - Show your current inventory</li>
        </ul>
    `);
}

function updateInventory() {
    const inventoryItems = playerInventory.map(item => `${item.name} (${item.quantity})`).join(', ');
    output.innerHTML += formatOutput(`Inventory: ${inventoryItems || 'Your inventory is empty.'}`);
}

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

function startGame() {
    output.innerHTML += formatOutput(`Welcome to the game, ${username}! You start in a forest. ${areas[currentArea].description}`);
    updateInventory();
}