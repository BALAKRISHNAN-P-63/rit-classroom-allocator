import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";

// ============================================
// DATA - Extracted from uploaded PDF
// ============================================

const PERIODS = [
  { num: 1, start: "08:00", end: "08:50", label: "8:00 - 8:50" },
  { num: 2, start: "08:50", end: "09:40", label: "8:50 - 9:40" },
  { num: 0, start: "09:40", end: "10:10", label: "BREAK", isBreak: true },
  { num: 3, start: "10:10", end: "11:00", label: "10:10 - 11:00" },
  { num: 4, start: "11:00", end: "11:50", label: "11:00 - 11:50" },
  { num: 5, start: "11:50", end: "12:40", label: "11:50 - 12:40" },
  { num: -1, start: "12:40", end: "13:30", label: "LUNCH", isBreak: true },
  { num: 6, start: "13:30", end: "14:15", label: "1:30 - 2:15" },
  { num: 7, start: "14:15", end: "15:00", label: "2:15 - 3:00" },
];

const TEACHING_PERIODS = PERIODS.filter(p => !p.isBreak);
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const COURSES = {
  "GE23411": { name: "Environmental Science and Sustainability", short: "ESS" },
  "MA23411": { name: "Probability and Statistics", short: "P&S" },
  "AD23411": { name: "Data Analytics", short: "DA" },
  "AL23411": { name: "Machine Learning", short: "ML" },
  "CS23412": { name: "Operating Systems", short: "OS" },
  "CS23431": { name: "Design and Analysis of Algorithms", short: "DAA" },
  "AD23421": { name: "Data Analytics Laboratory", short: "DA Lab" },
  "AL23421": { name: "Machine Learning Laboratory", short: "ML Lab" },
  "CS23422": { name: "Operating Systems Laboratory", short: "OS Lab" },
  "AD23412": { name: "Formal Language and Automata Theory", short: "FLAT" },
  "AD23V46": { name: "Text and Speech Analysis", short: "TSA" },
  "CS23V57": { name: "Web Technologies", short: "WT" },
  "O23EC12": { name: "IT in Agricultural System", short: "ITAS" },
  "O23EC21": { name: "Wearable Devices and its Applications", short: "WDA" },
  "MX23612": { name: "Industrial Safety", short: "IS" },
  "EC23631": { name: "Embedded Systems and IoT", short: "ES&IoT" },
  "CS23631": { name: "Object Oriented Software Engineering", short: "OOSE" },
  "AD23621": { name: "Mini Project", short: "Mini Project" },
  "AL23621": { name: "Mini Project", short: "Mini Project" },
};

const ROOMS = [
  "A102", "A103", "A301", "A302", "A303", "A304", "A306", "A307", "A308",
  "B002", "B003", "B004", "B202", "B203"
];

const CLASSES = [
  { id: "II_AIDS_A", name: "II AI&DS-A", year: 2, dept: "AI&DS", sem: 4, venue: "Mon&Tue: B003 | Thu&Fri: B203 | Wed: A304/A103/A301", incharge: "Mrs.M.Divya" },
  { id: "II_AIDS_B", name: "II AI&DS-B", year: 2, dept: "AI&DS", sem: 4, venue: "A-302", incharge: "Mrs.Rubina Begam" },
  { id: "II_AIDS_C", name: "II AI&DS-C", year: 2, dept: "AI&DS", sem: 4, venue: "A-303", incharge: "Ms.W.Jeslin Melcy" },
  { id: "II_AIDS_D", name: "II AI&DS-D", year: 2, dept: "AI&DS", sem: 4, venue: "A-304", incharge: "Mrs.M.Muthukamakshi" },
  { id: "II_AIDS_E", name: "II AI&DS-E", year: 2, dept: "AI&DS", sem: 4, venue: "A-306", incharge: "Mrs.K.Fouzia Sulthana" },
  { id: "II_AIDS_F", name: "II AI&DS-F", year: 2, dept: "AI&DS", sem: 4, venue: "A-301", incharge: "Ms.S.Divya" },
  { id: "II_AIML_A", name: "II AI&ML-A", year: 2, dept: "AI&ML", sem: 4, venue: "A-307", incharge: "Mrs.Lavanya R" },
  { id: "II_AIML_B", name: "II AI&ML-B", year: 2, dept: "AI&ML", sem: 4, venue: "Mon&Tue: B002 | Thu&Fri: B202 | Wed: A303/A102/A302", incharge: "Mrs.Lizy A" },
  { id: "II_AIML_C", name: "II AI&ML-C", year: 2, dept: "AI&ML", sem: 4, venue: "A-308", incharge: "Mrs.Starlin M.A" },
  { id: "III_AIDS_A", name: "III AI&DS-A", year: 3, dept: "AI&DS", sem: 6, venue: "B003", incharge: "Mrs. Sandhiya Rajeshwari R" },
  { id: "III_AIDS_B", name: "III AI&DS-B", year: 3, dept: "AI&DS", sem: 6, venue: "B004", incharge: "Ms. Sangeetha S" },
  { id: "III_AIDS_C", name: "III AI&DS-C", year: 3, dept: "AI&DS", sem: 6, venue: "—", incharge: "Ms. Monikaa R" },
  { id: "III_AIML", name: "III AI&ML", year: 3, dept: "AI&ML", sem: 6, venue: "B002", incharge: "Mrs. Noorul Julaiha A G" },
];

// Timetable data: [P1, P2, P3, P4, P5, P6, P7]
// Format: "CODE" or "CODE(B1)/CODE(B2)" or "Mentoring"/"Placement"/null
const TIMETABLE = {
  "II_AIDS_A": {
    Monday: ["ML-AL23421(B1)/DA-AD23421(B2)","ML-AL23421(B1)/DA-AD23421(B2)","DA-AD23411","OS-CS23412","ESS-GE23411","DAA-CS23431","P&S-MA23411"],
    Tuesday: ["P&S-MA23411","ML-AL23411","DA-AD23411","DAA-CS23431","OS-CS23412","DA-AD23421(B1)/DAA-CS23431(B2)","DA-AD23421(B1)/DAA-CS23431(B2)"],
    Wednesday: ["ML-AL23411","P&S-MA23411","Mentoring","ESS-GE23411","OS-CS23412","OS-CS23422(B1)/ML-AL23421(B2)","OS-CS23422(B1)/ML-AL23421(B2)"],
    Thursday: ["OS-CS23412","P&S-MA23411","DA-AD23411","ML-AL23411","ESS-GE23411","DAA-CS23431","Placement"],
    Friday: ["P&S-MA23411","DAA-CS23431","DA-AD23411","P&S-MA23411","ML-AL23411","DAA-CS23431(B1)/OS-CS23422(B2)","DAA-CS23431(B1)/OS-CS23422(B2)"],
  },
  "II_AIDS_B": {
    Monday: ["ML-AL23411","P&S-MA23411","DA-AD23411","OS-CS23412","DAA-CS23431","DA-AD23421(B1)/DAA-CS23431(B2)","ML-AL23411"],
    Tuesday: ["OS-CS23412","P&S-MA23411","DA-AD23411","ESS-GE23411","P&S-MA23411","DAA-CS23431","ML-AL23411"],
    Wednesday: ["ESS-GE23411","DAA-CS23431","ML-AL23411","DAA-CS23431(B1)/OS-CS23422(B2)","DAA-CS23431(B1)/OS-CS23422(B2)","P&S-MA23411","Mentoring"],
    Thursday: ["P&S-MA23411","ML-AL23411","DA-AD23411","ML-AL23421(B1)/DA-AD23421(B2)","ML-AL23421(B1)/DA-AD23421(B2)","OS-CS23412","ESS-GE23411"],
    Friday: ["Placement","DAA-CS23431","DA-AD23411","OS-CS23422(B1)/ML-AL23421(B2)","P&S-MA23411","OS-CS23412","OS-CS23412"],
  },
  "II_AIDS_C": {
    Monday: ["DAA-CS23431(B1)/OS-CS23422(B2)","DAA-CS23431(B1)/OS-CS23422(B2)","DA-AD23411","P&S-MA23411","DAA-CS23431","Mentoring","ESS-GE23411"],
    Tuesday: ["DAA-CS23431","ML-AL23411","DA-AD23411","OS-CS23412","P&S-MA23411","DA-AD23421(B1)/DAA-CS23431(B2)","DA-AD23421(B1)/DAA-CS23431(B2)"],
    Wednesday: ["OS-CS23422(B1)/ML-AL23421(B2)","OS-CS23422(B1)/ML-AL23421(B2)","OS-CS23412","P&S-MA23411","ESS-GE23411","OS-CS23412","P&S-MA23411"],
    Thursday: ["ML-AL23411","OS-CS23412","DA-AD23411","DAA-CS23431","OS-CS23412","P&S-MA23411","ESS-GE23411"],
    Friday: ["ML-AL23411","P&S-MA23411","DA-AD23411","DAA-CS23431","Placement","ML-AL23411","P&S-MA23411"],
  },
  "II_AIDS_D": {
    Monday: ["ESS-GE23411","ML-AL23411","DA-AD23411","ML-AL23421(B1)/DA-AD23421(B2)","P&S-MA23411","P&S-MA23411","OS-CS23412"],
    Tuesday: ["DAA-CS23431","P&S-MA23411","DA-AD23411","ESS-GE23411","ML-AL23411","OS-CS23422(B1)/ML-AL23421(B2)","OS-CS23422(B1)/ML-AL23421(B2)"],
    Wednesday: ["DAA-CS23431(B1)/OS-CS23422(B2)","DAA-CS23431(B1)/OS-CS23422(B2)","OS-CS23412","P&S-MA23411","ESS-GE23411","DAA-CS23431","Mentoring"],
    Thursday: ["ML-AL23411","OS-CS23412","DA-AD23411","DAA-CS23431","OS-CS23412","P&S-MA23411","ML-AL23411"],
    Friday: ["OS-CS23412","DAA-CS23431","DA-AD23411","DAA-CS23431","Placement","P&S-MA23411","P&S-MA23411"],
  },
  "II_AIDS_E": {
    Monday: ["DAA-CS23431(B1)/OS-CS23422(B2)","DAA-CS23431(B1)/OS-CS23422(B2)","DA-AD23411","OS-CS23412","P&S-MA23411","ML-AL23411","DAA-CS23431"],
    Tuesday: ["ML-AL23411","OS-CS23412","DA-AD23411","OS-CS23422(B1)/ML-AL23421(B2)","OS-CS23422(B1)/ML-AL23421(B2)","DAA-CS23431","P&S-MA23411"],
    Wednesday: ["DAA-CS23431","ML-AL23411","P&S-MA23411","ESS-GE23411","Mentoring","DA-AD23421(B1)/DAA-CS23431(B2)","DA-AD23421(B1)/DAA-CS23431(B2)"],
    Thursday: ["OS-CS23412","ESS-GE23411","DA-AD23411","P&S-MA23411","DAA-CS23431","P&S-MA23411","ML-AL23411"],
    Friday: ["ML-AL23411(B1)/DA-AD23421(B2)","ML-AL23411(B1)/DA-AD23421(B2)","DA-AD23411","P&S-MA23411","OS-CS23412","Placement","ESS-GE23411"],
  },
  "II_AIDS_F": {
    Monday: ["ESS-GE23411","ML-AL23411","DA-AD23411","P&S-MA23411","OS-CS23412","DAA-CS23431","P&S-MA23411"],
    Tuesday: ["ML-AL23421(B1)/DA-AD23421(B2)","ML-AL23421(B1)/DA-AD23421(B2)","DA-AD23411","OS-CS23412","DAA-CS23431","ESS-GE23411","P&S-MA23411"],
    Wednesday: ["P&S-MA23411","DAA-CS23431","OS-CS23412","ML-AL23411","Mentoring","DAA-CS23431(B1)/OS-CS23422(B2)","DAA-CS23431(B1)/OS-CS23422(B2)"],
    Thursday: ["DAA-CS23431","ML-AL23411","DA-AD23411","ESS-GE23411","P&S-MA23411","DA-AD23421(B1)/DAA-CS23431(B2)","DA-AD23421(B1)/DAA-CS23431(B2)"],
    Friday: ["ML-AL23411","P&S-MA23411","DA-AD23411","OS-CS23412","Placement","OS-CS23422(B1)/ML-AL23421(B2)","OS-CS23422(B1)/ML-AL23421(B2)"],
  },
  "II_AIML_A": {
    Monday: ["DA-AD23411","OS-CS23412","ML-AL23411","ML-AL23421(B1)/DA-AD23421(B2)","ML-AL23421(B1)/DA-AD23421(B2)","FLAT-AD23412","ESS-GE23411"],
    Tuesday: ["DAA-CS23431(B1)/OS-CS23422(B2)","DAA-CS23431(B1)/OS-CS23422(B2)","OS-CS23412","DAA-CS23431","FLAT-AD23412","DA-AD23411","DA-AD23411"],
    Wednesday: ["OS-CS23412","FLAT-AD23412","ESS-GE23411","DAA-CS23431","ML-AL23411","FLAT-AD23412","ESS-GE23411"],
    Thursday: ["ML-AL23411","DAA-CS23431","FLAT-AD23412","Placement","OS-CS23412","OS-CS23422(B1)/ML-AL23421(B2)","OS-CS23422(B1)/ML-AL23421(B2)"],
    Friday: ["DA-AD23421(B1)/DAA-CS23431(B2)","DA-AD23421(B1)/DAA-CS23431(B2)","FLAT-AD23412","DAA-CS23431","DA-AD23411","ML-AL23411","Mentoring"],
  },
  "II_AIML_B": {
    Monday: ["DA-AD23411","OS-CS23412","FLAT-AD23412","OS-CS23422(B1)/ML-AL23421(B2)","OS-CS23422(B1)/ML-AL23421(B2)","ML-AL23411","FLAT-AD23412"],
    Tuesday: ["ML-AL23411","ESS-GE23411","DAA-CS23431","ML-AL23421(B1)/DA-AD23421(B2)","ML-AL23421(B1)/DA-AD23421(B2)","DA-AD23411","DA-AD23411"],
    Wednesday: ["OS-CS23412","ESS-GE23411","FLAT-AD23412","ML-AL23411","Mentoring","DAA-CS23431(B1)/OS-CS23422(B2)","DAA-CS23431(B1)/OS-CS23422(B2)"],
    Thursday: ["FLAT-AD23412","OS-CS23412","DAA-CS23431","OS-CS23412","Placement","DA-AD23421(B1)/DAA-CS23431(B2)","DA-AD23421(B1)/DAA-CS23431(B2)"],
    Friday: ["ML-AL23411","FLAT-AD23412","ESS-GE23411","DAA-CS23431","DA-AD23411","DAA-CS23431","FLAT-AD23412"],
  },
  "II_AIML_C": {
    Monday: ["DA-AD23411","FLAT-AD23412","DAA-CS23431","ML-AL23411","FLAT-AD23412","ML-AL23421(B1)/DA-AD23421(B2)","ML-AL23421(B1)/DA-AD23421(B2)"],
    Tuesday: ["OS-CS23412","ESS-GE23411","ML-AL23411","DAA-CS23431(B1)/OS-CS23422(B2)","DAA-CS23431(B1)/OS-CS23422(B2)","DA-AD23411","DA-AD23411"],
    Wednesday: ["ML-AL23411","ESS-GE23411","ML-AL23411","OS-CS23412","ESS-GE23411","DAA-CS23431","FLAT-AD23412"],
    Thursday: ["DA-AD23421(B1)/DAA-CS23431(B2)","DA-AD23421(B1)/DAA-CS23431(B2)","FLAT-AD23412","DAA-CS23431","Mentoring","Placement","FLAT-AD23412"],
    Friday: ["DAA-CS23431","OS-CS23412","FLAT-AD23412","OS-CS23412","DA-AD23411","OS-CS23422(B1)/ML-AL23421(B2)","OS-CS23422(B1)/ML-AL23421(B2)"],
  },
  "III_AIDS_A": {
    Monday: ["WDA-O23EC21","ES&IoT-EC23631","IS-MX23612","Mini Project-AD23621","Mini Project-AD23621","OOSE-CS23631","IS-MX23612"],
    Tuesday: ["Mini Project-AD23621","Mini Project-AD23621","IS-MX23612","WT-CS23V57","TSA-AD23V46","Mini Project-AD23621","Mini Project-AD23621"],
    Wednesday: ["OOSE-CS23631","WT-CS23V57","TSA-AD23V46","OOSE-CS23631(B2)/ES&IoT-EC23631(B1)","OOSE-CS23631(B2)/ES&IoT-EC23631(B1)","WDA-O23EC21","WDA-O23EC21"],
    Thursday: ["ITAS-O23EC12","WT-CS23V57","ITAS-O23EC12","ES&IoT-EC23631","OOSE-CS23631","ES&IoT-EC23631","TSA-AD23V46"],
    Friday: ["TSA-AD23V46","OOSE-CS23631","ES&IoT-EC23631","WT-CS23V57","ITAS-O23EC12","OOSE-CS23631(B1)/ES&IoT-EC23631(B2)","OOSE-CS23631(B1)/ES&IoT-EC23631(B2)"],
  },
  "III_AIDS_B": {
    Monday: ["WDA-O23EC21","OOSE-CS23631","Mini Project-AD23621","Mini Project-AD23621","ES&IoT-EC23631","IS-MX23612","TSA-AD23V46"],
    Tuesday: ["Mini Project-AD23621","Mini Project-AD23621","WT-CS23V57","IS-MX23612","IS-MX23612","Mini Project-AD23621","Mini Project-AD23621"],
    Wednesday: ["ES&IoT-EC23631","ITAS-O23EC12","OOSE-CS23631","TSA-AD23V46","WT-CS23V57","OOSE-CS23631(B1)/ES&IoT-EC23631(B2)","OOSE-CS23631(B1)/ES&IoT-EC23631(B2)"],
    Thursday: ["TSA-AD23V46","ES&IoT-EC23631","WT-CS23V57","OOSE-CS23631(B2)/ES&IoT-EC23631(B1)","OOSE-CS23631(B2)/ES&IoT-EC23631(B1)","ITAS-O23EC12","TSA-AD23V46"],
    Friday: ["OOSE-CS23631(B1)/ES&IoT-EC23631(B2)","OOSE-CS23631(B1)/ES&IoT-EC23631(B2)","ITAS-O23EC12","OOSE-CS23631","WT-CS23V57","OOSE-CS23631","ES&IoT-EC23631"],
  },
  "III_AIDS_C": {
    Monday: ["WDA-O23EC21","IS-MX23612","TSA-AD23V46","ES&IoT-EC23631","IS-MX23612","Mini Project-AD23621","Mini Project-AD23621"],
    Tuesday: ["Mini Project-AD23621","Mini Project-AD23621","IS-MX23612","WT-CS23V57","OOSE-CS23631","Mini Project-AD23621","Mini Project-AD23621"],
    Wednesday: ["TSA-AD23V46","OOSE-CS23631","ES&IoT-EC23631","WT-CS23V57","OOSE-CS23631","OOSE-CS23631","WT-CS23V57"],
    Thursday: ["OOSE-CS23631(B1)/ES&IoT-EC23631(B2)","OOSE-CS23631(B1)/ES&IoT-EC23631(B2)","TSA-AD23V46","ITAS-O23EC12","WT-CS23V57","ITAS-O23EC12","ES&IoT-EC23631"],
    Friday: ["OOSE-CS23631","ES&IoT-EC23631","ITAS-O23EC12","OOSE-CS23631(B2)/ES&IoT-EC23631(B1)","OOSE-CS23631(B2)/ES&IoT-EC23631(B1)","WT-CS23V57","TSA-AD23V46"],
  },
  "III_AIML": {
    Monday: ["WDA-O23EC21","OOSE-CS23631","Mini Project-AD23621","Mini Project-AD23621","IS-MX23612","Mini Project-AD23621","Mini Project-AD23621"],
    Tuesday: ["Mini Project-AD23621","Mini Project-AD23621","IS-MX23612","TSA-AD23V46","ES&IoT-EC23631","IS-MX23612","WT-CS23V57"],
    Wednesday: ["TSA-AD23V46","ES&IoT-EC23631","OOSE-CS23631","WT-CS23V57","ITAS-O23EC12","WDA-O23EC21","WDA-O23EC21"],
    Thursday: ["OOSE-CS23631(B2)/ES&IoT-EC23631(B1)","OOSE-CS23631(B2)/ES&IoT-EC23631(B1)","ITAS-O23EC12","ES&IoT-EC23631","TSA-AD23V46","OOSE-CS23631","WT-CS23V57"],
    Friday: ["ES&IoT-EC23631","WT-CS23V57","TSA-AD23V46","OOSE-CS23631(B1)/ES&IoT-EC23631(B2)","OOSE-CS23631(B1)/ES&IoT-EC23631(B2)","ITAS-O23EC12","OOSE-CS23631"],
  },
};

// Room assignments per class per day (which room the class occupies)
const CLASS_ROOMS = {
  "II_AIDS_A": { Monday: "B003", Tuesday: "B003", Wednesday: "A304", Thursday: "B203", Friday: "B203" },
  "II_AIDS_B": { Monday: "A302", Tuesday: "A302", Wednesday: "A302", Thursday: "A302", Friday: "A302" },
  "II_AIDS_C": { Monday: "A303", Tuesday: "A303", Wednesday: "A303", Thursday: "A303", Friday: "A303" },
  "II_AIDS_D": { Monday: "A304", Tuesday: "A304", Wednesday: "A304", Thursday: "A304", Friday: "A304" },
  "II_AIDS_E": { Monday: "A306", Tuesday: "A306", Wednesday: "A306", Thursday: "A306", Friday: "A306" },
  "II_AIDS_F": { Monday: "A301", Tuesday: "A301", Wednesday: "A301", Thursday: "A301", Friday: "A301" },
  "II_AIML_A": { Monday: "A307", Tuesday: "A307", Wednesday: "A307", Thursday: "A307", Friday: "A307" },
  "II_AIML_B": { Monday: "B002", Tuesday: "B002", Wednesday: "A303", Thursday: "B202", Friday: "B202" },
  "II_AIML_C": { Monday: "A308", Tuesday: "A308", Wednesday: "A308", Thursday: "A308", Friday: "A308" },
  "III_AIDS_A": { Monday: "B003", Tuesday: "B003", Wednesday: "B003", Thursday: "B003", Friday: "B003" },
  "III_AIDS_B": { Monday: "B004", Tuesday: "B004", Wednesday: "B004", Thursday: "B004", Friday: "B004" },
  "III_AIDS_C": { Monday: null, Tuesday: null, Wednesday: null, Thursday: null, Friday: null },
  "III_AIML": { Monday: "B002", Tuesday: "B002", Wednesday: "B002", Thursday: "B002", Friday: "B002" },
};

const FACULTY = {
  "II_AIDS_A": {
    "ESS-GE23411": "Dr.J.Raja Beryl", "P&S-MA23411": "Dr.R.Seethalakshmi", "DA-AD23411": "Mrs. Sandhiya Rajeshwari R",
    "ML-AL23411": "Mrs.M.Divya", "OS-CS23412": "Mrs. Chithralekha T", "DAA-CS23431": "Mrs. Muthukamatshi R",
    "DA-AD23421": "Mrs. Sandhiya Rajeshwari R", "ML-AL23421": "Mrs.M.Divya", "OS-CS23422": "Mrs. Chithralekha T"
  },
  "II_AIDS_B": {
    "ESS-GE23411": "Dr.J.Raja Beryl", "P&S-MA23411": "Dr.R.Ambrose Prabhu", "DA-AD23411": "Mrs.Rubina Begam",
    "ML-AL23411": "Mrs.K.Fouzia Sulthana", "OS-CS23412": "Mrs. Saranya S", "DAA-CS23431": "Mrs.Starlin M.A",
    "DA-AD23421": "Mrs.Rubina Begam", "ML-AL23421": "Mrs.K.Fouzia Sulthana", "OS-CS23422": "Mrs. Saranya S"
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getCurrentDayIndex() {
  const d = new Date().getDay();
  return d >= 1 && d <= 5 ? d - 1 : 0;
}

function getCurrentPeriod() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const t = h * 60 + m;
  if (t >= 480 && t < 530) return 1;
  if (t >= 530 && t < 580) return 2;
  if (t >= 580 && t < 610) return 0;
  if (t >= 610 && t < 660) return 3;
  if (t >= 660 && t < 710) return 4;
  if (t >= 710 && t < 760) return 5;
  if (t >= 760 && t < 810) return -1;
  if (t >= 810 && t < 855) return 6;
  if (t >= 855 && t < 900) return 7;
  return -2;
}

function parseSlot(slotStr) {
  if (!slotStr) return null;
  if (slotStr === "Mentoring" || slotStr === "Placement") {
    return { type: "special", label: slotStr };
  }
  if (slotStr.includes("(B1)/") || slotStr.includes("(B2)/")) {
    const parts = slotStr.split("/");
    return {
      type: "split",
      b1: parts[0].replace("(B1)", "").replace("(B2)", "").trim(),
      b2: parts[1].replace("(B1)", "").replace("(B2)", "").trim(),
    };
  }
  const match = slotStr.match(/^(.+?)-([A-Z0-9]+)$/);
  if (match) {
    return { type: "regular", short: match[1], code: match[2] };
  }
  return { type: "regular", short: slotStr, code: "" };
}

function getShortName(slotStr) {
  if (!slotStr) return "—";
  if (slotStr === "Mentoring" || slotStr === "Placement") return slotStr;
  return slotStr.split("-")[0];
}

function getRoomOccupancy(day, periodNum) {
  const occupied = {};
  Object.entries(CLASS_ROOMS).forEach(([classId, dayRooms]) => {
    const room = dayRooms[day];
    if (!room) return;
    const tt = TIMETABLE[classId];
    if (!tt || !tt[day]) return;
    const slot = tt[day][periodNum - 1];
    if (slot && slot !== "Placement") {
      if (!occupied[room]) occupied[room] = [];
      const cls = CLASSES.find(c => c.id === classId);
      occupied[room].push({ classId, className: cls?.name, slot });
    }
  });
  return occupied;
}

function getFreeRooms(day, periodNum) {
  const occupied = getRoomOccupancy(day, periodNum);
  return ROOMS.filter(r => !occupied[r]);
}

// ============================================
// STYLES
// ============================================

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --bg-primary: #0a0e1a;
  --bg-secondary: #111827;
  --bg-card: #1a2235;
  --bg-card-hover: #1e2a42;
  --bg-accent: #0d2847;
  --border: #1e3a5f;
  --border-light: #2a4a6f;
  --text-primary: #e8edf5;
  --text-secondary: #8b9dc3;
  --text-muted: #5a6f8f;
  --accent-cyan: #06d6a0;
  --accent-blue: #3b82f6;
  --accent-purple: #8b5cf6;
  --accent-orange: #f59e0b;
  --accent-pink: #ec4899;
  --accent-red: #ef4444;
  --free-green: #10b981;
  --occupied-red: #ef4444;
  --shadow: 0 4px 24px rgba(0,0,0,0.4);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body, #root {
  font-family: 'DM Sans', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
}

.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  padding: 0;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  transition: transform 0.3s ease;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid var(--border);
}

.sidebar-brand {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--accent-cyan);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}

.sidebar-nav { padding: 16px 12px; flex: 1; }

.nav-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  text-transform: uppercase;
  padding: 12px 12px 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.nav-item:hover { background: var(--bg-card); color: var(--text-primary); }
.nav-item.active { background: rgba(6,214,160,0.12); color: var(--accent-cyan); }
.nav-icon { font-size: 18px; width: 24px; text-align: center; }

.main-content {
  flex: 1;
  margin-left: 260px;
  padding: 24px 32px;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

.clock-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border);
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.clock-time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 20px;
  font-weight: 500;
  color: var(--accent-cyan);
}

.clock-day {
  font-size: 14px;
  color: var(--text-secondary);
}

.period-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(6,214,160,0.15);
  color: var(--accent-cyan);
  border: 1px solid rgba(6,214,160,0.3);
}

.period-badge.break { background: rgba(245,158,11,0.15); color: var(--accent-orange); border-color: rgba(245,158,11,0.3); }
.period-badge.off { background: rgba(139,92,246,0.15); color: var(--accent-purple); border-color: rgba(139,92,246,0.3); }

.select-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: end;
}

.select-group { display: flex; flex-direction: column; gap: 4px; }
.select-label { font-size: 11px; font-weight: 600; letter-spacing: 1px; color: var(--text-muted); text-transform: uppercase; }

.select-input {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 8px 14px;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  cursor: pointer;
  min-width: 200px;
  outline: none;
  transition: border-color 0.15s;
}

.select-input:focus { border-color: var(--accent-cyan); }
.select-input option { background: var(--bg-secondary); }

.timetable-grid {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
}

.timetable-grid th {
  background: var(--bg-accent);
  padding: 10px 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  text-transform: uppercase;
  border-bottom: 1px solid var(--border);
  text-align: center;
  white-space: nowrap;
}

.timetable-grid td {
  padding: 6px 4px;
  text-align: center;
  vertical-align: middle;
  border-bottom: 1px solid rgba(30,58,95,0.5);
  font-size: 12px;
}

.timetable-grid tr:last-child td { border-bottom: none; }

.tt-day-cell {
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-accent);
  text-align: left;
  padding-left: 14px !important;
  white-space: nowrap;
  font-size: 13px;
}

.slot-cell {
  padding: 6px 3px !important;
}

.slot-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  min-width: 50px;
  background: rgba(59,130,246,0.12);
  color: #60a5fa;
  border: 1px solid rgba(59,130,246,0.2);
  transition: all 0.15s;
  cursor: default;
}

.slot-chip.lab {
  background: rgba(139,92,246,0.12);
  color: #a78bfa;
  border-color: rgba(139,92,246,0.2);
}

.slot-chip.special {
  background: rgba(245,158,11,0.12);
  color: #fbbf24;
  border-color: rgba(245,158,11,0.2);
}

.slot-chip.current {
  background: rgba(6,214,160,0.2);
  color: #06d6a0;
  border-color: rgba(6,214,160,0.5);
  box-shadow: 0 0 12px rgba(6,214,160,0.2);
}

.slot-chip.empty {
  background: transparent;
  color: var(--text-muted);
  border: 1px dashed var(--border);
}

.slot-split {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.slot-split-label {
  font-size: 9px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.room-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  transition: all 0.2s;
}

.room-card.free {
  border-color: rgba(16,185,129,0.4);
  background: rgba(16,185,129,0.06);
}

.room-card.occupied {
  border-color: rgba(239,68,68,0.3);
  background: rgba(239,68,68,0.04);
}

.room-number {
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 6px;
}

.room-card.free .room-number { color: var(--free-green); }
.room-card.occupied .room-number { color: var(--occupied-red); }

.room-status {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.room-card.free .room-status { color: var(--free-green); }
.room-card.occupied .room-status { color: var(--text-muted); }

.room-class-info {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
  line-height: 1.3;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
}

.stat-value.green { color: var(--free-green); }
.stat-value.red { color: var(--occupied-red); }
.stat-value.blue { color: var(--accent-blue); }
.stat-value.purple { color: var(--accent-purple); }

.stat-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-top: 2px;
}

.day-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: var(--bg-card);
  border-radius: 10px;
  padding: 4px;
  border: 1px solid var(--border);
}

.day-tab {
  flex: 1;
  padding: 8px;
  text-align: center;
  border-radius: 7px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.15s;
  border: none;
  background: transparent;
}

.day-tab:hover { color: var(--text-primary); background: rgba(255,255,255,0.03); }
.day-tab.active { background: var(--accent-cyan); color: #0a0e1a; font-weight: 700; }

.period-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.period-tab {
  padding: 6px 14px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  background: var(--bg-card);
  transition: all 0.15s;
}

.period-tab:hover { border-color: var(--accent-cyan); color: var(--text-primary); }
.period-tab.active { background: var(--accent-cyan); color: #0a0e1a; border-color: var(--accent-cyan); font-weight: 700; }

.info-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.info-card-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 6px;
}

.info-card-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.mobile-toggle {
  display: none;
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 200;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 99;
}

.next-class-card {
  background: linear-gradient(135deg, rgba(6,214,160,0.1), rgba(59,130,246,0.1));
  border: 1px solid rgba(6,214,160,0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.next-class-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--accent-cyan);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.next-class-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.next-class-details {
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: 20px;
}

.login-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  text-align: center;
}

.login-brand {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 3px;
  color: var(--accent-cyan);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 6px;
}

.login-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 28px;
}

.role-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.role-card:hover { border-color: var(--accent-cyan); background: var(--bg-card-hover); }

.role-icon { font-size: 24px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; }
.role-card:nth-child(1) .role-icon { background: rgba(6,214,160,0.12); }
.role-card:nth-child(2) .role-icon { background: rgba(59,130,246,0.12); }
.role-card:nth-child(3) .role-icon { background: rgba(139,92,246,0.12); }
.role-card:nth-child(4) .role-icon { background: rgba(245,158,11,0.12); }

.role-name { font-size: 15px; font-weight: 600; }
.role-desc { font-size: 12px; color: var(--text-muted); }

.section-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 14px;
  color: var(--text-primary);
}

.table-scroll {
  overflow-x: auto;
  border-radius: 12px;
}

@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.open { transform: translateX(0); }
  .sidebar-overlay.show { display: block; }
  .mobile-toggle { display: flex; }
  .main-content { margin-left: 0; padding: 60px 16px 16px; }
  .room-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
  .stats-row { grid-template-columns: 1fr 1fr; }
  .clock-bar { flex-direction: column; align-items: flex-start; gap: 8px; }
}
`;

// ============================================
// COMPONENTS
// ============================================

function ClockBar() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dayIndex = getCurrentDayIndex();
  const currentPeriod = getCurrentPeriod();
  const dayName = DAYS[dayIndex] || "—";
  const timeStr = time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
  const dateStr = time.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

  let periodLabel = "";
  let badgeClass = "";
  if (currentPeriod === 0) { periodLabel = "Break"; badgeClass = "break"; }
  else if (currentPeriod === -1) { periodLabel = "Lunch"; badgeClass = "break"; }
  else if (currentPeriod === -2) { periodLabel = "Outside Hours"; badgeClass = "off"; }
  else {
    const p = PERIODS.find(pp => pp.num === currentPeriod);
    periodLabel = p ? `Period ${currentPeriod} (${p.label})` : "";
  }

  return (
    <div className="clock-bar">
      <span className="clock-time">{timeStr}</span>
      <span className="clock-day">{dateStr}</span>
      <span className={`period-badge ${badgeClass}`}>{periodLabel}</span>
    </div>
  );
}

function SlotChip({ slot, isCurrent }) {
  if (!slot) return <span className="slot-chip empty">—</span>;
  if (slot === "Mentoring" || slot === "Placement") {
    return <span className={`slot-chip special ${isCurrent ? "current" : ""}`}>{slot}</span>;
  }
  if (slot.includes("(B1)/") || slot.includes("(B2)/")) {
    const parts = slot.split("/");
    const b1 = getShortName(parts[0].replace("(B1)", "").replace("(B2)", ""));
    const b2 = getShortName(parts[1].replace("(B1)", "").replace("(B2)", ""));
    return (
      <div className="slot-split">
        <span className={`slot-chip lab ${isCurrent ? "current" : ""}`} style={{ fontSize: 10, padding: "3px 6px" }}>
          B1: {b1}
        </span>
        <span className={`slot-chip lab ${isCurrent ? "current" : ""}`} style={{ fontSize: 10, padding: "3px 6px" }}>
          B2: {b2}
        </span>
      </div>
    );
  }
  const short = getShortName(slot);
  const isLab = slot.includes("Lab") || slot.includes("23421") || slot.includes("23422");
  return <span className={`slot-chip ${isLab ? "lab" : ""} ${isCurrent ? "current" : ""}`}>{short}</span>;
}

// ============================================
// PAGES
// ============================================

function StudentView() {
  const [selectedClass, setSelectedClass] = useState("II_AIDS_A");
  const [selectedDay, setSelectedDay] = useState(DAYS[getCurrentDayIndex()]);
  const currentPeriod = getCurrentPeriod();
  const cls = CLASSES.find(c => c.id === selectedClass);
  const tt = TIMETABLE[selectedClass];
  const todaySlots = tt?.[selectedDay] || [];
  const room = CLASS_ROOMS[selectedClass]?.[selectedDay];

  // Find next class
  const nextSlotIndex = todaySlots.findIndex((s, i) => {
    const pNum = i + 1;
    return pNum >= currentPeriod && s && s !== "Placement";
  });
  const nextSlot = nextSlotIndex >= 0 ? todaySlots[nextSlotIndex] : null;
  const nextPeriod = nextSlotIndex >= 0 ? TEACHING_PERIODS[nextSlotIndex] : null;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Student Dashboard</div>
        <div className="page-subtitle">View your class schedule and room assignments</div>
      </div>
      <ClockBar />

      <div className="select-row">
        <div className="select-group">
          <span className="select-label">Select Class</span>
          <select className="select-input" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            {CLASSES.map(c => <option key={c.id} value={c.id}>{c.name} — Sem {c.sem}</option>)}
          </select>
        </div>
      </div>

      {cls && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Classroom</div>
            <div className="stat-value blue" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{room || "—"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Class Incharge</div>
            <div className="stat-value" style={{ fontSize: 16, fontFamily: "'DM Sans', sans-serif" }}>{cls.incharge}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Department</div>
            <div className="stat-value purple" style={{ fontSize: 18 }}>{cls.dept}</div>
          </div>
        </div>
      )}

      {nextSlot && currentPeriod > 0 && (
        <div className="next-class-card">
          <div className="next-class-label">
            {currentPeriod === (nextSlotIndex + 1) ? "▶ Current Class" : "↗ Next Class"}
          </div>
          <div className="next-class-name">{getShortName(nextSlot)}</div>
          <div className="next-class-details">
            <span>🕐 {nextPeriod?.label}</span>
            <span>🏫 Room: {room || "—"}</span>
            <span>📋 Period {nextSlotIndex + 1}</span>
          </div>
        </div>
      )}

      <div className="day-tabs">
        {DAYS.map(d => (
          <button key={d} className={`day-tab ${d === selectedDay ? "active" : ""}`} onClick={() => setSelectedDay(d)}>
            {d.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="section-title">{selectedDay}'s Schedule</div>
      <div className="table-scroll">
        <table className="timetable-grid">
          <thead>
            <tr>
              <th>Period</th>
              <th>Time</th>
              <th>Subject</th>
              <th>Room</th>
            </tr>
          </thead>
          <tbody>
            {TEACHING_PERIODS.map((p, i) => {
              const slot = todaySlots[i];
              const isCurrent = currentPeriod === p.num && selectedDay === DAYS[getCurrentDayIndex()];
              return (
                <tr key={p.num} style={isCurrent ? { background: "rgba(6,214,160,0.06)" } : {}}>
                  <td style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{p.num}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-muted)" }}>{p.label}</td>
                  <td className="slot-cell"><SlotChip slot={slot} isCurrent={isCurrent} /></td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--text-secondary)" }}>{room || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="section-title">Full Week View</div>
        <div className="table-scroll">
          <table className="timetable-grid">
            <thead>
              <tr>
                <th>Day</th>
                {TEACHING_PERIODS.map(p => <th key={p.num}>P{p.num}<br /><span style={{ fontWeight: 400, fontSize: 9 }}>{p.label}</span></th>)}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(d => (
                <tr key={d}>
                  <td className="tt-day-cell">{d.slice(0, 3)}</td>
                  {TEACHING_PERIODS.map((p, i) => {
                    const slot = tt?.[d]?.[i];
                    const isCurrent = currentPeriod === p.num && d === DAYS[getCurrentDayIndex()];
                    return <td key={p.num} className="slot-cell"><SlotChip slot={slot} isCurrent={isCurrent} /></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StaffView() {
  const allFaculty = useMemo(() => {
    const set = new Set();
    Object.values(FACULTY).forEach(cf => Object.values(cf).forEach(name => set.add(name)));
    // Also extract from class data
    CLASSES.forEach(c => { if (c.incharge) set.add(c.incharge); });
    return [...set].sort();
  }, []);

  const [selectedFaculty, setSelectedFaculty] = useState(allFaculty[0] || "");
  const [selectedDay, setSelectedDay] = useState(DAYS[getCurrentDayIndex()]);

  // Find this faculty's classes for the selected day
  const schedule = useMemo(() => {
    const result = [];
    Object.entries(TIMETABLE).forEach(([classId, days]) => {
      const slots = days[selectedDay];
      if (!slots) return;
      const cls = CLASSES.find(c => c.id === classId);
      const facultyMap = FACULTY[classId] || {};
      slots.forEach((slot, i) => {
        if (!slot) return;
        // Check if this faculty teaches this slot
        const matchKey = Object.keys(facultyMap).find(k => slot.includes(k));
        if (matchKey && facultyMap[matchKey] === selectedFaculty) {
          result.push({
            period: i + 1,
            time: TEACHING_PERIODS[i]?.label,
            className: cls?.name,
            slot,
            room: CLASS_ROOMS[classId]?.[selectedDay],
          });
        }
      });
    });
    return result.sort((a, b) => a.period - b.period);
  }, [selectedFaculty, selectedDay]);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Staff Dashboard</div>
        <div className="page-subtitle">View your teaching schedule and room assignments</div>
      </div>
      <ClockBar />

      <div className="select-row">
        <div className="select-group">
          <span className="select-label">Select Faculty</span>
          <select className="select-input" value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)}>
            {allFaculty.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div className="day-tabs">
        {DAYS.map(d => (
          <button key={d} className={`day-tab ${d === selectedDay ? "active" : ""}`} onClick={() => setSelectedDay(d)}>
            {d.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value blue">{schedule.length}</div>
          <div className="stat-label">Classes Today</div>
        </div>
      </div>

      {schedule.length === 0 ? (
        <div className="info-card">
          <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)" }}>
            No classes scheduled for {selectedDay}
          </div>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="timetable-grid">
            <thead>
              <tr>
                <th>Period</th>
                <th>Time</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Room</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((s, i) => {
                const isCurrent = getCurrentPeriod() === s.period && selectedDay === DAYS[getCurrentDayIndex()];
                return (
                  <tr key={i} style={isCurrent ? { background: "rgba(6,214,160,0.06)" } : {}}>
                    <td style={{ fontWeight: 600 }}>{s.period}</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{s.time}</td>
                    <td style={{ fontWeight: 600, color: "var(--accent-cyan)" }}>{s.className}</td>
                    <td className="slot-cell"><SlotChip slot={s.slot} isCurrent={isCurrent} /></td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{s.room || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FreeRoomsView() {
  const [selectedDay, setSelectedDay] = useState(DAYS[getCurrentDayIndex()]);
  const [selectedPeriod, setSelectedPeriod] = useState(Math.max(1, getCurrentPeriod()));

  const occupancy = useMemo(() => getRoomOccupancy(selectedDay, selectedPeriod), [selectedDay, selectedPeriod]);
  const freeRooms = useMemo(() => getFreeRooms(selectedDay, selectedPeriod), [selectedDay, selectedPeriod]);
  const occupiedRooms = ROOMS.filter(r => occupancy[r]);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Free Rooms</div>
        <div className="page-subtitle">Real-time classroom availability across all blocks</div>
      </div>
      <ClockBar />

      <div className="day-tabs">
        {DAYS.map(d => (
          <button key={d} className={`day-tab ${d === selectedDay ? "active" : ""}`} onClick={() => setSelectedDay(d)}>
            {d.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="period-tabs">
        {TEACHING_PERIODS.map(p => (
          <button key={p.num} className={`period-tab ${p.num === selectedPeriod ? "active" : ""}`} onClick={() => setSelectedPeriod(p.num)}>
            P{p.num} ({p.label})
          </button>
        ))}
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value green">{freeRooms.length}</div>
          <div className="stat-label">Free Rooms</div>
        </div>
        <div className="stat-card">
          <div className="stat-value red">{occupiedRooms.length}</div>
          <div className="stat-label">Occupied</div>
        </div>
        <div className="stat-card">
          <div className="stat-value blue">{ROOMS.length}</div>
          <div className="stat-label">Total Rooms</div>
        </div>
        <div className="stat-card">
          <div className="stat-value purple">{ROOMS.length > 0 ? Math.round((freeRooms.length / ROOMS.length) * 100) : 0}%</div>
          <div className="stat-label">Availability</div>
        </div>
      </div>

      <div className="section-title">All Rooms — {selectedDay}, Period {selectedPeriod}</div>
      <div className="room-grid">
        {ROOMS.map(room => {
          const occ = occupancy[room];
          const isFree = !occ;
          return (
            <div key={room} className={`room-card ${isFree ? "free" : "occupied"}`}>
              <div className="room-number">{room}</div>
              <div className="room-status">{isFree ? "Available" : "Occupied"}</div>
              {occ && occ.map((o, i) => (
                <div key={i} className="room-class-info">
                  {o.className}<br />{getShortName(o.slot)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminView() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Admin Panel</div>
        <div className="page-subtitle">Manage timetables, rooms, and allocations</div>
      </div>

      <div className="day-tabs" style={{ marginBottom: 24 }}>
        {[
          { key: "overview", label: "Overview" },
          { key: "classes", label: "Classes" },
          { key: "rooms", label: "Rooms" },
          { key: "upload", label: "Upload PDF" },
        ].map(tab => (
          <button key={tab.key} className={`day-tab ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div>
          <div className="stats-row">
            <div className="stat-card"><div className="stat-value blue">{CLASSES.length}</div><div className="stat-label">Total Sections</div></div>
            <div className="stat-card"><div className="stat-value green">{ROOMS.length}</div><div className="stat-label">Total Rooms</div></div>
            <div className="stat-card"><div className="stat-value purple">{Object.keys(COURSES).length}</div><div className="stat-label">Courses</div></div>
            <div className="stat-card"><div className="stat-value" style={{ color: "var(--accent-orange)" }}>2</div><div className="stat-label">Departments</div></div>
          </div>
          <div className="section-title">Registered Sections</div>
          <div className="table-scroll">
            <table className="timetable-grid">
              <thead><tr><th>Section</th><th>Year</th><th>Dept</th><th>Sem</th><th>Venue</th><th>Incharge</th></tr></thead>
              <tbody>
                {CLASSES.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: "var(--accent-cyan)" }}>{c.name}</td>
                    <td>{c.year}</td>
                    <td>{c.dept}</td>
                    <td>{c.sem}</td>
                    <td style={{ fontSize: 11, maxWidth: 200, whiteSpace: "normal" }}>{c.venue}</td>
                    <td style={{ fontSize: 12 }}>{c.incharge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "classes" && (
        <div>
          <div className="section-title">All Timetable Data</div>
          {CLASSES.map(cls => (
            <div key={cls.id} style={{ marginBottom: 32 }}>
              <div className="info-card">
                <div className="info-card-title">{cls.name} — Semester {cls.sem}</div>
                <div className="info-card-value">{cls.venue}</div>
              </div>
              <div className="table-scroll">
                <table className="timetable-grid">
                  <thead>
                    <tr>
                      <th>Day</th>
                      {TEACHING_PERIODS.map(p => <th key={p.num}>P{p.num}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(d => (
                      <tr key={d}>
                        <td className="tt-day-cell">{d.slice(0, 3)}</td>
                        {TEACHING_PERIODS.map((p, i) => {
                          const slot = TIMETABLE[cls.id]?.[d]?.[i];
                          return <td key={p.num} className="slot-cell"><SlotChip slot={slot} /></td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "rooms" && (
        <div>
          <div className="section-title">Room Inventory</div>
          <div className="room-grid">
            {ROOMS.map(r => {
              const isLab = r === "A102" || r === "A103";
              return (
                <div key={r} className="room-card" style={{ borderColor: isLab ? "rgba(139,92,246,0.4)" : "var(--border)" }}>
                  <div className="room-number" style={{ color: isLab ? "var(--accent-purple)" : "var(--accent-blue)" }}>{r}</div>
                  <div className="room-status" style={{ color: isLab ? "var(--accent-purple)" : "var(--text-muted)" }}>
                    {isLab ? "Lab" : "Classroom"}
                  </div>
                  <div className="room-class-info">Block {r[0]}, Floor {r[1]}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "upload" && (
        <div>
          <div className="info-card" style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
            <div className="info-card-title" style={{ fontSize: 14 }}>PDF Timetable Upload</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
              Upload your department timetable PDF. The system will parse and extract class schedules, room assignments, and faculty data automatically.
            </div>
            <div style={{
              border: "2px dashed var(--border)",
              borderRadius: 12,
              padding: "40px 20px",
              cursor: "pointer",
              transition: "all 0.15s",
              maxWidth: 400,
              margin: "0 auto",
            }}>
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
                Drag & drop PDF here or click to browse
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                Supports the RIT timetable format
              </div>
            </div>
            <div style={{ marginTop: 16, padding: "10px 16px", background: "rgba(245,158,11,0.1)", borderRadius: 8, display: "inline-block" }}>
              <span style={{ fontSize: 12, color: "var(--accent-orange)" }}>
                ⚠ Connect to Supabase backend to enable PDF upload
              </span>
            </div>
          </div>
          <div className="info-card" style={{ marginTop: 16 }}>
            <div className="info-card-title">Manual Entry</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              Alternatively, timetable data can be entered manually through the admin interface once connected to the Supabase backend.
              The current demo is pre-loaded with data from the uploaded PDF covering all AI&DS (A-F) and AI&ML (A-C) sections for Year 2 (Sem IV) and Year 3 (Sem VI).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoginScreen({ onLogin, onAuth }) {
  const [authMode, setAuthMode] = useState(null); // null = role select, 'login', 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data?.user) onAuth(data.user);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: selectedRole } }
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data?.user) {
      // Create profile
      await supabase.from("profiles").upsert({
        id: data.user.id,
        role: selectedRole,
        full_name: fullName,
      });
      setSuccess("Account created! Check your email to confirm, or sign in now.");
      setAuthMode("login");
    }
  };

  if (authMode === "login" || authMode === "signup") {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-brand">Rajalakshmi Institute of Technology</div>
          <div className="login-title">{authMode === "login" ? "Sign In" : "Create Account"}</div>
          <div className="login-subtitle">
            {authMode === "login" ? "Welcome back!" : "Join the classroom allocator"}
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, marginBottom: 16, fontSize: 13, color: "#f87171" }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: "10px 14px", background: "rgba(6,214,160,0.12)", border: "1px solid rgba(6,214,160,0.3)", borderRadius: 8, marginBottom: 16, fontSize: 13, color: "#06d6a0" }}>
              {success}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
            {authMode === "signup" && (
              <div className="select-group">
                <span className="select-label">Full Name</span>
                <input
                  className="select-input"
                  type="text"
                  placeholder="Enter your name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
            )}

            <div className="select-group">
              <span className="select-label">Email</span>
              <input
                className="select-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div className="select-group">
              <span className="select-label">Password</span>
              <input
                className="select-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            {authMode === "signup" && (
              <div className="select-group">
                <span className="select-label">Role</span>
                <select className="select-input" value={selectedRole} onChange={e => setSelectedRole(e.target.value)} style={{ width: "100%" }}>
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <button
              onClick={authMode === "login" ? handleLogin : handleSignup}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--accent-cyan)",
                color: "#0a0e1a",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                opacity: loading ? 0.6 : 1,
                marginTop: 4,
              }}
            >
              {loading ? "Please wait..." : authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </div>

          <div style={{ marginTop: 16, fontSize: 13, color: "var(--text-secondary)" }}>
            {authMode === "login" ? (
              <>Don't have an account?{" "}
                <span onClick={() => { setAuthMode("signup"); setError(""); }} style={{ color: "var(--accent-cyan)", cursor: "pointer" }}>Sign up</span>
              </>
            ) : (
              <>Already have an account?{" "}
                <span onClick={() => { setAuthMode("login"); setError(""); }} style={{ color: "var(--accent-cyan)", cursor: "pointer" }}>Sign in</span>
              </>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <span onClick={() => setAuthMode(null)} style={{ fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }}>
              ← Back to quick access
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-brand">Rajalakshmi Institute of Technology</div>
        <div className="login-title">ClassRoom Allocator</div>
        <div className="login-subtitle">Smart classroom management for AI&DS and AI&ML departments</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setAuthMode("login")}
              style={{
                flex: 1, padding: "10px", background: "rgba(6,214,160,0.12)", border: "1px solid rgba(6,214,160,0.3)",
                borderRadius: 8, color: "var(--accent-cyan)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode("signup")}
              style={{
                flex: 1, padding: "10px", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)",
                borderRadius: 8, color: "#60a5fa", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
              }}
            >
              Sign Up
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, textAlign: "center" }}>
            Sign in for personalized experience, or browse as guest below
          </div>
        </div>

        <div className="nav-label" style={{ textAlign: "center", marginBottom: 8 }}>Quick Access (Guest)</div>
        <div className="role-cards">
          <div className="role-card" onClick={() => onLogin("student")}>
            <div className="role-icon">🎓</div>
            <div><div className="role-name">Student</div><div className="role-desc">View your schedule & rooms</div></div>
          </div>
          <div className="role-card" onClick={() => onLogin("staff")}>
            <div className="role-icon">👨‍🏫</div>
            <div><div className="role-name">Staff</div><div className="role-desc">View teaching schedule</div></div>
          </div>
          <div className="role-card" onClick={() => onLogin("free")}>
            <div className="role-icon">🏫</div>
            <div><div className="role-name">Free Rooms</div><div className="role-desc">Check room availability</div></div>
          </div>
          <div className="role-card" onClick={() => onLogin("admin")}>
            <div className="role-icon">⚙️</div>
            <div><div className="role-name">Admin</div><div className="role-desc">Manage timetables & rooms</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================

export default function App() {
  const [page, setPage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user || null;
      setUser(u);
      if (u) fetchProfile(u.id);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user || null;
      setUser(u);
      if (u) fetchProfile(u.id);
      else { setProfile(null); setPage(null); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) {
      setProfile(data);
      // Auto-navigate based on role
      if (!page) {
        if (data.role === "student") setPage("student");
        else if (data.role === "staff") setPage("staff");
        else if (data.role === "admin") setPage("admin");
      }
    }
  };

  const handleAuth = (u) => {
    setUser(u);
    fetchProfile(u.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setPage(null);
  };

  if (authLoading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="login-container">
          <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏫</div>
            <div>Loading...</div>
          </div>
        </div>
      </>
    );
  }

  if (!page) return <><style>{CSS}</style><LoginScreen onLogin={setPage} onAuth={handleAuth} /></>;

  const navItems = [
    { key: "student", icon: "🎓", label: "Student" },
    { key: "staff", icon: "👨‍🏫", label: "Staff" },
    { key: "free", icon: "🏫", label: "Free Rooms" },
    { key: "admin", icon: "⚙️", label: "Admin" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="app-container">
        <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        <div className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />

        <nav className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <div className="sidebar-brand">RIT Chennai</div>
            <div className="sidebar-title">ClassRoom<br />Allocator</div>
          </div>
          <div className="sidebar-nav">
            {user && (
              <div style={{ padding: "8px 14px", marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-cyan)" }}>
                  {profile?.full_name || user.email}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>
                  {profile?.role || "guest"}
                </div>
              </div>
            )}
            <div className="nav-label">Navigation</div>
            {navItems.map(item => (
              <div
                key={item.key}
                className={`nav-item ${page === item.key ? "active" : ""}`}
                onClick={() => { setPage(item.key); setSidebarOpen(false); }}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
            <div style={{ marginTop: "auto", padding: "16px 0" }}>
              <div className="nav-item" onClick={user ? handleLogout : () => setPage(null)} style={{ color: "var(--accent-red)" }}>
                <span className="nav-icon">↩</span>
                {user ? "Sign Out" : "Back"}
              </div>
            </div>
          </div>
        </nav>

        <main className="main-content">
          {page === "student" && <StudentView />}
          {page === "staff" && <StaffView />}
          {page === "free" && <FreeRoomsView />}
          {page === "admin" && <AdminView />}
        </main>
      </div>
    </>
  );
}
