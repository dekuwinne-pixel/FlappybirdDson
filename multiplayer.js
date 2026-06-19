const socket = io();
const adversaires = {}; // un oiseau par joueur

// Couleurs différentes pour chaque joueur
const couleurs = [180, 90, 270, 45, 135, 315];
let colorIndex = 0;

socket.on('full', () => {
    alert('Partie pleine ! (6 joueurs max)');
});

socket.on('players', (players) => {
    Object.entries(players).forEach(([id, data]) => {
        if (id === socket.id) return; // c'est toi, on skip

        // Créer l'oiseau si il n'existe pas encore
        if (!adversaires[id]) {
            const oiseau = document.createElement('div');
            oiseau.style.position = 'absolute';
            oiseau.style.width = '40px';
            oiseau.style.height = '30px';
            oiseau.style.backgroundImage = "url('image/image.PNG')";
            oiseau.style.backgroundSize = 'cover';
            oiseau.style.left = '80px';
            oiseau.style.opacity = '0.6';
            oiseau.style.zIndex = '9';
            oiseau.style.filter = `hue-rotate(${couleurs[colorIndex % 6]}deg)`;
            colorIndex++;
            document.getElementById('game').appendChild(oiseau);
            adversaires[id] = oiseau;
        }

        // Mettre à jour la position
        adversaires[id].style.top = data.y + 'px';
    });

    // Supprimer les oiseaux des joueurs déconnectés
    Object.keys(adversaires).forEach((id) => {
        if (!players[id]) {
            adversaires[id].remove();
            delete adversaires[id];
        }
    });
});

setInterval(() => {
    socket.emit('position', birdTop);
}, 16);