const TRIGGER_WORDS = ['佐野', 'ようた', 'おうた', 'さの', 'ゲイ', '黒人', 'ユダヤ教'];
const DEFAULT_REPLY_RATE = 0.15;
const TARGET_CHANNEL_ID = '1504786234390872174';

function hasTriggerWord(content) {
    return TRIGGER_WORDS.some(word =>
        content.includes(word)
    );
}

function isTargetChannel(channelId) {
    return channelId === TARGET_CHANNEL_ID;
}

function shouldReply({
    mentioned,
    content,
    randomValue = Math.random(),
    replyRate = DEFAULT_REPLY_RATE,
}) {
    if (mentioned) return true;
    if (hasTriggerWord(content)) return true;

    return randomValue < replyRate;
}

module.exports = {
    hasTriggerWord,
    isTargetChannel,
    shouldReply,
};
