const output = document.getElementById('output');
const input = document.getElementById('input');
const enterButton = document.getElementById('enter-button');
const inventoryHeader = document.getElementById('inventory-header');
const inventoryContent = document.getElementById('inventory-content');
const hpBarInner = document.getElementById('hp-bar-inner');
const npcHpBar = document.getElementById('npc-hp-bar');
const npcHpBarInner = document.getElementById('npc-hp-bar-inner');
const toggleSidebar = document.getElementById('toggle-sidebar');
const sidebar = document.getElementById('sidebar');

let playerHp = 100;
let playerGold = 10;
let playerInventory = [];
let navigationCount = 0;
let currentArea = 'forest';
let currentNpc = null;

const areas = {
    forest: { description: 'A dense forest with towering trees and thick underbrush.', npcs: ['goblin', 'wolf'] },
    // Add more areas as needed
};

const npcs = {
    goblin: {
        name: 'Goblin',
        health: 10,
        maxHealth: 10,
        responses: ['The goblin snarls.', 'The goblin attacks you!'],
        attack() {
            const roll = Math.floor(Math.random() * 6) + 1;
            const damage = roll * 2;  // Example damage calculation
            output.innerHTML += `\nThe goblin rolls a ${roll} and deals ${damage} damage!`;
            damagePlayer(damage);
        }
    },
    // Add more NPCs as needed
};

function updateInventory() {
    inventoryContent.innerHTML = `Gold: ${playerGold}<br>`;
    playerInventory.forEach(item => {
        inventoryContent.innerHTML += `${item}<br>`;
    });
}

function damagePlayer(amount) {
    playerHp -= amount;
    if (playerHp < 0) playerHp = 0;
    updateHpBar();
}

function healPlayer(amount) {
    playerHp += amount;
    if (playerHp > 100) playerHp = 100;
    updateHpBar();
}

function updateHpBar() {
    hpBarInner.style.width = `${playerHp}%`;
    hpBarInner.innerText = `${playerHp} HP`;
}

function updateNpcHpBar(npc) {
    const npcHealthPercentage = (npc.health / npc.maxHealth) * 100;
    npcHpBarInner.style.width = `${npcHealthPercentage}%`;
    npcHpBarInner.innerText = `${npc.health} HP`;
}

function showMerchantOptions() {
    output.innerHTML += `\nYou can buy or sell items with the merchant.`;
}

function battleOutcome(npcName) {
    if (npcs[npcName].health <= 0) {
        output.innerHTML += `\nYou have defeated the ${npcName}! You earn 1 gold.`;
        playerGold += 1;
        playerInventory.push(`Gold x${playerGold}`);
        updateInventory();
        currentNpc = null;
        npcHpBar.style.display = 'none';
    }
}

function handleCommand(command) {
    const parts = command.toLowerCase().split(' ');
    const action = parts[0];

    if (action === 'go') {
        const direction = parts[1];
        if (direction && ['north', 'south', 'east', 'west'].includes(direction)) {
            navigateToNewArea();
        } else {
            output.innerHTML += `\nInvalid direction. Use 'north', 'south', 'east', or 'west'.`;
        }
    } else if (action === 'explore') {
        exploreArea();
    } else if (action === 'attack') {
        const npcName = parts[1];
        if (npcName && npcs[npcName]) {
            attackNpc(npcName);
        } else {
            output.innerHTML += `\nInvalid NPC name.`;
        }
    } else if (action === 'trade' && parts[1] === 'merchant') {
        npcs.merchant.trade();
    } else if (action === 'buy' || action === 'sell') {
        output.innerHTML += `\nTrade functionality is not fully implemented.`;
    } else if (action === 'leave') {
        output.innerHTML += `\nYou leave the merchant's stall.`;
    } else if (action === 'help') {
        displayHelp();
    } else {
        output.innerHTML += `\nInvalid command. Type 'help' for a list of commands.`;
    }
}

function navigateToNewArea() {
    const areaNames = Object.keys(areas);
    const randomArea = areaNames[Math.floor(Math.random() * areaNames.length)];
    currentArea = randomArea;
    output.innerHTML += `\nYou have moved to a new area: ${areas[currentArea].description}`;
    navigationCount++;
    if (navigationCount % 5 === 0) {
        healPlayer(3);
    }
}

function exploreArea() {
    if (areas[currentArea].npcs.length > 0) {
        const randomNpc = areas[currentArea].npcs[Math.floor(Math.random() * areas[currentArea].npcs.length)];
        output.innerHTML += `\nYou encounter a ${randomNpc}.`;
        currentNpc = npcs[randomNpc];
        updateNpcHpBar(currentNpc);
        npcHpBar.style.display = 'block';
        currentNpc.attack();
    } else {
        output.innerHTML += `\nThere is nothing interesting here.`;
    }
}

function attackNpc(npcName) {
    if (currentNpc && currentNpc.name.toLowerCase() === npcName.toLowerCase()) {
        const playerRoll = Math.floor(Math.random() * 6) + 1;
        const playerDamage = playerRoll * 2;  // Example damage calculation
        output.innerHTML += `\nYou roll a ${playerRoll} and deal ${playerDamage} damage to the ${npcName}.`;
        currentNpc.health -= playerDamage;
        updateNpcHpBar(currentNpc);
        if (currentNpc.health > 0) {
            currentNpc.attack();
        } else {
            battleOutcome(npcName);
        }
    } else {
        output.innerHTML += `\nThe ${npcName} is not here or already defeated.`;
    }
}

function displayHelp() {
    output.innerHTML += `\nCommands:\n
        go [direction] - Move in a specified direction (north, south, east, west)\n
        explore - Explore the current area for NPCs or other interactions\n
        attack [npc] - Attack a specific NPC\n
        trade merchant - Trade with the merchant NPC\n
        buy - Buy an item from the merchant\n
        sell - Sell an item to the merchant\n
        leave - Leave the merchant's stall\n
        help - List the description of things you can do and that can happen`;
}

// Event listeners
enterButton.addEventListener('click', () => {
    const command = input.value.trim();
    if (command) {
        handleCommand(command);
        input.value = '';
    }
});

input.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const command = input.value.trim();
        if (command) {
            handleCommand(command);
            input.value = '';
        }
    }
});

inventoryHeader.addEventListener('click', () => {
    if (inventoryContent.style.display === 'none' || inventoryContent.style.display
        === 'none' || inventoryContent.style.display === '') {
        inventoryContent.style.display = 'block';
    } else {
        inventoryContent.style.display = 'none';
    }
});

toggleSidebar.addEventListener('click', () => {
    if (sidebar.style.display === 'none' || sidebar.style.display === '') {
        sidebar.style.display = 'block';
    } else {
        sidebar.style.display = 'none';
    }
});

// Initialize the game
output.innerHTML += `Welcome to the game! You start in a forest. ${areas[currentArea].description}`;
updateInventory();