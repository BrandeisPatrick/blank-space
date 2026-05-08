export type ConversationRow = {
  id: string;
  title: string;
  messageCount: number;
  createdAt?: number | string | null;
  updatedAt?: number | string | null;
};

export type GroupedConversations = {
  today: ConversationRow[];
  yesterday: ConversationRow[];
  byYear: Record<string, ConversationRow[]>;
};

const MS_PER_DAY = 86_400_000;

export function groupConversations(rows: ConversationRow[]): GroupedConversations {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - MS_PER_DAY);
  const groups: GroupedConversations = { today: [], yesterday: [], byYear: {} };

  rows.forEach((c) => {
    const ts = typeof c.createdAt === 'number' ? c.createdAt : Number(c.createdAt) || Date.now();
    const d = new Date(ts);
    if (d >= today) groups.today.push(c);
    else if (d >= yesterday) groups.yesterday.push(c);
    else {
      const y = d.getFullYear().toString();
      if (!groups.byYear[y]) groups.byYear[y] = [];
      groups.byYear[y].push(c);
    }
  });

  return groups;
}
