import { create } from 'zustand';
import { Profile, getAllProfiles, ensureDefaultProfile } from '@/lib/db';

interface ProfileState {
  profiles: Profile[];
  activeProfileId: number | null;
  currentPageIndex: number;  // Track the current bank/page
  isLoading: boolean;
  error: string | null;
  fetchProfiles: () => Promise<void>;
  setActiveProfileId: (id: number | null) => void;
  setCurrentPageIndex: (index: number) => void;  // Add method to change banks
  // TODO: Add actions for creating, updating, deleting profiles later
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  currentPageIndex: 0,  // Default to first bank
  isLoading: true,
  error: null,

  fetchProfiles: async () => {
    set({ isLoading: true, error: null });
    try {
      // Ensure the default profile exists before fetching
      await ensureDefaultProfile();
      const profiles = await getAllProfiles();
      set({ profiles, isLoading: false });

      // If no active profile is set, or the active one is no longer valid,
      // set the first profile as active (preferring the default if it exists)
      const currentActiveId = get().activeProfileId;
      const activeProfileExists = profiles.some(p => p.id === currentActiveId);

      if (!currentActiveId || !activeProfileExists) {
        const defaultProfile = profiles.find(p => p.name === 'Default Local Profile');
        const firstProfileId = defaultProfile?.id ?? profiles[0]?.id ?? null;
        set({ activeProfileId: firstProfileId });
        console.log(`Setting active profile to: ${firstProfileId}`);
      }

    } catch (err) {
      console.error("Failed to fetch profiles:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      set({ error: `Failed to load profiles: ${errorMessage}`, isLoading: false });
    }
  },

  setActiveProfileId: (id: number | null) => {
    console.log(`Attempting to set active profile ID to: ${id}`);
    const profileExists = get().profiles.some(p => p.id === id);
    if (id === null || profileExists) {
      set({ activeProfileId: id });
      console.log(`Active profile ID set to: ${id}`);
      // TODO: Trigger loading of pad configurations for the new active profile
    } else {
        console.warn(`Profile with ID ${id} not found in the store. Active profile not changed.`);
    }
  },
  
  setCurrentPageIndex: (index: number) => {
    // Ensure index is within valid bounds (0-9 for 10 banks)
    if (index >= 0 && index <= 9) {
      console.log(`Switching to bank/page: ${index}`);
      set({ currentPageIndex: index });
    } else {
      console.warn(`Invalid bank/page index: ${index}. Must be between 0-9.`);
    }
  },
}));

// Initial fetch of profiles when the store is initialized
// This ensures data is loaded when the app starts
useProfileStore.getState().fetchProfiles();
