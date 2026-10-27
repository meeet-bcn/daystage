// Copia de tus turnos en tu cuenta (tabla user_shift_plans, RLS: solo tú).

import type { ShiftPlan } from '@/data/shifts';
import { planFromJson } from '@/data/shift-sync';
import { supabase } from '@/data/supabase';

/** La copia de tu cuenta y cuándo se cambió (ms), o null si no hay. */
export async function fetchRemotePlan(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_shift_plans')
    .select('plan, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const plan = planFromJson(data.plan);
  return plan ? { plan, updatedAt: Date.parse(data.updated_at) } : null;
}

export async function pushPlan(userId: string, plan: ShiftPlan, updatedAt: number) {
  if (!supabase) return;
  const { error } = await supabase
    .from('user_shift_plans')
    .upsert({ user_id: userId, plan, updated_at: new Date(updatedAt).toISOString() });
  if (error) throw error;
}
