export interface MessageError {
  code: number;
  message: string;
  title?: string;
  isRetryable?: boolean;
}

export const getErrorMessage = (code: number): MessageError => {
  switch (code) {
    case 429:
      return {
        code: 429,
        title: 'Rate Limit Exceeded',
        message: 'I\'m receiving too many requests right now. Please wait a moment and try again.',
        isRetryable: true,
      };
    case 500:
      return {
        code: 500,
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
        isRetryable: true,
      };
    case 404:
      return {
        code: 404,
        title: 'Not Found',
        message: 'The requested resource could not be found.',
        isRetryable: false,
      };
    default:
      return {
        code,
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
        isRetryable: true,
      };
  }
};

export const formatErrorMessage = (error: MessageError): string => {
  const emoji = error.isRetryable ? '⚠️' : '❌';
  const title = error.title || 'Error';

  return `${emoji} ${title}: ${error.message}`;
};
