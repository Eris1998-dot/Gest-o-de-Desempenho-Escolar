import { useState, useMemo } from 'react';

interface Student {
  id: number;
  name: string;
  correctAnswers: number;
  grade: number;
  percentage: number;
}

function App() {
  const [totalPoints, setTotalPoints] = useState<string>('3');
  const [totalQuestions, setTotalQuestions] = useState<string>('10');
  const [bulkInput, setBulkInput] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'grade' | 'answers'>('grade');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const pointsValue = parseFloat(totalPoints) || 0;
  const questionsValue = parseInt(totalQuestions) || 1;

  const calculateGrade = (correctAnswers: number): { grade: number; percentage: number } => {
    const percentage = (correctAnswers / questionsValue) * 100;
    const grade = (correctAnswers / questionsValue) * pointsValue;
    return {
      grade: Math.round(grade * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
    };
  };

  const handleAddStudents = () => {
    if (!bulkInput.trim()) return;

    const lines = bulkInput.trim().split('\n');
    const newStudents: Student[] = [];
    let nextId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Support formats: "Name, 8" or "Name; 8" or "Name 8" or "Name - 8"
      const separators = [',', ';', '-', '\t'];
      let name = '';
      let answers = 0;
      let found = false;

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
        // Try to extract name and number from the end
        const match = trimmed.match(/^(.+?)\s+(\d+)\s*$/);
        if (match) {
          name = match[1].trim();
          answers = parseInt(match[2]);
          found = true;
        }
      }

      if (found && name) {
        const { grade, percentage } = calculateGrade(answers);
        newStudents.push({
          id: nextId++,
          name,
          correctAnswers: answers,
          grade,
          percentage,
        });
      }
    });

    if (newStudents.length > 0) {
      setStudents([...students, ...newStudents]);
      setBulkInput('');
    }
  };

  const handleRemoveStudent = (id: number) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const handleClearAll = () => {
    setStudents([]);
  };

  const handleRecalculate = () => {
    setStudents(students.map(s => {
      const { grade, percentage } = calculateGrade(s.correctAnswers);
      return { ...s, grade, percentage };
    }));
  };

  const sortedStudents = useMemo(() => {
    const sorted = [...students].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'grade') comparison = a.grade - b.grade;
      else comparison = a.correctAnswers - b.correctAnswers;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [students, sortBy, sortOrder]);

  const stats = useMemo(() => {
    if (students.length === 0) return null;
    const grades = students.map(s => s.grade);
    const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
    const max = Math.max(...grades);
    const min = Math.min(...grades);
    const approved = students.filter(s => s.grade >= pointsValue * 0.6).length;
    return {
      average: Math.round(avg * 100) / 100,
      max,
      min,
      approved,
      total: students.length,
      approvalRate: Math.round((approved / students.length) * 100),
    };
  }, [students, pointsValue]);

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getGradeTextColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleSort = (field: 'name' | 'grade' | 'answers') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    const header = 'Nome,Acertos,Questões,Nota,Percentual\n';
    const rows = sortedStudents.map(s =>
      `${s.name},${s.correctAnswers},${questionsValue},${s.grade},${s.percentage}%`
    ).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'notas_turma.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <i className="fas fa-chart-bar text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Comparador de Notas</h1>
              <p className="text-sm text-purple-300">Calcule e compare notas proporcionalmente</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Configuração da Atividade */}
        <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="fas fa-cog text-purple-400"></i>
            Configuração da Atividade
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Valor da Atividade (pontos)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={totalPoints}
                  onChange={(e) => {
                    setTotalPoints(e.target.value);
                  }}
                  onBlur={handleRecalculate}
                  min="0"
                  step="0.5"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="Ex: 3"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300">pts</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Número de Questões
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={totalQuestions}
                  onChange={(e) => {
                    setTotalQuestions(e.target.value);
                  }}
                  onBlur={handleRecalculate}
                  min="1"
                  step="1"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="Ex: 10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300">questões</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <p className="text-sm text-purple-200">
              <i className="fas fa-info-circle mr-2 text-purple-400"></i>
              Cada questão vale <span className="font-bold text-white">{(pointsValue / questionsValue).toFixed(2)} pontos</span> ({(100 / questionsValue).toFixed(1)}% do total)
            </p>
          </div>
        </section>

        {/* Input de Turma */}
        <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="fas fa-users text-pink-400"></i>
            Inserir Turma
          </h2>
          <p className="text-sm text-purple-300 mb-3">
            Digite um aluno por linha. Use qualquer formato: <code className="bg-white/10 px-2 py-0.5 rounded text-pink-300">Nome, Acertos</code> ou <code className="bg-white/10 px-2 py-0.5 rounded text-pink-300">Nome; Acertos</code> ou <code className="bg-white/10 px-2 py-0.5 rounded text-pink-300">Nome Acertos</code>
          </p>
          <textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            rows={8}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-y placeholder-purple-400/50"
            placeholder={`Exemplo:\nJoão Silva, 8\nMaria Santos; 10\nPedro Oliveira 7\nAna Costa, 9\nCarlos Souza - 6`}
          />
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={handleAddStudents}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Adicionar Alunos
            </button>
            {students.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold rounded-xl border border-red-500/30 transition-all duration-200 flex items-center gap-2"
              >
                <i className="fas fa-trash"></i>
                Limpar Tudo
              </button>
            )}
          </div>
        </section>

        {/* Estatísticas */}
        {stats && (
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <p className="text-xs text-purple-300 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              <p className="text-xs text-purple-400">alunos</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <p className="text-xs text-purple-300 uppercase tracking-wide">Média</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.average}</p>
              <p className="text-xs text-purple-400">pontos</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <p className="text-xs text-purple-300 uppercase tracking-wide">Maior Nota</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.max}</p>
              <p className="text-xs text-purple-400">pontos</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <p className="text-xs text-purple-300 uppercase tracking-wide">Menor Nota</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{stats.min}</p>
              <p className="text-xs text-purple-400">pontos</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <p className="text-xs text-purple-300 uppercase tracking-wide">Aprovados</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.approved}</p>
              <p className="text-xs text-purple-400">≥ 60%</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <p className="text-xs text-purple-300 uppercase tracking-wide">Taxa Aprov.</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.approvalRate}%</p>
              <p className="text-xs text-purple-400">da turma</p>
            </div>
          </section>
        )}

        {/* Tabela de Resultados */}
        {students.length > 0 && (
          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <i className="fas fa-list-ol text-emerald-400"></i>
                Resultados ({students.length} alunos)
              </h2>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium rounded-lg border border-emerald-500/30 transition-all duration-200 text-sm flex items-center gap-2"
              >
                <i className="fas fa-download"></i>
                Exportar CSV
              </button>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-purple-300 uppercase tracking-wide">#</th>
                    <th
                      className="text-left py-3 px-3 text-xs font-semibold text-purple-300 uppercase tracking-wide cursor-pointer hover:text-white transition"
                      onClick={() => handleSort('name')}
                    >
                      Nome {sortBy === 'name' && <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ml-1`}></i>}
                    </th>
                    <th
                      className="text-center py-3 px-3 text-xs font-semibold text-purple-300 uppercase tracking-wide cursor-pointer hover:text-white transition"
                      onClick={() => handleSort('answers')}
                    >
                      Acertos {sortBy === 'answers' && <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ml-1`}></i>}
                    </th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-purple-300 uppercase tracking-wide">
                      %
                    </th>
                    <th
                      className="text-center py-3 px-3 text-xs font-semibold text-purple-300 uppercase tracking-wide cursor-pointer hover:text-white transition"
                      onClick={() => handleSort('grade')}
                    >
                      Nota {sortBy === 'grade' && <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ml-1`}></i>}
                    </th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-purple-300 uppercase tracking-wide">
                      Progresso
                    </th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-purple-300 uppercase tracking-wide">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((student, index) => (
                    <tr
                      key={student.id}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="py-3 px-3 text-sm text-purple-400">{index + 1}</td>
                      <td className="py-3 px-3 text-sm text-white font-medium">{student.name}</td>
                      <td className="py-3 px-3 text-sm text-center text-purple-200">
                        <span className="font-mono">{student.correctAnswers}</span>
                        <span className="text-purple-400">/{questionsValue}</span>
                      </td>
                      <td className="py-3 px-3 text-sm text-center">
                        <span className={`font-semibold ${getGradeTextColor(student.percentage)}`}>
                          {student.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${getGradeTextColor(student.percentage)} bg-white/5`}>
                          {student.grade.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getGradeColor(student.percentage)}`}
                            style={{ width: `${Math.min(student.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2 rounded-lg transition"
                          title="Remover aluno"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Gráfico Visual */}
        {students.length > 0 && (
          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <i className="fas fa-chart-bar text-yellow-400"></i>
              Comparação Visual
            </h2>
            <div className="space-y-3">
              {sortedStudents.slice(0, 20).map((student) => (
                <div key={student.id} className="flex items-center gap-3">
                  <span className="text-sm text-purple-200 w-36 truncate text-right" title={student.name}>
                    {student.name}
                  </span>
                  <div className="flex-1 bg-white/10 rounded-lg h-8 relative overflow-hidden">
                    <div
                      className={`h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-3 ${getGradeColor(student.percentage)}`}
                      style={{ width: `${Math.max(student.percentage, 5)}%` }}
                    >
                      <span className="text-xs font-bold text-white drop-shadow">
                        {student.grade.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {students.length > 20 && (
                <p className="text-sm text-purple-400 text-center pt-2">
                  Exibindo os primeiros 20 de {students.length} alunos
                </p>
              )}
            </div>
          </section>
        )}

        {/* Estado vazio */}
        {students.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <i className="fas fa-user-graduate text-3xl text-purple-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum aluno adicionado</h3>
            <p className="text-purple-300 max-w-md mx-auto">
              Configure os valores acima e insira os nomes e acertos dos alunos para ver as notas calculadas proporcionalmente.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-purple-400">
            <i className="fas fa-calculator mr-2"></i>
            Nota = (Acertos ÷ Total de Questões) × Valor da Atividade
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
