const bg = document.getElementById('background');
let bgOffset = 0;

function scrollBackground() {
    if (!isGameOver && isGameStarted) {
     bgOffset -= pipeSpeed * 0.4; // plus lent que les tuyaux
    }
    bg.style.backgroundPosition = bgOffset + 'px 0';
    requestAnimationFrame(scrollBackground);
}

scrollBackground();