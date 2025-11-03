declare interface HolidayEvent {
  uid: string;
  summary: string;
  categories: string[];
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD (exclusive)
}
