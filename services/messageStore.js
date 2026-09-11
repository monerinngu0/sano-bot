const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');

const defaultDataDir = path.join(__dirname, '..', 'data');

const tokenizerPath = path.join(
    __dirname,
    '..',
    'python',
    'tokenizer.py',
);

function sanitizeForTraining(content) {
    return content
        .replace(/<@!?\d+>/g, '')
        .replace(/<@&\d+>/g, '')
        .replace(/<#\d+>/g, '')
        .replace(/@everyone|@here/g, '')
        .trim();
}

async function tokenize(text) {
    return new Promise((resolve, reject) => {
        const proc = spawn('python', [tokenizerPath]);

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', chunk => {
            stdout += chunk;
        });

        proc.stderr.on('data', chunk => {
            stderr += chunk;
        });

        proc.on('close', code => {
            if (code !== 0) {
                reject(
                    new Error(
                        `tokenizer exited with code ${code}: ${stderr}`,
                    ),
                );
                return;
            }

            resolve(stdout.trim());
        });

        proc.stdin.write(text);
        proc.stdin.end();
    });
}

async function saveMessage(
    message,
    {
        dataDir = defaultDataDir,
        tokenizeFn = tokenize,
    } = {},
) {
    await fs.mkdir(dataDir, { recursive: true });

    const messagesPath = path.join(
        dataDir,
        'messages.jsonl',
    );

    const corpusPath = path.join(
        dataDir,
        'corpus.tsv',
    );

    const record = {
        id: message.id,
        author: message.author.id,
        channel: message.channel.id,
        guild: message.guild?.id ?? null,
        content: message.content,
        timestamp: message.createdAt.toISOString(),
    };

    await fs.appendFile(
        messagesPath,
        JSON.stringify(record) + '\n',
        'utf8',
    );

    const content = sanitizeForTraining(
        message.content,
    );

    if (!content) {
        return;
    }

    const tokens = await tokenizeFn(content);

    if (tokens) {
        await fs.appendFile(
            corpusPath,
            tokens + '\n',
            'utf8',
        );
    }
}

module.exports = {
    sanitizeForTraining,
    saveMessage,
};
