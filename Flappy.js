const oiseau = document.getElementById("oiseau");
const game = document.getElementById("game");
const scoreDisplay = document.getElementById("score");
const replayButton = document.getElementById("replay");
const bonusButton = document.getElementById("bonus");
// Dimensions du jeu et de l'oiseau
const gameWidth = 400;
const gameHeight = 565;                            
const birdLeft = 80;
const birdWidth = 40;
const birdHeight = 30;
const pipeWidth = 52;

let birdTop = 200;
let vitesse = 0;
const gravite = 0.5;

let score = 0;
let isGameOver = false;
let isGameStarted = false;
let jumpCount = 0;  // Compteur de sauts
let elapsedTime = 0;  // Temps écoulé en secondes
let timeInterval;  // Référence au chrono
let pipes = [];
let DeathCount = 0;  // Compteur de morts

let pipeSpeed = 2;
let gameLoop;  // Référence à la boucle de jeu
let bonusActive = null;
let isInvincible = false;
let invincibilityTime = 0;
function getHighScore() {
    return parseInt(localStorage.getItem('flappy_highscore') || '0', 10);
}

function saveHighScore(score) {
    const hs = getHighScore();
    if (score > hs) {
        localStorage.setItem('flappy_highscore', String(score));
        return true;
    }
    return false;
}
// sauvgarde du high score dans le localStorage pour persistance entre les sessions

// Utilitaire: reset (développement)
function resetHighScore() {
    localStorage.removeItem('flappy_highscore');
}

// affichage du high score dans le jeu 
function createHighScoreElement() {
    let highEl = document.getElementById('highScore');
    if (!highEl) {
        highEl = document.createElement('div');
        highEl.id = 'highScore';
        game.appendChild(highEl);
    }

    
    if (scoreDisplay && scoreDisplay.parentElement !== game) {
        game.appendChild(scoreDisplay);
    }

    // Styles pour éviter le débordement
    highEl.style.position = 'absolute';
    highEl.style.top = '8px';
    highEl.style.left = '8px';
    highEl.style.color = '#fff';
    highEl.style.fontSize = '16px';
    highEl.style.zIndex = 1000;
    highEl.style.maxWidth = (gameWidth - 16) + 'px';
    highEl.style.overflow = 'hidden';
    highEl.style.whiteSpace = 'nowrap';
    highEl.style.textOverflow = 'ellipsis';
    highEl.style.pointerEvents = 'none';

    // Positionner le `scoreDisplay` juste sous le high score
    if (scoreDisplay) {
        scoreDisplay.style.position = 'absolute';
        scoreDisplay.style.top = '36px';
        scoreDisplay.style.left = '8px';
        scoreDisplay.style.color = '#fff';
        scoreDisplay.style.fontSize = '18px';
        scoreDisplay.style.zIndex = 1000;
        scoreDisplay.style.maxWidth = (gameWidth - 16) + 'px';
        scoreDisplay.style.overflow = 'hidden';
        scoreDisplay.style.whiteSpace = 'nowrap';
        scoreDisplay.style.textOverflow = 'ellipsis';
        scoreDisplay.style.pointerEvents = 'none';
    }

    return highEl;
}
//pour créer et styliser l'élément d'affichage du high score, ainsi que pour positionner correctement le score actuel en dessous
function updateScoreDisplays() {
    const highEl = createHighScoreElement();
    const high = getHighScore();
    highEl.textContent = 'Meilleur : ' + high;
    if (scoreDisplay) scoreDisplay.textContent = 'Score : ' + score;
}


// Gestion des événements clavier (démarrage et saut)
document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        event.preventDefault();  // Empêche le scroll de la page
        
        // Démarrer le jeu si pas encore commencé
        if (!isGameStarted && !isGameOver) {
            isGameStarted = true;
            removeStartMessage();  // Enlever le message de démarrage
            jumpCount = 0;  // Réinitialiser le compteur de sauts
            elapsedTime = 0;  // Réinitialiser le chrono
            startGameLoop();  // Démarrer la boucle de jeu
        } 
        // Saut pendant le jeu
        else if (isGameStarted && !isGameOver) {
            vitesse = -8;
            jumpCount++;  // Incrémenter le compteur de sauts
        }
    }
});


// Met à jour la position de l'oiseau
function updateBirdPosition() {
    oiseau.style.top = birdTop + "px";
    oiseau.style.left = birdLeft + "px";
}

// Crée les tuyaux
function createPipe() {
    const pipeWrapper = document.createElement("div");
    const pipeTop = document.createElement("div");
    const pipeBottom = document.createElement("div");

    pipeWrapper.classList.add("pipe");
    pipeTop.classList.add("pipe_upper");
    pipeBottom.classList.add("pipe_lower");

    let gap = 160;
    // Difficulté progressive
     if (score >= 10) {
         gap = 150;
     }
     if (score >= 20) {
         gap = 120;
     }

     if (score >= 40) {
         gap = 100;
     }
     if (score >= 80) {
         gap = 95;
     }

    const topHeight = Math.floor(Math.random() * 250) + 50;
    const bottomHeight = gameHeight - topHeight - gap;
    let pipeLeft = 400;
    
    // Créer un bonus sur ce tuyau avec 10% de chance
    let hasBonus = false;
    if (Math.random() < 0.1) {
        hasBonus = true;
    }

    pipeWrapper.style.left = pipeLeft + "px";
    pipeWrapper.style.top = "0px";

    pipeTop.style.height = topHeight + "px";
    pipeTop.style.width = pipeWidth + "px";
    pipeBottom.style.height = bottomHeight + "px";
    pipeBottom.style.width = pipeWidth + "px";

    pipeWrapper.appendChild(pipeTop);
    pipeWrapper.appendChild(pipeBottom);
    game.appendChild(pipeWrapper);

    pipes.push({
        left: pipeLeft, 
        topHeight: topHeight,
        bottomHeight: bottomHeight,
        element: pipeWrapper,
        passed: false,
        hasBonus: hasBonus,
        bonusX: pipeLeft + pipeWidth / 2 - 15,
        bonusY: topHeight + gap / 2 - 15,
        bonusCollected: false
    });
}

// Déplace les tuyaux
function movePipes() {
    pipes.forEach((pipe) => {
        pipe.left -= pipeSpeed;
        pipe.element.style.left = pipe.left + "px";
        
        // Mettre à jour la position du bonus s'il existe
        if (pipe.hasBonus && !bonusActive) {
            bonusActive = pipe;
            bonusButton.style.display = 'block';
        }
        
        // Déplacer le bonus avec le tuyau
        if (bonusActive === pipe) {
            bonusActive.bonusX -= pipeSpeed;
            bonusButton.style.left = bonusActive.bonusX + 'px';
            bonusButton.style.top = bonusActive.bonusY + 'px';
            bonusButton.style.position = 'absolute';
        }

        if (!pipe.passed && pipe.left + pipeWidth < birdLeft) {
            pipe.passed = true;
            score++;
            if (score < 20)
                pipeSpeed = 2 + score * 0.15;
            updateScoreDisplays();
        }
    });

    pipes = pipes.filter((pipe) => {
        if (pipe.left < -pipeWidth) {
            pipe.element.remove();
            if (bonusActive === pipe) {
                bonusButton.style.display = 'none';
                bonusActive = null;
            }
            return false;
        }
        return true;
    });
}

// Collision
function checkCollision() {
    for (let pipe of pipes) {
        if (
            birdLeft + birdWidth > pipe.left &&
            birdLeft < pipe.left + pipeWidth
        ) {
            const hitsTopPipe = birdTop > 0 && birdTop < pipe.topHeight;
            const hitsBottomPipe = birdTop + birdHeight > gameHeight - pipe.bottomHeight;
            
            // D'ABORD vérifier si le bonus est touché
            if (bonusActive === pipe && pipe.hasBonus && !pipe.bonusCollected) {
                let distX = (birdLeft + birdWidth / 2) - bonusActive.bonusX;
                let distY = (birdTop + birdHeight / 2) - bonusActive.bonusY;
                let distance = Math.sqrt(distX * distX + distY * distY);
                
                if (distance < 25) {
                    pipe.bonusCollected = true;
                    bonusButton.style.display = 'none';
                    isInvincible = true;
                    invincibilityTime = 3000;  // Permet 3 secondes d'invincibilité
                    updateScoreDisplays();
                    return;

                }
            }
            
            // ENSUITE vérifier la collision avec les tuyaux
            if (hitsTopPipe || hitsBottomPipe) {
                if (!isInvincible) {
                    endGame();
                }
            }
        }
    }
}
// Fin du jeu
function endGame() {
    isGameOver = true;
    clearInterval(timeInterval);  // Arrêter le chrono
    const isNewRecord = saveHighScore(score);
    const high = getHighScore();
    
    // Afficher le Game Over dans le jeu au lieu d'un alert
    let gameOverMsg = document.getElementById('gameOverMessage');
    if (!gameOverMsg) {
        gameOverMsg = document.createElement('div');
        gameOverMsg.id = 'gameOverMessage';
        game.appendChild(gameOverMsg);
    }
    
    gameOverMsg.style.position = 'absolute';
    gameOverMsg.style.top = '50%';
    gameOverMsg.style.left = '50%';
    gameOverMsg.style.transform = 'translate(-50%, -50%)';
    gameOverMsg.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    gameOverMsg.style.color = '#fff';
    gameOverMsg.style.padding = '30px';
    gameOverMsg.style.borderRadius = '10px';
    gameOverMsg.style.textAlign = 'center';
    gameOverMsg.style.zIndex = 1000;
    gameOverMsg.style.fontSize = '20px';
    gameOverMsg.innerHTML = '<strong>GAME OVER !</strong><br>Score : ' + score + '<br>Temps : ' + elapsedTime + 's<br>Sauts : ' + jumpCount + (isNewRecord ? '<br><strong>🎉 Nouveau record !</strong>' : '') + '<br>Meilleur : ' + high + '<br><br><small>Appuyez sur ESPACE pour rejouer</small>';
    
    // Mettre à jour l'affichage
    if (scoreDisplay) scoreDisplay.textContent = "Score : " + score + " | Meilleur : " + high;
    
    // Permettre de rejouer avec ESPACE au lieu du bouton
    const handleReplayKey = (event) => {
        if (event.code === "Space") {
            location.reload();
        }
    };
    document.addEventListener("keydown", handleReplayKey);
}

// Afficher un message de démarrage
function createStartMessage() {
    let startMsg = document.getElementById('startMessage');
    if (!startMsg) {
        startMsg = document.createElement('div');
        startMsg.id = 'startMessage';
        game.appendChild(startMsg);
    }
    
    startMsg.style.position = 'absolute';
    startMsg.style.top = '50%';
    startMsg.style.left = '50%';
    startMsg.style.transform = 'translate(-50%, -50%)';
    startMsg.style.color = '#fff';
    startMsg.style.fontSize = '24px';
    startMsg.style.textAlign = 'center';
    startMsg.style.zIndex = 999;
    startMsg.style.pointerEvents = 'none';
    startMsg.textContent = 'Appuyez sur ESPACE pour commencer';
    
    return startMsg;
}

// Enlever le message de démarrage
function removeStartMessage() {
    const startMsg = document.getElementById('startMessage');
    if (startMsg) {
        startMsg.remove();
    }
}

// Démarrer la boucle principale
function startGameLoop() {
    // Démarrer le chrono (augmente chaque seconde)
    timeInterval = setInterval(() => {
        elapsedTime++;
        updateScoreDisplays();
    }, 1000);

gameLoop = setInterval(() => {
    if (isGameOver) return;

    vitesse += gravite;
    birdTop += vitesse;

    // Décrémenter le temps d'invincibilité
    if (isInvincible) {
        invincibilityTime -= 20;
        
        if (invincibilityTime <= 800) {
            oiseau.style.opacity = (Math.floor(invincibilityTime / 100) % 2 === 0) ? '0.3' : '1';
        } else {
            oiseau.style.opacity = '1';
        }

        if (invincibilityTime <= 0) {
            isInvincible = false;
            oiseau.style.opacity = '1';
        }
    }
        if (invincibilityTime <= 0) {
        // Vérifier si l'oiseau est actuellement dans un tuyau
        let inPipe = pipes.some(pipe => 
            birdLeft + birdWidth > pipe.left &&
            birdLeft < pipe.left + pipeWidth
        );

        if (!inPipe) {
            isInvincible = false;
            oiseau.style.opacity = '1';
        }
        // sinon, on reste invincible un peu plus longtemps (le temps reste à 0 ou négatif)
    }




    if (
        pipes.length === 0 ||
        pipes[pipes.length - 1].left < 170
    ) {
        createPipe();
    }

    checkBorders();
    updateBirdPosition();
    movePipes();
    checkCollision();
}, 20);
}

// Initialiser l'affichage des scores au démarrage
updateScoreDisplays();

// Afficher le message de démarrage
createStartMessage();

function checkBorders() {
    // Bordure du haut : on bloque l'oiseau sans arrêter le jeu
    if (birdTop <= 0) {
        birdTop = 0;
        vitesse = 0;
    }

    // Bordure du bas : fin du jeu
    if (birdTop + birdHeight >= gameHeight) {
        endGame();
    }
}
















































// my soul never wavers 