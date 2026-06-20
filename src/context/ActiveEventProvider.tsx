/**
 * Contexto del "evento activo".
 *
 * Guarda el evento al que se asociarán por defecto las nuevas consumiciones y
 * publicaciones. Lo fija el usuario desde el selector del Registrar o desde el
 * detalle de un evento ("registrar aquí"). Es estado en memoria (no persiste).
 */
import React, { createContext, useContext, useMemo, useState } from 'react';

export interface ActiveEvent {
  id: string;
  nombre: string;
}

interface ActiveEventContextValue {
  activeEvent: ActiveEvent | null;
  setActiveEvent: (event: ActiveEvent | null) => void;
}

const ActiveEventContext = createContext<ActiveEventContextValue | undefined>(
  undefined,
);

export function ActiveEventProvider({ children }: { children: React.ReactNode }) {
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);

  const value = useMemo(
    () => ({ activeEvent, setActiveEvent }),
    [activeEvent],
  );

  return (
    <ActiveEventContext.Provider value={value}>
      {children}
    </ActiveEventContext.Provider>
  );
}

export function useActiveEvent(): ActiveEventContextValue {
  const ctx = useContext(ActiveEventContext);
  if (!ctx) {
    throw new Error('useActiveEvent debe usarse dentro de <ActiveEventProvider>.');
  }
  return ctx;
}
