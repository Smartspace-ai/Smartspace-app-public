import { MentionUser } from '@/models/mention-user';
import {
  Avatar,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Popover,
  TextField,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { getCaretCoordinates } from './textarea-caret';

interface PopoverPosition {
  top: number;
  left: number;
  direction: 'above' | 'below';
}

interface MentionInputProps {
  value: { plain: string; withMentions: string };
  onChange: React.Dispatch<
    React.SetStateAction<{
      plain: string;
      withMentions: string;
    }>
  >;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  users: MentionUser[];
  mentionList: MentionUser[];
  setMentionList: React.Dispatch<React.SetStateAction<MentionUser[]>>;
}

export const MentionInput = (props: MentionInputProps) => {
  const { value, onChange, setSearchTerm, users, mentionList, setMentionList } =
    props;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [selectIndex, setSelectIndex] = useState(0);
  const [openPopover, setOpenPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition>({
    top: 0,
    left: 0,
    direction: 'above',
  });

  const closePopover = () => {
    setOpenPopover(false);
    setSelectIndex(0);
    setPopoverPosition({ top: 0, left: 0, direction: 'above' });
  };

  const updateAtAnchorPosition = () => {
    const el = inputRef.current;
    if (!el) return;

    const caret = el.selectionEnd ?? 0;
    const atIndex = el.value.lastIndexOf('@', caret - 1);
    if (atIndex === -1) return;

    const coords = getCaretCoordinates(el, atIndex);
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight) || 24;

    const topInViewport = rect.top + coords.top - el.scrollTop;
    const leftInViewport = rect.left + coords.left - el.scrollLeft;

    const direction: 'above' | 'below' =
      window.innerHeight - topInViewport < 300 ? 'above' : 'below';

    setPopoverPosition({
      top: direction === 'above' ? topInViewport : topInViewport + lineHeight,
      left: leftInViewport,
      direction,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const lastAt = newValue.lastIndexOf('@');
    if (lastAt === -1) {
      setOpenPopover(false);
    } else {
      const afterAt = newValue.slice(lastAt + 1);
      setSearchTerm(afterAt);
      setOpenPopover(true);
      updateAtAnchorPosition();
    }

    const { withMentions, mentionList: newMentionList } =
      buildWithMentionsFromPlain(newValue, mentionList);
    onChange({ plain: newValue, withMentions });
    setMentionList(newMentionList);
  };

  const handleUserSelect = (user: MentionUser) => {
    if (inputRef.current) {
      const caretPosition = inputRef.current.selectionStart ?? 0;
      const recentAt = value.plain.lastIndexOf('@', caretPosition - 1);
      const newPlainValue =
        value.plain.slice(0, recentAt + 1) +
        user.displayName +
        value.plain.slice(caretPosition);

      const updatedMentionList = mentionList.some((m) => m.id === user.id)
        ? mentionList
        : [...mentionList, user];

      const { withMentions, mentionList: newMentionList } =
        buildWithMentionsFromPlain(newPlainValue, updatedMentionList);

      onChange({ plain: newPlainValue, withMentions });
      setMentionList(newMentionList);
      closePopover();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (openPopover) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selectIndex < users.length - 1) {
          setSelectIndex(selectIndex + 1);
        } else {
          setSelectIndex(0);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectIndex > 0) {
          setSelectIndex(selectIndex - 1);
        } else {
          setSelectIndex(users.length - 1);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleUserSelect(users[selectIndex]);
      }
    }
    if (e.key === 'Backspace') {
      const el = inputRef.current;
      if (!el) return;
      const selectionStart = el.selectionStart ?? 0;
      const selectionEnd = el.selectionEnd ?? 0;
      if (selectionStart !== selectionEnd) return;
      const caret = selectionStart;
      if (caret === 0) return;
      const text = value.plain;
      const atIndex = text.lastIndexOf('@', caret - 1);
      if (atIndex === -1) return;
      const candidate = text.slice(atIndex + 1, caret);
      if (!candidate) return;
      const matchedUser = mentionList.find((u) => u.displayName === candidate);
      if (!matchedUser) return;
      const nextChar = text.charAt(caret);
      const boundaryOkay = caret === text.length || /\W/.test(nextChar);
      if (!boundaryOkay) return;

      e.preventDefault();
      const newPlain = text.slice(0, atIndex) + text.slice(caret);
      const { withMentions, mentionList: newMentionList } =
        buildWithMentionsFromPlain(newPlain, mentionList);

      setMentionList(newMentionList);
      onChange({ plain: newPlain, withMentions });

      requestAnimationFrame(() => {
        const pos = atIndex;
        inputRef.current?.setSelectionRange(pos, pos);
      });
    }
  };

  //this should keep the popover positioned correctly if the window scrolls or the textarea scrolls
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const recalc = () => {
      if (openPopover) updateAtAnchorPosition();
    };

    el.addEventListener('scroll', recalc, { passive: true });
    window.addEventListener('scroll', recalc, { passive: true });
    window.addEventListener('resize', recalc);

    return () => {
      el.removeEventListener('scroll', recalc);
      window.removeEventListener('scroll', recalc);
      window.removeEventListener('resize', recalc);
    };
  }, [openPopover]);

  return (
    <>
      <TextField
        inputRef={inputRef}
        minRows={4}
        maxRows={10}
        multiline
        fullWidth
        value={value.plain}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        sx={{
          '& .MuiInputBase-root': {
            px: 1,
            py: 0.5,
          },
        }}
      />
      <Popover
        disablePortal
        disableAutoFocus={true}
        open={
          users.length > 0 &&
          openPopover &&
          popoverPosition.top !== 0 &&
          popoverPosition.left !== 0
        }
        onClose={closePopover}
        anchorReference="anchorPosition"
        anchorPosition={popoverPosition}
        anchorOrigin={{
          vertical: popoverPosition.direction === 'above' ? 'top' : 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: popoverPosition.direction === 'above' ? 'bottom' : 'top',
          horizontal: 'left',
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <List>
          {users.map((user, index) => (
            <ListItemButton
              key={user.id}
              selected={index === selectIndex}
              onClick={(e) => {
                e.stopPropagation();
                handleUserSelect(user);
              }}
            >
              <ListItemAvatar>
                <Avatar src={user.display} />
              </ListItemAvatar>
              <ListItemText primary={user.displayName} />
            </ListItemButton>
          ))}
        </List>
      </Popover>
    </>
  );
};

const buildWithMentionsFromPlain = (
  plain: string,
  list: MentionUser[],
): { withMentions: string; mentionList: MentionUser[] } => {
  if (!list || list.length === 0)
    return { withMentions: plain, mentionList: [] };

  const displayNameToId = new Map(list.map((u) => [u.displayName, u.id]));
  const alternation = list
    .map((u) => u.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
    .join('|');

  const mentionRegex = new RegExp(`@(${alternation})(?=$|\\W)`, 'g');

  const newWithMentions = plain.replace(
    mentionRegex,
    (_match, displayName: string) => {
      const id = displayNameToId.get(displayName);
      return id ? `@[${displayName}](${id})` : _match;
    },
  );

  const mentionedIds = new Set(
    [...newWithMentions.matchAll(/@\[[^\]]+\]\(([^)]+)\)/g)].map((m) => m[1]),
  );
  const newMentionList = list.filter((user) => mentionedIds.has(user.id));

  return {
    withMentions: newWithMentions,
    mentionList: newMentionList as MentionUser[],
  };
};
