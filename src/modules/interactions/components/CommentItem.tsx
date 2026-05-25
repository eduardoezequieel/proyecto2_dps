import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { CornerDownRight, Pencil, Trash2 } from 'lucide-react-native';
import { Avatar, Input, Text } from '../../../shared/components';
import { colors, radii, spacing } from '../../../shared/theme';
import { formatRelativeTime } from '../../../shared/utils/formatters';
import { getCommentTextError } from '../../../shared/utils/validators';
import { useInteractionsStore } from '../stores/useInteractionsStore';
import type { EventComment } from '../types';

interface CommentItemProps {
  comment: EventComment;
  currentUid: string | null;
  organizerUid: string | null;
  replies?: EventComment[];
  onReply?: (commentId: string, authorName: string) => void;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  currentUid,
  organizerUid,
  replies = [],
  onReply,
  isReply = false,
}: CommentItemProps): React.ReactElement {
  const updateComment = useInteractionsStore((state) => state.updateComment);
  const removeComment = useInteractionsStore((state) => state.removeComment);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);
  const [saving, setSaving] = useState(false);

  const isAuthor = currentUid !== null && comment.authorUid === currentUid;
  const isAuthorOrganizer =
    organizerUid !== null && comment.authorUid === organizerUid;

  const handleSave = async (): Promise<void> => {
    const error = getCommentTextError(draft);
    if (error) {
      Alert.alert('Comentario invalido', error);
      return;
    }
    setSaving(true);
    const ok = await updateComment(comment.eventId, comment.id, draft);
    setSaving(false);
    if (ok) setEditing(false);
  };

  const handleDelete = (): void => {
    Alert.alert('Eliminar comentario', '¿Seguro que quieres eliminarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => void removeComment(comment.eventId, comment.id),
      },
    ]);
  };

  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      <View style={styles.header}>
        <Avatar name={comment.authorName} size="sm" />
        <View style={styles.headerText}>
          <View style={styles.authorRow}>
            <Text
              variant="bodyBold"
              color="textPrimary"
              numberOfLines={1}
              style={styles.authorName}
            >
              {comment.authorName}
            </Text>
            {isAuthorOrganizer ? (
              <View style={styles.organizerBadge}>
                <Text variant="label" color="warning">
                  Organizador
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="caption" color="textMuted">
            {formatRelativeTime(comment.createdAt)}
            {comment.editedAt ? ' (editado)' : ''}
          </Text>
        </View>
      </View>
      {editing ? (
        <View style={styles.editor}>
          <Input value={draft} onChangeText={setDraft} multiline editable={!saving} />
          <View style={styles.actions}>
            <Pressable onPress={() => setEditing(false)} hitSlop={6}>
              <Text variant="caption" color="textSecondary">
                Cancelar
              </Text>
            </Pressable>
            <View style={{ width: spacing.md }} />
            <Pressable onPress={() => void handleSave()} hitSlop={6} disabled={saving}>
              <Text variant="caption" color="accent">
                Guardar
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Text variant="body" color="textPrimary" style={styles.text}>
          {comment.text}
        </Text>
      )}
      {!editing ? (
        <View style={styles.toolbar}>
          {!isReply && onReply && currentUid !== null ? (
            <Pressable
              onPress={() => onReply(comment.id, comment.authorName)}
              hitSlop={6}
              style={styles.replyButton}
            >
              <CornerDownRight size={14} color={colors.textSecondary} />
              <Text variant="caption" color="textSecondary" style={styles.replyButtonLabel}>
                Responder
              </Text>
            </Pressable>
          ) : null}
          {isAuthor ? (
            <View style={styles.authorActions}>
              <Pressable onPress={() => setEditing(true)} hitSlop={6} style={styles.toolButton}>
                <Pencil size={14} color={colors.textSecondary} />
              </Pressable>
              <Pressable onPress={handleDelete} hitSlop={6} style={styles.toolButton}>
                <Trash2 size={14} color={colors.danger} />
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
      {replies.length > 0 ? (
        <View style={styles.replies}>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUid={currentUid}
              organizerUid={organizerUid}
              isReply
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  replyContainer: {
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    borderBottomWidth: 0,
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  authorName: { flexShrink: 1 },
  organizerBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radii.subtle,
    borderWidth: 1,
    borderColor: colors.warning,
    marginLeft: spacing.sm,
  },
  text: { marginTop: spacing.xs },
  editor: { marginTop: spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.xs },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  replyButton: { flexDirection: 'row', alignItems: 'center' },
  replyButtonLabel: { marginLeft: spacing.xs },
  authorActions: { flexDirection: 'row' },
  toolButton: { paddingHorizontal: spacing.sm },
  replies: { marginTop: spacing.xs },
});
