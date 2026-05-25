const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function getEmailError(email: string): string | null {
  const value = email.trim();
  if (value.length === 0) return 'Ingresa tu correo electronico.';
  if (!validateEmail(value)) return 'El correo no es valido.';
  return null;
}

export function getPasswordStrengthError(password: string): string | null {
  if (password.length === 0) return 'Ingresa una contraseña.';
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(password)) return 'Debe incluir al menos una letra mayuscula.';
  if (!/[a-z]/.test(password)) return 'Debe incluir al menos una letra minuscula.';
  if (!/[0-9]/.test(password)) return 'Debe incluir al menos un numero.';
  return null;
}

export function getConfirmPasswordError(
  password: string,
  confirm: string,
): string | null {
  if (confirm.length === 0) return 'Confirma tu contraseña.';
  if (password !== confirm) return 'Las contraseñas no coinciden.';
  return null;
}

export function getDisplayNameError(name: string): string | null {
  const value = name.trim();
  if (value.length === 0) return 'Ingresa tu nombre.';
  if (value.length < 2) return 'El nombre es demasiado corto.';
  if (value.length > 60) return 'El nombre es demasiado largo.';
  return null;
}

export interface EventFormInput {
  title: string;
  description: string;
  locationLabel: string;
  startsAt: Date | null;
  endsAt: Date | null;
  capacity: string;
}

export function validateEventForm(input: EventFormInput): string[] {
  const errors: string[] = [];
  const title = input.title.trim();
  const description = input.description.trim();
  const location = input.locationLabel.trim();

  if (title.length < 3) errors.push('El titulo debe tener al menos 3 caracteres.');
  if (title.length > 80) errors.push('El titulo no puede exceder 80 caracteres.');
  if (description.length < 10)
    errors.push('La descripcion debe tener al menos 10 caracteres.');
  if (description.length > 1000)
    errors.push('La descripcion no puede exceder 1000 caracteres.');
  if (location.length < 3) errors.push('Especifica una ubicacion valida.');

  if (!input.startsAt) {
    errors.push('Selecciona la fecha y hora de inicio.');
  } else if (input.startsAt.getTime() <= Date.now()) {
    errors.push('La fecha de inicio debe ser futura.');
  }

  if (!input.endsAt) {
    errors.push('Selecciona la fecha y hora de fin.');
  } else if (input.startsAt && input.endsAt.getTime() <= input.startsAt.getTime()) {
    errors.push('La fecha de fin debe ser posterior al inicio.');
  }

  if (input.capacity.trim().length > 0) {
    const capacity = Number(input.capacity);
    if (!Number.isInteger(capacity) || capacity <= 0) {
      errors.push('La capacidad debe ser un numero entero positivo.');
    }
  }

  return errors;
}

export function getCommentTextError(text: string): string | null {
  const value = text.trim();
  if (value.length === 0) return 'Escribe un comentario.';
  if (value.length > 500) return 'El comentario no puede exceder 500 caracteres.';
  return null;
}

export function getRatingStarsError(stars: number): string | null {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return 'La calificacion debe ser entre 1 y 5 estrellas.';
  }
  return null;
}
