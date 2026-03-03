import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TaskNotesService } from './task-notes.service';
import { TasksRepository } from './tasks.repository';
import { TaskLogsRepository } from './task-logs.repository';
import { TaskNotesRepository } from './task-notes.repository';

const mockTasksRepository = {
  findWithDetails: jest.fn(),
};

const mockTaskLogsRepository = {
  findByTaskId: jest.fn(),
};

const mockTaskNotesRepository = {
  findByTaskId: jest.fn(),
  createForTask: jest.fn(),
};

describe('TaskNotesService', () => {
  let service: TaskNotesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskNotesService,
        { provide: TasksRepository, useValue: mockTasksRepository },
        { provide: TaskLogsRepository, useValue: mockTaskLogsRepository },
        { provide: TaskNotesRepository, useValue: mockTaskNotesRepository },
      ],
    }).compile();

    service = module.get<TaskNotesService>(TaskNotesService);
  });

  describe('getTaskDetail', () => {
    it('should return task with details', async () => {
      const taskId = 'task-1';
      const taskWithDetails = {
        id: taskId,
        name: 'Inspección',
        taskLogs: [],
        taskNotes: [],
        category: { id: 'cat-1', name: 'Plomería' },
      };

      mockTasksRepository.findWithDetails.mockResolvedValue(taskWithDetails);

      const result = await service.getTaskDetail(taskId);

      expect(mockTasksRepository.findWithDetails).toHaveBeenCalledWith(taskId);
      expect(result).toEqual(taskWithDetails);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockTasksRepository.findWithDetails.mockResolvedValue(null);

      await expect(service.getTaskDetail('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTaskLogs', () => {
    it('should return task logs', async () => {
      const taskId = 'task-1';
      const logs = [
        { id: 'log-1', taskId, result: 'OK', completedAt: new Date() },
        { id: 'log-2', taskId, result: 'OK_WITH_OBSERVATIONS', completedAt: new Date() },
      ];

      mockTaskLogsRepository.findByTaskId.mockResolvedValue(logs);

      const result = await service.getTaskLogs(taskId);

      expect(mockTaskLogsRepository.findByTaskId).toHaveBeenCalledWith(taskId);
      expect(result).toEqual(logs);
    });
  });

  describe('addTaskNote', () => {
    it('should create note for task', async () => {
      const taskId = 'task-1';
      const userId = 'user-1';
      const dto = { content: 'Esta tarea requiere atención especial' };
      const createdNote = {
        id: 'note-1',
        taskId,
        authorId: userId,
        content: dto.content,
        createdAt: new Date(),
        author: { id: userId, name: 'Admin' },
      };

      mockTaskNotesRepository.createForTask.mockResolvedValue(createdNote);

      const result = await service.addTaskNote(taskId, userId, dto);

      expect(mockTaskNotesRepository.createForTask).toHaveBeenCalledWith(
        taskId,
        userId,
        dto.content,
      );
      expect(result).toEqual(createdNote);
    });
  });

  describe('getTaskNotes', () => {
    it('should return task notes', async () => {
      const taskId = 'task-1';
      const notes = [
        { id: 'note-1', taskId, content: 'Primera nota', author: { id: 'user-1', name: 'Admin' } },
        { id: 'note-2', taskId, content: 'Segunda nota', author: { id: 'user-2', name: 'User' } },
      ];

      mockTaskNotesRepository.findByTaskId.mockResolvedValue(notes);

      const result = await service.getTaskNotes(taskId);

      expect(mockTaskNotesRepository.findByTaskId).toHaveBeenCalledWith(taskId);
      expect(result).toEqual(notes);
    });
  });
});
