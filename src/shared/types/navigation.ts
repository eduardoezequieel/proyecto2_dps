export interface AuthRoutes {
  '/(auth)/login': undefined;
  '/(auth)/register': undefined;
}

export interface AppRoutes {
  '/(app)': undefined;
  '/(app)/my-rsvps': undefined;
  '/(app)/my-events': undefined;
  '/(app)/history': undefined;
  '/(app)/profile': undefined;
}

export interface EventRoutes {
  '/events/create': undefined;
  '/events/[id]': { id: string };
  '/events/[id]/edit': { id: string };
  '/events/[id]/comments': { id: string };
}
