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
  
export const getDaysUntilDeadline = (deadline: string | null): number => {
  // 期限が設定されていない場合は特別な値を返す
  if (!deadline || deadline.startsWith('2099-')) {
    return Infinity; // または大きな正の数（例：999）
  }
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};