import { QueuedEmail } from "@/lib/types";

export const seedQueue: QueuedEmail[] = [
  {
    id: "e1",
    to: "priya@nigampanel.gov.in",
    subject: "Q3 pentest remediation summary",
    when: "Today, 6:00 PM",
    status: "scheduled",
    hour: 18,
  },
  {
    id: "e2",
    to: "team@bira-ventures.com",
    subject: "Sprint demo — GPS module",
    when: "Today, 9:30 AM",
    status: "scheduled",
    hour: 9.5,
  },
  {
    id: "e3",
    to: "hr@rainstream.io",
    subject: "Following up on Frontend Developer role",
    when: "Tomorrow, 10:00 AM",
    status: "scheduled",
    hour: 10,
  },
  {
    id: "e4",
    to: "clients@ranchimunicipal.gov.in",
    subject: "Monthly waste collection report",
    when: "Draft",
    status: "draft",
    hour: null,
  },
];
