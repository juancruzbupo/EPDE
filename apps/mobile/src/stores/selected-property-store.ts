import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

/**
 * Preferencia de "propiedad activa" para clientes multi-propiedad (persona
 * Jorge, inversor con 2-3 casas/deptos). En la app mobile el home y
 * varias pantallas asumen una sola propiedad — con este store podemos
 * sticky-selectearla y persistir la elección entre sesiones.
 *
 * Solo guardamos el id. La lista de propiedades y datos se siguen
 * obteniendo vía React Query (`useProperties`, `useProperty(id)`).
 *
 * Si el id persistido ya no existe (propiedad borrada o cliente cambió de
 * cuenta), el consumer tiene que resolver el fallback — típicamente la
 * primera propiedad de la lista activa.
 */

const STORAGE_KEY = 'epde-selected-property-id';

interface SelectedPropertyState {
  selectedPropertyId: string | null;
  hydrated: boolean;
  setSelectedPropertyId: (id: string | null) => void;
  loadSavedSelection: () => Promise<void>;
}

export const useSelectedPropertyStore = create<SelectedPropertyState>((set) => ({
  selectedPropertyId: null,
  hydrated: false,
  setSelectedPropertyId: (id) => {
    set({ selectedPropertyId: id });
    if (id) {
      AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  },
  loadSavedSelection: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      set({ selectedPropertyId: saved, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));
