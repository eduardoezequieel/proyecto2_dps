export type AsyncResult<TData> =
  | { success: true; data: TData }
  | { success: false; error: string; code: string };

export function ok<TData>(data: TData): AsyncResult<TData> {
  return { success: true, data };
}

export function fail(error: string, code: string): AsyncResult<never> {
  return { success: false, error, code };
}
