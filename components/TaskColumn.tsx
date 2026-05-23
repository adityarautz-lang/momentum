"use client";

import { motion } from "framer-motion";

type Task = {
  title: string;
  priority: string;
  completed?: boolean;
};

export default function TaskColumn({
  title,
  color,
  tasks,
}: {
  title: string;
  color: string;
  tasks: Task[];
}) {
  return (
    <div className={`rounded-3xl p-5 ${color} min-h-[320px]`}>
      <h2 className="text-xl font-semibold mb-5">{title}</h2>

      <div className="space-y-3">
        {tasks.map((task, i) => (
          <motion.div
            whileHover={{ scale: 1.02 }}
            key={i}
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{task.title}</p>
              <p className="text-sm text-gray-500">{task.priority}</p>
            </div>

            <div
              className={`w-5 h-5 rounded-full border-2 ${
                task.completed
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300"
              }`}
            />
          </motion.div>
        ))}
      </div>

      <button className="mt-5 text-sm font-medium">
        + Add Task
      </button>
    </div>
  );
}