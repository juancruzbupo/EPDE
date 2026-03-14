import type { createTaskSchema, TaskTemplate } from '@epde/shared';
import { useCallback, useMemo } from 'react';
import type { UseFormSetValue } from 'react-hook-form';
import type { z } from 'zod';

import { useCategories } from '@/hooks/use-categories';
import { useCategoryTemplates } from '@/hooks/use-category-templates';

type TaskFormValues = z.input<typeof createTaskSchema>;

export function useTaskTemplates(
  watchedCategoryId: string | undefined,
  setValue: UseFormSetValue<TaskFormValues>,
) {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: categoryTemplates } = useCategoryTemplates();

  const taskTemplates = useMemo(() => {
    if (!watchedCategoryId || !categories || !categoryTemplates) return [];
    const category = categories.find((c) => c.id === watchedCategoryId);
    if (!category?.categoryTemplateId) return [];
    const match = categoryTemplates.find((ct) => ct.id === category.categoryTemplateId);
    return match?.tasks ?? [];
  }, [watchedCategoryId, categories, categoryTemplates]);

  const applyTemplate = useCallback(
    (template: TaskTemplate) => {
      setValue('name', template.name);
      setValue('taskType', template.taskType as TaskFormValues['taskType']);
      setValue(
        'professionalRequirement',
        template.professionalRequirement as TaskFormValues['professionalRequirement'],
      );
      setValue('priority', template.priority as TaskFormValues['priority']);
      setValue('recurrenceType', template.recurrenceType as TaskFormValues['recurrenceType']);
      if (template.recurrenceMonths) setValue('recurrenceMonths', template.recurrenceMonths);
      setValue('technicalDescription', template.technicalDescription ?? '');
      setValue('estimatedDurationMinutes', template.estimatedDurationMinutes ?? undefined);
    },
    [setValue],
  );

  return { categories, categoriesLoading, taskTemplates, applyTemplate };
}
