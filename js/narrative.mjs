const MODE_STYLES = {
    sweet: {
        titleWin: ['Soft Sparks, Big Promise', 'Gentle Magic, Real Chemistry', 'Heartfelt Green Flag'],
        titleLose: ['Sweet Vibe, Wrong Chapter', 'Lovely But Not Aligned', 'Not Your Soft Place'],
        titleTie: ['Tender Maybe', 'A Soft Pause', 'Not Yet, Beautifully'],
        flavor: 'sweet',
        CTAWin: 'Keep it warm, honest, and a little dreamy.'
    },
    spicy: {
        titleWin: ['Chemistry: Certified', 'A Burning Yes', 'Your Flirt Energy Won'],
        titleLose: ['Not This Flame', 'Hot, But Not Yours', 'Wrong Fire Tonight'],
        titleTie: ['A Teasing Maybe', 'Heat Without Verdict', 'Almost, Not Quite'],
        flavor: 'spicy',
        CTAWin: 'Text first. Overthink later.'
    },
    chaotic: {
        titleWin: ['Unhinged Match Energy', 'Chaos Says Yes', 'Destiny Went Off Script'],
        titleLose: ['Chaos Rejected It', 'Plot Twist: Nope', 'This Timeline Is Cursed'],
        titleTie: ['Chaotic Maybe', 'The Universe Is Buffering', 'Undefined Romance'],
        flavor: 'chaotic',
        CTAWin: 'Cause a scene. Respectfully.'
    }
};

const SPARK_MAP = {
    eyes: 'intense eye contact',
    banter: 'dangerously good banter',
    voice: 'that irresistible voice note'
};

const STYLE_MAP = {
    soft: 'soft-burn',
    bold: 'confident',
    chaos: 'unpredictable'
};

const RHYTHM_MAP = {
    slow: 'slow-burn romance',
    fast: 'fast-paced thrill',
    unhinged: 'beautiful chaos'
};

function pick(list, rng = Math.random) {
    return list[Math.floor(rng() * list.length)];
}

function quizFlavorLine(quiz = {}) {
    const spark = SPARK_MAP[quiz.spark] || 'a magnetic spark';
    const style = STYLE_MAP[quiz.style] || 'playful';
    const rhythm = RHYTHM_MAP[quiz.rhythm] || 'unpredictable romance';
    return `Your ${style} flirting style craves ${spark} and a ${rhythm}.`;
}

export function buildNarrative({
    mode = 'spicy',
    result,
    rule,
    userName,
    crushName,
    quiz,
    rng = Math.random
}) {
    const modeStyle = MODE_STYLES[mode] || MODE_STYLES.spicy;
    const flavor = quizFlavorLine(quiz);

    let title;
    let paragraphs;
    let resultClass = result;

    if (rule === 'forced_win') {
        title = pick(modeStyle.titleWin, rng);
        paragraphs = [
            `<p style="margin-bottom: 12px;">💖 <strong>${userName}</strong>, this one is non-negotiable.</p>`,
            `<p style="margin-bottom: 12px;"><strong>${crushName}</strong> is star-approved for you tonight.</p>`,
            `<p>${flavor} ${modeStyle.CTAWin}</p>`
        ];
    } else if (rule === 'forced_lose') {
        title = pick(modeStyle.titleLose, rng);
        paragraphs = [
            `<p style="margin-bottom: 12px;">⚡ <strong>${userName}</strong>, fate is being strict and possessive.</p>`,
            `<p style="margin-bottom: 12px;"><strong>${crushName}</strong> is rejected in this timeline.</p>`,
            `<p>${flavor} Save that energy for the right fire.</p>`
        ];
    } else if (result === 'win') {
        title = pick(modeStyle.titleWin, rng);
        paragraphs = [
            `<p style="margin-bottom: 12px;">🌹 <strong>${userName}</strong>, your move had irresistible timing.</p>`,
            `<p style="margin-bottom: 12px;">With <strong>${crushName}</strong>, the chemistry feels very real right now.</p>`,
            `<p>${flavor} ${modeStyle.CTAWin}</p>`
        ];
    } else if (result === 'lose') {
        title = pick(modeStyle.titleLose, rng);
        paragraphs = [
            `<p style="margin-bottom: 12px;">💔 <strong>${userName}</strong>, beautiful vibe, wrong alignment.</p>`,
            `<p style="margin-bottom: 12px;">As tempting as <strong>${crushName}</strong> looks, tonight says pass.</p>`,
            `<p>${flavor} Keep your standards high.</p>`
        ];
    } else {
        title = pick(modeStyle.titleTie, rng);
        resultClass = 'tie';
        paragraphs = [
            `<p style="margin-bottom: 12px;">✨ <strong>${userName}</strong>, fate is flirting back but not answering yet.</p>`,
            `<p style="margin-bottom: 12px;">The story with <strong>${crushName}</strong> is still unfolding.</p>`,
            `<p>${flavor} Give it one more night and ask again.</p>`
        ];
    }

    const html = paragraphs.join('');
    const summary = `${title}. ${userName} + ${crushName}. ${result}. ${flavor}`;

    return {
        title,
        html,
        resultClass,
        summary
    };
}
