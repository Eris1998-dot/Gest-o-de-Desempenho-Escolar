import { useState, useMemo } from 'react';
import type { Classroom, ActivityRecord, Student, PeriodFilter } from './types';
import { generateClassroomPDF } from './pdfGenerator';

const periodLabels: Record<string, string> = {
  'all': 'Todos os Períodos',
  '1_trimestre': '1º Trimestre',
  '2_trimestre': '2º Trimestre',
  '3_trimestre': '3º Trimestre',
  '1_bimestre': '1º Bimestre',
  '2_bimestre': '2º Bimestre',
  '3_bimestre': '3º Bimestre',
  '4_bimestre': '4º Bimestre',
  'anual': 'Anual',
};

function App() {
  // Classrooms state
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(null);
  const [showClassroomForm, setShowClassroomForm] = useState(false);
  const [classroomForm, setClassroomForm] = useState({
    name: '',
    year: '',
    teacher: '',
    subject: '',
    school: '',
  });

  // Activity state
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({
    activityName: '',
    period: '1_trimestre' as ActivityRecord['period'],
    totalPoints: '3',
    totalQuestions: '10',
    content: '',
    skill: '',
  });
  const [bulkInput, setBulkInput] = useState('');

  // Filter
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');

  // Derived
  const selectedClassroom = classrooms.find(c => c.id === selectedClassroomId) || null;

  const filteredRecords = useMemo(() => {
    if (!selectedClassroom) return [];
    if (periodFilter === 'all') return selectedClassroom.records;
    return selectedClassroom.records.filter(r => r.period === periodFilter);
  }, [selectedClassroom, periodFilter]);

  const allStudentsForPeriod = useMemo(() => {
    if (!selectedClassroom || filteredRecords.length === 0) return [];
    const studentMap = new Map<string, { name: string; totalGrade: number; totalMax: number; totalAnswers: number; totalQuestions: number; count: number }>();

    filteredRecords.forEach(record => {
      record.students.forEach(student => {
        const existing = studentMap.get(student.name);
        const grade = (student.correctAnswers / record.totalQuestions) * record.totalPoints;
        const percentage = (student.correctAnswers / record.totalQuestions) * 100;
        if (existing) {
          existing.totalGrade += grade;
          existing.totalMax += record.totalPoints;
          existing.totalAnswers += student.correctAnswers;
          existing.totalQuestions += record.totalQuestions;
          existing.count += 1;
        } else {
          studentMap.set(student.name, {
            name: student.name,
            totalGrade: grade,
            totalMax: record.totalPoints,
            totalAnswers: student.correctAnswers,
            totalQuestions: record.totalQuestions,
            count: 1,
          });
        }
      });
    });

    return Array.from(studentMap.values()).map(s => ({
      name: s.name,
      averageGrade: Math.round((s.totalGrade / s.count) * 100) / 100,
      averagePercentage: Math.round((s.totalAnswers / s.totalQuestions * 100) * 100) / 100,
      totalActivities: s.count,
    }));
  }, [filteredRecords]);

  // Classroom CRUD
  const handleCreateClassroom = () => {
    if (!classroomForm.name.trim()) return;
    const newClassroom: Classroom = {
      id: Date.now(),
      name: classroomForm.name,
      year: classroomForm.year,
      teacher: classroomForm.teacher,
      subject: classroomForm.subject,
      school: classroomForm.school,
      records: [],
    };
    setClassrooms([...classrooms, newClassroom]);
    setSelectedClassroomId(newClassroom.id);
    setClassroomForm({ name: '', year: '', teacher: '', subject: '', school: '' });
    setShowClassroomForm(false);
  };

  const handleDeleteClassroom = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta turma?')) {
      setClassrooms(classrooms.filter(c => c.id !== id));
      if (selectedClassroomId === id) setSelectedClassroomId(null);
    }
  };

  // Activity CRUD
  const handleAddActivity = () => {
    if (!selectedClassroom || !activityForm.activityName.trim()) return;
    const newRecord: ActivityRecord = {
      id: Date.now(),
      period: activityForm.period,
      activityName: activityForm.activityName,
      totalPoints: parseFloat(activityForm.totalPoints) || 3,
      totalQuestions: parseInt(activityForm.totalQuestions) || 10,
      content: activityForm.content,
      skill: activityForm.skill,
      students: [],
      createdAt: new Date().toISOString(),
    };
    setClassrooms(classrooms.map(c =>
      c.id === selectedClassroom.id
        ? { ...c, records: [...c.records, newRecord] }
        : c
    ));
    setActivityForm({ activityName: '', period: '1_trimestre', totalPoints: '3', totalQuestions: '10', content: '', skill: '' });
    setShowActivityForm(false);
  };

  const handleDeleteRecord = (recordId: number) => {
    if (!selectedClassroom) return;
    if (confirm('Excluir esta atividade?')) {
      setClassrooms(classrooms.map(c =>
        c.id === selectedClassroom.id
          ? { ...c, records: c.records.filter(r => r.id !== recordId) }
          : c
      ));
    }
  };

  // Students
  const handleAddStudents = (recordId: number) => {
    if (!selectedClassroom || !bulkInput.trim()) return;
    const record = selectedClassroom.records.find(r => r.id === recordId);
    if (!record) return;

    const lines = bulkInput.trim().split('\n');
    const newStudents: Student[] = [];
    let nextId = record.students.length > 0 ? Math.max(...record.students.map(s => s.id)) + 1 : 1;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      let name = '';
      let answers = 0;
      let found = false;

      const separators = [',', ';', '-', '\t'];
      for (const sep of separators) {
        const parts = trimmed.split(sep);
        if (parts.length >= 2) {
          name = parts[0].trim();
          const answerStr = parts[parts.length - 1].trim();
          const parsed = parseInt(answerStr);
          if (!isNaN(parsed) && name) {
            answers = parsed;
            found = true;
            break;
          }
        }
      }

      if (!found) {
        const match = trimmed.match(/^(.+?)\s+(\d+)\s*$/);
        if (match) {
          name = match[1].trim();
          answers = parseInt(match[2]);
          found = true;
        }
      }

      if (found && name) {
        newStudents.push({ id: nextId++, name, correctAnswers: answers });
      }
    });

    if (newStudents.length > 0) {
      setClassrooms(classrooms.map(c =>
        c.id === selectedClassroom.id
          ? {
            ...c,
            records: c.records.map(r =>
              r.id === recordId
                ? { ...r, students: [...r.students, ...newStudents] }
                : r
            ),
          }
          : c
      ));
      setBulkInput('');
    }
  };

  const handleRemoveStudent = (recordId: number, studentId: number) => {
    if (!selectedClassroom) return;
    setClassrooms(classrooms.map(c =>
      c.id === selectedClassroom.id
        ? {
          ...c,
          records: c.records.map(r =>
            r.id === recordId
              ? { ...r, students: r.students.filter(s => s.id !== studentId) }
              : r
          ),
        }
        : c
    ));
  };

  const handleExportPDF = () => {
    if (!selectedClassroom) return;
    generateClassroomPDF(selectedClassroom, filteredRecords, periodLabels[periodFilter]);
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

  const getBadgeColor = (pct: number) => {
    if (pct >= 60) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <i className="fas fa-graduation-cap text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Gestão de Desempenho</h1>
                <p className="text-sm text-purple-300">Organize turmas, atividades e gere relatórios</p>
              </div>
            </div>
            {selectedClassroom && (
              <button
                onClick={() => setSelectedClassroomId(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm flex items-center gap-2"
              >
                <i className="fas fa-arrow-left"></i>
                Voltar às Turmas
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* SELEÇÃO DE TURMAS */}
        {!selectedClassroom && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fas fa-school text-purple-400"></i>
                Minhas Turmas
              </h2>
              <button
                onClick={() => setShowClassroomForm(!showClassroomForm)}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition shadow-lg shadow-purple-500/25 flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                Nova Turma
              </button>
            </div>

            {/* Formulário de turma */}
            {showClassroomForm && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Criar Nova Turma</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-purple-200 mb-1">Nome da Turma *</label>
                    <input
                      type="text"
                      value={classroomForm.name}
                      onChange={e => setClassroomForm({ ...classroomForm, name: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: 9° Ano A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-purple-200 mb-1">Ano/Série</label>
                    <input
                      type="text"
                      value={classroomForm.year}
                      onChange={e => setClassroomForm({ ...classroomForm, year: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: 9° Ano"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-purple-200 mb-1">Professor(a)</label>
                    <input
                      type="text"
                      value={classroomForm.teacher}
                      onChange={e => setClassroomForm({ ...classroomForm, teacher: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Nome do professor"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-purple-200 mb-1">Disciplina</label>
                    <input
                      type="text"
                      value={classroomForm.subject}
                      onChange={e => setClassroomForm({ ...classroomForm, subject: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: Matemática"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-purple-200 mb-1">Escola</label>
                    <input
                      type="text"
                      value={classroomForm.school}
                      onChange={e => setClassroomForm({ ...classroomForm, school: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Nome da escola"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={handleCreateClassroom}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition flex items-center gap-2"
                  >
                    <i className="fas fa-check"></i>
                    Criar Turma
                  </button>
                  <button
                    onClick={() => setShowClassroomForm(false)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de turmas */}
            {classrooms.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                  <i className="fas fa-school text-3xl text-purple-400"></i>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Nenhuma turma cadastrada</h3>
                <p className="text-purple-300">Clique em "Nova Turma" para começar a organizar suas atividades.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classrooms.map(classroom => {
                  const totalStudents = new Set(classroom.records.flatMap(r => r.students.map(s => s.name))).size;
                  return (
                    <div
                      key={classroom.id}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition cursor-pointer group"
                      onClick={() => setSelectedClassroomId(classroom.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <i className="fas fa-users text-white text-lg"></i>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteClassroom(classroom.id); }}
                          className="text-red-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                      <h3 className="text-lg font-bold text-white">{classroom.name}</h3>
                      <p className="text-sm text-purple-300">{classroom.year} • {classroom.subject}</p>
                      <p className="text-xs text-purple-400 mt-1">Prof. {classroom.teacher}</p>
                      <div className="flex gap-4 mt-4 pt-3 border-t border-white/10">
                        <div>
                          <p className="text-xs text-purple-400">Atividades</p>
                          <p className="text-lg font-bold text-white">{classroom.records.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-purple-400">Alunos</p>
                          <p className="text-lg font-bold text-white">{totalStudents}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* DETALHES DA TURMA */}
        {selectedClassroom && (
          <>
            {/* Info da turma */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedClassroom.name}</h2>
                  <p className="text-purple-300 mt-1">{selectedClassroom.year} • {selectedClassroom.subject}</p>
                  <p className="text-sm text-purple-400 mt-1">
                    <i className="fas fa-user-tie mr-1"></i> {selectedClassroom.teacher} |
                    <i className="fas fa-school ml-2 mr-1"></i> {selectedClassroom.school || 'Escola não informada'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowActivityForm(!showActivityForm)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition shadow-lg shadow-purple-500/25 flex items-center gap-2 text-sm"
                  >
                    <i className="fas fa-plus"></i>
                    Nova Atividade
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={filteredRecords.length === 0}
                    className="px-4 py-2 bg-emerald-600/80 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center gap-2 text-sm"
                  >
                    <i className="fas fa-file-pdf"></i>
                    Exportar PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Filtro de Período */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-purple-300 font-medium mr-2">
                  <i className="fas fa-filter mr-1"></i> Período:
                </span>
                {(['all', '1_bimestre', '2_bimestre', '3_bimestre', '4_bimestre', '1_trimestre', '2_trimestre', '3_trimestre', 'anual'] as PeriodFilter[]).map(period => (
                  <button
                    key={period}
                    onClick={() => setPeriodFilter(period)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${periodFilter === period
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white/10 text-purple-300 hover:bg-white/20'
                      }`}
                  >
                    {periodLabels[period]}
                  </button>
                ))}
              </div>
            </div>

            {/* Formulário de Atividade */}
            {showActivityForm && (
              <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <i className="fas fa-clipboard-list text-pink-400"></i>
                  Nova Atividade / Avaliação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-purple-200 mb-1">Nome da Atividade *</label>
                    <input
                      type="text"
                      value={activityForm.activityName}
                      onChange={e => setActivityForm({ ...activityForm, activityName: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: Prova P1, Trabalho..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-purple-200 mb-1">Período</label>
                    <select
                      value={activityForm.period}
                      onChange={e => setActivityForm({ ...activityForm, period: e.target.value as ActivityRecord['period'] })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="1_bimestre" className="bg-slate-800">1º Bimestre</option>
                      <option value="2_bimestre" className="bg-slate-800">2º Bimestre</option>
                      <option value="3_bimestre" className="bg-slate-800">3º Bimestre</option>
                      <option value="4_bimestre" className="bg-slate-800">4º Bimestre</option>
                      <option value="1_trimestre" className="bg-slate-800">1º Trimestre</option>
                      <option value="2_trimestre" className="bg-slate-800">2º Trimestre</option>
                      <option value="3_trimestre" className="bg-slate-800">3º Trimestre</option>
                      <option value="anual" className="bg-slate-800">Anual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-purple-200 mb-1">Valor (pontos)</label>
                    <input
                      type="number"
                      value={activityForm.totalPoints}
                      onChange={e => setActivityForm({ ...activityForm, totalPoints: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-purple-200 mb-1">Nº de Questões</label>
                    <input
                      type="number"
                      value={activityForm.totalQuestions}
                      onChange={e => setActivityForm({ ...activityForm, totalQuestions: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-purple-200 mb-1">Conteúdo Trabalhado</label>
                    <input
                      type="text"
                      value={activityForm.content}
                      onChange={e => setActivityForm({ ...activityForm, content: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: Equações de 2° grau"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-purple-200 mb-1">Habilidade (BNCC/Componente)</label>
                    <input
                      type="text"
                      value={activityForm.skill}
                      onChange={e => setActivityForm({ ...activityForm, skill: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: EF09MA09"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={handleAddActivity}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition flex items-center gap-2"
                  >
                    <i className="fas fa-check"></i>
                    Criar Atividade
                  </button>
                  <button
                    onClick={() => setShowActivityForm(false)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de Atividades */}
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <i className="fas fa-clipboard text-2xl text-purple-400"></i>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Nenhuma atividade neste período</h3>
                <p className="text-purple-300 text-sm">Adicione atividades e lance as notas dos alunos.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredRecords.map(record => (
                  <ActivityCard
                    key={record.id}
                    record={record}
                    onAddStudents={handleAddStudents}
                    onRemoveStudent={handleRemoveStudent}
                    onDeleteRecord={handleDeleteRecord}
                    bulkInput={bulkInput}
                    setBulkInput={setBulkInput}
                    getGradeColor={getGradeColor}
                    getBarColor={getBarColor}
                    getBadgeColor={getBadgeColor}
                  />
                ))}
              </div>
            )}

            {/* Resumo Geral do Período */}
            {allStudentsForPeriod.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <i className="fas fa-chart-pie text-yellow-400"></i>
                  Rendimento Geral - {periodLabels[periodFilter]}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <StatCard
                    label="Média Geral"
                    value={(allStudentsForPeriod.reduce((a, s) => a + s.averagePercentage, 0) / allStudentsForPeriod.length).toFixed(1) + '%'}
                    icon="fas fa-chart-line"
                  />
                  <StatCard
                    label="Aprovados (≥60%)"
                    value={allStudentsForPeriod.filter(s => s.averagePercentage >= 60).length.toString()}
                    icon="fas fa-check-circle"
                    color="text-emerald-400"
                  />
                  <StatCard
                    label="Reprovados"
                    value={allStudentsForPeriod.filter(s => s.averagePercentage < 60).length.toString()}
                    icon="fas fa-times-circle"
                    color="text-red-400"
                  />
                  <StatCard
                    label="Taxa de Aprovação"
                    value={Math.round((allStudentsForPeriod.filter(s => s.averagePercentage >= 60).length / allStudentsForPeriod.length) * 100) + '%'}
                    icon="fas fa-percentage"
                  />
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allStudentsForPeriod.sort((a, b) => b.averagePercentage - a.averagePercentage).map((student, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white/5 rounded-lg p-2">
                      <span className="text-xs text-purple-400 w-6 text-right">{idx + 1}°</span>
                      <span className="text-sm text-white flex-1 truncate">{student.name}</span>
                      <span className={`text-sm font-bold ${getGradeColor(student.averagePercentage)}`}>
                        {student.averagePercentage.toFixed(1)}%
                      </span>
                      <div className="w-24 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getBarColor(student.averagePercentage)}`}
                          style={{ width: `${Math.min(student.averagePercentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded border ${getBadgeColor(student.averagePercentage)}`}>
                        {student.averagePercentage >= 60 ? 'Aprovado' : 'Reprovado'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ============= COMPONENTES AUXILIARES =============

function StatCard({ label, value, icon, color = 'text-white' }: { label: string; value: string; icon: string; color?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
      <i className={`${icon} ${color} mb-2`}></i>
      <p className="text-xs text-purple-300 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold ${color} mt-1`}>{value}</p>
    </div>
  );
}

function ActivityCard({
  record,
  onAddStudents,
  onRemoveStudent,
  onDeleteRecord,
  bulkInput,
  setBulkInput,
  getGradeColor,
  getBarColor,
  getBadgeColor,
}: {
  record: ActivityRecord;
  onAddStudents: (recordId: number) => void;
  onRemoveStudent: (recordId: number, studentId: number) => void;
  onDeleteRecord: (recordId: number) => void;
  bulkInput: string;
  setBulkInput: (v: string) => void;
  getGradeColor: (pct: number) => string;
  getBarColor: (pct: number) => string;
  getBadgeColor: (pct: number) => string;
}) {
  const [showInput, setShowInput] = useState(false);

  const sortedStudents = [...record.students].sort((a, b) => {
    const gA = (a.correctAnswers / record.totalQuestions) * record.totalPoints;
    const gB = (b.correctAnswers / record.totalQuestions) * record.totalPoints;
    return gB - gA;
  });

  const stats = useMemo(() => {
    if (record.students.length === 0) return null;
    const grades = record.students.map(s => (s.correctAnswers / record.totalQuestions) * record.totalPoints);
    const percentages = record.students.map(s => (s.correctAnswers / record.totalQuestions) * 100);
    const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
    const avgPct = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    const approved = record.students.filter(s => (s.correctAnswers / record.totalQuestions) * 100 >= 60).length;
    return {
      avg: Math.round(avg * 100) / 100,
      avgPct: Math.round(avgPct * 10) / 10,
      approved,
      total: record.students.length,
      rate: Math.round((approved / record.students.length) * 100),
    };
  }, [record]);

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
      {/* Header da atividade */}
      <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 p-4 border-b border-white/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <i className="fas fa-file-alt text-pink-400"></i>
              {record.activityName}
            </h4>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-purple-300">
              <span><i className="fas fa-calendar mr-1"></i> {periodLabels[record.period]}</span>
              <span><i className="fas fa-star mr-1"></i> {record.totalPoints} pts</span>
              <span><i className="fas fa-list-ol mr-1"></i> {record.totalQuestions} questões</span>
              <span><i className="fas fa-users mr-1"></i> {record.students.length} alunos</span>
            </div>
            {record.content && (
              <p className="text-xs text-purple-200 mt-1">
                <i className="fas fa-book mr-1 text-purple-400"></i> Conteúdo: {record.content}
              </p>
            )}
            {record.skill && (
              <p className="text-xs text-purple-200 mt-0.5">
                <i className="fas fa-bullseye mr-1 text-purple-400"></i> Habilidade: {record.skill}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInput(!showInput)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition flex items-center gap-1"
            >
              <i className="fas fa-plus"></i>
              Alunos
            </button>
            <button
              onClick={() => onDeleteRecord(record.id)}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium rounded-lg border border-red-500/30 transition"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Input de alunos */}
      {showInput && (
        <div className="p-4 border-b border-white/10 bg-white/5">
          <p className="text-xs text-purple-300 mb-2">
            Digite um aluno por linha: <code className="bg-white/10 px-1.5 py-0.5 rounded text-pink-300">Nome, Acertos</code>
          </p>
          <textarea
            value={bulkInput}
            onChange={e => setBulkInput(e.target.value)}
            rows={5}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
            placeholder={`João Silva, 8\nMaria Santos, 10\nPedro, 7`}
          />
          <button
            onClick={() => { onAddStudents(record.id); }}
            className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition flex items-center gap-2"
          >
            <i className="fas fa-check"></i>
            Adicionar Alunos
          </button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-white/10">
          <div className="text-center">
            <p className="text-xs text-purple-400">Média</p>
            <p className="text-lg font-bold text-white">{stats.avg}</p>
            <p className="text-xs text-purple-300">{stats.avgPct}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-purple-400">Aprovados</p>
            <p className="text-lg font-bold text-emerald-400">{stats.approved}</p>
            <p className="text-xs text-purple-300">de {stats.total}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-purple-400">Reprovados</p>
            <p className="text-lg font-bold text-red-400">{stats.total - stats.approved}</p>
            <p className="text-xs text-purple-300">de {stats.total}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-purple-400">Taxa Aprov.</p>
            <p className="text-lg font-bold text-white">{stats.rate}%</p>
            <p className="text-xs text-purple-300">rendimento</p>
          </div>
        </div>
      )}

      {/* Tabela de alunos */}
      {record.students.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-4 text-xs text-purple-300 font-medium">#</th>
                <th className="text-left py-2 px-4 text-xs text-purple-300 font-medium">Aluno</th>
                <th className="text-center py-2 px-4 text-xs text-purple-300 font-medium">Acertos</th>
                <th className="text-center py-2 px-4 text-xs text-purple-300 font-medium">Rendimento</th>
                <th className="text-center py-2 px-4 text-xs text-purple-300 font-medium">Nota</th>
                <th className="text-center py-2 px-4 text-xs text-purple-300 font-medium">Progresso</th>
                <th className="text-center py-2 px-4 text-xs text-purple-300 font-medium">Situação</th>
                <th className="text-center py-2 px-4 text-xs text-purple-300 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student, idx) => {
                const percentage = (student.correctAnswers / record.totalQuestions) * 100;
                const grade = (student.correctAnswers / record.totalQuestions) * record.totalPoints;
                return (
                  <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-2 px-4 text-sm text-purple-400">{idx + 1}</td>
                    <td className="py-2 px-4 text-sm text-white font-medium">{student.name}</td>
                    <td className="py-2 px-4 text-sm text-center text-purple-200 font-mono">
                      {student.correctAnswers}/{record.totalQuestions}
                    </td>
                    <td className="py-2 px-4 text-sm text-center">
                      <span className={`font-bold ${getGradeColor(percentage)}`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-sm font-bold ${getGradeColor(percentage)} bg-white/5`}>
                        {grade.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getBarColor(percentage)}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded border ${getBadgeColor(percentage)}`}>
                        {percentage >= 60 ? 'Aprovado' : 'Reprovado'}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <button
                        onClick={() => onRemoveStudent(record.id, student.id)}
                        className="text-red-400/50 hover:text-red-400 transition"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {record.students.length === 0 && !showInput && (
        <div className="p-6 text-center">
          <p className="text-sm text-purple-400">Nenhum aluno adicionado. Clique em "Alunos" para inserir.</p>
        </div>
      )}
    </div>
  );
}

export default App;
