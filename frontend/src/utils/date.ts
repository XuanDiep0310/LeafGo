import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Convert UTC string -> local time để HIỂN THỊ
 */
export const formatUtcToLocal = (
  utcString: string,
  format = "DD/MM/YYYY HH:mm:ss"
) => {
  if (!utcString) return "";
  return dayjs.utc(utcString).local().format(format);
};
