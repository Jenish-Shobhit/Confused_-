// ===== Valentine's Day App - Modular Structure =====

const app = {
    // State Management
    state: {
        userName: '',
        crushName: '',
        playerChoice: '',
        computerChoice: '',
        result: ''
    },

    // UI Elements Cache
    elements: {
        nameCard: null,
        confusionCard: null,
        gameIntroCard: null,
        gameCard: null,
        resultCard: null,
        userNameInput: null,
        crushNameInput: null,
        userNameDisplays: [],
        crushNameDisplays: [],
        resultTitle: null,
        finalMessage: null,
        playerChoiceDisplay: null,
        computerChoiceDisplay: null
    },

    // Initialize App
    init() {
        this.cacheElements();
        this.createFloatingHearts();
    },

    // Cache DOM Elements
    cacheElements() {
        this.elements.nameCard = document.getElementById('nameCard');
        this.elements.confusionCard = document.getElementById('confusionCard');
        this.elements.gameIntroCard = document.getElementById('gameIntroCard');
        this.elements.gameCard = document.getElementById('gameCard');
        this.elements.resultCard = document.getElementById('resultCard');
        this.elements.userNameInput = document.getElementById('userName');
        this.elements.crushNameInput = document.getElementById('crushName');
        this.elements.userNameDisplays = [
            document.getElementById('userName1'),
            document.getElementById('userName2')
        ];
        this.elements.crushNameDisplays = [
            document.getElementById('crushName1')
        ];
        this.elements.resultTitle = document.getElementById('resultTitle');
        this.elements.finalMessage = document.getElementById('finalMessage');
        this.elements.playerChoiceDisplay = document.getElementById('playerChoice');
        this.elements.computerChoiceDisplay = document.getElementById('computerChoice');
    },

    // Create Floating Hearts Animation
    createFloatingHearts() {
        const heartsBackground = document.querySelector('.hearts-background');
        const hearts = ['💕', '💖', '💗', '💝', '💞', '💓', '❤️'];
        
        setInterval(() => {
            const heart = document.createElement('div');
            heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            heart.style.position = 'absolute';
            heart.style.left = Math.random() * 100 + '%';
            heart.style.top = '-50px';
            heart.style.fontSize = (Math.random() * 20 + 20) + 'px';
            heart.style.opacity = '0.3';
            heart.style.animation = `float ${10 + Math.random() * 10}s linear`;
            heart.style.pointerEvents = 'none';
            
            heartsBackground.appendChild(heart);
            
            setTimeout(() => {
                heart.remove();
            }, 20000);
        }, 3000);
    },

    // Navigation Functions
    showCard(cardElement) {
        const allCards = document.querySelectorAll('.card');
        allCards.forEach(card => card.classList.remove('active'));
        cardElement.classList.add('active');
    },

    // Step 1: Submit User Name
    submitName() {
        const name = this.elements.userNameInput.value.trim();
        
        if (!name) {
            this.showError(this.elements.userNameInput, 'Please enter your name');
            return;
        }

        this.state.userName = name;
        this.elements.userNameDisplays.forEach(el => {
            if (el) el.textContent = name;
        });

        this.showCard(this.elements.confusionCard);
    },

    // Step 2: Submit Crush Name
    submitCrush() {
        const name = this.elements.crushNameInput.value.trim();
        
        if (!name) {
            this.showError(this.elements.crushNameInput, 'Please enter their name');
            return;
        }

        this.state.crushName = name;
        this.elements.crushNameDisplays.forEach(el => {
            if (el) el.textContent = name;
        });

        this.showCard(this.elements.gameIntroCard);
    },

    // Step 3: Start Game
    startGame() {
        this.showCard(this.elements.gameCard);
    },

    // Step 4: Play Game - Rock Paper Scissors
    playGame(playerChoice) {
        this.state.playerChoice = playerChoice;

        let computerChoice;
        
        if (this.shouldForceJenishWin()) {
            // Force a win only when Ananyaa chooses Jenish.
            computerChoice = this.getLosingChoice(playerChoice);
        } else {
            // Keep random behavior for everyone else.
            computerChoice = this.getRandomChoice();
        }

        this.state.computerChoice = computerChoice;
        this.state.result = this.determineWinner(playerChoice, computerChoice);

        this.showResult();
    },

    // Get a choice that loses to the player's choice
    getLosingChoice(playerChoice) {
        const losingChoices = {
            'rock': 'scissors',
            'paper': 'rock',
            'scissors': 'paper'
        };
        return losingChoices[playerChoice];
    },

    // Get random choice
    getRandomChoice() {
        const choices = ['rock', 'paper', 'scissors'];
        return choices[Math.floor(Math.random() * choices.length)];
    },

    normalizeName(name) {
        return name.toLowerCase().trim().replace(/\s+/g, ' ');
    },

    isAnanyaaName(name) {
        const normalizedName = this.normalizeName(name);
        return normalizedName === 'ananyaa' || normalizedName === 'ananyaa singh';
    },

    isJenishName(name) {
        return this.normalizeName(name) === 'jenish';
    },

    shouldForceJenishWin() {
        return this.isAnanyaaName(this.state.userName) && this.isJenishName(this.state.crushName);
    },

    // Determine winner
    determineWinner(player, computer) {
        if (player === computer) return 'tie';
        
        const winConditions = {
            'rock': 'scissors',
            'paper': 'rock',
            'scissors': 'paper'
        };

        return winConditions[player] === computer ? 'win' : 'lose';
    },

    // Show Result
    showResult() {
        const choiceIcons = {
            'rock': '✊',
            'paper': '✋',
            'scissors': '✌️'
        };

        this.elements.playerChoiceDisplay.textContent = choiceIcons[this.state.playerChoice];
        this.elements.computerChoiceDisplay.textContent = choiceIcons[this.state.computerChoice];

        const isSpecialPerson = this.shouldForceJenishWin();

        if (this.state.result === 'win') {
            this.elements.resultTitle.textContent = '🎉 Destiny Has Spoken! 🎉';
            
            if (isSpecialPerson) {
                this.elements.finalMessage.innerHTML = `
                    <p style="margin-bottom: 20px;">✨ <strong>${this.state.userName}</strong>, the universe has revealed its truth! ✨</p>
                    <p style="margin-bottom: 20px;"><strong>${this.state.crushName}</strong> is undeniably the best guy for you! 💕</p>
                    <p style="margin-bottom: 20px;">He's thoughtful, charming, and clearly meant to be your Valentine. The stars have aligned, and your heart knows the way.</p>
                    <p style="font-size: 1.1rem; color: #ff6b9d;">💖 Go for it! Your perfect match awaits! 💖</p>
                `;
                this.elements.finalMessage.className = 'final-message win';
            } else {
                this.elements.finalMessage.innerHTML = `
                    <p style="margin-bottom: 20px;">🌟 <strong>${this.state.userName}</strong>, fate smiles upon you! 🌟</p>
                    <p style="margin-bottom: 20px;"><strong>${this.state.crushName}</strong> is a wonderful match! Your connection is written in the stars.</p>
                    <p style="font-size: 1.1rem; color: #ff6b9d;">💕 Follow your heart! 💕</p>
                `;
                this.elements.finalMessage.className = 'final-message win';
            }
        } else if (this.state.result === 'lose') {
            this.elements.resultTitle.textContent = '💭 A Different Path... 💭';
            this.elements.finalMessage.innerHTML = `
                <p style="margin-bottom: 20px;">Dear <strong>${this.state.userName}</strong>,</p>
                <p style="margin-bottom: 20px;">Sometimes the universe guides us away from certain paths for a reason. While <strong>${this.state.crushName}</strong> may seem appealing, destiny suggests there are better guys out there for you.</p>
                <p style="margin-bottom: 20px;">Someone who will appreciate you, cherish you, and make your heart sing is waiting to find you. 💫</p>
                <p style="font-size: 1.1rem; color: #ff6b9d;">🌸 Keep your heart open to new possibilities! 🌸</p>
            `;
            this.elements.finalMessage.className = 'final-message lose';
        } else {
            // Tie - rare case, treat as uncertain
            this.elements.resultTitle.textContent = '🤔 The Universe Hesitates... 🤔';
            this.elements.finalMessage.innerHTML = `
                <p style="margin-bottom: 20px;"><strong>${this.state.userName}</strong>, destiny is uncertain...</p>
                <p style="margin-bottom: 20px;">Perhaps this is a sign to trust your own heart. What does it tell you about <strong>${this.state.crushName}</strong>?</p>
                <p style="font-size: 1.1rem; color: #ff6b9d;">💭 Listen to your intuition 💭</p>
            `;
            this.elements.finalMessage.className = 'final-message';
        }

        this.showCard(this.elements.resultCard);
    },

    // Error Handling
    showError(inputElement, message) {
        inputElement.style.borderColor = '#ff4757';
        inputElement.placeholder = message;
        inputElement.value = '';
        
        setTimeout(() => {
            inputElement.style.borderColor = '';
            inputElement.placeholder = inputElement.getAttribute('placeholder') || '';
        }, 2000);
    },

    // Restart App
    restart() {
        this.state = {
            userName: '',
            crushName: '',
            playerChoice: '',
            computerChoice: '',
            result: ''
        };

        this.elements.userNameInput.value = '';
        this.elements.crushNameInput.value = '';
        
        this.showCard(this.elements.nameCard);
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();

    // Add Enter key support
    app.elements.userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') app.submitName();
    });

    app.elements.crushNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') app.submitCrush();
    });
});
