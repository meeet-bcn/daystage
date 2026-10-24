import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useApp } from '@/data/app-context';

export default function TabLayout() {
  const { welcomeSeen } = useApp();
  // La primera vez (o tras "Borrar perfil y empezar de nuevo"), la bienvenida
  if (!welcomeSeen) return <Redirect href="/welcome" />;
  return <AppTabs />;
}
