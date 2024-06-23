/*
 * This function returns an emoji icon based on the name of the project.
 */

const getEmojiIcon = (name = "") => {
  const stagingKeywords = [
    "staging",
    "dev",
    "qa",
    "demo",
    "preview",
    "sandbox",
    "playground",
    "beta",
  ];

  const productionKeywords = [
    "prod",
    "production",
    "live",
    "master",
    "main",
    "release",
    "deploy",
    "ship",
    "go",
  ];

  const otherDevKeywords = [
    "build",
    "compile",
    "run",
    "execute",
    "debug",
    "test",
  ];

  const randomEmojis = [
    "✨",
    "🌟",
    "🎯",
    "🏅",
    "💡",
    "📚",
    "🛠️",
    "🔒",
    "🔍",
    "💼",
    "🧩",
    "📝",
    "🌐",
    "🏆",
    "🎉",
  ];

  const containsKeyword = (keywords) => {
    return keywords.some((keyword) => name.toLowerCase().includes(keyword));
  };

  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };

  const getRandomEmoji = (str) => {
    const hash = hashString(str);
    return randomEmojis[Math.abs(hash) % randomEmojis.length];
  };

  if (name.toLowerCase().includes("default")) {
    return "⭐";
  } else if (containsKeyword(stagingKeywords)) {
    return "🔧";
  } else if (containsKeyword(productionKeywords)) {
    return "🚀";
  } else if (containsKeyword(otherDevKeywords)) {
    return "🧪";
  } else {
    return getRandomEmoji(name);
  }
};

export { getEmojiIcon };
