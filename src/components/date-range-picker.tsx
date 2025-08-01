'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<DateRange>(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // value prop이 변경될 때 selectedRange 동기화
  useEffect(() => {
    setSelectedRange(value);
  }, [value]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDisplayText = () => {
    if (!selectedRange.startDate && !selectedRange.endDate) {
      return t('custom_range');
    }
    if (selectedRange.startDate && !selectedRange.endDate) {
      return `${formatDate(selectedRange.startDate)} ~`;
    }
    if (selectedRange.startDate && selectedRange.endDate) {
      return `${formatDate(selectedRange.startDate)} ~ ${formatDate(selectedRange.endDate)}`;
    }
    return t('custom_range');
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSameDay = (date1: Date, date2: Date | null) => {
    if (!date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const isInRange = (date: Date) => {
    if (!selectedRange.startDate || !selectedRange.endDate) return false;
    return date >= selectedRange.startDate && date <= selectedRange.endDate;
  };

  const isRangeStart = (date: Date) => {
    return selectedRange.startDate && isSameDay(date, selectedRange.startDate);
  };

  const isRangeEnd = (date: Date) => {
    return selectedRange.endDate && isSameDay(date, selectedRange.endDate);
  };

  const handleDateClick = (date: Date) => {
    if (!selectedRange.startDate || (selectedRange.startDate && selectedRange.endDate)) {
      // 새로운 범위 시작
      setSelectedRange({ startDate: date, endDate: null });
    } else if (selectedRange.startDate && !selectedRange.endDate) {
      // 범위 완성
      if (date < selectedRange.startDate) {
        setSelectedRange({ startDate: date, endDate: selectedRange.startDate });
      } else {
        setSelectedRange({ startDate: selectedRange.startDate, endDate: date });
      }
    }
  };

  const handleApply = () => {
    onChange(selectedRange);
    setIsOpen(false);
  };

  const handleClear = () => {
    const emptyRange = { startDate: null, endDate: null };
    setSelectedRange(emptyRange);
    onChange(emptyRange);
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const today = new Date();
    
    const days = [];
    const weekDays = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];

    // 요일 헤더
    days.push(
      <div key="header" className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
      </div>
    );

    // 빈 셀들 (월 시작 전)
    const emptyCells = [];
    for (let i = 0; i < firstDay; i++) {
      emptyCells.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // 날짜 버튼들
    const dateCells = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isToday = isSameDay(date, today);
      const isSelected = isRangeStart(date) || isRangeEnd(date);
      const isInDateRange = isInRange(date);

      dateCells.push(
        <Button
          key={day}
          variant="ghost"
          size="sm"
          className={`
            p-2 h-8 w-8 text-sm relative
            ${isToday ? 'font-bold' : ''}
            ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
            ${isInDateRange && !isSelected ? 'bg-primary/20 hover:bg-primary/30' : ''}
            ${isRangeStart(date) ? 'rounded-r-none' : ''}
            ${isRangeEnd(date) ? 'rounded-l-none' : ''}
          `}
          onClick={() => handleDateClick(date)}
        >
          {day}
        </Button>
      );
    }

    // 모든 셀을 7개씩 그룹화
    const allCells = [...emptyCells, ...dateCells];
    const weeks = [];
    for (let i = 0; i < allCells.length; i += 7) {
      weeks.push(
        <div key={`week-${i}`} className="grid grid-cols-7 gap-1">
          {allCells.slice(i, i + 7)}
        </div>
      );
    }

    days.push(...weeks);
    return days;
  };

  const getPresetRanges = () => [
    {
      label: t('today'),
      range: { startDate: new Date(), endDate: new Date() }
    },
    {
      label: t('yesterday'),
      range: (() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return { startDate: yesterday, endDate: yesterday };
      })()
    },
    {
      label: t('last_n_days', 7),
      range: (() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return { startDate: start, endDate: end };
      })()
    },
    {
      label: t('last_n_days', 30),
      range: (() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return { startDate: start, endDate: end };
      })()
    },
    {
      label: t('this_month'),
      range: (() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startDate: start, endDate: end };
      })()
    }
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start text-left font-normal"
      >
        <Calendar className="mr-2 h-4 w-4" />
        {getDisplayText()}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50">
          <Card className="w-80">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* 프리셋 범위 */}
                <div>
                  <h4 className="text-sm font-medium mb-2">{t('quick_select')}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {getPresetRanges().map((preset) => (
                      <Button
                        key={preset.label}
                        variant="ghost"
                        size="sm"
                        className="text-xs justify-start"
                        onClick={() => setSelectedRange(preset.range)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 달력 헤더 */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="font-medium">
                    {currentMonth.toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* 달력 */}
                <div className="space-y-1">
                  {renderCalendar()}
                </div>

                {/* 선택된 범위 표시 */}
                {(selectedRange.startDate || selectedRange.endDate) && (
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    {t('selected_range')}: {getDisplayText()}
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex justify-between space-x-2 border-t pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                  >
                    {t('reset_filter')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApply}
                    disabled={!selectedRange.startDate}
                  >
                    {t('apply')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}