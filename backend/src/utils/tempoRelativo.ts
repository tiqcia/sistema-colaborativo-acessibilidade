// Transforma a data guardada no banco ("2026-11-24 15:30:00", em UTC) em um
// texto como "há 2 dias". O frontend mostra o campo "data" exatamente como
// recebe, por isso o texto já sai pronto daqui.
function pluralizar(quantidade: number, singular: string, plural: string): string {
  return `há ${quantidade} ${quantidade === 1 ? singular : plural}`;
}

export function tempoRelativo(dataDoBanco: string, agora: number = Date.now()): string {
  // O SQLite grava em UTC sem indicar o fuso; o "Z" avisa que é UTC.
  const instante = new Date(dataDoBanco.replace(' ', 'T') + 'Z').getTime();
  if (Number.isNaN(instante)) return '';

  const segundos = Math.floor((agora - instante) / 1000);
  if (segundos < 60) return 'agora mesmo'; // também cobre relógios levemente adiantados

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return pluralizar(minutos, 'minuto', 'minutos');

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return pluralizar(horas, 'hora', 'horas');

  const dias = Math.floor(horas / 24);
  if (dias < 7) return pluralizar(dias, 'dia', 'dias');
  if (dias < 30) return pluralizar(Math.floor(dias / 7), 'semana', 'semanas');
  if (dias < 365) return pluralizar(Math.floor(dias / 30), 'mês', 'meses');
  return pluralizar(Math.floor(dias / 365), 'ano', 'anos');
}
