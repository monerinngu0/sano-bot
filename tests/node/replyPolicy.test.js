const test = require('node:test');
const assert = require('node:assert/strict');

const {
    hasTriggerWord,
    shouldReply,
} = require('../../services/replyPolicy');

test('returns true when content includes "佐野"', () => {
    assert.equal(
        hasTriggerWord('佐野どこいった'),
        true,
    );
});

test('returns true when content includes "ようた"', () => {
    assert.equal(
        hasTriggerWord('ようた何してる？'),
        true,
    );
});

test('returns false when no trigger word exists', () => {
    assert.equal(
        hasTriggerWord('今日は学校だった'),
        false,
    );
});

test('always replies when mentioned', () => {
    assert.equal(
        shouldReply({
            mentioned: true,
            content: 'こんにちは',
            randomValue: 0.99,
        }),
        true,
    );
});

test('always replies when a trigger word is included', () => {
    assert.equal(
        shouldReply({
            mentioned: false,
            content: '佐野いる？',
            randomValue: 0.99,
        }),
        true,
    );
});

test('replies when random value is below 0.15', () => {
    assert.equal(
        shouldReply({
            mentioned: false,
            content: '今日は学校だった',
            randomValue: 0.149,
        }),
        true,
    );
});

test('does not reply when random value is 0.15 or higher', () => {
    assert.equal(
        shouldReply({
            mentioned: false,
            content: '今日は学校だった',
            randomValue: 0.15,
        }),
        false,
    );

    assert.equal(
        shouldReply({
            mentioned: false,
            content: '今日は学校だった',
            randomValue: 0.9,
        }),
        false,
    );
});
