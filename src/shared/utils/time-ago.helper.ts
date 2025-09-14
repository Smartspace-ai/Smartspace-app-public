export const getTimeAgo = (date: Date | string): string => {
  const givenTime = new Date(date);
  const currentTime = new Date();

  const timeDifference = currentTime.getTime() - givenTime.getTime();

  const secondsAgo = Math.floor(timeDifference / 1000);
  const minutesAgo = Math.floor(secondsAgo / 60);
  const hoursAgo = Math.floor(minutesAgo / 60);
  const daysAgo = Math.floor(hoursAgo / 24);
  const monthsAgo = Math.floor(daysAgo / 30); // Approximate months as 30 days
  const yearsAgo = Math.floor(monthsAgo / 12);

  if (yearsAgo >= 1) {
    return yearsAgo === 1 ? '1 year ago' : `${yearsAgo} years ago`;
  } else if (monthsAgo >= 1) {
    return monthsAgo === 1 ? '1 month ago' : `${monthsAgo} months ago`;
  } else if (daysAgo >= 1) {
    return daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
  } else if (hoursAgo >= 1) {
    return hoursAgo === 1 ? '1 hour ago' : `${hoursAgo} hours ago`;
  } else if (minutesAgo >= 1) {
    return minutesAgo === 1 ? '1 minute ago' : `${minutesAgo} minutes ago`;
  } else if (secondsAgo <= 0) {
    return 'Just now';
  } else {
    return secondsAgo === 1 ? '1 second ago' : `${secondsAgo} seconds ago`;
  }
};

export default getTimeAgo;
