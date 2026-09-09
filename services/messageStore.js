const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');

const dataDir = path.join(__dirname, '..', 'data');

const messagesPath = path.join(dataDir, 'messages.jsonl');
const corpusPath = path.join(dataDir, 'corpus.tsv');

const tokenizerPath = path.join(
    __dirname,
    '..',
    'python',
    'tokenizer.py',
);

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

async function saveMessage(message) {
    await fs.mkdir(dataDir, { recursive: true });

    const record = {
        id: message.id,
        author: message.author.id,
        channel: message.channel.id,
        guild: message.guild?.id ?? null,
        content: message.content,
        timestamp: message.createdAt.toISOString(),
    };

    // 原文はそのまま保存
    await fs.appendFile(
        messagesPath,
        JSON.stringify(record) + '\n',
        'utf8',
    );

    // 学習時だけDiscordのユーザーメンションを削除
    const content = message.content
        .replace(/<@!?\d+>/g, '')   // user
        .replace(/<@&\d+>/g, '')    // role
        .replace(/<#\d+>/g, '')     // channel
        .replace(/@everyone|@here/g, '')
        .trim();

    if (!content) {
        return;
    }

    const tokens = await tokenize(content);

    if (tokens) {
        await fs.appendFile(
            corpusPath,
            tokens + '\n',
            'utf8',
        );
    }
}

module.exports = {
    saveMessage,
};
