import test from 'node:test';
import assert from 'node:assert/strict';
import { computeOutcome, determineWinner, normalizeName } from '../js/rules.mjs';

test('normalizeName handles casing and extra spaces', () => {
    assert.equal(normalizeName('  AnAnyAa   Singh '), 'ananyaa singh');
});

test('Ananyaa + Jenish is always forced win', () => {
    const choices = ['rock', 'paper', 'scissors'];

    for (const playerChoice of choices) {
        const outcome = computeOutcome({
            userName: 'Ananyaa',
            crushName: 'jenish',
            playerChoice
        });

        assert.equal(outcome.rule, 'forced_win');
        assert.equal(outcome.result, 'win');
        assert.equal(determineWinner(playerChoice, outcome.computerChoice), 'win');
    }
});

test('Ananyaa Singh + anyone else is always forced lose', () => {
    const choices = ['rock', 'paper', 'scissors'];

    for (const playerChoice of choices) {
        const outcome = computeOutcome({
            userName: 'Ananyaa Singh',
            crushName: 'Shahrukh Khan',
            playerChoice
        });

        assert.equal(outcome.rule, 'forced_lose');
        assert.equal(outcome.result, 'lose');
        assert.equal(determineWinner(playerChoice, outcome.computerChoice), 'lose');
    }
});

test('Everyone else uses random branch', () => {
    const outcome = computeOutcome({
        userName: 'Riya',
        crushName: 'Jenish',
        playerChoice: 'rock',
        rng: () => 0.99
    });

    assert.equal(outcome.rule, 'random');
    assert.equal(outcome.computerChoice, 'scissors');
    assert.equal(outcome.result, 'win');
});

test('Ananyaa only matches Jenish exactly (case-insensitive, spacing normalized)', () => {
    const winOutcome = computeOutcome({
        userName: '  aNaNyAa  ',
        crushName: '  JeNisH ',
        playerChoice: 'paper'
    });

    const loseOutcome = computeOutcome({
        userName: '  aNaNyAa  ',
        crushName: 'Jenish Shobhit',
        playerChoice: 'paper'
    });

    assert.equal(winOutcome.rule, 'forced_win');
    assert.equal(winOutcome.result, 'win');

    assert.equal(loseOutcome.rule, 'forced_lose');
    assert.equal(loseOutcome.result, 'lose');
});
