import * as Haptics from 'expo-haptics';

export async function tapLight(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // simulator / haptics unavailable
  }
}

export async function tapSelect(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    // simulator / haptics unavailable
  }
}
