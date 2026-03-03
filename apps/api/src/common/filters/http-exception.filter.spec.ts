import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { GlobalExceptionFilter } from './http-exception.filter';

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
}));

function createMockHost(mockJson: jest.Mock): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => ({
        status: jest.fn().mockReturnValue({ json: mockJson }),
      }),
      getRequest: () => ({}),
    }),
    getArgs: () => [],
    getArgByIndex: () => ({}),
    switchToRpc: () => ({} as never),
    switchToWs: () => ({} as never),
    getType: () => 'http' as const,
  } as unknown as ArgumentsHost;
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockJson: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockJson = jest.fn();
    host = createMockHost(mockJson);
    jest.clearAllMocks();
  });

  it('handles HttpException with string response', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    filter.catch(exception, host);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, message: 'Not Found' }),
    );
  });

  it('handles HttpException with object response containing validation array', () => {
    const exception = new HttpException(
      { message: ['field is required', 'email is invalid'], error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(exception, host);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Error de validación',
        details: { validation: ['field is required', 'email is invalid'] },
      }),
    );
  });

  it('reports 5xx HttpExceptions to Sentry', () => {
    const exception = new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    filter.catch(exception, host);

    expect(Sentry.captureException).toHaveBeenCalledWith(exception);
  });

  it('handles non-HttpException errors as 500 and reports to Sentry', () => {
    const exception = new Error('unexpected crash');
    filter.catch(exception, host);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Error interno del servidor',
      }),
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(exception);
  });
});
