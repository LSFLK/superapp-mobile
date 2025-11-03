const Legend: React.FC = () => {
    return (
        <div className="flex flex-col gap-2 mt-4 text-sm">
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 inline-block rounded"></span>
                <span className="text-xs text-slate-400">Today</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-200 inline-block rounded"></span>
                <span className="text-xs text-slate-400">Public, Bank Holidays</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 inline-block rounded"></span>
                <span className="text-xs text-slate-400">
                    Public, Bank, Mercantile Holidays
                </span>
            </div>
        </div>
    );
};

export default Legend;
