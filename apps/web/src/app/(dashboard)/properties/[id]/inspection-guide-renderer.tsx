'use client';

import {
  AlertTriangle,
  ClipboardList,
  FileText,
  Lightbulb,
  Search,
  ShieldAlert,
} from 'lucide-react';

/**
 * Renders an inspection guide markdown with rich UI components.
 * Parses sections: Qué buscar, Cómo evaluar, Procedimiento, Normativa, Importante/Nota/Peligro, Tips.
 */
export function InspectionGuideRenderer({ content }: { content: string }) {
  const sections = parseGuideSections(content);

  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        <GuideSection key={i} section={section} />
      ))}
    </div>
  );
}

// ─── Section types ──────────────────────────────────────

interface GuideSectionData {
  type:
    | 'search'
    | 'evaluate'
    | 'procedure'
    | 'normative'
    | 'warning'
    | 'danger'
    | 'note'
    | 'tip'
    | 'generic';
  title: string;
  items?: string[];
  evaluationRows?: { status: string; emoji: string; criteria: string }[];
  text?: string;
}

// ─── Parser ─────────────────────────────────────────────

function parseGuideSections(md: string): GuideSectionData[] {
  const sections: GuideSectionData[] = [];
  const blocks = md.split(/^## /m).filter(Boolean);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const title = lines[0]?.trim() ?? '';
    const body = lines.slice(1).join('\n').trim();

    const titleLower = title.toLowerCase();

    if (titleLower.includes('qué buscar') || titleLower.includes('que buscar')) {
      sections.push({
        type: 'search',
        title,
        items: parseListItems(body),
      });
    } else if (titleLower.includes('cómo evaluar') || titleLower.includes('como evaluar')) {
      sections.push({
        type: 'evaluate',
        title,
        evaluationRows: parseEvaluationTable(body),
      });
    } else if (titleLower.includes('procedimiento')) {
      sections.push({
        type: 'procedure',
        title,
        items: parseListItems(body),
      });
    } else if (titleLower.includes('normativa')) {
      sections.push({
        type: 'normative',
        title,
        items: parseListItems(body),
      });
    } else if (titleLower.includes('peligro')) {
      sections.push({ type: 'danger', title, text: body });
    } else if (titleLower.includes('importante')) {
      sections.push({ type: 'warning', title, text: body });
    } else if (titleLower.includes('tip')) {
      sections.push({ type: 'tip', title, items: parseListItems(body) });
    } else if (titleLower.includes('nota')) {
      sections.push({ type: 'note', title, text: body });
    } else {
      sections.push({ type: 'generic', title, text: body, items: parseListItems(body) });
    }
  }

  return sections;
}

function parseListItems(text: string): string[] {
  return text
    .split('\n')
    .map((line) =>
      line
        .replace(/^[-*]\s+/, '')
        .replace(/^\d+\.\s+/, '')
        .trim(),
    )
    .filter((line) => line.length > 0 && !line.startsWith('|') && !line.startsWith('---'));
}

function parseEvaluationTable(text: string): { status: string; emoji: string; criteria: string }[] {
  const rows: { status: string; emoji: string; criteria: string }[] = [];
  const lines = text.split('\n').filter((l) => l.includes('|') && !l.includes('---'));

  for (const line of lines) {
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length >= 2) {
      const statusCell = cells[0] ?? '';
      const criteriaCell = cells[1] ?? '';
      // Skip header row
      if (statusCell.toLowerCase() === 'estado') continue;

      let emoji = '⚪';
      let status = statusCell;
      if (statusCell.includes('OK') || statusCell.includes('✅')) {
        emoji = '✅';
        status = 'OK';
      } else if (statusCell.includes('Atención') || statusCell.includes('⚠')) {
        emoji = '⚠️';
        status = 'Necesita atención';
      } else if (statusCell.includes('Profesional') || statusCell.includes('🔴')) {
        emoji = '🔴';
        status = 'Requiere profesional';
      }

      rows.push({ status, emoji, criteria: criteriaCell });
    }
  }
  return rows;
}

// ─── Section Components ─────────────────────────────────

function GuideSection({ section }: { section: GuideSectionData }) {
  switch (section.type) {
    case 'search':
      return (
        <div className="space-y-2">
          <SectionHeader icon={Search} title={section.title} />
          <ul className="space-y-1.5 pl-1">
            {section.items?.map((item, i) => (
              <li key={i} className="text-foreground flex items-start gap-2 text-sm">
                <span className="text-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      );

    case 'evaluate':
      return (
        <div className="space-y-2">
          <SectionHeader icon={ClipboardList} title={section.title} />
          <div className="space-y-2">
            {section.evaluationRows?.map((row, i) => (
              <EvaluationCard key={i} {...row} />
            ))}
          </div>
        </div>
      );

    case 'procedure':
      return (
        <div className="space-y-2">
          <SectionHeader icon={FileText} title={section.title} />
          <ol className="space-y-1.5 pl-1">
            {section.items?.map((item, i) => (
              <li key={i} className="text-foreground flex items-start gap-2.5 text-sm">
                <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      );

    case 'normative':
      return (
        <div className="space-y-2">
          <SectionHeader icon={FileText} title={section.title} />
          <div className="border-primary/30 bg-primary/5 rounded-lg border-l-4 p-3">
            <ul className="space-y-1">
              {section.items?.map((item, i) => (
                <li key={i} className="text-muted-foreground text-xs">
                  📋 {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );

    case 'danger':
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
          <div className="mb-1 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-sm font-bold text-red-800 dark:text-red-200">{section.title}</p>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300">
            {section.text?.replace(/\*\*/g, '')}
          </p>
        </div>
      );

    case 'warning':
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="mb-1 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-bold text-amber-800 dark:text-amber-200">{section.title}</p>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {section.text?.replace(/\*\*/g, '')}
          </p>
        </div>
      );

    case 'tip':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="text-primary h-4 w-4" />
            <p className="text-sm font-semibold">{section.title}</p>
          </div>
          <ul className="space-y-1 pl-1">
            {section.items?.map((item, i) => (
              <li key={i} className="text-muted-foreground text-xs">
                💡 {item}
              </li>
            ))}
          </ul>
        </div>
      );

    case 'note':
      return (
        <div className="border-muted-foreground/30 bg-muted/50 rounded-lg border-l-4 p-3">
          <p className="text-muted-foreground text-sm">{section.text?.replace(/\*\*/g, '')}</p>
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold">{section.title}</p>
          {section.items && section.items.length > 0 ? (
            <ul className="space-y-1 pl-1">
              {section.items.map((item, i) => (
                <li key={i} className="text-foreground text-sm">
                  • {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">{section.text}</p>
          )}
        </div>
      );
  }
}

function SectionHeader({ icon: Icon, title }: { icon: typeof Search; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b pb-1">
      <Icon className="text-muted-foreground h-4 w-4" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function EvaluationCard({
  emoji,
  status,
  criteria,
}: {
  emoji: string;
  status: string;
  criteria: string;
}) {
  const colorMap: Record<string, string> = {
    OK: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30',
    'Necesita atención':
      'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30',
    'Requiere profesional': 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30',
  };
  const textMap: Record<string, string> = {
    OK: 'text-green-800 dark:text-green-200',
    'Necesita atención': 'text-yellow-800 dark:text-yellow-200',
    'Requiere profesional': 'text-red-800 dark:text-red-200',
  };

  return (
    <div className={`rounded-lg border p-2.5 ${colorMap[status] ?? 'border-border bg-card'}`}>
      <div className="flex items-start gap-2">
        <span className="text-base leading-none">{emoji}</span>
        <div>
          <p className={`text-xs font-bold ${textMap[status] ?? 'text-foreground'}`}>{status}</p>
          <p className={`text-xs ${textMap[status] ?? 'text-muted-foreground'}`}>{criteria}</p>
        </div>
      </div>
    </div>
  );
}
