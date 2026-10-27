// Los tests corren siempre en la zona de Madrid, sea cual sea la del equipo:
// los de turnos comprueban los cambios de hora de marzo y octubre.
module.exports = () => {
  process.env.TZ = 'Europe/Madrid';
};
