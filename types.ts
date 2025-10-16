

export interface ScheduleEntry {
  day: number;
  time: string;
  duration: number;
}

export interface Subject {
  id: string;
  created_at: string;
  name: string;
  term: 'semestre' | 'cuatrimestre';
  schedule?: ScheduleEntry[] | null;
  grading_periods_dates?: { [key: string]: string } | null;
}

export interface Student {
  id: string;
  created_at: string;
  name: string;
  subject_id: string;
}

export interface AttendanceSession {
  id: string;
  created_at: string;
  subject_id: string;
}

export interface AttendanceRecord {
    id: number;
    created_at: string;
    student_id: string;
    session_id: string;
    subject_id: string; // Added for easier filtering
    students: { name: string } | null;
}

export interface EvaluationCriterion {
  id: string;
  created_at: string;
  subject_id: string;
  name: string;
  percentage: number;
  assignment_limit: 'single' | 'multiple';
  type: 'default' | 'attendance' | 'participation';
  max_points?: number | null;
  grading_period?: number | null;
}

export interface Assignment {
  id: string;
  created_at: string;
  subject_id: string;
  name: string;
  evaluation_criterion_id: string;
}

export interface Grade {
  id: string;
  created_at: string;
  student_id: string;
  assignment_id: string;
  score: number;
}

export interface Participation {
  id: string;
  created_at: string;
  student_id: string;
  subject_id: string;
  points: number;
  date: string; // YYYY-MM-DD
}

export interface PlannedClass {
  id: string;
  created_at: string;
  subject_id: string;
  class_date: string; // YYYY-MM-DD
  title: string;
  description: string | null;
  status: 'planned' | 'completed' | 'cancelled';
}
