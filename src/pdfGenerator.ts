import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Classroom, ActivityRecord, Student } from './types';

const periodLabels: Record<string, string> = {
  '1_trimestre': '1º Trimestre',
  '2_trimestre': '2º Trimestre',
  '3_trimestre': '3º Trimestre',
  '1_bimestre': '1º Bimestre',
  '2_bimestre': '2º Bimestre',
  '3_bimestre': '3º Bimestre',
  '4_bimestre': '4º Bimestre',
  'anual': 'Anual',
  'all': 'Todos os Períodos',
};

function calculateGrade(student: Student, totalPoints: number, totalQuestions: number) {
  const percentage = (student.correctAnswers / totalQuestions) * 100;
  const grade = (student.correctAnswers / totalQuestions) * totalPoints;
  return {
    grade: Math.round(grade * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
  };
}

export function generateClassroomPDF(
  classroom: Classroom,
  records: ActivityRecord[],
  periodLabel: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let yPos = 15;

  // Header background
  doc.setFillColor(88, 28, 135); // purple-800
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Header accent line
  doc.setFillColor(219, 39, 119); // pink-600
  doc.rect(0, 42, pageWidth, 2, 'F');

  // School name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(classroom.school || 'Escola', margin, 12);

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Relatório de Desempenho - ${classroom.name}`, margin, 23);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${classroom.year} | ${classroom.subject} | Prof. ${classroom.teacher}`, margin, 32);
  doc.text(`Período: ${periodLabel}`, margin, 39);

  yPos = 52;

  // Info section
  doc.setTextColor(55, 48, 71);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados da Turma', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);

  const infoLines = [
    `Turma: ${classroom.name} (${classroom.year})`,
    `Disciplina: ${classroom.subject}`,
    `Professor(a): ${classroom.teacher}`,
    `Escola: ${classroom.school || 'Não informada'}`,
    `Período de referência: ${periodLabel}`,
    `Total de atividades registradas: ${records.length}`,
    `Data do relatório: ${new Date().toLocaleDateString('pt-BR')}`,
  ];

  infoLines.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 5;
  });

  yPos += 5;

  // Process each record
  records.forEach((record, recordIndex) => {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    // Record header
    doc.setFillColor(243, 232, 255); // purple-100
    doc.roundedRect(margin - 2, yPos - 4, pageWidth - margin * 2 + 4, 12, 2, 2, 'F');

    doc.setTextColor(88, 28, 135);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Atividade ${recordIndex + 1}: ${record.activityName}`, margin, yPos + 3);
    yPos += 10;

    // Activity details
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${periodLabels[record.period] || record.period} | Valor: ${record.totalPoints} pts | Questões: ${record.totalQuestions}`, margin, yPos);
    yPos += 4;
    doc.text(`Conteúdo: ${record.content || 'Não informado'}`, margin, yPos);
    yPos += 4;
    doc.text(`Habilidade: ${record.skill || 'Não informada'}`, margin, yPos);
    yPos += 7;

    // Students table
    const sortedStudents = [...record.students].sort((a, b) => {
      const gA = (a.correctAnswers / record.totalQuestions) * record.totalPoints;
      const gB = (b.correctAnswers / record.totalQuestions) * record.totalPoints;
      return gB - gA;
    });

    const tableData = sortedStudents.map((student, idx) => {
      const { grade, percentage } = calculateGrade(student, record.totalPoints, record.totalQuestions);
      return [
        (idx + 1).toString(),
        student.name,
        `${student.correctAnswers}/${record.totalQuestions}`,
        `${percentage.toFixed(1)}%`,
        grade.toFixed(2),
        percentage >= 60 ? 'Aprovado' : 'Reprovado',
      ];
    });

    // Stats
    const grades = sortedStudents.map(s => calculateGrade(s, record.totalPoints, record.totalQuestions).grade);
    const avg = grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2) : '0';
    const approved = sortedStudents.filter(s => calculateGrade(s, record.totalPoints, record.totalQuestions).percentage >= 60).length;
    const approvalRate = sortedStudents.length > 0 ? Math.round((approved / sortedStudents.length) * 100) : 0;

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Aluno', 'Acertos', 'Rendimento', 'Nota', 'Situação']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [88, 28, 135],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [250, 245, 255],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 55 },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 22, halign: 'center' },
      },
      margin: { left: margin, right: margin },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 5) {
          if (data.cell.raw === 'Aprovado') {
            data.cell.styles.textColor = [16, 150, 72];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;

    // Stats summary
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 14, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 101, 52);
    doc.text(
      `Média da turma: ${avg} pts | Aprovados: ${approved}/${sortedStudents.length} | Taxa de aprovação: ${approvalRate}%`,
      margin + 4,
      yPos + 8
    );
    yPos += 20;
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${totalPages} | Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  doc.save(`relatorio_${classroom.name.replace(/\s/g, '_')}_${periodLabel.replace(/\s/g, '_')}.pdf`);
}

// ============= RELATÓRIO INDIVIDUAL DO ALUNO =============

export interface StudentPerformanceData {
  studentName: string;
  classroom: Classroom;
  records: {
    record: ActivityRecord;
    student: Student;
    grade: number;
    percentage: number;
  }[];
  stats: {
    totalActivities: number;
    averageGrade: number;
    averagePercentage: number;
    maxGrade: number;
    minGrade: number;
    totalCorrect: number;
    totalQuestions: number;
    contents: string[];
    skills: string[];
    periods: string[];
    evolution: { activity: string; percentage: number; grade: number }[];
  };
}

export function generateStudentPDF(data: StudentPerformanceData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let yPos = 15;

  // Header
  doc.setFillColor(88, 28, 135);
  doc.rect(0, 0, pageWidth, 42, 'F');
  doc.setFillColor(219, 39, 119);
  doc.rect(0, 42, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(data.classroom.school || 'Escola', margin, 12);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório Individual do Aluno', margin, 23);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Aluno(a): ${data.studentName}`, margin, 32);
  doc.text(`Turma: ${data.classroom.name} (${data.classroom.year}) | ${data.classroom.subject}`, margin, 39);

  yPos = 52;

  // Dados do aluno
  doc.setTextColor(55, 48, 71);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados Gerais', margin, yPos);
  yPos += 2;
  doc.setDrawColor(88, 28, 135);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);

  const generalInfo = [
    ['Turma:', `${data.classroom.name} (${data.classroom.year})`],
    ['Disciplina:', data.classroom.subject],
    ['Professor(a):', data.classroom.teacher],
    ['Escola:', data.classroom.school || 'Não informada'],
    ['Data do relatório:', new Date().toLocaleDateString('pt-BR')],
  ];

  generalInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 35, yPos);
    yPos += 5;
  });

  yPos += 5;

  // Estatísticas gerais
  doc.setFillColor(243, 232, 255);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 32, 2, 2, 'F');

  doc.setTextColor(88, 28, 135);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo do Desempenho', margin + 4, yPos + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  const col1 = margin + 4;
  const col2 = pageWidth / 2;
  const row1 = yPos + 14;
  const row2 = yPos + 22;

  doc.setFont('helvetica', 'bold');
  doc.text('Atividades realizadas:', col1, row1);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.stats.totalActivities}`, col1 + 42, row1);

  doc.setFont('helvetica', 'bold');
  doc.text('Média geral:', col1, row2);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.stats.averageGrade.toFixed(2)} pts (${data.stats.averagePercentage.toFixed(1)}%)`, col1 + 42, row2);

  doc.setFont('helvetica', 'bold');
  doc.text('Maior nota:', col2, row1);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.stats.maxGrade.toFixed(2)} pts`, col2 + 25, row1);

  doc.setFont('helvetica', 'bold');
  doc.text('Menor nota:', col2, row2);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.stats.minGrade.toFixed(2)} pts`, col2 + 25, row2);

  yPos += 38;

  // Tabela de atividades
  if (data.records.length > 0) {
    doc.setTextColor(55, 48, 71);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Histórico de Atividades', margin, yPos);
    yPos += 2;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    const tableData = data.records.map((r, idx) => [
      (idx + 1).toString(),
      r.record.activityName,
      periodLabels[r.record.period] || r.record.period,
      `${r.student.correctAnswers}/${r.record.totalQuestions}`,
      `${r.percentage.toFixed(1)}%`,
      r.grade.toFixed(2),
      r.percentage >= 60 ? 'Aprovado' : 'Reprovado',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Atividade', 'Período', 'Acertos', 'Rendimento', 'Nota', 'Situação']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [88, 28, 135],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [250, 245, 255],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        6: { cellWidth: 22, halign: 'center' },
      },
      margin: { left: margin, right: margin },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 6) {
          if (data.cell.raw === 'Aprovado') {
            data.cell.styles.textColor = [16, 150, 72];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  }

  // Conteúdos trabalhados
  if (data.stats.contents.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    doc.setTextColor(55, 48, 71);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Conteúdos Trabalhados', margin, yPos);
    yPos += 2;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    data.stats.contents.forEach(content => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`• ${content}`, margin + 4, yPos);
      yPos += 5;
    });

    yPos += 4;
  }

  // Habilidades desenvolvidas
  if (data.stats.skills.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    doc.setTextColor(55, 48, 71);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Habilidades Trabalhadas', margin, yPos);
    yPos += 2;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    data.stats.skills.forEach(skill => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`• ${skill}`, margin + 4, yPos);
      yPos += 5;
    });

    yPos += 4;
  }

  // Gráfico de evolução (barras horizontais)
  if (data.stats.evolution.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    doc.setTextColor(55, 48, 71);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Evolução do Rendimento', margin, yPos);
    yPos += 2;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    const barMaxWidth = pageWidth - margin * 2 - 50;
    const barHeight = 6;

    data.stats.evolution.forEach((item) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      // Nome da atividade
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const label = item.activity.length > 25 ? item.activity.substring(0, 22) + '...' : item.activity;
      doc.text(label, margin, yPos + 3);

      // Barra
      const barX = margin + 50;
      const barWidth = (item.percentage / 100) * barMaxWidth;

      // Cor da barra
      let r = 239, g = 68, b = 68; // red
      if (item.percentage >= 80) { r = 16; g = 185; b = 129; } // emerald
      else if (item.percentage >= 60) { r = 234; g = 179; b = 8; } // yellow
      else if (item.percentage >= 40) { r = 249; g = 115; b = 22; } // orange

      doc.setFillColor(240, 240, 240);
      doc.rect(barX, yPos, barMaxWidth, barHeight, 'F');
      doc.setFillColor(r, g, b);
      doc.rect(barX, yPos, barWidth, barHeight, 'F');

      // Valor
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(`${item.percentage.toFixed(1)}%`, barX + barMaxWidth + 2, yPos + 4);

      yPos += 10;
    });
  }

  // Análise final
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }
  yPos += 4;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 28, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('Análise Geral', margin + 4, yPos + 6);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  let analysis = '';
  if (data.stats.averagePercentage >= 80) {
    analysis = `O aluno demonstrou excelente desempenho, com rendimento médio de ${data.stats.averagePercentage.toFixed(1)}%. Apresenta domínio consistente dos conteúdos trabalhados.`;
  } else if (data.stats.averagePercentage >= 60) {
    analysis = `O aluno apresentou bom desempenho, com rendimento médio de ${data.stats.averagePercentage.toFixed(1)}%. Demonstra compreensão adequada dos conteúdos, com possibilidade de aprimoramento.`;
  } else if (data.stats.averagePercentage >= 40) {
    analysis = `O aluno apresenta rendimento médio de ${data.stats.averagePercentage.toFixed(1)}%, indicando necessidade de reforço em alguns conteúdos. Recomenda-se acompanhamento individualizado.`;
  } else {
    analysis = `O aluno apresenta rendimento médio de ${data.stats.averagePercentage.toFixed(1)}%, demonstrando dificuldades significativas. É necessário intervenção pedagógica e plano de recuperação.`;
  }

  const splitAnalysis = doc.splitTextToSize(analysis, pageWidth - margin * 2 - 8);
  doc.text(splitAnalysis, margin + 4, yPos + 13);

  // Footer em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${totalPages} | Relatório de ${data.studentName} | Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  doc.save(`relatorio_${data.studentName.replace(/\s/g, '_')}_${data.classroom.name.replace(/\s/g, '_')}.pdf`);
}
