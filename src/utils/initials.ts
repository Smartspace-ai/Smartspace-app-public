export function getInitials(name: string): string {
  if (name === 'You') {
    return 'Y';
  }

  name = name || '';
  const nameParts = name.split(' ');
  let initials = '';

  if (nameParts.length === 1) {
    initials = name.substring(0, 2);
  } else {
    initials = nameParts[0][0] + nameParts[nameParts.length - 1][0];
  }

  return initials.toUpperCase();
}
