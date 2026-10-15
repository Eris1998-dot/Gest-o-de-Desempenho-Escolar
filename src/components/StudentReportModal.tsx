import { useState, useMemo } from 'react';
import type { Classroom } from '../types';
import { generateStudentPDF, StudentPerformanceData } from '../pdfGenerator';

interface StudentReportModalProps {
  classrooms: Classroom[];
  onClose: () => void;
}

export function StudentReportModal({ classrooms, onClose }: StudentReportModalProps) {
  const [searchName, setSearchName] = useState('');
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(null);

  // Buscar alunos que correspondem ao nome digitado
  const searchResults = useMemo(() => {
    if (!searchName.trim()) return [];
    const query = searchName.toLowerCase().trim();
    const results: { name: string; classroomId: number; classroomName: string; year: string; subject: string }[] = [];
    const seen = new Set<string>();

    classrooms.forEach(classroom => {
      classroom.records.forEach(record => {
        record.students.forEach(student => {
          if (student.name.toLowerCase().includes(query)) {
            const key = `${student.name}-${classroom.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({
                name: student.name,
                classroomId: classroom.id,
                classroomName: classroom.name,
                year: classroom.year,
                subject: classroom.subject,
              });
            }
          }
        });
      });
    });

    return results;
  }, [searchName, classrooms]);

  // Dados de desempenho do aluno selecionado
  const studentData = useMemo((): StudentPerformanceData | null => {
    if (!selectedStudentName || !selectedClassroomId) return null;
    const classroom = classrooms.find(c => c.id === selectedClassroomId);
    if (!classroom) return null;

    const records: StudentPerformanceData['records'] = [];
    const contents = new Set<string>();
    const skills = new Set<string>();
    const periods = new Set<string>();
    const evolution: { activity: string; percentage: number; grade: number }[] = [];
    let totalCorrect = 0;
    let totalQuestions = 0;
    const grades: number[] = [];
    const percentages: number[] = [];

    classroom.records.forEach((record) => {
      const student = record.students.find((s) => s.name === selectedStudentName);
      if (student) {
        const percentage = (student.correctAnswers / record.totalQuestions) * 100;
        const grade = (student.correctAnswers / record.totalQuestions) * record.totalPoints;
        records.push({ record, student, grade, percentage });
        grades.push(grade);
        percentages.push(percentage);
        totalCorrect += student.correctAnswers;
        totalQuestions += record.totalQuestions;
        if (record.content) contents.add(record.content);
        if (record.skill) skills.add(record.skill);
        periods.add(record.period);
        evolution.push({
          activity: record.activityName,
          percentage,
          grade,
        });
      }
    });

    if (records.length === 0) return null;

    const avgGrade = grades.reduce((a, b) => a + b, 0) / grades.length;
    const avgPct = percentages.reduce((a, b) => a + b, 0) / percentages.length;

    return {
      studentName: selectedStudentName,
      classroom,
      records,
      stats: {
        totalActivities: records.length,
        averageGrade: Math.round(avgGrade * 100) / 100,
        averagePercentage: Math.round(avgPct * 10) / 10,
        maxGrade: Math.max(...grades),
        minGrade: Math.min(...grades),
        totalCorrect,
        totalQuestions,
        contents: Array.from(contents),
        skills: Array.from(skills),
        periods: Array.from(periods),
        evolution,
      },
    };
  }, [selectedStudentName, selectedClassroomId, classrooms]);

  const handleSelectStudent = (name: string, classroomId: number) => {
    setSelectedStudentName(name);
    setSelectedClassroomId(classroomId);
    setSearchName(name);
  };

  const handleGeneratePDF = () => {
    if (studentData) {
      generateStudentPDF(studentData);
    }
  };

  const getGradeColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-400';
    if (pct >= 60) return 'text-yellow-400';
    if (pct >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getBarColor = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-yellow-500';
    if (pct >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <i className="fas fa-user-graduate text-white"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Relatório do Aluno</h2>
              <p className="text-sm text-purple-300">Busque e visualize o desempenho individual</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition p-2"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Busca */}
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              <i className="fas fa-search mr-2"></i>
              Digite o nome do aluno
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchName}
                onChange={e => {
                  setSearchName(e.target.value);
                  if (!e.target.value) {
                    setSelectedStudentName(null);
                    setSelectedClassroomId(null);
                  }
                }}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ex: João Silva"
                autoFocus
              />
              {searchName && (
                <button
                  onClick={() => {
                    setSearchName('');
                    setSelectedStudentName(null);
                    setSelectedClassroomId(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {/* Resultados da busca */}
            {searchResults.length > 0 && !selectedStudentName && (
              <div className="mt-2 bg-white/5 border border-white/10 rounded-xl max-h-60 overflow-y-auto">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectStudent(result.name, result.classroomId)}
                    className="w-full text-left px-4 py-3 hover:bg-white/10 transition border-b border-white/5 last:border-0"
                  >
                    <p className="text-white font-medium">{result.name}</p>
                    <p className="text-xs text-purple-300">
                      {result.classroomName} ({result.year}) • {result.subject}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {searchName.trim() && searchResults.length === 0 && !selectedStudentName && (
              <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-xl text-center">
                <p className="text-sm text-purple-300">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  Nenhum aluno encontrado com esse nome
                </p>
              </div>
            )}
          </div>

          {/* Relatório do aluno */}
          {studentData && (
            <>
              {/* Card de resumo */}
              <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/30 rounded-xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{studentData.studentName}</h3>
                    <p className="text-purple-200 mt-1">
                      {studentData.classroom.name} ({studentData.classroom.year}) • {studentData.classroom.subject}
                    </p>
                    <p className="text-sm text-purple-300 mt-1">
                      Prof. {studentData.classroom.teacher}
                    </p>
                  </div>
                  <button
                    onClick={handleGeneratePDF}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                  >
                    <i className="fas fa-file-pdf"></i>
                    Gerar PDF
                  </button>
                </div>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <i className="fas fa-clipboard-list text-purple-400 mb-2"></i>
                  <p className="text-xs text-purple-300 uppercase">Atividades</p>
                  <p className="text-2xl font-bold text-white">{studentData.stats.totalActivities}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <i className="fas fa-chart-line text-blue-400 mb-2"></i>
                  <p className="text-xs text-purple-300 uppercase">Média</p>
                  <p className="text-2xl font-bold text-white">{studentData.stats.averageGrade}</p>
                  <p className={`text-xs ${getGradeColor(studentData.stats.averagePercentage)}`}>
                    {studentData.stats.averagePercentage.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <i className="fas fa-arrow-up text-emerald-400 mb-2"></i>
                  <p className="text-xs text-purple-300 uppercase">Maior Nota</p>
                  <p className="text-2xl font-bold text-emerald-400">{studentData.stats.maxGrade.toFixed(2)}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <i className="fas fa-arrow-down text-red-400 mb-2"></i>
                  <p className="text-xs text-purple-300 uppercase">Menor Nota</p>
                  <p className="text-2xl font-bold text-red-400">{studentData.stats.minGrade.toFixed(2)}</p>
                </div>
              </div>

              {/* Evolução visual */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <i className="fas fa-chart-bar text-yellow-400"></i>
                  Evolução do Rendimento
                </h4>
                <div className="space-y-2">
                  {studentData.stats.evolution.map((item: { activity: string; percentage: number; grade: number }, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-xs text-purple-300 w-32 truncate text-right" title={item.activity}>
                        {item.activity}
                      </span>
                      <div className="flex-1 bg-white/10 rounded-full h-6 relative overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${getBarColor(item.percentage)}`}
                          style={{ width: `${Math.max(item.percentage, 5)}%` }}
                        >
                          <span className="text-xs font-bold text-white drop-shadow">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs font-bold w-12 text-right ${getGradeColor(item.percentage)}`}>
                        {item.grade.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabela de atividades */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <i className="fas fa-list text-purple-400"></i>
                    Histórico Detalhado
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="text-left py-2 px-3 text-xs text-purple-300 font-medium">#</th>
                        <th className="text-left py-2 px-3 text-xs text-purple-300 font-medium">Atividade</th>
                        <th className="text-left py-2 px-3 text-xs text-purple-300 font-medium">Período</th>
                        <th className="text-center py-2 px-3 text-xs text-purple-300 font-medium">Acertos</th>
                        <th className="text-center py-2 px-3 text-xs text-purple-300 font-medium">Rendimento</th>
                        <th className="text-center py-2 px-3 text-xs text-purple-300 font-medium">Nota</th>
                        <th className="text-center py-2 px-3 text-xs text-purple-300 font-medium">Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentData.records.map((r: StudentPerformanceData['records'][0], idx: number) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="py-2 px-3 text-sm text-purple-400">{idx + 1}</td>
                          <td className="py-2 px-3 text-sm text-white font-medium">{r.record.activityName}</td>
                          <td className="py-2 px-3 text-sm text-purple-300">{periodLabels[r.record.period] || r.record.period}</td>
                          <td className="py-2 px-3 text-sm text-center text-purple-200 font-mono">
                            {r.student.correctAnswers}/{r.record.totalQuestions}
                          </td>
                          <td className="py-2 px-3 text-sm text-center">
                            <span className={`font-bold ${getGradeColor(r.percentage)}`}>
                              {r.percentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-sm font-bold ${getGradeColor(r.percentage)} bg-white/5`}>
                              {r.grade.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded border ${r.percentage >= 60 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                              {r.percentage >= 60 ? 'Aprovado' : 'Reprovado'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Conteúdos e habilidades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentData.stats.contents.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <i className="fas fa-book text-blue-400"></i>
                      Conteúdos Trabalhados
                    </h4>
                    <ul className="space-y-1.5">
                      {studentData.stats.contents.map((content: string, idx: number) => (
                        <li key={idx} className="text-sm text-purple-200 flex items-start gap-2">
                          <i className="fas fa-check text-emerald-400 text-xs mt-1"></i>
                          {content}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {studentData.stats.skills.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <i className="fas fa-bullseye text-pink-400"></i>
                      Habilidades Trabalhadas
                    </h4>
                    <ul className="space-y-1.5">
                      {studentData.stats.skills.map((skill: string, idx: number) => (
                        <li key={idx} className="text-sm text-purple-200 flex items-start gap-2">
                          <i className="fas fa-star text-yellow-400 text-xs mt-1"></i>
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Análise */}
              <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                  <i className="fas fa-lightbulb"></i>
                  Análise Geral
                </h4>
                <p className="text-sm text-emerald-100">
                  {studentData.stats.averagePercentage >= 80 && (
                    <>O aluno demonstrou excelente desempenho, com rendimento médio de {studentData.stats.averagePercentage.toFixed(1)}%. Apresenta domínio consistente dos conteúdos trabalhados.</>
                  )}
                  {studentData.stats.averagePercentage >= 60 && studentData.stats.averagePercentage < 80 && (
                    <>O aluno apresentou bom desempenho, com rendimento médio de {studentData.stats.averagePercentage.toFixed(1)}%. Demonstra compreensão adequada dos conteúdos, com possibilidade de aprimoramento.</>
                  )}
                  {studentData.stats.averagePercentage >= 40 && studentData.stats.averagePercentage < 60 && (
                    <>O aluno apresenta rendimento médio de {studentData.stats.averagePercentage.toFixed(1)}%, indicando necessidade de reforço em alguns conteúdos. Recomenda-se acompanhamento individualizado.</>
                  )}
                  {studentData.stats.averagePercentage < 40 && (
                    <>O aluno apresenta rendimento médio de {studentData.stats.averagePercentage.toFixed(1)}%, demonstrando dificuldades significativas. É necessário intervenção pedagógica e plano de recuperação.</>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const periodLabels: Record<string, string> = {
  '1_trimestre': '1º Trimestre',
  '2_trimestre': '2º Trimestre',
  '3_trimestre': '3º Trimestre',
  '1_bimestre': '1º Bimestre',
  '2_bimestre': '2º Bimestre',
  '3_bimestre': '3º Bimestre',
  '4_bimestre': '4º Bimestre',
  'anual': 'Anual',
};
