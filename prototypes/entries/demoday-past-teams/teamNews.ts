// Fabricated "recent news" counts for a subset of the demo-day teams. The real
// newsfeed mocks (newsfeed-v0) are keyed to different fictional teams, so there
// is nothing to join against teams.json — we author a small map here, keyed by
// the real teams.json `uid`. Only some teams have an entry, so the card can
// honor "show recent news if any". The card renders just the count as a tag, so
// this is the number of recent items each team has.
export const recentNewsCountByUid: Record<string, number> = {
  cldvnyrhz01wju21kbfisksrs: 3, // Zama
  cldvnvtuq00wxu21kt81mvysz: 2, // WeatherXM
  clz7dvunt000bvf02bwwsc7nn: 4, // Storacha
  cldvntv0a00b9u21kbusi8zvx: 1, // Anytype
  cldvnxhv801h7u21k4uxop2xz: 2, // Huddle01
  cldvntiqk008du21kffdyujn6: 1, // Lit Protocol
  cm81d9u6k0009xu02t3l5ufva: 2, // Recall
  cm7k6v3yr001up302a7wh0416: 3, // BitRobot Network
  cldvnyw8v01ybu21k0ap855tv: 1, // DeSci Labs
  clwsqjdj5000qzs02gyy8xu7n: 2, // Akave
};
