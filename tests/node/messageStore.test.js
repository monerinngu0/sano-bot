const test = require('node:test');
const assert = require('node:assert/strict');

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const {
    sanitizeForTraining,
    saveMessage,
} = require('../../services/messageStore');

test('removes user mentions', () => {
    assert.equal(
        sanitizeForTraining(
            '<@123456789> hello',
        ),
        'hello',
    );
});

test('removes role and channel mentions', () => {
    assert.equal(
        sanitizeForTraining(
            '<@&123456789> <#987654321> hello',
        ),
        'hello',
    );
});

test('removes everyone and here mentions', () => {
    assert.equal(
        sanitizeForTraining(
            '@everyone hello @here',
        ),
        'hello',
    );
});

test('preserves original message in messages.jsonl', async () => {
    const testDir = await fs.mkdtemp(
        path.join(os.tmpdir(), 'sano-bot-'),
    );

    try {
        const message = {
            id: '100',
            author: {
                id: '200',
            },
            channel: {
                id: '300',
            },
            guild: {
                id: '400',
            },
            content:
                '<@123456789> 今日は学校だった',
            createdAt:
                new Date('2026-09-12T00:00:00Z'),
        };

        const fakeTokenizer = async text =>
            `TOKENIZED:${text}`;

        await saveMessage(message, {
            dataDir: testDir,
            tokenizeFn: fakeTokenizer,
        });

        const content = await fs.readFile(
            path.join(
                testDir,
                'messages.jsonl',
            ),
            'utf8',
        );

        const record = JSON.parse(
            content.trim(),
        );

        assert.equal(record.id, '100');
        assert.equal(record.author, '200');
        assert.equal(record.channel, '300');
        assert.equal(record.guild, '400');

        assert.equal(
            record.content,
            '<@123456789> 今日は学校だった',
        );

        assert.equal(
            record.timestamp,
            '2026-09-12T00:00:00.000Z',
        );
    } finally {
        await fs.rm(testDir, {
            recursive: true,
            force: true,
        });
    }
});

test('stores sanitized and tokenized content in corpus.tsv', async () => {
    const testDir = await fs.mkdtemp(
        path.join(os.tmpdir(), 'sano-bot-'),
    );

    try {
        const message = {
            id: '100',
            author: {
                id: '200',
            },
            channel: {
                id: '300',
            },
            guild: {
                id: '400',
            },
            content:
                '<@123456789> 今日は学校だった',
            createdAt: new Date(),
        };

        const fakeTokenizer = async text => {
            assert.equal(
                text,
                '今日は学校だった',
            );

            return '今日\tは\t学校\tだっ\tた';
        };

        await saveMessage(message, {
            dataDir: testDir,
            tokenizeFn: fakeTokenizer,
        });

        const corpus = await fs.readFile(
            path.join(
                testDir,
                'corpus.tsv',
            ),
            'utf8',
        );

        assert.equal(
            corpus,
            '今日\tは\t学校\tだっ\tた\n',
        );
    } finally {
        await fs.rm(testDir, {
            recursive: true,
            force: true,
        });
    }
});

test('does not write corpus.tsv when only mentions remain', async () => {
    const testDir = await fs.mkdtemp(
        path.join(os.tmpdir(), 'sano-bot-'),
    );

    try {
        const message = {
            id: '100',
            author: {
                id: '200',
            },
            channel: {
                id: '300',
            },
            guild: {
                id: '400',
            },
            content:
                '<@123456789> @everyone',
            createdAt: new Date(),
        };

        let tokenizerCalled = false;

        const fakeTokenizer = async () => {
            tokenizerCalled = true;
            return 'unexpected';
        };

        await saveMessage(message, {
            dataDir: testDir,
            tokenizeFn: fakeTokenizer,
        });

        assert.equal(
            tokenizerCalled,
            false,
        );

        const files = await fs.readdir(
            testDir,
        );

        assert.ok(
            files.includes('messages.jsonl'),
        );

        assert.equal(
            files.includes('corpus.tsv'),
            false,
        );
    } finally {
        await fs.rm(testDir, {
            recursive: true,
            force: true,
        });
    }
});
