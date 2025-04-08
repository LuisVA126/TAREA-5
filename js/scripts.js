document.addEventListener('DOMContentLoaded', function() {
    showSection('catalogo');
    
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
            
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');
        });
    });

    const torneoForm = document.getElementById('registroForm');
    if (torneoForm) {
        torneoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            validarInscripcion();
        });
    }
    
    const contactoForm = document.querySelector('.contacto-form');
    if (contactoForm) {
        contactoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showModal('Mensaje enviado', 'Tu mensaje ha sido enviado correctamente.');
            this.reset();
        });
    }
    
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            document.getElementById('modal').style.display = 'none';
        });
    }

    let gameTime = 60;
    let trashCollected = 0;
    let currentLevel = 1;
    let score = 0;
    let gameInterval;
    let trashInterval;
    let trashCount = 10;
    let gameActive = false;
    let trashSpeed = 2;
    let trashCanPosition = 0;
    const trashCanWidth = 80;

    const gameBoard = document.getElementById('gameBoard');
    let trashCan = document.getElementById('trashCan');
    const timeDisplay = document.getElementById('time');
    const collectedDisplay = document.getElementById('collected');
    const levelDisplay = document.getElementById('level');
    const scoreDisplay = document.getElementById('score');
    const startButton = document.getElementById('startGame');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');

    const keysPressed = {
        ArrowLeft: false,
        ArrowRight: false
    };

    if (startButton) {
        startButton.addEventListener('click', startGame);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key in keysPressed) {
            keysPressed[e.key] = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key in keysPressed) {
            keysPressed[e.key] = false;
        }
    });

    if (gameBoard) {
        let touchStartX = 0;
        
        gameBoard.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);

        gameBoard.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!gameActive) return;
            
            const touchEndX = e.changedTouches[0].screenX;
            const diffX = touchEndX - touchStartX;
            
            trashCanPosition = Math.max(0, Math.min(
                gameBoard.offsetWidth - trashCanWidth, 
                trashCanPosition + diffX * 1.5
            ));
            updateTrashCanPosition();
            
            touchStartX = touchEndX;
        }, false);
    }

    if (leftBtn && rightBtn) {
        leftBtn.addEventListener('touchstart', () => { keysPressed.ArrowLeft = true; });
        leftBtn.addEventListener('touchend', () => { keysPressed.ArrowLeft = false; });
        leftBtn.addEventListener('mousedown', () => { keysPressed.ArrowLeft = true; });
        leftBtn.addEventListener('mouseup', () => { keysPressed.ArrowLeft = false; });
        leftBtn.addEventListener('mouseleave', () => { keysPressed.ArrowLeft = false; });

        rightBtn.addEventListener('touchstart', () => { keysPressed.ArrowRight = true; });
        rightBtn.addEventListener('touchend', () => { keysPressed.ArrowRight = false; });
        rightBtn.addEventListener('mousedown', () => { keysPressed.ArrowRight = true; });
        rightBtn.addEventListener('mouseup', () => { keysPressed.ArrowRight = false; });
        rightBtn.addEventListener('mouseleave', () => { keysPressed.ArrowRight = false; });
    }

    function startGame() {
        if (gameActive) return;
        
        gameActive = true;
        trashCollected = 0;
        gameTime = 60;
        currentLevel = 1;
        score = 0;
        trashCount = 10;
        trashSpeed = 2;
        
        if (gameBoard) {
            gameBoard.innerHTML = '<div id="trashCan"></div>';
            trashCan = document.getElementById('trashCan');
            trashCanPosition = (gameBoard.offsetWidth - trashCanWidth) / 2;
            updateTrashCanPosition();
        }
        
        updateGameDisplay();
        if (startButton) startButton.style.display = 'none';
        
        startTimer();
        startTrashRain();
        
        gameLoop();
    }

    function gameLoop() {
        if (!gameActive) return;
        
        if (keysPressed.ArrowLeft) {
            trashCanPosition = Math.max(0, trashCanPosition - 10);
        }
        if (keysPressed.ArrowRight) {
            trashCanPosition = Math.min(gameBoard.offsetWidth - trashCanWidth, trashCanPosition + 10);
        }
        updateTrashCanPosition();
        
        requestAnimationFrame(gameLoop);
    }

    function updateTrashCanPosition() {
        if (trashCan) {
            trashCan.style.left = `${trashCanPosition}px`;
        }
    }

    function startTrashRain() {
        clearInterval(trashInterval);
        
        trashInterval = setInterval(() => {
            if (!gameActive) return;
            
            if (document.querySelectorAll('.trash').length < 5) {
                createTrash();
            }
        }, 1000);
    }

    function createTrash() {
        if (!gameBoard) return;
        
        const trash = document.createElement('div');
        trash.className = 'trash';
        
        const x = Math.random() * (gameBoard.offsetWidth - 40);
        trash.style.left = `${x}px`;
        trash.style.top = '0px';
        
        gameBoard.appendChild(trash);
        
        let trashY = 0;
        const fallSpeed = trashSpeed + Math.random() * 2;
        
        const fall = () => {
            if (!gameActive || !trash.parentNode) return;
            
            trashY += fallSpeed;
            trash.style.top = `${trashY}px`;
            
            if (trashCan && checkCollision(trash, trashCan)) {
                collectTrash(trash);
                return;
            }
            
            if (trashY > gameBoard.offsetHeight - 40) {
                trash.remove();
                return;
            }
            
            requestAnimationFrame(fall);
        };
        
        requestAnimationFrame(fall);
    }

    function checkCollision(trash, can) {
        if (!trash || !can) return false;
        
        const trashRect = trash.getBoundingClientRect();
        const canRect = can.getBoundingClientRect();
        
        return (
            trashRect.bottom >= canRect.top &&
            trashRect.top <= canRect.bottom &&
            trashRect.right >= canRect.left &&
            trashRect.left <= canRect.right
        );
    }

    function collectTrash(trash) {
        if (!trash.parentNode) return;
        
        trash.remove();
        trashCollected++;
        score += 10 * currentLevel;
        updateGameDisplay();
        
        if (trashCan) {
            trashCan.style.transform = 'scale(1.1)';
            setTimeout(() => {
                trashCan.style.transform = 'scale(1)';
            }, 200);
        }
        
        if (trashCollected >= trashCount) {
            levelComplete();
        }
    }

    function levelComplete() {
        gameActive = false;
        clearInterval(trashInterval);
        
        const message = document.createElement('div');
        message.className = 'game-message';
        message.innerHTML = `
            <h3>¡Nivel ${currentLevel} completado!</h3>
            <p>Puntuación: ${score}</p>
            <p>Objetivo siguiente nivel: ${trashCount + 5} basuras</p>
            <button id="nextLevel">Siguiente Nivel</button>
        `;
        if (gameBoard) gameBoard.appendChild(message);
        message.style.display = 'block';
        
        document.getElementById('nextLevel').addEventListener('click', () => {
            message.remove();
            nextLevel();
        });
    }

    function nextLevel() {
        currentLevel++;
        trashCount += 5;  
        trashSpeed += 0.5;
        trashCollected = 0;
        gameTime = 60;
        
        updateGameDisplay();
        gameActive = true;
        startTrashRain();
        gameLoop();
    }

    function startTimer() {
        clearInterval(gameInterval);
        gameInterval = setInterval(() => {
            if (!gameActive) return;
            
            gameTime--;
            updateGameDisplay();
            
            if (gameTime <= 0) {
                gameOver();
            }
        }, 1000);
    }

    function updateGameDisplay() {
        if (timeDisplay) timeDisplay.textContent = gameTime;
        if (collectedDisplay) collectedDisplay.textContent = `${trashCollected}/${trashCount}`;
        if (levelDisplay) levelDisplay.textContent = currentLevel;
        if (scoreDisplay) scoreDisplay.textContent = score;
    }

    function gameOver() {
        gameActive = false;
        clearInterval(gameInterval);
        clearInterval(trashInterval);
        
        document.querySelectorAll('.trash').forEach(trash => {
            if (trash.parentNode) trash.remove();
        });
        
        const message = document.createElement('div');
        message.className = 'game-message';
        message.innerHTML = `
            <h3>¡Juego terminado!</h3>
            <p>Puntuación final: ${score}</p>
            <p>Nivel alcanzado: ${currentLevel}</p>
            <button id="restartGame">Jugar de nuevo</button>
        `;
        if (gameBoard) gameBoard.appendChild(message);
        message.style.display = 'block';
        
        document.getElementById('restartGame').addEventListener('click', () => {
            message.remove();
            startGame();
        });
        
        if (startButton) startButton.style.display = 'inline-block';
    }
});

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

function validarInscripcion() {
    const form = document.getElementById('registroForm');
    const correo = form.querySelector('#correo').value;
    const nombre = form.querySelector('#nombre').value;
    const nacimiento = new Date(form.querySelector('#nacimiento').value);
    const torneoSelect = form.querySelector('#torneo');
    const torneo = torneoSelect.value;
    const precioTorneo = parseFloat(torneoSelect.options[torneoSelect.selectedIndex].getAttribute('data-precio'));
    const pago = parseFloat(form.querySelector('#pago').value);
    
    if (!correo || !nombre || !nacimiento || !torneo || isNaN(pago)) {
        showModal('Error', 'Por favor complete todos los campos.');
        return;
    }
    
    const hoy = new Date();
    const edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    
    if (edad < 14) {
        showModal('Error', 'Debes tener al menos 14 años para inscribirte.');
        return;
    }
    
    if (pago < precioTorneo) {
        const faltante = precioTorneo - pago;
        showModal('Pago insuficiente', `Falta pagar S/${faltante.toFixed(2)} para completar la inscripción.`);
        return;
    }
    
    if (pago > precioTorneo) {
        const vuelto = pago - precioTorneo;
        showModal('Inscripción exitosa', `¡Inscripción realizada con éxito! Tu vuelto es S/${vuelto.toFixed(2)}.`);
    } else {
        showModal('Inscripción exitosa', '¡Inscripción realizada con éxito!');
    }
    
    form.reset();
}

function showModal(title, message) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.style.display = 'flex';
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}
