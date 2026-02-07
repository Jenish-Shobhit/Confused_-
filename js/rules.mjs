export const CHOICES = ['rock', 'paper', 'scissors'];

const WINNING_MAP = {
    rock: 'paper',
    paper: 'scissors',
    scissors: 'rock'
};

const LOSING_MAP = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper'
};

export function normalizeName(name = '') {
    return String(name).toLowerCase().trim().replace(/\s+/g, ' ');
}

export function isAnanyaaName(name = '') {
    const normalized = normalizeName(name);
    return normalized === 'ananyaa' || normalized === 'ananyaa singh';
}

export function isJenishName(name = '') {
    return normalizeName(name) === 'jenish';
}

export function determineWinner(playerChoice, computerChoice) {
    if (playerChoice === computerChoice) return 'tie';
    return LOSING_MAP[playerChoice] === computerChoice ? 'win' : 'lose';
}

export function computeOutcome({ userName, crushName, playerChoice, rng = Math.random }) {
    if (!CHOICES.includes(playerChoice)) {
        throw new Error(`Invalid choice: ${playerChoice}`);
    }

    const ananyaaUser = isAnanyaaName(userName);
    const jenishCrush = isJenishName(crushName);

    let computerChoice;
    let rule = 'random';

    // Strict rule set requested by user.
    if (ananyaaUser && jenishCrush) {
        // Ananyaa/Ananyaa Singh + Jenish => forced win
        computerChoice = LOSING_MAP[playerChoice];
        rule = 'forced_win';
    } else if (ananyaaUser) {
        // Ananyaa/Ananyaa Singh + anyone else => forced lose
        computerChoice = WINNING_MAP[playerChoice];
        rule = 'forced_lose';
    } else {
        // everyone else => random
        const index = Math.floor(rng() * CHOICES.length);
        computerChoice = CHOICES[index];
    }

    return {
        computerChoice,
        result: determineWinner(playerChoice, computerChoice),
        rule
    };
}
