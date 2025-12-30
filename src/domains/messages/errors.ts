export const getMessageErrorText = (code: number): string => {
  switch (code) {
    case 429:
      return  "⚠️**Rate Limit Exceeded**\n\nI'm receiving too many requests right now. Please wait a moment and try again."
     
    default:
      return "⚠️**Error**\n\nAn unexpected error occurred. Please try again."
  
  }
};
