export type Priority =
  | "Low"
  | "Medium"
  | "High";

export type Task = {
  id: string;
  title: string;
  priority: Priority;
  completed: boolean;

  // Manual date selected by the user.
  // This always overrides the AI suggested date.
  dueDate?: string;

  // AI/helper fields.
  suggestedDueDate?: string;
  aiReason?: string;
  aiConfidence?: number;

  // Metadata.
  createdAt?: string;
  completedAt?: string;
  category?: string;
};

export type Category = {
  id: string;
  title: string;
  tasks: Task[];
};

export type Firecracker = {
  id: string;
  x: number;
  y: number;
};

export type CompletedTask = Task & {
  completed: true;
  completedAt: string;
  category: string;
};

export type AppState = {
  categories: Category[];
  darkMode: boolean;
  themeColor: string;

  priorityViewMode?: "cards" | "list";
  upcomingViewMode?: "calendar" | "list";

  enableAppSuggestions?: boolean;
  enableAutoPriority?: boolean;

  archive: CompletedTask[];
  completedToday?: CompletedTask[];
};