import React from 'react';
import { Button } from '../../../shared/components';

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function GoogleSignInButton({
  onPress,
  loading = false,
  disabled = false,
}: GoogleSignInButtonProps): React.ReactElement {
  return (
    <Button
      label="Continuar con Google"
      variant="ghost"
      onPress={onPress}
      loading={loading}
      disabled={disabled}
    />
  );
}
