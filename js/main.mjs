import { computeOutcome, isAnanyaaName, isJenishName } from './rules.mjs';
import { buildNarrative } from './narrative.mjs';
import { SoundController } from './sound.mjs';
import {
    $,
    $all,
    announce,
    emitResultParticles,
    setBodyResultState,
    setModeButtons,
    showCard,
    typeLines,
    vibrate,
    wait
} from './ui.mjs';
import { downloadResultCard, shareResultCard } from './share.mjs';

const STORAGE_KEYS = {
    mode: 'rosefire.mode',
    muted: 'rosefire.muted',
    contrast: 'rosefire.contrast',
    reducedMotion: 'rosefire.reducedMotion'
};

export function initApp() {
    const cards = $all('.card');
    const modeButtons = $all('.mode-btn');
    const choiceButtons = $all('.choice-button');

    const elements = {
        cards,
        modeButtons,
        choiceButtons,
        appRoot: $('#appRoot'),
        heartsBackground: $('#heartsBackground'),
        particleLayer: $('#particleLayer'),
        liveRegion: $('#liveRegion'),
        nameForm: $('#nameForm'),
        crushForm: $('#crushForm'),
        quizForm: $('#quizForm'),
        startGameBtn: $('#startGameBtn'),
        userNameInput: $('#userName'),
        crushNameInput: $('#crushName'),
        userName1: $('#userName1'),
        userName2: $('#userName2'),
        crushName1: $('#crushName1'),
        decisionHint: $('#decisionHint'),
        gameCard: $('#gameCard'),
        revealCard: $('#revealCard'),
        revealLine: $('#revealLine'),
        resultCard: $('#resultCard'),
        resultTitle: $('#resultTitle'),
        finalMessage: $('#finalMessage'),
        playerChoice: $('#playerChoice'),
        computerChoice: $('#computerChoice'),
        shareBtn: $('#shareBtn'),
        downloadBtn: $('#downloadBtn'),
        restartBtn: $('#restartBtn'),
        muteToggle: $('#muteToggle'),
        contrastToggle: $('#contrastToggle'),
        motionToggle: $('#motionToggle')
    };

    const state = {
        userName: '',
        crushName: '',
        quiz: { spark: '', style: '', rhythm: '' },
        playerChoice: '',
        computerChoice: '',
        result: '',
        rule: 'random',
        mode: getSavedValue(STORAGE_KEYS.mode, 'spicy'),
        muted: getSavedValue(STORAGE_KEYS.muted, 'false') === 'true',
        highContrast: getSavedValue(STORAGE_KEYS.contrast, 'false') === 'true',
        reducedMotion: getSavedValue(STORAGE_KEYS.reducedMotion, 'false') === 'true',
        revealInProgress: false,
        activeRoundToken: 0
    };

    const sound = new SoundController({ muted: state.muted });

    applyPreferences(state, elements);
    hydrateModeUI(state, elements);
    createFloatingHearts(elements.heartsBackground, () => state.reducedMotion);
    bindInteractions({ elements, state, sound });
    registerServiceWorker();

    announce(elements.liveRegion, 'Rosefire Oracle ready.');
}

function bindInteractions({ elements, state, sound }) {
    window.addEventListener(
        'pointerdown',
        () => {
            sound.unlock().catch(() => undefined);
        },
        { once: true }
    );

    elements.modeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const mode = button.dataset.mode;
            setMode(mode, state, elements);
            sound.playClick();
            vibrate(8);
        });

        button.addEventListener('keydown', (event) => {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
            event.preventDefault();

            const current = elements.modeButtons.findIndex((node) => node.dataset.mode === state.mode);
            const direction = event.key === 'ArrowRight' ? 1 : -1;
            const nextIndex = (current + direction + elements.modeButtons.length) % elements.modeButtons.length;
            const nextButton = elements.modeButtons[nextIndex];

            setMode(nextButton.dataset.mode, state, elements);
            nextButton.focus();
        });
    });

    elements.muteToggle.addEventListener('click', async () => {
        await sound.unlock().catch(() => undefined);
        const muted = sound.toggleMuted();
        state.muted = muted;
        saveValue(STORAGE_KEYS.muted, String(muted));
        updateUtilityButtons(state, elements);
        vibrate(8);
    });

    elements.contrastToggle.addEventListener('click', () => {
        state.highContrast = !state.highContrast;
        saveValue(STORAGE_KEYS.contrast, String(state.highContrast));
        applyPreferences(state, elements);
        vibrate(10);
    });

    elements.motionToggle.addEventListener('click', () => {
        state.reducedMotion = !state.reducedMotion;
        saveValue(STORAGE_KEYS.reducedMotion, String(state.reducedMotion));
        applyPreferences(state, elements);
        vibrate(10);
    });

    elements.nameForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = elements.userNameInput.value.trim();
        if (!value) {
            triggerInputError(elements.userNameInput, 'Please enter your name');
            announce(elements.liveRegion, 'Name is required.');
            return;
        }

        state.userName = value;
        elements.userName1.textContent = value;
        elements.userName2.textContent = value;
        showCard('crushCard', elements.cards);
        announce(elements.liveRegion, `Welcome ${value}. Enter your crush name.`);
        sound.playClick();
        vibrate(10);
    });

    elements.crushForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = elements.crushNameInput.value.trim();
        if (!value) {
            triggerInputError(elements.crushNameInput, 'Please enter their name');
            announce(elements.liveRegion, 'Crush name is required.');
            return;
        }

        state.crushName = value;
        elements.crushName1.textContent = value;
        showCard('quizCard', elements.cards);
        announce(elements.liveRegion, 'Complete the chemistry quiz.');
        sound.playClick();
        vibrate(10);
    });

    elements.quizForm.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!elements.quizForm.checkValidity()) {
            elements.quizForm.reportValidity();
            announce(elements.liveRegion, 'Please answer all three quiz questions.');
            return;
        }

        const formData = new FormData(elements.quizForm);
        state.quiz = {
            spark: String(formData.get('spark') || ''),
            style: String(formData.get('style') || ''),
            rhythm: String(formData.get('rhythm') || '')
        };

        showCard('introCard', elements.cards);
        announce(elements.liveRegion, 'Chemistry locked. Start the game.');
        sound.playClick();
        vibrate(12);
    });

    elements.startGameBtn.addEventListener('click', () => {
        showCard('gameCard', elements.cards);
        setHint(elements, defaultHint(state));
        announce(elements.liveRegion, 'Choose rock, paper, or scissors.');
        sound.playClick();
        vibrate(12);
    });

    elements.choiceButtons.forEach((button) => {
        button.addEventListener('mouseenter', () => {
            if (!elements.gameCard.classList.contains('active')) return;
            if (state.revealInProgress) return;

            setHint(elements, button.dataset.flirtHint || defaultHint(state));
            sound.playHover();
        });

        button.addEventListener('focus', () => {
            if (!elements.gameCard.classList.contains('active')) return;
            if (state.revealInProgress) return;

            setHint(elements, button.dataset.flirtHint || defaultHint(state));
            sound.playHover();
        });

        button.addEventListener('mouseleave', () => {
            if (!elements.gameCard.classList.contains('active')) return;
            if (state.revealInProgress) return;
            setHint(elements, defaultHint(state));
        });

        button.addEventListener('blur', () => {
            if (!elements.gameCard.classList.contains('active')) return;
            if (state.revealInProgress) return;
            setHint(elements, defaultHint(state));
        });

        button.addEventListener('click', () => {
            handleRound({
                playerChoice: button.dataset.choice,
                elements,
                state,
                sound
            }).catch(() => {
                state.revealInProgress = false;
                setChoiceDisabled(elements.choiceButtons, false);
            });
        });
    });

    elements.shareBtn.addEventListener('click', async () => {
        try {
            await shareResultCard(buildSharePayload(state, elements));
            announce(elements.liveRegion, 'Result shared.');
        } catch {
            announce(elements.liveRegion, 'Unable to share, downloaded instead.');
        }
    });

    elements.downloadBtn.addEventListener('click', async () => {
        await downloadResultCard(buildSharePayload(state, elements));
        announce(elements.liveRegion, 'Result card downloaded.');
    });

    elements.restartBtn.addEventListener('click', () => {
        state.activeRoundToken += 1;
        state.revealInProgress = false;
        setChoiceDisabled(elements.choiceButtons, false);
        resetFlow(state, elements);
        sound.onRestart();
        sound.playClick();
    });
}

async function handleRound({ playerChoice, elements, state, sound }) {
    if (state.revealInProgress) return;

    const roundToken = state.activeRoundToken + 1;
    state.activeRoundToken = roundToken;

    sound.onRoundStart();
    state.revealInProgress = true;
    setChoiceDisabled(elements.choiceButtons, true);
    elements.gameCard.classList.add('is-thinking');
    setHint(elements, 'Destiny is blushing... deciding...');

    const outcome = computeOutcome({
        userName: state.userName,
        crushName: state.crushName,
        playerChoice
    });

    state.playerChoice = playerChoice;
    state.computerChoice = outcome.computerChoice;
    state.result = outcome.result;
    state.rule = outcome.rule;

    showCard('revealCard', elements.cards);

    await typeLines(elements.revealLine, revealLines(state), {
        reducedMotion: state.reducedMotion,
        onLineStart: () => sound.playRevealPulse()
    });

    if (roundToken !== state.activeRoundToken) return;

    await wait(state.reducedMotion ? 100 : 260);

    if (roundToken !== state.activeRoundToken) return;

    renderResult(state, elements, sound);

    state.revealInProgress = false;
    elements.gameCard.classList.remove('is-thinking');
    setChoiceDisabled(elements.choiceButtons, false);
}

function renderResult(state, elements, sound) {
    const icons = {
        rock: '✊',
        paper: '✋',
        scissors: '✌️'
    };

    elements.playerChoice.textContent = icons[state.playerChoice];
    elements.computerChoice.textContent = icons[state.computerChoice];

    const narrative = buildNarrative({
        mode: state.mode,
        result: state.result,
        rule: state.rule,
        userName: state.userName,
        crushName: state.crushName,
        quiz: state.quiz
    });

    elements.resultTitle.textContent = narrative.title;
    elements.finalMessage.innerHTML = narrative.html;
    elements.finalMessage.className = `final-message ${narrative.resultClass}`;

    showCard('resultCard', elements.cards);

    setBodyResultState(state.result);
    emitResultParticles(elements.particleLayer, state.result, state.reducedMotion);
    announce(elements.liveRegion, narrative.title);

    sound.playResult(state.result);
    vibrate(resultVibration(state.result));
}

function resetFlow(state, elements) {
    state.userName = '';
    state.crushName = '';
    state.quiz = { spark: '', style: '', rhythm: '' };
    state.playerChoice = '';
    state.computerChoice = '';
    state.result = '';
    state.rule = 'random';
    state.revealInProgress = false;

    elements.nameForm.reset();
    elements.crushForm.reset();
    elements.quizForm.reset();
    elements.finalMessage.innerHTML = '';
    elements.finalMessage.className = 'final-message';

    setHint(elements, defaultHint(state));
    showCard('nameCard', elements.cards);
    announce(elements.liveRegion, 'Restarted. Enter your name.');
}

function revealLines(state) {
    if (state.rule === 'forced_win') {
        return [
            'Reading your chemistry signature...',
            `Locking fate with ${state.crushName}...`,
            'Verdict sealed with a rose-gold stamp.'
        ];
    }

    if (state.rule === 'forced_lose') {
        return [
            'Scanning this pairing...',
            'Stars detected mismatch.',
            'Protective destiny protocol activated.'
        ];
    }

    return [
        'Reading your heartbeat pattern...',
        'Cross-checking chemistry with moonlight...',
        'Destiny is choosing your answer now...'
    ];
}

function defaultHint(state) {
    if (isAnanyaaName(state.userName) && !isJenishName(state.crushName)) {
        return 'The stars look picky tonight. Choose anyway.';
    }
    return 'Choose a move. Make it confident. Make it cute.';
}

function setHint(elements, text) {
    elements.decisionHint.textContent = text;
}

function setChoiceDisabled(choiceButtons, disabled) {
    choiceButtons.forEach((button) => {
        button.disabled = disabled;
    });
}

function setMode(mode, state, elements) {
    state.mode = mode;
    saveValue(STORAGE_KEYS.mode, mode);
    hydrateModeUI(state, elements);
    announce(elements.liveRegion, `Mode set to ${mode}.`);
}

function hydrateModeUI(state, elements) {
    document.body.dataset.mode = state.mode;
    setModeButtons(elements.modeButtons, state.mode);
}

function applyPreferences(state, elements) {
    document.body.classList.toggle('high-contrast', state.highContrast);
    document.body.classList.toggle('reduce-motion', state.reducedMotion);

    updateUtilityButtons(state, elements);
}

function updateUtilityButtons(state, elements) {
    elements.muteToggle.setAttribute('aria-pressed', String(state.muted));
    elements.muteToggle.textContent = state.muted ? 'Sound: Off' : 'Sound: On';

    elements.contrastToggle.setAttribute('aria-pressed', String(state.highContrast));
    elements.contrastToggle.textContent = state.highContrast ? 'Contrast: On' : 'High Contrast';

    elements.motionToggle.setAttribute('aria-pressed', String(state.reducedMotion));
    elements.motionToggle.textContent = state.reducedMotion ? 'Motion: Reduced' : 'Reduce Motion';
}

function triggerInputError(input, placeholder) {
    input.classList.add('input-error');
    const original = input.dataset.defaultPlaceholder || input.placeholder;
    input.value = '';
    input.placeholder = placeholder;

    window.setTimeout(() => {
        input.classList.remove('input-error');
        input.placeholder = original;
    }, 1300);
}

function createFloatingHearts(layer, shouldReduceMotion) {
    if (!layer) return;

    const symbols = ['💕', '💖', '💘', '💞', '🌹', '✨', '💋'];

    window.setInterval(() => {
        if (shouldReduceMotion()) return;

        const heart = document.createElement('span');
        heart.className = 'floating-heart';
        heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.fontSize = `${17 + Math.random() * 16}px`;
        heart.style.animationDuration = `${9 + Math.random() * 8}s`;
        heart.style.setProperty('--drift', `${(Math.random() - 0.5) * 90}px`);

        layer.appendChild(heart);
        window.setTimeout(() => {
            heart.remove();
        }, 18500);
    }, 1800);
}

function buildSharePayload(state, elements) {
    return {
        mode: state.mode,
        title: elements.resultTitle.textContent,
        summary: elements.finalMessage.textContent.trim(),
        userName: state.userName,
        crushName: state.crushName,
        result: state.result,
        playerChoice: state.playerChoice,
        computerChoice: state.computerChoice
    };
}

function resultVibration(result) {
    if (result === 'win') return [28, 34, 28];
    if (result === 'lose') return [42, 46];
    return [20, 24, 20];
}

function saveValue(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // ignore write failure
    }
}

function getSavedValue(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch(() => undefined);
    });
}
