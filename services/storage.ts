
import { LearningSession, SessionProgress, UserSettings, ResourceItem, TestResult, SemesterData, AttendanceSubject, Assignment, StudentPortfolio } from '../types';

const SESSIONS_KEY = 'engimind_sessions_v1';
const SETTINGS_KEY = 'engimind_settings_v1';
const RESOURCES_KEY = 'engimind_resources_v1';
const TEST_KEY = 'engimind_tests_v1';
const GRADES_KEY = 'engimind_grades_v1';
const ATTENDANCE_KEY = 'engimind_attendance_v1';
const ASSIGNMENTS_KEY = 'engimind_assignments_v1';
const PORTFOLIO_KEY = 'engimind_portfolio_v1';

// Sessions
export const getSessions = (): LearningSession[] => {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveSession = (session: LearningSession) => {
  const sessions = getSessions();
  const updated = [session, ...sessions];
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
};

export const updateSessionProgress = (id: string, progress: Partial<SessionProgress>) => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index !== -1) {
    sessions[index].progress = { ...sessions[index].progress, ...progress };
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
};

export const deleteSession = (id: string) => {
    const sessions = getSessions();
    const updated = sessions.filter(s => s.id !== id);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
};

// Settings
export const getSettings = (): UserSettings => {
  const defaults: UserSettings = { 
      theme: 'light', 
      accentColor: 'blue', 
      name: 'Student', 
      major: 'CSE',
      year: '1st',
      semester: '1',
      college: 'Engineering College',
      attendanceThreshold: 75
  };
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? { ...defaults, ...JSON.parse(data) } : defaults;
  } catch (e) { return defaults; }
};

export const saveSettings = (settings: UserSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// Resources
export const getResources = (): ResourceItem[] => {
  try {
    const data = localStorage.getItem(RESOURCES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveResource = (item: ResourceItem) => {
  const items = getResources();
  localStorage.setItem(RESOURCES_KEY, JSON.stringify([item, ...items]));
};

export const deleteResource = (id: string) => {
  const items = getResources();
  localStorage.setItem(RESOURCES_KEY, JSON.stringify(items.filter(i => i.id !== id)));
};

// Test Results
export const getTestResults = (): TestResult[] => {
    try {
        const data = localStorage.getItem(TEST_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
};

export const saveTestResult = (result: TestResult) => {
    const items = getTestResults();
    localStorage.setItem(TEST_KEY, JSON.stringify([result, ...items]));
};

// Grades
export const getGrades = (): SemesterData[] => {
  try {
    const data = localStorage.getItem(GRADES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveSemesterData = (data: SemesterData) => {
  const all = getGrades();
  const index = all.findIndex(s => s.semester === data.semester);
  if (index !== -1) {
    all[index] = data;
  } else {
    all.push(data);
  }
  localStorage.setItem(GRADES_KEY, JSON.stringify(all));
};

// Portfolio
export const getPortfolio = (): StudentPortfolio => {
    try {
        const data = localStorage.getItem(PORTFOLIO_KEY);
        return data ? JSON.parse(data) : { internships: [], achievements: [], clubs: [] };
    } catch (e) { return { internships: [], achievements: [], clubs: [] }; }
};

export const savePortfolio = (data: StudentPortfolio) => {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(data));
};

// Attendance
export const getAttendance = (): AttendanceSubject[] => {
  try {
    const data = localStorage.getItem(ATTENDANCE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveAttendance = (data: AttendanceSubject[]) => {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(data));
};

// Assignments
export const getAssignments = (): Assignment[] => {
  try {
    const data = localStorage.getItem(ASSIGNMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveAssignment = (assignment: Assignment) => {
  const items = getAssignments();
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify([assignment, ...items]));
};

export const updateAssignment = (id: string, updates: Partial<Assignment>) => {
  const items = getAssignments();
  const updated = items.map(i => i.id === id ? { ...i, ...updates } : i);
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(updated));
};

export const deleteAssignment = (id: string) => {
  const items = getAssignments();
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(items.filter(i => i.id !== id)));
};
