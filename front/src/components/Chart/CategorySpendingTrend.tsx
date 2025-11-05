import { useMemo } from "react";
import { useSpendingDetailStore } from "../../store/useSpendingDetailStore";
import { useDateStore } from "../../store/useDateStore";
import { DateTime } from "luxon";
import type { Category } from "../../types/types";
import { formatMoney } from "../../utils/utilFns";
import { getLabel } from "../../utils/typeHelpers";

interface CategorySpendingTrendProps {
  selectedCategory: Category;
}
export const CategorySpendingTrend: React.FC<CategorySpendingTrendProps> = ({
  selectedCategory,
}) => {
  const { getSpendingsByMonth } = useSpendingDetailStore();
  const { getYear, getMonth } = useDateStore();
  const year = getYear();
  const month = getMonth();
  const spendings = getSpendingsByMonth(year, month);
  const recentsOffset = DateTime.fromObject({ year, month, day: 1 }).minus({
    month: 6,
  });
  const recentsYearMonths = Array.from({ length: 12 }).map((_x, i) => {
    const offset = recentsOffset.plus({ month: i });
    return {
      year: offset.year,
      month: offset.month,
    };
  });
  const recentData = recentsYearMonths.map(({ year, month }) => {
    return getSpendingsByMonth(year, month);
  });
  const recentSpendingsCategorySum = useMemo(
    () =>
      recentData.map((rD) =>
        rD
          .filter((r) => r.category === selectedCategory)
          .map((r) => r.amount)
          .reduce((a, b) => a + b, 0),
      ),
    [spendings, selectedCategory],
  );
  const recentSpendingsLines = useMemo(
    () =>
      Array.from({ length: 6 }).map((_x, i) => {
        const startY =
          (1 -
            recentSpendingsCategorySum[i] /
              (Math.max(...recentSpendingsCategorySum) * 1.1)) *
          297;
        const startX = (i * 750) / 11;
        const endY =
          (1 -
            recentSpendingsCategorySum[i + 1] /
              (Math.max(...recentSpendingsCategorySum) * 1.1)) *
          297;
        const endX = ((i + 1) * 750) / 11;
        const length = Math.hypot(startX - endX, startY - endY);
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const rad = Math.atan2(deltaY, deltaX);
        return { top: startY, left: startX, length, rad };
      }),
    [recentSpendingsCategorySum],
  );
  const drawPoints = useMemo(
    () =>
      recentSpendingsCategorySum.map((d, i) => (
        <div
          key={i}
          style={{
            top: `${(1 - d / (Math.max(...recentSpendingsCategorySum) * 1.1)) * 297 - 4}px`,
            left: `${(i * 750) / 11 - 4}px`,
          }}
          className="absolute grid bg-black w-[8px] h-[8px] rounded-full"
        ></div>
      )),

    [recentSpendingsCategorySum],
  );
  const drawLines = useMemo(
    () =>
      recentSpendingsLines.map(({ rad, length, top, left }) => (
        <hr
          style={{
            transformOrigin: "top left",
            width: `${length}px`,
            top: `${top}px`,
            left: `${left}px`,
            transform: `rotate(${rad}rad)`,
          }}
          className="absolute"
        />
      )),
    [recentSpendingsLines],
  );
  const drawAmounts = useMemo(
    () =>
      recentSpendingsCategorySum.map((d, i) => (
        <h5
          key={i}
          style={{
            top: `${(1 - d / (Math.max(...recentSpendingsCategorySum) * 1.1)) * 297 - 30}px`,
            left: `${(i * 750) / 11}px`,
          }}
          className="absolute text-sans-light-sm font-light font-sans"
        >
          {formatMoney(false, d)}
        </h5>
      )),
    [recentSpendingsCategorySum],
  );
  const drawMonths = useMemo(
    () =>
      recentsYearMonths.map(({ month }) => (
        <h5 className="grid text-center h-[16px] w-[24px] text-sans-semibold-md font-sans font-semibold">
          {month}
        </h5>
      )),
    [recentsYearMonths],
  );
  return (
    <div className="flex flex-col w-[848px] h-[450px] border-[1px] border-neutral-border-default py-[32px] px-[40px] gap-[9px] bg-neutral-surface-default">
      <h3 className="h-[32px] font-light font-sans text-sans-light-lg">
        {getLabel(selectedCategory)} 카테고리 소비 추이
      </h3>
      <div className="relative grid w-[750px] h-[297px]">
        <div
          className="absolute inset-0 h-full w-full 
    bg-[linear-gradient(to_right,#F1F4F8_1px,transparent_1px),linear-gradient(to_bottom,#F1F4F8_1px,transparent_1px)] 
    bg-[size:4.545%_9.09%]"
        ></div>
        {drawLines}
        {drawPoints}
        {drawAmounts}
      </div>
      <div className="flex flex-row w-[774px] -mx-[12px] justify-between">
        {drawMonths}
      </div>
    </div>
  );
};
