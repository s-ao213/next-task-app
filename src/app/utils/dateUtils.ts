export const formatDate = (dateString: string): string => {
  // 期限なしを表す特別な日付の場合
  if (!dateString || dateString.startsWith('2099-')) {
    return '期限なし';
  }
    
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
  
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
  
export const isBeforeDeadline = (deadline: string): boolean => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  return now < deadlineDate;
};
  
export const getDaysUntilDeadline = (deadline: string): number => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};