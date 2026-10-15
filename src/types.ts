export interface Student {
  id: number;
  name: string;
  correctAnswers: number;
}

export interface ActivityRecord {
  id: number;
  period: '1_trimestre' | '2_trimestre' | '3_trimestre' | '1_bimestre' | '2_bimestre' | '3_bimestre' | '4_bimestre' | 'anual';
  activityName: string;
  totalPoints: number;
  totalQuestions: number;
  content: string;
  skill: string;
  students: Student[];
  createdAt: string;
}

export interface Classroom {
  id: number;
  name: string;
  year: string;
  teacher: string;
  subject: string;
  school: string;
  records: ActivityRecord[];
}

export type PeriodFilter = 'all' | '1_trimestre' | '2_trimestre' | '3_trimestre' | '1_bimestre' | '2_bimestre' | '3_bimestre' | '4_bimestre' | 'anual';

export type PeriodLabel = {
  [key in PeriodFilter]: string;
};
