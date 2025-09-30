import React from 'react';

// Holiday type constants
const HOLIDAY_TYPES = {
  FULL: "holiday_type_1", // Public, Bank, Mercantile
  BANK: "holiday_type_2", // Public, Bank
};

const CalendarGrid = ({ calendarDays, getHolidayType, selectedDate, setSelectedDate }) => {
  return (
    <>
      {/* Weekday names */}
      <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 text-center mt-2">
        {calendarDays.map((date, idx) => {
          if (!date) return <div key={idx} className="p-2"></div>;

          const type = getHolidayType(date);
          const dayNum = date.getDate();
          const todayStr = new Date().toDateString();
          const isToday = date.toDateString() === todayStr;
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

          let className =
            "w-7 h-7 flex items-center justify-center mx-auto rounded-lg text-md text-stone-950 cursor-pointer";

          if (isToday) {
            className += " bg-blue-500 text-white shadow-sm font-semibold";
          }
          if (type === HOLIDAY_TYPES.FULL) className += " bg-yellow-500";
          else if (type === HOLIDAY_TYPES.BANK) className += " bg-yellow-200";
          if (isSelected) className += " ring-2 ring-stone-600";

          return (
            <div key={idx} className="p-1">
              <div className={className} onClick={() => setSelectedDate(date)}>
                {dayNum}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default CalendarGrid;