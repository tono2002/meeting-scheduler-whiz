const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const weekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();
const dayNum = (date: string) => Number(date.slice(8, 10));
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** "Mar 20" */
export const shortDay = (date: string) => `${SHORT[weekday(date)]} ${dayNum(date)}`;
/** "martes 20" */
export const longDay = (date: string) => `${WEEKDAYS[weekday(date)]} ${dayNum(date)}`;
/** "Martes 20" */
export const longDayCap = (date: string) => cap(longDay(date));
