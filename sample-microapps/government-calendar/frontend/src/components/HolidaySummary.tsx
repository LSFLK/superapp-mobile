import React from 'react';

type Props = {
    events: HolidayEvent[];
    currentDate: Date;
    selectedDate: Date | null;
};

const HolidaySummary: React.FC<Props> = ({ events, currentDate, selectedDate }) => {
    if (selectedDate) {
        const pad = (n: number) => n.toString().padStart(2, '0');
        const dateStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
        const holiday = events.find((e) => dateStr >= e.start && dateStr < e.end);

        return (
            <div className="mt-10">
                <h4 className="text-sm font-medium text-stone-950 mb-2">
                    Holiday Details - {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h4>
                {holiday ? (
                    <div className="text-sm text-slate-400">
                        <p><strong>{holiday.summary}</strong></p>
                    </div>
                ) : (
                    <p className="text-xs text-slate-400">No holiday on this day.</p>
                )}
            </div>
        );
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);

    const holidaysThisMonth = events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate >= monthStart && eventDate < monthEnd;
    });

    return (
        <div className="mt-4">
            <h4 className="text-sm font-medium text-stone-950 mb-2">Holidays this month:</h4>
            {holidaysThisMonth.length > 0 ? (
                <ul className="text-xs text-slate-400 space-y-1">
                    {holidaysThisMonth.map(event => (
                        <li key={event.uid}>
                            {event.summary} - {new Date(event.start).getDate()}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-xs text-slate-400">No holidays this month.</p>
            )}
        </div>
    );
};

export default HolidaySummary;
