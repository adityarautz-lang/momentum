export type Priority =
  | "Low"
  | "Medium"
  | "High";

export type Task = {
  id: string;
  title: string;
  priority: Priority;
  completed: boolean;
};

export type Category = {
  id: string;
  title: string;
  tasks: Task[];
};

export type ArchivedTask = {
  id: string;
  title: string;
  priority: Priority;
  category: string;
  completedAt: string;
};

export type Firecracker = {
  id: string;
  x: number;
  y: number;
};

export type AppState = {
  categories: Category[];
  darkMode: boolean;
  themeColor: string;
  archive: ArchivedTask[];
};