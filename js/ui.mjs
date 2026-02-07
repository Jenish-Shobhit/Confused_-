export function $(selector, root = document) {
    return root.querySelector(selector);
}

export function $all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}

export function showCard(cardId, cards) {
    cards.forEach((card) => {
        card.classList.remove('active');
    });

    const nextCard = cards.find((card) => card.id === cardId);
    if (!nextCard) return;

    nextCard.classList.add('active');
    focusPrimary(nextCard);
}

export function focusPrimary(card) {
    const target = card.querySelector('input, button, select, textarea');
    if (target) target.focus();
}

export function announce(liveRegion, message) {
    if (!liveRegion) return;
    liveRegion.textContent = '';
    window.setTimeout(() => {
        liveRegion.textContent = message;
    }, 30);
}

export async function typeLines(targetElement, lines, { reducedMotion = false, onLineStart } = {}) {
    if (!targetElement) return;

    if (reducedMotion) {
        targetElement.textContent = lines[lines.length - 1] || '';
        return;
    }

    for (const line of lines) {
        if (typeof onLineStart === 'function') onLineStart(line);

        targetElement.textContent = '';
        for (const char of line) {
            targetElement.textContent += char;
            // eslint-disable-next-line no-await-in-loop
            await wait(22);
        }
        // eslint-disable-next-line no-await-in-loop
        await wait(420);
    }
}

export function setModeButtons(modeButtons, mode) {
    modeButtons.forEach((button) => {
        const active = button.dataset.mode === mode;
        button.classList.toggle('active', active);
        button.setAttribute('aria-checked', String(active));
    });
}

export function setBodyResultState(result) {
    document.body.classList.remove('result-win', 'result-lose', 'result-tie');

    if (result === 'win') document.body.classList.add('result-win');
    if (result === 'lose') document.body.classList.add('result-lose');
    if (result === 'tie') document.body.classList.add('result-tie');

    window.setTimeout(() => {
        document.body.classList.remove('result-win', 'result-lose', 'result-tie');
    }, 950);
}

export function emitResultParticles(layer, result, reducedMotion = false) {
    if (!layer) return;

    const map = {
        win: ['💖', '✨', '💘', '🌹', '💋'],
        lose: ['🥀', '💔', '🍂', '✨'],
        tie: ['✨', '🌙', '❔', '💫']
    };

    const symbols = map[result] || map.tie;
    const count = reducedMotion ? 6 : result === 'win' ? 24 : 16;

    for (let i = 0; i < count; i += 1) {
        const particle = document.createElement('span');
        particle.className = 'result-particle';
        particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        particle.style.left = `${8 + Math.random() * 84}%`;
        particle.style.top = `${55 + Math.random() * 18}%`;
        particle.style.fontSize = `${14 + Math.random() * 16}px`;
        particle.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 180}px`);
        particle.style.setProperty('--drift-y', `${(Math.random() - 0.5) * 90}px`);

        layer.appendChild(particle);
        window.setTimeout(() => particle.remove(), 1250);
    }
}

export function vibrate(pattern) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

export function wait(ms) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}
