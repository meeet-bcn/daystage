/** Perfil del usuario. Aún no hay cuentas ni backend: vive en memoria y empieza vacío. */
export type Profile = {
  nick: string;
  name: string;
  bio: string;
  /** URI de la foto de perfil, o '' si no hay. */
  photo: string;
  followers: number;
  following: number;
};

export const EMPTY_PROFILE: Profile = {
  nick: '',
  name: '',
  bio: '',
  photo: '',
  followers: 0,
  following: 0,
};
