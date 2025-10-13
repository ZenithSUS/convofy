# TODO: Fix Logical Bugs in Message Editing

## Tasks

- [x] Update `app/(views)/chat/components/cards/message-card.tsx`: Add `isEditing` to `useEffect` dependencies and modify the logic to hide options when editing.
- [x] Update `app/(views)/chat/components/message-edit.tsx`: Change `Textarea` className to `w-full max-w-sm` and add `maxLength={500}` to prevent overflow.
- [x] Fix `isMessageChanged` not triggering in `app/(views)/chat/components/message-edit.tsx`: Make the dependency reactive by using `watch` instead of `getValues`.
