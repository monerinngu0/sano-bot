const path = require('node:path');
const { execFile } = require('node:child_process');

const binaryPath = path.join(
    __dirname,
    '..',
    'bin',
    'markov',
);

const corpusPath = path.join(
    __dirname,
    '..',
    'data',
    'corpus.tsv',
);

function generateMarkov() {
    return new Promise((resolve, reject) => {
        execFile(
            binaryPath,
            [corpusPath],
            {
                encoding: 'utf8',
                timeout: 5000,
            },
            (error, stdout, stderr) => {
                if (error) {
                    reject(
                        new Error(
                            `Markov generator failed: ${stderr || error.message}`,
                        ),
                    );
                    return;
                }

                resolve(stdout.trim());
            },
        );
    });
}

module.exports = {
    generateMarkov,
};
