import { db } from "./index";
import { dashboardTasks } from "./schemas/dashboard-schema";

const tasks = [
  {
    id: 1,
    header: "Table of Contents",
    type: "Table of Contents",
    status: "Done",
    target: 1,
    limit: 1,
    reviewer: "Eddie Lake",
  },
  {
    id: 2,
    header: "Executive Summary",
    type: "Executive Summary",
    status: "Done",
    target: 1,
    limit: 1,
    reviewer: "Eddie Lake",
  },
  {
    id: 3,
    header: "Technical Approach",
    type: "Technical Approach",
    status: "In Progress",
    target: 50,
    limit: 100,
    reviewer: "Jamik Tashpulatov",
  },
  {
    id: 4,
    header: "Design Specifications",
    type: "Design",
    status: "Not Started",
    target: 0,
    limit: 20,
    reviewer: "Eddie Lake",
  },
  {
    id: 5,
    header: "Project Timeline",
    type: "Narrative",
    status: "In Progress",
    target: 10,
    limit: 15,
    reviewer: "Jamik Tashpulatov",
  },
];

async function main() {
  console.log("🌱 Seeding dashboard tasks...");

  try {
    // 既存データを削除
    await db.delete(dashboardTasks);

    // データを一括挿入
    await db.insert(dashboardTasks).values(tasks);
    console.log("✅ Successfully seeded dashboard tasks!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

main();
