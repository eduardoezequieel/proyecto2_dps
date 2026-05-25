import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Button, Input, Text } from '../../../shared/components';
import { colors, spacing } from '../../../shared/theme';
import { getCommentTextError } from '../../../shared/utils/validators';
import { useInteractionsStore } from '../stores/useInteractionsStore';

interface CommentInputProps {
  eventId: string;
  authorUid: string;
  authorName: string;
  replyingTo?: { id: string; name: string } | null;
  onCancelReply?: () => void;
}

export function CommentInput({
  eventId,
  authorUid,
  authorName,
  replyingTo = null,
  onCancelReply,
}: CommentInputProps): React.ReactElement {
  const postComment = useInteractionsStore((state) => state.postComment);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    const error = getCommentTextError(text);
    if (error) {
      Alert.alert('Comentario invalido', error);
      return;
    }
    setSubmitting(true);
    const ok = await postComment({
      eventId,
      authorUid,
      authorName,
      text,
      parentCommentId: replyingTo?.id ?? null,
    });
    setSubmitting(false);
    if (ok) {
      setText('');
      if (replyingTo && onCancelReply) onCancelReply();
    }
  };

  return (
    <View style={styles.container}>
      {replyingTo ? (
        <View style={styles.replyBanner}>
          <Text variant="caption" color="textSecondary" style={styles.replyText}>
            Respondiendo a{' '}
            <Text variant="caption" color="textPrimary">
              {replyingTo.name}
            </Text>
          </Text>
          {onCancelReply ? (
            <Pressable onPress={onCancelReply} hitSlop={6}>
              <Text variant="caption" color="danger">
                Cancelar
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <Input
        placeholder={replyingTo ? 'Escribe tu respuesta...' : 'Escribe un comentario...'}
        value={text}
        onChangeText={setText}
        multiline
        editable={!submitting}
      />
      <Button
        label={replyingTo ? 'Responder' : 'Publicar'}
        onPress={handleSubmit}
        loading={submitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.md },
  replyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
    backgroundColor: colors.accentSubtle,
  },
  replyText: { flex: 1 },
});
